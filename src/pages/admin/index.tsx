import React, { useMemo } from 'react';
import { useRouter } from 'next/router';
import { Clock, Mail, Star } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  Carte,
  Chargement,
  Erreur,
  FOND_PILIER,
  LIGNE_CLIQUABLE,
  Pastilles,
  TD,
  TH,
  TagFormule,
  pluriel,
} from '@/components/admin/elements';
import { useBilansAdmin, useCandidaturesAdmin, useComptesAdmin, useEstAdmin } from '@/hooks/useAdmin';
import { dateCourte, formuleDuCompte, ilYA } from '@/lib/admin/formule';
import { aTraiter, ateliersParPilier, chiffresCles, entonnoir, inscriptionsParSemaine } from '@/lib/admin/tableauDeBord';
import { PILIERS_ADMIN } from '@/lib/admin/types';

/*
 * Tableau de bord de l'administration — vue 1 de plateforme/admin.html :
 *   chiffres clés  4 colonnes, écart 16, liseré gauche 4px, valeur 34px / 800
 *   grilles        1.5fr / 1fr, écart 16
 *   histogramme    180px de haut, barres 44px maxi, rayon 7/7/3/3 ;
 *                  semaine en cours en turquoise
 *   piliers        grille 130px / barre 10px / 36px
 *   entonnoir      4 cases fond #f5f6fa, rayon 10, nombre 24px / 800
 */

const TENDANCE = 'font-bold text-fit-dark';

const Kpi: React.FC<{ libelle: string; valeur: number; couleur: string; children: React.ReactNode }> = ({
  libelle,
  valeur,
  couleur,
  children,
}) => (
  <div className="relative overflow-hidden bg-white border border-line rounded-card shadow-card pt-5 px-[22px] pb-[18px]">
    <span className={`absolute left-0 inset-y-0 w-1 ${couleur}`} aria-hidden />
    <div className="text-12.5 font-bold leading-[1.6] tracking-[.08em] uppercase text-muted mb-2">{libelle}</div>
    <div className="text-[34px] font-extrabold text-navy leading-none">{valeur}</div>
    <div className="text-13.5 text-muted mt-2">{children}</div>
  </div>
);

const ATraiterLigne: React.FC<{
  icone: React.ReactNode;
  fond: string;
  titre: string;
  detail: string;
  action?: { libelle: string; onClick: () => void };
}> = ({ icone, fond, titre, detail, action }) => (
  <div className="flex items-center gap-[13px] py-3 border-b border-line first:pt-0 last:pb-0 last:border-b-0">
    <div className={`w-[34px] h-[34px] rounded-[9px] flex items-center justify-center shrink-0 [&>svg]:w-[17px] [&>svg]:h-[17px] ${fond}`}>
      {icone}
    </div>
    <div className="flex-1 text-14.5 text-ink leading-[1.45]">
      {titre}
      <small className="block text-13 text-muted">{detail}</small>
    </div>
    {action && (
      <button type="button" onClick={action.onClick} className="text-14 font-bold text-navy hover:text-teal-dark whitespace-nowrap">
        {action.libelle} →
      </button>
    )}
  </div>
);

