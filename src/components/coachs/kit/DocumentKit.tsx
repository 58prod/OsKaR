import React from 'react';
import Head from 'next/head';
import styles from './documentKit.module.css';

/*
 * Cadre commun des documents du kit coach (`plateforme/kit-*.html`) : fond
 * gris-bleu, barre d'impression navy collée en haut, pages A4. Pas de menu ni
 * de barre de l'app : ces pages s'ouvrent dans un nouvel onglet depuis
 * l'Espace coachs, pour être imprimées ou enregistrées en PDF.
 */

/** Classes du module à partir de leurs noms dans la maquette : `k('doc-pillar', 'p-fit')`. */
export const k = (...noms: (string | false | null | undefined)[]): string =>
  noms
    .filter((n): n is string => Boolean(n))
    .map((n) => styles[n] ?? '')
    .join(' ');

export const LOGO = '/images/oskar/logo-oskar.png';
export const LOGO_RPR = '/images/oskar/reunir-pour-reussir.jpg';

interface DocumentKitProps {
  titreOnglet: string;
  /** Texte de la barre d'impression ; le nom du document passe en <strong>. */
  nom: string;
  consigne: string;
  /** Boutons supplémentaires, placés avant « Imprimer ». */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export const DocumentKit: React.FC<DocumentKitProps> = ({ titreOnglet, nom, consigne, actions, children }) => (
  <>
    <Head>
      <title>{titreOnglet}</title>
    </Head>
    <div className={k('ecran')}>
      <div className={k('print-bar')}>
        <div className={k('print-bar-txt')}>
          <strong>{nom}</strong> — {consigne}
        </div>
        <div className={k('print-actions')}>
          {actions}
          <button type="button" className={k('imprimer')} onClick={() => window.print()}>
            Imprimer / Enregistrer en PDF
          </button>
        </div>
      </div>
      {children}
    </div>
  </>
);

/** En-tête d'une page A4 : logo à gauche, surtitre sur deux lignes à droite. */
export const EnTeteDoc: React.FC<{ ligne1: string; ligne2: string }> = ({ ligne1, ligne2 }) => (
  <div className={k('doc-head')}>
    {/* eslint-disable-next-line @next/next/no-img-element -- document imprimé, taille fixe */}
    <img src={LOGO} alt="Oskar" />
    <div className={k('doc-kicker')}>
      {ligne1}
      <br />
      {ligne2}
    </div>
  </div>
);

export default DocumentKit;
