import { initialChrono, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

/**
 * Logique pure de la Matrice d'Eisenhower : chacun écrit ses tickets en
 * privé, les place dans l'un des quatre quadrants (urgent / important), puis
 * l'équipe les déplace, les regroupe et leur donne un porteur et une échéance.
 *
 * La position compte, pas seulement le quadrant : plus un ticket est haut,
 * plus il est important ; plus il est à gauche, plus il est urgent. Le plan
 * d'action classe les tickets de chaque quadrant dans cet ordre.
 */

/** Accent de l'outil (cohérent avec sa bannière). */
export const EISENHOWER_ACCENT = '#1d4ed8';

export const EISENHOWER_TEXT_MAX = 200;
export const EISENHOWER_THEME_MAX = 120;
export const EISENHOWER_PORTEUR_MAX = 40;

export type QuadrantKey = 'faire' | 'planifier' | 'deleguer' | 'abandonner';

export interface Quadrant {
  key: QuadrantKey;
  /** Numéro affiché (ordre de traitement). */
  rang: number;
  /** L'action à mener : Faire, Planifier… */
  verbe: string;
  /** Les deux critères, en toutes lettres. */
  criteres: string;
  color: string;
  desc: string;
  /** Libellés des deux champs du plan d'action, propres au quadrant. */
  qui: string;
  quand: string;
  /** Position sur la matrice, en % du conteneur. */
  left: number;
  top: number;
  /** Coin d'ancrage du libellé. */
  labelCorner: 'tl' | 'tr' | 'bl' | 'br';
}

/** Urgent à gauche, important en haut : la disposition habituelle de la matrice. */
export const QUADRANTS: Quadrant[] = [
  {
    key: 'faire', rang: 1, verbe: 'Faire', criteres: 'Urgent et important', color: '#dc2626',
    desc: 'Ce qui compte et ne peut pas attendre : on s’en occupe maintenant.',
    qui: 'Qui s’en charge ?', quand: 'Pour quand ?',
    left: 0, top: 0, labelCorner: 'tl',
  },
  {
    key: 'planifier', rang: 2, verbe: 'Planifier', criteres: 'Important, pas urgent', color: '#2563eb',
    desc: 'Ce qui compte vraiment mais peut attendre : on lui réserve un moment dans l’agenda.',
    qui: 'Qui s’en charge ?', quand: 'Date prévue',
    left: 50, top: 0, labelCorner: 'tr',
  },
  {
    key: 'deleguer', rang: 3, verbe: 'Déléguer', criteres: 'Urgent, pas important', color: '#d97706',
    desc: 'Ce qui presse sans être essentiel pour nous : on le confie à quelqu’un d’autre.',
    qui: 'À qui le confier ?', quand: 'Pour quand ?',
    left: 0, top: 50, labelCorner: 'bl',
  },
  {
    key: 'abandonner', rang: 4, verbe: 'Abandonner', criteres: 'Ni urgent ni important', color: '#64748b',
    desc: 'Ni urgent ni important : on arrête d’y consacrer du temps.',
    qui: 'Qui l’annonce ?', quand: 'À partir de quand ?',
    left: 50, top: 50, labelCorner: 'br',
  },
];

export function getQuadrant(key: string | undefined): Quadrant {
  return QUADRANTS.find((q) => q.key === key) ?? QUADRANTS[0];
}

/** Quadrant sous un point de la matrice (fractions 0–1). */
export function quadrantAt(x: number, y: number): QuadrantKey {
  if (y < 0.5) return x < 0.5 ? 'faire' : 'planifier';
  return x < 0.5 ? 'deleguer' : 'abandonner';
}

/** Place d'un ticket sur la matrice (coin haut gauche, en fraction), avec son quadrant. */
export interface Placement {
  x: number;
  y: number;
  q: QuadrantKey;
  /** Heure (ms) du dernier placement : le déplacement le plus récent l'emporte partout. */
  at: number;
}

/** Bornes des positions : le ticket reste entièrement sur la matrice. */
export const TICKET_POS_MAX = { x: 0.85, y: 0.86 };

export interface EisenhowerTicket {
  id: string;
  authorId: string;
  authorName: string;
  authorColor: string;
  /** Quadrant choisi à l'écriture ; une fois placé, c'est celui du placement qui compte. */
  quadrant: QuadrantKey;
  text: string;
  /** false = brouillon, visible par son auteur seulement. */
  revealed: boolean;
}

/** Texte partagé où le plus récent l'emporte. */
export interface Horodate {
  text: string;
  at: number;
}

/** Un choix daté ; ici, le ticket qui en accueille un autre (null = détaché). */
export interface Choix {
  c: string | null;
  at: number;
}

export interface EisenhowerState {
  /** Rangés par identifiant (horodaté) : même ordre sur tous les écrans. */
  tickets: EisenhowerTicket[];
  placements: Record<string, Placement>;
  /** Regroupements : ticket → ticket qui l'accueille. */
  groupes: Record<string, Choix>;
  /** Textes retouchés après placement. */
  textes: Record<string, Horodate>;
  porteurs: Record<string, Horodate>;
  /** Date ISO « 2026-10-03 », ou vide. */
  echeances: Record<string, Horodate>;
  /** Sujet de la matrice, saisi par l'animateur. */
  theme: Horodate;
  anonymous: boolean;
  /** Numéro de séance, augmenté à chaque « Réinitialiser ». */
  round: number;
  chrono: ToolChrono;
  /** Tickets supprimés pendant la séance : un message en retard ne peut pas les faire revenir. */
  deleted: string[];
}

const VIDE: Horodate = { text: '', at: 0 };

export const INITIAL_EISENHOWER_STATE: EisenhowerState = {
  tickets: [],
  placements: {},
  groupes: {},
  textes: {},
  porteurs: {},
  echeances: {},
  theme: VIDE,
  anonymous: false,
  round: 0,
  chrono: initialChrono(600),
  deleted: [],
};

/* ── Nettoyage de ce qui arrive du réseau ou de la base ──────────────────── */

const estObjet = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
const round3 = (v: number) => Math.round(v * 1000) / 1000;
const nombre = (v: unknown) => (typeof v === 'number' && Number.isFinite(v) && v > 0 ? v : 0);
const texte = (v: unknown, max: number) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const ECHEANCE = /^\d{4}-\d{2}-\d{2}$/;

function horodate(v: unknown, max: number): Horodate {
  return estObjet(v) ? { text: texte(v.text, max), at: nombre(v.at) } : VIDE;
}

function dico<T>(v: unknown, fn: (x: unknown) => T): Record<string, T> {
  if (!estObjet(v)) return {};
  return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, fn(x)]));
}

