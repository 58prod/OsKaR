import type { NiveauAcces } from '@/lib/acces';
import type { Accompagnement, ActivitePiliers, Correspondant, SujetSuivi } from './types';

/*
 * Règles de l'accompagnement, posées par Christophe le 2026-09-15 :
 *   - seuls les coachs référencés peuvent être reliés à un dirigeant ;
 *   - transparence totale, annoncée au départ : le coach voit tout ;
 *   - le coach reçoit chaque matin à 8 h le résumé de la veille ;
 *   - pour l'instant, l'accompagnement fait partie de la formule Dirigeant,
 *     et il est gratuit pour le coach.
 */

/** Relier un coach demande la formule payante (côté dirigeant seulement). */
export const ACCOMPAGNEMENT_RESERVE_ABONNES = true;

export function peutEtreAccompagne(niveau: NiveauAcces): boolean {
  if (niveau === 'visiteur') return false;
  return !ACCOMPAGNEMENT_RESERVE_ABONNES || niveau === 'abonne';
}

/** Ce que le dirigeant accepte, mot pour mot, en invitant ou en acceptant un coach. */
export const ENGAGEMENT_TRANSPARENCE =
  'J’ai compris que ce coach verra tout ce que je saisis dans Oskar (ateliers, OKR, bilans) et recevra chaque matin un résumé de mes modifications de la veille.';

/** Même contrôle que la base (fonction inviter_dirigeant). */
export function emailValide(email: string): boolean {
  const e = email.trim();
  return e.length <= 254 && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e);
}

export function nomDe(c: Pick<Correspondant, 'nom' | 'email'>): string {
  return c.nom?.trim() || c.email;
}

/** Les sujets suivis, dans l'ordre des pastilles. */
export const SUJETS_SUIVIS: { id: SujetSuivi; nom: string }[] = [
  { id: 'vision', nom: 'Vision' },
  { id: 'fit', nom: 'Market Fit' },
  { id: 'finance', nom: 'Finance' },
  { id: 'okr', nom: 'OKR' },
  { id: 'team', nom: 'Team' },
  { id: 'bilans', nom: 'Bilans' },
];

/** La dernière chose faite par le dirigeant, tous sujets confondus. */
export function derniereActivite(activite: ActivitePiliers | null): Date | null {
  if (!activite) return null;
  const dates = Object.values(activite).filter((d): d is Date => d instanceof Date);
  return dates.length ? new Date(Math.max(...dates.map((d) => d.getTime()))) : null;
}

/**
 * Ce qui a bougé depuis la dernière visite du coach. Jamais venu : tout ce
 * qui a été commencé est nouveau pour lui.
 */
export function sujetsNouveaux(activite: ActivitePiliers | null, vuLe: Date | null): SujetSuivi[] {
  if (!activite) return [];
  return SUJETS_SUIVIS.map((s) => s.id).filter((id) => {
    const d = activite[id];
    return d != null && (vuLe == null || d.getTime() > vuLe.getTime());
  });
}

/** Les liens d'un rôle, rangés comme les écrans les affichent. */
export function rangerAccompagnements(liste: Accompagnement[], role: Accompagnement['role']) {
  const miens = liste.filter((a) => a.role === role);
  return {
    /** Invitations reçues, à accepter ou refuser. */
    aRepondre: miens.filter((a) => a.statut === 'en_attente' && a.aMoiDeRepondre),
    actifs: miens
      .filter((a) => a.statut === 'actif')
      .sort((a, b) => (derniereActivite(b.activite)?.getTime() ?? 0) - (derniereActivite(a.activite)?.getTime() ?? 0)),
    /** Invitations envoyées, en attente de réponse. */
    envoyees: miens.filter((a) => a.statut === 'en_attente' && !a.aMoiDeRepondre),
  };
}

/** Pastille du menu, côté coach : demandes à traiter + dirigeants qui ont avancé. */
export function compteurCoach(liste: Accompagnement[]): number {
  const { aRepondre, actifs } = rangerAccompagnements(liste, 'coach');
  return aRepondre.length + actifs.filter((a) => sujetsNouveaux(a.activite, a.coachVuLe).length > 0).length;
}

/** Pastille du menu, côté dirigeant : invitations de coachs à traiter. */
export function compteurDirigeant(liste: Accompagnement[]): number {
  return rangerAccompagnements(liste, 'dirigeant').aRepondre.length;
}
