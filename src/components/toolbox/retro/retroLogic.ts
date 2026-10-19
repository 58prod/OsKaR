import type { BoardNote } from '@/components/toolbox/shared/boardNotes';
import { initialChrono, resetChronoState, type ToolChrono } from '@/components/toolbox/shared/toolChrono';

/** Logique pure de la Rétrospective d'équipe (tableau 4 quadrants). */

/** Accent vert de l'outil (cohérent avec sa bannière). */
export const RETRO_ACCENT = '#047857';

/** Durée par défaut du minuteur (10 minutes). */
export const RETRO_DEFAULT_DURATION_SEC = 10 * 60;

export type RetroCategoryKey = 'plus' | 'start' | 'minus' | 'question';

export interface RetroCategory {
  key: RetroCategoryKey;
  label: string;
  /** Symbole court du quadrant (+, ★, –, ?). */
  symbol: string;
  color: string;
  /** Fond pastel du quadrant. */
  bg: string;
  placeholder: string;
}

/** Quadrants dans l'ordre d'affichage du board (2 × 2). */
export const RETRO_CATEGORIES: RetroCategory[] = [
  {
    key: 'plus', label: 'Ça a bien fonctionné', symbol: '+', color: '#10b981', bg: '#ecfdf5',
    placeholder: 'Un point positif à partager…',
  },
  {
    key: 'start', label: 'À démarrer', symbol: '★', color: '#6366f1', bg: '#eef2ff',
    placeholder: 'Une idée, une action à lancer…',
  },
  {
    key: 'minus', label: 'Ça a moins bien marché', symbol: '–', color: '#f43f5e', bg: '#fff1f2',
    placeholder: 'Un point de friction, une difficulté…',
  },
  {
    key: 'question', label: 'Questions ouvertes', symbol: '?', color: '#f59e0b', bg: '#fffbeb',
    placeholder: 'Une question à poser à l\'équipe…',
  },
];

export function getRetroCategory(key: string): RetroCategory {
  return RETRO_CATEGORIES.find((c) => c.key === key) ?? RETRO_CATEGORIES[0];
}

/** Champs éditables d'une action issue d'une note « À démarrer ». */
export interface RetroActionMeta {
  resp: string;
  deadline: string;
  done: boolean;
}

/**
 * Action d'une rétrospective précédente, conservée quand l'animateur lance
 * une nouvelle rétro : c'est elle qui permet le suivi d'une séance à l'autre.
 */
export interface RetroPastAction extends RetroActionMeta {
  id: string;
  text: string;
  authorName: string;
  authorColor: string;
  /** Jour de la rétrospective qui l'a décidée (AAAA-MM-JJ). */
  retroDate: string;
}

/** Note du tableau, éventuellement rangée dans un tas avec des notes proches. */
export interface RetroNote extends BoardNote {
  /** Identifiant du tas : les notes révélées qui le partagent sont empilées. */
  pileId?: string;
  /** Moment de la révélation (horloge du révélateur) : place par défaut sur le tableau. */
  revealedAt?: number;
  /** Place choisie à la main sur le tableau (glisser-déposer). */
  order?: number;
  orderAt?: number;
  /** Place dans la file de préparation de l'auteur (glisser-déposer, flèches au clavier). */
  queue?: number;
  queueAt?: number;
  /** Note abordée pendant la rétro : barrée et rangée en bas de sa case. */
  treated?: boolean;
  treatedAt?: number;
  /** Dernière modification du texte par son auteur (la plus récente gagne). */
  editedAt?: number;
}

/* ── Ordre des notes ──────────────────────────────────────────────────────── */

/** Moment de création, lu dans l'identifiant (horodaté en base 36). */
export function idTime(id: string): number {
  const t = parseInt(id.split('-')[0], 36);
  return Number.isFinite(t) ? t : 0;
}

/** Place d'une note révélée : choisie à la main, sinon ordre de révélation. */
export function boardKey(n: RetroNote): number {
  return n.order ?? n.revealedAt ?? idTime(n.id);
}

