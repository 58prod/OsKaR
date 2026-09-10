import { SECTEURS, TOUTES_ACTIVITES, familleDe } from '@/lib/secteurs';

/*
 * La liste a été extraite automatiquement de la maquette `vision.html`.
 * Ces tests constatent ce qui en est sorti : si quelqu'un la modifie plus tard,
 * l'écart avec la maquette se verra ici.
 */
describe("Domaines d'activité", () => {
  it('reprend les 14 familles et les 95 activités de la maquette', () => {
    expect(SECTEURS).toHaveLength(14);
    expect(TOUTES_ACTIVITES).toHaveLength(95);
  });

  it('garde les familles de tête dans l’ordre de la maquette', () => {
    expect(SECTEURS.slice(0, 3).map((s) => s.famille)).toEqual([
      'Artisanat & bâtiment',
      'Immobilier & habitat',
      'Conseil & accompagnement',
    ]);
    expect(SECTEURS[SECTEURS.length - 1].famille).toBe('Autre');
  });

  it('ne contient ni doublon ni libellé vide', () => {
    expect(new Set(TOUTES_ACTIVITES).size).toBe(TOUTES_ACTIVITES.length);
    expect(TOUTES_ACTIVITES.every((a) => a.trim().length > 0)).toBe(true);
    expect(SECTEURS.every((s) => s.activites.length > 0)).toBe(true);
  });

  it('retrouve la famille d’une activité', () => {
    expect(familleDe('Plombier')).toBe('Artisanat & bâtiment');
    expect(familleDe('SaaS')).toBe('Numérique & innovation');
    expect(familleDe('Restauration')).toBe('Tourisme & restauration');
  });

  it('renvoie null pour une activité inconnue ou vide', () => {
    expect(familleDe('Dresseur de licornes')).toBeNull();
    expect(familleDe('')).toBeNull();
    expect(familleDe(undefined)).toBeNull();
  });
});
