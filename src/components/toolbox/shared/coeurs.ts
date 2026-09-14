import type { BoardNote } from './boardNotes';

/**
 * Cœurs datés, communs aux outils à limite de cœurs (Boîte à idées,
 * Disons-nous les choses, Speedboat).
 *
 * Refuser « le cœur de trop » dans le réducteur dépend de l'ordre d'arrivée
 * des messages : si quelqu'un envoie 3 cœurs puis un 4e (limite 3) et que le
 * 4e double un des premiers sur un écran, cet écran garde le 4e et refuse
 * l'autre, un second écran fait l'inverse. On garde donc chaque cœur, daté
 * (le plus récent l'emporte, par votant et par note), et la limite s'applique
 * au calcul de `likedBy` : seuls les premiers cœurs de chacun, par date,
 * comptent. Le résultat est le même sur tous les écrans.
 */

export interface CoeurDate {
  /** 'oui' = cœur donné, null = retiré. */
  c: 'oui' | null;
  at: number;
}

/** Cœurs par note puis par votant. */
export type CoeursDates = Record<string, Record<string, CoeurDate>>;

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const heure = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);

/** Cœurs reçus du réseau ou de la base, nettoyés. */
export function normaliserCoeurs(raw: unknown): CoeursDates {
  if (!estObjet(raw)) return {};
  const res: CoeursDates = {};
  Object.entries(raw).forEach(([noteId, votants]) => {
    if (!estObjet(votants)) return;
    const parVotant: Record<string, CoeurDate> = {};
    Object.entries(votants).forEach(([voterId, v]) => {
      if (voterId && estObjet(v)) parVotant[voterId] = { c: v.c === 'oui' ? 'oui' : null, at: heure(v.at) };
    });
    res[noteId] = parVotant;
  });
  return res;
}

/**
 * Séances enregistrées avant les cœurs datés : leurs `likedBy` deviennent des
 * cœurs à l'heure 0. Sans effet ensuite, `likedBy` ne contenant plus que des
 * cœurs déjà datés.
 */
export function reprendreLikedBy(coeurs: CoeursDates, notes: BoardNote[]): CoeursDates {
  let res = coeurs;
  notes.forEach((n) => n.likedBy.forEach((voterId) => {
    if (res[n.id]?.[voterId]) return;
    if (res === coeurs) res = { ...coeurs };
    res[n.id] = { ...res[n.id], [voterId]: { c: 'oui', at: 0 } };
  }));
  return res;
}

/** Donne ou retire un cœur : le plus récent l'emporte (à égalité, le cœur donné). */
export function donnerCoeur(
  coeurs: CoeursDates, noteId: string, voterId: string, liked: boolean, at: number,
): CoeursDates {
  const cur = coeurs[noteId]?.[voterId];
  const next: CoeurDate = { c: liked ? 'oui' : null, at: heure(at) };
  if (cur && !(next.at > cur.at || (next.at === cur.at && (next.c ?? '') > (cur.c ?? '')))) return coeurs;
  return { ...coeurs, [noteId]: { ...coeurs[noteId], [voterId]: next } };
}

/** La personne a-t-elle mis un cœur sur cette note (qu'il compte ou non) ? */
export function aDonneCoeur(coeurs: CoeursDates, noteId: string, voterId: string): boolean {
  return coeurs[noteId]?.[voterId]?.c === 'oui';
}

/**
 * Heure d'un nouveau geste de cœur : toujours après celui qu'il remplace, même
 * si l'horloge de cet ordinateur retarde sur celle d'un autre.
 */
export function heureDuCoeur(coeurs: CoeursDates, noteId: string, voterId: string, now: number = Date.now()): number {
  return Math.max(now, (coeurs[noteId]?.[voterId]?.at ?? 0) + 1);
}

/**
 * Les notes avec leurs cœurs qui comptent dans `likedBy` (votants rangés par
 * identifiant) : note publiée, pas un cœur de son auteur, et seulement les
 * `voteLimit` premiers cœurs de chacun, par date puis par note (0 = illimité).
 * Renvoie le même tableau si rien ne change.
 */
export function avecCoeurs(notes: BoardNote[], coeurs: CoeursDates, voteLimit: number): BoardNote[] {
  const parId = new Map(notes.map((n) => [n.id, n]));
  const parVotant = new Map<string, { id: string; at: number }[]>();
  Object.entries(coeurs).forEach(([noteId, votants]) => {
    const note = parId.get(noteId);
    if (!note || !note.revealed) return;
    Object.entries(votants).forEach(([voterId, { c, at }]) => {
      if (c !== 'oui' || voterId === note.authorId) return;
      parVotant.set(voterId, [...(parVotant.get(voterId) ?? []), { id: noteId, at }]);
    });
  });
  const comptes = new Map<string, string[]>();
  [...parVotant.keys()].sort().forEach((voterId) => {
    const donnes = parVotant.get(voterId)!.sort((a, b) => (a.at - b.at) || a.id.localeCompare(b.id));
    (voteLimit > 0 ? donnes.slice(0, voteLimit) : donnes)
      .forEach(({ id }) => comptes.set(id, [...(comptes.get(id) ?? []), voterId]));
  });
  let change = false;
  const res = notes.map((n) => {
    const likedBy = comptes.get(n.id) ?? [];
    if (likedBy.length === n.likedBy.length && likedBy.every((v, i) => v === n.likedBy[i])) return n;
    change = true;
    return { ...n, likedBy };
  });
  return change ? res : notes;
}
