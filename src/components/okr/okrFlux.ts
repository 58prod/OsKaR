import { differenceInCalendarDays } from 'date-fns';
import { Priority, Quarter } from '@/types';

/*
 * Parcours OKR en 3 étapes — transposition de okr.html.
 * Constantes, classes et petits calculs partagés par les trois écrans.
 */

export type Etape = 'annee' | 'trimestre' | 'actions';
export const ETAPES: Etape[] = ['annee', 'trimestre', 'actions'];

export const ANNEE = new Date().getFullYear();

export const QUARTERS: Quarter[] = [Quarter.Q1, Quarter.Q2, Quarter.Q3, Quarter.Q4];
/** « Q1 » → « T1 », comme la maquette. */
export const trimLabel = (q: Quarter) => q.replace('Q', 'T');

/** Trois objectifs maximum : la maquette n'en affiche pas davantage. */
export const MAX_OBJECTIFS = 3;
/** Deux résultats clés par objectif trimestriel (« max 2 » sur la maquette). */
export const MAX_KR_PAR_OBJECTIF = 2;

export const ORDINAUX = ['Premier', 'Deuxième', 'Troisième'];

/** Couleurs par position d'objectif (c1 finance, c2 fit, c3 team sur la maquette). */
export const SLOT_COULEURS = [
  { icone: 'bg-finance-light text-finance-dark', barre: 'bg-finance' },
  { icone: 'bg-fit-light text-fit-dark', barre: 'bg-fit' },
  { icone: 'bg-team-light text-team-dark', barre: 'bg-team' },
];

/* ── Boutons génériques de oskar.css (.btn, .btn-primary, .btn-outline) ── */
const BTN_BASE =
  'inline-flex items-center gap-1.5 px-[18px] py-[10.5px] rounded-[10.5px] text-15.5 font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none';
export const BTN_PRIMARY = `${BTN_BASE} bg-teal text-navy-dark hover:bg-teal-dark hover:-translate-y-px`;
export const BTN_OUTLINE = `${BTN_BASE} bg-transparent text-navy border-[1.5px] border-line hover:border-navy hover:bg-[#f0f2ff]`;

/* ── Progression et état d'un résultat clé ── */
export function pctKR(kr: { current: number; target: number }): number {
  if (!kr.target || kr.target <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((kr.current / kr.target) * 100)));
}

export type EtatKR = 'on' | 'mid' | 'off';
export function etatKR(pct: number): EtatKR {
  if (pct >= 60) return 'on';
  if (pct >= 30) return 'mid';
  return 'off';
}

export const ETAT_CLASSES: Record<EtatKR, { point: string; barre: string; pct: string }> = {
  on: { point: 'bg-fit shadow-[0_0_0_3px_rgba(34,197,94,0.15)]', barre: 'bg-fit', pct: 'text-fit-dark' },
  mid: { point: 'bg-finance shadow-[0_0_0_3px_rgba(245,158,11,0.15)]', barre: 'bg-finance', pct: 'text-finance-dark' },
  off: { point: 'bg-[#ef4444] shadow-[0_0_0_3px_rgba(239,68,68,0.12)]', barre: 'bg-[#ef4444]', pct: 'text-[#ef4444]' },
};

export function moyenne(valeurs: number[]): number {
  if (valeurs.length === 0) return 0;
  return Math.round(valeurs.reduce((a, b) => a + b, 0) / valeurs.length);
}

/** Affiche un nombre sans décimales inutiles (12 → « 12 », 12.5 → « 12,5 »). */
export function formatNombre(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toLocaleString('fr-FR', { maximumFractionDigits: 2 });
}

/* ── Priorités d'action : Haute / Moyenne / Basse ── */
export type Prio = 'haute' | 'moyenne' | 'basse';
export const PRIOS: Prio[] = ['haute', 'moyenne', 'basse'];

export const PRIO_LABEL: Record<Prio, string> = { haute: 'Haute', moyenne: 'Moyenne', basse: 'Basse' };
export const PRIO_EMOJI: Record<Prio, string> = { haute: '🔴', moyenne: '🟠', basse: '🟢' };
export const PRIO_TAG: Record<Prio, string> = {
  haute: 'bg-[rgba(239,68,68,0.1)] text-[#dc2626]',
  moyenne: 'bg-finance-light text-finance-dark',
  basse: 'bg-fit-light text-fit-dark',
};
export const PRIO_CHIP_SELECTED: Record<Prio, string> = {
  haute: 'bg-[rgba(239,68,68,0.1)] border-[#ef4444] text-[#dc2626]',
  moyenne: 'bg-finance-light border-finance text-finance-dark',
  basse: 'bg-fit-light border-fit text-fit-dark',
};

export function prioDepuisPriority(p: Priority | string | undefined): Prio {
  const v = String(p ?? '').toLowerCase();
  if (v === 'high' || v === 'critical') return 'haute';
  if (v === 'low') return 'basse';
  return 'moyenne';
}
export function priorityDepuisPrio(p: Prio): Priority {
  if (p === 'haute') return Priority.HIGH;
  if (p === 'basse') return Priority.LOW;
  return Priority.MEDIUM;
}

/** « Dans 5 j », « Aujourd'hui », « Retard 3 j ». */
export function texteEcheance(d: Date | undefined): string | null {
  if (!d) return null;
  const jours = differenceInCalendarDays(d, new Date());
  if (jours === 0) return "Aujourd'hui";
  if (jours > 0) return `Dans ${jours} j`;
  return `Retard ${-jours} j`;
}

/** Date → valeur d'un <input type="date">. */
export function versInputDate(d: Date | undefined): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const j = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${j}`;
}

/** Valeur d'un <input type="date"> → Date locale à midi (évite les glissements de fuseau). */
export function depuisInputDate(v: string): Date | undefined {
  if (!v) return undefined;
  const [y, m, j] = v.split('-').map(Number);
  if (!y || !m || !j) return undefined;
  return new Date(y, m - 1, j, 12, 0, 0);
}

/** Convertit une saisie libre (« 1 500 », « 12,5 ») en nombre, ou null si vide/invalide. */
export function nombreDepuisSaisie(v: string): number | null {
  const t = v.replace(/\s/g, '').replace(',', '.').trim();
  if (t === '') return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/** Raccourcit un intitulé pour les pastilles (« KR Recrutement » sur la maquette). */
export function court(texte: string, max = 26): string {
  const t = texte.trim();
  return t.length > max ? `${t.slice(0, max - 1).trimEnd()}…` : t;
}
