import React, { useState } from 'react';
import Link from 'next/link';
import { Bell } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { BarreOutils, Bandeau, Chargement, Erreur, Puces, TAG } from '@/components/admin/elements';
import { useDemandesAdmin, useEstAdmin, useMajDemande } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { ilYA } from '@/lib/admin/formule';
import { STATUTS_DEMANDE, type DemandeAdmin, type StatutDemande } from '@/lib/admin/types';
import { OBJETS_DEMANDE, estSurMesure } from '@/lib/tarifs/formules';

/*
 * Demandes de formule — le formulaire de la page Tarifs, tant que Stripe n'est
 * pas branché. Même gabarit que les candidatures coachs : la carte à gauche,
 * le suivi (statut, notes internes, « Écrire à… ») à droite.
 * La formule elle-même s'active depuis Comptes (« Offrir la formule »).
 */

const TON_STATUT: Record<StatutDemande, string> = {
  nouvelle: 'bg-coral-light text-coral-dark',
  contactee: 'bg-vision-light text-vision-dark',
  activee: 'bg-fit-light text-fit-dark',
  abandonnee: 'bg-[#f3f4f6] text-[#6b7280]',
};

type Filtre = 'toutes' | StatutDemande;

const DemandesAdmin: React.FC = () => {
  const { estAdmin } = useEstAdmin();
  const { data: demandes, error, isLoading } = useDemandesAdmin(estAdmin);
  const [filtre, setFiltre] = useState<Filtre>('nouvelle');

  const liste = demandes ?? [];
  const options = [
    { id: 'toutes' as Filtre, libelle: 'Toutes', nombre: liste.length },
    ...STATUTS_DEMANDE.map((s) => ({
      id: s.id as Filtre,
      libelle: s.pluriel,
      nombre: liste.filter((d) => d.statut === s.id).length,
    })),
  ];
  const affichees = liste.filter((d) => filtre === 'toutes' || d.statut === filtre);

  return (
    <AdminShell
      titre="Demandes de formule"
      sousTitre="Les demandes reçues par le formulaire de la page Tarifs."
    >
      <Bandeau icone={<Bell aria-hidden />}>
        Chaque nouvelle demande est aussi envoyée par email à <strong className="text-navy">contact@oskar-coach.fr</strong>.
        Pour activer la formule, ouvrez le compte dans{' '}
        <Link href="/admin/comptes" className="font-semibold text-navy underline hover:text-teal-dark">
          Comptes
        </Link>{' '}
        puis « Offrir la formule » — la personne doit d’abord avoir créé son compte.
      </Bandeau>

      <BarreOutils>
        <Puces libelle="Filtrer par statut" options={options} valeur={filtre} onChange={setFiltre} />
      </BarreOutils>

      {error ? (
        <Erreur message={(error as Error).message} />
      ) : isLoading || !demandes ? (
        <Chargement />
      ) : affichees.length === 0 ? (
        <div className="bg-white border border-line rounded-card shadow-card p-[27.5px] text-center text-14.5 text-muted">
          Aucune demande dans cette catégorie.
        </div>
      ) : (
        <div className="grid gap-3.5">
          {affichees.map((d) => (
            <CarteDemande key={d.id} d={d} />
          ))}
        </div>
      )}
    </AdminShell>
  );
};

const CarteDemande: React.FC<{ d: DemandeAdmin }> = ({ d }) => {
  const toast = useToast();
  const maj = useMajDemande();
  const [notes, setNotes] = useState(d.notes ?? '');

  const enregistrer = async (statut: StatutDemande, texte: string, message: string) => {
    try {
      await maj.mutateAsync({ id: d.id, statut, notes: texte });
      toast.success(message);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'La modification n’a pas pu être enregistrée.');
    }
  };

  const statut = STATUTS_DEMANDE.find((s) => s.id === d.statut);
  const objet = OBJETS_DEMANDE.find((o) => o.id === d.objet);
  const surMesure = estSurMesure(d.objet);
  const comptes = d.comptes ? `${d.comptes} ${d.objet === 'reseau' ? 'adhérents' : 'comptes'}` : null;

  return (
    <article
      className={`bg-white border border-line rounded-card shadow-card px-[22px] py-5 grid grid-cols-1 min-[1100px]:grid-cols-[1fr_280px] gap-[22px] ${
        d.statut === 'nouvelle' ? 'border-l-4 border-l-coral' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5 flex-wrap mb-1">
          <h2 className="text-[18px] font-extrabold text-navy">
            {d.prenom} {d.nom}
          </h2>
          <span className={`${TAG} ${TON_STATUT[d.statut]}`}>{statut?.libelle}</span>
          <span className={`${TAG} ${surMesure ? 'bg-okr-light text-okr-dark' : 'bg-teal-light text-navy'}`}>
            {objet?.libelle ?? d.objet}
          </span>
        </div>
        <div className="text-14 text-muted mb-3">
          <strong className="font-semibold text-ink">{d.entreprise}</strong>
          {comptes && ` · ${comptes}`} · {d.email}
          {d.aUnCompte && ' · a un compte Oskar'} · reçue {ilYA(d.creeLe)}
        </div>
        {objet && <p className="text-13.5 text-muted mb-3">{objet.detail}</p>}
        {d.message && (
          <p className="text-14.5 text-ink leading-[1.6] bg-surface rounded-[10px] px-3.5 py-3 whitespace-pre-line">{d.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-3 min-[1100px]:border-l min-[1100px]:border-line min-[1100px]:pl-[22px] max-[1099px]:border-t max-[1099px]:border-line max-[1099px]:pt-3.5">
        <div>
          <label htmlFor={`statut-${d.id}`} className="block text-13 font-bold tracking-[.06em] uppercase text-muted mb-[5px]">
            Statut
          </label>
          <select
            id={`statut-${d.id}`}
            value={d.statut}
            disabled={maj.isPending}
            onChange={(e) => {
              const s = e.target.value as StatutDemande;
              const libelle = STATUTS_DEMANDE.find((x) => x.id === s)?.libelle.toLowerCase();
              enregistrer(s, notes, `Demande passée en « ${libelle} ».`);
            }}
            className="w-full text-14.5 text-ink px-[11px] py-[9px] border-[1.5px] border-line rounded-[9px] bg-white outline-none focus:border-navy"
          >
            {STATUTS_DEMANDE.map((s) => (
              <option key={s.id} value={s.id}>
                {s.libelle}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor={`notes-${d.id}`} className="block text-13 font-bold tracking-[.06em] uppercase text-muted mb-[5px]">
            Notes internes
          </label>
          <textarea
            id={`notes-${d.id}`}
            value={notes}
            maxLength={5000}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={() => notes.trim() !== (d.notes ?? '').trim() && enregistrer(d.statut, notes, 'Note enregistrée.')}
            placeholder="Appel, devis, facture envoyée…"
            className="w-full min-h-[76px] text-14 text-ink leading-[1.5] px-[11px] py-[9px] border-[1.5px] border-line rounded-[9px] bg-white resize-y outline-none focus:border-navy"
          />
        </div>
        <a
          href={`mailto:${d.email}`}
          className="inline-flex items-center justify-center px-3.5 py-2 text-14.5 font-semibold rounded-[9px] text-navy border-[1.5px] border-line transition-colors hover:border-navy hover:bg-[#f0f2ff]"
        >
          Écrire à {d.prenom}
        </a>
      </div>
    </article>
  );
};

export default DemandesAdmin;