const TableauDeBordAdmin: React.FC = () => {
  const router = useRouter();
  const { estAdmin } = useEstAdmin();
  const comptes = useComptesAdmin(estAdmin);
  const bilans = useBilansAdmin(estAdmin);
  const candidatures = useCandidaturesAdmin(estAdmin);
  const erreur = comptes.error || bilans.error || candidatures.error;

  const d = useMemo(() => {
    if (!comptes.data || !bilans.data || !candidatures.data) return null;
    const maintenant = new Date();
    return {
      cles: chiffresCles(comptes.data, bilans.data, maintenant),
      semaines: inscriptionsParSemaine(comptes.data, maintenant),
      piliers: ateliersParPilier(comptes.data),
      etapes: entonnoir(comptes.data, bilans.data, maintenant),
      todo: aTraiter(comptes.data, candidatures.data, bilans.data, maintenant),
      derniers: comptes.data.slice(0, 5),
    };
  }, [comptes.data, bilans.data, candidatures.data]);

  const ouvrirCompte = (id: string) => router.push({ pathname: '/admin/comptes', query: { compte: id } });

  return (
    <AdminShell
      titre="Tableau de bord"
      sousTitre="Ce qui se passe sur Oskar : qui arrive, ce qu'ils font, ce qui attend une réponse de votre part."
    >
      {erreur ? (
        <Erreur message={(erreur as Error).message} />
      ) : !d ? (
        <Chargement />
      ) : (
        <>
          <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-4 gap-4 mb-[22px]">
            <Kpi libelle="Comptes" valeur={d.cles.comptes} couleur="bg-navy">
              <span className={TENDANCE}>+{d.cles.comptesCetteSemaine}</span> cette semaine
            </Kpi>
            <Kpi libelle="Bilans réalisés" valeur={d.cles.bilans} couleur="bg-teal">
              dont {d.cles.bilansSansCompte} sans compte
            </Kpi>
            <Kpi libelle="Ateliers commencés" valeur={d.cles.ateliers} couleur="bg-okr">
              par {pluriel(d.cles.comptesAvecAtelier, 'compte')}
            </Kpi>
            <Kpi libelle="Formules payantes" valeur={d.cles.payantes} couleur="bg-finance">
              {pluriel(d.cles.offertes, 'offerte')} · {pluriel(d.cles.abonnements, 'abonnement')}
            </Kpi>
          </div>

          <div className="grid grid-cols-1 min-[1100px]:grid-cols-[1.5fr_1fr] gap-4 mb-4 [&>section]:mb-0">
            <Carte titre="Nouveaux comptes par semaine">
              <Histogramme semaines={d.semaines} />
            </Carte>
            <Carte titre="Ateliers commencés, par pilier">
              {(() => {
                const max = Math.max(1, ...PILIERS_ADMIN.map((p) => d.piliers[p.id]));
                return PILIERS_ADMIN.map((p) => (
                  <div key={p.id} className="grid grid-cols-[130px_1fr_36px] items-center gap-3 mb-[13px] last:mb-0">
                    <span className="text-14.5 font-semibold text-navy">{p.nom}</span>
                    <div className="h-2.5 bg-surface rounded-md overflow-hidden">
                      <div className={`h-full rounded-md ${FOND_PILIER[p.id]}`} style={{ width: `${(d.piliers[p.id] / max) * 100}%` }} />
                    </div>
                    <span className="text-14 font-bold text-navy text-right">{d.piliers[p.id]}</span>
                  </div>
                ));
              })()}
            </Carte>
          </div>

          <div className="grid grid-cols-1 min-[1100px]:grid-cols-[1.5fr_1fr] gap-4 mb-4 [&>section]:mb-0">
            <Carte titre="Du bilan à la formule payante — 30 derniers jours">
              <div className="grid grid-cols-2 min-[700px]:grid-cols-4 gap-2.5">
                {d.etapes.map((e) => (
                  <div key={e.libelle} className="relative bg-surface rounded-[10px] pt-3.5 px-3.5 pb-3">
                    {e.taux != null && (
                      <em className="not-italic absolute top-3 right-3 text-12 font-bold text-navy-light">{e.taux} %</em>
                    )}
                    <strong className="block text-[24px] font-extrabold text-navy leading-[1.1]">{e.nombre}</strong>
                    <span className="block text-13 text-muted leading-[1.4] mt-1">{e.libelle}</span>
                  </div>
                ))}
              </div>
            </Carte>
            <Carte titre="À traiter">
              <ATraiterLigne
                icone={<Star aria-hidden />}
                fond="bg-coral-light text-coral-dark"
                titre={
                  d.todo.candidaturesNouvelles
                    ? `${pluriel(d.todo.candidaturesNouvelles, 'nouvelle candidature', 'nouvelles candidatures')} coach${d.todo.candidaturesNouvelles > 1 ? 's' : ''}`
                    : 'Aucune candidature coach en attente'
                }
                detail={
                  d.todo.plusAncienneCandidature
                    ? `La plus ancienne a été reçue ${ilYA(d.todo.plusAncienneCandidature)}`
                    : 'Les nouvelles arrivent aussi par email'
                }
                action={d.todo.candidaturesNouvelles ? { libelle: 'Voir', onClick: () => router.push('/admin/candidatures') } : undefined}
              />
              <ATraiterLigne
                icone={<Clock aria-hidden />}
                fond="bg-teal-light text-teal-dark"
                titre={
                  d.todo.offresQuiExpirent.length
                    ? `${pluriel(d.todo.offresQuiExpirent.length, 'formule offerte expire', 'formules offertes expirent')} dans moins de 30 jours`
                    : 'Aucune formule offerte ne se termine dans les 30 jours'
                }
                detail={
                  d.todo.offresQuiExpirent[0]
                    ? `${d.todo.offresQuiExpirent[0].compte.nom || d.todo.offresQuiExpirent[0].compte.email} — le ${dateCourte(
                        d.todo.offresQuiExpirent[0].formule.jusquAu as Date
                      )}`
                    : 'Les offres se prolongent depuis la fiche du compte'
                }
                action={
                  d.todo.offresQuiExpirent[0]
                    ? { libelle: 'Ouvrir', onClick: () => ouvrirCompte(d.todo.offresQuiExpirent[0].compte.id) }
                    : undefined
                }
              />
              <ATraiterLigne
                icone={<Mail aria-hidden />}
                fond="bg-vision-light text-vision-dark"
                titre={
                  d.todo.contactsARecontacter
                    ? `${pluriel(d.todo.contactsARecontacter, 'contact accepte', 'contacts acceptent')} d'être recontacté${d.todo.contactsARecontacter > 1 ? 's' : ''}`
                    : 'Aucun nouveau contact à recontacter'
                }
                detail="Bilans faits sans compte ces 7 derniers jours"
                action={d.todo.contactsARecontacter ? { libelle: 'Voir', onClick: () => router.push('/admin/contacts') } : undefined}
              />
            </Carte>
          </div>

          <Carte titre="Derniers comptes créés">
            {d.derniers.length === 0 ? (
              <p className="text-14.5 text-muted">Aucun compte pour l&rsquo;instant.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-14.5">
                  <thead>
                    <tr>
                      <th className={TH}>Dirigeant</th>
                      <th className={TH}>Métier</th>
                      <th className={TH}>Inscription</th>
                      <th className={TH}>Ateliers</th>
                      <th className={TH}>Formule</th>
                    </tr>
                  </thead>
                  <tbody className="[&>tr:last-child>td]:border-b-0">
                    {d.derniers.map((c) => (
                      <tr
                        key={c.id}
                        tabIndex={0}
                        className={LIGNE_CLIQUABLE}
                        onClick={() => ouvrirCompte(c.id)}
                        onKeyDown={(e) => e.key === 'Enter' && ouvrirCompte(c.id)}
                      >
                        <td className={TD}>
                          <div className="font-bold text-navy">{c.nom || c.email}</div>
                          <div className="text-13 text-muted">{c.entreprise || c.email}</div>
                        </td>
                        <td className={TD}>{c.activite || <span className="text-muted">—</span>}</td>
                        <td className={`${TD} text-muted`}>{dateCourte(c.creeLe)}</td>
                        <td className={TD}>
                          <Pastilles ateliers={c.ateliers} />
                        </td>
                        <td className={TD}>
                          <TagFormule formule={formuleDuCompte(c)} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Carte>
        </>
      )}
    </AdminShell>
  );
};

const Histogramme: React.FC<{ semaines: { libelle: string; nombre: number; courante: boolean }[] }> = ({ semaines }) => {
  const max = Math.max(1, ...semaines.map((s) => s.nombre));
  return (
    <>
      <div className="flex items-end gap-3 h-[180px] pt-2.5">
        {semaines.map((s) => (
          <div key={s.libelle} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
            <span className="text-13 font-bold text-navy">{s.nombre}</span>
            <div
              className={`w-full max-w-[44px] rounded-t-[7px] rounded-b-[3px] bg-gradient-to-b ${
                s.courante ? 'from-teal to-teal-dark' : 'from-navy-light to-navy'
              }`}
              style={{ height: Math.max(4, Math.round((s.nombre / max) * 130)) }}
            />
            <span className="text-12 font-semibold text-muted">{s.libelle}</span>
          </div>
        ))}
      </div>
      <div className="flex gap-[18px] mt-3.5 text-13 text-muted">
        <span>
          <i className="inline-block w-2.5 h-2.5 rounded-[3px] mr-1.5 align-[-1px] bg-navy" />
          Semaines passées
        </span>
        <span>
          <i className="inline-block w-2.5 h-2.5 rounded-[3px] mr-1.5 align-[-1px] bg-teal" />
          Semaine en cours
        </span>
      </div>
    </>
  );
};

export default TableauDeBordAdmin;
