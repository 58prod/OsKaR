import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2, ShieldAlert } from 'lucide-react';
import { Carte } from '@/components/admin/elements';
import { dateCourte, ilYA } from '@/lib/admin/formule';
import { ENGAGEMENT_TRANSPARENCE, SUJETS_SUIVIS, sujetsNouveaux } from '@/lib/accompagnement/regles';
import type { ActivitePiliers, ProfilCoach, SujetSuivi } from '@/lib/accompagnement/types';

/*
 * Briques des écrans d'accompagnement. Même vocabulaire visuel que
 * l'administration (plateforme/admin.html) : cartes blanches rayon 12,
 * champs 14.5px rayon 9, boutons turquoise, liseré gauche 4px pour signaler.
 */

export const CHAMP =
  'w-full text-14.5 leading-[normal] text-ink px-[11px] py-[9px] border-[1.5px] border-line rounded-[9px] bg-white outline-none focus:border-navy';
export const LIBELLE = 'block text-13.5 font-semibold text-navy mb-[5px]';
export const NOTE = 'text-13 text-muted leading-[1.5]';
export const BOUTON_PRINCIPAL =
  'inline-flex items-center gap-1.5 px-3.5 py-2 text-14.5 font-semibold rounded-[9px] bg-teal text-navy-dark transition-all hover:bg-teal-dark hover:-translate-y-px disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:bg-teal';
export const BOUTON_SECONDAIRE =
  'inline-flex items-center gap-1.5 px-3.5 py-2 text-14.5 font-semibold rounded-[9px] bg-white text-navy border-[1.5px] border-line transition-colors hover:border-navy disabled:opacity-60';
export const BOUTON_RETRAIT =
  'inline-flex items-center gap-1.5 px-3.5 py-2 text-14.5 font-semibold rounded-[9px] bg-transparent text-[#b91c1c] border-[1.5px] border-[#f5c2c2] transition-colors hover:bg-[#fef2f2] hover:border-[#b91c1c] disabled:opacity-60';

/** Couleur de chaque sujet suivi : celle du pilier, navy pour les bilans. */
export const FOND_SUJET: Record<SujetSuivi, string> = {
  vision: 'bg-vision',
  fit: 'bg-fit',
  finance: 'bg-finance',
  okr: 'bg-okr',
  team: 'bg-team',
  bilans: 'bg-navy',
};

export const TEXTE_SUJET: Record<SujetSuivi, string> = {
  vision: 'text-vision-dark',
  fit: 'text-fit-dark',
  finance: 'text-finance-dark',
  okr: 'text-okr-dark',
  team: 'text-team-dark',
  bilans: 'text-navy',
};

export function initiales(nom: string): string {
  return nom
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}

export const Avatar: React.FC<{ nom: string; grand?: boolean }> = ({ nom, grand }) => (
  <div
    className={`bg-navy text-white flex items-center justify-center font-extrabold shrink-0 ${
      grand ? 'w-14 h-14 rounded-[15px] text-[20px]' : 'w-10 h-10 rounded-[11px] text-15'
    }`}
    aria-hidden
  >
    {initiales(nom)}
  </div>
);

/**
 * Les 6 pastilles du suivi (5 piliers + bilans) : allumées quand le sujet est
 * commencé, cerclées de corail quand il a bougé depuis la dernière visite.
 */
export const PastillesSuivi: React.FC<{ activite: ActivitePiliers | null; vuLe: Date | null; maintenant?: Date }> = ({
  activite,
  vuLe,
  maintenant = new Date(),
}) => {
  const nouveaux = sujetsNouveaux(activite, vuLe);
  return (
    <span className="inline-flex gap-[7px] items-center" role="list" aria-label="Suivi pilier par pilier">
      {SUJETS_SUIVIS.map((s) => {
        const d = activite?.[s.id] ?? null;
        const neuf = nouveaux.includes(s.id);
        const titre = d ? `${s.nom} · modifié ${ilYA(d, maintenant)}${neuf ? ' · nouveau' : ''}` : `${s.nom} · pas commencé`;
        return (
          <span
            key={s.id}
            role="listitem"
            title={titre}
            aria-label={titre}
            className={`w-3 h-3 rounded-full ${d ? FOND_SUJET[s.id] : 'bg-line'} ${
              neuf ? 'ring-2 ring-coral ring-offset-[1.5px]' : ''
            }`}
          />
        );
      })}
    </span>
  );
};

