import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';
import {
  appliquerDepart, estParti, lireDeparts, sansPartis, type DepartOp, type Departs,
} from '@/components/toolbox/shared/departs';
import {
  appliquerTicket, lireTickets, titreSur, urlSure, type PokerTicket, type TicketOp,
} from './pokerTickets';

export { chronoRemaining, formatTime } from '@/components/toolbox/shared/toolChrono';

/** Couleur de l'outil (celle de sa carte dans la boîte à outils). */
export const POKER_ACCENT = '#5b21b6';

/** État partagé d'une session Planning Poker (synchronisé via Realtime). */
export type PokerChrono = ToolChrono;

export type SuiteKey = 'fibonacci' | 'fibonacciPlus' | 'tshirt' | 'custom';

export interface PokerState {
  /** Titre du ticket en cours d'estimation. */
  story: string;
  /** Lien du ticket en cours (http/https), ou ''. */
  storyUrl: string;
  /** Tickets préparés par l'animateur, par priorité (voir pokerTickets). */
  tickets: PokerTicket[];
  /** Tickets supprimés : un ajout ou une modification en retard ne les fait pas revenir. */
  ticketsSupprimes: string[];
  /** Ticket de la liste en cours d'estimation, ou null (ticket saisi à la main). */
  ticketCourant: string | null;
  /**
   * Observateurs : ils suivent la séance sans voter. Choix de chacun, daté
   * (le plus récent l'emporte), gardé d'une manche à l'autre.
   */
  observateurs: Record<string, { on: boolean; at: number }>;
  suiteKey: SuiteKey;
  suite: string[];
  /** participantId -> valeur votée. */
  votes: Record<string, string>;
  /**
   * Prénom et couleur de chaque votant de la manche : une personne dont la
   * connexion décroche reste affichée avec son vote au lieu de disparaître.
   */
  voterNames: Record<string, { name: string; color: string }>;
  revealed: boolean;
  chrono: PokerChrono;
  /**
   * Numéro de la manche de vote, augmenté à chaque « Réinitialiser » et à
   * chaque changement de suite. Un vote parti avant une remise à zéro porte
   * l'ancien numéro : il est ignoré au lieu de réapparaître.
   */
  round: number;
  /** Départs et retours des participants (voir shared/departs). */
  departs: Departs;
  /**
   * Animation réservée au créateur de la session : les autres ne peuvent pas
   * activer le mode animateur. Choisi à la création, modifiable par lui.
   */
  animateurSeul: boolean;
}

/**
 * Carte emoji, à sa place dans une suite : chacun y voit son propre emoji
 * (tiré au hasard, modifiable) ; la voter envoie cet emoji, qui compte dans
 * la répartition mais pas dans la moyenne. Dans une suite personnalisée,
 * il suffit de taper « emoji ».
 */
export const CARTE_EMOJI = 'emoji';

export const SUITES: Record<Exclude<SuiteKey, 'custom'>, string[]> = {
  fibonacci: ['1', '2', '3', '5', '8', '13', '?'],
  fibonacciPlus: ['1', '2', '3', '5', '8', '13', '21', '?', CARTE_EMOJI],
  tshirt: ['XS', 'S', 'M', 'L', 'XL', '?'],
};

/**
 * Valeurs d'une suite personnalisée tapée « 0, 1, 2, ?, emoji » : « emoji »
 * (ou « Émoji »…) devient la carte emoji, et une valeur répétée n'est gardée
 * qu'une fois (deux cartes identiques ne se distingueraient pas).
 */
export function lireSuitePersonnalisee(raw: string): string[] {
  const vals = raw
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => (/^[ée]mojis?$/i.test(v) ? CARTE_EMOJI : v));
  return [...new Set(vals)];
}

/** Emoji tiré au hasard dans le catalogue, pour la carte emoji. */
export function emojiAuHasard(rand: () => number = Math.random): string {
  return EMOJI_CATALOG[Math.floor(rand() * EMOJI_CATALOG.length)] ?? '🦄';
}

export const INITIAL_POKER_STATE: PokerState = {
  story: '',
  storyUrl: '',
  tickets: [],
  ticketsSupprimes: [],
  ticketCourant: null,
  observateurs: {},
  suiteKey: 'fibonacci',
  suite: [...SUITES.fibonacci],
  votes: {},
  voterNames: {},
  revealed: false,
  chrono: initialChrono(120),
  round: 0,
  departs: {},
  animateurSeul: false,
};

