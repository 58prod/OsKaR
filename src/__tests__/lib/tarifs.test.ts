import {
  DEMANDE_VIDE,
  comptesDeLaDemande,
  estSurMesure,
  euros,
  mensuelALAnnee,
  moisOfferts,
  problemeDemande,
  ttc,
} from '@/lib/tarifs/formules';
import { emailNouvelleDemande } from '@/lib/tarifs/notification';

describe('prix de la formule Dirigeant', () => {
  it('offre deux mois quand on paie à l’année', () => {
    expect(moisOfferts()).toBe(2);
    expect(mensuelALAnnee()).toBe(32.5);
  });

  it('calcule le TTC au centime', () => {
    expect(ttc(39)).toBe(46.8);
    expect(ttc(390)).toBe(468);
  });

  it('écrit les montants à la française', () => {
    expect(euros(39)).toBe('39 €');
    expect(euros(32.5)).toBe('32,50 €');
    expect(euros(46.8)).toBe('46,80 €');
  });
});

describe('demande de formule', () => {
  const complete = {
    ...DEMANDE_VIDE,
    prenom: 'Claire',
    nom: 'Durand',
    email: 'claire@atelier-durand.fr',
    entreprise: 'Atelier Durand',
  };

  it('accepte une demande avec prénom, nom, email et entreprise', () => {
    expect(problemeDemande(complete)).toBeNull();
  });

  it('refuse un champ obligatoire vide ou un email mal formé', () => {
    expect(problemeDemande({ ...complete, prenom: ' ' })).toMatch(/prénom/);
    expect(problemeDemande({ ...complete, email: 'claire@atelier' })).toMatch(/valide/);
    expect(problemeDemande({ ...complete, entreprise: '' })).toMatch(/entreprise/);
    expect(problemeDemande({ ...complete, objet: 'reseau', entreprise: '' })).toMatch(/réseau/);
  });

  it('ne lit le nombre de comptes que pour le sur-mesure', () => {
    expect(estSurMesure('mensuel')).toBe(false);
    expect(estSurMesure('reseau')).toBe(true);
    expect(comptesDeLaDemande({ objet: 'annuel', comptes: '5' })).toBeNull();
    expect(comptesDeLaDemande({ objet: 'plusieurs_comptes', comptes: ' 1 200 ' })).toBe(1200);
    expect(comptesDeLaDemande({ objet: 'plusieurs_comptes', comptes: '' })).toBeNull();
  });

  it('refuse un nombre de comptes qui n’en est pas un', () => {
    expect(problemeDemande({ ...complete, objet: 'plusieurs_comptes', comptes: 'trois' })).toMatch(/nombre entier/);
    expect(problemeDemande({ ...complete, objet: 'plusieurs_comptes', comptes: '0' })).toMatch(/nombre entier/);
    expect(problemeDemande({ ...complete, objet: 'plusieurs_comptes', comptes: '4' })).toBeNull();
    // Ignoré hors sur-mesure : la saisie a pu rester d'un autre choix.
    expect(problemeDemande({ ...complete, objet: 'mensuel', comptes: 'trois' })).toBeNull();
  });

  it('échappe ce que la personne a saisi dans l’email à l’équipe', () => {
    const { html, sujet } = emailNouvelleDemande(
      { ...complete, objet: 'reseau', comptes: '300', message: '<script>x</script>' },
      'https://oskar-coach.fr/admin/demandes'
    );
    expect(html).not.toContain('<script>');
    expect(html).toContain('&lt;script&gt;');
    expect(html).toContain('Adhérents');
    expect(sujet).toContain('sur mesure');
  });
});
