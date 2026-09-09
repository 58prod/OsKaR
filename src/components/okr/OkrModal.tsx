import React, { useEffect } from 'react';

/*
 * Modale du parcours OKR — transposition des .modal-overlay / .modal-box de okr.html :
 *   voile     rgba(21,31,94,0.38) + flou 2px
 *   boîte     blanche, rayon 18px, padding 30/32, largeur 420px (94vw max)
 *   eyebrow   11px / 700 / interlettrage 1.4px / majuscules / couleur OKR
 *   titre     18px / 800 / navy
 *   texte     13px / gris / interligne 1.5
 */

interface OkrModalProps {
  open: boolean;
  onClose: () => void;
  eyebrow: string;
  titre: React.ReactNode;
  texte?: React.ReactNode;
  children: React.ReactNode;
}

export const OkrModal: React.FC<OkrModalProps> = ({ open, onClose, eyebrow, titre, texte, children }) => {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(21,31,94,0.38)] backdrop-blur-[2px] p-4"
      onMouseDown={onClose}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={typeof titre === 'string' ? titre : eyebrow}
        className="bg-white rounded-[18px] px-8 py-[30px] w-[420px] max-w-[94vw] max-h-[92vh] overflow-y-auto shadow-[0_24px_64px_rgba(30,45,125,0.18)] border border-line"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="text-11 font-bold tracking-[1.4px] uppercase text-okr mb-[5px]">{eyebrow}</div>
        <div className="text-[18px] leading-[1.3] font-extrabold text-navy mb-1">{titre}</div>
        {texte && <div className="text-13 leading-[1.5] text-muted mb-[22px]">{texte}</div>}
        {children}
      </div>
    </div>
  );
};

/* Classes des champs et boutons de modale (modal-input, modal-field-label, btn-mc, btn-ms). */
export const MODAL_LABEL = 'text-12.5 font-bold text-navy mb-[7px]';
export const MODAL_INPUT =
  'w-full border-[1.5px] border-line rounded-[9px] px-3.5 py-2.5 text-14.5 text-ink outline-none bg-[#fafbff] focus:border-okr focus:bg-white transition-colors placeholder:text-[#bcc3d8]';
export const BTN_ANNULER =
  'bg-white border-[1.5px] border-line text-muted rounded-[10px] px-5 py-2.5 text-14 font-semibold hover:border-navy hover:text-navy transition-all';
export const BTN_VALIDER =
  'bg-okr text-white rounded-[10px] px-6 py-2.5 text-14 font-bold hover:bg-okr-dark hover:-translate-y-px transition-all disabled:opacity-50 disabled:pointer-events-none';
export const BTN_SUPPRIMER = 'mr-auto text-12.5 font-semibold text-[#dc2626] hover:underline';

export default OkrModal;
