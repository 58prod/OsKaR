import React, { useLayoutEffect, useRef, useState } from 'react';

/**
 * Titre du ticket dans la barre du haut : sur une ou deux lignes dans une
 * zone de hauteur fixe (40 px, deux lignes de 20 px), pour que la barre ne
 * grandisse pas. Au-delà de deux lignes, le titre complet s'affiche dans une
 * bulle au survol (ou au focus clavier).
 */

const HAUTEUR = 40;
const LIGNE = 20;

/** Bulle du titre complet, sous la zone. */
const Bulle: React.FC<{ texte: string }> = ({ texte }) => (
  <span
    role="tooltip"
    className="pointer-events-none absolute left-0 top-full z-50 mt-1.5 w-max max-w-[min(480px,80vw)] whitespace-normal break-words rounded-lg bg-navy px-3 py-2 text-sm font-medium leading-snug text-white shadow-card-hover"
  >
    {texte}
  </span>
);

/** Le contenu dépasse-t-il de la zone ? Recalculé quand le texte ou la largeur change. */
function useDeborde<T extends HTMLElement>(texte: string) {
  const ref = useRef<T>(null);
  const [deborde, setDeborde] = useState(false);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const mesurer = () => setDeborde(el.scrollHeight > HAUTEUR + 1);
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, [texte]);
  return { ref, deborde };
}

interface TitreAfficheProps {
  titre: string;
  url: string;
}

/** Côté participant : le titre (lien vers le ticket s'il y en a un), deux lignes au plus. */
export const TitreAffiche: React.FC<TitreAfficheProps> = ({ titre, url }) => {
  const { ref, deborde } = useDeborde<HTMLElement>(titre);
  const [survol, setSurvol] = useState(false);
  const classe = 'line-clamp-2 break-words text-base font-semibold leading-5 text-navy';

  if (!titre) {
    return <span className="text-base font-normal text-muted">En attente de la fonctionnalité…</span>;
  }
  return (
    <span
      className="relative flex min-w-0 items-center"
      style={{ height: HAUTEUR }}
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
      onFocus={() => setSurvol(true)}
      onBlur={() => setSurvol(false)}
    >
      {url ? (
        // Le titre lui-même ouvre le ticket.
        <a
          ref={ref as React.RefObject<HTMLAnchorElement>}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={deborde ? undefined : `Ouvrir le ticket dans un nouvel onglet : ${url}`}
          className={`${classe} underline-offset-4 hover:underline`}
        >
          {titre}
        </a>
      ) : (
        <span ref={ref as React.RefObject<HTMLSpanElement>} className={classe}>{titre}</span>
      )}
      {deborde && survol && <Bulle texte={titre} />}
    </span>
  );
};

interface ChampTitreProps {
  titre: string;
  onChange: (titre: string) => void;
}

/**
 * Côté animateur : zone de saisie de deux lignes au plus, centrée quand le
 * titre tient sur une ligne. Entrée valide (pas de retour à la ligne).
 */
export const ChampTitre: React.FC<ChampTitreProps> = ({ titre, onChange }) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [lignes, setLignes] = useState(1);
  const [survol, setSurvol] = useState(false);
  const [focus, setFocus] = useState(false);

  // Nombre de lignes du texte à cette largeur, pour centrer une ligne seule.
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Hauteur du texte seul : zone ramenée à 0 le temps de la mesure.
    const mesurer = () => {
      const { height, paddingTop, paddingBottom } = el.style;
      el.style.height = '0px';
      el.style.paddingTop = '0px';
      el.style.paddingBottom = '0px';
      setLignes(Math.max(1, Math.round(el.scrollHeight / LIGNE)));
      Object.assign(el.style, { height, paddingTop, paddingBottom });
    };
    mesurer();
    const obs = new ResizeObserver(mesurer);
    obs.observe(el);
    return () => obs.disconnect();
  }, [titre]);

  const marge = lignes <= 1 ? (HAUTEUR - LIGNE) / 2 : 0;

  return (
    <label
      className="relative block min-w-0 flex-1"
      onMouseEnter={() => setSurvol(true)}
      onMouseLeave={() => setSurvol(false)}
    >
      <span className="sr-only">Ticket à estimer</span>
      <textarea
        ref={ref}
        rows={2}
        value={titre}
        onChange={(e) => onChange(e.target.value.replace(/\s*\n\s*/g, ' '))}
        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); e.currentTarget.blur(); } }}
        onFocus={() => setFocus(true)}
        onBlur={() => setFocus(false)}
        placeholder="Titre du ticket à estimer…"
        className="block w-full resize-none overflow-hidden bg-transparent text-base font-semibold leading-5 text-navy outline-none placeholder:font-normal placeholder:text-line focus:overflow-y-auto"
        style={{ height: HAUTEUR, paddingTop: marge, paddingBottom: marge }}
      />
      {lignes > 2 && survol && !focus && <Bulle texte={titre} />}
    </label>
  );
};
