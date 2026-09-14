import type { Ambition, CompanyProfile, KeyResult } from '@/types';
import type { GeminiAction, GeminiPayloadMap, QuarterRetrospectiveInput } from '@/lib/gemini-shared';
import { supabase } from '@/lib/supabaseClient';

const GEMINI_API_ROUTE = '/api/gemini';
const DEFAULT_ERROR_MESSAGE = "Le service d'assistance IA est temporairement indisponible.";

type GeminiApiSuccess<T> = {
  result: T;
};

type GeminiApiError = {
  error?: string;
};

export class GeminiService {
  private static instance: GeminiService;

  private constructor() {}

  public static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }

    return GeminiService.instance;
  }

  public isAvailable(): boolean {
    return typeof fetch === 'function';
  }

  private async request<TResult>(action: GeminiAction, payload: GeminiPayloadMap[GeminiAction]): Promise<TResult> {
    // La route vérifie la session : on joint le jeton du compte connecté.
    const { data: session } = await supabase.auth.getSession();
    const jeton = session?.session?.access_token;
    const response = await fetch(GEMINI_API_ROUTE, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(jeton ? { Authorization: `Bearer ${jeton}` } : {}),
      },
      body: JSON.stringify({ action, payload }),
    });

    const data = (await response.json().catch(() => null)) as (GeminiApiSuccess<TResult> & GeminiApiError) | null;

    if (!response.ok) {
      throw new Error(data?.error || DEFAULT_ERROR_MESSAGE);
    }

    if (!data || !('result' in data)) {
      throw new Error(DEFAULT_ERROR_MESSAGE);
    }

    return data.result;
  }

  public async generateAmbitionAdvice(
    ambition: Partial<Ambition>,
    companyProfile?: CompanyProfile
  ): Promise<string[]> {
    return this.request<string[]>('generate-ambition-advice', { ambition, companyProfile });
  }

  public async generateKeyResultAdvice(
    keyResult: Partial<KeyResult>,
    companyProfile?: CompanyProfile
  ): Promise<string[]> {
    return this.request<string[]>('generate-key-result-advice', { keyResult, companyProfile });
  }

  public async generateCompanyQuestions(existingProfile?: Partial<CompanyProfile>): Promise<string[]> {
    return this.request<string[]>('generate-company-questions', { existingProfile });
  }

  public async generateQuarterRetrospective(input: QuarterRetrospectiveInput): Promise<string> {
    return this.request<string>('generate-quarter-retrospective', input);
  }
}

export const geminiService = GeminiService.getInstance();
