import { PILLARS, type PillarId, type StateKey } from '@/lib/diagnostic';
import { REPONSES4, etatInitial4, type Analyse4, type Etat4, type Options4 } from './calcul';

/*
 * Le Diagnostic en ligne (/diagnostic, depuis le 2026-09-24) : la V4b.
 *
 * Réglage du calcul, et format des bilans enregistrés dans la table
 * `diagnostics`, qui garde aussi les bilans de l'ancienne version. Pour ne
 * rien migrer, un bilan V4 reprend les clés que lisent déjà « Mes bilans »,
 * l'administration et l'espace coach (`scores.average`, `scores.evaluatedCount`,
 * `responses.__bilan`), et se reconnaît à `responses.__version = 4`.
 */

/** « Je ne sais pas » hors calcul ; un pilier est noté à partir de deux pratiques renseignées. */
export const OPTIONS_DIAGNOSTIC: Options4 = { couvertureMinimale: 2 };
export const VERSION_BILAN = 4;

/** Réponses enregistrées (le service y ajoute `__bilan`). */
export interface ReponsesBilan4 {
  __version: 4;
  seul: boolean;
  piliers: Etat4['piliers'];
}

/** Résumé enregistré avec le bilan. */
export interface ScoresBilan4 {
  version: 4;
  /** Score global, ou null quand un pilier reste à clarifier. */
  average: number | null;
  averageState: StateKey | null;
  /** Piliers notés. */
  evaluatedCount: number;
  /** Piliers attendus (4 pour qui travaille seul). */
  nbPiliers: number;
  /** Pratiques renseignées (Oui, En partie, Non) et pratiques posées. */
  nbExploitables: number;
  nbPratiques: number;
  recap: { id: PillarId; label: string; score: number; state: StateKey; perception: number | null }[];
  profil: string | null;
  priorite: string | null;
}

export function reponsesBilan4(etat: Etat4): ReponsesBilan4 {
  return { __version: 4, seul: etat.seul, piliers: etat.piliers };
}

export function scoresBilan4(analyse: Analyse4): ScoresBilan4 {
  return {
    version: 4,
    average: analyse.moyenne,
    averageState: analyse.niveauGlobal,
    evaluatedCount: analyse.notes.length,
    nbPiliers: analyse.nbAttendu / 5,
    nbExploitables: analyse.nbExploitables,
    nbPratiques: analyse.nbAttendu / 5 * 4,
    recap: analyse.notes.map((n) => ({ id: n.id, label: n.label, score: n.note, state: n.niveau, perception: n.perception })),
    profil: analyse.profil?.nom ?? null,
    priorite: analyse.priorite?.label ?? null,
  };
}

/** Un bilan enregistré par la version actuelle ? */
export function estBilan4(responses: unknown): boolean {
  return (responses as Record<string, unknown> | null)?.__version === VERSION_BILAN;
}

/**
 * Relit un état V4 venu de l'extérieur (bilan enregistré, corps d'une requête) :
 * champs attendus seulement, bornés ; null s'il est mal formé.
 */
export function etat4Depuis(valeur: unknown): Etat4 | null {
  if (!valeur || typeof valeur !== 'object') return null;
  const brut = valeur as Record<string, unknown>;
  if (typeof brut.seul !== 'boolean') return null;
  const piliers = brut.piliers as Record<string, unknown> | undefined;
  if (!piliers || typeof piliers !== 'object') return null;
  const valeurs = REPONSES4.map((r) => r.valeur) as string[];
  const etat = etatInitial4();
  etat.seul = brut.seul;
  for (const p of PILLARS) {
    const s = piliers[p.id] as Record<string, unknown> | undefined;
    if (!s || typeof s !== 'object') return null;
    const { perception, reponses } = s;
    if (perception !== null && (typeof perception !== 'number' || !Number.isInteger(perception) || perception < 0 || perception > 10)) return null;
    if (!Array.isArray(reponses) || reponses.length !== 4) return null;
    if (!reponses.every((r) => r === null || (typeof r === 'string' && valeurs.includes(r)))) return null;
    etat.piliers[p.id] = { perception: perception as number | null, reponses: reponses as Etat4['piliers'][PillarId]['reponses'] };
  }
  return etat;
}
