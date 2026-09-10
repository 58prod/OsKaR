import { supabase } from '@/lib/supabaseClient';
import type { Database, Json } from '@/types/supabase';
import type { AnalysisResult, DiagnosticState } from '@/lib/diagnostic';
import type { ProductFitAnalysis, ProductFitProject } from '@/lib/productFit/types';

type DiagnosticRow = Database['public']['Tables']['diagnostics']['Row'];
type DiagnosticInsert = Database['public']['Tables']['diagnostics']['Insert'];

/*
 * Deux bilans gratuits cohabitent dans la table `diagnostics` : le bilan de
 * maturité (5 piliers) et le bilan Potentiel Produit.
 *
 * Ils se distinguent par une clé `__bilan` posée dans le JSON `responses`.
 * Pourquoi pas une colonne : la base est partagée avec l'application d'Eric,
 * une migration devrait être coordonnée, et le JSONB accepte la clé sans rien
 * changer au schéma. Les enregistrements antérieurs n'ont pas la clé : ils sont
 * donc lus comme des bilans d'organisation, ce qu'ils sont.
 */
export type TypeBilan = 'organisation' | 'produit';

/** Marqueur ajouté dans `responses` pour distinguer les deux bilans. */
const CLE_TYPE = '__bilan';

/** Diagnostic persisté (mapping de la row Supabase vers le domaine) */
export interface DiagnosticRecord {
  id: string;
  userId: string | null;
  email: string | null;
  /** Le type de bilan, déduit du contenu enregistré. */
  type: TypeBilan;
  scores: AnalysisResult;
  responses: DiagnosticState;
  createdAt: Date;
}

/** Bilan Potentiel Produit persisté. */
export interface ProductFitRecord {
  id: string;
  userId: string | null;
  email: string | null;
  type: 'produit';
  analysis: ProductFitAnalysis;
  project: ProductFitProject;
  createdAt: Date;
}

/** Données nécessaires pour enregistrer un diagnostic */
export interface DiagnosticPayload {
  /** Identifiant de l'utilisateur connecté, ou null pour un invité */
  userId: string | null;
  /** Email de l'invité (requis si userId est null) */
  email: string | null;
  /** Résultat structuré de l'analyse */
  scores: AnalysisResult;
  /** État brut du questionnaire (sliders, cases, touched) */
  responses: DiagnosticState;
  /** Type de bilan ; « organisation » par défaut. */
  type?: TypeBilan;
}

/** Type d'un enregistrement, d'après le marqueur posé dans `responses`. */
export function typeDuBilan(responses: unknown): TypeBilan {
  const marqueur = (responses as Record<string, unknown> | null)?.[CLE_TYPE];
  return marqueur === 'produit' ? 'produit' : 'organisation';
}

/**
 * Service de persistance des diagnostics de maturité OSKAR.
 */
export class DiagnosticsService {
  /** Convertir une row Supabase en DiagnosticRecord */
  private static rowToRecord(row: DiagnosticRow): DiagnosticRecord {
    return {
      id: row.id,
      userId: row.user_id,
      email: row.email,
      type: typeDuBilan(row.responses),
      scores: row.scores as unknown as AnalysisResult,
      responses: row.responses as unknown as DiagnosticState,
      createdAt: new Date(row.created_at),
    };
  }

