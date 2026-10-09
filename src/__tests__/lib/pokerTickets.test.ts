import {
  INITIAL_POKER_STATE, estimationRetenue, pokerReducer, type PokerOp, type PokerState,
} from '@/components/toolbox/poker/pokerLogic';
import { ordreDeplace, ordrePourPosition, ticketSuivant, urlSure } from '@/components/toolbox/poker/pokerTickets';

/*
 * Liste des tickets du Planning Poker : préparée, modifiée et priorisée par
 * l'animateur, estimée à la révélation. Chaque écran applique les opérations
 * dans l'ordre où elles lui arrivent : tous doivent aboutir au même état.
 */

const appliquer = (ops: PokerOp[], depart: PokerState = INITIAL_POKER_STATE) => ops.reduce(pokerReducer, depart);
const arret = { ...INITIAL_POKER_STATE.chrono };
const ajout = (id: string, titre: string, ordre: number, at = 1): PokerOp =>
  ({ t: 'ticketAdd', id, titre, url: '', ordre, at });
const trois = appliquer([ajout('a', 'Connexion', 1), ajout('b', 'Panier', 2), ajout('c', 'Paiement', 3)]);
const titres = (s: PokerState) => s.tickets.map((t) => t.titre);

describe('Tickets — adresse', () => {
  it('n’accepte que des liens http ou https, et complète « https:// »', () => {
    expect(urlSure('https://jira.exemple.fr/T-12')).toBe('https://jira.exemple.fr/T-12');
    expect(urlSure('jira.exemple.fr/T-12')).toBe('https://jira.exemple.fr/T-12');
    expect(urlSure('javascript:alert(1)')).toBe('');
    expect(urlSure('data:text/html,<b>x</b>')).toBe('');
    expect(urlSure('   ')).toBe('');
  });

  it('nettoie une adresse dangereuse reçue du réseau', () => {
    const s = appliquer([{ t: 'ticketAdd', id: 'x', titre: 'T', url: 'javascript:alert(1)', ordre: 1, at: 1 }]);
    expect(s.tickets[0].url).toBe('');
    expect(pokerReducer(s, { t: 'storyUrl', storyUrl: 'javascript:alert(1)' }).storyUrl).toBe('');
  });
});

describe('Tickets — préparation et priorité', () => {
  it('range les tickets par priorité, quel que soit l’ordre d’arrivée', () => {
    const inverse = appliquer([ajout('c', 'Paiement', 3), ajout('a', 'Connexion', 1), ajout('b', 'Panier', 2)]);
    expect(titres(trois)).toEqual(['Connexion', 'Panier', 'Paiement']);
    expect(inverse.tickets).toEqual(trois.tickets);
  });

  it('ignore un ajout reçu deux fois et un ticket sans titre', () => {
    expect(appliquer([ajout('a', 'Connexion', 9)], trois)).toEqual(trois);
    expect(appliquer([ajout('d', '   ', 4)], trois).tickets).toHaveLength(3);
  });

  it('monte et descend un ticket entre ses voisins', () => {
    const monte = ordreDeplace(trois.tickets, 'c', -1)!;
    const s = pokerReducer(trois, { t: 'ticketMove', id: 'c', ordre: monte, at: 2 });
    expect(titres(s)).toEqual(['Connexion', 'Paiement', 'Panier']);
    expect(ordreDeplace(s.tickets, 'a', -1)).toBeNull();
    const enTete = ordreDeplace(s.tickets, 'c', -1)!;
    expect(titres(pokerReducer(s, { t: 'ticketMove', id: 'c', ordre: enTete, at: 3 }))).toEqual(['Paiement', 'Connexion', 'Panier']);
  });

  it('garde la modification la plus récente, même reçue en premier', () => {
    const v1: PokerOp = { t: 'ticketEdit', id: 'b', titre: 'Panier v1', url: '', at: 5 };
    const v2: PokerOp = { t: 'ticketEdit', id: 'b', titre: 'Panier v2', url: 'jira/T-2', at: 6 };
    expect(appliquer([v1, v2], trois).tickets).toEqual(appliquer([v2, v1], trois).tickets);
    expect(appliquer([v2, v1], trois).tickets[1]).toMatchObject({ titre: 'Panier v2', url: 'https://jira/T-2' });
  });

  it('ne fait pas revenir un ticket supprimé', () => {
    const s = appliquer([
      { t: 'ticketDelete', id: 'b' },
      ajout('b', 'Panier', 2),
      { t: 'ticketEdit', id: 'b', titre: 'Panier bis', url: '', at: 9 },
    ], trois);
    expect(titres(s)).toEqual(['Connexion', 'Paiement']);
  });
});

