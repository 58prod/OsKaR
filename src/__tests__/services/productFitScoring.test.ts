import { calculatePersonaScore, calculateProductFitAnalysis } from '@/lib/productFit/scoring';
import { PRESET_CASES } from '@/lib/productFit/presets';

describe('Potentiel Produit — note et verdicts', () => {
  const profil = (problemIntensity: number, urgency: number, frequency: number) => ({
    id: 'p1', name: 'Test', role: 'Test', description: '', problemIntensity, urgency, frequency,
  });

  test('la note est la moyenne geometrique des trois reponses', () => {
    const result = calculatePersonaScore(profil(8, 7, 6), true);
    expect(result.rawScore).toBe(8 * 7 * 6); // 336
    expect(result.scoreOn10).toBe(7); // racine cubique de 336
    expect(result.normalizedScore).toBe(70); // meme note, sur 100
    expect(result.isPriorityTarget).toBe(true);
    expect((result as any).dimensionsAverage).toBeUndefined();
  });

  test('trois reponses identiques donnent cette valeur, sans ecrasement', () => {
    // Le defaut corrige : le produit brut ramene sur 10 donnait 1,2 pour 5/5/5.
    expect(calculatePersonaScore(profil(5, 5, 5)).scoreOn10).toBe(5);
    expect(calculatePersonaScore(profil(7, 7, 7)).scoreOn10).toBe(7);
    expect(calculatePersonaScore(profil(9, 9, 9)).scoreOn10).toBe(9);
  });

  test('un facteur faible fait chuter la note, contrairement a une moyenne', () => {
    // 10, 10 et 1 : la moyenne dirait 7, la logique multiplicative dit 4,6.
    expect(calculatePersonaScore(profil(10, 10, 1)).scoreOn10).toBe(4.6);
  });

  // Les trois exemples sont calibres pour illustrer trois resultats differents :
  // c'est ce qui les rend pedagogiques, donc c'est ce qu'on verrouille ici.
  test('Exemple Facturation — Lea prioritaire, besoin fort', () => {
    const facturation = PRESET_CASES.find((p) => p.id === 'facturation');
    expect(facturation).toBeDefined();
    if (!facturation) return;

    const analysis = calculateProductFitAnalysis(facturation.project);
    expect(analysis.personasResults.length).toBe(3);
    expect(analysis.priorityPersona).not.toBeNull();
    expect(analysis.priorityPersona?.personaName).toContain('Léa');
    expect(analysis.priorityPersona?.rawScore).toBe(9 * 9 * 9); // 729
    expect(analysis.globalScoreOn10).toBe(9);
    expect(analysis.verdictTone).toBe('success');
    // Pas de dimensionsSummary en Phase 1
    expect((analysis as any).dimensionsSummary).toBeUndefined();
  });

  test('Exemple Covoiturage — Julien prioritaire, besoin reel a preciser', () => {
    const covoiturage = PRESET_CASES.find((p) => p.id === 'covoiturage');
    expect(covoiturage).toBeDefined();
    if (!covoiturage) return;

    const analysis = calculateProductFitAnalysis(covoiturage.project);
    expect(analysis.priorityPersona?.personaName).toContain('Julien');
    expect(analysis.priorityPersona?.rawScore).toBe(8 * 6 * 6); // 288
    expect(analysis.globalScoreOn10).toBe(6.6);
    expect(analysis.verdictTone).toBe('info');
  });

  test('Exemple Recettes — Camille prioritaire, sympathique mais pas indispensable', () => {
    const recettes = PRESET_CASES.find((p) => p.id === 'recettes');
    expect(recettes).toBeDefined();
    if (!recettes) return;

    const analysis = calculateProductFitAnalysis(recettes.project);
    expect(analysis.priorityPersona?.personaName).toContain('Camille');
    expect(analysis.priorityPersona?.rawScore).toBe(5 * 3 * 6); // 90
    expect(analysis.globalScoreOn10).toBe(4.5);
    expect(analysis.verdictTone).toBe('warning');
    expect(analysis.actionRecommendations.length).toBeGreaterThan(0);
  });

  test('Note maximale : 10/10, verdict success', () => {
    const analysis = calculateProductFitAnalysis({
      projectName: 'Test',
      pitch: 'Test',
      personas: [{
        id: 'p1',
        name: 'Persona Max',
        role: 'Max',
        description: 'Max',
        problemIntensity: 10,
        urgency: 10,
        frequency: 10,
      }],
    });
    expect(analysis.globalScoreOn10).toBe(10);
    expect(analysis.verdictTone).toBe('success');
  });

  test('Note minimale : 1/10, verdict danger', () => {
    const analysis = calculateProductFitAnalysis({
      projectName: 'Test',
      pitch: 'Test',
      personas: [{
        id: 'p1',
        name: 'Persona Min',
        role: 'Min',
        description: 'Min',
        problemIntensity: 1,
        urgency: 1,
        frequency: 1,
      }],
    });
    expect(analysis.globalScoreOn10).toBe(1);
    expect(analysis.verdictTone).toBe('danger');
  });
});
