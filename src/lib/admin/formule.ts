import type { CompteAdmin } from './types';

/*
 * La formule d'un compte, telle que l'administration l'affiche.
 *
 * Même règle que `niveauAcces` (src/lib/acces.ts) : une formule n'ouvre les
 * ateliers que si elle est active, payante et pas échue. Une formule offerte
 * échue laisse le compte gratuit sans rien effacer.
 */

export type GenreFormule = 'gratuit' | 'offerte' | 'abonne' | 'demo';

export interface FormuleCompte {
  genre: GenreFormule;
  libelle: string;
  /** Dernier jour inclus d'une formule offerte en cours. */
  jusquAu?: Date;
  motif?: string;
  /** Dernier jour d'une formule offerte aujourd'hui échue. */
  offreExpireeLe?: Date;
}

/** Les motifs proposés quand on offre la formule. */
export const MOTIFS_OFFRE = [
  'Membre fondateur',
  'Coach partenaire',
  'Essai accompagné par un coach',
  'Réseau partenaire',
  'Test interne',
] as const;

const UN_JOUR = 24 * 60 * 60 * 1000;

/**
 * La base enregistre la fin comme le début du lendemain, heure de Paris : le
 * dernier jour inclus est donc l'instant qui précède.
 */
export function dernierJour(expireLe: Date): Date {
  return new Date(expireLe.getTime() - 1);
}

type ChampsFormule = Pick<CompteAdmin, 'plan' | 'statut' | 'expireLe' | 'offerte' | 'motif' | 'stripe' | 'demo'>;

export function formuleDuCompte(c: ChampsFormule, maintenant: Date = new Date()): FormuleCompte {
  if (c.demo) return { genre: 'demo', libelle: 'Démo' };

  const echue = !!c.expireLe && c.expireLe.getTime() <= maintenant.getTime();
  const active =
    (c.statut === 'active' || c.statut === 'trialing') && !!c.plan && c.plan !== 'free' && !echue;

  if (!active) {
    return c.offerte && echue && c.expireLe
      ? { genre: 'gratuit', libelle: 'Gratuit', offreExpireeLe: dernierJour(c.expireLe) }
      : { genre: 'gratuit', libelle: 'Gratuit' };
  }
  if (c.offerte) {
    return {
      genre: 'offerte',
      libelle: 'Offerte',
      jusquAu: c.expireLe ? dernierJour(c.expireLe) : undefined,
      motif: c.motif ?? undefined,
    };
  }
  return { genre: 'abonne', libelle: c.stripe ? 'Abonné' : 'Formule payante' };
}

/** La formule ouvre-t-elle toutes les étapes (offerte ou abonnement) ? */
export function estPayante(f: FormuleCompte): boolean {
  return f.genre === 'offerte' || f.genre === 'abonne';
}

/** 11/09/2026, à l'heure de Paris. */
export function dateCourte(d: Date): string {
  return d.toLocaleDateString('fr-FR', { timeZone: 'Europe/Paris' });
}

/** 2026-09-11, à l'heure de Paris : la valeur d'un champ `<input type="date">`. */
export function dateDeChamp(d: Date): string {
  const [jour, mois, annee] = dateCourte(d).split('/');
  return `${annee}-${mois}-${jour}`;
}

/** La date par défaut d'une offre : dans trois mois. */
export function finParDefaut(maintenant: Date = new Date()): string {
  const d = new Date(maintenant);
  d.setMonth(d.getMonth() + 3);
  return dateDeChamp(d);
}

/** « il y a 40 min », « il y a 2 h », « hier », « il y a 3 jours », puis la date. */
export function ilYA(d: Date | null, maintenant: Date = new Date()): string {
  if (!d) return 'jamais';
  const ecart = maintenant.getTime() - d.getTime();
  if (ecart < 60 * 1000) return 'à l’instant';
  if (ecart < 60 * 60 * 1000) return `il y a ${Math.floor(ecart / 60000)} min`;
  if (ecart < UN_JOUR) return `il y a ${Math.floor(ecart / 3600000)} h`;
  const jours = Math.floor(ecart / UN_JOUR);
  if (jours === 1) return 'hier';
  if (jours < 30) return `il y a ${jours} jours`;
  return `le ${dateCourte(d)}`;
}

/** Nombre de jours pleins entre maintenant et le dernier jour inclus. */
export function joursRestants(jusquAu: Date, maintenant: Date = new Date()): number {
  return Math.max(0, Math.ceil((jusquAu.getTime() - maintenant.getTime()) / UN_JOUR));
}
