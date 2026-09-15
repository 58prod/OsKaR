import { ficheDuProfil, ficheModifiee, ficheNettoyee, problemeFiche, siteCliquable, type FicheCoach } from '@/lib/accompagnement/fiche';
import type { ProfilCoach } from '@/lib/accompagnement/types';

const profil: ProfilCoach = {
  disponible: true,
  resumeQuotidien: true,
  structure: 'Cap Dirigeants',
  siret: null,
  site: null,
  zone: 'Lille',
  piliers: ['okr', 'vision', 'inconnu'],
  approche: null,
  referenceLe: new Date('2026-09-15T08:00:00Z'),
};

const fiche = (p: Partial<FicheCoach> = {}): FicheCoach => ({ ...ficheDuProfil(profil), ...p });

describe('fiche du coach', () => {
  it('part du profil, piliers connus dans l’ordre des piliers', () => {
    expect(ficheDuProfil(profil)).toEqual({
      structure: 'Cap Dirigeants',
      siret: '',
      site: '',
      zone: 'Lille',
      piliers: ['vision', 'okr'],
      approche: '',
    });
  });

  it('ignore les espaces pour savoir si la fiche a changé', () => {
    expect(ficheModifiee(fiche({ structure: ' Cap Dirigeants ' }), fiche())).toBe(false);
    expect(ficheModifiee(fiche({ siret: '123 456 789 00012' }), fiche({ siret: '12345678900012' }))).toBe(false);
    expect(ficheModifiee(fiche({ approche: 'Nouveau' }), fiche())).toBe(true);
    expect(ficheNettoyee(fiche({ siret: '123 456 789 00012' })).siret).toBe('12345678900012');
  });

  it('signale le premier problème à corriger', () => {
    expect(problemeFiche(fiche())).toBeNull();
    expect(problemeFiche(fiche({ siret: '1234' }))).toBe('Le SIRET compte 14 chiffres.');
    expect(problemeFiche(fiche({ siret: '123 456 789 00012' }))).toBeNull();
    expect(problemeFiche(fiche({ site: 'mon site' }))).toBe('L’adresse du site est illisible.');
    expect(problemeFiche(fiche({ site: 'cabinet.fr' }))).toBeNull();
    expect(problemeFiche(fiche({ piliers: [] }))).toBe('Choisissez au moins un pilier.');
    expect(problemeFiche(fiche({ approche: 'x'.repeat(3001) }))).toBe('Un champ est trop long (3000 caractères au plus).');
  });

  it('rend un site cliquable', () => {
    expect(siteCliquable('cabinet.fr')).toBe('https://cabinet.fr');
    expect(siteCliquable(' http://cabinet.fr ')).toBe('http://cabinet.fr');
  });
});
