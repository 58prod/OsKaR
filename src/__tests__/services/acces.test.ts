import { niveauAcces, etapeAccessible, ETAPES_OFFERTES } from '@/lib/acces';
import type { Subscription } from '@/types';

/*
 * Règles d'accès posées par Christophe le 2026-09-10. Elles décident de ce que
 * l'on paie : elles méritent d'être verrouillées ici plutôt que vérifiées à la
 * main dans le navigateur.
 */

const abonnement = (planType: Subscription['planType'], status: Subscription['status'] = 'active') =>
  ({ planType, status } as Subscription);

describe("Niveau d'accès", () => {
  it('un visiteur non connecté est un visiteur', () => {
    expect(niveauAcces(false, null)).toBe('visiteur');
    expect(niveauAcces(false, abonnement('pro'))).toBe('visiteur');
  });

  it('un compte sans abonnement chargé est traité comme gratuit, jamais comme abonné', () => {
    expect(niveauAcces(true, null)).toBe('gratuit');
    expect(niveauAcces(true, undefined)).toBe('gratuit');
  });

  it('le plan gratuit reste gratuit', () => {
    expect(niveauAcces(true, abonnement('free'))).toBe('gratuit');
  });

  it('une formule payante active donne le niveau abonné', () => {
    expect(niveauAcces(true, abonnement('pro'))).toBe('abonne');
    expect(niveauAcces(true, abonnement('team'))).toBe('abonne');
    expect(niveauAcces(true, abonnement('unlimited'))).toBe('abonne');
    expect(niveauAcces(true, abonnement('pro', 'trialing'))).toBe('abonne');
  });

  it("une formule expirée ou annulée ne donne plus l'accès", () => {
    expect(niveauAcces(true, abonnement('pro', 'expired'))).toBe('gratuit');
    expect(niveauAcces(true, abonnement('pro', 'cancelled'))).toBe('gratuit');
  });

  it('une formule offerte donne accès jusqu’à sa date de fin, pas au-delà', () => {
    const jusqua = (decalage: number) =>
      ({ ...abonnement('unlimited'), expiresAt: new Date(Date.now() + decalage) } as Subscription);
    expect(niveauAcces(true, jusqua(24 * 60 * 60 * 1000))).toBe('abonne');
    expect(niveauAcces(true, jusqua(-1000))).toBe('gratuit');
  });
});

describe("Accès aux étapes d'un atelier", () => {
  it("un visiteur n'accède à aucune étape : il lui faut au moins un compte", () => {
    expect(etapeAccessible('visiteur', 0)).toBe(false);
    expect(etapeAccessible('visiteur', 1)).toBe(false);
  });

  it('un compte gratuit accède à la première étape, et seulement à elle', () => {
    expect(etapeAccessible('gratuit', 0)).toBe(true);
    expect(etapeAccessible('gratuit', 1)).toBe(false);
    expect(etapeAccessible('gratuit', 2)).toBe(false);
  });

  it('un abonné accède à tout', () => {
    expect(etapeAccessible('abonne', 0)).toBe(true);
    expect(etapeAccessible('abonne', 1)).toBe(true);
    expect(etapeAccessible('abonne', 7)).toBe(true);
  });

  it('la règle vaut pour les ateliers à venir, quel que soit leur nombre d’étapes', () => {
    // Vision en 8 étapes, Finance en 4, Team en 6 : même première étape offerte.
    expect(ETAPES_OFFERTES).toBe(1);
    for (const atelier of [8, 4, 6]) {
      const etapes = Array.from({ length: atelier }, (_, i) => etapeAccessible('gratuit', i));
      expect(etapes.filter(Boolean)).toHaveLength(ETAPES_OFFERTES);
    }
  });
});
