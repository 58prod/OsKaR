import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import type { PersonaEvaluation } from '@/lib/productFit/types';
import { calculatePersonaScore } from '@/lib/productFit/scoring';

/*
 * Carte de saisie d'un profil de client.
 *
 * Mise en page et échelle de texte reprises de la page Diagnostic
 * (`PillarCard`) : carte blanche `rounded-card` + `shadow-card`, padding 20px,
 * titre 18px, texte courant 14px, curseur de 0 à 10 sous une question posée en
 * toutes lettres. Les trois questions remplacent les libellés « Intensité du
 * Problème (P) », « Degré d'Urgence (U) » et « Fréquence (F) » : ici on demande
 * ce qu'on veut savoir, sans formule à décoder.
 */

interface PersonaFormCardProps {
  index: number;
  persona: PersonaEvaluation;
  isPriority: boolean;
  onChange: (updated: PersonaEvaluation) => void;
}

/** Les trois questions, dans l'ordre où on les pose. */
const QUESTIONS = [
  {
    champ: 'problemIntensity' as const,
    question: 'Ce problème la gêne-t-il beaucoup ?',
    min: 'Un peu',
    max: 'Énormément',
    couleur: '#ef4444',
  },
  {
    champ: 'urgency' as const,
    question: 'Doit-elle le régler tout de suite ?',
    min: 'Ça peut attendre',
    max: "C'est urgent",
    couleur: '#f59e0b',
  },
  {
    champ: 'frequency' as const,
    question: 'Rencontre-t-elle ce problème souvent ?',
    min: 'Rarement',
    max: 'Tous les jours',
    couleur: '#0ea5e9',
  },
];

const CHAMP_TEXTE =
  'w-full text-sm text-ink px-3 py-2 rounded-lg border border-line bg-white transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 placeholder:text-muted/60';

export const PersonaFormCard: React.FC<PersonaFormCardProps> = ({
  index,
  persona,
  isPriority,
  onChange,
}) => {
  const [detailsOuverts, setDetailsOuverts] = useState(false);

  // La note vient du calcul officiel : la recopier ici la ferait diverger de
  // celle du panneau de résultats.
  const note = calculatePersonaScore(persona).scoreOn10;

  const modifier = <K extends keyof PersonaEvaluation>(champ: K, valeur: PersonaEvaluation[K]) => {
    onChange({ ...persona, [champ]: valeur });
  };

  const nomAffiche = persona.name || `Personne ${index + 1}`;

  return (
    <article
      className={`bg-white rounded-card shadow-card p-5 mb-4 border transition-colors ${
        isPriority ? 'border-teal ring-2 ring-teal/25' : 'border-line'
      }`}
    >
      {/* En-tête : numéro, nom, note */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              isPriority ? 'bg-teal text-navy-dark' : 'bg-surface text-navy'
            }`}
          >
            {index + 1}
          </span>
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-navy truncate">{nomAffiche}</h3>
            {isPriority && (
              <span className="text-[11px] font-bold uppercase tracking-wider text-teal-dark">
                La plus gênée
              </span>
            )}
          </div>
        </div>
        <span className="text-sm font-bold text-navy shrink-0">
          {note}
          <span className="text-xs font-normal text-muted"> /10</span>
        </span>
      </div>

      {/* Qui est-ce ? */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-5">
        <div>
          <label htmlFor={`nom-${index}`} className="block text-sm font-semibold text-ink mb-1.5">
            Son prénom
          </label>
          <input
            id={`nom-${index}`}
            type="text"
            value={persona.name}
            onChange={(e) => modifier('name', e.target.value)}
            placeholder="Claire"
            className={CHAMP_TEXTE}
          />
        </div>
        <div>
          <label htmlFor={`role-${index}`} className="block text-sm font-semibold text-ink mb-1.5">
            Sa situation
          </label>
          <input
            id={`role-${index}`}
            type="text"
            value={persona.role}
            onChange={(e) => modifier('role', e.target.value)}
            placeholder="Mère de deux enfants, salariée"
            className={CHAMP_TEXTE}
          />
        </div>
      </div>

      {/* Les trois questions */}
      <div className="space-y-4">
        {QUESTIONS.map(({ champ, question, min, max, couleur }) => {
          const valeur = persona[champ];
          return (
            <div key={champ}>
              <div className="flex items-center justify-between gap-3 mb-2">
                <span className="text-sm font-semibold text-ink">{question}</span>
                <span className="text-xs font-bold text-muted shrink-0">{valeur}/10</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-xs text-muted w-[104px] shrink-0" aria-hidden>
                  {min}
                </span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  step={1}
                  value={valeur}
                  onChange={(e) => modifier(champ, Number(e.target.value))}
                  className="flex-1 h-1.5 cursor-pointer"
                  style={{ accentColor: couleur }}
                  aria-label={`${question} (${nomAffiche})`}
                  aria-valuetext={`${valeur} sur 10`}
                />
                <span className="text-xs text-muted w-[104px] shrink-0 text-right" aria-hidden>
                  {max}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Précisions facultatives */}
      <div className="mt-4 pt-4 border-t border-line">
        <button
          type="button"
          onClick={() => setDetailsOuverts(!detailsOuverts)}
          aria-expanded={detailsOuverts}
          className="flex items-center gap-1.5 text-sm font-semibold text-muted hover:text-navy transition-colors"
        >
          En dire plus
          <span className="text-xs font-normal">(facultatif)</span>
          {detailsOuverts ? (
            <ChevronUp className="h-3.5 w-3.5" aria-hidden />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" aria-hidden />
          )}
        </button>

        {detailsOuverts && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3 animate-fade-in">
            <div>
              <label htmlFor={`gene-${index}`} className="block text-sm font-semibold text-ink mb-1.5">
                Qu&rsquo;est-ce qui la bloque ?
              </label>
              <input
                id={`gene-${index}`}
                type="text"
                value={persona.keyPainPoint || ''}
                onChange={(e) => modifier('keyPainPoint', e.target.value)}
                placeholder="Elle perd 3 heures par semaine"
                className={CHAMP_TEXTE}
              />
            </div>
            <div>
              <label htmlFor={`aujourdhui-${index}`} className="block text-sm font-semibold text-ink mb-1.5">
                Comment fait-elle aujourd&rsquo;hui ?
              </label>
              <input
                id={`aujourdhui-${index}`}
                type="text"
                value={persona.alternativeSolution || ''}
                onChange={(e) => modifier('alternativeSolution', e.target.value)}
                placeholder="À la main, sur un tableur"
                className={CHAMP_TEXTE}
              />
            </div>
          </div>
        )}
      </div>
    </article>
  );
};

export default PersonaFormCard;
