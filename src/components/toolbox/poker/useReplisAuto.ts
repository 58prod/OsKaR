import { useCallback, useEffect, useRef, useState } from 'react';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';

/**
 * Les cartes de vote sont l'élément principal du Planning Poker : quand la
 * fenêtre rétrécit, on replie d'abord le menu Oskar, puis la colonne des
 * tickets, pour leur garder la place. Quand elle s'élargit de nouveau, on
 * rouvre ce qu'on avait replié soi-même. Un choix fait à la main est respecté
 * jusqu'au prochain franchissement de seuil.
 */

/** Largeurs (px) des colonnes, dépliées et repliées. */
const MENU = { ouvert: 240, plie: 64 };
const TICKETS = { ouvert: 300, plie: 48 };
const RESULTATS = 320;
/** Place gardée aux cartes : cinq par rangée (5 × 90 px, écarts et marges). */
const CARTES_MIN = 560;
/** En dessous, c'est la mise en page téléphone (colonnes empilées). */
const MOBILE = 768;

/** Colonne des tickets pliée ou non : préférence de chacun, gardée dans le navigateur. */
const CLE_PLIE = 'oskar.poker.ticketsPlies';

export function useReplisAuto(panneauTickets: boolean) {
  const { collapsed: menuPlie, setCollapsedTemporaire } = useSidebarCollapsed();
  const [ticketsPlies, setTicketsPlies] = useState(false);

  // Préférence enregistrée ; sans choix, pliée sur téléphone, où elle passerait avant le vote.
  useEffect(() => {
    let choix: string | null = null;
    try { choix = localStorage.getItem(CLE_PLIE); } catch { /* stockage indisponible */ }
    setTicketsPlies(choix === null ? window.innerWidth < MOBILE : choix === '1');
  }, []);

  const basculerTickets = useCallback(() => setTicketsPlies((p) => {
    try { localStorage.setItem(CLE_PLIE, p ? '0' : '1'); } catch { /* stockage indisponible */ }
    return !p;
  }), []);

  // Valeurs courantes, lues par l'écouteur de redimensionnement.
  const etat = useRef({ menuPlie, ticketsPlies });
  etat.current = { menuPlie, ticketsPlies };
  /** Ce que le repli automatique a fermé lui-même (et rouvrira). */
  const auto = useRef({ menu: false, tickets: false });

  useEffect(() => {
    const tickets = panneauTickets ? TICKETS.ouvert : 0;
    const seuilMenu = MENU.ouvert + tickets + RESULTATS + CARTES_MIN;
    const seuilTickets = MENU.plie + tickets + RESULTATS + CARTES_MIN;
    let niveauPrecedent: number | null = null;

    const ajuster = () => {
      const largeur = window.innerWidth;
      if (largeur < MOBILE) { niveauPrecedent = null; return; }
      const niveau = largeur >= seuilMenu ? 0 : largeur >= seuilTickets || !panneauTickets ? 1 : 2;
      if (niveau === niveauPrecedent) return;
      const precedent = niveauPrecedent;
      niveauPrecedent = niveau;

      // Fenêtre plus étroite (ou premier affichage) : on replie ce qui gêne.
      if (niveau >= 1 && !etat.current.menuPlie) {
        setCollapsedTemporaire(true);
        auto.current.menu = true;
      }
      if (niveau >= 2 && !etat.current.ticketsPlies) {
        setTicketsPlies(true);
        auto.current.tickets = true;
      }
      // Fenêtre plus large : on rouvre ce qu'on avait replié soi-même.
      if (precedent !== null && niveau < precedent) {
        if (niveau < 2 && auto.current.tickets) {
          setTicketsPlies(false);
          auto.current.tickets = false;
        }
        if (niveau < 1 && auto.current.menu) {
          setCollapsedTemporaire(false);
          auto.current.menu = false;
        }
      }
    };

    ajuster();
    window.addEventListener('resize', ajuster);
    return () => window.removeEventListener('resize', ajuster);
  }, [panneauTickets, setCollapsedTemporaire]);

  // En quittant l'outil, le menu replié automatiquement retrouve son état.
  useEffect(() => () => {
    if (auto.current.menu) setCollapsedTemporaire(false);
  }, [setCollapsedTemporaire]);

  return { ticketsPlies, basculerTickets };
}

export default useReplisAuto;
