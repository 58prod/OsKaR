import { buildAnalysis, createInitialState } from '@/lib/diagnostic';
import { etatDiagnosticDuCorps } from '@/lib/diagnostic/validation';
import { LONGUEURS_MAX_PROJET, MAX_PROFILS, projetDuCorps } from '@/lib/productFit/validation';
import { EMPTY_PROJECT, PRESET_CASES } from '@/lib/productFit/presets';
import { calculateProductFitAnalysis } from '@/lib/productFit/scoring';

/*
 * Les routes d'envoi du Diagnostic et du Potentiel Produit sont publiques :
 * le serveur relit ce que le navigateur envoie et recalcule l'analyse.
 */

describe('etatDiagnosticDuCorps', () => {
  it('rend à l’identique un formulaire valide, donc la même analyse', () => {
    const etat = createInitialState();
    etat.vision = { slider: 8, checks: [true, true, false], touched: true };
    etat.team = { slider: 2, checks: [false, false, false], touched: true };
    const relu = etatDiagnosticDuCorps(JSON.parse(JSON.stringify(etat)));
    expect(relu).toEqual(etat);
    expect(buildAnalysis(relu!)).toEqual(buildAnalysis(etat));
  });

  it('borne le curseur et ignore tout champ inattendu', () => {
    const etat = JSON.parse(JSON.stringify(createInitialState()));
    etat.vision = { slider: 99, checks: ['oui', 1, true], touched: true, label: '<b>pirate</b>' };
    const relu = etatDiagnosticDuCorps(etat)!;
    expect(relu.vision).toEqual({ slider: 10, checks: [false, false, true], touched: true });
  });

  it('refuse un corps incomplet ou mal formé', () => {
    expect(etatDiagnosticDuCorps(null)).toBeNull();
    expect(etatDiagnosticDuCorps({ vision: { slider: 5, checks: [], touched: true } })).toBeNull();
    const etat = JSON.parse(JSON.stringify(createInitialState()));
    etat.okr.slider = 'NaN';
    expect(etatDiagnosticDuCorps(etat)).toBeNull();
  });
});

describe('projetDuCorps', () => {
  it('rend à l’identique un exemple, donc la même analyse', () => {
    const projet = PRESET_CASES[0].project;
    const relu = projetDuCorps(JSON.parse(JSON.stringify(projet)))!;
    expect(calculateProductFitAnalysis(relu)).toEqual(calculateProductFitAnalysis(projet));
  });

  it('garde au plus trois profils, borne les textes et les notes', () => {
    const profil = { ...EMPTY_PROJECT.personas[0], name: 'x'.repeat(5000), urgency: 42, frequency: -3 };
    const relu = projetDuCorps({ projectName: 'Mon projet', personas: [profil, profil, profil, profil, 'rien'] })!;
    expect(relu.personas).toHaveLength(MAX_PROFILS);
    expect(relu.personas[0].name).toHaveLength(LONGUEURS_MAX_PROJET.name);
    expect(relu.personas[0].urgency).toBe(10);
    expect(relu.personas[0].frequency).toBe(1);
  });

  it('refuse ce qui n’est pas un objet', () => {
    expect(projetDuCorps('texte')).toBeNull();
    expect(projetDuCorps(undefined)).toBeNull();
  });
});