  /**
   * Enregistrer un nouveau diagnostic.
   */
  static async create(payload: DiagnosticPayload): Promise<DiagnosticRecord> {
    // Le user_id doit correspondre à auth.uid() côté serveur (policy RLS).
    // On le dérive de la session live, et non du store (qui peut être périmé) :
    // - session valide  → enregistrement rattaché au compte ;
    // - aucune session   → enregistrement invité (user_id NULL), nécessite un email.
    const { data: { session } } = await supabase.auth.getSession();
    const authUserId = session?.user?.id ?? null;
    const email = payload.email ?? session?.user?.email ?? null;

    if (!authUserId && !email) {
      throw new Error('Un email est requis pour enregistrer un diagnostic invité.');
    }

    const insertData: DiagnosticInsert = {
      user_id: authUserId,
      email,
      scores: payload.scores as unknown as Json,
      responses: {
        ...(payload.responses as unknown as Record<string, unknown>),
        [CLE_TYPE]: payload.type ?? 'organisation',
      } as unknown as Json,
    };

    // Invité : la policy SELECT (user_id = auth.uid()) ne permet pas de relire la ligne
    // (NULL = NULL n'est pas vrai), donc on n'enchaîne pas .select().single() qui échouerait.
    if (!authUserId) {
      const { error } = await supabase.from('diagnostics').insert(insertData);
      if (error) {
        console.error('❌ Erreur lors de l\'enregistrement du diagnostic (invité):', error);
        throw error;
      }
      console.log('✅ Diagnostic invité enregistré');
      return {
        id: '',
        userId: null,
        email,
        type: payload.type ?? 'organisation',
        scores: payload.scores,
        responses: payload.responses,
        createdAt: new Date(),
      };
    }

    const { data, error } = await supabase
      .from('diagnostics')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur lors de l\'enregistrement du diagnostic:', error);
      throw error;
    }

    console.log('✅ Diagnostic enregistré:', data.id);
    return this.rowToRecord(data);
  }

  /**
   * Rattacher au compte connecté les bilans faits sans compte avec la même
   * adresse. Sans cela, un bilan de visiteur reste invisible après inscription :
   * la policy de lecture est `user_id = auth.uid()`, jamais vraie pour NULL.
   *
   * S'appuie sur la fonction SQL `rattacher_bilans_par_email`
   * (migration 20260910). Tant qu'elle n'est pas appliquée, l'appel échoue et
   * l'on continue sans bruit : la liste s'affiche, simplement sans les bilans
   * de visiteur.
   */
  static async rattacherBilansDeMonEmail(): Promise<number> {
    const { data, error } = await (supabase as any).rpc('rattacher_bilans_par_email');
    if (error) {
      console.warn('Rattachement des bilans indisponible :', error.message);
      return 0;
    }
    const nb = typeof data === 'number' ? data : 0;
    if (nb > 0) console.log(`✅ ${nb} bilan(s) rattaché(s) au compte`);
    return nb;
  }

  /**
   * Récupérer les bilans d'un utilisateur (du plus récent au plus ancien).
   * Sans filtre, les deux types sont renvoyés.
   *
   * Les bilans faits sans compte avec la même adresse sont rattachés au passage.
   */
  static async getByUser(userId: string, type?: TypeBilan): Promise<DiagnosticRecord[]> {
    await this.rattacherBilansDeMonEmail();

    const { data, error } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ Erreur lors de la récupération des diagnostics:', error);
      throw error;
    }

    const tous: DiagnosticRecord[] = (data || []).map((row: DiagnosticRow) => this.rowToRecord(row));
    return type ? tous.filter((r) => r.type === type) : tous;
  }

  /**
   * Récupérer un bilan par son identifiant (pour le rouvrir dans l'outil).
   */
  static async getById(id: string): Promise<DiagnosticRecord | null> {
    const { data, error } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('❌ Erreur lors de la récupération du bilan:', error);
      throw error;
    }
    return data ? this.rowToRecord(data) : null;
  }

  /**
   * Récupérer le dernier diagnostic d'un utilisateur, ou null s'il n'en a aucun.
   */
  static async getLatestByUser(userId: string): Promise<DiagnosticRecord | null> {
    const { data, error } = await supabase
      .from('diagnostics')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('❌ Erreur lors de la récupération du dernier diagnostic:', error);
      throw error;
    }

    return data ? this.rowToRecord(data) : null;
  }

  /**
   * Récupérer le dernier diagnostic associé à un email (restauration invité, sans compte).
   * Passe par la fonction SQL `get_latest_diagnostic_by_email` (SECURITY DEFINER) car la
   * policy SELECT (user_id = auth.uid()) interdit toute lecture anonyme directe.
   */
  static async getLatestByEmail(email: string): Promise<DiagnosticRecord | null> {
    const { data, error } = await (supabase as any).rpc('get_latest_diagnostic_by_email', {
      p_email: email,
    });

    if (error) {
      console.error('❌ Erreur lors de la restauration du bilan par email:', error);
      throw error;
    }

    const row = (Array.isArray(data) ? data[0] : data) as DiagnosticRow | undefined;
    if (!row) return null;
    const record = this.rowToRecord(row);
    // La fonction SQL renvoie le dernier bilan de cet email, quel qu'il soit :
    // on écarte un bilan produit, dont la structure n'a rien à voir.
    return record.type === 'organisation' ? record : null;
  }

  /**
   * Supprimer un diagnostic.
   */
  static async delete(diagnosticId: string): Promise<void> {
    const { error } = await supabase
      .from('diagnostics')
      .delete()
      .eq('id', diagnosticId);

    if (error) {
      console.error('❌ Erreur lors de la suppression du diagnostic:', error);
      throw error;
    }

    console.log('✅ Diagnostic supprimé:', diagnosticId);
  }
}
