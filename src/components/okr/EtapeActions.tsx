import React, { useEffect, useMemo, useState } from 'react';
import { Circle, Clock, CheckCircle2, Plus, Calendar } from 'lucide-react';
import { useCreateAction, useDeleteAction, useUpdateAction } from '@/hooks/useActions';
import { useToast } from '@/hooks/useToast';
import { ActionStatus, type Action, type Quarter, type QuarterlyKeyResult } from '@/types';
import { OkrModal, MODAL_INPUT, MODAL_LABEL, BTN_ANNULER, BTN_VALIDER, BTN_SUPPRIMER } from './OkrModal';
import {
  ANNEE,
  BTN_PRIMARY,
  PRIOS,
  PRIO_CHIP_SELECTED,
  PRIO_EMOJI,
  PRIO_LABEL,
  PRIO_TAG,
  court,
  depuisInputDate,
  prioDepuisPriority,
  priorityDepuisPrio,
  texteEcheance,
  trimLabel,
  versInputDate,
  type Prio,
} from './okrFlux';

/*
 * Étape 3 — « Mes actions » (vue-actions de okr.html) : kanban à trois colonnes.
 *
 * Les actions peuvent être libres ou rattachées à un résultat clé du trimestre
 * (colonne key_result_id, facultative). On affiche les actions rattachées aux KR
 * du trimestre sélectionné, plus les actions libres. Pas de glisser-déposer sur la
 * maquette : le statut se change dans la fiche de l'action (clic sur la carte).
 *
 * Valeurs relevées :
 *   colonne    fond #f0f2fa, rayon 12px, padding 14px, 400px min ; titre 13/700 navy
 *   compteur   11.5/700, rayon 999px, 2/8 ; en cours OKR clair ; terminé fit clair
 *   carte      blanche, bord 1px, rayon 10px, padding 13/14 ; nom 13.5/600 navy
 *   pastilles  11/600, rayon 999px, 2/8 ; date 11 gris à droite avec icône 11px
 *   ajout      pointillé 1.5px #c8cde8, 13/500 gris, rayon 9px, padding 9/12
 *   modale     chips priorité 12.5/600 rayon 9px ; chips KR 12/600 rayon 999px
 */

interface Colonne {
  statut: ActionStatus;
  titre: string;
  icone: React.ReactNode;
  compteur: string;
  ajout: boolean;
}

const COLONNES: Colonne[] = [
  {
    statut: ActionStatus.TODO,
    titre: 'À faire',
    icone: <Circle className="w-3.5 h-3.5 text-muted" aria-hidden />,
    compteur: 'bg-white text-muted border-line',
    ajout: true,
  },
  {
    statut: ActionStatus.IN_PROGRESS,
    titre: 'En cours',
    icone: <Clock className="w-3.5 h-3.5 text-okr" aria-hidden />,
    compteur: 'bg-okr-light text-okr-dark border-okr/20',
    ajout: true,
  },
  {
    statut: ActionStatus.DONE,
    titre: 'Terminé',
    icone: <CheckCircle2 className="w-3.5 h-3.5 text-fit-dark" aria-hidden />,
    compteur: 'bg-fit-light text-fit-dark border-fit/20',
    ajout: false,
  },
];

const STATUT_LABEL: Record<ActionStatus, string> = {
  [ActionStatus.TODO]: 'À faire',
  [ActionStatus.IN_PROGRESS]: 'En cours',
  [ActionStatus.DONE]: 'Terminé',
};

interface Fiche {
  id?: string;
  title: string;
  prio: Prio;
  krId: string;
  deadline: string;
  statut: ActionStatus;
}

const FICHE_VIDE: Fiche = { title: '', prio: 'haute', krId: '', deadline: '', statut: ActionStatus.TODO };

interface EtapeActionsProps {
  userId: string;
  quarter: Quarter;
  actions: Action[];
  /** Résultats clés du trimestre sélectionné (pour filtrer et rattacher). */
  keyResults: QuarterlyKeyResult[];
  /** Incrémenté par la page quand la barre du haut demande une nouvelle action. */
  demandeNouvelle: number;
}

