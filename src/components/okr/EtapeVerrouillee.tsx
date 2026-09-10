import React from 'react';
import { useRouter } from 'next/router';
import { Lock, Check } from 'lucide-react';
import { BTN_OUTLINE, BTN_PRIMARY } from './okrFlux';
import { raisonVerrou, type NiveauAcces } from '@/lib/acces';

/*
 * Écran affiché à la place d'une étape réservée.
 *
 * Il ne se contente pas de bloquer : il rappelle ce que la personne vient de
 * faire et ce qui l'attend derrière, parce que c'est le moment où elle décide
 * si elle va plus loin.
 */

interface EtapeVerrouilleeProps {
  niveau: NiveauAcces;
  /** Ce que contient l'étape verrouillée, pour donner envie. */
  titreEtape: string;
  apercu: string[];
  /** Ouvre la création de compte (visiteur). */
  onCreerCompte: () => void;
}

export const EtapeVerrouillee: React.FC<EtapeVerrouilleeProps> = ({
  niveau,
  titreEtape,
  apercu,
  onCreerCompte,
}) => {
  const router = useRouter();
  const { titre, texte, bouton } = raisonVerrou(niveau);

  return (
    <div className="max-w-2xl">
      <div className="relative overflow-hidden rounded-[18px] px-10 py-9 mb-5 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
        <div
          className="absolute -right-10 -top-10 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(0,212,180,0.13)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative">
          <div className="flex items-center gap-2 text-11.5 font-bold tracking-[1.6px] uppercase text-teal mb-2">
            <Lock className="w-3.5 h-3.5" aria-hidden />
            {titreEtape}
          </div>
          <h2 className="text-[24px] leading-[1.25] font-extrabold text-white mb-2">{titre}</h2>
          <p className="text-14.5 leading-[1.6] text-white/60 max-w-[480px]">{texte}</p>
        </div>
      </div>

      <div className="bg-white border border-line rounded-card shadow-card p-5">
        <div className="text-sm font-bold text-navy mb-3">Ce que vous y ferez</div>
        <ul className="space-y-2 mb-5">
          {apercu.map((ligne) => (
            <li key={ligne} className="flex items-start gap-2 text-sm text-ink leading-snug">
              <Check className="h-4 w-4 text-teal-dark shrink-0 mt-0.5" aria-hidden />
              <span>{ligne}</span>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => (niveau === 'visiteur' ? onCreerCompte() : router.push('/pricing'))}
            className={BTN_PRIMARY}
          >
            {bouton} →
          </button>
          {niveau !== 'visiteur' && (
            <button type="button" onClick={() => router.push('/app/okr')} className={BTN_OUTLINE}>
              Revenir à mes objectifs
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EtapeVerrouillee;