/** Place d'une note dans la file de préparation de son auteur. */
export function queueKey(n: RetroNote): number {
  return n.queue ?? idTime(n.id);
}

const parId = (a: RetroNote, b: RetroNote) => (a.id < b.id ? -1 : a.id > b.id ? 1 : 0);
const parCle = (cle: (n: RetroNote) => number) => (a: RetroNote, b: RetroNote) => cle(a) - cle(b) || parId(a, b);

/** Ordre des personnes quand on regroupe : alphabétique (même ordre dans les quatre cases). */
function authorsInOrder(notes: RetroNote[]): string[] {
  const names = new Map<string, string>();
  notes.forEach((n) => { if (!names.has(n.authorId)) names.set(n.authorId, n.authorName); });
  return [...names.entries()]
    .sort(([ia, na], [ib, nb]) => na.localeCompare(nb, 'fr', { sensitivity: 'base' }) || (ia < ib ? -1 : ia > ib ? 1 : 0))
    .map(([id]) => id);
}

/**
 * Ordre d'affichage d'une case : les notes révélées à aborder (dans l'ordre
 * de révélation), puis les notes encore masquées, puis les notes déjà
 * abordées. Regroupées par personne (`groupByAuthor`), chaque personne a
 * ses notes révélées puis ses notes masquées à la suite : une note révélée
 * apparaît au milieu des siennes, même si elle l'est avant les autres.
 */
export function sortBoardNotes(notes: RetroNote[], groupByAuthor = false): RetroNote[] {
  const actives = notes.filter((n) => n.revealed && !n.treated).sort(parCle(boardKey));
  const hidden = notes.filter((n) => !n.revealed).sort(parCle(queueKey));
  const treated = notes.filter((n) => n.revealed && n.treated).sort(parCle(boardKey));
  if (!groupByAuthor) return [...actives, ...hidden.sort(parId), ...treated];
  const authors = authorsInOrder(notes);
  const of = (list: RetroNote[], id: string) => list.filter((n) => n.authorId === id);
  return [
    ...authors.flatMap((id) => [...of(actives, id), ...of(hidden, id)]),
    ...authors.flatMap((id) => of(treated, id)),
  ];
}

/** Notes d'un auteur dans l'ordre de sa file : révélées d'abord, puis à révéler. */
export function sortQueue(notes: RetroNote[]): RetroNote[] {
  return [
    ...notes.filter((n) => n.revealed).sort(parCle((n) => n.revealedAt ?? idTime(n.id))),
    ...notes.filter((n) => !n.revealed).sort(parCle(queueKey)),
  ];
}

/**
 * Clé qui place un élément juste avant ou juste après l'élément `index`
 * d'une liste de clés croissantes (l'élément déplacé n'y figure pas).
 */
export function keyBeside(keys: number[], index: number, side: 'before' | 'after'): number {
  const prev = side === 'before' ? keys[index - 1] : keys[index];
  const next = side === 'before' ? keys[index] : keys[index + 1];
  if (prev === undefined && next === undefined) return Date.now();
  if (prev === undefined) return next - 1;
  if (next === undefined) return prev + 1;
  return (prev + next) / 2;
}

export interface RetroState {
  notes: RetroNote[];
  /** Métadonnées d'action, indexées par id de note (quadrant « À démarrer »). */
  actionMeta: Record<string, RetroActionMeta>;
  /** Actions des rétrospectives précédentes, à suivre. */
  pastActions: RetroPastAction[];
  /** Jour de la rétrospective en cours (AAAA-MM-JJ). */
  retroDate: string;
  /**
   * Notes « À démarrer » retirées de la liste des actions par l'animateur :
   * elles restent sur le tableau, mais ne sont pas suivies comme actions.
   */
  dismissedActions: string[];
  chrono: ToolChrono;
  /**
   * Numéro de séance, augmenté à chaque « Nouvelle rétro » et « Tout
   * effacer » : une note envoyée juste avant ne réapparaît pas après.
   */
  session: number;
  /**
   * Notes supprimées pendant la séance : un message en retard (ajout,
   * révélation) ne peut pas les faire revenir.
   */
  deletedIds: string[];
  /** Notes regroupées par personne sur le tableau (choix de l'animateur, le plus récent gagne). */
  groupByAuthor: boolean;
  groupByAuthorAt?: number;
}

