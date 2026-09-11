import React from 'react';
import Link from 'next/link';
import { ArrowRight, PartyPopper } from 'lucide-react';
import { derivedSessionCode } from '@/services/toolSession';
import { todayISO } from './retroLogic';

/**
 * Lien « En mode récré ! » en bas à droite du tableau : on enchaîne souvent
 * les deux. Le code de la récré est déduit du code de la rétro et du jour,
 * si bien que toute l'équipe arrive dans le même salon, et que chaque rétro
 * ouvre une récré neuve.
 */
export const RetroRecreLink: React.FC<{ retroCode: string }> = ({ retroCode }) => {
  const recreCode = derivedSessionCode('en-mode-recre', `${retroCode}|${todayISO()}`);
  return (
    <Link
      href={`/app/outils/en-mode-recre?s=${recreCode}`}
      title="Toute l'équipe arrive dans le même salon"
      className="absolute bottom-6 right-6 z-10 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-card-hover transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
      style={{ background: 'linear-gradient(135deg, #be185d, #f472b6)' }}
    >
      <PartyPopper className="h-4 w-4" aria-hidden />
      Enchaîner sur « En mode récré ! »
      <ArrowRight className="h-4 w-4" aria-hidden />
    </Link>
  );
};

export default RetroRecreLink;
