import React, { useEffect, useRef, useState } from 'react';

interface TexteSynchroProps {
  /** Valeur partagée (celle de la session). */
  value: string;
  /** Envoie la saisie aux autres participants. */
  onCommit: (text: string) => void;
  /** Nom du champ pour les lecteurs d'écran. */
  label: string;
  placeholder?: string;
  maxLength: number;
  multiline?: boolean;
  rows?: number;
  className?: string;
  id?: string;
  /** Liste de suggestions (`<datalist>`) pour un champ d'une ligne. */
  list?: string;
}

/**
 * Champ de texte partagé : on écrit librement, le texte part aux autres à
 * chaque petite pause et en quittant le champ. Tant qu'on écrit, ce qui
 * arrive des autres n'efface pas la saisie en cours.
 */
export const TexteSynchro: React.FC<TexteSynchroProps> = ({
  value, onCommit, label, placeholder, maxLength, multiline, rows = 3, className = '', id, list,
}) => {
  /** null = pas en cours de saisie : on affiche la valeur partagée. */
  const [draft, setDraft] = useState<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const envoye = useRef(value);
  const commitRef = useRef(onCommit);
  const draftRef = useRef<string | null>(null);
  commitRef.current = onCommit;
  draftRef.current = draft;

  const flush = (text: string) => {
    if (timer.current) { clearTimeout(timer.current); timer.current = null; }
    if (text.trim() === envoye.current.trim()) return;
    envoye.current = text;
    commitRef.current(text);
  };
  const flushRef = useRef(flush);
  flushRef.current = flush;

  // On quitte l'étape en pleine saisie : ce qui a été écrit part quand même.
  useEffect(() => () => {
    if (draftRef.current !== null) flushRef.current(draftRef.current);
  }, []);

  const handleChange = (text: string) => {
    setDraft(text);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => flush(text), 500);
  };

  const props = {
    id,
    value: draft ?? value,
    placeholder,
    maxLength,
    'aria-label': label,
    onFocus: () => { envoye.current = value; setDraft(value); },
    onBlur: () => { if (draftRef.current !== null) flush(draftRef.current); setDraft(null); },
  };
  const base = 'w-full rounded-lg border border-line bg-white px-2.5 py-1.5 text-sm text-navy outline-none placeholder:text-muted/60 focus:border-teal';

  return multiline ? (
    <textarea
      {...props}
      rows={rows}
      onChange={(e) => handleChange(e.target.value)}
      className={`${base} resize-none leading-snug ${className}`}
    />
  ) : (
    <input
      {...props}
      type="text"
      list={list}
      onChange={(e) => handleChange(e.target.value)}
      onKeyDown={(e) => { if (e.key === 'Enter') e.currentTarget.blur(); }}
      className={`${base} ${className}`}
    />
  );
};

export default TexteSynchro;
