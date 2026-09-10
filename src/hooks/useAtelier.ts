import { useCallback, useEffect, useRef, useState } from 'react';
import { AteliersService, type PilierAtelier } from '@/services/db/ateliers';

/*
 * État d'un atelier Fit, Finance ou Team, sur le modèle de `useVision` : on
 * charge une fois, on modifie librement, et on enregistre peu après la
 * dernière frappe. Pas de bouton « Enregistrer » obligatoire : ce qui est
 * saisi est conservé.
 */

const DELAI_ENREGISTREMENT = 1200;

export function useAtelier<T extends object>(
  pilier: PilierAtelier,
  userId: string | undefined,
  vide: T,
  fusionner: (contenu: unknown) => T
) {
  const [atelier, setAtelier] = useState<T>(vide);
  const [charge, setCharge] = useState(false);
  const [enregistrement, setEnregistrement] = useState<'repos' | 'en cours' | 'echec'>('repos');

  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dernier = useRef<T>(vide);
  const fusion = useRef(fusionner);

  useEffect(() => {
    let vivant = true;
    if (!userId) {
      setCharge(true);
      return;
    }
    AteliersService.get(userId, pilier)
      .then((trouve) => {
        if (!vivant || trouve == null) return;
        const complet = fusion.current(trouve);
        setAtelier(complet);
        dernier.current = complet;
      })
      .catch(() => undefined)
      .finally(() => vivant && setCharge(true));
    return () => {
      vivant = false;
    };
  }, [userId, pilier]);

  const enregistrer = useCallback(async () => {
    if (!userId) return;
    setEnregistrement('en cours');
    try {
      await AteliersService.enregistrer(userId, pilier, dernier.current);
      setEnregistrement('repos');
    } catch {
      setEnregistrement('echec');
    }
  }, [userId, pilier]);

  /** Applique une modification et programme l'enregistrement. */
  const modifier = useCallback(
    (patch: Partial<T>) => {
      setAtelier((prev) => {
        const suivant = { ...prev, ...patch };
        dernier.current = suivant;
        return suivant;
      });
      if (!userId) return;
      if (minuteur.current) clearTimeout(minuteur.current);
      minuteur.current = setTimeout(enregistrer, DELAI_ENREGISTREMENT);
    },
    [userId, enregistrer]
  );

  /** Force l'enregistrement immédiat, par exemple en changeant d'étape. */
  const enregistrerMaintenant = useCallback(async () => {
    if (minuteur.current) clearTimeout(minuteur.current);
    await enregistrer();
  }, [enregistrer]);

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  return { atelier, modifier, charge, enregistrement, enregistrerMaintenant };
}

export default useAtelier;
