/**
 * Départ volontaire d'un participant (bouton « Quitter », page ou onglet
 * fermés) : la personne disparaît pour tous. Son identifiant est gardé par le
 * navigateur : si elle revient, son retour annule le départ.
 *
 * Départs et retours sont datés par l'appareil de la personne elle-même :
 * le plus récent l'emporte, si bien qu'un départ arrivé en retard (envoyé par
 * l'onglet fermé) n'efface pas un retour, quel que soit l'ordre d'arrivée.
 */

/** Dernier départ ou retour de chaque personne. */
export type Departs = Record<string, { left: boolean; at: number }>;

/** Texte de la confirmation de départ dans les outils de vote. */
export const DEPART_AVEC_VOTE =
  'Vous n’apparaîtrez plus parmi les participants et votre vote sera retiré. Vous pourrez revenir avec le lien d’invitation.';

/** La personne est-elle partie ? */
export function estParti(departs: Departs, id: string): boolean {
  return !!departs[id]?.left;
}

/** Retire d'une table par participant les personnes parties. */
export function sansPartis<T>(map: Record<string, T>, departs: Departs): Record<string, T> {
  const ids = Object.keys(map);
  if (!ids.some((id) => estParti(departs, id))) return map;
  return Object.fromEntries(Object.entries(map).filter(([id]) => !estParti(departs, id)));
}

/**
 * Note un départ (`left` vrai) ou un retour. Renvoie null si un geste plus
 * récent est déjà connu, ou si c'est le même (rejeu) : rien ne change.
 */
export function noterDepart(departs: Departs, id: string, left: boolean, at: number): Departs | null {
  if (!id || typeof at !== 'number') return null;
  const cur = departs[id];
  if (cur && (cur.at > at || (cur.at === at && (cur.left || !left)))) return null;
  return { ...departs, [id]: { left, at } };
}

/** Table des départs relue d'un état enregistré (absente des anciennes sessions). */
export function lireDeparts(raw: unknown): Departs {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: Departs = {};
  Object.entries(raw as Record<string, unknown>).forEach(([id, v]) => {
    const d = v as { left?: unknown; at?: unknown } | null;
    if (d && typeof d.at === 'number') out[id] = { left: !!d.left, at: d.at };
  });
  return out;
}

/** Opérations communes de départ et de retour. */
export type DepartOp =
  | { t: 'leave'; voterId: string; at: number }
  | { t: 'back'; voterId: string; at: number };

interface AvecVotants {
  votes: Record<string, unknown>;
  voterNames: Record<string, { name: string; color: string }>;
  departs: Departs;
}

/**
 * Applique un départ (la personne et son vote disparaissent) ou un retour
 * dans un outil de vote. Idempotent et indépendant de l'ordre d'arrivée.
 */
export function appliquerDepart<S extends AvecVotants>(state: S, op: DepartOp): S {
  const departs = noterDepart(state.departs, op.voterId, op.t === 'leave', op.at);
  if (!departs) return state;
  if (op.t === 'back') return { ...state, departs };
  return {
    ...state,
    departs,
    votes: sansPartis(state.votes, departs),
    voterNames: sansPartis(state.voterNames, departs),
  };
}
