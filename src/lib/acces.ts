import type { Subscription } from '@/types';

/*
 * Qui a le droit de faire quoi sur la plateforme.
 *
 * Règles posées par Christophe le 2026-09-10 :
 *
 *   1. L'accueil et les pages de présentation des piliers sont libres.
 *   2. Le Diagnostic et le Potentiel Produit sont libres, sans compte, et
 *      leurs résultats s'exportent par email.
 *   3. Un compte gratuit sert à retrouver ses résultats, et donne accès à la
 *      première étape de chaque atelier — de quoi se faire une idée.
 *   4. Les étapes suivantes de chaque atelier (Vision, Fit, Finance, OKR,
 *      Team) demandent une formule payante.
 *   5. Les outils collaboratifs sont en utilisation libre.
 *
 * Tout est regroupé ici pour qu'un seul fichier décide, et que les ateliers à
 * venir n'aient qu'à appeler ces fonctions.
 */

/** Ce que l'on sait de la personne devant l'écran. */
export type NiveauAcces = 'visiteur' | 'gratuit' | 'abonne';

/**
 * Niveau d'accès courant.
 * `undefined` tant que l'abonnement n'est pas chargé : on reste alors prudent
 * en traitant l'utilisateur comme gratuit, jamais comme abonné.
 */
export function niveauAcces(
  estConnecte: boolean,
  abonnement: Subscription | null | undefined
): NiveauAcces {
  if (!estConnecte) return 'visiteur';
  if (!abonnement) return 'gratuit';
  const actif = abonnement.status === 'active' || abonnement.status === 'trialing';
  return actif && abonnement.planType !== 'free' ? 'abonne' : 'gratuit';
}

/** Première étape d'un atelier : offerte à tout compte, même gratuit. */
export const ETAPES_OFFERTES = 1;

/**
 * L'étape d'atelier est-elle accessible ? `indexEtape` commence à 0.
 * Un visiteur n'a accès à rien : il lui faut au moins un compte gratuit.
 */
export function etapeAccessible(niveau: NiveauAcces, indexEtape: number): boolean {
  if (niveau === 'abonne') return true;
  if (niveau === 'gratuit') return indexEtape < ETAPES_OFFERTES;
  return false;
}

/** Message affiché quand une étape est verrouillée, selon le niveau. */
export function raisonVerrou(niveau: NiveauAcces): {
  titre: string;
  texte: string;
  bouton: string;
} {
  if (niveau === 'visiteur') {
    return {
      titre: 'Créez votre compte pour continuer',
      texte:
        'Un compte gratuit suffit pour commencer l’atelier et retrouver vos résultats à chaque visite.',
      bouton: 'Créer mon compte',
    };
  }
  // Ne rien présumer de ce que la personne a déjà fait : elle peut arriver ici
  // juste après avoir créé son compte, sans avoir rempli la première étape.
  return {
    titre: 'La suite fait partie des formules',
    texte:
      'La première étape est offerte avec votre compte. Les étapes suivantes, et les autres ateliers, sont inclus dans nos formules.',
    bouton: 'Voir les formules',
  };
}
