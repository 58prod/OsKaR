import type { ToolIdentity } from '@/hooks/useToolSession';

const CLIENT_ID_KEY = 'oskar.tool.clientId';
const NAME_KEY = 'oskar.tool.name';
const COLOR_KEY = 'oskar.tool.color';

/** Palette de couleurs participants (alignée sur les maquettes Oskar). */
export const PARTICIPANT_PALETTE = [
  '#f59e0b', '#3b82f6', '#ec4899', '#8b5cf6',
  '#10b981', '#f97316', '#06b6d4', '#ef4444',
];

function randomId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
}

/**
 * Identifiant client stable et persistant (localStorage).
 * Garantit qu'un rafraîchissement de page conserve la même identité
 * (et donc le statut d'hôte le cas échéant).
 */
export function getOrCreateClientId(): string {
  if (typeof window === 'undefined') return randomId();
  try {
    let id = window.localStorage.getItem(CLIENT_ID_KEY);
    if (!id) {
      id = randomId();
      window.localStorage.setItem(CLIENT_ID_KEY, id);
    }
    return id;
  } catch {
    return randomId();
  }
}

/** Couleur stable associée au client (persistée). */
export function getOrCreateColor(): string {
  if (typeof window === 'undefined') return PARTICIPANT_PALETTE[0];
  try {
    let color = window.localStorage.getItem(COLOR_KEY);
    if (!color) {
      color = PARTICIPANT_PALETTE[Math.floor(Math.random() * PARTICIPANT_PALETTE.length)];
      window.localStorage.setItem(COLOR_KEY, color);
    }
    return color;
  } catch {
    return PARTICIPANT_PALETTE[0];
  }
}

/** Dernier prénom utilisé (pré-remplissage du formulaire de connexion). */
export function getLastName(): string {
  if (typeof window === 'undefined') return '';
  try {
    return window.localStorage.getItem(NAME_KEY) ?? '';
  } catch {
    return '';
  }
}

/** Construit (et persiste) l'identité à partir d'un prénom saisi. */
export function buildIdentity(name: string): ToolIdentity {
  const trimmed = name.trim().slice(0, 20);
  try {
    if (typeof window !== 'undefined') window.localStorage.setItem(NAME_KEY, trimmed);
  } catch {
    /* localStorage indisponible : on continue sans persister le nom */
  }
  return { id: getOrCreateClientId(), name: trimmed, color: getOrCreateColor() };
}