const echeance = (v: unknown): Horodate => {
  const h = horodate(v, 10);
  return ECHEANCE.test(h.text) ? h : { text: '', at: h.at };
};

const choix = (v: unknown): Choix =>
  (estObjet(v) ? { c: typeof v.c === 'string' && v.c ? v.c.slice(0, 60) : null, at: nombre(v.at) } : { c: null, at: 0 });

/** Un ticket reçu, nettoyé ; null s'il est inutilisable. */
export function sanitizeTicket(raw: unknown): EisenhowerTicket | null {
  if (!estObjet(raw)) return null;
  const id = texte(raw.id, 60);
  const authorId = texte(raw.authorId, 80);
  const text = texte(raw.text, EISENHOWER_TEXT_MAX);
  if (!id || !authorId || !text) return null;
  return {
    id,
    authorId,
    authorName: texte(raw.authorName, 40) || 'Participant',
    authorColor: texte(raw.authorColor, 20) || '#94a3b8',
    quadrant: getQuadrant(texte(raw.quadrant, 12)).key,
    text,
    revealed: raw.revealed === true,
  };
}

/** Un placement reçu, borné ; null s'il est inutilisable. */
export function sanitizePlacement(raw: unknown): Placement | null {
  if (!estObjet(raw)) return null;
  if (typeof raw.x !== 'number' || typeof raw.y !== 'number' || !Number.isFinite(raw.x) || !Number.isFinite(raw.y)) return null;
  const x = round3(clamp(raw.x, 0, TICKET_POS_MAX.x));
  const y = round3(clamp(raw.y, 0, TICKET_POS_MAX.y));
  const q = QUADRANTS.some((z) => z.key === raw.q) ? (raw.q as QuadrantKey) : quadrantAt(x, y);
  return { x, y, q, at: nombre(raw.at) };
}

