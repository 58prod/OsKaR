import React, { useEffect, useRef, useState } from 'react';
import { Clock, LogIn } from 'lucide-react';
import { getLastName } from '@/utils/toolIdentity';
import { getRetentionLabel } from '@/constants/toolbox';

interface JoinSessionModalProps {
  toolTitle: string;
  /** Code de session affiché (jeton d'accès partagé). */
  sessionCode: string;
  /** true si l'utilisateur crée la session (facilitateur). */
  isCreating: boolean;
  onJoin: (name: string) => void;
  /** Rétention propre à l'outil (ex: « 1 an » pour la Rétrospective). */
  retentionLabel?: string;
  /** Précision affichée sous le code (ex: code d'équipe permanent). */
  codeHint?: string;
}

/**
 * Boîte de dialogue d'entrée dans une session collaborative (Option A) :
 * un prénom suffit, aucun compte requis.
 */
export const JoinSessionModal: React.FC<JoinSessionModalProps> = ({
  toolTitle,
  sessionCode,
  isCreating,
  onJoin,
  retentionLabel,
  codeHint,
}) => {
  const [name, setName] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setName(getLastName());
    inputRef.current?.focus();
  }, []);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim().length === 0) return;
    onJoin(name.trim());
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="join-title"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-auth-modal">
        <h2 id="join-title" className="text-xl font-bold text-navy">
          {isCreating ? `Démarrer le ${toolTitle}` : `Rejoindre le ${toolTitle}`}
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          {isCreating
            ? 'Choisissez votre prénom pour animer la session. Partagez ensuite le lien ou le code avec votre équipe.'
            : 'Saisissez votre prénom pour rejoindre la session de votre équipe.'}
        </p>

        <div className="mt-4 flex items-center justify-between rounded-lg bg-surface px-4 py-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-muted">
            Code de session
          </span>
          <span className="font-mono text-lg font-bold tracking-widest text-navy">
            {sessionCode}
          </span>
        </div>
        {codeHint && <p className="mt-2 text-xs leading-relaxed text-muted">{codeHint}</p>}

        <form onSubmit={submit} className="mt-5">
          <label htmlFor="join-name" className="block text-sm font-semibold text-navy">
            Votre prénom
          </label>
          <input
            id="join-name"
            ref={inputRef}
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={20}
            autoComplete="given-name"
            placeholder="Ex : Alice"
            className="mt-1.5 w-full rounded-lg border border-line bg-white px-4 py-2.5 text-navy outline-none transition-colors focus:border-teal focus-visible:ring-2 focus-visible:ring-teal"
            required
          />

          <button
            type="submit"
            disabled={name.trim().length === 0}
            className="mt-5 flex w-full items-center justify-center gap-2 rounded-lg bg-teal px-4 py-3 font-bold text-navy-dark transition-colors hover:bg-teal-dark disabled:cursor-not-allowed disabled:opacity-50"
          >
            <LogIn className="h-4 w-4" aria-hidden />
            {isCreating ? 'Démarrer la session' : 'Rejoindre'}
          </button>
        </form>

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Données conservées {retentionLabel ?? getRetentionLabel()} après la dernière activité, puis supprimées automatiquement.
        </p>
      </div>
    </div>
  );
};

export default JoinSessionModal;
