import React, { useState } from 'react';
import { Bell } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { BarreOutils, Bandeau, Chargement, Erreur, PILULE, Puces, TAG, TON_PILIER } from '@/components/admin/elements';
import { useCandidaturesAdmin, useEstAdmin, useMajCandidature } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { PILIERS_COACH } from '@/lib/coachs/candidature';
import { ilYA } from '@/lib/admin/formule';
import { STATUTS_CANDIDATURE, type CandidatureAdmin, type StatutCandidature } from '@/lib/admin/types';

/*
 * Candidatures coachs — vue 3 de plateforme/admin.html :
 *   carte      grille 1fr / 280px, écart 22, liseré corail 4px si « nouvelle »
 *   nom        18px / 800 ; méta 14px grise ; approche fond #f5f6fa rayon 10
 *   colonne    filet gauche, statut + notes internes + « Écrire à… »
 * Le statut s'enregistre dès qu'il change, la note quand on quitte le champ.
 */

const TON_STATUT: Record<StatutCandidature, string> = {
  nouvelle: 'bg-coral-light text-coral-dark',
  contactee: 'bg-vision-light text-vision-dark',
  validee: 'bg-fit-light text-fit-dark',
  refusee: 'bg-[#f3f4f6] text-[#6b7280]',
};

type Filtre = 'toutes' | StatutCandidature;

const CandidaturesAdmin: React.FC = () => {
  const { estAdmin } = useEstAdmin();
  const { data: candidatures, error, isLoading } = useCandidaturesAdmin(estAdmin);
  const [filtre, setFiltre] = useState<Filtre>('nouvelle');

  const liste = candidatures ?? [];
  const options = [
    { id: 'toutes' as Filtre, libelle: 'Toutes', nombre: liste.length },
    ...STATUTS_CANDIDATURE.map((s) => ({
      id: s.id as Filtre,
      libelle: s.pluriel,
      nombre: liste.filter((c) => c.statut === s.id).length,
    })),
  ];
  const affichees = liste.filter((c) => filtre === 'toutes' || c.statut === filtre);

  return (
    <AdminShell
      titre="Candidatures coachs"
      sousTitre="Les demandes reçues par le formulaire « Rejoindre l'annuaire » de l'Espace coachs."
    >
      <Bandeau icone={<Bell aria-hidden />}>
        Chaque nouvelle candidature est aussi envoyée par email à <strong className="text-navy">contact@oskar-coach.fr</strong>.
        Le statut et les notes ne sont visibles que des administrateurs.
      </Bandeau>

      <BarreOutils>
        <Puces libelle="Filtrer par statut" options={options} valeur={filtre} onChange={setFiltre} />
      </BarreOutils>

      {error ? (
        <Erreur message={(error as Error).message} />
      ) : isLoading || !candidatures ? (
        <Chargement />
      ) : affichees.length === 0 ? (
        <div className="bg-white border border-line rounded-card shadow-card p-[27.5px] text-center text-14.5 text-muted">
          Aucune candidature dans cette catégorie.
        </div>
      ) : (
        <div className="grid gap-3.5">
          {affichees.map((c) => (
            <CarteCandidature key={c.id} c={c} />
          ))}
        </div>
      )}
    </AdminShell>
  );
};

const CarteCandidature: React.FC<{ c: CandidatureAdmin }> = ({ c }) => {
  const toast = useToast();
  const maj = useMajCandidature();
  const [notes, setNotes] = useState(c.notes ?? '');

  const enregistrer = async (statut: StatutCandidature, texte: string, message: string) => {
    try {
      await maj.mutateAsync({ id: c.id, statut, notes: texte });
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'La modification n’a pas pu être enregistrée.');
    }
  };

  const statut = STATUTS_CANDIDATURE.find((s) => s.id === c.statut);
  const meta = [c.structure, c.zone].filter(Boolean).join(' · ');
  const site = c.site ? (/^https?:\/\//i.test(c.site) ? c.site : `https://${c.site}`) : null;

  return (
    <article
      className={`bg-white border border-line rounded-card shadow-card px-[22px] py-5 grid grid-cols-1 min-[1100px]:grid-cols-[1fr_280px] gap-[22px] ${
        c.statut === 'nouvelle' ? 'border-l-4 border-l-coral' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap mb-1">
          <h2 className="text-[18px] font-extrabold text-navy">
            {c.prenom} {c.nom}
          </h2>
          <span className={`${TAG} ${TON_STATUT[c.statut]}`}>{statut?.libelle}</span>
          {c.labelRpr && (
            <span className="inline-flex items-center text-12 font-extrabold tracking-[.04em] text-coral-dark bg-coral-light border border-coral/55 rounded-[20px] px-[9px] py-0.5">
              Label RPR
            </span>
          )}
        </div>
        <div className="text-14 text-muted mb-3">
          {meta}
          {meta && site && ' · '}
          {site && (
            <a href={site} target="_blank" rel="noreferrer noopener" className="text-navy font-semibold hover:text-teal-dark">
              {c.site}
            </a>
          )}
          {(meta || site) && ' · '}reçue {ilYA(c.creeLe)}
        </div>
        {c.piliers.length > 0 && (
          <div className="flex gap-1.5 flex-wrap mb-3">
            {PILIERS_COACH.filter((p) => c.piliers.includes(p.id)).map((p) => (
              <span key={p.id} className={`${PILULE} ${TON_PILIER[p.id]}`}>
                {p.libelle}
              </span>
            ))}
          </div>
        )}
        {c.approche && (
          <p className="text-14.5 text-ink leading-[1.6] bg-surface rounded-[10px] px-3.5 py-3 whitespace-pre-line">{c.approche}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 min-[1100px]:border-l min-[1100px]:border-line min-[1100px]:pl-[22px] max-[1099px]:border-t max-[1099px]:border-line max-[1099px]:pt-3.5">
        <div>
          <label htmlFor={`statut-${c.id}`} className="block text-13 font-bold tracking-[.06em] uppercase text-muted mb-[5px]">
            Statut
          </label>
          <select
            id={`statut-${c.id}`}
            value={c.statut}
            disabled={maj.isPending}
            onChange={(e) => {
              const s = e.target.value as StatutCandidature;
              const libelle = STATUTS_CANDIDATURE.find((x) => x.id === s)?.libelle.toLowerCase();
              enregistrer(s, notes, `Candidature passée en « ${libelle} ».`);
            }}
            className="w-full text-14.5 text-ink px-[11px] py-[9px] border-[1.5px] border-line rounded-[9px] bg-white outline-none focus:border-navy"
          >
            {STATUTS_CANDIDATURE.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`notes-${c.id}`} className="block text-13 font-bold tracking-[.06em] uppercase text-muted mb-[5px]">
            Notes internes
          </label>
          <textarea
            id={`notes-${c.id}`}
            value={notes}
            maxLength={5000}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes.trim() !== (c.notes ?? '').trim() && enregistrer(c.statut, notes, 'Note enregistrée.')}
            placeholder="Appel, rendez-vous, décision…"
            className="w-full min-h-[76px] text-14 text-ink leading-[1.5] px-[11px] py-[9px] border-[1.5px] border-line rounded-[9px] bg-white resize-y outline-none focus:border-navy"
          />
        </div>
        <a
          href={`mailto:${c.email}`}
          className="inline-flex items-center justify-center px-3.5 py-2 text-14.5 font-semibold rounded-[9px] text-navy border-[1.5px] border-line transition-colors hover:border-navy hover:bg-[#f0f2ff]"
        >
          Écrire à {c.prenom}
        </a>
      </div>
    </article>
  );
};

export default CandidaturesAdmin;
