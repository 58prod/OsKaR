import { calculatePersonaScore, calculateProductFitAnalysis } from '@/lib/productFit/scoring';
import { PRESET_CASES } from '@/lib/productFit/presets';

describe('Product Fit Scoring — Phase 1 (P × U × F uniquement)', () => {
  test('calculatePersonaScore computes rawScore = P × U × F and normalizes correctly', () => {
    const persona = {
      id: 'p1',
      name: 'Test Persona',
      role: 'Tester',
      description: 'Desc',
      problemIntensity: 8,
      urgency: 7,
      frequency: 6,
    };

    const result = calculatePersonaScore(persona, true);
    expect(result.rawScore).toBe(8 * 7 * 6); // 336
    expect(result.normalizedScore).toBe(33.6);
    expect(result.scoreOn10).toBe(3.4);
    expect(result.isPriorityTarget).toBe(true);
    // Pas de dimensionsAverage en Phase 1
    expect((result as any).dimensionsAverage).toBeUndefined();
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
    expect(analysis.globalPotentialScore).toBe(72.9);
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
    expect(analysis.priorityPersona?.rawScore).toBe(8 * 7 * 9); // 504
    expect(analysis.globalPotentialScore).toBe(50.4);
    expect(analysis.verdictTone).toBe('info');
  });

  test('Exemple Recettes — Camille prioritaire, sympathique mais pas indispensable', () => {
    const recettes = PRESET_CASES.find((p) => p.id === 'recettes');
    expect(recettes).toBeDefined();
    if (!recettes) return;

    const analysis = calculateProductFitAnalysis(recettes.project);
    expect(analysis.priorityPersona?.personaName).toContain('Camille');
    expect(analysis.priorityPersona?.rawScore).toBe(7 * 5 * 6); // 210
    expect(analysis.globalPotentialScore).toBe(21);
    expect(analysis.verdictTone).toBe('warning');
    expect(analysis.actionRecommendations.length).toBeGreaterThan(0);
  });

  test('Score max (10 × 10 × 10) = 100/100 avec verdict success', () => {
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
    expect(analysis.globalPotentialScore).toBe(100);
    expect(analysis.verdictTone).toBe('success');
  });

  test('Score min (1 × 1 × 1) = 0.1/100 avec verdict danger', () => {
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
    expect(analysis.globalPotentialScore).toBe(0.1);
    expect(analysis.verdictTone).toBe('danger');
  });
});
