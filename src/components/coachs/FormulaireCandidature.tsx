import React, { useId, useRef, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import {
  CANDIDATURE_VIDE,
  LONGUEURS_MAX,
  PILIERS_COACH,
  basculerPilier,
  problemeCandidature,
  type Candidature,
} from '@/lib/coachs/candidature';
import { CandidaturesCoachsService } from '@/services/db/candidaturesCoachs';

/*
 * « Rejoindre l'annuaire » — bloc `.coach-form` de coachs.html, branché sur la
 * table `candidatures_coachs` (la maquette n'enregistrait rien).
 *
 * Valeurs relevées sur la maquette servie :
 *   carte      rayon 12, padding 28/28/24, marge basse 36
 *   titre      20.5px / 800 navy, 5px dessous ; texte 15px gris interligne 1.6, 20px dessous
 *   lignes     2 colonnes, écart 14 ; groupe 16px dessous ; intitulé 14.5px / 600 navy, 6px dessous
 *   champ      16px, padding 11.5/14, bord 1.5, rayon 10.5, 46px ; focus corail + halo 3px à 18 %
 *   zone texte 15px, padding 11/13, rayon 10, 88px mini ; note 12.5px italique grise, 5px au-dessus
 *   piliers    pastilles 14.5px, padding 8/15, rayon 22, écart 8 ; cochée : corail
 *   label RPR  bord 1.5 rayon 12, padding 13/16, vignette 36px rayon 8
 *   message    fond corail clair, bord corail 50 %, rayon 11, padding 14/16, 15px / 600
 *
 * Écart volontaire : dans la maquette, les champs texte héritent par accident
 * de la règle `input[type="text"]` (fond gris, 40px) alors que le champ email
 * garde le style `.form-input` (fond blanc, 46px). Tous suivent ici `.form-input`.
 */

const INTITULE = 'block text-14.5 font-semibold text-navy mb-1.5';
const CHAMP =
  'w-full bg-white text-16 leading-[normal] text-ink border-[1.5px] border-line rounded-[10.5px] px-3.5 py-[11.5px] placeholder:text-muted placeholder:text-15 outline-none transition-colors focus:border-coral focus:shadow-[0_0_0_3px_rgba(255,160,137,0.18)]';

type ChampTexte = Exclude<keyof Candidature, 'piliers' | 'labelRpr'>;

export const FormulaireCandidature: React.FC = () => {
  const { user } = useAppStore();
  const id = useId();
  const [c, setC] = useState<Candidature>(CANDIDATURE_VIDE);
  const [etat, setEtat] = useState<'saisie' | 'envoi' | 'envoyee'>('saisie');
  const [erreur, setErreur] = useState<string | null>(null);
  const message = useRef<HTMLDivElement>(null);

  const champ = (cle: ChampTexte) => ({
    id: `${id}-${cle}`,
    value: c[cle],
    maxLength: LONGUEURS_MAX[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setC((p) => ({ ...p, [cle]: e.target.value })),
  });

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (etat !== 'saisie') return;
    const probleme = problemeCandidature(c);
    if (probleme) {
      setErreur(probleme);
      return;
    }
    setErreur(null);
    setEtat('envoi');
    try {
      await CandidaturesCoachsService.deposer(c, user?.id ?? null);
      // Prévient l'équipe par email. La candidature est déjà enregistrée :
      // un échec d'envoi ne doit ni bloquer ni alarmer la personne.
      fetch('/api/notifier-candidature', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(c),
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
      id="candidature"
      noValidate
      onSubmit={envoyer}
      className="scroll-mt-20 bg-white border border-line rounded-card shadow-card px-7 pt-7 pb-6 mb-9"
    >
      <div className="mb-5">
        <h3 className="text-20.5 font-extrabold text-navy mb-[5px]">Rejoindre l’annuaire</h3>
        <p className="text-15 leading-[1.6] text-muted">
          Renseignez votre profil et les piliers sur lesquels vous accompagnez. Nous revenons vers vous pour valider
          votre fiche et vous transmettre le kit complet.
        </p>
      </div>

      <div className={ligne}>
        <div className="mb-4">
          <label htmlFor={`${id}-prenom`} className={INTITULE}>Prénom</label>
          <input type="text" autoComplete="given-name" placeholder="Sophie" className={CHAMP} {...champ('prenom')} />
        </div>
        <div className="mb-4">
          <label htmlFor={`${id}-nom`} className={INTITULE}>Nom</label>
          <input type="text" autoComplete="family-name" placeholder="Martin" className={CHAMP} {...champ('nom')} />
        </div>
      </div>

      <div className={ligne}>
        <div className="mb-4">
          <label htmlFor={`${id}-email`} className={INTITULE}>Email professionnel</label>
          <input type="email" autoComplete="email" placeholder="sophie@cabinet.fr" className={CHAMP} {...champ('email')} />
        </div>
        <div className="mb-4">
          <label htmlFor={`${id}-zone`} className={INTITULE}>Ville / zone d’intervention</label>
          <input type="text" placeholder="Lyon · AURA · Distanciel" className={CHAMP} {...champ('zone')} />
        </div>
      </div>

      <div className={ligne}>
        <div className="mb-4">
          <label htmlFor={`${id}-structure`} className={INTITULE}>Structure</label>
          <input type="text" autoComplete="organization" placeholder="Cabinet, indépendant…" className={CHAMP} {...champ('structure')} />
        </div>
        <div className="mb-4">
          <label htmlFor={`${id}-site`} className={INTITULE}>Site web ou LinkedIn</label>
          <input type="text" inputMode="url" placeholder="https://" className={CHAMP} {...champ('site')} />
        </div>
      </div>

      <fieldset className="mb-4">
        <legend className={INTITULE}>Piliers sur lesquels vous accompagnez</legend>
        <div className="flex flex-wrap gap-2 mt-1">
          {PILIERS_COACH.map((p) => {
            const coche = c.piliers.includes(p.id);
            return (
              <label
                key={p.id}
                className={`inline-flex items-center gap-2 text-14.5 border-[1.5px] rounded-[22px] px-[15px] py-2 cursor-pointer select-none transition-colors hover:border-coral-dark ${
                  coche ? 'border-coral-dark bg-coral-light text-coral-dark font-bold' : 'border-line text-ink font-medium'
                }`}
              >
                <input
                  type="checkbox"
                  checked={coche}
                  onChange={() => setC((prev) => ({ ...prev, piliers: basculerPilier(prev.piliers, p.id) }))}
                  className="w-[15px] h-[15px] cursor-pointer accent-coral-dark"
                />
                {p.libelle}
              </label>
            );
          })}
        </div>
      </fieldset>

      <div className="mb-4">
        <span className={INTITULE}>Label</span>
        <label
          className={`flex items-center gap-[13px] border-[1.5px] rounded-xl px-4 py-[13px] cursor-pointer select-none transition-colors hover:border-coral-dark ${
            c.labelRpr ? 'border-coral-dark bg-coral-light' : 'border-line bg-white'
          }`}
        >
          <input
            type="checkbox"
            checked={c.labelRpr}
            onChange={(e) => setC((p) => ({ ...p, labelRpr: e.target.checked }))}
            className="w-4 h-4 shrink-0 cursor-pointer accent-coral-dark"
          />
          {/* eslint-disable-next-line @next/next/no-img-element -- vignette fixe */}
          <img
            src="/images/oskar/reunir-pour-reussir.jpg"
            alt="Réunir pour Réussir"
            className="w-9 h-9 rounded-lg object-cover shrink-0"
          />
          <span className="flex flex-col gap-0.5">
            <span className={`text-15 leading-[1.35] ${c.labelRpr ? 'font-bold text-navy' : 'font-semibold text-ink'}`}>
              Je suis coach labellisé Réunir pour Réussir
            </span>
            <span className="text-13 leading-[1.4] text-muted">Le label apparaîtra sur votre fiche dans l’annuaire.</span>
          </span>
        </label>
      </div>

      <div className="mb-4">
        <label htmlFor={`${id}-approche`} className={INTITULE}>Votre approche en quelques lignes</label>
        <textarea
          placeholder="Vos secteurs, vos formats d’intervention, un exemple d’accompagnement récent…"
          className="block w-full bg-white text-15 leading-[1.6] text-ink border-[1.5px] border-line rounded-[10px] px-[13px] py-[11px] min-h-[88px] resize-y placeholder:text-muted outline-none transition-colors focus:border-coral"
          {...champ('approche')}
        />
        <p className="text-12.5 italic text-muted mt-[5px]">Ce texte apparaîtra sur votre fiche dans l’annuaire.</p>
      </div>

      {erreur && (
        <p role="alert" className="text-14 font-semibold text-danger-600 mb-3">
          {erreur}
        </p>
      )}

      <button
        type="submit"
        disabled={etat !== 'saisie'}
        className="w-full inline-flex items-center justify-center gap-1.5 mt-1.5 px-[18px] py-[10.5px] rounded-[10.5px] text-15.5 font-semibold bg-coral text-navy-dark transition-all hover:bg-coral-dark hover:text-white hover:-translate-y-px disabled:opacity-60 disabled:pointer-events-none"
      >
        {etat === 'envoi' ? 'Envoi…' : etat === 'envoyee' ? 'Candidature envoyée' : 'Envoyer ma candidature →'}
      </button>

      {etat === 'envoyee' && (
        <div
          ref={message}
          role="status"
          className="flex items-center gap-[11px] mt-4 bg-coral-light border border-coral/50 rounded-[11px] px-4 py-3.5 text-15 font-semibold text-coral-dark"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" className="w-[18px] h-[18px] shrink-0" aria-hidden>
            <polyline points="20 6 9 17 4 12" />
          </svg>
          Candidature enregistrée. Nous revenons vers vous sous quelques jours avec le kit complet.
        </div>
      )}
    </form>
  );
};

export default FormulaireCandidature;