/** Complète un état enregistré (champs manquants, valeurs douteuses). */
export function normalizeEisenhowerState(raw: Partial<EisenhowerState> | null | undefined): EisenhowerState {
  const s = raw ?? {};
  const tickets = Array.isArray(s.tickets)
    ? s.tickets.map(sanitizeTicket).filter((n): n is EisenhowerTicket => n !== null)
    : [];
  const deleted = Array.isArray(s.deleted) ? s.deleted.filter((x): x is string => typeof x === 'string') : [];
  // Un déplacement peut arriver avant le ticket lui-même (messages dans le
  // désordre) : son placement est gardé en attendant le ticket.
  const placements: Record<string, Placement> = {};
  if (estObjet(s.placements)) {
    Object.entries(s.placements).forEach(([id, v]) => {
      const p = deleted.includes(id) ? null : sanitizePlacement(v);
      if (p) placements[id] = p;
    });
  }
  return {
    tickets,
    placements,
    groupes: dico(s.groupes, choix),
    textes: dico(s.textes, (v) => horodate(v, EISENHOWER_TEXT_MAX)),
    porteurs: dico(s.porteurs, (v) => horodate(v, EISENHOWER_PORTEUR_MAX)),
    echeances: dico(s.echeances, echeance),
    theme: horodate(s.theme, EISENHOWER_THEME_MAX),
    anonymous: !!s.anonymous,
    round: typeof s.round === 'number' ? s.round : 0,
    chrono: s.chrono ?? INITIAL_EISENHOWER_STATE.chrono,
    deleted,
  };
}

/* ── Outils de fusion ────────────────────────────────────────────────────── */

/** La valeur datée `at`/`cle` doit-elle remplacer l'actuelle ? Départage stable à égalité. */
function gagne(at: number, cle: string, actuel: { at: number }, cleActuelle: string): boolean {
  return at > actuel.at || (at === actuel.at && cle > cleActuelle);
}

function majTexte(dict: Record<string, Horodate>, key: string, next: Horodate): Record<string, Horodate> {
  const cur = dict[key] ?? VIDE;
  return gagne(next.at, next.text, cur, cur.text) ? { ...dict, [key]: next } : dict;
}

function majChoix(dict: Record<string, Choix>, key: string, next: Choix): Record<string, Choix> {
  const cur = dict[key] ?? { c: null, at: 0 };
  return gagne(next.at, next.c ?? '', cur, cur.c ?? '') ? { ...dict, [key]: next } : dict;
}

function nouveauPlacement(next: Placement, cur: Placement | undefined): boolean {
  if (!cur) return true;
  return gagne(next.at, `${next.x}:${next.y}:${next.q}`, cur, `${cur.x}:${cur.y}:${cur.q}`);
}

/** Insère en gardant l'ordre des identifiants (horodatés) : même ordre partout. */
function insertById(list: EisenhowerTicket[], item: EisenhowerTicket): EisenhowerTicket[] {
  if (list.some((x) => x.id === item.id)) return list;
  const i = list.findIndex((x) => x.id > item.id);
  return i < 0 ? [...list, item] : [...list.slice(0, i), item, ...list.slice(i)];
}

/**
 * Horodatage d'un nouveau geste : toujours après la valeur qu'on remplace,
 * même si l'horloge de cet ordinateur retarde sur celle d'un autre.
 */
export function apres(at: number, now: number = Date.now()): number {
  return Math.max(now, at + 1);
}

/* ── Opérations partagées ────────────────────────────────────────────────── */

/**
 * Opérations de la matrice, diffusées à tous les participants qui les
 * appliquent avec `eisenhowerReducer`. Toutes sont idempotentes et ne
 * dépendent pas de l'ordre d'arrivée : les ajouts sont rangés par
 * identifiant, les placements, regroupements et textes gardent le plus récent.
 */
