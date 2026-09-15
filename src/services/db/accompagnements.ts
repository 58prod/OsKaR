import { supabase } from '@/lib/supabaseClient';
import { ficheNettoyee, type FicheCoach } from '@/lib/accompagnement/fiche';
import { APRES_CONNEXION, ESPACE_COACH } from '@/lib/authFlux';
import type {
  Accompagnement,
  ActiviteJour,
  ActivitePiliers,
  FicheDirigeant,
  ProfilCoach,
  ResumeCoach,
} from '@/lib/accompagnement/types';

/*
 * Accompagnement coach ↔ dirigeant : tout passe par les fonctions de la
 * migration 20260915_accompagnements. Elles vérifient elles-mêmes le lien ;
 * aucune table n'est lue directement.
 */

type Ligne = Record<string, any>;

const date = (v: unknown) => (typeof v === 'string' && v ? new Date(v) : null);
const nombre = (v: unknown) => (v == null || v === '' || Number.isNaN(Number(v)) ? null : Number(v));
const texte = (v: unknown) => (typeof v === 'string' && v.trim() ? v : null);

async function appeler<T>(fonction: string, args?: Record<string, unknown>): Promise<T> {
  const { data, error } = await (supabase as any).rpc(fonction, args);
  if (error) {
    console.error(`❌ ${fonction} :`, error.message);
    throw new Error(error.message);
  }
  return data as T;
}

export function versActivite(j: Ligne | null | undefined): ActivitePiliers | null {
  if (!j) return null;
  return {
    vision: date(j.vision),
    fit: date(j.fit),
    finance: date(j.finance),
    okr: date(j.okr),
    team: date(j.team),
    bilans: date(j.bilans),
  };
}

export function versAccompagnement(r: Ligne): Accompagnement {
  return {
    id: r.id,
    role: r.role === 'coach' ? 'coach' : 'dirigeant',
    statut: r.statut === 'actif' ? 'actif' : 'en_attente',
    initiePar: r.initie_par === 'coach' ? 'coach' : 'dirigeant',
    aMoiDeRepondre: !!r.a_moi_de_repondre,
    autre: {
      id: r.autre_id ?? null,
      nom: texte(r.autre_nom),
      email: r.autre_email ?? '',
      entreprise: texte(r.autre_entreprise),
      activite: texte(r.autre_activite),
      structure: texte(r.autre_structure),
    },
    resumeQuotidien: r.resume_quotidien !== false,
    coachVuLe: date(r.coach_vu_le),
    creeLe: new Date(r.cree_le),
    reponduLe: date(r.repondu_le),
    activite: versActivite(r.activite),
  };
}

export function versProfilCoach(r: Ligne | null): ProfilCoach | null {
  if (!r) return null;
  return {
    disponible: r.disponible !== false,
    resumeQuotidien: r.resume_quotidien !== false,
    structure: texte(r.structure),
    siret: texte(r.siret),
    site: texte(r.site),
    zone: texte(r.zone),
    piliers: Array.isArray(r.piliers) ? r.piliers : [],
    approche: texte(r.approche),
    referenceLe: new Date(r.reference_le),
  };
}

export function versFicheDirigeant(r: Ligne): FicheDirigeant {
  const okr = r.okr ?? {};
  return {
    accompagnementId: r.accompagnement_id,
    depuis: new Date(r.depuis),
    vuPrecedemment: date(r.vu_precedemment),
    resumeQuotidien: r.resume_quotidien !== false,
    profil: {
      nom: texte(r.profil?.nom),
      email: r.profil?.email ?? '',
      entreprise: texte(r.profil?.entreprise),
      activite: texte(r.profil?.activite),
    },
    activite: versActivite(r.activite) ?? { vision: null, fit: null, finance: null, okr: null, team: null, bilans: null },
    vision: r.vision ?? null,
    fit: r.fit ?? null,
    finance: r.finance ?? null,
    team: r.team ?? null,
    okr: {
      ambitions: (okr.ambitions ?? []).map((a: Ligne) => ({
        id: a.id,
        titre: a.titre ?? '',
        description: texte(a.description),
        annee: Number(a.annee),
        cible: nombre(a.cible),
        unite: texte(a.unite),
      })),
      objectifs: (okr.objectifs ?? []).map((o: Ligne) => ({
        id: o.id,
        ambitionId: o.ambition_id ?? null,
        titre: o.titre ?? '',
        description: texte(o.description),
        trimestre: o.trimestre ?? '',
        annee: Number(o.annee),
      })),
      resultats: (okr.resultats ?? []).map((k: Ligne) => ({
        id: k.id,
        objectifId: k.objectif_id,
        titre: k.titre ?? '',
        cible: nombre(k.cible),
        actuel: nombre(k.actuel),
        unite: texte(k.unite),
        echeance: date(k.echeance),
      })),
      actions: (okr.actions ?? []).map((a: Ligne) => ({
        id: a.id,
        resultatId: a.resultat_id ?? null,
        titre: a.titre ?? '',
        statut: a.statut ?? 'TODO',
        echeance: date(a.echeance),
      })),
    },
    bilans: (r.bilans ?? []).map((b: Ligne) => ({
      id: b.id,
      type: b.type === 'produit' ? 'produit' : 'organisation',
      creeLe: new Date(b.cree_le),
      note: nombre(b.note),
    })),
  };
}

