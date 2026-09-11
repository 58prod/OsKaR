import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { Clock, KeyRound, Loader2, LogIn } from 'lucide-react';
import { getLastName } from '@/utils/toolIdentity';
import { getRetentionLabel } from '@/constants/toolbox';
import { ToolSessionService } from '@/services/toolSession';

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
        {/* Pas de « le » devant le nom de l'outil : « le Boîte à idées »,
            « le En mode récré ! »… Le nom de l'outil sert de titre. */}
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          {isCreating ? 'Démarrer une session' : 'Rejoindre la session'}
        </p>
        <h2 id="join-title" className="mt-1 text-xl font-bold text-navy">
          {toolTitle}
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

        {isCreating && <JoinByCode prefix={sessionCode.split('-')[0]} />}

        <p className="mt-4 flex items-center justify-center gap-1.5 text-center text-xs text-muted">
          <Clock className="h-3.5 w-3.5" aria-hidden />
          Données conservées {retentionLabel ?? getRetentionLabel()} après la dernière activité, puis supprimées automatiquement.
        </p>
      </div>
    </div>
  );
};

/**
 * « Vous avez déjà un code ? » : rejoindre une session existante (la rétro de
 * son équipe, par exemple) au lieu d'en démarrer une nouvelle. Le code est
 * vérifié avant de basculer : il doit exister et correspondre au même outil.
 */
const JoinByCode: React.FC<{ prefix: string }> = ({ prefix }) => {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState('');
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const raw = value.trim().toUpperCase().replace(/\s+/g, '');
    if (!raw) return;
    // « 7K2P » suffit : on complète avec le préfixe de l'outil.
    const code = raw.includes('-') ? raw : `${prefix}-${raw}`;
    setChecking(true);
    setError('');
    const row = await ToolSessionService.get(code);
    setChecking(false);
    const toolType = router.pathname.split('/').pop();
    if (!row) {
      setError('Aucune session en cours avec ce code. Vérifiez-le auprès de l’animateur.');
      return;
    }
    if (row.tool_type !== toolType) {
      setError('Ce code correspond à un autre outil de la boîte à outils.');
      return;
    }
    void router.replace({ query: { ...router.query, s: code } }, undefined, { shallow: true });
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-4 inline-flex w-full items-center justify-center gap-1.5 text-sm font-semibold text-navy underline-offset-2 hover:underline"
      >
        <KeyRound className="h-4 w-4" aria-hidden /> Vous avez déjà un code de session ?
      </button>
    );
  }

  return (
    <form onSubmit={submit} className="mt-5 border-t border-line pt-4">
      <label htmlFor="join-code" className="block text-sm font-semibold text-navy">
        Rejoindre une session existante
      </label>
      <div className="mt-1.5 flex gap-2">
        <input
          id="join-code"
          type="text"
          value={value}
          onChange={(e) => { setValue(e.target.value); setError(''); }}
          placeholder={`${prefix}-XXXX`}
          autoComplete="off"
          autoCapitalize="characters"
          className="min-w-0 flex-1 rounded-lg border border-line bg-white px-3 py-2 font-mono uppercase tracking-widest text-navy outline-none focus:border-teal focus-visible:ring-2 focus-visible:ring-teal"
          aria-invalid={!!error}
          aria-describedby={error ? 'join-code-error' : undefined}
        />
        <button
          type="submit"
          disabled={checking || !value.trim()}
          className="inline-flex items-center gap-1.5 rounded-lg bg-navy px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-navy-light disabled:cursor-not-allowed disabled:opacity-50"
        >
          {checking ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : null} Valider
        </button>
      </div>
      {error && <p id="join-code-error" role="alert" className="mt-1.5 text-xs text-danger-600">{error}</p>}
    </form>
  );
};

export default JoinSessionModal;
