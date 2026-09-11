import React from 'react';
import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { X, AlertCircle } from 'lucide-react';

/*
 * Habillage commun de l'authentification : la carte de la fenêtre de
 * connexion des maquettes (`.auth-modal` d'oskar.css — en-tête navy, logo
 * blanc, 420px). La fenêtre et les pages /auth/* s'en servent, pour que l'on
 * voie la même chose où que l'on arrive.
 */

export const CLS = {
  champ:
    'w-full px-3.5 py-2.5 border border-line rounded-lg text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20',
  intitule: 'block text-[12.5px] font-semibold text-navy mb-1.5',
  erreur: 'mt-1 text-xs text-red-600',
  bouton:
    'w-full mt-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg bg-teal text-navy-dark text-sm font-semibold hover:bg-teal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed',
  lien: 'text-teal-dark font-semibold hover:underline',
  note: 'text-center text-[11.5px] text-muted',
};

export const Carte: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white rounded-2xl w-[420px] max-w-[95vw] shadow-auth-modal overflow-hidden">{children}</div>
);

export const EnTeteCarte: React.FC<{
  titre: string;
  sousTitre: string;
  /** Présent dans la fenêtre seulement : bouton de fermeture. */
  onFermer?: () => void;
  titreId?: string;
}> = ({ titre, sousTitre, onFermer, titreId }) => (
  <div className="relative bg-gradient-to-br from-navy-dark to-navy px-7 pt-7 pb-5 text-center">
    <Image
      src="/images/oskar/logo-oskar-blanc.png"
      alt="Oskar"
      width={140}
      height={28}
      className="h-7 w-auto mx-auto mb-3.5"
    />
    <h2 id={titreId} className="text-xl font-extrabold text-white mb-1">
      {titre}
    </h2>
    <p className="text-[13px] text-white/60">{sousTitre}</p>
    {onFermer && (
      <button
        type="button"
        onClick={onFermer}
        aria-label="Fermer"
        autoFocus
        className="absolute top-3.5 right-4 w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
      >
        <X className="h-4 w-4" aria-hidden />
      </button>
    )}
  </div>
);

export const MessageErreur: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div role="alert" className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2 text-sm text-red-800">
    <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden /> <span>{children}</span>
  </div>
);

export const MessageInfo: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div role="status" className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-sm text-green-800">
    {children}
  </div>
);

/** Cadre des pages /auth/* : la carte centrée sur le fond de l'app. */
export const CadrePageAuth: React.FC<{ titreOnglet: string; children: React.ReactNode }> = ({
  titreOnglet,
  children,
}) => (
  <>
    <Head>
      <title>{titreOnglet}</title>
    </Head>
    <main className="min-h-screen bg-surface font-sans flex flex-col items-center justify-center px-4 py-12">
      <div className="animate-slide-up">{children}</div>
      <Link href="/" className="mt-6 text-14 text-muted hover:text-navy transition-colors">
        ← Retour à l’accueil
      </Link>
    </main>
  </>
);
