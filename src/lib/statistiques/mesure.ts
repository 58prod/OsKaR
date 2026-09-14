/*
 * Mesure d'audience d'Oskar (migration 20260914_statistiques) : les règles,
 * sans navigateur ni base, testées dans __tests__/lib/statistiques.test.ts.
 * Le branchement sur les pages est dans components/MesureAudience.
 *
 * Tenue dans le cadre de l'exemption de consentement de la CNIL : identifiant
 * aléatoire propre à Oskar, renouvelé tous les 13 mois, aucun lien avec le
 * compte, refus possible (clé CLE_REFUS), Global Privacy Control respecté.
 */

export const CLE_VISITEUR = 'oskar.visiteur';
export const CLE_REFUS = 'oskar.mesure.refus';
/** Dans le sessionStorage : la visite en cours dans cet onglet. */
export const CLE_VISITE = 'oskar.visite';

const UNE_MINUTE = 60 * 1000;
const UN_JOUR = 24 * 60 * UNE_MINUTE;

/** Durée de vie de l'identifiant de visiteur : 13 mois. */
export const VIE_VISITEUR = 395 * UN_JOUR;
/** Au-delà de 30 minutes sans nouvelle page, c'est une nouvelle visite. */
export const PAUSE_VISITE = 30 * UNE_MINUTE;
/** Temps compté au plus sur une page, en secondes (onglet oublié ouvert). */
export const DUREE_MAX_PAGE = 1800;

export type Appareil = 'mobile' | 'tablette' | 'ordinateur';

export interface Stockage {
  getItem(cle: string): string | null;
  setItem(cle: string, valeur: string): void;
}

/** « www.oskar-coach.fr » et « oskar-coach.fr » sont le même site. */
export function hoteMesure(hostname: string): string {
  return hostname.trim().toLowerCase().replace(/^www\./, '');
}

const HOTE_LOCAL = /^(localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])$|\.local$/;

/** Rien n'est compté en local (la base est partagée) ni pour qui a refusé. */
export function mesureAutorisee(c: {
  hote: string;
  refus: boolean;
  gpc?: boolean;
  dnt?: string | null;
  robot?: boolean;
}): boolean {
  if (!c.hote || HOTE_LOCAL.test(c.hote)) return false;
  return !c.refus && !c.gpc && c.dnt !== '1' && !c.robot;
}

/**
 * Pages non comptées : l'administration, les retours techniques de connexion
 * et les pages d'erreur. `chemin` est le modèle Next (`router.pathname`) :
 * les adresses à jeton restent anonymes (/invitations/[token]).
 */
export function cheminMesurable(chemin: string): boolean {
  if (!chemin.startsWith('/')) return false;
  return !/^\/(_|(admin|api|404|500)(\/|$))/.test(chemin) && !/^\/auth\/(callback|confirm)(\/|$)/.test(chemin);
}

/**
 * D'où arrive le visiteur : le paramètre utm_source d'un lien de campagne,
 * sinon le site précédent. `null` pour un accès direct ou une page d'Oskar.
 */
export function provenance(referrer: string, hoteCourant: string, recherche = ''): string | null {
  try {
    const utm = new URLSearchParams(recherche).get('utm_source')?.trim().toLowerCase();
    if (utm) return utm.slice(0, 100);
  } catch {
    /* paramètres illisibles : on regarde le site précédent */
  }
  if (!referrer) return null;
  try {
    const h = hoteMesure(new URL(referrer).hostname);
    return h && h !== hoteMesure(hoteCourant) ? h : null;
  } catch {
    return null;
  }
}

/** Selon la largeur de la fenêtre, comme les points de rupture de l'app. */
export function appareil(largeur: number): Appareil {
  if (largeur < 640) return 'mobile';
  if (largeur < 1024) return 'tablette';
  return 'ordinateur';
}

function lireJson<T>(s: Stockage, cle: string): T | null {
  try {
    return JSON.parse(s.getItem(cle) ?? 'null') as T | null;
  } catch {
    return null;
  }
}

function ecrire(s: Stockage, cle: string, valeur: unknown) {
  try {
    s.setItem(cle, JSON.stringify(valeur));
  } catch {
    /* stockage indisponible : un nouvel identifiant à chaque page, sans conséquence */
  }
}

/** L'identifiant anonyme de ce navigateur, renouvelé au bout de 13 mois. */
export function identifiantVisiteur(s: Stockage, maintenant: number, nouvelId: () => string): string {
  const v = lireJson<{ id?: string; depuis?: number }>(s, CLE_VISITEUR);
  if (v?.id && typeof v.depuis === 'number' && maintenant - v.depuis < VIE_VISITEUR) return v.id;
  const id = nouvelId();
  ecrire(s, CLE_VISITEUR, { id, depuis: maintenant });
  return id;
}

/** La visite en cours dans l'onglet, prolongée à chaque page. */
export function identifiantVisite(
  s: Stockage,
  maintenant: number,
  nouvelId: () => string
): { id: string; nouvelle: boolean } {
  const v = lireJson<{ id?: string; vu?: number }>(s, CLE_VISITE);
  const enCours = !!v?.id && typeof v.vu === 'number' && maintenant - v.vu < PAUSE_VISITE;
  const id = enCours ? (v?.id as string) : nouvelId();
  ecrire(s, CLE_VISITE, { id, vu: maintenant });
  return { id, nouvelle: !enCours };
}

/** Temps passé sur une page, onglet visible seulement. Horloge en millisecondes. */
export class Chrono {
  private cumul = 0;
  private depuis: number | null;

  constructor(maintenant: number, visible: boolean) {
    this.depuis = visible ? maintenant : null;
  }

  pause(maintenant: number) {
    if (this.depuis == null) return;
    this.cumul += Math.max(0, maintenant - this.depuis);
    this.depuis = null;
  }

  reprise(maintenant: number) {
    if (this.depuis == null) this.depuis = maintenant;
  }

  /** Secondes écoulées, plafonnées à DUREE_MAX_PAGE. */
  secondes(maintenant: number): number {
    const ms = this.cumul + (this.depuis == null ? 0 : Math.max(0, maintenant - this.depuis));
    return Math.min(DUREE_MAX_PAGE, Math.round(ms / 1000));
  }
}

/** UUID v4 ; `crypto.randomUUID` n'existe qu'en HTTPS. */
export function uuid(): string {
  const c = typeof crypto !== 'undefined' ? crypto : undefined;
  if (c?.randomUUID) return c.randomUUID();
  const o = new Uint8Array(16);
  if (c?.getRandomValues) c.getRandomValues(o);
  else for (let i = 0; i < 16; i++) o[i] = Math.floor(Math.random() * 256);
  o[6] = (o[6] & 0x0f) | 0x40;
  o[8] = (o[8] & 0x3f) | 0x80;
  const h = Array.from(o, (b) => b.toString(16).padStart(2, '0')).join('');
  return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
}
