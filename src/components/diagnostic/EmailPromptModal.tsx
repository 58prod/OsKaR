import React, { useEffect, useRef, useState } from 'react';
import { X, Mail, Loader2 } from 'lucide-react';

interface EmailPromptModalProps {
  open: boolean;
  title: string;
  description: string;
  submitLabel: string;
  defaultEmail?: string;
  loading?: boolean;
  /**
   * Affiche la case « J'accepte qu'Oskar me recontacte » (RGPD : décochée par
   * défaut). Sa valeur est passée en second argument de `onSubmit`.
   */
  demanderConsentement?: boolean;
  onSubmit: (email: string, accepteRecontact: boolean) => void;
  onClose: () => void;
}

/**
 * Modale réutilisable de saisie d'email (sauvegarde invité, envoi PDF).
 * Accessible : focus initial, fermeture Escape, libellé lié, état de chargement.
 */
export const EmailPromptModal: React.FC<EmailPromptModalProps> = ({
  open,
  title,
  description,
  submitLabel,
  defaultEmail = '',
  loading = false,
  demanderConsentement = false,
  onSubmit,
  onClose,
}) => {
  const [email, setEmail] = useState(defaultEmail);
  const [accepteRecontact, setAccepteRecontact] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    setEmail(defaultEmail);
    setAccepteRecontact(false);
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      lastFocusedRef.current?.focus();
    };
  }, [open, defaultEmail, onClose]);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value) return;
    onSubmit(value, demanderConsentement && accepteRecontact);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-dark/60 backdrop-blur-sm animate-fade-in"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby="email-prompt-title" className="w-full max-w-md bg-white rounded-2xl shadow-auth-modal overflow-hidden">
        <header className="flex items-center justify-between gap-4 px-6 py-5 bg-gradient-to-br from-navy-dark to-navy">
          <h2 id="email-prompt-title" className="text-base font-bold text-white">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Fermer" className="w-7 h-7 inline-flex items-center justify-center rounded-full bg-white/12 text-white hover:bg-white/25 transition-colors">
            <X className="h-4 w-4" aria-hidden />
          </button>
        </header>

        <form onSubmit={handleSubmit} className="px-6 py-5">
          <label htmlFor="email-prompt-input" className="block text-[13px] text-muted leading-relaxed mb-3">
            {description}
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" aria-hidden />
            <input
              ref={inputRef}
              id="email-prompt-input"
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="vous@entreprise.fr"
              className="w-full pl-9 pr-3 py-2.5 border border-line rounded-lg text-sm text-ink placeholder:text-muted/70 outline-none transition-colors focus:border-teal focus:ring-2 focus:ring-teal/20"
            />
          </div>
          {demanderConsentement && (
            <label className="flex items-start gap-2.5 mt-3.5 text-[13px] text-ink leading-snug cursor-pointer">
              <input
                type="checkbox"
                checked={accepteRecontact}
                onChange={(e) => setAccepteRecontact(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-teal cursor-pointer"
              />
              <span>J&rsquo;accepte qu&rsquo;Oskar me recontacte au sujet de mon bilan.</span>
            </label>
          )}
          <div className="flex items-center justify-end gap-2.5 mt-5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-semibold text-navy hover:text-navy-light transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-teal text-navy-dark text-[13px] font-bold rounded-lg hover:bg-teal-dark transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
              {loading ? 'Envoi…' : submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmailPromptModal;