function lireObservateurs(raw: unknown): PokerState['observateurs'] {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return {};
  const out: PokerState['observateurs'] = {};
  Object.entries(raw as Record<string, unknown>).forEach(([id, v]) => {
    const o = v as { on?: unknown; at?: unknown } | null;
    if (o && typeof o.at === 'number') out[id] = { on: !!o.on, at: o.at };
  });
  return out;
}

/** La personne suit-elle la séance en observateur ? */
export function estObservateur(state: Pick<PokerState, 'observateurs'>, id: string): boolean {
  return !!state.observateurs[id]?.on;
}

/** Complète un état enregistré avant l'ajout d'un champ (sessions déjà ouvertes). */
export function normalizePokerState(raw: Partial<PokerState> | null | undefined): PokerState {
  const s = raw ?? {};
  return {
    ...INITIAL_POKER_STATE,
    ...s,
    suite: Array.isArray(s.suite) && s.suite.length ? s.suite : [...SUITES.fibonacci],
    votes: s.votes && typeof s.votes === 'object' ? s.votes : {},
    voterNames: s.voterNames && typeof s.voterNames === 'object' ? s.voterNames : {},
    chrono: s.chrono ?? INITIAL_POKER_STATE.chrono,
    round: typeof s.round === 'number' ? s.round : 0,
    departs: lireDeparts(s.departs),
    animateurSeul: !!s.animateurSeul,
    story: typeof s.story === 'string' ? s.story : '',
    storyUrl: urlSure(s.storyUrl),
    tickets: lireTickets(s.tickets),
    ticketsSupprimes: Array.isArray(s.ticketsSupprimes) ? s.ticketsSupprimes.filter((id) => typeof id === 'string') : [],
    ticketCourant: typeof s.ticketCourant === 'string' ? s.ticketCourant : null,
    observateurs: lireObservateurs(s.observateurs),
  };
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations du Planning Poker, diffusées à tous les participants qui les
 * appliquent avec `pokerReducer` : dix personnes peuvent voter dans la même
 * seconde sans qu'aucun vote n'en efface un autre. Toutes sont idempotentes
 * (les rejouer ne change rien), condition du socle `useToolSession`.
 */
export type PokerOp =
  | { t: 'vote'; round: number; voterId: string; value: string; name?: string; color?: string }
  | { t: 'story'; story: string }
  | { t: 'storyUrl'; storyUrl: string }
  /**
   * Nouvelle manche (`round` = manche courante + 1) : votes effacés. Avec
   * `ticketId`, c'est un ticket de la liste qu'on se met à estimer.
   */
  | {
    t: 'newRound'; round: number; suiteKey?: SuiteKey; suite?: string[]; chrono?: PokerChrono;
    ticketId?: string | null; story?: string; storyUrl?: string;
  }
  /**
   * Révélation : fige les votes vus par celui qui révèle, identiques pour tous,
   * et inscrit l'estimation retenue sur le ticket en cours.
   */
  | {
    t: 'reveal'; round: number; votes: Record<string, string>; chrono: PokerChrono;
    ticketId?: string | null; estimation?: string; at?: number;
  }
  | TicketOp
  /** Se mettre en observateur (ne vote plus, son vote éventuel est retiré) ou revenir voter. */
  | { t: 'observateur'; voterId: string; value: boolean; at: number }
  | { t: 'chrono'; chrono: PokerChrono }
  /** Animation réservée au créateur, ou ouverte à tous (envoyée par le créateur). */
  | { t: 'animateurSeul'; value: boolean }
  /** Départ volontaire (la personne et son vote disparaissent) ou retour. */
  | DepartOp;

export function pokerReducer(raw: PokerState, op: PokerOp): PokerState {
  const state = normalizePokerState(raw);
  switch (op.t) {
    case 'vote':
      if (op.round !== state.round || state.revealed) return state;
      if (estParti(state.departs, op.voterId)) return state;
      if (estObservateur(state, op.voterId)) return state;
      if (state.votes[op.voterId] === op.value) return state;
      return {
        ...state,
        votes: { ...state.votes, [op.voterId]: op.value },
        voterNames: op.name
          ? { ...state.voterNames, [op.voterId]: { name: op.name, color: op.color ?? '#1e2d7d' } }
          : state.voterNames,
      };
    case 'story': {
      if (state.story === op.story) return state;
      // Le titre du ticket en cours suit la barre du haut.
      const tickets = state.ticketCourant
        ? state.tickets.map((t) => (t.id === state.ticketCourant ? { ...t, titre: titreSur(op.story) || t.titre } : t))
        : state.tickets;
      return { ...state, story: op.story, tickets };
    }
    case 'storyUrl': {
      const storyUrl = urlSure(op.storyUrl);
      if (state.storyUrl === storyUrl) return state;
      const tickets = state.ticketCourant
        ? state.tickets.map((t) => (t.id === state.ticketCourant ? { ...t, url: storyUrl } : t))
        : state.tickets;
      return { ...state, storyUrl, tickets };
    }
    case 'newRound':
      // Déjà appliquée (rejeu) ou dépassée par une remise à zéro plus récente.
      if (op.round <= state.round) return state;
      return {
        ...state,
        round: op.round,
        votes: {},
        voterNames: {},
        revealed: false,
        suiteKey: op.suiteKey ?? state.suiteKey,
        suite: op.suite ?? state.suite,
        chrono: op.chrono ?? state.chrono,
        ...(op.ticketId !== undefined ? {
          ticketCourant: op.ticketId,
          story: op.story ?? state.story,
          storyUrl: urlSure(op.storyUrl),
        } : {}),
      };
    case 'reveal': {
      if (op.round !== state.round || state.revealed) return state;
      const votes = Object.fromEntries(
        Object.entries(sansPartis(op.votes, state.departs)).filter(([id]) => !estObservateur(state, id)),
      );
      const revele = { ...state, votes, revealed: true, chrono: op.chrono };
      if (!op.ticketId || op.estimation === undefined || typeof op.at !== 'number') return revele;
      return appliquerTicket(revele, { t: 'ticketEstimation', id: op.ticketId, estimation: op.estimation, at: op.at });
    }
    case 'observateur': {
      const cur = state.observateurs[op.voterId];
      if (!op.voterId || typeof op.at !== 'number') return state;
      if (cur && (cur.at > op.at || (cur.at === op.at && (cur.on || !op.value)))) return state;
      const observateurs = { ...state.observateurs, [op.voterId]: { on: !!op.value, at: op.at } };
      // En devenant observateur, son vote de la manche en cours (non révélée) est retiré.
      if (!op.value || state.revealed || state.votes[op.voterId] === undefined) return { ...state, observateurs };
      const { [op.voterId]: _retire, ...votes } = state.votes;
      return { ...state, observateurs, votes };
    }
    case 'ticketAdd':
    case 'ticketEdit':
    case 'ticketMove':
    case 'ticketDelete':
    case 'ticketEstimation':
      return appliquerTicket(state, op);
    case 'chrono':
      return { ...state, chrono: op.chrono };
    case 'animateurSeul':
      return state.animateurSeul === !!op.value ? state : { ...state, animateurSeul: !!op.value };
    case 'leave':
    case 'back':
      return appliquerDepart(state, op);
    default:
      return state;
  }
}

/** Une valeur est-elle un emoji (donc exclue de la moyenne) ? */
function isEmoji(str: string): boolean {
  try {
    return /\p{Emoji}/u.test(str) && !/^\d+$/.test(str.trim());
  } catch {
    return !/^[0-9.]+$/.test(str.trim());
  }
}

export type ConsensusLevel = 'perfect' | 'good' | 'diverge' | 'none';

export interface PokerResults {
  average: string;
  consensus: ConsensusLevel;
  distribution: { value: string; count: number }[];
  voteCount: number;
}

/** Calcule moyenne, consensus et distribution à partir des votes. */
export function computeResults(votes: Record<string, string>): PokerResults {
  const vals = Object.values(votes);
  const numericVals = vals.filter((v) => !isEmoji(v));
  const nums = numericVals.map((v) => parseFloat(v)).filter((v) => !isNaN(v));

  let average = '—';
  if (nums.length > 0) {
    const avg = nums.reduce((a, b) => a + b, 0) / nums.length;
    average = Number.isInteger(avg) ? String(avg) : avg.toFixed(1);
  }

  const numericSet = [...new Set(numericVals.filter((v) => !isNaN(parseFloat(v))))];
  let consensus: ConsensusLevel = 'none';
  if (numericSet.length === 1 && nums.length > 1) {
    consensus = 'perfect';
  } else if (nums.length >= 2 && Math.max(...nums) - Math.min(...nums) <= 2) {
    consensus = 'good';
  } else if (nums.length >= 2) {
    consensus = 'diverge';
  }

  const counts: Record<string, number> = {};
  vals.forEach((v) => { counts[v] = (counts[v] || 0) + 1; });
  const distribution = Object.entries(counts)
    .sort((a, b) => {
      const na = parseFloat(a[0]); const nb = parseFloat(b[0]);
      return !isNaN(na) && !isNaN(nb) ? na - nb : a[0].localeCompare(b[0]);
    })
    .map(([value, count]) => ({ value, count }));

  return { average, consensus, distribution, voteCount: vals.length };
}

/**
 * Estimation inscrite sur le ticket à la révélation : la moyenne des votes
 * chiffrés, sinon la valeur la plus votée (tailles de t-shirt, emoji…).
 * L'animateur peut la corriger dans la liste. null s'il n'y a aucun vote.
 */
export function estimationRetenue(votes: Record<string, string>): string | null {
  const r = computeResults(votes);
  if (r.voteCount === 0) return null;
  if (r.average !== '—') return r.average;
  const max = Math.max(...r.distribution.map((d) => d.count));
  return r.distribution.find((d) => d.count === max)?.value ?? null;
}

/** Côté (px) de l'image envoyée pour un emoji dessiné à la main. */
export const DESSIN_TAILLE = 96;
/** Au-delà, l'image reçue est refusée (un dessin de 96 px pèse quelques Ko). */
export const DESSIN_POIDS_MAX = 60_000;

/**
 * Un dessin reçu d'un autre participant est-il bien une petite image PNG ?
 * Le signal vient du réseau : on n'affiche rien d'autre.
 */
export function estDessinValide(src: unknown): src is string {
  return typeof src === 'string'
    && src.length <= DESSIN_POIDS_MAX
    && /^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(src);
}

/**
 * Cadre carré (avec une marge) autour des pixels dessinés, pour que l'emoji
 * remplisse l'image même si on a dessiné petit dans un coin. `alpha` est le
 * canal de transparence de chaque pixel, ligne par ligne ; null si rien n'est dessiné.
 */
export function cadreDuDessin(
  alpha: ArrayLike<number>,
  cote: number,
): { x: number; y: number; taille: number } | null {
  let minX = cote; let minY = cote; let maxX = -1; let maxY = -1;
  for (let y = 0; y < cote; y++) {
    for (let x = 0; x < cote; x++) {
      if (alpha[y * cote + x] > 0) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  if (maxX < 0) return null;
  const taille = Math.min(cote, Math.max(maxX - minX, maxY - minY) + 1 + 16);
  const cx = (minX + maxX) / 2;
  const cy = (minY + maxY) / 2;
  const borne = (v: number) => Math.round(Math.max(0, Math.min(cote - taille, v - taille / 2)));
  return { x: borne(cx), y: borne(cy), taille };
}

/** Écart de couleur (sur 255) sous lequel deux pixels comptent pour la même zone. */
const TOLERANCE_REMPLISSAGE = 100;

/**
 * Pot de peinture : remplit, dans `pixels` (RGBA ligne par ligne, modifié sur
 * place), la zone d'un seul tenant qui a la couleur du point (x, y). Les bords
 * adoucis des traits qui entourent la zone sont repeints par-dessous, pour ne
 * pas laisser de liseré clair entre le trait et le remplissage.
 * Renvoie false si rien n'a changé (hors du cadre, ou zone déjà de cette couleur).
 */
export function remplirZone(
  pixels: Uint8ClampedArray,
  cote: number,
  x: number,
  y: number,
  [r, g, b]: readonly [number, number, number],
): boolean {
  const px = Math.floor(x);
  const py = Math.floor(y);
  if (px < 0 || py < 0 || px >= cote || py >= cote) return false;

  // Couleurs prémultipliées : un pixel presque transparent ressemble au vide,
  // quelle que soit sa teinte.
  const composante = (i: number, c: number) => (pixels[i * 4 + c] * pixels[i * 4 + 3]) / 255;
  const depart = py * cote + px;
  const cible = [0, 1, 2].map((c) => composante(depart, c)).concat(pixels[depart * 4 + 3]);
  const ressemble = (i: number, ref: number[]) =>
    Math.abs(composante(i, 0) - ref[0]) <= TOLERANCE_REMPLISSAGE
    && Math.abs(composante(i, 1) - ref[1]) <= TOLERANCE_REMPLISSAGE
    && Math.abs(composante(i, 2) - ref[2]) <= TOLERANCE_REMPLISSAGE
    && Math.abs(pixels[i * 4 + 3] - ref[3]) <= TOLERANCE_REMPLISSAGE;
  if (ressemble(depart, [r, g, b, 255])) return false;

  // 1 = dans la zone, 2 = bord de la zone (trait voisin).
  const marque = new Uint8Array(cote * cote);
  marque[depart] = 1;
  const pile = [depart];
  while (pile.length > 0) {
    const i = pile.pop()!;
    const ix = i % cote;
    const voisins = [
      ix > 0 ? i - 1 : -1,
      ix < cote - 1 ? i + 1 : -1,
      i >= cote ? i - cote : -1,
      i < cote * (cote - 1) ? i + cote : -1,
    ];
    for (const n of voisins) {
      if (n < 0 || marque[n]) continue;
      if (ressemble(n, cible)) {
        marque[n] = 1;
        pile.push(n);
      } else {
        marque[n] = 2;
      }
    }
  }

  for (let i = 0; i < marque.length; i++) {
    if (!marque[i]) continue;
    const o = i * 4;
    // Dans la zone : la couleur pleine. Au bord : le pixel existant posé sur la couleur.
    const a = marque[i] === 1 ? 0 : pixels[o + 3] / 255;
    pixels[o] = Math.round(pixels[o] * a + r * (1 - a));
    pixels[o + 1] = Math.round(pixels[o + 1] * a + g * (1 - a));
    pixels[o + 2] = Math.round(pixels[o + 2] * a + b * (1 - a));
    pixels[o + 3] = 255;
  }
  return true;
}

/** Nombre de dessins envoyés gardés sous le cadre pour les renvoyer en un clic. */
export const DERNIERS_DESSINS_MAX = 6;

/** Place un dessin en tête des derniers envoyés, sans doublon. */
export function ajouterAuxDerniers(liste: readonly string[], src: string): string[] {
  return [src, ...liste.filter((s) => s !== src)].slice(0, DERNIERS_DESSINS_MAX);
}

/**
 * Catalogue d'émojis pour les réactions, du plus courant au plus farfelu :
 * les réactions de tous les jours en haut du panneau, puis celles qui
 * parlent d'estimation, puis tout le reste.
 */
export const EMOJI_CATALOG = [
  // Les plus utilisés
  '👍', '👏', '🔥', '😂', '❤️', '🎉', '🚀', '💯', '🤔', '😮',
  '🙌', '😍', '👀', '😅', '🥳', '💪', '😎', '🤩', '✅', '⭐',
  '🤯', '🙏', '🤝', '💡', '🎯', '😬', '🫶', '🥹', '👎', '😴',
  // Pour estimer
  '🐌', '🐢', '🐇', '⚡', '🐘', '🐭', '🧱', '🪶', '⏳', '⏰',
  '🤏', '🙉', '🤷', '❓', '♾️', '🧮', '📏', '🎲', '🃏', '♠️',
  '🐛', '🔧', '🧩', '🏗️', '🧨', '💣', '🪤', '🕳️', '🌋', '🧯',
  // Pour rire
  '🦄', '🐙', '🦖', '🥷', '🧙', '🤖', '👽', '👻', '🤡', '💩',
  '🦆', '🐸', '🦥', '🦩', '🦔', '🐳', '🐧', '🦒', '🐒', '🙈',
  '🫠', '🫡', '🤌', '🥸', '🤓', '😇', '🤪', '😵‍💫', '😱', '🥶',
  '🥵', '🤠', '🧠', '💀', '👾', '🐉', '🦸', '🧞', '🧜', '🫥',
  // Pour se motiver
  '🏆', '🥇', '💎', '🔑', '🌈', '✨', '🎊', '🪄', '🍾', '🎸',
  '🎤', '🕺', '💃', '🏄', '🧗', '🏋️', '🛼', '🪁', '🎳', '🥊',
  // Pour la pause
  '☕', '🍕', '🍩', '🧁', '🍰', '🍿', '🥐', '🧀', '🌮', '🥑',
  '🍫', '🍪', '🧃', '🍺', '🍷', '🥨', '🍜', '🌶️', '🍉', '🍦',
];