function versActiviteJour(j: Ligne | null | undefined): ActiviteJour {
  return {
    vision: j?.vision === true,
    fit: j?.fit === true,
    finance: j?.finance === true,
    team: j?.team === true,
    okr: Number(j?.okr ?? 0),
    bilans: Number(j?.bilans ?? 0),
  };
}

/** Une ligne de `resume_coachs`, pour la route du résumé de 8 h. */
export function versResume(r: Ligne): ResumeCoach {
  return {
    coachId: r.coach_id,
    coachEmail: r.coach_email,
    coachNom: texte(r.coach_nom),
    dirigeants: (r.dirigeants ?? []).map((d: Ligne) => ({
      id: d.id,
      nom: texte(d.nom),
      email: d.email ?? '',
      entreprise: texte(d.entreprise),
      activite: versActiviteJour(d.activite),
    })),
  };
}

export class AccompagnementsService {
  /** Null pour un compte qui n'est pas coach référencé, ou avant la migration. */
  static async profilCoach(): Promise<ProfilCoach | null> {
    const { data, error } = await (supabase as any).rpc('mon_profil_coach');
    return error ? null : versProfilCoach(data);
  }

  /**
   * La page où arriver après connexion : l'espace coach pour un coach
   * référencé, sauf si la personne allait ailleurs (page protégée demandée).
   */
  static async arrivee(destination: string): Promise<string> {
    if (destination !== APRES_CONNEXION) return destination;
    return (await AccompagnementsService.profilCoach()) ? ESPACE_COACH : destination;
  }

  static async liste(): Promise<Accompagnement[]> {
    return ((await appeler<Ligne[]>('mes_accompagnements')) ?? []).map(versAccompagnement);
  }

  /** Null sans lien actif avec ce dirigeant. Note la visite du coach. */
  static async fiche(dirigeantId: string): Promise<FicheDirigeant | null> {
    const r = await appeler<Ligne | null>('coach_fiche_dirigeant', { p_dirigeant: dirigeantId });
    return r ? versFicheDirigeant(r) : null;
  }

  static async inviterCoach(email: string): Promise<string> {
    return appeler<string>('inviter_coach', { p_email: email.trim() });
  }

  static async inviterDirigeant(email: string): Promise<{ id: string; aUnCompte: boolean }> {
    const r = await appeler<Ligne>('inviter_dirigeant', { p_email: email.trim() });
    return { id: r.id, aUnCompte: !!r.a_un_compte };
  }

  static async repondre(id: string, accepte: boolean): Promise<void> {
    await appeler('repondre_accompagnement', { p_id: id, p_accepte: accepte });
  }

  static async terminer(id: string): Promise<void> {
    await appeler('terminer_accompagnement', { p_id: id });
  }

  static async majReglages(r: { disponible?: boolean; resumeQuotidien?: boolean }): Promise<void> {
    await appeler('coach_maj_reglages', {
      p_disponible: r.disponible ?? null,
      p_resume_quotidien: r.resumeQuotidien ?? null,
    });
  }

  /** Migration 20260915_fiche_coach : structure et fiche d'annuaire. */
  static async majFiche(f: FicheCoach): Promise<void> {
    const n = ficheNettoyee(f);
    await appeler('coach_maj_fiche', {
      p_structure: n.structure,
      p_siret: n.siret,
      p_site: n.site,
      p_zone: n.zone,
      p_piliers: n.piliers,
      p_approche: n.approche,
    });
  }

  static async majResumeDirigeant(id: string, resume: boolean): Promise<void> {
    await appeler('coach_maj_resume_dirigeant', { p_id: id, p_resume: resume });
  }

  /**
   * Prévient la personne invitée par email. Faux si l'email n'a pas pu
   * partir : l'invitation existe quand même, elle la verra en se connectant.
   */
  static async prevenir(id: string): Promise<boolean> {
    try {
      const { data } = await supabase.auth.getSession();
      const jeton = data.session?.access_token;
      if (!jeton) return false;
      const res = await fetch('/api/notifier-accompagnement/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${jeton}` },
        body: JSON.stringify({ id }),
      });
      return res.ok;
    } catch {
      return false;
    }
  }
}

export default AccompagnementsService;
