import React, { useId, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  DEMANDE_VIDE,
  LONGUEURS_MAX_DEMANDE,
  OBJETS_DEMANDE,
  estSurMesure,
  problemeDemande,
  type DemandeFormule,
  type ObjetDemande,
} from '@/lib/tarifs/formules';
import { DemandesFormuleService } from '@/services/db/demandesFormule';

/*
 * « Demander la formule » — tant que Stripe n'est pas branché, la formule
 * Dirigeant et le sur-mesure passent par ce formulaire (table
 * `demandes_formule`), puis s'activent depuis l'administration.
 *
 * Même gabarit que le formulaire de candidature de l'Espace coachs, à l'accent
 * turquoise de la plateforme. L'objet de la demande est tenu par la page : les
 * boutons des cartes de formule le choisissent avant de faire défiler ici.
 */

const INTITULE = 'block text-14.5 font-semibold text-navy mb-1.5';
const CHAMP =
  'w-full bg-white text-16 leading-[normal] text-ink border-[1.5px] border-line rounded-[10.5px] px-3.5 py-[11.5px] placeholder:text-muted placeholder:text-15 outline-none transition-colors focus:border-teal focus:shadow-[0_0_0_3px_rgba(0,212,180,0.18)]';

type ChampTexte = keyof typeof LONGUEURS_MAX_DEMANDE;