/** Interrupteur (role="switch"). Compact : sans libellé visible, pour un tableau. */
export const Interrupteur: React.FC<{
  id: string;
  actif: boolean;
  onChange: (v: boolean) => void;
  libelle: string;
  description?: React.ReactNode;
  compact?: boolean;
  disabled?: boolean;
}> = ({ id, actif, onChange, libelle, description, compact, disabled }) => (
  <div className="flex items-start gap-3">
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={actif}
      aria-label={compact ? libelle : undefined}
      aria-labelledby={compact ? undefined : `${id}-libelle`}
      title={compact ? libelle : undefined}
      disabled={disabled}
      onClick={() => onChange(!actif)}
      className={`relative shrink-0 w-[42px] h-6 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 disabled:opacity-60 ${
        actif ? 'bg-teal' : 'bg-[#cfd3e6]'
      }`}
    >
      <span
        className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(21,31,94,0.25)] transition-transform ${
          actif ? 'translate-x-[18px]' : ''
        }`}
      />
    </button>
    {!compact && (
      <div className="min-w-0">
        <div id={`${id}-libelle`} className="text-14.5 font-semibold text-navy leading-6">
          {libelle}
        </div>
        {description && <p className={`${NOTE} mt-0.5`}>{description}</p>}
      </div>
    )}
  </div>
);

/** La case que le dirigeant coche avant d'ouvrir son travail à un coach. */
export const CaseEngagement: React.FC<{ id: string; coche: boolean; onChange: (v: boolean) => void }> = ({
  id,
  coche,
  onChange,
}) => (
  <label htmlFor={id} className="flex gap-2.5 items-start text-13.5 leading-[1.55] text-ink cursor-pointer">
    <input
      id={id}
      type="checkbox"
      checked={coche}
      onChange={(e) => onChange(e.target.checked)}
      className="mt-[3px] w-4 h-4 shrink-0 accent-[#00d4b4]"
    />
    <span>{ENGAGEMENT_TRANSPARENCE}</span>
  </label>
);

/** Bouton qui attend la fin de son action (et demande confirmation si besoin). */
export const BoutonAsync: React.FC<{
  libelle: string;
  action: () => Promise<unknown>;
  classe: string;
  confirmation?: string;
  disabled?: boolean;
}> = ({ libelle, action, classe, confirmation, disabled }) => {
  const [occupe, setOccupe] = useState(false);
  return (
    <button
      type="button"
      className={classe}
      disabled={disabled || occupe}
      onClick={async () => {
        if (confirmation && !window.confirm(confirmation)) return;
        setOccupe(true);
        try {
          await action();
        } finally {
          setOccupe(false);
        }
      }}
    >
      {occupe && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
      {libelle}
    </button>
  );
};

export const TitreBloc: React.FC<{ children: React.ReactNode; nombre?: number }> = ({ children, nombre }) => (
  <h2 className="flex items-center gap-2 text-[17px] font-extrabold text-navy mb-3">
    {children}
    {nombre != null && (
      <span className="text-12.5 font-bold text-muted bg-white border border-line rounded-[20px] px-2 leading-[1.6]">
        {nombre}
      </span>
    )}
  </h2>
);

/** Une personne reliée : vignette, nom, précisions, actions à droite, suite dessous. */
export const CarteLien: React.FC<{
  nom: string;
  lignes: React.ReactNode;
  accent?: 'coral' | 'teal';
  children?: React.ReactNode;
  bas?: React.ReactNode;
}> = ({ nom, lignes, accent, children, bas }) => (
  <div className="relative overflow-hidden bg-white border border-line rounded-card shadow-card px-[22px] py-[18px]">
    {accent && <span className={`absolute left-0 inset-y-0 w-1 ${accent === 'coral' ? 'bg-coral' : 'bg-teal'}`} aria-hidden />}
    <div className="flex gap-3.5 items-start flex-wrap">
      <Avatar nom={nom} />
      <div className="min-w-0 flex-1 basis-[200px]">
        <div className="text-16 font-extrabold text-navy leading-[1.3] break-words">{nom}</div>
        <div className="text-13.5 text-muted mt-0.5 leading-[1.55] break-words">{lignes}</div>
      </div>
      {children && <div className="flex gap-2 flex-wrap items-center">{children}</div>}
    </div>
    {bas && <div className="mt-3.5 min-[560px]:pl-[54px]">{bas}</div>}
  </div>
);

export const Vide: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="bg-white border border-dashed border-[#cfd3e6] rounded-card px-[22px] py-6 text-14.5 text-muted leading-[1.6]">
    {children}
  </div>
);

/** Disponibilité et résumé de 8 h : dans « Mes dirigeants » et « Ma fiche coach ». */
export const ReglagesCoach: React.FC<{
  profil: ProfilCoach;
  onReglages: (r: { disponible?: boolean; resumeQuotidien?: boolean }) => unknown;
  titre?: string;
}> = ({ profil, onReglages, titre = 'Vos réglages' }) => (
  <Carte titre={titre} compacte>
    <Interrupteur
      id="reglage-disponible"
      actif={profil.disponible}
      onChange={(v) => onReglages({ disponible: v })}
      libelle="Je prends de nouveaux accompagnements"
      description={
        profil.disponible
          ? 'Les dirigeants peuvent vous envoyer une demande.'
          : 'Les dirigeants ne peuvent plus vous envoyer de demande. Vous pouvez toujours inviter qui vous voulez.'
      }
    />
    <div className="h-4" />
    <Interrupteur
      id="reglage-resume"
      actif={profil.resumeQuotidien}
      onChange={(v) => onReglages({ resumeQuotidien: v })}
      libelle="Recevoir le résumé de 8 h"
      description="Chaque matin, ce que vos dirigeants ont fait la veille. Rien n’est envoyé les jours sans nouveauté."
    />
    <p className={`${NOTE} mt-4 pt-3.5 border-t border-line`}>
      Coach référencé depuis le {dateCourte(profil.referenceLe)}
      {profil.zone ? ` · ${profil.zone}` : ''}.
    </p>
  </Carte>
);

/** Ce qu'un compte non référencé voit à la place de l'espace coach. */
export const ReserveAuxCoachs: React.FC = () => (
  <div className="max-w-[560px] bg-white border border-line rounded-card shadow-card p-[27.5px]">
    <div className="flex items-center gap-3 mb-3">
      <ShieldAlert className="h-6 w-6 text-coral-dark" aria-hidden />
      <h2 className="text-20.5 font-extrabold text-navy">Réservé aux coachs référencés</h2>
    </div>
    <p className="text-15 text-muted leading-[1.6] mb-5">
      Cet espace permet aux coachs référencés par Oskar de suivre le travail des dirigeants qu&rsquo;ils accompagnent.
      Vous accompagnez des dirigeants ? Présentez votre approche : un échange de trente minutes suffit à valider votre
      fiche.
    </p>
    <Link href="/coachs#candidature" className="text-15 font-bold text-navy hover:text-teal-dark">
      Rejoindre l&rsquo;annuaire des coachs →
    </Link>
  </div>
);
