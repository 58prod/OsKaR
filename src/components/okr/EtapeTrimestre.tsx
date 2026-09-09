import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Coins, TrendingUp, Users, CalendarCheck, CheckCircle2, AlertTriangle, Plus, type LucideIcon } from 'lucide-react';
import { useCreateQuarterlyObjective, useUpdateQuarterlyObjective } from '@/hooks/useQuarterlyObjectives';
import {
  useCreateQuarterlyKeyResult,
  useDeleteQuarterlyKeyResult,
  useUpdateQuarterlyKeyResultProgress,
} from '@/hooks/useQuarterlyKeyResults';
import { useToast } from '@/hooks/useToast';
import type { Ambition, Quarter, QuarterlyKeyResult, QuarterlyObjective } from '@/types';
import { OkrModal, MODAL_INPUT, MODAL_LABEL, BTN_ANNULER, BTN_VALIDER, BTN_SUPPRIMER } from './OkrModal';
import {
  ANNEE,
  BTN_PRIMARY,
  ETAT_CLASSES,
  MAX_KR_PAR_OBJECTIF,
  QUARTERS,
  SLOT_COULEURS,
  etatKR,
  formatNombre,
  moyenne,
  nombreDepuisSaisie,
  pctKR,
  trimLabel,
} from './okrFlux';

/*
 * Étape 2 — « Mon trimestre » (vue-trimestre de okr.html).
 *
 * Un bloc par objectif annuel. Dans chaque bloc : l'objectif du trimestre
 * (QuarterlyObjective rattaché à l'ambition, pour le trimestre et l'année choisis)
 * et ses résultats clés (QuarterlyKeyResult, deux au plus). « Mettre à jour »
 * ouvre la modale à curseur de la maquette.
 *
 * Valeurs relevées :
 *   sélecteur   boutons 13.5/600, rayon 9px, padding 8/18 ; actif fond OKR blanc
 *   stat chip   blanche, rayon 12px, padding 14/18, icône 38px rayon 10px ; valeur 22/800 ; libellé 12 gris
 *   bloc        blanc, bord 1.5px, rayon 12px ; en-tête fond #fafbff padding 16/20, icône 38px rayon 10px
 *   parent      11/700 majuscules gris ; nom 15/700 navy ; barre 80×6 ; pct 13/700
 *   ligne KR    fond #fafbff, bord 1px, rayon 9px, padding 10/13 ; nom 13.5/500 ;
 *               valeur 12 gris 72px ; barre 80×5 ; pct 12/700 ; bouton 12/600 rayon 7px
 *   ajout KR    pointillé 1.5px #d0d5f0, 13/500 gris, rayon 8px
 *   modale      valeur 46/800 navy ; unité 13 gris ; curseur accent OKR ; bornes 11.5 gris
 */

const ICONES_SLOT: LucideIcon[] = [Coins, TrendingUp, Users];

interface EtapeTrimestreProps {
  userId: string;
  ambitions: Ambition[];
  quarter: Quarter;
  onQuarterChange: (q: Quarter) => void;
  objectifs: QuarterlyObjective[];
  /** Tous les KR trimestriels de l'utilisateur ; filtrés ici par objectif. */
  keyResults: QuarterlyKeyResult[];
  onRetourObjectifs: () => void;
  onSuivant: () => void;
}

