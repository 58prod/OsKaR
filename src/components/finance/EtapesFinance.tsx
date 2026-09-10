import React from 'react';
import { CarteAtelier, ChampAtelier, EnTeteEtapeAtelier } from '@/components/atelier/champs';
import {
  BoutonAjout,
  CELLULE_NOMBRE,
  CELLULE_TEXTE,
  CHEVRON,
  Ligne,
  MenuCellule,
  Resultats,
  TD,
  TD_CALCUL,
  Tableau,
} from './tableau';
import {
  CATEGORIES_FIXES,
  COMPRESSIBLE,
  LEVIERS,
  MAITRISABLE,
  TENDANCES,
  TYPES_REVENU,
  calculCouts,
  calculRentabilite,
  calculRevenus,
  euros,
  lectureObjectif,
  nouveauCoutFixe,
  nouveauCoutVariable,
  nouveauRevenu,
  reportCouts,
  type AtelierFinance,
  type CoutFixe,
  type CoutVariable,
  type Decision,
  type Revenu,
} from '@/lib/finance/types';
import type { JeuExemples } from '@/lib/exemples';

/*
 * Les quatre étapes de saisie de l'atelier Finance, transposées de
 * `finance-atelier.html`. La sauvegarde est gérée par `useAtelier`.
 *
 * Les textes d'aide et les questions sont ceux de la maquette ; les exemples
 * des champs viennent du métier déclaré (`useExemples`), jamais écrits en dur.
 */

interface EtapeProps {
  atelier: AtelierFinance;
  modifier: (patch: Partial<AtelierFinance>) => void;
  exemples: JeuExemples;
}

const pourcent = (p: number | null) => (p === null ? '—' : `${p}%`);

/** Champ de montant de l'étape 3 : 46px, focus orange (`input[type=number]` de la maquette). */
const CHAMP_MONTANT =
  'w-full bg-surface border-[1.5px] border-line rounded-[10.5px] px-3.5 py-[11.5px] text-16 leading-[normal] text-ink outline-none transition-colors placeholder:text-muted placeholder:text-15 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none focus:border-finance focus:bg-white focus:shadow-[0_0_0_3px_rgba(245,158,11,0.12)]';

const LIBELLE = 'block text-14.5 font-semibold text-navy mb-[5px]';

/* ═══ Étape 1 — Revenus ═══ */

export const EtapeRevenus: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const ex = exemples.finance;
  const calcul = calculRevenus(atelier);
  const maj = (id: string, patch: Partial<Revenu>) =>
    modifier({ revenus: atelier.revenus.map((r) => (r.id === id ? { ...r, ...patch } : r)) });

  return (
    <div>
      <EnTeteEtapeAtelier
        titre="Cartographiez vos revenus"
        promesse="Comprendre d’où vient la valeur"
        aide="Listez toutes vos sources de revenus actuelles. Distinguer récurrents, projets et autres est fondamental pour comprendre la solidité de votre modèle."
      />

      <CarteAtelier>
        <ChampAtelier
          id="periode"
          label="Période analysée"
          value={atelier.periode}
          onChange={(v) => modifier({ periode: v })}
          placeholder="ex : Année 2024 / T1-T2 2025"
        />
      </CarteAtelier>

      <CarteAtelier prefixe="Flux de revenus">
        <Tableau
          colonnes={[
            { titre: 'Source / Offre', largeur: 'w-[35%]' },
            { titre: 'Type', largeur: 'w-[18%]' },
            { titre: 'CA estimé (€)', largeur: 'w-[18%]' },
            { titre: '% du total', largeur: 'w-[14%]' },
            { titre: 'Tendance', largeur: 'w-[15%]' },
          ]}
        >
          {atelier.revenus.map((r, i) => (
            <Ligne key={r.id}>
              <td className={TD}>
                <input
                  type="text"
                  className={CELLULE_TEXTE}
                  value={r.source}
                  onChange={(e) => maj(r.id, { source: e.target.value })}
                  placeholder={i < 2 ? `ex : ${ex.revenus[i]}` : 'Nouvelle source...'}
                  aria-label="Source ou offre"
                />
              </td>
              <td className={TD}>
                <MenuCellule value={r.type} onChange={(v) => maj(r.id, { type: v })} options={TYPES_REVENU} label="Type" />
              </td>
              <td className={TD}>
                <input
                  type="number"
                  inputMode="decimal"
                  className={CELLULE_NOMBRE}
                  value={r.montant}
                  onChange={(e) => maj(r.id, { montant: e.target.value })}
                  placeholder="0"
                  aria-label="CA estimé en euros"
                />
              </td>
              <td className={TD_CALCUL}>{pourcent(calcul.parts[i])}</td>
              <td className={TD}>
                <MenuCellule
                  value={r.tendance}
                  onChange={(v) => maj(r.id, { tendance: v })}
                  options={TENDANCES}
                  label="Tendance"
                />
              </td>
            </Ligne>
          ))}
        </Tableau>
        <BoutonAjout onClick={() => modifier({ revenus: [...atelier.revenus, nouveauRevenu()] })}>
          + Ajouter une source de revenus
        </BoutonAjout>
        <Resultats
          className="mt-[18px] mb-3.5"
          cases={[
            { valeur: calcul.total > 0 ? euros(calcul.total) : '—', libelle: 'CA total estimé', ton: 'warn' },
            { valeur: pourcent(calcul.partRecurrente), libelle: '% revenus récurrents', ton: 'navy' },
            { valeur: String(calcul.nbSources), libelle: 'Sources identifiées', ton: 'navy' },
          ]}
        />
      </CarteAtelier>

      <CarteAtelier>
        <ChampAtelier
          id="obs_revenus"
          label="Qu’est-ce que cette répartition révèle sur votre modèle ?"
          lignes={2}
          value={atelier.obsRevenus}
          onChange={(v) => modifier({ obsRevenus: v })}
          placeholder="Quels flux sont les plus solides ? Où est la vraie valeur ? Quels risques de concentration voyez-vous ?"
        />
      </CarteAtelier>
    </div>
  );
};

