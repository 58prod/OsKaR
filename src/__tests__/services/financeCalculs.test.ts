import {
  ATELIER_FINANCE_VIDE,
  calculCouts,
  calculRentabilite,
  calculRevenus,
  fusionnerFinance,
  lectureObjectif,
  nombre,
  reportCouts,
  type AtelierFinance,
} from '@/lib/finance/types';

/*
 * Les calculs de l'atelier Finance reprennent ceux de `finance-atelier.html`
 * (`calcRevenus`, `calcMarge`, `calcBreakEven`, `updateCaTarget`). Les
 * valeurs attendues sont celles que la maquette affiche pour les mêmes saisies.
 */

const atelier = (patch: Partial<AtelierFinance>): AtelierFinance => ({ ...ATELIER_FINANCE_VIDE, ...patch });

const exemple = atelier({
  revenus: [
    { id: 'a', source: 'Abonnements', type: 'rec', montant: '300000', tendance: 'up' },
    { id: 'b', source: 'Conseil', type: 'proj', montant: '150000', tendance: 'up' },
  ],
  variables: [
    { id: 'c', nature: 'Sous-traitance', montant: '60000', maitrisable: 'yes' },
    { id: 'd', nature: 'Commissions', montant: '30000', maitrisable: 'yes' },
  ],
  fixes: [
    { id: 'e', nature: 'Salaires', montant: '150000', categorie: 'rh', compressible: 'no' },
    { id: 'f', nature: 'Loyer', montant: '30000', categorie: 'loc', compressible: 'part' },
  ],
  beCa: '450000',
  beCf: '180000',
  beCv: '90000',
  beTreso: '60000',
});

describe('Calculs de l’atelier Finance', () => {
  it('répartit les revenus : 450 000 € dont 67 % récurrents', () => {
    const r = calculRevenus(exemple);
    expect(r.total).toBe(450000);
    expect(r.parts).toEqual([67, 33]);
    expect(r.partRecurrente).toBe(67);
    expect(r.nbSources).toBe(2);
  });

  it('ne calcule aucune part tant que le CA est nul', () => {
    const r = calculRevenus(ATELIER_FINANCE_VIDE);
    expect(r.parts).toEqual([null, null]);
    expect(r.partRecurrente).toBeNull();
  });

  it('calcule la marge brute sur le CA de l’étape 1', () => {
    const c = calculCouts(exemple);
    expect(c.totalCV).toBe(90000);
    expect(c.totalCF).toBe(180000);
    expect(c.partsCV).toEqual([13, 7]);
    expect(c.margeBrute).toBe(360000);
  });

  it('recopie les totaux de coûts dans l’étape 3', () => {
    expect(reportCouts(exemple)).toEqual({ beCv: '90000', beCf: '180000' });
    expect(reportCouts(ATELIER_FINANCE_VIDE)).toEqual({ beCv: '', beCf: '' });
  });

  it('trouve le point mort, la marge de sécurité et le runway de la maquette', () => {
    const r = calculRentabilite(exemple);
    expect(r.pointMort).toBe(225000);
    expect(r.margeSecurite).toBe(50);
    expect(r.runway).toBe(3);
    expect(r.tonMarge).toBe('pos');
    expect(r.tonRunway).toBe('warn');
    expect(r.jauge).toEqual({ remplissage: 80, curseur: 40, max: 562500 });
    expect(r.maxCurseur).toBe(900000);
  });

  it('affiche des tirets tant que les données manquent', () => {
    const r = calculRentabilite(ATELIER_FINANCE_VIDE);
    expect(r.affiche).toEqual({ pointMort: false, margeSecurite: false, runway: false });
    expect(r.jauge).toBeNull();
    expect(r.maxCurseur).toBe(2000000);
  });

  it('commente l’objectif de CA comme la maquette', () => {
    expect(lectureObjectif(0, 225000).ton).toBe('attente');
    expect(lectureObjectif(300000, 0)).toEqual({ ton: 'attente', texte: 'Renseignez vos données pour voir l’analyse.' });
    expect(lectureObjectif(200000, 225000).ton).toBe('bas');
    expect(lectureObjectif(250000, 225000).ton).toBe('fragile');
    expect(lectureObjectif(600000, 225000)).toEqual({ ton: 'bon', ecart: 167 });
  });

  it('lit les montants saisis avec espaces ou virgule', () => {
    expect(nombre('450 000')).toBe(450000);
    expect(nombre('12,5')).toBe(12.5);
    expect(nombre('')).toBe(0);
  });

  it('relit un atelier enregistré sans perdre de champ', () => {
    const relu = fusionnerFinance({ periode: 'Année 2025', decisions: [{ action: 'Augmenter les prix' }] });
    expect(relu.periode).toBe('Année 2025');
    expect(relu.decisions[0]).toMatchObject({ action: 'Augmenter les prix', levier: 'Pricing' });
    expect(relu.decisions[2].levier).toBe('Modèle récurrent');
    expect(relu.revenus).toHaveLength(2);
    expect(relu.caCible).toBe(0);
  });
});
