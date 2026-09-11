import React, { useEffect, useRef, useState } from 'react';
import { Loader2, X } from 'lucide-react';
import { useFicheCompte, useOffrirFormule, useRetirerFormule } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { avancementDuCompte } from '@/lib/admin/avancement';
import {
  MOTIFS_OFFRE,
  dateCourte,
  dateDeChamp,
  finParDefaut,
  formuleDuCompte,
  ilYA,
  type FormuleCompte,
} from '@/lib/admin/formule';
import { PILIERS_ADMIN, type CompteAdmin } from '@/lib/admin/types';
import { Carte, FOND_PILIER, TagFormule, noteSur10 } from './elements';

/*
 * Volet latéral « fiche compte » de admin.html :
 *   volet     500px, fond #f5f6fa, ombre -12px 0 40px, glisse en 0.25s
 *   en-tête   blanc, padding 22/26/20, vignette 48px rayon 13, nom 20px / 800
 *   formule   bord turquoise 1.5, padding 20/22 ; champs 14.5px rayon 9
 *   ateliers  grille 120px / barre / 64px, barre 10px à la couleur du pilier
 */

interface Props {
  compte: CompteAdmin | null;
  onFermer: () => void;
}

export const FicheCompteVolet: React.FC<Props> = ({ compte, onFermer }) => {
  // Garde le dernier compte affiché pendant que le volet se referme.
  const dernier = useRef<CompteAdmin | null>(null);
  if (compte) dernier.current = compte;
  const affiche = compte ?? dernier.current;
  const ouvert = !!compte;

  const { data: fiche, isLoading, error } = useFicheCompte(compte?.id ?? null);
  const fermer = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!ouvert) return;
    fermer.current?.focus();
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && onFermer();
    document.addEventListener('keydown', touche);
    return () => document.removeEventListener('keydown', touche);
  }, [ouvert, onFermer]);

  const formule = affiche ? formuleDuCompte(affiche) : null;
  const avancement = fiche ? avancementDuCompte(fiche) : null;
  const nom = affiche ? affiche.nom?.trim() || affiche.email : '';

  return (
    <>
      <div
        onClick={onFermer}
        aria-hidden
        className={`fixed inset-0 z-[400] bg-[rgba(21,31,94,0.28)] transition-opacity duration-200 ${
          ouvert ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={nom ? `Fiche de ${nom}` : 'Fiche compte'}
        aria-hidden={!ouvert}
        className={`fixed top-0 right-0 bottom-0 z-[410] w-[500px] max-w-full bg-surface flex flex-col shadow-[-12px_0_40px_rgba(21,31,94,0.18)] transition-transform duration-250 ease-out ${
          ouvert ? 'translate-x-0' : 'translate-x-full invisible'
        }`}
      >
        {affiche && formule && (
          <>
            <div className="bg-white border-b border-line px-[26px] pt-[22px] pb-5 flex gap-3.5 items-start">
              <div className="w-12 h-12 rounded-[13px] bg-navy text-white flex items-center justify-center text-[18px] font-extrabold shrink-0">
                {initialesDe(nom)}
              </div>
              <div className="min-w-0">
                <div className="text-20 font-extrabold text-navy leading-[1.2] break-words">{nom}</div>
                <div className="text-14 text-muted mt-[3px]">
                  {[affiche.entreprise, affiche.activite].filter(Boolean).join(' · ') || 'Profil non renseigné'}
                </div>
              </div>
              <button
                ref={fermer}
                type="button"
                onClick={onFermer}
                aria-label="Fermer"
                className="ml-auto p-1 rounded-lg text-muted hover:bg-surface hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
              >
                <X className="w-5 h-5" aria-hidden />
              </button>
            </div>

            <div className="px-[26px] pt-5 pb-[30px] overflow-y-auto flex-1">
              <OffreFormule key={`${affiche.id}-${formule.genre}`} compte={affiche} formule={formule} />
              <div className="h-3.5" />

              <Carte titre="Identité" compacte>
                <dl className="grid grid-cols-[130px_1fr] gap-x-3.5 gap-y-2 text-14.5">
                  <dt className="text-muted">Email</dt>
                  <dd className="text-ink font-semibold break-all">{affiche.email}</dd>
                  <dt className="text-muted">Entreprise</dt>
                  <dd className="text-ink font-semibold">{affiche.entreprise || '—'}</dd>
                  <dt className="text-muted">Activité</dt>
                  <dd className="text-ink font-semibold">{affiche.activite || '—'}</dd>
                  <dt className="text-muted">Inscription</dt>
                  <dd className="text-ink font-semibold">{dateCourte(affiche.creeLe)}</dd>
                  <dt className="text-muted">Connexion</dt>
                  <dd className="text-ink font-semibold">{ilYA(affiche.derniereConnexion)}</dd>
                </dl>
              </Carte>

              <Carte titre="Ateliers" compacte>
                {isLoading ? (
                  <Attente />
                ) : error || !avancement ? (
                  <p className="text-14.5 text-muted">Détail indisponible.</p>
                ) : (
                  PILIERS_ADMIN.map((p) => {
                    const a = avancement[p.id];
                    const part = a.total ? (a.faites / a.total) * 100 : a.commence ? 100 : 0;
                    return (
                      <div key={p.id} className="grid grid-cols-[120px_1fr_64px] gap-3 items-center mb-[11px] last:mb-0 text-14.5">
                        <span className="font-semibold text-navy">{p.nom}</span>
                        <div className="h-2.5 bg-surface rounded-md overflow-hidden">
                          <div className={`h-full rounded-md ${FOND_PILIER[p.id]}`} style={{ width: `${part}%` }} />
                        </div>
                        <span className="text-13 text-muted text-right" title="Étapes remplies">
                          {!a.commence ? '—' : a.total ? `${a.faites}/${a.total}` : 'commencé'}
                        </span>
                      </div>
                    );
                  })
                )}
              </Carte>

              <Carte titre="Bilans" compacte>
                {isLoading ? (
                  <Attente />
                ) : !fiche?.bilans.length ? (
                  <p className="text-14.5 text-muted">Aucun bilan enregistré.</p>
                ) : (
                  fiche.bilans.map((b) => (
                    <div
                      key={b.id}
                      className="flex justify-between items-center py-[9px] border-b border-line first:pt-0 last:pb-0 last:border-b-0 text-14.5"
                    >
                      <span>
                        {b.type === 'produit' ? 'Potentiel Produit' : 'Bilan de maturité'}
                        <span className="text-13 text-muted"> · {dateCourte(b.creeLe)}</span>
                      </span>
                      {b.note != null && (
                        <span className="font-extrabold text-navy">
                          {noteSur10(b.note)}
                          <small className="font-medium text-muted text-[0.8em]">/10</small>
                        </span>
                      )}
                    </div>
                  ))
                )}
              </Carte>
            </div>
          </>
        )}
      </aside>
    </>
  );
};

function initialesDe(nom: string): string {
  return nom
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}

const Attente = () => (
  <div className="flex items-center gap-2 text-14 text-muted">
    <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> Chargement…
  </div>
);

const CHAMP =
  'w-full text-14.5 leading-[normal] text-ink px-[11px] py-[9px] border-[1.5px] border-line rounded-[9px] bg-white outline-none focus:border-navy';
const LIBELLE = 'block text-13.5 font-semibold text-navy mb-[5px]';
const BOUTON_PRINCIPAL =
  'inline-flex items-center gap-1.5 px-3.5 py-2 text-14.5 font-semibold rounded-[9px] bg-teal text-navy-dark transition-all hover:bg-teal-dark hover:-translate-y-px disabled:opacity-60 disabled:hover:translate-y-0';
const BOUTON_RETRAIT =
  'inline-flex items-center gap-1.5 px-3.5 py-2 text-14.5 font-semibold rounded-[9px] bg-transparent text-[#b91c1c] border-[1.5px] border-[#f5c2c2] transition-colors hover:bg-[#fef2f2] hover:border-[#b91c1c] disabled:opacity-60';
const NOTE = 'text-13 text-muted leading-[1.5]';

/** Bloc du haut de la fiche : l'état de la formule, et de quoi l'offrir ou la retirer. */
const OffreFormule: React.FC<{ compte: CompteAdmin; formule: FormuleCompte }> = ({ compte, formule }) => {
  const toast = useToast();
  const offrir = useOffrirFormule();
  const retirer = useRetirerFormule();
  const [jusquAu, setJusquAu] = useState(finParDefaut());
  const [motif, setMotif] = useState<string>(formule.motif ?? MOTIFS_OFFRE[0]);
  const aujourdhui = dateDeChamp(new Date());

  const enregistrer = async () => {
    try {
      await offrir.mutateAsync({ userId: compte.id, jusquAu, motif });
      toast.success(`Formule offerte jusqu’au ${jusquAu.split('-').reverse().join('/')}.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'La formule n’a pas pu être offerte.');
    }
  };

  const enlever = async () => {
    if (!window.confirm('Retirer la formule offerte ? Le compte repasse en gratuit tout de suite.')) return;
    try {
      await retirer.mutateAsync(compte.id);
      toast.success('Formule retirée : le compte est gratuit.');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'La formule n’a pas pu être retirée.');
    }
  };

  const cadre = 'bg-white border-[1.5px] border-teal rounded-card px-[22px] py-5 shadow-card';
  const entete = (titre: string) => (
    <div className="flex items-center justify-between gap-2.5 mb-4">
      <strong className="text-16 text-navy font-bold">{titre}</strong>
      <TagFormule formule={formule} sansDate />
    </div>
  );

  if (formule.genre === 'demo') {
    return (
      <div className={cadre}>
        {entete('Compte de démonstration')}
        <p className={NOTE}>
          Accès complet, partagé. Le script <code>supabase/demo/compte_demo.sql</code> le remet à zéro.
        </p>
      </div>
    );
  }

  if (formule.genre === 'abonne') {
    return (
      <div className={cadre}>
        {entete(compte.stripe ? 'Abonnement Stripe' : 'Formule payante')}
        <p className={NOTE}>
          {compte.stripe
            ? 'Géré par Stripe (renouvellement, résiliation, factures). Rien à faire ici.'
            : 'Formule payante enregistrée hors de l’administration.'}
        </p>
      </div>
    );
  }

  const champs = (libelleDate: string) => (
    <div className="grid grid-cols-2 gap-3 mb-3.5">
      <div>
        <label className={LIBELLE} htmlFor={`fin-${compte.id}`}>{libelleDate}</label>
        <input
          id={`fin-${compte.id}`}
          type="date"
          min={aujourdhui}
          value={jusquAu}
          onChange={(e) => setJusquAu(e.target.value)}
          className={CHAMP}
        />
      </div>
      <div>
        <label className={LIBELLE} htmlFor={`motif-${compte.id}`}>Motif</label>
        <select id={`motif-${compte.id}`} value={motif} onChange={(e) => setMotif(e.target.value)} className={CHAMP}>
          {MOTIFS_OFFRE.map((m) => (
            <option key={m}>{m}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const occupe = offrir.isPending || retirer.isPending;

  if (formule.genre === 'offerte') {
    return (
      <div className={cadre}>
        {entete(formule.jusquAu ? `Formule offerte jusqu’au ${dateCourte(formule.jusquAu)}` : 'Formule offerte')}
        {formule.motif && <p className={`${NOTE} -mt-1.5 mb-3.5`}>Motif : {formule.motif}</p>}
        {champs('Prolonger jusqu’au')}
        <div className="flex gap-2.5 flex-wrap">
          <button type="button" className={BOUTON_PRINCIPAL} onClick={enregistrer} disabled={occupe || !jusquAu}>
            {offrir.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Prolonger
          </button>
          <button type="button" className={BOUTON_RETRAIT} onClick={enlever} disabled={occupe}>
            {retirer.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
            Retirer la formule
          </button>
        </div>
        <p className={`${NOTE} mt-3`}>
          À l&rsquo;échéance, le compte repasse en gratuit tout seul : ses données restent, seules les étapes 2 et
          suivantes se referment.
        </p>
      </div>
    );
  }

  return (
    <div className={cadre}>
      {entete('Compte gratuit')}
      {formule.offreExpireeLe && (
        <p className={`${NOTE} -mt-1.5 mb-3.5`}>Formule offerte terminée le {dateCourte(formule.offreExpireeLe)}.</p>
      )}
      {champs('Offrir la formule jusqu’au')}
      <button type="button" className={BOUTON_PRINCIPAL} onClick={enregistrer} disabled={occupe || !jusquAu}>
        {offrir.isPending && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
        Offrir la formule payante
      </button>
      <p className={`${NOTE} mt-3`}>
        Toutes les étapes de tous les ateliers s&rsquo;ouvrent aussitôt. Sans paiement ni Stripe : pour les offres
        membres fondateurs, les coachs partenaires, les tests.
      </p>
    </div>
  );
};

export default FicheCompteVolet;
