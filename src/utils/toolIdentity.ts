import type { ToolIdentity } from '@/hooks/useToolSession';

const CLIENT_ID_KEY = 'oskar.tool.clientId';
const NAME_KEY = 'oskar.tool.name';
const COLOR_KEY = 'oskar.tool.color';

/**
 * Couleurs des participants, choisies pour rester distinctes deux à deux
 * (l'ancienne palette avait un ambre et un orange impossibles à séparer).
 */
export const PARTICIPANT_COLORS: { valeur: string; nom: string }[] = [
  { valeur: '#2563eb', nom: 'Bleu' },
  { valeur: '#dc2626', nom: 'Rouge' },
  { valeur: '#16a34a', nom: 'Vert' },
  { valeur: '#f97316', nom: 'Orange' },
  { valeur: '#7c3aed', nom: 'Violet' },
  { valeur: '#db2777', nom: 'Rose' },
  { valeur: '#0891b2', nom: 'Cyan' },
  { valeur: '#ca8a04', nom: 'Moutarde' },
  { valeur: '#92400e', nom: 'Marron' },
  { valeur: '#475569', nom: 'Ardoise' },
  { valeur: '#84cc16', nom: 'Anis' },
  { valeur: '#c026d3', nom: 'Fuchsia' },
];

export const PARTICIPANT_PALETTE = PARTICIPANT_COLORS.map((c) => c.valeur);

/** Nom d'une couleur de la palette (« Bleu »…), pour les libellés. */
export function nomCouleur(valeur: string): string {
  return PARTICIPANT_COLORS.find((c) => c.valeur === valeur)?.nom ?? 'Couleur';
}

/**
 * Première couleur de la palette que personne d'autre n'a ; `actuelle` si
 * elle est libre. Toutes prises : on garde `actuelle`.
 */
export function couleurLibre(prises: string[], actuelle: string): string {
  const set = new Set(prises);
  if (!set.has(actuelle)) return actuelle;
  return PARTICIPANT_PALETTE.find((c) => !set.has(c)) ?? actuelle;
}

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

const couleurAuHasard = () => PARTICIPANT_PALETTE[Math.floor(Math.random() * PARTICIPANT_PALETTE.length)];

/** Couleur stable associée au client (persistée) ; tirée au hasard la première fois. */
export function getOrCreateColor(): string {
  if (typeof window === 'undefined') return PARTICIPANT_PALETTE[0];
  try {
    let color = window.localStorage.getItem(COLOR_KEY);
    // Couleur de l'ancienne palette : on en tire une nouvelle.
    if (!color || !PARTICIPANT_PALETTE.includes(color)) {
      color = couleurAuHasard();
      window.localStorage.setItem(COLOR_KEY, color);
    }
    return color;
  } catch {
    // Stockage indisponible : au hasard plutôt que tout le monde de la même couleur.
    return couleurAuHasard();
  }
}

const ecouteursCouleur = new Set<(color: string) => void>();

/** Être prévenu d'un changement de couleur (choix de la personne ou couleur déjà prise). */
export function ecouterCouleur(f: (color: string) => void): () => void {
  ecouteursCouleur.add(f);
  return () => { ecouteursCouleur.delete(f); };
}

/**
 * Change sa couleur, appliquée tout de suite. Un choix de la personne est
 * mémorisé pour les prochaines sessions ; une couleur attribuée parce que la
 * sienne était prise (`memoriser` à false) ne l'est pas.
 */
export function changerCouleur(color: string, memoriser = true): void {
  try {
    if (memoriser && typeof window !== 'undefined') window.localStorage.setItem(COLOR_KEY, color);
  } catch {
    /* stockage indisponible : la couleur vaut pour cette page */
  }
  ecouteursCouleur.forEach((f) => f(color));
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

/** Construit (et persiste) l'identité à partir d'un prénom saisi et, s'il y en a une, de la couleur choisie. */
export function buildIdentity(name: string, color?: string): ToolIdentity {
  const trimmed = name.trim().slice(0, 20);
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(NAME_KEY, trimmed);
      if (color && PARTICIPANT_PALETTE.includes(color)) window.localStorage.setItem(COLOR_KEY, color);
    }
  } catch {
    /* localStorage indisponible : on continue sans persister le nom */
  }
  const chosen = color && PARTICIPANT_PALETTE.includes(color) ? color : getOrCreateColor();
  return { id: getOrCreateClientId(), name: trimmed, color: chosen };
}
