import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { supabase } from '@/lib/supabaseClient';
import { AuthService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import type { OngletAuth } from '@/store/useConnexion';
import { GOOGLE_AUTH_ENABLED } from '@/constants';
import {
  identifiantValide,
  identifiantVersEmail,
  messageConnexion,
  messageInscription,
  messageReinitialisation,
} from '@/lib/authFlux';
import { CLS, Carte, EnTeteCarte, MessageErreur, MessageInfo } from '@/components/auth/CarteAuth';

/*
 * Formulaire d'authentification unique : connexion, inscription et mot de
 * passe oublié. Utilisé par la fenêtre de connexion (`AuthModal`) et par les
 * pages /auth/login, /auth/register et /auth/forgot-password.
 *
 * Champs de l'inscription : ceux de la fenêtre des maquettes (prénom, nom,
 * email professionnel, organisation, mot de passe).
 */

const connexionSchema = z.object({
  // Une adresse email, ou l'identifiant d'un compte de démonstration (« oskar »).
  email: z.string().refine(identifiantValide, 'Email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
});
type ConnexionForm = z.infer<typeof connexionSchema>;

const inscriptionSchema = z.object({
  firstName: z.string().min(1, 'Prénom requis'),
  lastName: z.string().min(1, 'Nom requis'),
  email: z.string().email('Email invalide'),
  company: z.string().min(1, 'Organisation requise'),
  password: z.string().min(6, 'Au moins 6 caractères'),
});
type InscriptionForm = z.infer<typeof inscriptionSchema>;

const oubliSchema = z.object({ email: z.string().email('Email invalide') });
type OubliForm = z.infer<typeof oubliSchema>;

const TITRES: Record<OngletAuth, { titre: string; sousTitre: string }> = {
  login: { titre: 'Bon retour !', sousTitre: 'Connectez-vous à votre espace Oskar' },
  register: { titre: 'Rejoignez Oskar', sousTitre: 'Créez votre compte gratuit pour accéder à la plateforme' },
  oubli: { titre: 'Mot de passe oublié', sousTitre: 'Recevez un lien pour en choisir un nouveau' },
};

interface FormulaireAuthProps {
  ongletInitial: OngletAuth;
  /** Page où aller une fois connecté. */
  destination: string;
  /** Faux sur les pages /auth/*, qui redirigent elles-mêmes dès que la session existe. */
  naviguer?: boolean;
  /** Fenêtre seulement : fermeture. */
  onFermer?: () => void;
  /** Message affiché d'emblée (ex. session expirée). */
  erreurInitiale?: string | null;
  titreId?: string;
}

export const FormulaireAuth: React.FC<FormulaireAuthProps> = ({
  ongletInitial,
  destination,
  naviguer = true,
  onFermer,
  erreurInitiale = null,
  titreId,
}) => {
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const [onglet, setOnglet] = useState<OngletAuth>(ongletInitial);
  const [erreur, setErreur] = useState<string | null>(erreurInitiale);
  const [info, setInfo] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);
  const [connecte, setConnecte] = useState(false);
  const [emailEnvoye, setEmailEnvoye] = useState(false);

  const connexion = useForm<ConnexionForm>({ resolver: zodResolver(connexionSchema) });
  const inscription = useForm<InscriptionForm>({ resolver: zodResolver(inscriptionSchema) });
  const oubli = useForm<OubliForm>({ resolver: zodResolver(oubliSchema) });

  // Le paramètre ?error= d'une page n'est connu qu'une fois le routeur prêt.
  useEffect(() => {
    if (erreurInitiale) setErreur(erreurInitiale);
  }, [erreurInitiale]);

  // Une fois connecté, on attend que l'app ait pris la session en compte avant
  // de changer de page : une page protégée renverrait sinon vers la connexion.
  useEffect(() => {
    if (!connecte || !naviguer) return;
    const partir = () => {
      onFermer?.();
      router.push(destination);
    };
    if (isAuthenticated) {
      partir();
      return;
    }
    const secours = setTimeout(partir, 4000);
    return () => clearTimeout(secours);
  }, [connecte, naviguer, isAuthenticated, onFermer, router, destination]);

  const changerOnglet = (suivant: OngletAuth) => {
    // L'adresse déjà saisie suit la personne vers « mot de passe oublié ».
    if (suivant === 'oubli') {
      const saisie = connexion.getValues('email') ?? '';
      if (saisie.includes('@')) oubli.setValue('email', saisie.trim());
    }
    setOnglet(suivant);
    setErreur(null);
    setInfo(null);
    setEmailEnvoye(false);
  };

  const seConnecter = async (d: ConnexionForm) => {
    setChargement(true);
    setErreur(null);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: identifiantVersEmail(d.email),
        password: d.password,
      });
      if (error) {
        setErreur(messageConnexion(error.message));
        setChargement(false);
        return;
      }
      // Le bouton reste en « Connexion… » pendant le changement de page.
      setConnecte(true);
    } catch (err: any) {
      setErreur(messageConnexion(err?.message));
      setChargement(false);
    }
  };

  const sInscrire = async (d: InscriptionForm) => {
    setChargement(true);
    setErreur(null);
    try {
      const resultat = await AuthService.signUp({
        email: d.email,
        password: d.password,
        name: `${d.firstName} ${d.lastName}`.trim(),
        company: d.company,
      });
      if (!resultat.session) {
        // Confirmation par email exigée : on reste ici avec la consigne.
        setOnglet('login');
        setInfo('Compte créé ! Vérifiez votre boîte mail pour confirmer votre adresse, puis connectez-vous.');
        setChargement(false);
        return;
      }
      // Prévient l'équipe du nouveau compte. `keepalive` : l'appel survit au
      // changement de page qui suit ; un échec ne gêne pas l'inscription.
      fetch('/api/notifier-inscription', {
        method: 'POST',
        keepalive: true,
        headers: { Authorization: `Bearer ${resultat.session.access_token}` },
      }).catch(() => {});
      setConnecte(true);
    } catch (err: any) {
      setErreur(messageInscription(err?.message));
      setChargement(false);
    }
  };

  const demanderLien = async (d: OubliForm) => {
    setChargement(true);
    setErreur(null);
    try {
      await AuthService.resetPassword({ email: d.email.trim() });
      setEmailEnvoye(true);
    } catch (err: any) {
      setErreur(messageReinitialisation(err?.message));
    } finally {
      setChargement(false);
    }
  };

  const connexionGoogle = async () => {
    try {
      await AuthService.signInWithGoogle();
    } catch (err: any) {
      setErreur(messageConnexion(err?.message));
    }
  };

  const { titre, sousTitre } = TITRES[onglet];

  return (
    <Carte>
      <EnTeteCarte titre={titre} sousTitre={sousTitre} onFermer={onFermer} titreId={titreId} />

      {onglet !== 'oubli' && (
        <div role="tablist" aria-label="Authentification" className="flex border-b border-line">
          {(['register', 'login'] as const).map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={onglet === t}
              type="button"
              onClick={() => changerOnglet(t)}
              className={`flex-1 py-3 text-[13.5px] font-semibold transition-colors ${
                onglet === t ? 'text-navy border-b-2 border-teal' : 'text-muted border-b-2 border-transparent hover:text-navy'
              }`}
            >
              {t === 'register' ? 'Inscription' : 'Connexion'}
            </button>
          ))}
        </div>
      )}

      <div className="p-7">
        {erreur && <MessageErreur>{erreur}</MessageErreur>}
        {info && <MessageInfo>{info}</MessageInfo>}

        {onglet === 'login' && (
          <form onSubmit={connexion.handleSubmit(seConnecter)} className="space-y-4" noValidate>
            <Champ id="auth-login-email" libelle="Email" erreur={connexion.formState.errors.email?.message}>
              <input
                id="auth-login-email"
                type="text"
                inputMode="email"
                autoComplete="username"
                placeholder="vous@entreprise.fr"
                className={CLS.champ}
                aria-invalid={!!connexion.formState.errors.email}
                {...connexion.register('email')}
              />
            </Champ>
            <Champ id="auth-login-pwd" libelle="Mot de passe" erreur={connexion.formState.errors.password?.message}>
              <input
                id="auth-login-pwd"
                type="password"
                autoComplete="current-password"
                placeholder="••••••••"
                className={CLS.champ}
                aria-invalid={!!connexion.formState.errors.password}
                {...connexion.register('password')}
              />
            </Champ>
            <button type="submit" disabled={chargement} className={CLS.bouton}>
              {chargement && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {chargement ? 'Connexion…' : 'Se connecter →'}
            </button>
            {GOOGLE_AUTH_ENABLED && (
              <button
                type="button"
                onClick={connexionGoogle}
                className="w-full inline-flex items-center justify-center px-4 py-2.5 rounded-lg border border-line text-sm font-semibold text-navy hover:border-navy transition-colors"
              >
                Continuer avec Google
              </button>
            )}
            <p className={CLS.note}>
              Pas encore de compte ?{' '}
              <button type="button" onClick={() => changerOnglet('register')} className={CLS.lien}>
                Inscrivez-vous gratuitement
              </button>
            </p>
            {/* Placé comme sur la maquette : sous la note, centré, 14px gris. */}
            <p className="text-center mt-2.5">
              <button
                type="button"
                onClick={() => changerOnglet('oubli')}
                className="text-14 text-muted hover:text-navy transition-colors"
              >
                Mot de passe oublié ?
              </button>
            </p>
          </form>
        )}

        {onglet === 'register' && (
          <form onSubmit={inscription.handleSubmit(sInscrire)} className="space-y-4" noValidate>
            <div className="grid grid-cols-2 gap-3">
              <Champ id="auth-reg-first" libelle="Prénom" erreur={inscription.formState.errors.firstName?.message}>
                <input
                  id="auth-reg-first"
                  autoComplete="given-name"
                  placeholder="Sophie"
                  className={CLS.champ}
                  aria-invalid={!!inscription.formState.errors.firstName}
                  {...inscription.register('firstName')}
                />
              </Champ>
              <Champ id="auth-reg-last" libelle="Nom" erreur={inscription.formState.errors.lastName?.message}>
                <input
                  id="auth-reg-last"
                  autoComplete="family-name"
                  placeholder="Martin"
                  className={CLS.champ}
                  aria-invalid={!!inscription.formState.errors.lastName}
                  {...inscription.register('lastName')}
                />
              </Champ>
            </div>
            <Champ id="auth-reg-email" libelle="Email professionnel" erreur={inscription.formState.errors.email?.message}>
              <input
                id="auth-reg-email"
                type="email"
                autoComplete="email"
                placeholder="sophie@entreprise.fr"
                className={CLS.champ}
                aria-invalid={!!inscription.formState.errors.email}
                {...inscription.register('email')}
              />
            </Champ>
            <Champ id="auth-reg-company" libelle="Organisation" erreur={inscription.formState.errors.company?.message}>
              <input
                id="auth-reg-company"
                autoComplete="organization"
                placeholder="Ma Startup / PME / Cabinet…"
                className={CLS.champ}
                aria-invalid={!!inscription.formState.errors.company}
                {...inscription.register('company')}
              />
            </Champ>
            <Champ id="auth-reg-pwd" libelle="Mot de passe" erreur={inscription.formState.errors.password?.message}>
              <input
                id="auth-reg-pwd"
                type="password"
                autoComplete="new-password"
                placeholder="6 caractères min."
                className={CLS.champ}
                aria-invalid={!!inscription.formState.errors.password}
                {...inscription.register('password')}
              />
            </Champ>
            <button type="submit" disabled={chargement} className={CLS.bouton}>
              {chargement && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {chargement ? 'Création…' : 'Créer mon compte →'}
            </button>
            <p className={CLS.note}>
              Déjà inscrit ?{' '}
              <button type="button" onClick={() => changerOnglet('login')} className={CLS.lien}>
                Connectez-vous
              </button>
            </p>
          </form>
        )}

        {onglet === 'oubli' &&
          (emailEnvoye ? (
            <div className="space-y-4">
              <MessageInfo>
                Email envoyé ! Ouvrez-le et suivez le lien pour choisir un nouveau mot de passe. Pensez à regarder
                dans vos courriers indésirables.
              </MessageInfo>
              <p className={CLS.note}>
                <button type="button" onClick={() => changerOnglet('login')} className={CLS.lien}>
                  ← Retour à la connexion
                </button>
              </p>
            </div>
          ) : (
            <form onSubmit={oubli.handleSubmit(demanderLien)} className="space-y-4" noValidate>
              <Champ id="auth-oubli-email" libelle="Email" erreur={oubli.formState.errors.email?.message}>
                <input
                  id="auth-oubli-email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.fr"
                  className={CLS.champ}
                  aria-invalid={!!oubli.formState.errors.email}
                  {...oubli.register('email')}
                />
              </Champ>
              <button type="submit" disabled={chargement} className={CLS.bouton}>
                {chargement && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {chargement ? 'Envoi…' : 'Recevoir le lien →'}
              </button>
              <p className={CLS.note}>
                <button type="button" onClick={() => changerOnglet('login')} className={CLS.lien}>
                  ← Retour à la connexion
                </button>
              </p>
            </form>
          ))}
      </div>
    </Carte>
  );
};

/** Libellé, champ et message d'erreur. */
const Champ: React.FC<{ id: string; libelle: string; erreur?: string; children: React.ReactNode }> = ({
  id,
  libelle,
  erreur,
  children,
}) => (
  <div>
    <label htmlFor={id} className={CLS.intitule}>
      {libelle}
    </label>
    {children}
    {erreur && <p className={CLS.erreur}>{erreur}</p>}
  </div>
);

export default FormulaireAuth;