export type EisenhowerOp =
  /** Nouveau ticket, en brouillon (visible par son auteur seulement). */
  | { t: 'add'; round: number; ticket: EisenhowerTicket }
  /** Placement de brouillons d'un auteur ; le ticket voyage avec, au cas où son « add » arrive après. */
  | { t: 'publish'; authorId: string; round?: number; items: { id: string; pos: Placement; ticket?: EisenhowerTicket }[] }
  /** Suppression : par son auteur, ou par l'animateur. */
  | { t: 'delete'; id: string; by: string; moderator?: boolean }
  /** Déplacement (et changement de quadrant) : le plus récent l'emporte. */
  | { t: 'move'; id: string; x: number; y: number; q: QuadrantKey; at: number }
  /** Regroupe `id` dans `into` (null = le détacher). */
  | { t: 'group'; id: string; into: string | null; at: number }
  /** Texte retouché après placement, par son auteur ou l'animateur. */
  | { t: 'edit'; id: string; text: string; at: number; by: string; moderator?: boolean }
  | { t: 'porteur'; id: string; text: string; at: number }
  | { t: 'echeance'; id: string; text: string; at: number }
  | { t: 'theme'; text: string; at: number }
  | { t: 'anonymous'; value: boolean }
  | { t: 'chrono'; chrono: ToolChrono }
  /** Nouvelle séance (`round` = séance courante + 1) : tickets effacés, sujet et réglages gardés. */
  | { t: 'reset'; round: number; chrono?: ToolChrono };

export function eisenhowerReducer(raw: EisenhowerState, op: EisenhowerOp): EisenhowerState {
  const s = normalizeEisenhowerState(raw);
  switch (op.t) {
    case 'add': {
      if (op.round !== s.round || s.deleted.includes(op.ticket?.id)) return s;
      const ticket = sanitizeTicket({ ...op.ticket, revealed: false });
      return ticket ? { ...s, tickets: insertById(s.tickets, ticket) } : s;
    }
    case 'publish': {
      if (op.round !== undefined && op.round !== s.round) return s;
      const places = new Map<string, Placement>();
      let tickets = s.tickets;
      (op.items ?? []).forEach((it) => {
        const pos = sanitizePlacement(it.pos);
        if (!pos) return;
        let ticket = tickets.find((n) => n.id === it.id);
        if (!ticket && it.ticket && !s.deleted.includes(it.id)) {
          const recu = sanitizeTicket({ ...it.ticket, id: it.id, revealed: false });
          if (recu && recu.authorId === op.authorId) { tickets = insertById(tickets, recu); ticket = recu; }
        }
        if (ticket && ticket.authorId === op.authorId && !ticket.revealed) places.set(it.id, pos);
      });
      if (places.size === 0) return tickets === s.tickets ? s : { ...s, tickets };
      const placements = { ...s.placements };
      places.forEach((p, id) => {
        // Un déplacement plus récent a pu arriver avant le placement : il garde la main.
        if (nouveauPlacement(p, placements[id])) placements[id] = p;
      });
      return { ...s, tickets: tickets.map((n) => (places.has(n.id) ? { ...n, revealed: true } : n)), placements };
    }
    case 'delete': {
      const ticket = s.tickets.find((n) => n.id === op.id);
      if (ticket && !(op.moderator || ticket.authorId === op.by)) return s;
      const deleted = s.deleted.includes(op.id) ? s.deleted : [...s.deleted, op.id];
      if (!ticket) return deleted === s.deleted ? s : { ...s, deleted };
      const placements = { ...s.placements };
      delete placements[op.id];
      return { ...s, tickets: s.tickets.filter((n) => n.id !== op.id), placements, deleted };
    }
    case 'move': {
      const next = sanitizePlacement({ x: op.x, y: op.y, q: op.q, at: op.at });
      if (!next || !op.id || s.deleted.includes(op.id)) return s;
      // Un déplacement arrivé avant le placement du ticket est gardé : le placement, plus ancien, ne l'écrasera pas.
      if (!nouveauPlacement(next, s.placements[op.id])) return s;
      return { ...s, placements: { ...s.placements, [op.id]: next } };
    }
    case 'group': {
      if (!op.id || op.into === op.id) return s;
      const groupes = majChoix(s.groupes, op.id, { c: op.into || null, at: nombre(op.at) });
      return groupes === s.groupes ? s : { ...s, groupes };
    }
    case 'edit': {
      const ticket = s.tickets.find((n) => n.id === op.id);
      const text = texte(op.text, EISENHOWER_TEXT_MAX);
      if (!ticket || !text || !(op.moderator || ticket.authorId === op.by)) return s;
      const textes = majTexte(s.textes, op.id, { text, at: nombre(op.at) });
      return textes === s.textes ? s : { ...s, textes };
    }
    case 'porteur': {
      const porteurs = majTexte(s.porteurs, op.id, { text: texte(op.text, EISENHOWER_PORTEUR_MAX), at: nombre(op.at) });
      return porteurs === s.porteurs ? s : { ...s, porteurs };
    }
    case 'echeance': {
      const valeur = texte(op.text, 10);
      const echeances = majTexte(s.echeances, op.id, { text: ECHEANCE.test(valeur) ? valeur : '', at: nombre(op.at) });
      return echeances === s.echeances ? s : { ...s, echeances };
    }
    case 'theme': {
      const cur = s.theme;
      const next = { text: texte(op.text, EISENHOWER_THEME_MAX), at: nombre(op.at) };
      return gagne(next.at, next.text, cur, cur.text) ? { ...s, theme: next } : s;
    }
    case 'anonymous':
      return s.anonymous === !!op.value ? s : { ...s, anonymous: !!op.value };
    case 'chrono':
      return { ...s, chrono: op.chrono };
    case 'reset':
      if (op.round <= s.round) return s;
      return {
        ...s,
        round: op.round,
        tickets: [],
        placements: {},
        groupes: {},
        textes: {},
        porteurs: {},
        echeances: {},
        deleted: [],
        chrono: op.chrono ?? s.chrono,
      };
    default:
      return s;
  }
}