export const EtapeActions: React.FC<EtapeActionsProps> = ({ userId, quarter, actions, keyResults, demandeNouvelle }) => {
  const toast = useToast();
  const creer = useCreateAction();
  const modifier = useUpdateAction(userId);
  const supprimer = useDeleteAction(userId);

  const [fiche, setFiche] = useState<Fiche | null>(null);

  useEffect(() => {
    if (demandeNouvelle > 0) setFiche({ ...FICHE_VIDE });
  }, [demandeNouvelle]);

  const krParId = useMemo(() => new Map(keyResults.map((k) => [k.id, k])), [keyResults]);

  const visibles = useMemo(
    () =>
      actions
        .filter((a) => !a.quarterlyKeyResultId || krParId.has(a.quarterlyKeyResultId))
        .sort((a, b) => a.order_index - b.order_index || a.createdAt.getTime() - b.createdAt.getTime()),
    [actions, krParId]
  );

  const parStatut = (statut: ActionStatus) =>
    visibles.filter((a) => (statut === ActionStatus.TODO ? !isKnown(a.status) || a.status === statut : a.status === statut));

  const ouvrirEdition = (a: Action) =>
    setFiche({
      id: a.id,
      title: a.title,
      prio: prioDepuisPriority(a.priority),
      krId: a.quarterlyKeyResultId && krParId.has(a.quarterlyKeyResultId) ? a.quarterlyKeyResultId : '',
      deadline: versInputDate(a.deadline),
      statut: isKnown(a.status) ? a.status : ActionStatus.TODO,
    });

  const enregistrer = async () => {
    if (!fiche) return;
    const title = fiche.title.trim();
    if (!title) return;
    const commun = {
      title,
      priority: priorityDepuisPrio(fiche.prio),
      quarterlyKeyResultId: fiche.krId,
      deadline: depuisInputDate(fiche.deadline),
      status: fiche.statut,
    };
    try {
      if (fiche.id) {
        await modifier.mutateAsync({ id: fiche.id, updates: commun });
      } else {
        await creer.mutateAsync({ action: { ...commun, labels: [] }, userId });
      }
      setFiche(null);
    } catch (err) {
      console.error('Enregistrement de l’action impossible :', err);
      toast.error("L'action n'a pas pu être enregistrée.");
    }
  };

  const supprimerFiche = async () => {
    if (!fiche?.id) return;
    if (!window.confirm(`Supprimer l'action « ${fiche.title} » ?`)) return;
    try {
      await supprimer.mutateAsync(fiche.id);
      setFiche(null);
    } catch (err) {
      console.error('Suppression de l’action impossible :', err);
      toast.error("L'action n'a pas pu être supprimée.");
    }
  };

  const enAttente = creer.isPending || modifier.isPending;

  return (
    <div>
      <div className="flex items-center justify-between gap-4 mb-5">
        <div>
          <h1 className="text-19.5 font-bold text-navy">
            Mes actions · {trimLabel(quarter)} {ANNEE}
          </h1>
          <p className="text-13 text-muted mt-0.5">Ajoutez librement, rattachez à un KR si vous le souhaitez</p>
        </div>
        <button type="button" onClick={() => setFiche({ ...FICHE_VIDE })} className={BTN_PRIMARY}>
          <Plus className="w-[15px] h-[15px]" aria-hidden />
          Nouvelle action
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {COLONNES.map((col) => {
          const cartes = parStatut(col.statut);
          return (
            <section key={col.statut} aria-label={col.titre} className="bg-[#f0f2fa] rounded-card p-3.5 min-h-[400px]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-[7px] text-13 font-bold text-navy">
                  {col.icone}
                  {col.titre}
                </div>
                <span className={`text-11.5 font-bold rounded-full px-2 py-0.5 border ${col.compteur}`}>{cartes.length}</span>
              </div>

              {cartes.map((a) => {
                const termine = a.status === ActionStatus.DONE;
                const prio = prioDepuisPriority(a.priority);
                const kr = a.quarterlyKeyResultId ? krParId.get(a.quarterlyKeyResultId) : undefined;
                const echeance = termine ? null : texteEcheance(a.deadline);
                return (
                  <button
                    key={a.id}
                    type="button"
                    onClick={() => ouvrirEdition(a)}
                    className={`block w-full text-left bg-white border border-line rounded-[10px] px-3.5 py-[13px] mb-2 shadow-[0_1px_4px_rgba(30,45,125,0.05)] transition-all hover:border-okr/30 hover:shadow-[0_3px_12px_rgba(99,102,241,0.1)] hover:-translate-y-px ${
                      termine ? 'opacity-70' : ''
                    }`}
                  >
                    <div className={`text-13.5 font-semibold leading-[1.35] mb-2 ${termine ? 'line-through text-muted' : 'text-navy'}`}>
                      {a.title}
                    </div>
                    <div className="flex items-center gap-[7px] flex-wrap">
                      <span className={`text-11 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap ${PRIO_TAG[prio]}`}>
                        {PRIO_LABEL[prio]}
                      </span>
                      {kr && (
                        <span className="text-11 font-semibold px-2 py-0.5 rounded-full whitespace-nowrap bg-okr-light text-okr-dark">
                          KR {court(kr.title)}
                        </span>
                      )}
                      {echeance && (
                        <span className="text-11 text-muted ml-auto flex items-center gap-1">
                          <Calendar className="w-[11px] h-[11px]" aria-hidden />
                          {echeance}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })}

              {col.ajout && (
                <button
                  type="button"
                  onClick={() => setFiche({ ...FICHE_VIDE, statut: col.statut })}
                  className="flex items-center gap-[7px] w-full px-3 py-[9px] rounded-[9px] border-[1.5px] border-dashed border-[#c8cde8] text-muted text-13 font-medium transition-all hover:border-okr hover:text-okr hover:bg-okr-light"
                >
                  <Plus className="w-[13px] h-[13px]" aria-hidden />
                  Ajouter une action
                </button>
              )}
            </section>
          );
        })}
      </div>

      {/* Modale : nouvelle action / modification */}
      <OkrModal
        open={!!fiche}
        onClose={() => setFiche(null)}
        eyebrow={fiche?.id ? "Modifier l'action" : 'Nouvelle action'}
        titre="Qu’allez-vous faire ?"
        texte="Décrivez une action concrète. Rattachez-la à un résultat clé si vous le souhaitez — ce n’est pas obligatoire."
      >
        {fiche && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              enregistrer();
            }}
          >
            <div className={MODAL_LABEL}>Description de l&rsquo;action</div>
            <input
              type="text"
              autoFocus
              value={fiche.title}
              onChange={(e) => setFiche({ ...fiche, title: e.target.value })}
              placeholder="Ex : Contacter 5 prospects cette semaine"
              className={`${MODAL_INPUT} mb-4`}
            />

            <div className={MODAL_LABEL}>Priorité</div>
            <div className="flex gap-2 mb-4" role="radiogroup" aria-label="Priorité">
              {PRIOS.map((p) => (
                <button
                  key={p}
                  type="button"
                  role="radio"
                  aria-checked={fiche.prio === p}
                  onClick={() => setFiche({ ...fiche, prio: p })}
                  className={`flex-1 px-1.5 py-2 rounded-[9px] border-[1.5px] text-center text-12.5 font-semibold transition-all ${
                    fiche.prio === p ? PRIO_CHIP_SELECTED[p] : 'border-line text-muted bg-white hover:border-okr hover:text-okr'
                  }`}
                >
                  {PRIO_EMOJI[p]} {PRIO_LABEL[p]}
                </button>
              ))}
            </div>

            <div className={MODAL_LABEL}>
              Rattacher à un résultat clé <span className="font-normal text-muted">(optionnel)</span>
            </div>
            {keyResults.length === 0 ? (
              <p className="text-12.5 text-muted mb-5">
                Aucun résultat clé pour {trimLabel(quarter)} {ANNEE} : ajoutez-en à l&rsquo;étape 2 pour rattacher vos actions.
              </p>
            ) : (
              <div className="flex flex-wrap gap-2 mb-5">
                {keyResults.map((kr) => {
                  const choisi = fiche.krId === kr.id;
                  return (
                    <button
                      key={kr.id}
                      type="button"
                      aria-pressed={choisi}
                      onClick={() => setFiche({ ...fiche, krId: choisi ? '' : kr.id })}
                      className={`px-3 py-1.5 rounded-full border-[1.5px] text-12 font-semibold transition-all ${
                        choisi ? 'bg-okr-light border-okr text-okr-dark' : 'bg-white border-line text-muted hover:border-okr hover:text-okr'
                      }`}
                    >
                      {court(kr.title, 34)}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="flex gap-2.5 mb-5">
              <div className="flex-1">
                <div className={MODAL_LABEL}>
                  Échéance <span className="font-normal text-muted">(optionnel)</span>
                </div>
                <input
                  type="date"
                  value={fiche.deadline}
                  onChange={(e) => setFiche({ ...fiche, deadline: e.target.value })}
                  className={MODAL_INPUT}
                />
              </div>
              {fiche.id && (
                <div className="flex-[1.3]">
                  <div className={MODAL_LABEL}>Statut</div>
                  <div className="flex gap-1.5" role="radiogroup" aria-label="Statut">
                    {COLONNES.map((col) => (
                      <button
                        key={col.statut}
                        type="button"
                        role="radio"
                        aria-checked={fiche.statut === col.statut}
                        onClick={() => setFiche({ ...fiche, statut: col.statut })}
                        className={`flex-1 px-1 py-2 rounded-[9px] border-[1.5px] text-center text-12 font-semibold transition-all ${
                          fiche.statut === col.statut
                            ? 'bg-okr-light border-okr text-okr-dark'
                            : 'border-line text-muted bg-white hover:border-okr hover:text-okr'
                        }`}
                      >
                        {STATUT_LABEL[col.statut]}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2.5 mt-1">
              {fiche.id && (
                <button type="button" onClick={supprimerFiche} className={BTN_SUPPRIMER}>
                  Supprimer
                </button>
              )}
              <button type="button" onClick={() => setFiche(null)} className={BTN_ANNULER}>
                Annuler
              </button>
              <button type="submit" disabled={enAttente || !fiche.title.trim()} className={BTN_VALIDER}>
                {fiche.id ? 'Enregistrer' : "Ajouter l'action →"}
              </button>
            </div>
          </form>
        )}
      </OkrModal>
    </div>
  );
};

/** Les statuts BLOCKED / CANCELLED de la base sont rangés dans « À faire ». */
function isKnown(s: ActionStatus): boolean {
  return s === ActionStatus.TODO || s === ActionStatus.IN_PROGRESS || s === ActionStatus.DONE;
}

export default EtapeActions;
