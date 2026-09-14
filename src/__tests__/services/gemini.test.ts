import { geminiService } from '@/services/gemini';
import type { Ambition, CompanyProfile, KeyResult } from '@/types';
import type { QuarterRetrospectiveInput } from '@/lib/gemini-shared';
import { AmbitionCategory, CompanySize, CompanyStage } from '@/types';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn().mockResolvedValue({ data: { session: { access_token: 'jeton-test' } } }),
    },
  },
}));

describe('GeminiService', () => {
  const fetchMock = global.fetch as jest.Mock;
  const originalFetch = global.fetch;

  const ambition: Partial<Ambition> = {
    title: "Doubler le chiffre d'affaires",
    description: 'Passer de 500K€ à 1M€ de CA annuel',
    category: AmbitionCategory.GROWTH,
  };

  const companyProfile: CompanyProfile = {
    name: 'Test Company',
    industry: 'Technology',
    size: CompanySize.SMALL,
    stage: CompanyStage.GROWTH,
    mainChallenges: ['Recrutement', 'Financement'],
    currentGoals: ['Croissance', 'Innovation'],
    marketPosition: 'Challenger B2B',
    targetMarket: 'PME SaaS',
    businessModel: 'Abonnement mensuel',
  };

  const keyResult: Partial<KeyResult> = {
    title: 'Acquérir 100 nouveaux clients',
    description: "Atteindre 100 nouveaux clients B2B d'ici la fin du trimestre",
    target: 100,
    current: 25,
    unit: 'clients',
    deadline: new Date('2026-03-31T00:00:00.000Z'),
  };

  const retrospectiveInput: QuarterRetrospectiveInput = {
    quarterName: 'Q1',
    year: 2026,
    keyResults: [keyResult],
    actionsDone: 7,
    actionsTotal: 10,
    companyProfile,
  };

  const setGlobalFetch = (value: typeof fetch | undefined) => {
    Object.defineProperty(global, 'fetch', {
      value,
      writable: true,
      configurable: true,
    });
  };

  const mockJsonResponse = (body: unknown, ok = true) => {
    fetchMock.mockResolvedValue({
      ok,
      json: jest.fn().mockResolvedValue(body),
    } as unknown as Response);
  };

  const getRequestPayload = () => {
    const [, options] = fetchMock.mock.calls[0];
    return JSON.parse((options as RequestInit).body as string);
  };

  const serializedKeyResult = {
    ...keyResult,
    deadline: keyResult.deadline?.toISOString(),
  };

  const serializedRetrospectiveInput = {
    ...retrospectiveInput,
    keyResults: [serializedKeyResult],
  };

  beforeEach(() => {
    setGlobalFetch(originalFetch);
    fetchMock.mockReset();
  });

  afterAll(() => {
    setGlobalFetch(originalFetch);
  });

  describe('API availability', () => {
    it('returns true when fetch is available', () => {
      expect(geminiService.isAvailable()).toBe(true);
    });

    it('returns false when fetch is unavailable', () => {
      setGlobalFetch(undefined);

      expect(geminiService.isAvailable()).toBe(false);
    });
  });

  describe('request contract', () => {
    it('posts ambition advice requests to the internal API', async () => {
      mockJsonResponse({ result: ['Clarifier la cible', 'Définir une métrique phare'] });

      await expect(geminiService.generateAmbitionAdvice(ambition, companyProfile)).resolves.toEqual([
        'Clarifier la cible',
        'Définir une métrique phare',
      ]);

      expect(fetchMock).toHaveBeenCalledWith(
        '/api/gemini',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer jeton-test' },
        })
      );
      expect(getRequestPayload()).toEqual({
        action: 'generate-ambition-advice',
        payload: { ambition, companyProfile },
      });
    });

    it('posts key result advice requests to the internal API', async () => {
      mockJsonResponse({ result: ['Rendre le KR plus SMART'] });

      await expect(geminiService.generateKeyResultAdvice(keyResult, companyProfile)).resolves.toEqual([
        'Rendre le KR plus SMART',
      ]);
      expect(getRequestPayload()).toEqual({
        action: 'generate-key-result-advice',
        payload: { keyResult: serializedKeyResult, companyProfile },
      });
    });

    it('posts company questions requests to the internal API', async () => {
      mockJsonResponse({ result: ['Quel est votre cycle de vente moyen ?'] });

      await expect(geminiService.generateCompanyQuestions({ name: companyProfile.name })).resolves.toEqual([
        'Quel est votre cycle de vente moyen ?',
      ]);
      expect(getRequestPayload()).toEqual({
        action: 'generate-company-questions',
        payload: { existingProfile: { name: companyProfile.name } },
      });
    });

    it('posts quarter retrospective requests to the internal API', async () => {
      mockJsonResponse({ result: 'Résumé exécutif\n- Bonne progression' });

      await expect(geminiService.generateQuarterRetrospective(retrospectiveInput)).resolves.toBe(
        'Résumé exécutif\n- Bonne progression'
      );
      expect(getRequestPayload()).toEqual({
        action: 'generate-quarter-retrospective',
        payload: serializedRetrospectiveInput,
      });
    });
  });

  describe('error handling', () => {
    it('propagates API error messages returned by the internal route', async () => {
      mockJsonResponse({ error: 'Le service IA est indisponible.' }, false);

      await expect(geminiService.generateAmbitionAdvice(ambition)).rejects.toThrow(
        'Le service IA est indisponible.'
      );
    });

    it('falls back to the default message when the response body is invalid', async () => {
      fetchMock.mockResolvedValue({
        ok: true,
        json: jest.fn().mockRejectedValue(new Error('invalid json')),
      } as unknown as Response);

      await expect(geminiService.generateAmbitionAdvice(ambition)).rejects.toThrow(
        "Le service d'assistance IA est temporairement indisponible."
      );
    });

    it('falls back to the default message when the response has no result payload', async () => {
      mockJsonResponse({});

      await expect(geminiService.generateCompanyQuestions()).rejects.toThrow(
        "Le service d'assistance IA est temporairement indisponible."
      );
    });
  });
});