/* ── Lecture de l'état ───────────────────────────────────────────────────── */

/** Texte affiché d'un ticket (retouché s'il l'a été). */
export function texteDe(state: Pick<EisenhowerState, 'textes'>, t: EisenhowerTicket): string {
  return state.textes[t.id]?.text || t.text;
}

/** Identifiants des tickets visibles sur la matrice. */
function idsPlaces(state: Pick<EisenhowerState, 'tickets' | 'placements'>): Set<string> {
  return new Set(state.tickets.filter((t) => t.revealed && state.placements[t.id]).map((t) => t.id));
}

/**
 * Ticket qui accueille `id` après regroupements (lui-même s'il n'est pas
 * regroupé). Un regroupement vers un ticket absent ou non placé, ou une
 * boucle, est ignoré.
 */
export function racine(
  state: Pick<EisenhowerState, 'tickets' | 'placements' | 'groupes'>, id: string, places: Set<string> = idsPlaces(state),
): string {
  let cur = id;
  const vus = new Set([id]);
  for (let i = 0; i < 20; i += 1) {
    const into = state.groupes[cur]?.c;
    if (!into || !places.has(into)) return cur;
    if (vus.has(into)) return id;
    vus.add(into);
    cur = into;
  }
  return id;
}

export interface GroupeTickets {
  /** Le ticket en tête : c'est lui qui porte la place, le porteur et l'échéance. */
  tete: EisenhowerTicket;
  /** Tickets regroupés dessous. */
  membres: EisenhowerTicket[];
  placement: Placement;
}

/** Les tickets placés, un groupe par ticket non regroupé, dans l'ordre d'arrivée. */
export function groupesTickets(state: EisenhowerState): GroupeTickets[] {
  const groupes = new Map<string, GroupeTickets>();
  const ids = idsPlaces(state);
  const places = state.tickets.filter((t) => ids.has(t.id));
  places.forEach((t) => {
    if (racine(state, t.id, ids) === t.id) groupes.set(t.id, { tete: t, membres: [], placement: state.placements[t.id] });
  });
  places.forEach((t) => {
    const r = racine(state, t.id, ids);
    if (r !== t.id) groupes.get(r)?.membres.push(t);
  });
  return [...groupes.values()];
}

/**
 * Groupes d'un quadrant, du plus prioritaire au moins prioritaire : en haut
 * à gauche d'abord (plus important, plus urgent).
 */