export const EtapeTrimestre: React.FC<EtapeTrimestreProps> = ({
  userId,
  ambitions,
  quarter,
  onQuarterChange,
  objectifs,
  keyResults,
  onRetourObjectifs,
  onSuivant,
}) => {
  const toast = useToast();
  const creerObjectif = useCreateQuarterlyObjective();
  const modifierObjectif = useUpdateQuarterlyObjective();
  const creerKR = useCreateQuarterlyKeyResult();
  const majProgression = useUpdateQuarterlyKeyResultProgress();
  const supprimerKR = useDeleteQuarterlyKeyResult();

  /** Objectif du trimestre par ambition (le plus ancien s'il y en a plusieurs). */
  const objectifParAmbition = useMemo(() => {
    const m = new Map<string, QuarterlyObjective>();
    [...objectifs]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .forEach((o) => {
        if (o.ambitionId && !m.has(o.ambitionId)) m.set(o.ambitionId, o);
      });
    return m;
  }, [objectifs]);

  const krsParObjectif = useMemo(() => {
    const m = new Map<string, QuarterlyKeyResult[]>();
    [...keyResults]
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())
      .forEach((k) => {
        const liste = m.get(k.quarterlyObjectiveId) ?? [];
        liste.push(k);
        m.set(k.quarterlyObjectiveId, liste);
      });
    return m;
  }, [keyResults]);

  /* ── Titre de l'objectif trimestriel : saisie libre, sauvée en quittant le champ ── */
  const [titres, setTitres] = useState<Record<string, string>>({});
  const enCreationRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Quand les objectifs (re)chargent, on repart de leurs titres pour les champs non modifiés.
    setTitres((prev) => {
      const suivant: Record<string, string> = { ...prev };
      ambitions.forEach((a) => {
        const o = objectifParAmbition.get(a.id);
        if (o && suivant[a.id] === undefined) suivant[a.id] = o.title;
      });
      return suivant;
    });
  }, [ambitions, objectifParAmbition]);

  const titreAffiche = (a: Ambition) => titres[a.id] ?? objectifParAmbition.get(a.id)?.title ?? '';

  const sauverTitre = async (a: Ambition) => {
    const title = (titres[a.id] ?? '').trim();
    const existant = objectifParAmbition.get(a.id);
    try {
      if (existant) {
        if (title && title !== existant.title) {
          await modifierObjectif.mutateAsync({ id: existant.id, updates: { title }, userId });
        } else if (!title) {
          setTitres((p) => ({ ...p, [a.id]: existant.title }));
        }
      } else if (title && !enCreationRef.current.has(a.id)) {
        enCreationRef.current.add(a.id);
        try {
          await creerObjectif.mutateAsync({
            objective: { title, ambitionId: a.id, quarter, year: ANNEE },
            userId,
          });
        } finally {
          enCreationRef.current.delete(a.id);
        }
      }
    } catch (err) {
      console.error('Sauvegarde de l’objectif trimestriel impossible :', err);
      toast.error("L'objectif du trimestre n'a pas pu être enregistré.");
    }
  };

  // Changer de trimestre vide les saisies locales : chaque trimestre a ses propres objectifs.
  useEffect(() => {
    setTitres({});
  }, [quarter]);

  /* ── Modales ── */
  const [krEnCours, setKrEnCours] = useState<QuarterlyKeyResult | null>(null);
  const [valeur, setValeur] = useState(0);
  const [ajoutPour, setAjoutPour] = useState<QuarterlyObjective | null>(null);
  const [nouveau, setNouveau] = useState({ title: '', target: '', unit: '' });

  const ouvrirMaj = (kr: QuarterlyKeyResult) => {
    setKrEnCours(kr);
    setValeur(kr.current);
  };

  const enregistrerMaj = async () => {
    if (!krEnCours) return;
    try {
      await majProgression.mutateAsync({ id: krEnCours.id, current: valeur });
      setKrEnCours(null);
    } catch (err) {
      console.error('Mise à jour du résultat clé impossible :', err);
      toast.error('La progression n’a pas pu être enregistrée.');
    }
  };

  const supprimerEnCours = async () => {
    if (!krEnCours) return;
    if (!window.confirm(`Supprimer le résultat clé « ${krEnCours.title} » ?`)) return;
    try {
      await supprimerKR.mutateAsync(krEnCours.id);
      setKrEnCours(null);
    } catch (err) {
      console.error('Suppression du résultat clé impossible :', err);
      toast.error('Le résultat clé n’a pas pu être supprimé.');
    }
  };

  const ajouterKR = async () => {
    if (!ajoutPour) return;
    const title = nouveau.title.trim();
    const target = nombreDepuisSaisie(nouveau.target);
    if (!title || target === null || target <= 0) return;
    try {
      await creerKR.mutateAsync({
        keyResult: { quarterlyObjectiveId: ajoutPour.id, title, target, current: 0, unit: nouveau.unit.trim() },
        userId,
      });
      setAjoutPour(null);
      setNouveau({ title: '', target: '', unit: '' });
    } catch (err) {
      console.error('Création du résultat clé impossible :', err);
      toast.error('Le résultat clé n’a pas pu être ajouté.');
    }
  };

  /* ── Statistiques du trimestre ── */
  const krsTrimestre = useMemo(
    () => objectifs.flatMap((o) => krsParObjectif.get(o.id) ?? []),
    [objectifs, krsParObjectif]
  );
  const pcts = krsTrimestre.map(pctKR);
  const stats = [
    { icone: CalendarCheck, classes: 'bg-okr-light text-okr-dark', valeur: String(objectifs.length), libelle: `Objectifs ${trimLabel(quarter)}` },
    { icone: CheckCircle2, classes: 'bg-fit-light text-fit-dark', valeur: String(krsTrimestre.length), libelle: 'KRs actifs' },
    { icone: TrendingUp, classes: 'bg-finance-light text-finance-dark', valeur: `${moyenne(pcts)}%`, libelle: 'Progression' },
    { icone: AlertTriangle, classes: 'bg-[#fef2f2] text-[#dc2626]', valeur: String(pcts.filter((p) => etatKR(p) === 'off').length), libelle: 'KRs en retard' },
  ];

  const cibleAnnuelle = (a: Ambition) =>
    a.target !== null && a.target !== undefined ? `${formatNombre(a.target)} ${a.unit ?? ''}`.trim() : a.title;

  const pasCurseur = krEnCours && krEnCours.target <= 10 ? 0.5 : 1;

  return (
    <div>
      {/* Sélecteur de trimestre */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2" role="group" aria-label="Trimestre">
          {QUARTERS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => onQuarterChange(q)}
              aria-pressed={q === quarter}
              className={`px-[18px] py-2 rounded-[9px] border-[1.5px] text-13.5 font-semibold transition-all ${
                q === quarter ? 'bg-okr border-okr text-white' : 'bg-white border-line text-muted hover:border-okr hover:text-okr'
              }`}
            >
              {trimLabel(q)}
            </button>
          ))}
          <span className="text-13 text-muted ml-1.5">{ANNEE}</span>
        </div>
      </div>

      {/* Stat chips */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-7">
        {stats.map((s) => (
          <div key={s.libelle} className="bg-white border border-line rounded-card px-[18px] py-3.5 shadow-card flex items-center gap-3">
            <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${s.classes}`}>
              <s.icone className="w-[18px] h-[18px]" aria-hidden />
            </div>
            <div>
              <div className="text-22 font-extrabold text-navy leading-none">{s.valeur}</div>
              <div className="text-12 text-muted mt-0.5">{s.libelle}</div>
            </div>
          </div>
        ))}
      </div>

      {ambitions.length === 0 ? (
        <div className="bg-white border border-line rounded-card shadow-card px-6 py-10 text-center mb-4">
          <p className="text-15.5 font-bold text-navy mb-1.5">Commencez par vos objectifs annuels</p>
          <p className="text-13.5 text-muted mb-5">
            Le trimestre décline vos objectifs de l&rsquo;année : définissez-les d&rsquo;abord à l&rsquo;étape 1.
          </p>
          <button type="button" onClick={onRetourObjectifs} className={BTN_PRIMARY}>
            ← Définir mes objectifs annuels
          </button>
        </div>
      ) : (
        ambitions.map((a, i) => {
          const couleur = SLOT_COULEURS[i] ?? SLOT_COULEURS[0];
          const Icone = ICONES_SLOT[i] ?? Coins;
          const objectif = objectifParAmbition.get(a.id);
          const krs = objectif ? (krsParObjectif.get(objectif.id) ?? []) : [];
          const progression = moyenne(krs.map(pctKR));

          return (
            <section
              key={a.id}
              aria-label={`Objectif annuel ${i + 1}`}
              className="bg-white border-[1.5px] border-line rounded-card mb-4 shadow-card overflow-hidden transition-colors hover:border-okr/25"
            >
              <div className="flex items-center gap-3.5 px-5 py-4 border-b border-line bg-[#fafbff]">
                <div className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${couleur.icone}`}>
                  <Icone className="w-[18px] h-[18px]" aria-hidden />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-11 font-bold uppercase tracking-[0.8px] text-muted mb-0.5 truncate">
                    Objectif annuel {i + 1} · {cibleAnnuelle(a)}
                  </div>
                  <input
                    type="text"
                    value={titreAffiche(a)}
                    onChange={(e) => setTitres((p) => ({ ...p, [a.id]: e.target.value }))}
                    onBlur={() => sauverTitre(a)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                    }}
                    placeholder={`Quel est votre objectif pour ${trimLabel(quarter)} ? Ex : Augmenter les ventes`}
                    aria-label={`Objectif du trimestre pour « ${a.title} »`}
                    className="w-full bg-transparent border-none outline-none p-0 text-15 font-bold text-navy placeholder:text-[#bcc3d8] placeholder:font-medium"
                  />
                </div>
                {objectif && krs.length > 0 && (
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="w-20 h-1.5 bg-[#eef0f8] rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${couleur.barre}`} style={{ width: `${progression}%` }} />
                    </div>
                    <span className="text-13 font-bold text-navy min-w-[32px] text-right">{progression}%</span>
                  </div>
                )}
              </div>

              <div className="px-5 py-4">
                {!objectif ? (
                  <p className="text-13 text-muted">
                    Nommez votre objectif du trimestre ci-dessus, puis ajoutez-lui jusqu&rsquo;à deux résultats clés chiffrés.
                  </p>
                ) : (
                  <>
                    {krs.map((kr) => {
                      const pct = pctKR(kr);
                      const etat = ETAT_CLASSES[etatKR(pct)];
                      return (
                        <div
                          key={kr.id}
                          role="button"
                          tabIndex={0}
                          onClick={() => ouvrirMaj(kr)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.preventDefault();
                              ouvrirMaj(kr);
                            }
                          }}
                          className="flex items-center gap-3 px-[13px] py-2.5 rounded-[9px] border border-line mb-2 bg-[#fafbff] cursor-pointer transition-all hover:border-okr/30 hover:bg-white hover:shadow-[0_2px_8px_rgba(99,102,241,0.07)]"
                        >
                          <span className={`w-[9px] h-[9px] rounded-full shrink-0 ${etat.point}`} aria-hidden />
                          <span className="flex-1 min-w-0 text-13.5 font-medium text-ink truncate">{kr.title}</span>
                          <span className="text-12 text-muted whitespace-nowrap min-w-[72px] text-right">
                            {formatNombre(kr.current)} / {formatNombre(kr.target)} {kr.unit}
                          </span>
                          <div className="w-20 h-[5px] bg-[#eef0f8] rounded-full overflow-hidden shrink-0">
                            <div className={`h-full rounded-full ${etat.barre}`} style={{ width: `${pct}%` }} />
                          </div>
                          <span className={`text-12 font-bold min-w-[30px] text-right shrink-0 ${etat.pct}`}>{pct}%</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              ouvrirMaj(kr);
                            }}
                            className="bg-white border-[1.5px] border-line text-muted rounded-[7px] px-2.5 py-[5px] text-12 font-semibold whitespace-nowrap shrink-0 transition-all hover:border-okr hover:text-okr hover:bg-okr-light"
                          >
                            Mettre à jour
                          </button>
                        </div>
                      );
                    })}
                    {krs.length < MAX_KR_PAR_OBJECTIF && (
                      <button
                        type="button"
                        onClick={() => {
                          setNouveau({ title: '', target: '', unit: '' });
                          setAjoutPour(objectif);
                        }}
                        className="flex items-center gap-[7px] w-full px-3 py-2 mt-1 rounded-lg border-[1.5px] border-dashed border-[#d0d5f0] text-muted text-13 font-medium transition-all hover:border-okr hover:text-okr hover:bg-okr-light"
                      >
                        <Plus className="w-[13px] h-[13px]" aria-hidden />
                        Ajouter un résultat clé (max {MAX_KR_PAR_OBJECTIF})
                      </button>
                    )}
                  </>
                )}
              </div>
            </section>
          );
        })
      )}

      <div className="flex justify-end mt-1">
        <button type="button" onClick={onSuivant} className={BTN_PRIMARY}>
          Voir mes actions →
        </button>
      </div>

      {/* Modale : mise à jour d'un KR */}
      <OkrModal
        open={!!krEnCours}
        onClose={() => setKrEnCours(null)}
        eyebrow="Résultat clé · mise à jour"
        titre={krEnCours?.title ?? ''}
        texte="Où en êtes-vous aujourd’hui ?"
      >
        {krEnCours && (
          <>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step={pasCurseur}
              value={valeur}
              onChange={(e) => setValeur(Number(e.target.value) || 0)}
              aria-label="Valeur actuelle"
              className="w-full text-center text-[46px] leading-none font-extrabold text-navy bg-transparent border-none outline-none mb-1 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
            />
            <div className="text-center text-13 text-muted mb-4">{krEnCours.unit || 'unités'}</div>
            <input
              type="range"
              min={0}
              max={krEnCours.target}
              step={pasCurseur}
              value={Math.min(valeur, krEnCours.target)}
              onChange={(e) => setValeur(Number(e.target.value))}
              aria-label="Curseur de progression"
              className="w-full accent-okr cursor-pointer mb-1.5"
            />
            <div className="flex justify-between text-11.5 text-muted mb-6">
              <span>0 {krEnCours.unit}</span>
              <span>
                {formatNombre(krEnCours.target)} {krEnCours.unit}
              </span>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-1">
              <button type="button" onClick={supprimerEnCours} className={BTN_SUPPRIMER}>
                Supprimer ce résultat clé
              </button>
              <button type="button" onClick={() => setKrEnCours(null)} className={BTN_ANNULER}>
                Annuler
              </button>
              <button type="button" onClick={enregistrerMaj} disabled={majProgression.isPending} className={BTN_VALIDER}>
                Enregistrer
              </button>
            </div>
          </>
        )}
      </OkrModal>

      {/* Modale : nouveau KR */}
      <OkrModal
        open={!!ajoutPour}
        onClose={() => setAjoutPour(null)}
        eyebrow="Nouveau résultat clé"
        titre="Comment mesurer le succès ?"
        texte="Un résultat clé est chiffré : une cible et une unité, que vous mettrez à jour au fil du trimestre."
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            ajouterKR();
          }}
        >
          <div className={MODAL_LABEL}>Intitulé du résultat clé</div>
          <input
            type="text"
            autoFocus
            value={nouveau.title}
            onChange={(e) => setNouveau((n) => ({ ...n, title: e.target.value }))}
            placeholder="Ex : Signer 3 partenariats commerciaux"
            className={`${MODAL_INPUT} mb-4`}
          />
          <div className="flex gap-2.5 mb-4">
            <div className="flex-1">
              <div className={MODAL_LABEL}>Cible</div>
              <input
                type="text"
                inputMode="decimal"
                value={nouveau.target}
                onChange={(e) => setNouveau((n) => ({ ...n, target: e.target.value }))}
                placeholder="Ex : 3"
                className={MODAL_INPUT}
              />
            </div>
            <div className="flex-[1.4]">
              <div className={MODAL_LABEL}>Unité</div>
              <input
                type="text"
                value={nouveau.unit}
                onChange={(e) => setNouveau((n) => ({ ...n, unit: e.target.value }))}
                placeholder="Ex : partenariats"
                className={MODAL_INPUT}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2.5 mt-1">
            <button type="button" onClick={() => setAjoutPour(null)} className={BTN_ANNULER}>
              Annuler
            </button>
            <button
              type="submit"
              disabled={
                creerKR.isPending || !nouveau.title.trim() || (nombreDepuisSaisie(nouveau.target) ?? 0) <= 0
              }
              className={BTN_VALIDER}
            >
              Ajouter →
            </button>
          </div>
        </form>
      </OkrModal>
    </div>
  );
};

export default EtapeTrimestre;
