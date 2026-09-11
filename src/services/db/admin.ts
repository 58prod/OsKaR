import { supabase } from '@/lib/supabaseClient';
import type {
  BilanAdmin,
  CandidatureAdmin,
  CompteAdmin,
  FicheCompte,
  StatutCandidature,
  TypeBilanAdmin,
} from '@/lib/admin/types';

/*
 * Administration : tout passe par les fonctions `admin_*` de la migration
 * 20260911_administration. Elles vérifient elles-mêmes que l'appelant est
 * administrateur ; aucune table n'est lue directement.
 */

type Ligne = Record<string, any>;

const date = (v: string | null | undefined) => (v ? new Date(v) : null);
const nombre = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const typeBilan = (v: unknown): TypeBilanAdmin => (v === 'produit' ? 'produit' : 'organisation');

async function appeler<T>(fonction: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as any).rpc(fonction, args);
  if (error) {
    console.error(`❌ ${fonction} :`, error.message);
    throw new Error(error.message);
  }
  return data as T;
}

export function versCompte(r: Ligne): CompteAdmin {
  return {
    id: r.id,
    email: r.email,
    nom: r.nom ?? null,
    entreprise: r.entreprise ?? null,
    activite: r.activite ?? null,
    creeLe: new Date(r.cree_le),
    derniereConnexion: date(r.derniere_connexion),
    plan: r.plan ?? null,
    statut: r.statut ?? null,
    expireLe: date(r.expire_le),
    offerte: !!r.offerte,
    motif: r.motif ?? null,
    stripe: !!r.stripe,
    demo: !!r.demo,
    ateliers: { vision: !!r.vision, fit: !!r.fit, finance: !!r.finance, okr: !!r.okr, team: !!r.team },
    nbBilans: r.nb_bilans ?? 0,
  };
}

export function versBilan(r: Ligne): BilanAdmin {
  return {
    id: r.id,
    creeLe: new Date(r.cree_le),
    email: r.email ?? null,
    type: typeBilan(r.type),
    note: nombre(r.note),
    accepteRecontact: !!r.accepte_recontact,
    aUnCompte: !!r.a_un_compte,
    compteExiste: !!r.compte_existe,
  };
}

export function versCandidature(r: Ligne): CandidatureAdmin {
  return {
    id: r.id,
    prenom: r.prenom,
    nom: r.nom,
    email: r.email,
    zone: r.zone ?? null,
    structure: r.structure ?? null,
    site: r.site ?? null,
    piliers: r.piliers ?? [],
    labelRpr: !!r.label_rpr,
    approche: r.approche ?? null,
    statut: r.statut as StatutCandidature,
    notes: r.notes ?? null,
    creeLe: new Date(r.created_at),
    traiteeLe: date(r.traitee_le),
  };
}

export function versFiche(r: Ligne): FicheCompte {
  return {
    vision: r.vision ?? null,
    fit: r.fit ?? null,
    finance: r.finance ?? null,
    team: r.team ?? null,
    okr: {
      ambitions: Number(r.okr?.ambitions ?? 0),
      objectifs: Number(r.okr?.objectifs ?? 0),
      actions: Number(r.okr?.actions ?? 0),
    },
    bilans: (r.bilans ?? []).map((b: Ligne) => ({
      id: b.id,
      type: typeBilan(b.type),
      creeLe: new Date(b.cree_le),
      note: nombre(b.note),
    })),
  };
}

export class AdminService {
  /** Faux tant que la migration n'est pas passée, ou pour tout compte ordinaire. */
  static async estAdmin(): Promise<boolean> {
    const { data, error } = await (supabase as any).rpc('est_admin');
    return !error && data === true;
  }

  static async comptes(): Promise<CompteAdmin[]> {
    return ((await appeler<Ligne[]>('admin_comptes')) ?? []).map(versCompte);
  }

  static async fiche(userId: string): Promise<FicheCompte | null> {
    const r = await appeler<Ligne | null>('admin_fiche_compte', { p_user_id: userId });
    return r ? versFiche(r) : null;
  }

  static async bilans(): Promise<BilanAdmin[]> {
    return ((await appeler<Ligne[]>('admin_bilans')) ?? []).map(versBilan);
  }

  static async candidatures(): Promise<CandidatureAdmin[]> {
    return ((await appeler<Ligne[]>('admin_candidatures')) ?? []).map(versCandidature);
  }

  static async majCandidature(id: string, statut: StatutCandidature, notes: string): Promise<void> {
    await appeler('admin_maj_candidature', { p_id: id, p_statut: statut, p_notes: notes });
  }

  /** `jusquAu` au format du champ date : 2026-12-31 (dernier jour inclus). */
  static async offrirFormule(userId: string, jusquAu: string, motif: string): Promise<void> {
    await appeler('admin_offrir_formule', { p_user_id: userId, p_jusqu_au: jusquAu, p_motif: motif });
  }

  static async retirerFormule(userId: string): Promise<void> {
    await appeler('admin_retirer_formule', { p_user_id: userId });
  }
}

export default AdminService;
