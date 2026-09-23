import { PILLARS } from '@/lib/diagnostic';
import { analyser4, etatInitial4, type Etat4, type Options4, type Reponse4 } from '@/lib/diagnostic4/calcul';
import type { ProfilId } from '@/lib/diagnostic4/contenu';

/*
 * Tirage de test du Diagnostic 4b (bouton « Test : remplir au hasard »).
 *
 * Tirer chaque réponse indépendamment donne presque toujours une moyenne
 * autour de 4 à 5 : on ne voyait jamais « Le stratège » ni « L'horloger ».
 * On tire donc d'abord le profil (un sur quatre), puis un niveau par pilier
 * autour de ce profil, des réponses cohérentes avec ce niveau et une
 * perception parfois juste, parfois décalée. Le tirage est recommencé tant
 * que l'analyse ne donne pas le profil visé.
 */

const PROFILS: ProfilId[] = ['horloger', 'stratege', 'batisseur', 'pilote'];
/** Niveau moyen des pratiques visé pour chaque profil (0 à 1). */
const NIVEAU_VISE: Record<ProfilId, number> = { horloger: 0.97, stratege: 0.8, batisseur: 0.5, pilote: 0.2 };

const borne = (x: number, min: number, max: number) => Math.min(max, Math.max(min, x));

function reponse(niveau: number, alea: () => number): Reponse4 {
  const r = alea();
  if (r < niveau * 0.8) return 'oui';
  if (r < niveau * 0.8 + 0.2) return 'partiel';
  const reste = alea();
  return reste < 0.7 ? 'non' : reste < 0.9 ? 'inconnu' : 'na';
}

function tirage(profil: ProfilId, alea: () => number): Etat4 {
  const etat = etatInitial4();
  etat.seul = alea() < 0.15;
  PILLARS.forEach((p) => {
    // Des piliers inégaux autour du niveau visé : c'est ce qui fait apparaître une priorité.
    const niveau = borne(NIVEAU_VISE[profil] + (alea() - 0.5) * 0.5, 0, 1);
    // Perception : proche du niveau réel, avec un dirigeant optimiste ou pessimiste une fois sur quatre.
    const biais = alea() < 0.25 ? (alea() < 0.5 ? 4 : -4) : 0;
    const perception = Math.round(borne(niveau * 10 + biais + (alea() - 0.5) * 3, 0, 10));
    etat.piliers[p.id] = { perception, reponses: [reponse(niveau, alea), reponse(niveau, alea), reponse(niveau, alea), reponse(niveau, alea)] };
  });
  return etat;
}

/** Un état complet au hasard, dont le profil est lui-même tiré au hasard parmi les quatre. */
export function etatAuHasard(options: Options4, alea: () => number = Math.random): Etat4 {
  const cible = PROFILS[Math.floor(alea() * PROFILS.length)];
  let etat = tirage(cible, alea);
  for (let essai = 0; essai < 300 && analyser4(etat, options).profil?.id !== cible; essai++) {
    etat = tirage(cible, alea);
  }
  return etat;
}
