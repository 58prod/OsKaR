import type { EmailOtpType } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import type { User } from '@/types';

export interface SignUpData {
  email: string;
  password: string;
  name?: string;
  company?: string;
  role?: string;
}

export interface SignInData {
  email: string;
  password: string;
}

export interface ResetPasswordData {
  email: string;
}

export interface UpdatePasswordData {
  password: string;
}

/**
 * Service d'authentification avec Supabase
 */
export class AuthService {
  /**
   * Inscription d'un nouvel utilisateur
   */
  static async signUp(data: SignUpData) {
    const { email, password, name, company, role } = data;

    // 1. Créer l'utilisateur dans auth.users
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: name || email.split('@')[0],
          company,
          role,
        },
      },
    });

    if (authError) {
      console.error('❌ Erreur lors de l\'inscription:', authError);
      throw authError;
    }

    if (!authData.user) {
      throw new Error('Aucun utilisateur créé');
    }

    // Confirmation par email exigée par Supabase : pas de session, donc aucune
    // lecture/écriture possible sous RLS. Le trigger handle_new_user() a créé le
    // profil côté base ; l'appelant affiche « vérifiez votre boîte mail ».
    if (!authData.session) {
      return { user: authData.user, profile: null, session: null };
    }

    // 2. Le profil est normalement créé automatiquement via le trigger handle_new_user()
    // Attendre un peu pour que le trigger s'exécute
    await new Promise(resolve => setTimeout(resolve, 1000));

    // 3. Vérifier si le profil a été créé
    let { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    // 4. Si le profil n'existe pas (trigger a échoué), le créer manuellement
    if (profileError || !profile) {
      console.warn('⚠️ Le trigger n\'a pas créé le profil, création manuelle...');

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: authData.user.email!,
          name: name || email.split('@')[0],
          company,
          role,
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Erreur lors de la création manuelle du profil:', createError);
        // Ne pas bloquer l'inscription, le profil pourra être créé plus tard
      } else {
        profile = newProfile;
        console.log('✅ Profil créé manuellement');
      }
    }

    // 5. Vérifier si l'abonnement a été créé
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    // 6. Si l'abonnement n'existe pas, le créer manuellement
    if (subError || !subscription) {
      console.warn('⚠️ Le trigger n\'a pas créé l\'abonnement, création manuelle...');

      const { error: createSubError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: authData.user.id,
          plan_type: 'free',
          status: 'active',
        });

      if (createSubError && createSubError.code !== '23505') {
        console.error('❌ Erreur lors de la création manuelle de l\'abonnement:', createSubError);
      } else {
        console.log('✅ Abonnement créé manuellement');
      }
    }

    return {
      user: authData.user,
      profile,
      session: authData.session,
    };
  }

  /**
   * Connexion d'un utilisateur existant
   */
  static async signIn(data: SignInData) {
    const { email, password } = data;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      console.warn('⚠️ Erreur lors de la connexion (retournée sans throw):', authError);
      return { error: authError } as any;
    }

    // Récupérer le profil complet avec retry (la table profiles peut être lente au cold start)
    if (authData.user) {
      let profile = null;
      const MAX_RETRIES = 2;

      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authData.user.id)
          .single();

        if (!profileError && profileData) {
          profile = profileData;
          break;
        }

        if (attempt < MAX_RETRIES) {
          console.warn(`⚠️ Profil introuvable (tentative ${attempt + 1}/${MAX_RETRIES + 1}), retry dans 1s…`);
          await new Promise(resolve => setTimeout(resolve, 1000));
        } else {
          console.error('❌ Impossible de récupérer le profil après plusieurs tentatives:', profileError);
        }
      }

      return {
        user: authData.user,
        profile,
        session: authData.session,
      };
    }

    console.warn('[AuthService.signIn] Pas de user dans authData');
    return authData;
  }

  /**
   * Déconnexion - ne throw jamais pour permettre la déconnexion locale
   */
  static async signOut() {
    try {
      await supabase.auth.signOut();
    } catch (error: any) {
      console.warn('⚠️ Erreur déconnexion Supabase (ignorée):', error.message);
    }
  }

  /**
   * Récupérer la session courante
   */
  static async getSession() {
    // Ne pas appeler Supabase Auth côté serveur (pendant le build statique)
    if (typeof window === 'undefined') {
      return null;
    }

    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error('Erreur lors de la récupération de la session:', error);
      return null;
    }
    return session;
  }

  /**
   * Récupérer l'utilisateur courant
   */
  static async getCurrentUser() {
    try {
      // Vérifier d'abord s'il y a une session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        return null;
      }

      // Récupérer l'utilisateur
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('Erreur lors de la récupération de l\'utilisateur:', error);
        return null;
      }

      if (!user) return null;

      // Récupérer le profil complet
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError) {
        console.error('Erreur lors de la récupération du profil:', profileError);
        return null;
      }

      return {
        user,
        profile,
      };
    } catch (error: any) {
      // Gérer l'erreur "Auth session missing" silencieusement
      if (error.message?.includes('Auth session missing')) {
        return null;
      }
      console.error('Erreur lors de la récupération de l\'utilisateur:', error);
      return null;
    }
  }

  /**
   * Récupérer le profil à partir d'un user déjà connu (pas d'appel réseau getUser()).
   * Utilisé par onAuthStateChange qui fournit déjà session.user.
   */
  static async fetchProfileForUser(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return null;
      }

      return { profile };
    } catch (error: any) {
      console.error('Erreur fetchProfileForUser:', error);
      return null;
    }
  }

  /**
   * Demander un reset de mot de passe
   */
  static async resetPassword(data: ResetPasswordData) {
    const { email } = data;

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });

    if (error) {
      console.error('Erreur lors de la demande de reset:', error);
      throw error;
    }
  }

  /**
   * Valider un lien reçu par email (jeton `token_hash` des modèles Supabase) :
   * ouvre la session correspondante, par exemple celle de récupération.
   */
  static async verifierLienEmail(tokenHash: string, type: EmailOtpType) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });

    if (error) {
      // Lien expiré ou déjà utilisé : cas normal, affiché à la personne, pas un bug.
      console.warn('Lien email refusé :', error.message);
      throw error;
    }
  }

  /**
   * Mettre à jour le mot de passe
   */
  static async updatePassword(data: UpdatePasswordData) {
    const { password } = data;

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      console.error('Erreur lors de la mise à jour du mot de passe:', error);
      throw error;
    }
  }

  /**
   * Connexion avec Google OAuth
   */
  static async signInWithGoogle() {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      console.error('Erreur lors de la connexion Google:', error);
      throw error;
    }
  }

  /**
   * Écouter les changements d'état d'authentification
   */
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }

  /**
   * Mettre à jour le profil d'entreprise
   */
  static async updateCompanyProfile(userId: string, companyProfile: any) {
    const { data, error } = await (supabase as any)
      .from('profiles')
      .update({ company_profile: companyProfile })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur mise à jour profil entreprise:', error.message);
      throw error;
    }

    if (!data) {
      throw new Error('Aucune donnée retournée lors de la mise à jour du profil');
    }

    return data;
  }

  /**
   * Mettre à jour le profil utilisateur (nom, entreprise, rôle, etc.)
   */
  static async updateProfile(userId: string, updates: {
    name?: string;
    company?: string;
    role?: string;
    avatar_url?: string;
    settings?: any;
  }) {
    const result = await (supabase as any)
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    const { data, error } = result;

    if (error) {
      console.error('Erreur lors de la mise à jour du profil:', error);
      throw error;
    }

    return data;
  }

  /**
   * Convertir un profil Supabase en User de l'app
   */
  static authUserToUser(authUser: any): User {
    const email = authUser?.email || '';
    const metadata = authUser?.user_metadata || {};

    return {
      id: authUser.id,
      email,
      name: metadata.name || email.split('@')[0] || 'Utilisateur',
      company: metadata.company,
      role: metadata.role,
      createdAt: authUser?.created_at ? new Date(authUser.created_at) : new Date(),
      lastLoginAt: new Date(),
      companyProfile: metadata.company_profile,
      settings: (metadata.settings as any) ?? {},
    };
  }

  /**
   * Convertir un profil Supabase en User de l'app
   */
  static profileToUser(profile: any): User {
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name || profile.email.split('@')[0],
      company: profile.company,
      role: profile.role,
      createdAt: new Date(profile.created_at),
      lastLoginAt: new Date(),
      companyProfile: profile.company_profile,
      settings: profile.settings ?? {},
    };
  }
}

