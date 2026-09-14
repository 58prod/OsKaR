import type { NextApiRequest, NextApiResponse } from 'next';
import { GoogleGenerativeAI } from '@google/generative-ai';
import {
  buildAmbitionPrompt,
  buildCompanyQuestionsPrompt,
  buildKeyResultPrompt,
  buildQuarterRetrospectivePrompt,
  DEFAULT_GEMINI_MODEL,
  parseAdviceResponse,
  parseQuestionsResponse,
  type GeminiPayloadMap,
  type QuarterRetrospectiveInput,
} from '@/lib/gemini-shared';
import { utilisateurDuJeton } from '@/lib/auth/utilisateurDuJeton';

/** Taille maximale, en caractères, des données jointes à une demande. */
const TAILLE_MAX_DEMANDE = 20_000;

type GeminiModel = ReturnType<GoogleGenerativeAI['getGenerativeModel']>;

type ApiResponse<T> =
  | { result: T }
  | { error: string };

let cachedModel: GeminiModel | null = null;
let cachedModelName: string | null = null;

function getRequestBody(req: NextApiRequest) {
  if (typeof req.body === 'string') {
    try {
      return JSON.parse(req.body);
    } catch {
      return null;
    }
  }

  return req.body;
}

function getGeminiModel(): GeminiModel | null {
  const apiKey = process.env.GEMINI_API_KEY;
  const modelName = process.env.GEMINI_MODEL || DEFAULT_GEMINI_MODEL;

  if (!apiKey || apiKey === 'your_gemini_api_key_here') {
    return null;
  }

  if (!cachedModel || cachedModelName !== modelName) {
    const client = new GoogleGenerativeAI(apiKey);
    cachedModel = client.getGenerativeModel({ model: modelName });
    cachedModelName = modelName;
  }

  return cachedModel;
}

function getPublicError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  const normalizedMessage = message.toLowerCase();

  if (normalizedMessage.includes('404') || normalizedMessage.includes('not found')) {
    return {
      status: 502,
      message: "Le modèle d'assistance IA demandé n'est pas disponible.",
    };
  }

  if (normalizedMessage.includes('api key')) {
    return {
      status: 502,
      message: "Le service d'assistance IA n'a pas pu être authentifié.",
    };
  }

  return {
    status: 502,
    message: "Le service d'assistance IA est temporairement indisponible.",
  };
}

async function generateText(prompt: string): Promise<string> {
  const model = getGeminiModel();

  if (!model) {
    throw new Error('GEMINI_NOT_CONFIGURED');
  }

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse<string | string[]>>
) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Méthode non autorisée.' });
  }

  const body = getRequestBody(req) as
    | { action?: keyof GeminiPayloadMap; payload?: GeminiPayloadMap[keyof GeminiPayloadMap] }
    | null;

  if (!body?.action || body.payload === undefined) {
    return res.status(400).json({ error: 'Requête IA invalide.' });
  }

  // Chaque appel consomme des crédits Gemini : réservé aux comptes connectés,
  // et une demande démesurée est refusée avant d'atteindre le modèle.
  if (!(await utilisateurDuJeton(req))) {
    return res.status(401).json({ error: "Connectez-vous pour utiliser l'assistant IA." });
  }
  if (JSON.stringify(body.payload).length > TAILLE_MAX_DEMANDE) {
    return res.status(413).json({ error: 'Demande trop volumineuse pour l’assistant IA.' });
  }

  try {
    switch (body.action) {
      case 'generate-ambition-advice': {
        const payload = body.payload as GeminiPayloadMap['generate-ambition-advice'];
        const prompt = buildAmbitionPrompt(payload.ambition, payload.companyProfile);
        const text = await generateText(prompt);
        return res.status(200).json({ result: parseAdviceResponse(text) });
      }

      case 'generate-key-result-advice': {
        const payload = body.payload as GeminiPayloadMap['generate-key-result-advice'];
        const prompt = buildKeyResultPrompt(payload.keyResult, payload.companyProfile);
        const text = await generateText(prompt);
        return res.status(200).json({ result: parseAdviceResponse(text) });
      }

      case 'generate-company-questions': {
        const payload = body.payload as GeminiPayloadMap['generate-company-questions'];
        const prompt = buildCompanyQuestionsPrompt(payload.existingProfile);
        const text = await generateText(prompt);
        return res.status(200).json({ result: parseQuestionsResponse(text) });
      }

      case 'generate-quarter-retrospective': {
        const payload = body.payload as QuarterRetrospectiveInput;
        const prompt = buildQuarterRetrospectivePrompt(payload);
        const text = await generateText(prompt);
        return res.status(200).json({ result: text.trim() || 'Rétrospective indisponible.' });
      }

      default:
        return res.status(400).json({ error: 'Action IA non reconnue.' });
    }
  } catch (error) {
    if (error instanceof Error && error.message === 'GEMINI_NOT_CONFIGURED') {
      return res.status(503).json({ error: "L'assistant IA n'est pas configuré pour cet environnement." });
    }

    const publicError = getPublicError(error);
    const rawMessage = error instanceof Error ? error.message : String(error);
    console.error('[gemini-api] request failed:', rawMessage);

    return res.status(publicError.status).json({ error: publicError.message });
  }
}