/* ═══ Étape 2 — Coûts & marge ═══ */

export const EtapeCouts: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const ex = exemples.finance;
  const calcul = calculCouts(atelier);

  // Comme la maquette, chaque saisie de coût recopie les totaux dans l'étape 3.
  const majCouts = (patch: Pick<Partial<AtelierFinance>, 'variables' | 'fixes'>) =>
    modifier({ ...patch, ...reportCouts({ ...atelier, ...patch }) });
  const majCV = (id: string, patch: Partial<CoutVariable>) =>
    majCouts({ variables: atelier.variables.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const majCF = (id: string, patch: Partial<CoutFixe>) =>
    majCouts({ fixes: atelier.fixes.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <div>
      <EnTeteEtapeAtelier
        titre="Analysez vos coûts et votre marge brute"
        promesse="Identifier les leviers d’optimisation"
        aide="Distinguez coûts variables (liés à l’activité) et coûts fixes (structurels). La marge brute vous dit combien il reste pour couvrir vos charges fixes et dégager du bénéfice."
      />

      <CarteAtelier prefixe="Coûts variables — liés directement à l’activité">
        <Tableau
          colonnes={[
            { titre: 'Nature du coût variable', largeur: 'w-[42%]' },
            { titre: 'Montant annuel (€)', largeur: 'w-[22%]' },
            { titre: '% du CA', largeur: 'w-[18%]' },
            { titre: 'Maîtrisable ?', largeur: 'w-[18%]' },
          ]}
        >
          {atelier.variables.map((c, i) => (
            <Ligne key={c.id}>
              <td className={TD}>
                <input
                  type="text"
                  className={CELLULE_TEXTE}
                  value={c.nature}
                  onChange={(e) => majCV(c.id, { nature: e.target.value })}
                  placeholder={i < 2 ? `ex : ${ex.variables[i]}` : 'Nature du coût...'}
                  aria-label="Nature du coût variable"
                />
              </td>
              <td className={TD}>
                <input
                  type="number"
                  inputMode="decimal"
                  className={CELLULE_NOMBRE}
                  value={c.montant}
                  onChange={(e) => majCV(c.id, { montant: e.target.value })}
                  placeholder="0"
                  aria-label="Montant annuel en euros"
                />
              </td>
              <td className={TD_CALCUL}>{pourcent(calcul.partsCV[i])}</td>
              <td className={TD}>
                <MenuCellule
                  value={c.maitrisable}
                  onChange={(v) => majCV(c.id, { maitrisable: v })}
                  options={MAITRISABLE}
                  label="Maîtrisable"
                />
              </td>
            </Ligne>
          ))}
        </Tableau>
        <BoutonAjout onClick={() => modifier({ variables: [...atelier.variables, nouveauCoutVariable()] })}>
          + Ajouter un coût variable
        </BoutonAjout>
      </CarteAtelier>

      <CarteAtelier prefixe="Coûts fixes — indépendants du volume d’activité">
        <Tableau
          colonnes={[
            { titre: 'Nature du coût fixe', largeur: 'w-[40%]' },
            { titre: 'Montant annuel (€)', largeur: 'w-[22%]' },
            { titre: 'Catégorie', largeur: 'w-[22%]' },
            { titre: 'Compressible ?', largeur: 'w-[16%]' },
          ]}
        >
          {atelier.fixes.map((c, i) => (
            <Ligne key={c.id}>
              <td className={TD}>
                <input
                  type="text"
                  className={CELLULE_TEXTE}
                  value={c.nature}
                  onChange={(e) => majCF(c.id, { nature: e.target.value })}
                  placeholder={i < 2 ? `ex : ${ex.fixes[i]}` : 'Nature du coût...'}
                  aria-label="Nature du coût fixe"
                />
              </td>
              <td className={TD}>
                <input
                  type="number"
                  inputMode="decimal"
                  className={CELLULE_NOMBRE}
                  value={c.montant}
                  onChange={(e) => majCF(c.id, { montant: e.target.value })}
                  placeholder="0"
                  aria-label="Montant annuel en euros"
                />
              </td>
              <td className={TD}>
                <MenuCellule
                  value={c.categorie}
                  onChange={(v) => majCF(c.id, { categorie: v })}
                  options={CATEGORIES_FIXES}
                  label="Catégorie"
                />
              </td>
              <td className={TD}>
                <MenuCellule
                  value={c.compressible}
                  onChange={(v) => majCF(c.id, { compressible: v })}
                  options={COMPRESSIBLE}
                  label="Compressible"
                />
              </td>
            </Ligne>
          ))}
        </Tableau>
        <BoutonAjout onClick={() => modifier({ fixes: [...atelier.fixes, nouveauCoutFixe()] })}>
          + Ajouter un coût fixe
        </BoutonAjout>
        <Resultats
          className="mt-[18px] mb-3.5"
          cases={[
            { valeur: calcul.totalCV > 0 ? euros(calcul.totalCV) : '—', libelle: 'Total coûts variables', ton: 'warn' },
            { valeur: calcul.totalCF > 0 ? euros(calcul.totalCF) : '—', libelle: 'Total coûts fixes', ton: 'warn' },
            {
              valeur: calcul.margeBrute === null ? '—' : euros(calcul.margeBrute),
              libelle: 'Marge brute estimée',
              ton: calcul.margeBrute === null ? 'navy' : calcul.margeBrute >= 0 ? 'pos' : 'neg',
            },
          ]}
        />
      </CarteAtelier>

      <CarteAtelier>
        <ChampAtelier
          id="leviers_marge"
          label="Quels coûts pouvez-vous réduire sans dégrader la qualité ?"
          lignes={2}
          value={atelier.leviersMarge}
          onChange={(v) => modifier({ leviersMarge: v })}
          placeholder="Quelles offres dégagent la meilleure marge ? Y a-t-il des coûts cachés ? Quelle action aurait le plus d’impact en 90 jours ?"
        />
      </CarteAtelier>
    </div>
  );
};

/* ═══ Étape 3 — Rentabilité ═══ */

const Montant: React.FC<{
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  note?: string;
  className?: string;
}> = ({ id, label, value, onChange, placeholder, note, className = '' }) => (
  <div className={className}>
    <label htmlFor={id} className={LIBELLE}>
      {label}
    </label>
    <input
      id={id}
      type="number"
      inputMode="decimal"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={CHAMP_MONTANT}
    />
    {note && <p className="text-12.5 italic text-muted mt-[5px]">{note}</p>}
  </div>
);

export const EtapeRentabilite: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const ex = exemples.finance.chiffres;
  const r = calculRentabilite(atelier);
  const lecture = lectureObjectif(atelier.caCible, r.pointMort);
  const cible = Math.min(atelier.caCible, r.maxCurseur);

  return (
    <div>
      <EnTeteEtapeAtelier
        titre="Calculez votre seuil de rentabilité"
        promesse="Connaître votre point mort change tout"
        aide="Le point mort est le CA minimum pour couvrir tous vos coûts fixes. C’est l’une des données les plus importantes à connaître pour piloter une entreprise."
      />

      <CarteAtelier prefixe="Données de base" prefixeMarge="mb-3">
        {/* Dans la maquette, le premier champ de chaque rangée garde sa marge
            basse de 14px : chaque rangée fait donc 88px. */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
          <Montant id="be_ca" label="CA annuel (€)" value={atelier.beCa} onChange={(v) => modifier({ beCa: v })} placeholder={`ex : ${ex.ca}`} className="mb-3.5" />
          <Montant id="be_cf" label="Total coûts fixes (€)" value={atelier.beCf} onChange={(v) => modifier({ beCf: v })} placeholder={`ex : ${ex.cf}`} />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Montant id="be_cv" label="Total coûts variables (€)" value={atelier.beCv} onChange={(v) => modifier({ beCv: v })} placeholder={`ex : ${ex.cv}`} className="mb-3.5" />
          <Montant
            id="be_treso"
            label="Trésorerie disponible (€)"
            value={atelier.beTreso}
            onChange={(v) => modifier({ beTreso: v })}
            placeholder={`ex : ${ex.treso}`}
            note="Pour estimer votre runway"
          />
        </div>
      </CarteAtelier>

      <CarteAtelier prefixe="Indicateurs calculés" prefixeMarge="mb-3">
        <Resultats
          className="mb-[18px]"
          cases={[
            { valeur: r.affiche.pointMort ? euros(r.pointMort) : '—', libelle: 'Point mort (CA min)', ton: 'warn' },
            {
              valeur: r.affiche.margeSecurite ? `${r.margeSecurite}%` : '—',
              libelle: 'Marge de sécurité',
              ton: r.affiche.margeSecurite ? r.tonMarge : 'navy',
            },
            {
              valeur: r.affiche.runway ? `${r.runway} mois` : '—',
              libelle: 'Runway estimé',
              ton: r.affiche.runway ? r.tonRunway : 'navy',
            },
          ]}
        />

        <div className="text-12 font-bold uppercase tracking-[0.8px] text-muted mb-1.5">
          Position par rapport au point mort
        </div>
        <div className="relative h-7 bg-surface rounded-full overflow-hidden mb-1.5" aria-hidden>
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,#ef4444,#f59e0b,#22c55e)] transition-[width] duration-500 ease-out"
            style={{ width: `${r.jauge?.remplissage ?? 0}%` }}
          />
          <div className="absolute top-0 h-full w-0.5 bg-navy opacity-50" style={{ left: `${r.jauge?.curseur ?? 50}%` }} />
        </div>
        <div className="flex justify-between text-11 text-muted mb-3.5">
          <span>0 €</span>
          <span className="text-navy font-bold">Point mort</span>
          <span>{r.jauge ? euros(r.jauge.max) : '—'}</span>
        </div>

        <div>
          <label htmlFor="caSlider" className={LIBELLE}>
            Objectif de CA cible
          </label>
          <div className="flex items-center gap-3.5 mt-2">
            <input
              id="caSlider"
              type="range"
              min={0}
              max={r.maxCurseur}
              step={5000}
              value={cible}
              onChange={(e) => modifier({ caCible: parseInt(e.target.value, 10) || 0 })}
              className="w-full h-[5px] rounded-full bg-line outline-none cursor-pointer appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-finance [&::-webkit-slider-thumb]:shadow-[0_2px_8px_rgba(245,158,11,0.4)] [&::-webkit-slider-thumb]:cursor-pointer [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-finance"
            />
            <div className="text-18 font-extrabold text-navy min-w-[110px] text-right">{euros(atelier.caCible)}</div>
          </div>
          <p className="mt-2 text-14 text-muted leading-[1.5]" aria-live="polite">
            {lecture.ton === 'bas' ? (
              <>
                <strong className="text-[#dc2626]">Objectif en-dessous du point mort.</strong> Minimum requis :{' '}
                <strong>{lecture.minimum}</strong>
              </>
            ) : lecture.ton === 'bon' ? (
              <>
                <strong className="text-[#16a34a]">Bon objectif.</strong> Vous êtes à {lecture.ecart}% au-dessus du point
                mort.
              </>
            ) : (
              lecture.texte
            )}
          </p>
        </div>
      </CarteAtelier>

      <CarteAtelier>
        <ChampAtelier
          id="obs_rentabilite"
          label="Votre lecture des indicateurs"
          lignes={2}
          value={atelier.obsRentabilite}
          onChange={(v) => modifier({ obsRentabilite: v })}
          placeholder="Êtes-vous au-dessus ou en dessous de votre point mort ? Quel écart combler en priorité ? Dans quel délai réaliste ?"
        />
      </CarteAtelier>
    </div>
  );
};

/* ═══ Étape 4 — Décisions ═══ */

/** Menu « Levier activé » : `.profil-select` ramené à 14px et 10/12 de padding. */
const MENU_LEVIER =
  'w-full appearance-none cursor-pointer text-14 leading-[normal] text-ink bg-white border-[1.5px] border-line rounded-[11.5px] pl-3 pr-9 py-2.5 outline-none transition-colors focus:border-teal bg-no-repeat bg-[length:16px] bg-[position:right_12px_center]';

const CHEVRON_PROFIL =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%237b82a0' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

export const EtapeDecisions: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const maj = (i: number, patch: Partial<Decision>) =>
    modifier({
      decisions: atelier.decisions.map((d, idx) => (idx === i ? { ...d, ...patch } : d)) as AtelierFinance['decisions'],
    });

  return (
    <div>
      <EnTeteEtapeAtelier
        titre="Formalisez vos décisions prioritaires"
        promesse="Un atelier sans décisions ne change rien"
        aide="Identifiez 3 actions financières concrètes à engager dans les 90 prochains jours. Un responsable, un délai, un impact attendu — pas de vague."
      />

      {atelier.decisions.map((d, i) => {
        const ex = exemples.finance.decisions[i];
        return (
          <div
            key={i}
            className="bg-white border border-line rounded-card p-[22px] mb-3 shadow-card transition-colors focus-within:border-finance/50"
          >
            <div className="inline-flex items-center justify-center w-[26px] h-[26px] rounded-[7px] bg-finance text-white text-14 font-extrabold mb-3">
              {i + 1}
            </div>
            <ChampAtelier
              id={`decision-${i}`}
              label="Décision / Action prioritaire"
              value={d.action}
              onChange={(v) => maj(i, { action: v })}
              placeholder={`ex : ${ex.action}`}
              className="mb-3.5"
            />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2.5">
              <div>
                <label htmlFor={`levier-${i}`} className={LIBELLE}>
                  Levier activé
                </label>
                <select
                  id={`levier-${i}`}
                  value={d.levier}
                  onChange={(e) => maj(i, { levier: e.target.value })}
                  className={MENU_LEVIER}
                  style={{ backgroundImage: CHEVRON_PROFIL }}
                >
                  {LEVIERS.map((l) => (
                    <option key={l} value={l}>
                      {l}
                    </option>
                  ))}
                </select>
              </div>
              <ChampAtelier
                id={`responsable-${i}`}
                label="Responsable"
                value={d.responsable}
                onChange={(v) => maj(i, { responsable: v })}
                placeholder={`ex : ${ex.responsable}`}
                className="mb-0"
              />
              <ChampAtelier
                id={`delai-${i}`}
                label="Délai"
                value={d.delai}
                onChange={(v) => maj(i, { delai: v })}
                placeholder={`ex : ${ex.delai}`}
                className="mb-0"
              />
            </div>
            <ChampAtelier
              id={`impact-${i}`}
              label="Impact attendu"
              value={d.impact}
              onChange={(v) => maj(i, { impact: v })}
              placeholder={`ex : ${ex.impact}`}
              className="mt-2.5 mb-0"
            />
          </div>
        );
      })}

      <CarteAtelier>
        <ChampAtelier
          id="engagement"
          label="Engagement dirigeant — qu’est-ce qui change dès demain ?"
          lignes={2}
          value={atelier.engagement}
          onChange={(v) => modifier({ engagement: v })}
          placeholder="En une ou deux phrases, quel est votre engagement personnel sur ce plan ? Quelle habitude concrète allez-vous instaurer cette semaine ?"
        />
      </CarteAtelier>
    </div>
  );
};

export { CHEVRON };
