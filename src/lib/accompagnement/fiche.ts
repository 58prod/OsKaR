import { PILIERS_COACH, type PilierCoach } from '@/lib/coachs/candidature';
import type { ProfilCoach } from './types';

/*
 * La fiche que le coach tient lui-même (page « Ma fiche coach », migration
 * 20260915_fiche_coach) : sa structure et ce que l'annuaire montrera de lui.
 * Mêmes longueurs que le formulaire de candidature.
 */

export interface FicheCoach {
  structure: string;
  siret: string;
  site: string;
  zone: string;
  piliers: PilierCoach[];
  approche: string;
}

export const LONGUEURS_FICHE = { structure: 200, siret: 20, site: 300, zone: 200, approche: 3000 } as const;

const IDS_PILIERS = PILIERS_COACH.map((p) => p.id);

export function ficheDuProfil(p: ProfilCoach): FicheCoach {
  return {
    structure: p.structure ?? '',
    siret: p.siret ?? '',
    site: p.site ?? '',
    zone: p.zone ?? '',
    piliers: IDS_PILIERS.filter((id) => p.piliers.includes(id)),
    approche: p.approche ?? '',
  };
}

/** Ce que la base enregistrera : espaces retirés, SIRET sans espaces. */
export function ficheNettoyee(f: FicheCoach): FicheCoach {
  return {
    structure: f.structure.trim(),
    siret: f.siret.replace(/\s/g, ''),
    site: f.site.trim(),
    zone: f.zone.trim(),
    piliers: IDS_PILIERS.filter((id) => f.piliers.includes(id)),
    approche: f.approche.trim(),
  };
}

export function ficheModifiee(a: FicheCoach, b: FicheCoach): boolean {
  return JSON.stringify(ficheNettoyee(a)) !== JSON.stringify(ficheNettoyee(b));
}

/** Le premier problème à corriger avant d'enregistrer, ou null. */
export function problemeFiche(f: FicheCoach): string | null {
  const n = ficheNettoyee(f);
  for (const [champ, max] of Object.entries(LONGUEURS_FICHE) as [keyof typeof LONGUEURS_FICHE, number][]) {
    if (n[champ].length > max) return `Un champ est trop long (${max} caractères au plus).`;
  }
  if (n.siret && !/^\d{14}$/.test(n.siret)) return 'Le SIRET compte 14 chiffres.';
  if (n.site && (/\s/.test(n.site) || !n.site.includes('.'))) return 'L’adresse du site est illisible.';
  if (!n.piliers.length) return 'Choisissez au moins un pilier.';
  return null;
}

/** « www.cabinet.fr » → « https://www.cabinet.fr ». */
export function siteCliquable(site: string): string {
  const s = site.trim();
  return /^https?:\/\//i.test(s) ? s : `https://${s}`;
}
