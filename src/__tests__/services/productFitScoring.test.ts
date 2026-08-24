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

  test('Eternity preset — Claire identifiée comme cible prioritaire (504 pts)', () => {
    const eternity = PRESET_CASES.find((p) => p.id === 'eternity');
    expect(eternity).toBeDefined();
    if (!eternity) return;

    const analysis = calculateProductFitAnalysis(eternity.project);
    expect(analysis.personasResults.length).toBe(3);
    expect(analysis.priorityPersona).not.toBeNull();
    expect(analysis.priorityPersona?.personaName).toContain('Claire');
    expect(analysis.priorityPersona?.rawScore).toBe(9 * 8 * 7); // 504
    expect(analysis.globalPotentialScore).toBe(50.4);
    // Pas de dimensionsSummary en Phase 1
    expect((analysis as any).dimensionsSummary).toBeUndefined();
  });

  test('ETAPE preset — Sophie identifiée comme cible prioritaire (648 pts)', () => {
    const etape = PRESET_CASES.find((p) => p.id === 'etape');
    expect(etape).toBeDefined();
    if (!etape) return;

    const analysis = calculateProductFitAnalysis(etape.project);
    expect(analysis.priorityPersona?.personaName).toContain('Sophie');
    expect(analysis.priorityPersona?.rawScore).toBe(9 * 9 * 8); // 648
    expect(analysis.globalPotentialScore).toBe(64.8);
    expect(analysis.verdictTone).toBe('info'); // 64.8 < 65 → prometteur mais pas champion
  });

  test('Hemotion preset — Thomas identifié comme cible prioritaire (567 pts)', () => {
    const hemotion = PRESET_CASES.find((p) => p.id === 'hemotion');
    expect(hemotion).toBeDefined();
    if (!hemotion) return;

    const analysis = calculateProductFitAnalysis(hemotion.project);
    expect(analysis.priorityPersona?.personaName).toContain('Thomas');
    expect(analysis.priorityPersona?.rawScore).toBe(9 * 9 * 7); // 567
    expect(analysis.globalPotentialScore).toBe(56.7);
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
