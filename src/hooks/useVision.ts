import { useCallback, useEffect, useRef, useState } from 'react';
import { VisionService } from '@/services/db/vision';
import { ATELIER_VIDE, type AtelierVision } from '@/lib/vision/types';

/*
 * État de l'atelier Vision : on charge une fois, on modifie librement, et on
 * enregistre peu après la dernière frappe. Comme le parcours OKR, l'atelier n'a
 * pas de bouton « Enregistrer » : ce qui est saisi est conservé.
 */

const DELAI_ENREGISTREMENT = 1200;

export function useVision(userId: string | undefined) {
  const [atelier, setAtelier] = useState<AtelierVision>(ATELIER_VIDE);
  const [charge, setCharge] = useState(false);
  const [enregistrement, setEnregistrement] = useState<'repos' | 'en cours' | 'echec'>('repos');

  const minuteur = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dernier = useRef<AtelierVision>(ATELIER_VIDE);

  useEffect(() => {
    let vivant = true;
    if (!userId) {
      setCharge(true);
      return;
    }
    VisionService.get(userId)
      .then((trouve) => {
        if (!vivant) return;
        if (trouve) {
          setAtelier(trouve);
          dernier.current = trouve;
        }
      })
      .catch(() => undefined)
      .finally(() => vivant && setCharge(true));
    return () => {
      vivant = false;
    };
  }, [userId]);

  /** Applique une modification et programme l'enregistrement. */
  const modifier = useCallback(
    (patch: Partial<AtelierVision>) => {
      setAtelier((prev) => {
        const suivant = { ...prev, ...patch };
        dernier.current = suivant;
        return suivant;
      });
      if (!userId) return;
      if (minuteur.current) clearTimeout(minuteur.current);
      minuteur.current = setTimeout(async () => {
        setEnregistrement('en cours');
        try {
          await VisionService.enregistrer(userId, dernier.current);
          setEnregistrement('repos');
        } catch {
          setEnregistrement('echec');
        }
      }, DELAI_ENREGISTREMENT);
    },
    [userId]
  );

  /** Force l'enregistrement immédiat, par exemple en changeant d'étape. */
  const enregistrerMaintenant = useCallback(async () => {
    if (!userId) return;
    if (minuteur.current) clearTimeout(minuteur.current);
    setEnregistrement('en cours');
    try {
      await VisionService.enregistrer(userId, dernier.current);
      setEnregistrement('repos');
    } catch {
      setEnregistrement('echec');
    }
  }, [userId]);

  useEffect(() => () => {
    if (minuteur.current) clearTimeout(minuteur.current);
  }, []);

  return { atelier, modifier, charge, enregistrement, enregistrerMaintenant };
}

export default useVision;