export const FormulaireDemande: React.FC<{
  objet: ObjetDemande;
  onObjet: (objet: ObjetDemande) => void;
}> = ({ objet, onObjet }) => {
  const { user } = useAppStore();
  const id = useId();
  const [d, setD] = useState<Omit<DemandeFormule, 'objet'>>(DEMANDE_VIDE);
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'envoyee'>('saisie');
  const [erreur, setErreur] = useState<string | null>(null);
  const message = useRef<HTMLDivElement>(null);

  const demande: DemandeFormule = { ...d, objet };
  const surMesure = estSurMesure(objet);
  const reseau = objet === 'reseau';

  const champ = (cle: ChampTexte) => ({
    id: `${id}-${cle}`,
    value: d[cle],
    maxLength: LONGUEURS_MAX_DEMANDE[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setD((p) => ({ ...p, [cle]: e.target.value })),
  });

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (etat !== 'saisie') return;
    const probleme = problemeDemande(demande);
    if (probleme) {
      setErreur(probleme);
      return;
    }
    setErreur(null);
    setEtat('envoi');
    try {
      await DemandesFormuleService.deposer(demande, user?.id ?? null);
      // Prévient l'équipe par email. La demande est déjà enregistrée : un
      // échec d'envoi ne doit ni bloquer ni alarmer la personne.
      fetch('/api/notifier-demande-formule', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(demande),
      }).catch(() => {});
      setEtat('envoyee');
      requestAnimationFrame(() => message.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }));
    } catch {
      setEtat('saisie');
      setErreur('L’envoi n’a pas abouti. Réessayez dans quelques instants.');
    }
  };

  const ligne = 'grid grid-cols-1 min-[600px]:grid-cols-2 gap-x-3.5';

  return (
    <form
      id="demande"
      noValidate
      onSubmit={envoyer}
      className="scroll-mt-20 bg-white border border-line rounded-card shadow-card px-7 pt-7 pb-6 mb-9"
    >
      <div className="mb-5">
        <h3 className="text-20.5 font-extrabold text-navy mb-[5px]">Demander la formule</h3>
        <p className="text-15 leading-[1.6] text-muted">
          Le paiement en ligne arrive bientôt. En attendant, laissez-nous vos coordonnées : nous revenons vers vous pour
          activer votre formule et vous envoyer la facture.
        </p>
      </div>

      <fieldset className="mb-4">
        <legend className={INTITULE}>Ce qui vous intéresse</legend>
        <div className="grid grid-cols-1 min-[600px]:grid-cols-2 gap-2.5 mt-1">
          {OBJETS_DEMANDE.map((o) => {
            const coche = o.id === objet;
            return (
              <label
                key={o.id}
                className={`flex items-start gap-3 border-[1.5px] rounded-xl px-4 py-[13px] cursor-pointer select-none transition-colors hover:border-teal-dark ${
                  coche ? 'border-teal-dark bg-teal-light' : 'border-line bg-white'
                }`}
              >
                <input
                  type="radio"
                  name={`${id}-objet`}
                  checked={coche}
                  onChange={() => onObjet(o.id)}
                  className="w-4 h-4 mt-0.5 shrink-0 cursor-pointer accent-teal-dark"
                />
                <span className="flex flex-col gap-0.5">
                  <span className={`text-15 leading-[1.35] ${coche ? 'font-bold text-navy' : 'font-semibold text-ink'}`}>
                    {o.libelle}
                  </span>
                  <span className="text-13 leading-[1.4] text-muted">{o.detail}</span>
                </span>
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className={ligne}>
        <div className="mb-4">
          <label htmlFor={`${id}-prenom`} className={INTITULE}>Prénom</label>
          <input type="text" autoComplete="given-name" placeholder="Claire" className={CHAMP} {...champ('prenom')} />
        </div>
        <div className="mb-4">
          <label htmlFor={`${id}-nom`} className={INTITULE}>Nom</label>
          <input type="text" autoComplete="family-name" placeholder="Durand" className={CHAMP} {...champ('nom')} />
        </div>
      </div>

      <div className={ligne}>
        <div className="mb-4">
          <label htmlFor={`${id}-email`} className={INTITULE}>Email professionnel</label>
          <input type="email" autoComplete="email" placeholder="claire@entreprise.fr" className={CHAMP} {...champ('email')} />
        </div>
        <div className="mb-4">
          <label htmlFor={`${id}-entreprise`} className={INTITULE}>
            {reseau ? 'Réseau ou groupement' : 'Entreprise'}
          </label>
          <input
            type="text"
            autoComplete="organization"
            placeholder={reseau ? 'Nom du réseau' : 'Nom de l’entreprise'}
            className={CHAMP}
            {...champ('entreprise')}
          />
        </div>
      </div>

      {surMesure && (
        <div className="mb-4 min-[600px]:w-1/2 min-[600px]:pr-[7px]">
          <label htmlFor={`${id}-comptes`} className={INTITULE}>
            {reseau ? 'Nombre d’adhérents (environ)' : 'Nombre de comptes souhaités'}
          </label>
          <input
            id={`${id}-comptes`}
            type="text"
            inputMode="numeric"
            placeholder={reseau ? '300' : '4'}
            value={d.comptes}
            maxLength={12}
            onChange={(e) => setD((p) => ({ ...p, comptes: e.target.value }))}
            className={CHAMP}
          />
          <p className="text-12.5 italic text-muted mt-[5px]">Facultatif : une estimation suffit.</p>
        </div>
      )}

      <div className="mb-4">
        <label htmlFor={`${id}-message`} className={INTITULE}>Un mot sur votre besoin (facultatif)</label>
        <textarea
          placeholder={
            surMesure
              ? 'Qui utilisera Oskar, sur quels piliers, à partir de quand…'
              : 'Une question, une date de démarrage, un coach qui vous accompagne…'
          }
          className="block w-full bg-white text-15 leading-[1.6] text-ink border-[1.5px] border-line rounded-[10px] px-[13px] py-[11px] min-h-[88px] resize-y placeholder:text-muted outline-none transition-colors focus:border-teal"
          {...champ('message')}
        />
      </div>

      {erreur && (
        <p role="alert" className="text-14 font-semibold text-danger-600 mb-3">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={etat !== 'saisie'}
        className="w-full inline-flex items-center justify-center gap-1.5 mt-1.5 px-[18px] py-[10.5px] rounded-[10.5px] text-15.5 font-semibold bg-teal text-navy-dark transition-all hover:bg-teal-dark hover:-translate-y-px disabled:opacity-60 disabled:pointer-events-none"
      >
        {etat === 'envoi' ? 'Envoi…' : etat === 'envoyee' ? 'Demande envoyée' : 'Envoyer ma demande →'}
      </button>

      {etat === 'envoyee' && (
        <div
          ref={message}
          role="status"
          className="flex items-center gap-[11px] mt-4 bg-teal-light border border-teal/50 rounded-[11px] px-4 py-3.5 text-15 font-semibold text-navy"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0 text-teal-dark" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          {surMesure
            ? 'Demande enregistrée. Nous revenons vers vous rapidement pour en parler.'
            : 'Demande enregistrée. Nous revenons vers vous rapidement pour activer votre formule.'}
        </div>
      )}
    </form>
  );
};

export default FormulaireDemande;
