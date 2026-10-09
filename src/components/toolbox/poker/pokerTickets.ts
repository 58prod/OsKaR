/**
 * Liste des tickets du Planning Poker : l'animateur la prépare, la modifie et
 * la priorise ; un ticket estimé est barré, et peut être réestimé.
 *
 * Chaque champ modifiable porte l'heure de sa dernière modification : le plus
 * récent l'emporte, quel que soit l'ordre d'arrivée des messages. La priorité
 * est un nombre (`ordre`) : déplacer un ticket lui donne une valeur entre ses
 * deux nouveaux voisins, sans toucher aux autres.
 */

export const TICKET_TITRE_MAX = 200;
export const TICKET_URL_MAX = 500;

export interface PokerTicket {
  id: string;
  titre: string;
  /** Lien vers le ticket (http ou https uniquement), ou ''. */
  url: string;
  editAt: number;
  /** Priorité : les plus petits en tête. */
  ordre: number;
  ordreAt: number;
  /** Estimation retenue, ou null tant que le ticket n'est pas estimé. */
  estimation: string | null;
  estimationAt: number;
}

export type TicketOp =
  | { t: 'ticketAdd'; id: string; titre: string; url: string; ordre: number; at: number }
  | { t: 'ticketEdit'; id: string; titre: string; url: string; at: number }
  | { t: 'ticketMove'; id: string; ordre: number; at: number }
  | { t: 'ticketDelete'; id: string }
  /** Estimation corrigée à la main, ou effacée (null) pour réestimer. */
  | { t: 'ticketEstimation'; id: string; estimation: string | null; at: number };

/** Une adresse qu'on peut ouvrir sans risque (http/https), sinon ''. */
export function urlSure(raw: unknown): string {
  if (typeof raw !== 'string') return '';
  const texte = raw.trim().slice(0, TICKET_URL_MAX);
  if (!texte) return '';
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:/i.test(texte) ? texte : `https://${texte}`);
    return u.protocol === 'http:' || u.protocol === 'https:' ? u.href : '';
  } catch {
    return '';
  }
}

export const titreSur = (raw: unknown): string =>
  typeof raw === 'string' ? raw.trim().slice(0, TICKET_TITRE_MAX) : '';

const nombre = (v: unknown, defaut = 0) => (typeof v === 'number' && Number.isFinite(v) ? v : defaut);

/** Tri par priorité, l'identifiant départageant deux tickets ajoutés en même temps. */
export function trierTickets(tickets: PokerTicket[]): PokerTicket[] {
  return [...tickets].sort((a, b) => a.ordre - b.ordre || (a.id < b.id ? -1 : a.id > b.id ? 1 : 0));
}

/** Liste relue d'un état enregistré ou reçu du réseau. */
export function lireTickets(raw: unknown): PokerTicket[] {
  if (!Array.isArray(raw)) return [];
  const vus = new Set<string>();
  const out: PokerTicket[] = [];
  raw.forEach((r) => {
    const t = r as Partial<PokerTicket> | null;
    if (!t || typeof t.id !== 'string' || !t.id || vus.has(t.id)) return;
    vus.add(t.id);
    out.push({
      id: t.id,
      titre: titreSur(t.titre),
      url: urlSure(t.url),
      editAt: nombre(t.editAt),
      ordre: nombre(t.ordre),
      ordreAt: nombre(t.ordreAt),
      estimation: typeof t.estimation === 'string' ? t.estimation.slice(0, 20) : null,
      estimationAt: nombre(t.estimationAt),
    });
  });
  return trierTickets(out);
}

interface AvecTickets {
  tickets: PokerTicket[];
  ticketsSupprimes: string[];
  ticketCourant: string | null;
  story: string;
  storyUrl: string;
}

const remplacer = (liste: PokerTicket[], ticket: PokerTicket) =>
  trierTickets(liste.map((t) => (t.id === ticket.id ? ticket : t)));

/** Applique une opération sur la liste des tickets. */
export function appliquerTicket<S extends AvecTickets>(state: S, op: TicketOp): S {
  if (!op.id || state.ticketsSupprimes.includes(op.id)) return state;
  const actuel = state.tickets.find((t) => t.id === op.id);
  switch (op.t) {
    case 'ticketAdd': {
      if (actuel) return state;
      const titre = titreSur(op.titre);
      if (!titre) return state;
      const ticket: PokerTicket = {
        id: op.id, titre, url: urlSure(op.url), editAt: op.at,
        ordre: nombre(op.ordre), ordreAt: op.at, estimation: null, estimationAt: 0,
      };
      return { ...state, tickets: trierTickets([...state.tickets, ticket]) };
    }
    case 'ticketEdit': {
      const titre = titreSur(op.titre);
      if (!actuel || !titre || op.at <= actuel.editAt) return state;
      const ticket = { ...actuel, titre, url: urlSure(op.url), editAt: op.at };
      // Le ticket en cours d'estimation est aussi celui de la barre du haut.
      const courant = state.ticketCourant === op.id ? { story: ticket.titre, storyUrl: ticket.url } : {};
      return { ...state, ...courant, tickets: remplacer(state.tickets, ticket) };
    }
    case 'ticketMove':
      if (!actuel || op.at <= actuel.ordreAt) return state;
      return { ...state, tickets: remplacer(state.tickets, { ...actuel, ordre: nombre(op.ordre), ordreAt: op.at }) };
    case 'ticketDelete':
      return {
        ...state,
        tickets: state.tickets.filter((t) => t.id !== op.id),
        ticketsSupprimes: [...state.ticketsSupprimes, op.id],
        ticketCourant: state.ticketCourant === op.id ? null : state.ticketCourant,
      };
    case 'ticketEstimation':
      if (!actuel || op.at <= actuel.estimationAt) return state;
      return {
        ...state,
        tickets: remplacer(state.tickets, {
          ...actuel,
          estimation: typeof op.estimation === 'string' ? op.estimation.slice(0, 20) : null,
          estimationAt: op.at,
        }),
      };
    default:
      return state;
  }
}

/** Priorité à donner à un ticket ajouté en fin de liste. */
export function ordreEnFin(tickets: PokerTicket[]): number {
  return tickets.length ? Math.max(...tickets.map((t) => t.ordre)) + 1 : 1;
}

/**
 * Priorité d'un ticket monté (sens -1) ou descendu (+1) d'un cran : entre ses
 * deux nouveaux voisins. null s'il est déjà en tête (ou en fin).
 */
export function ordreDeplace(tickets: PokerTicket[], id: string, sens: -1 | 1): number | null {
  const liste = trierTickets(tickets);
  const i = liste.findIndex((t) => t.id === id);
  const cible = i + sens;
  if (i < 0 || cible < 0 || cible >= liste.length) return null;
  const voisin = liste[cible].ordre;
  const auDela = liste[cible + sens]?.ordre;
  if (auDela === undefined) return voisin + sens;
  return (voisin + auDela) / 2;
}

/** Prochain ticket à estimer : le premier non estimé, hors ticket en cours. */
export function ticketSuivant(tickets: PokerTicket[], courant: string | null): PokerTicket | null {
  return trierTickets(tickets).find((t) => t.estimation === null && t.id !== courant) ?? null;
}
