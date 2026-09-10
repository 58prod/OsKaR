import { SECTEURS } from '@/lib/secteurs';
import { exemplesPour, EXEMPLES_PAR_FAMILLE, EXEMPLES_PAR_DEFAUT } from '@/lib/exemples';
import { FIT_PAR_FAMILLE } from '@/lib/exemplesFit';

/*
 * Règle produit : les exemples proposés doivent parler le langage du métier
 * choisi, et rester génériques tant qu'aucun métier n'est renseigné.
 */
describe('Exemples adaptés au métier', () => {
  it('couvre chaque famille de la liste des secteurs', () => {
    const manquantes = SECTEURS.map((s) => s.famille).filter((f) => !EXEMPLES_PAR_FAMILLE[f]);
    expect(manquantes).toEqual([]);
  });

  it('propose partout de quoi remplir les trois cartes et les six pastilles', () => {
    Object.entries(EXEMPLES_PAR_FAMILLE).forEach(([famille, jeu]) => {
      expect(jeu.objectifs.length).toBeGreaterThanOrEqual(3);
      expect(jeu.amorces).toHaveLength(3);
      jeu.objectifs.forEach((o) => {
        expect(o.libelle.trim()).not.toBe('');
        expect(o.titre.trim()).not.toBe('');
        expect(o.cible.trim()).not.toBe('');
        expect(o.unite.trim()).not.toBe('');
      });
      expect(jeu.objectifTrimestre.trim()).not.toBe('');
      expect(jeu.action.trim()).not.toBe('');
      expect(jeu.produit.promesse.trim()).not.toBe('');
      // La famille est bien nommée : le test échouerait sur une clé fantaisiste.
      expect(typeof famille).toBe('string');
    });
  });

  it('a des exemples Fit propres à chaque famille, tous remplis', () => {
    const familles = Array.from(new Set(SECTEURS.map((s) => s.famille))).filter((f) => f !== 'Autre');
    const sansFit = familles.filter((f) => !FIT_PAR_FAMILLE[f]);
    expect(sansFit).toEqual([]);

    const vides = (valeur: unknown, chemin: string): string[] =>
      typeof valeur === 'string'
        ? valeur.trim() ? [] : [chemin]
        : Object.entries(valeur as object).flatMap(([cle, v]) => vides(v, `${chemin}.${cle}`));
    Object.entries(EXEMPLES_PAR_FAMILLE).forEach(([famille, jeu]) => {
      expect(vides(jeu.fit, famille)).toEqual([]);
    });
  });

  it('donne à un artisan des exemples Fit de chantier', () => {
    const fit = JSON.stringify(exemplesPour('Plombier').fit).toLowerCase();
    expect(fit).toContain('chantier');
    expect(fit).not.toContain('dirigeants de pme');
  });

  it('donne les exemples du métier quand une activité est choisie', () => {
    const plombier = exemplesPour('Plombier');
    expect(plombier).toBe(EXEMPLES_PAR_FAMILLE['Artisanat & bâtiment']);
    // Un menuisier partage la même famille, donc les mêmes repères.
    expect(exemplesPour('Menuisier')).toBe(plombier);
    expect(exemplesPour('SaaS')).toBe(EXEMPLES_PAR_FAMILLE['Numérique & innovation']);
    expect(exemplesPour('Restauration')).toBe(EXEMPLES_PAR_FAMILLE['Tourisme & restauration']);
  });

  it('retombe sur les exemples génériques sans métier choisi', () => {
    expect(exemplesPour(undefined)).toBe(EXEMPLES_PAR_DEFAUT);
    expect(exemplesPour(null)).toBe(EXEMPLES_PAR_DEFAUT);
    expect(exemplesPour('')).toBe(EXEMPLES_PAR_DEFAUT);
    // Valeur héritée de l'ancien champ de texte libre : elle ne doit rien casser.
    expect(exemplesPour('SaaS, E-commerce')).toBe(EXEMPLES_PAR_DEFAUT);
  });

  it('parle bien du métier : un artisan voit des chantiers, pas des MQL', () => {
    const artisan = exemplesPour('Plombier');
    const texte = JSON.stringify(artisan).toLowerCase();
    expect(texte).toContain('chantier');
    expect(texte).toContain('devis');
  });
});
