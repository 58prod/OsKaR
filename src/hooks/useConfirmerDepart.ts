import { useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';

/**
 * Demande confirmation avant de quitter une page d'outil en cours de session :
 * - onglet ou fenêtre fermés, page rechargée, retour arrière hors du site :
 *   fenêtre du navigateur (son texte est imposé par le navigateur) ;
 * - retour arrière vers une autre page d'Oskar : `message` dans une
 *   confirmation ; « Annuler » laisse la personne dans la session.
 *
 * Renvoie `autoriserDepart`, à appeler juste avant un départ déjà confirmé
 * autrement (bouton « Quitter ») pour ne pas redemander.
 */
export function useConfirmerDepart(actif: boolean, message: string) {
  const router = useRouter();
  const autorise = useRef(false);
  /** Le retour arrière vient d'être annulé : on revient en avant sans redemander. */
  const retourAnnule = useRef(false);

  useEffect(() => {
    if (!actif) return;
    autorise.current = false;

    const avantFermeture = (e: BeforeUnloadEvent) => {
      if (autorise.current) return;
      e.preventDefault();
      // Anciennes versions de Chrome et Safari.
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', avantFermeture);

    router.beforePopState(() => {
      if (retourAnnule.current) {
        // Le navigateur revient sur la page de l'outil, déjà affichée.
        retourAnnule.current = false;
        return false;
      }
      if (autorise.current || window.confirm(message)) {
        autorise.current = true;
        return true;
      }
      // L'adresse a déjà changé : on la remet sur la page de l'outil.
      retourAnnule.current = true;
      window.history.go(1);
      return false;
    });

    return () => {
      window.removeEventListener('beforeunload', avantFermeture);
      router.beforePopState(() => true);
    };
  }, [actif, message, router]);

  return useCallback(() => { autorise.current = true; }, []);
}

export default useConfirmerDepart;