describe('Tickets — estimation', () => {
  const enCours = pokerReducer(trois, { t: 'newRound', round: 1, ticketId: 'a', story: 'Connexion', storyUrl: 'jira/T-1' });
  const votes = { alice: '3', bruno: '5' };

  it('met le ticket choisi dans la barre du haut, votes effacés', () => {
    expect(enCours).toMatchObject({ ticketCourant: 'a', story: 'Connexion', storyUrl: 'https://jira/T-1', round: 1, votes: {} });
  });

  it('inscrit l’estimation sur le ticket à la révélation', () => {
    const s = pokerReducer(enCours, {
      t: 'reveal', round: 1, votes, chrono: arret, ticketId: 'a', estimation: estimationRetenue(votes)!, at: 10,
    });
    expect(s.tickets.find((t) => t.id === 'a')?.estimation).toBe('4');
    expect(ticketSuivant(s.tickets, s.ticketCourant)?.id).toBe('b');
  });

  it('réestimer efface l’estimation, la révélation suivante la remplace', () => {
    const estime = pokerReducer(enCours, { t: 'reveal', round: 1, votes, chrono: arret, ticketId: 'a', estimation: '4', at: 10 });
    const efface = pokerReducer(estime, { t: 'ticketEstimation', id: 'a', estimation: null, at: 11 });
    expect(efface.tickets[0].estimation).toBeNull();
    const rejoue = pokerReducer(efface, { t: 'newRound', round: 2, ticketId: 'a', story: 'Connexion', storyUrl: '' });
    const s = pokerReducer(rejoue, { t: 'reveal', round: 2, votes: { alice: '8' }, chrono: arret, ticketId: 'a', estimation: '8', at: 12 });
    expect(s.tickets[0].estimation).toBe('8');
  });

  it('retient la valeur la plus votée quand rien n’est chiffré', () => {
    expect(estimationRetenue({ a: 'M', b: 'L', c: 'M' })).toBe('M');
    expect(estimationRetenue({})).toBeNull();
  });

  it('fait suivre la barre du haut et le ticket en cours', () => {
    const titre = pokerReducer(enCours, { t: 'story', story: 'Connexion SSO' });
    expect(titre.tickets[0].titre).toBe('Connexion SSO');
    const lien = pokerReducer(enCours, { t: 'ticketEdit', id: 'a', titre: 'Connexion', url: 'jira/T-9', at: 20 });
    expect(lien.storyUrl).toBe('https://jira/T-9');
  });

  it('libère la barre du haut si le ticket en cours est supprimé', () => {
    expect(pokerReducer(enCours, { t: 'ticketDelete', id: 'a' }).ticketCourant).toBeNull();
  });
});

describe('Tickets — glisser-déposer', () => {
  const placer = (s: PokerState, id: string, position: number) => {
    const ordre = ordrePourPosition(s.tickets, id, position);
    return ordre === null ? s : pokerReducer(s, { t: 'ticketMove', id, ordre, at: 50 });
  };

  it('place un ticket en tête, au milieu ou en fin de liste', () => {
    expect(titres(placer(trois, 'c', 0))).toEqual(['Paiement', 'Connexion', 'Panier']);
    expect(titres(placer(trois, 'a', 1))).toEqual(['Panier', 'Connexion', 'Paiement']);
    expect(titres(placer(trois, 'a', 2))).toEqual(['Panier', 'Paiement', 'Connexion']);
  });

  it('ne fait rien si le ticket est lâché à sa place', () => {
    expect(ordrePourPosition(trois.tickets, 'b', 1)).toBeNull();
    expect(ordrePourPosition(trois.tickets, 'inconnu', 0)).toBeNull();
  });
});
