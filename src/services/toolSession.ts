import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';
import { TOOLBOX_CONFIG, getSessionExpiryISO, type ToolType } from '@/constants/toolbox';

/** Préfixes lisibles utilisés dans les codes de session par type d'outil. */
const CODE_PREFIX: Record<ToolType, string> = {
  'planning-poker': 'POKER',
  'roti': 'ROTI',
  'daily-standup': 'DAILY',
  'team-mood': 'MOOD',
  'idea-box': 'IDEES',
  'brainstorming': 'BRAIN',
  'disons-nous': 'DISONS',
  'en-mode-recre': 'RECRE',
  'competences': 'SKILLS',
  'retrospective': 'RETRO',
  'speedboat': 'BOAT',
};

// Caractères sans ambiguïté (pas de O/0, I/1) pour la saisie/lecture du code.
const CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

export interface ToolSessionRow {
  id: string;
  code: string;
  tool_type: string;
  host_id: string | null;
  state: any;
  created_at: string;
  updated_at: string;
  expires_at: string;
}

/** Génère un code de session lisible, ex: « POKER-7K2P ». */
export function generateSessionCode(toolType: ToolType): string {
  const prefix = CODE_PREFIX[toolType] ?? 'OSKAR';
  let suffix = '';
  for (let i = 0; i < TOOLBOX_CONFIG.sessionCodeLength; i++) {
    suffix += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
  }
  return `${prefix}-${suffix}`;
}

/**
 * Code de session déduit d'une graine : tous ceux qui partent de la même
 * graine tombent sur le même code, sans rien avoir à se transmettre. Sert à
 * enchaîner deux outils (ex: la récré après la rétro) dans un même salon.
 */
export function derivedSessionCode(toolType: ToolType, seed: string): string {
  const prefix = CODE_PREFIX[toolType] ?? 'OSKAR';
  // FNV-1a 32 bits : stable et suffisant pour répartir sur l'alphabet.
  let h = 0x811c9dc5;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  let suffix = '';
  for (let i = 0; i < TOOLBOX_CONFIG.sessionCodeLength; i++) {
    suffix += CODE_ALPHABET[h % CODE_ALPHABET.length];
    h = Math.floor(h / CODE_ALPHABET.length);
  }
  return `${prefix}-${suffix}`;
}

/** Indique si une session est expirée au regard de la rétention configurée. */
export function isExpired(row: Pick<ToolSessionRow, 'expires_at'>): boolean {
  return new Date(row.expires_at).getTime() < Date.now();
}

export const ToolSessionService = {
  /**
   * Récupère une session par code. Retourne null si introuvable ou expirée.
   */
  async get(code: string): Promise<ToolSessionRow | null> {
    if (!isSupabaseConfigured()) return null;
    const normalized = code.trim().toUpperCase();
    const { data, error } = await supabase
      .from('tool_sessions')
      .select('*')
      .eq('code', normalized)
      .maybeSingle();

    if (error) {
      console.error('❌ Erreur lecture session outil:', error.message);
      return null;
    }
    if (!data) return null;
    if (isExpired(data as ToolSessionRow)) return null;
    return data as ToolSessionRow;
  },

  /**
   * Crée une session pour un outil donné.
   * `expires_at` est calculé depuis TOOLBOX_CONFIG.sessionRetentionHours.
   */
  async create(params: {
    toolType: ToolType;
    code: string;
    hostId: string;
    state?: any;
  }): Promise<ToolSessionRow | null> {
    if (!isSupabaseConfigured()) return null;
    const { toolType, code, hostId, state = {} } = params;
    const { data, error } = await supabase
      .from('tool_sessions')
      .insert({
        code: code.trim().toUpperCase(),
        tool_type: toolType,
        host_id: hostId,
        state,
        expires_at: getSessionExpiryISO(new Date(), toolType),
      })
      .select()
      .single();

    if (error) {
      console.error('❌ Erreur création session outil:', error.message);
      return null;
    }
    return data as ToolSessionRow;
  },

  /**
   * Récupère une session existante ou la crée si absente (idempotent par code).
   */
  async getOrCreate(params: {
    toolType: ToolType;
    code: string;
    hostId: string;
    initialState?: any;
  }): Promise<ToolSessionRow | null> {
    const existing = await this.get(params.code);
    if (existing) return existing;
    return this.create({
      toolType: params.toolType,
      code: params.code,
      hostId: params.hostId,
      state: params.initialState ?? {},
    });
  },

  /**
   * Enregistre un instantané de l'état partagé (pour retardataires / refresh).
   * Prolonge également l'expiration sur activité.
   */
  async saveSnapshot(code: string, state: any, toolType?: ToolType): Promise<void> {
    if (!isSupabaseConfigured()) return;
    const { error } = await supabase
      .from('tool_sessions')
      .update({ state, expires_at: getSessionExpiryISO(new Date(), toolType) })
      .eq('code', code.trim().toUpperCase());

    if (error) {
      console.error('❌ Erreur sauvegarde instantané session:', error.message);
    }
  },

  /** Purge opportuniste des sessions expirées (best-effort). */
  async cleanupExpired(): Promise<void> {
    if (!isSupabaseConfigured()) return;
    try {
      await supabase.rpc('cleanup_expired_tool_sessions');
    } catch (e) {
      /* best-effort : on ignore les erreurs (droits, fonction absente, etc.) */
    }
  },
};
