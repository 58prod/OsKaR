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
}

export interface RetroState {
  notes: RetroNote[];
  /** Métadonnées d'action, indexées par id de note (quadrant « À démarrer »). */
  actionMeta: Record<string, RetroActionMeta>;
  /** Actions des rétrospectives précédentes, à suivre. */
  pastActions: RetroPastAction[];
  /** Jour de la rétrospective en cours (AAAA-MM-JJ). */
  retroDate: string;
  chrono: ToolChrono;
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
  chrono: initialChrono(RETRO_DEFAULT_DURATION_SEC),
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
  };
}

/** Notes révélées du quadrant « À démarrer » = actions de la rétro. */
export function retroActions(state: RetroState): BoardNote[] {
  return state.notes.filter((n) => n.revealed && n.category === 'start');
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
  const date = new Date().toLocaleDateString('fr-FR');
  let txt = `RÉTROSPECTIVE OSKAR — ${date}\n${'='.repeat(44)}\n\n`;
  RETRO_CATEGORIES.forEach((cat) => {
    txt += `${cat.symbol} ${cat.label}\n${'-'.repeat(40)}\n`;
    const notes = state.notes.filter((n) => n.revealed && n.category === cat.key && n.text.trim());
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