/** Jour local au format AAAA-MM-JJ. */
export function todayISO(now: Date = new Date()): string {
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${now.getFullYear()}-${m}-${d}`;
}

/** « 11 septembre 2026 » à partir de « 2026-09-11 ». */
export function formatRetroDate(iso: string): string {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  return new Date(`${iso}T12:00:00`).toLocaleDateString('fr-FR', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

export const INITIAL_RETRO_STATE: RetroState = {
  notes: [],
  actionMeta: {},
  pastActions: [],
  retroDate: '',
  dismissedActions: [],
  chrono: initialChrono(RETRO_DEFAULT_DURATION_SEC),
  session: 0,
  deletedIds: [],
  groupByAuthor: false,
};

/**
 * Complète un état venu de la base ou du réseau : les séances créées avant
 * l'ajout du suivi n'ont ni `pastActions` ni `retroDate`.
 */
export function normalizeRetroState(raw: Partial<RetroState> | null | undefined): RetroState {
  return {
    ...INITIAL_RETRO_STATE,
    ...(raw ?? {}),
    notes: raw?.notes ?? [],
    actionMeta: raw?.actionMeta ?? {},
    pastActions: raw?.pastActions ?? [],
    retroDate: raw?.retroDate ?? '',
    dismissedActions: raw?.dismissedActions ?? [],
    session: typeof raw?.session === 'number' ? raw.session : 0,
    deletedIds: Array.isArray(raw?.deletedIds) ? raw.deletedIds : [],
    groupByAuthor: raw?.groupByAuthor === true,
  };
}

/** Notes révélées du quadrant « À démarrer » = actions de la rétro (sauf celles retirées). */
export function retroActions(state: RetroState): BoardNote[] {
  const dismissed = new Set(state.dismissedActions ?? []);
  return state.notes.filter((n) => n.revealed && n.category === 'start' && !dismissed.has(n.id));
}

/** Tri par échéance : la plus proche d'abord, les actions sans échéance à la fin. */
export function byDeadline<T extends { deadline: string }>(a: T, b: T): number {
  if (!a.deadline && !b.deadline) return 0;
  if (!a.deadline) return 1;
  if (!b.deadline) return -1;
  return a.deadline.localeCompare(b.deadline);
}

/**
 * Nouvelle rétrospective : les actions de la séance rejoignent l'historique,
 * les cases sont vidées, le minuteur revient à zéro.
 */
export function startNewRetro(state: RetroState, today: string = todayISO()): RetroState {
  const date = state.retroDate || today;
  const archived: RetroPastAction[] = retroActions(state).map((n) => {
    const meta = state.actionMeta[n.id] ?? { resp: '', deadline: '', done: false };
    return {
      id: n.id,
      text: n.text,
      authorName: n.authorName,
      authorColor: n.authorColor,
      retroDate: date,
      resp: meta.resp,
      deadline: meta.deadline,
      done: meta.done,
    };
  });
  return {
    ...state,
    notes: [],
    actionMeta: {},
    dismissedActions: [],
    pastActions: [...archived, ...state.pastActions],
    retroDate: today,
    chrono: resetChronoState(state.chrono),
  };
}

/* ── Tas de notes ─────────────────────────────────────────────────────────── */

/** Pose la note `id` sur la note (ou le tas) `targetId` : elles forment un tas. */
export function pileNotes(notes: RetroNote[], id: string, targetId: string): RetroNote[] {
  if (id === targetId) return notes;
  const target = notes.find((n) => n.id === targetId && n.revealed);
  const moved = notes.find((n) => n.id === id && n.revealed);
  if (!target || !moved) return notes;
  const pileId = target.pileId ?? target.id;
  return notes.map((n) => (
    n.id === target.id || n.id === moved.id ? { ...n, pileId, category: target.category } : n
  ));
}

/** Déplace tout un tas vers une autre case. */
export function movePile(notes: RetroNote[], pileId: string, category: string): RetroNote[] {
  return notes.map((n) => (n.pileId === pileId ? { ...n, category } : n));
}

/** Pose tout le tas `pileId` sur la note (ou le tas) `targetId`. */
export function mergePile(notes: RetroNote[], pileId: string, targetId: string): RetroNote[] {
  const target = notes.find((n) => n.id === targetId && n.revealed);
  if (!target) return notes;
  const into = target.pileId ?? target.id;
  if (into === pileId) return notes;
  return notes.map((n) => {
    if (n.pileId === pileId || n.id === target.id) return { ...n, pileId: into, category: target.category };
    return n;
  });
}

/** Sort une note de son tas. */
export function unpileNote(notes: RetroNote[], id: string): RetroNote[] {
  return notes.map((n) => (n.id === id ? { ...n, pileId: undefined } : n));
}

/** Élément affiché dans une case : une note seule, ou un tas d'au moins deux notes. */
export type RetroBoardItem =
  | { kind: 'note'; note: RetroNote }
  | { kind: 'pile'; pileId: string; notes: RetroNote[] };

/**
 * Regroupe les notes d'une case : notes masquées et notes seules restent
 * à part, les notes révélées partageant un `pileId` forment un tas (placé
 * à l'endroit de sa première note).
 */
export function boardItems(notes: RetroNote[]): RetroBoardItem[] {
  const piles = new Map<string, RetroNote[]>();
  notes.forEach((n) => {
    if (n.revealed && n.pileId) piles.set(n.pileId, [...(piles.get(n.pileId) ?? []), n]);
  });
  const items: RetroBoardItem[] = [];
  const placed = new Set<string>();
  notes.forEach((n) => {
    const pile = n.revealed && n.pileId ? piles.get(n.pileId) : undefined;
    if (pile && pile.length > 1) {
      if (placed.has(n.pileId!)) return;
      placed.add(n.pileId!);
      items.push({ kind: 'pile', pileId: n.pileId!, notes: pile });
    } else {
      items.push({ kind: 'note', note: n });
    }
  });
  return items;
}

/* ── Export / import des actions ──────────────────────────────────────────── */

const CSV_HEADERS = ['Action', 'Proposée par', 'Responsable', 'Échéance', 'Statut', 'Rétrospective du'];

function csvCell(value: string): string {
  return /[;"\n\r]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value;
}

/** Actions de la séance en cours, au même format que l'historique. */
export function currentActions(state: RetroState): RetroPastAction[] {
  const date = state.retroDate || todayISO();
  return retroActions(state).map((n) => {
    const meta = state.actionMeta[n.id] ?? { resp: '', deadline: '', done: false };
    return {
      id: n.id, text: n.text, authorName: n.authorName, authorColor: n.authorColor,
      retroDate: date, ...meta,
    };
  });
}

/** Toutes les actions à suivre : celles de la séance, puis celles des rétros précédentes. */
export function allActions(state: RetroState): RetroPastAction[] {
  return [...currentActions(state), ...state.pastActions];
}

/**
 * Fichier CSV des actions (séparateur « ; » et BOM pour qu'Excel l'ouvre
 * correctement en français). Il se réimporte tel quel dans une autre rétro.
 */
export function buildActionsCsv(actions: RetroPastAction[]): string {
  const lines = [CSV_HEADERS.join(';')];
  actions.forEach((a) => {
    lines.push([
      a.text, a.authorName, a.resp, a.deadline, a.done ? 'Fait' : 'À faire', a.retroDate,
    ].map(csvCell).join(';'));
  });
  return `﻿${lines.join('\r\n')}\r\n`;
}

/** Découpe un CSV (« ; » ou « , »), guillemets doublés compris. */
function parseCsv(text: string): string[][] {
  const clean = text.replace(/^﻿/, '');
  const firstLine = clean.split(/\r?\n/, 1)[0] ?? '';
  const sep = firstLine.includes(';') ? ';' : ',';
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let quoted = false;
  for (let i = 0; i < clean.length; i++) {
    const c = clean[i];
    if (quoted) {
      if (c === '"' && clean[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') quoted = false;
      else cell += c;
    } else if (c === '"') {
      quoted = true;
    } else if (c === sep) {
      row.push(cell); cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && clean[i + 1] === '\n') i++;
      row.push(cell); rows.push(row); row = []; cell = '';
    } else {
      cell += c;
    }
  }
  if (cell || row.length) { row.push(cell); rows.push(row); }
  return rows.filter((r) => r.some((x) => x.trim()));
}

/**
 * Relit un fichier exporté par `buildActionsCsv`. Les lignes sans texte
 * d'action sont ignorées ; les colonnes sont retrouvées par leur en-tête.
 */
export function parseActionsCsv(text: string): RetroPastAction[] {
  const rows = parseCsv(text);
  if (rows.length < 2) return [];
  const norm = (s: string) => s.trim().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
  const header = rows[0].map(norm);
  const col = (label: string) => header.indexOf(norm(label));
  const [iText, iAuthor, iResp, iDeadline, iStatus, iDate] = CSV_HEADERS.map(col);
  if (iText < 0) return [];
  const get = (r: string[], i: number) => (i >= 0 ? (r[i] ?? '').trim() : '');
  return rows.slice(1)
    .filter((r) => get(r, iText))
    .map((r, idx) => {
      const status = norm(get(r, iStatus));
      const date = get(r, iDate);
      return {
        id: `import-${Date.now().toString(36)}-${idx}`,
        text: get(r, iText),
        authorName: get(r, iAuthor),
        authorColor: '#94a3b8',
        resp: get(r, iResp),
        deadline: get(r, iDeadline),
        done: status === 'fait' || status === 'done',
        retroDate: /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : '',
      };
    });
}

/** Ajoute les actions importées à l'historique, sans doublon (même texte, même date). */
export function mergeImportedActions(
  existing: RetroPastAction[],
  imported: RetroPastAction[],
): { actions: RetroPastAction[]; added: number } {
  const key = (a: RetroPastAction) => `${a.text.trim().toLowerCase()}|${a.retroDate}`;
  const seen = new Set(existing.map(key));
  const fresh = imported.filter((a) => {
    const k = key(a);
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  return { actions: [...existing, ...fresh], added: fresh.length };
}

/* ── Résumé texte ─────────────────────────────────────────────────────────── */

/** Résumé texte de la séance (export .txt). */
export function buildRetroSummary(state: RetroState): string {
  const date = state.retroDate
    ? new Date(`${state.retroDate}T12:00:00`).toLocaleDateString('fr-FR')
    : new Date().toLocaleDateString('fr-FR');
  let txt = `RÉTROSPECTIVE OSKAR — ${date}\n${'='.repeat(44)}\n\n`;
  RETRO_CATEGORIES.forEach((cat) => {
    txt += `${cat.symbol} ${cat.label}\n${'-'.repeat(40)}\n`;
    const notes = sortBoardNotes(
      state.notes.filter((n) => n.revealed && n.category === cat.key && n.text.trim()),
      state.groupByAuthor,
    );
    if (notes.length === 0) {
      txt += '(aucune note)\n';
    } else {
      boardItems(notes).forEach((item) => {
        if (item.kind === 'note') {
          txt += `- [${item.note.authorName}] ${item.note.text.trim()}\n`;
        } else {
          txt += `> Tas de ${item.notes.length} notes :\n`;
          item.notes.forEach((n) => { txt += `  - [${n.authorName}] ${n.text.trim()}\n`; });
        }
      });
    }
    txt += '\n';
  });
  const line = (a: RetroPastAction) => `- [${a.authorName}] ${a.text.trim()}`
    + `${a.resp ? ` → ${a.resp}` : ''}`
    + `${a.deadline ? ` | ${a.deadline}` : ''}`
    + `${a.done ? ' (fait)' : ''}\n`;
  txt += `\nACTIONS\n${'='.repeat(44)}\n`;
  const current = currentActions(state);
  if (current.length === 0) txt += '(aucune action)\n';
  current.forEach((a) => { txt += line(a); });
  if (state.pastActions.length > 0) {
    txt += `\nSUIVI DES RÉTROSPECTIVES PRÉCÉDENTES\n${'='.repeat(44)}\n`;
    state.pastActions.forEach((a) => {
      txt += line(a).replace(/\n$/, `${a.retroDate ? ` (rétro du ${formatRetroDate(a.retroDate)})` : ''}\n`);
    });
  }
  return txt;
}

/* ── Opérations partagées ─────────────────────────────────────────────────── */

/**
 * Opérations de la rétro, diffusées à tous les participants qui les
 * appliquent avec `retroReducer`. Chaque opération porte tout ce qu'il faut
 * (identifiants explicites, date du jour) pour donner le même résultat sur
 * chaque écran : deux ajouts simultanés ne s'écrasent plus.
 */
export type RetroOp =
  /** `session` absent = message d'une version précédente, appliqué comme avant. */
  | { t: 'addNote'; note: RetroNote; today: string; session?: number }
  | { t: 'deleteNote'; id: string }
  /**
   * Révélation de notes d'un auteur. Les notes voyagent avec : si leur ajout
   * arrive après (messages dans le désordre), elles sont quand même révélées.
   */
  | { t: 'reveal'; ids: string[]; authorId?: string; session?: number; notes?: RetroNote[]; at?: number }
  /**
   * Modification d'une note par son auteur. La note modifiée voyage avec :
   * arrivée avant l'ajout, elle n'est pas perdue. Le quadrant ne change
   * que tant que la note n'est pas révélée (ensuite, on la glisse).
   */
  | { t: 'editNote'; note: RetroNote; at: number; session?: number }
  /** Nouvelles places (tableau, ou file de préparation si `queue`). La plus récente gagne. */
  | { t: 'order'; orders: Record<string, number>; at: number; queue?: boolean }
  /** Notes marquées abordées (ou plus). La plus récente gagne. */
  | { t: 'treated'; ids: string[]; treated: boolean; at: number }
  /** Regrouper (ou plus) les notes par personne. Le plus récent gagne. */
  | { t: 'groupByAuthor'; on: boolean; at: number }
  | { t: 'unreveal'; authorId: string }
  /** L'auteur a changé de couleur : ses notes la prennent aussi. */
  | { t: 'color'; authorId: string; color: string }
  | { t: 'move'; id: string; category: string }
  | { t: 'movePile'; pileId: string; category: string }
  | { t: 'pile'; id: string; targetId: string }
  | { t: 'pileOnto'; pileId: string; targetId: string }
  | { t: 'unpile'; id: string }
  | { t: 'like'; id: string; voterId: string; liked: boolean }
  | { t: 'actionMeta'; id: string; patch: Partial<RetroActionMeta> }
  | { t: 'pastAction'; id: string; patch: Partial<RetroActionMeta> }
  | { t: 'deletePastAction'; id: string }
  | { t: 'dismissAction'; id: string }
  | { t: 'restoreActions' }
  | { t: 'importActions'; actions: RetroPastAction[] }
  | { t: 'chrono'; chrono: ToolChrono }
  /** `session` = séance courante + 1 : rejouée ou dépassée, elle est ignorée. */
  | { t: 'newRetro'; today: string; session?: number }
  | { t: 'reset'; today: string; session?: number };

/** Le message vient-il d'une séance effacée depuis ? */
const autreSeance = (op: { session?: number }, state: RetroState) =>
  op.session !== undefined && op.session !== state.session;

/** Insère en gardant l'ordre des identifiants (horodatés) : même ordre partout. */
function insertById<T extends { id: string }>(list: T[], item: T): T[] {
  if (list.some((x) => x.id === item.id)) return list;
  const i = list.findIndex((x) => x.id > item.id);
  return i < 0 ? [...list, item] : [...list.slice(0, i), item, ...list.slice(i)];
}

export function retroReducer(raw: RetroState, op: RetroOp): RetroState {
  const state = normalizeRetroState(raw);
  switch (op.t) {
    case 'addNote':
      if (autreSeance(op, state) || state.deletedIds.includes(op.note?.id)) return state;
      return { ...state, retroDate: state.retroDate || op.today, notes: insertById(state.notes, op.note) };
    case 'deleteNote': {
      const actionMeta = { ...state.actionMeta };
      delete actionMeta[op.id];
      const deletedIds = state.deletedIds.includes(op.id) ? state.deletedIds : [...state.deletedIds, op.id];
      return { ...state, notes: state.notes.filter((n) => n.id !== op.id), actionMeta, deletedIds };
    }
    case 'reveal': {
      if (autreSeance(op, state)) return state;
      const ids = new Set(op.ids);
      const ofAuthor = (n: RetroNote) => !op.authorId || n.authorId === op.authorId;
      let notes = state.notes;
      const transported = new Map<string, RetroNote>();
      // Note pas encore arrivée : on l'ajoute depuis la révélation (même auteur, jamais une note supprimée).
      (op.notes ?? []).forEach((n) => {
        if (n && typeof n.id === 'string' && typeof n.text === 'string' && ids.has(n.id)
          && ofAuthor(n) && !state.deletedIds.includes(n.id)) {
          transported.set(n.id, n);
          notes = insertById(notes, {
            ...n, revealed: false, likedBy: [], retained: false, pileId: undefined,
            order: undefined, orderAt: undefined, treated: undefined, treatedAt: undefined,
          });
        }
      });
      const rank = new Map(op.ids.map((id, i) => [id, i]));
      return {
        ...state,
        notes: notes.map((n) => {
          if (!ids.has(n.id) || !ofAuthor(n) || n.revealed) return n;
          // Une modification faite avant la révélation peut arriver après elle : la révélation la porte.
          const t = transported.get(n.id);
          const edited = t && (t.editedAt ?? 0) > (n.editedAt ?? 0)
            ? { text: t.text, category: t.category, editedAt: t.editedAt } : {};
          // Révélées ensemble : elles gardent l'ordre de la file de l'auteur.
          const revealedAt = op.at !== undefined ? op.at + (rank.get(n.id) ?? 0) : undefined;
          return { ...n, ...edited, revealed: true, revealedAt };
        }),
      };
    }
    case 'editNote': {
      const e = op.note;
      if (!e || typeof e.id !== 'string' || typeof e.text !== 'string' || !e.text.trim()) return state;
      if (autreSeance(op, state) || state.deletedIds.includes(e.id)) return state;
      const text = e.text.trim().slice(0, 280);
      const existing = state.notes.find((n) => n.id === e.id);
      if (!existing) {
        return {
          ...state,
          notes: insertById(state.notes, {
            id: e.id, authorId: e.authorId, authorName: e.authorName, authorColor: e.authorColor,
            category: e.category, text, revealed: false, likedBy: [], retained: false, editedAt: op.at,
          }),
        };
      }
      if (existing.authorId !== e.authorId || (existing.editedAt ?? 0) >= op.at) return state;
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === e.id
          ? { ...n, text, category: n.revealed ? n.category : e.category, editedAt: op.at }
          : n)),
      };
    }
    case 'order': {
      const [field, atField] = op.queue ? ['queue', 'queueAt'] as const : ['order', 'orderAt'] as const;
      return {
        ...state,
        notes: state.notes.map((n) => {
          const o = op.orders?.[n.id];
          if (typeof o !== 'number' || !Number.isFinite(o)) return n;
          const prevAt = n[atField] ?? 0;
          // Le plus récent gagne ; à égalité, la plus grande valeur (même résultat partout).
          if (prevAt > op.at || (prevAt === op.at && (n[field] ?? -Infinity) >= o)) return n;
          return { ...n, [field]: o, [atField]: op.at };
        }),
      };
    }
    case 'treated': {
      const ids = new Set(op.ids);
      return {
        ...state,
        notes: state.notes.map((n) => {
          if (!ids.has(n.id) || !n.revealed) return n;
          const prevAt = n.treatedAt ?? 0;
          if (prevAt > op.at || (prevAt === op.at && (!!n.treated || !op.treated))) return n;
          return { ...n, treated: op.treated, treatedAt: op.at };
        }),
      };
    }
    case 'unreveal':
      return {
        ...state,
        notes: state.notes.map((n) => (n.authorId === op.authorId && n.revealed
          ? {
            ...n, revealed: false, likedBy: [], retained: false, pileId: undefined, revealedAt: undefined,
            order: undefined, orderAt: undefined, treated: undefined, treatedAt: undefined,
          }
          : n)),
      };
    case 'color':
      if (typeof op.color !== 'string' || !/^#[0-9a-f]{6}$/i.test(op.color)) return state;
      return {
        ...state,
        notes: state.notes.map((n) => (n.authorId === op.authorId && n.authorColor !== op.color
          ? { ...n, authorColor: op.color } : n)),
      };
    case 'move':
      return {
        ...state,
        notes: state.notes.map((n) => (n.id === op.id && n.revealed
          ? { ...n, category: op.category, pileId: undefined }
          : n)),
      };
    case 'movePile':
      return { ...state, notes: movePile(state.notes, op.pileId, op.category) };
    case 'pile':
      return { ...state, notes: pileNotes(state.notes, op.id, op.targetId) };
    case 'pileOnto':
      return { ...state, notes: mergePile(state.notes, op.pileId, op.targetId) };
    case 'unpile':
      return { ...state, notes: unpileNote(state.notes, op.id) };
    case 'like':
      return {
        ...state,
        notes: state.notes.map((n) => {
          if (n.id !== op.id || !n.revealed) return n;
          // Idempotent : recevoir deux fois le même vote ne change rien.
          if (op.liked === n.likedBy.includes(op.voterId)) return n;
          const others = n.likedBy.filter((x) => x !== op.voterId);
          return { ...n, likedBy: op.liked ? [...others, op.voterId] : others };
        }),
      };
    case 'actionMeta': {
      const prev = state.actionMeta[op.id] ?? { resp: '', deadline: '', done: false };
      return { ...state, actionMeta: { ...state.actionMeta, [op.id]: { ...prev, ...op.patch } } };
    }
    case 'pastAction':
      return {
        ...state,
        pastActions: state.pastActions.map((a) => (a.id === op.id ? { ...a, ...op.patch } : a)),
      };
    case 'deletePastAction':
      return { ...state, pastActions: state.pastActions.filter((a) => a.id !== op.id) };
    case 'dismissAction':
      return state.dismissedActions.includes(op.id)
        ? state : { ...state, dismissedActions: [...state.dismissedActions, op.id] };
    case 'restoreActions':
      return { ...state, dismissedActions: [] };
    case 'importActions':
      return { ...state, pastActions: mergeImportedActions(state.pastActions, op.actions).actions };
    case 'chrono':
      return { ...state, chrono: op.chrono };
    case 'groupByAuthor': {
      const prevAt = state.groupByAuthorAt ?? 0;
      if (prevAt > op.at || (prevAt === op.at && (state.groupByAuthor || !op.on))) return state;
      return { ...state, groupByAuthor: !!op.on, groupByAuthorAt: op.at };
    }
    case 'newRetro':
      // Déjà appliquée (rejeu) ou dépassée : sans effet, pour ne rien archiver deux fois.
      if (op.session !== undefined && op.session <= state.session) return state;
      return { ...startNewRetro(state, op.today), session: op.session ?? state.session + 1, deletedIds: [] };
    case 'reset':
      if (op.session !== undefined && op.session <= state.session) return state;
      return { ...INITIAL_RETRO_STATE, retroDate: op.today, session: op.session ?? state.session + 1 };
    default:
      return state;
  }
}