export function groupesDuQuadrant(groupes: GroupeTickets[], q: QuadrantKey): GroupeTickets[] {
  return groupes
    .filter((g) => g.placement.q === q)
    .sort((a, b) => (a.placement.x + a.placement.y) - (b.placement.x + b.placement.y) || a.tete.id.localeCompare(b.tete.id));
}

/**
 * Place un nouveau ticket dans son quadrant, là où il reste de la place :
 * parmi plusieurs emplacements tirés au hasard, le plus loin des tickets déjà
 * posés. Le bord extérieur, où s'affiche le nom du quadrant, reste libre.
 */
export function freePositionInQuadrant(
  q: QuadrantKey, taken: { x: number; y: number }[], at = 0, rand: () => number = Math.random,
): Placement {
  const z = getQuadrant(q);
  const margin = 0.02;
  // Nom du quadrant et consigne : ~14 % de la hauteur de la matrice.
  const label = 0.14;
  const cardW = 0.15;
  const cardH = 0.14;
  const haut = z.top === 0;
  const x0 = z.left / 100 + margin;
  const y0 = z.top / 100 + margin + (haut ? label : 0);
  const w = Math.max(0, 0.5 - cardW - margin * 2);
  const h = Math.max(0, 0.5 - cardH - margin * 2 - label);
  let best = { x: x0, y: y0 };
  let bestScore = -1;
  for (let i = 0; i < 24; i++) {
    const c = { x: x0 + rand() * w, y: y0 + rand() * h };
    const score = taken.length ? Math.min(...taken.map((p) => Math.hypot((p.x - c.x) * 1.5, p.y - c.y))) : 1;
    if (score > bestScore) { bestScore = score; best = c; }
  }
  return { x: round3(clamp(best.x, 0, TICKET_POS_MAX.x)), y: round3(clamp(best.y, 0, TICKET_POS_MAX.y)), q, at };
}

/* ── Synthèse ────────────────────────────────────────────────────────────── */

/** « 2026-10-03 » → « 03/10/2026 ». */
export function dateFr(iso: string): string {
  const [a, m, j] = iso.split('-');
  return a && m && j ? `${j}/${m}/${a}` : iso;
}

/** Synthèse texte (copie ou export .txt) : quadrant par quadrant, dans l'ordre de priorité. */
export function buildEisenhowerSummary(state: EisenhowerState, date: Date = new Date()): string {
  const groupes = groupesTickets(state);
  const nb = groupes.reduce((n, g) => n + 1 + g.membres.length, 0);
  let txt = `MATRICE D'EISENHOWER — OSKAR — ${date.toLocaleDateString('fr-FR')}\n${'='.repeat(50)}\n`;
  if (state.theme.text) txt += `Sujet : ${state.theme.text}\n`;
  txt += `Tickets : ${nb}${groupes.length !== nb ? ` (${groupes.length} après regroupement)` : ''}\n`;
  if (state.anonymous) txt += 'Séance anonyme : auteurs non indiqués.\n';
  txt += '\n';
  const auteur = (t: EisenhowerTicket) => (state.anonymous ? '' : ` — ${t.authorName}`);
  QUADRANTS.forEach((z) => {
    const liste = groupesDuQuadrant(groupes, z.key);
    txt += `${z.rang}. ${z.verbe.toUpperCase()} — ${z.criteres.toLowerCase()}\n${'-'.repeat(36)}\n`;
    if (liste.length === 0) txt += '  (aucun ticket)\n';
    liste.forEach((g, i) => {
      const porteur = state.porteurs[g.tete.id]?.text;
      const quand = state.echeances[g.tete.id]?.text;
      const suivi = [porteur && `${z.key === 'deleguer' ? 'confié à' : 'porteur'} : ${porteur}`, quand && `échéance : ${dateFr(quand)}`]
        .filter(Boolean).join(' · ');
      txt += `  ${i + 1}. ${texteDe(state, g.tete)}${auteur(g.tete)}\n`;
      if (suivi) txt += `     → ${suivi}\n`;
      g.membres.forEach((m) => { txt += `     + ${texteDe(state, m)}${auteur(m)}\n`; });
    });
    txt += '\n';
  });
  return txt;
}
