import { estActif } from '@/components/layout/Sidebar';

/*
 * Surlignage du menu latéral.
 *
 * Le piège corrigé ici : comparer les adresses avec `startsWith` allumait deux
 * entrées à la fois, « Diagnostic » restant surligné sur « Potentiel Produit »
 * parce que /diagnostic-produit commence par /diagnostic. Même famille de bug
 * entre le pilier /team et la page d'équipe /teams.
 */
describe('estActif — surlignage du menu', () => {
  it('allume la page courante', () => {
    expect(estActif('/diagnostic', '/diagnostic')).toBe(true);
    expect(estActif('/vision', '/vision')).toBe(true);
  });

  it("n'allume pas une page dont l'adresse commence par les mêmes lettres", () => {
    expect(estActif('/diagnostic-produit', '/diagnostic')).toBe(false);
    expect(estActif('/teams', '/team')).toBe(false);
    expect(estActif('/app/outils-perso', '/app/outils')).toBe(false);
  });

  it('allume la rubrique parente sur ses sous-pages', () => {
    expect(estActif('/app/outils/speedboat', '/app/outils')).toBe(true);
    expect(estActif('/app/okr/dashboard', '/app/okr')).toBe(true);
  });

  it("n'allume l'accueil que sur l'accueil", () => {
    expect(estActif('/', '/')).toBe(true);
    expect(estActif('/vision', '/')).toBe(false);
    expect(estActif('/app/okr', '/')).toBe(false);
  });

  it("en mode exact, n'allume pas l'entrée sur ses sous-pages", () => {
    // « Mon parcours » du menu OKR ne doit pas rester allumé sur /app/okr/dashboard.
    expect(estActif('/app/okr', '/app/okr', true)).toBe(true);
    expect(estActif('/app/okr/dashboard', '/app/okr', true)).toBe(false);
  });

  it('ignore une barre oblique finale (trailingSlash de Next)', () => {
    expect(estActif('/vision/', '/vision')).toBe(true);
    expect(estActif('/app/okr/', '/app/okr')).toBe(true);
    expect(estActif('/diagnostic-produit/', '/diagnostic')).toBe(false);
  });
});
