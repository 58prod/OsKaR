import React, { useCallback, useMemo, useState } from 'react';
import { useRouter } from 'next/router';
import { AdminShell } from '@/components/admin/AdminShell';
import { FicheCompteVolet } from '@/components/admin/FicheCompteVolet';
import {
  BarreOutils,
  CadreTableau,
  Chargement,
  Erreur,
  LIGNE_CLIQUABLE,
  Pastilles,
  Puces,
  Recherche,
  TD,
  TH,
  TagFormule,
  pluriel,
} from '@/components/admin/elements';
import { useComptesAdmin, useEstAdmin } from '@/hooks/useAdmin';
import { dateCourte, formuleDuCompte, ilYA, type GenreFormule } from '@/lib/admin/formule';
import type { CompteAdmin } from '@/lib/admin/types';

/*
 * Comptes — vue 2 de plateforme/admin.html : recherche, filtres par formule,
 * tableau ; un clic sur une ligne ouvre la fiche dans le volet latéral.
 * La fiche ouverte est dans l'adresse (?compte=<id>), pour y revenir ou la
 * partager entre administrateurs.
 */

type Filtre = 'tous' | Exclude<GenreFormule, 'demo'>;

const FILTRES: { id: Filtre; libelle: string }[] = [
  { id: 'tous', libelle: 'Tous' },
  { id: 'gratuit', libelle: 'Gratuits' },
  { id: 'offerte', libelle: 'Formule offerte' },
  { id: 'abonne', libelle: 'Abonnés' },
];

const ComptesAdmin: React.FC = () => {
  const router = useRouter();
  const { estAdmin } = useEstAdmin();
  const { data: comptes, error, isLoading } = useComptesAdmin(estAdmin);
  const [filtre, setFiltre] = useState<Filtre>('tous');
  const [recherche, setRecherche] = useState('');

  const avecFormule = useMemo(
    () => (comptes ?? []).map((c) => ({ compte: c, formule: formuleDuCompte(c) })),
    [comptes]
  );

  const options = FILTRES.map((f) => ({
    ...f,
    nombre: f.id === 'tous' ? avecFormule.length : avecFormule.filter((x) => x.formule.genre === f.id).length,
  }));

  const q = recherche.trim().toLowerCase();
  const lignes = avecFormule.filter(
    ({ compte: c, formule }) =>
      (filtre === 'tous' || formule.genre === filtre) &&
      (!q || [c.nom, c.entreprise, c.email, c.activite].filter(Boolean).join(' ').toLowerCase().includes(q))
  );

  const idOuvert = typeof router.query.compte === 'string' ? router.query.compte : null;
  const ouvert: CompteAdmin | null = (comptes ?? []).find((c) => c.id === idOuvert) ?? null;

  const ouvrir = (id: string) => router.replace({ pathname: router.pathname, query: { compte: id } }, undefined, { shallow: true });
  const fermer = useCallback(
    () => router.replace({ pathname: router.pathname }, undefined, { shallow: true }),
    [router]
  );

  return (
    <AdminShell
      titre="Comptes"
      sousTitre="Tous les comptes créés sur Oskar. Ouvrez une fiche pour voir où en est la personne, ou pour lui offrir la formule payante."
    >
      <BarreOutils>
        <Recherche valeur={recherche} onChange={setRecherche} placeholder="Nom, entreprise, email, métier…" />
        <Puces libelle="Filtrer par formule" options={options} valeur={filtre} onChange={setFiltre} />
      </BarreOutils>

      {error ? (
        <Erreur message={(error as Error).message} />
      ) : isLoading || !comptes ? (
        <Chargement />
      ) : (
        <CadreTableau
          pied={
            <>
              <span>
                {pluriel(lignes.length, 'compte')} sur {comptes.length}
              </span>
              <span>Pastilles : Vision · Market Fit · Finance · OKR · Team</span>
            </>
          }
        >
          <table className="w-full border-collapse text-14.5">
            <thead>
              <tr>
                <th className={TH}>Dirigeant</th>
                <th className={TH}>Métier</th>
                <th className={TH}>Inscription</th>
                <th className={TH}>Dernière connexion</th>
                <th className={TH}>Ateliers</th>
                <th className={TH}>Bilans</th>
                <th className={TH}>Formule</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {lignes.map(({ compte: c, formule }) => (
                <tr
                  key={c.id}
                  tabIndex={0}
                  className={LIGNE_CLIQUABLE}
                  onClick={() => ouvrir(c.id)}
                  onKeyDown={(e) => e.key === 'Enter' && ouvrir(c.id)}
                >
                  <td className={TD}>
                    <div className="font-bold text-navy">{c.nom || c.email}</div>
                    <div className="text-13 text-muted">
                      {[c.entreprise, c.email].filter(Boolean).join(' · ')}
                    </div>
                  </td>
                  <td className={TD}>{c.activite || <span className="text-muted">—</span>}</td>
                  <td className={`${TD} text-muted whitespace-nowrap`}>{dateCourte(c.creeLe)}</td>
                  <td className={`${TD} text-muted whitespace-nowrap`}>{ilYA(c.derniereConnexion)}</td>
                  <td className={TD}>
                    <Pastilles ateliers={c.ateliers} />
                  </td>
                  <td className={TD}>{c.nbBilans}</td>
                  <td className={TD}>
                    <TagFormule formule={formule} />
                  </td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={7} className={`${TD} text-center text-muted py-7`}>
                    Aucun compte ne correspond.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CadreTableau>
      )}

      <FicheCompteVolet compte={ouvert} onFermer={fermer} />
    </AdminShell>
  );
};

export default ComptesAdmin;
