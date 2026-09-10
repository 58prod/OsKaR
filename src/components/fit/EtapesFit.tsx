import React from 'react';
import { CarteAtelier, ChampAtelier, ChoixAtelier, EnTeteEtapeAtelier } from '@/components/atelier/champs';
import { nouveauConcurrent, TYPES_CONCURRENT, type AtelierFit, type Concurrent } from '@/lib/fit/types';
import type { JeuExemples } from '@/lib/exemples';

/*
 * Les quatre étapes de saisie de l'atelier Fit, transposées de
 * `fit-atelier.html`. La sauvegarde est gérée par `useAtelier`.
 *
 * Les textes d'aide sont ceux de la maquette ; les exemples des champs
 * viennent du métier déclaré (`useExemples`), jamais écrits en dur.
 */

interface EtapeProps {
  atelier: AtelierFit;
  modifier: (patch: Partial<AtelierFit>) => void;
  exemples: JeuExemples;
}

/* ═══ Étape 1 — L'offre ═══ */

export const EtapeOffre: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const ex = exemples.fit.offre;
  return (
    <div>
      <EnTeteEtapeAtelier
        titre="L’offre"
        promesse="Ce que vous proposez vraiment"
        aide="Décrivez vos produits ou services en termes de valeur délivrée — pas de fonctionnalités, mais de bénéfices concrets pour vos clients."
      />

      <CarteAtelier prefixe="Votre offre principale">
        <ChampAtelier
          id="f-offre-nom"
          label="Nom / intitulé de l’offre"
          value={atelier.offreNom}
          onChange={(v) => modifier({ offreNom: v })}
          placeholder={`Ex : ${ex.nom}`}
        />
        <ChampAtelier
          id="f-offre-valeur"
          label="Ce qu’elle permet de faire"
          lignes={3}
          value={atelier.offreValeur}
          onChange={(v) => modifier({ offreValeur: v })}
          placeholder={`Ex : ${ex.valeur}…`}
          note="Formulez du point de vue du client : « ça me permet de… »"
        />
        <ChampAtelier
          id="f-offre-limite"
          label="Ce qu’elle ne fait PAS (périmètre)"
          lignes={2}
          value={atelier.offreLimite}
          onChange={(v) => modifier({ offreLimite: v })}
          placeholder={`Ex : ${ex.limite}…`}
          note="Délimiter clairement ce qui est hors scope évite les malentendus et renforce la clarté perçue."
        />
      </CarteAtelier>

      <CarteAtelier prefixe="Lisibilité de l’offre">
        <ChampAtelier
          id="f-offre-pitch"
          label="En une phrase, pour quelqu’un qui ne vous connaît pas"
          lignes={2}
          value={atelier.offrePitch}
          onChange={(v) => modifier({ offrePitch: v })}
          placeholder={`Ex : ${ex.pitch}…`}
        />
        <ChoixAtelier
          name="lisibilite"
          label="Êtes-vous à l’aise pour l’expliquer en 30 secondes ?"
          value={atelier.lisibilite}
          onChange={(v) => modifier({ lisibilite: v })}
          options={[
            { valeur: 'oui', libelle: 'Oui, toujours' },
            { valeur: 'parfois', libelle: 'Parfois, selon l’interlocuteur' },
            { valeur: 'non', libelle: 'Non, c’est encore flou' },
          ]}
        />
      </CarteAtelier>
    </div>
  );
};

/* ═══ Étape 2 — La différenciation ═══ */

export const EtapeDifferenciation: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => (
  <div>
    <EnTeteEtapeAtelier
      titre="La différenciation"
      promesse="Pourquoi vous, plutôt qu’un autre ?"
      aide="Ce qui vous distingue doit être réel, défendable dans le temps, et perçu comme tel par vos clients — pas seulement revendiqué par vous."
    />

    <CarteAtelier>
      <ChampAtelier
        id="f-diff-avantage"
        label="Votre avantage principal"
        lignes={3}
        value={atelier.diffAvantage}
        onChange={(v) => modifier({ diffAvantage: v })}
        placeholder={`Ex : ${exemples.fit.avantage}…`}
        note="Un seul avantage fort vaut mieux que cinq arguments dilués."
      />
      <ChoixAtelier
        name="diff-clients"
        label="Est-ce que vos clients l’expriment spontanément ?"
        value={atelier.diffClients}
        onChange={(v) => modifier({ diffClients: v })}
        options={[
          { valeur: 'oui', libelle: 'Oui, ils le disent sans qu’on le demande' },
          { valeur: 'parfois', libelle: 'Parfois, quand on les interroge' },
          { valeur: 'non', libelle: 'Non, c’est surtout nous qui l’affirmons' },
        ]}
      />
    </CarteAtelier>

    <CarteAtelier>
      <ChampAtelier
        id="f-diff-mieux"
        label="Ce que vous faites mieux ou différemment que les alternatives"
        lignes={3}
        value={atelier.diffMieux}
        onChange={(v) => modifier({ diffMieux: v })}
        placeholder={`Ex : ${exemples.fit.mieux}…`}
      />
      <ChoixAtelier
        name="diff-durable"
        label="Cet avantage est-il durable ?"
        value={atelier.diffDurable}
        onChange={(v) => modifier({ diffDurable: v })}
        options={[
          { valeur: 'oui', libelle: 'Oui, difficile à copier' },
          { valeur: 'moyen', libelle: 'Moyen, d’autres pourraient le faire' },
          { valeur: 'non', libelle: 'Non, facilement reproductible' },
        ]}
      />
    </CarteAtelier>
  </div>
);

/* ═══ Étape 3 — La concurrence ═══ */

/** Cellule du tableau : sans cadre, soulignée en teal au focus (`.ca-table td input`). */
const CELLULE =
  'w-full h-10 border-0 bg-transparent text-15 text-ink outline-none px-0 py-0.5 placeholder:text-[#c0c5d8] focus:border-b-[1.5px] focus:border-teal';

/** Chevron du menu déroulant, dessin de la maquette. */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 12 12' fill='none' stroke='%237b82a0' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='M2 4l4 4 4-4'/%3E%3C/svg%3E\")";

const COLONNES = [
  { titre: 'Concurrent / Alternative', largeur: 'w-[30%]' },
  { titre: 'Type', largeur: 'w-[16%]' },
  { titre: 'Ce qu’ils font bien', largeur: 'w-[28%]' },
  { titre: 'Notre avantage face à eux', largeur: 'w-[22%]' },
  { titre: '', largeur: 'w-[4%]' },
];

export const EtapeConcurrence: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const ex = exemples.fit.concurrent;
  const maj = (id: string, patch: Partial<Concurrent>) =>
    modifier({ concurrents: atelier.concurrents.map((c) => (c.id === id ? { ...c, ...patch } : c)) });

  return (
    <div>
      <EnTeteEtapeAtelier
        titre="L’environnement concurrentiel"
        promesse="Ce que le marché propose déjà"
        aide="Identifier ce qui existe vous aide à positionner votre offre — et à comprendre pourquoi un client vous choisit (ou ne vous choisit pas)."
      />

      <div className="text-12.5 font-bold uppercase tracking-[1.5px] text-navy mb-2">Vos alternatives concurrentes</div>
      <div className="overflow-x-auto rounded-[11.5px] border border-line bg-white">
        <table className="w-full border-collapse text-15">
          <thead>
            <tr className="bg-navy text-white">
              {COLONNES.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`${c.largeur} px-2.5 py-[10.5px] text-12 font-bold tracking-[0.72px] text-left ${
                    i === 0 ? 'rounded-tl-[11.5px]' : i === COLONNES.length - 1 ? 'rounded-tr-[10px]' : ''
                  }`}
                >
                  {c.titre}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {atelier.concurrents.map((c) => (
              <tr key={c.id} className="border-b border-line last:border-b-0 transition-colors hover:bg-[#f8f9ff]">
                <td className="px-2 py-1.5 align-middle">
                  <input
                    type="text"
                    className={CELLULE}
                    value={c.nom}
                    onChange={(e) => maj(c.id, { nom: e.target.value })}
                    placeholder={`Ex : ${ex.nom}`}
                    aria-label="Concurrent ou alternative"
                  />
                </td>
                <td className="px-2 py-1.5 align-middle">
                  <select
                    className="w-full border-0 bg-transparent text-14.5 leading-[normal] text-ink cursor-pointer outline-none py-0.5 pl-0 pr-4 appearance-none bg-no-repeat bg-[length:10px] bg-[position:right_2px_center] focus:border-b-[1.5px] focus:border-teal"
                    style={{ backgroundImage: CHEVRON }}
                    value={c.type}
                    onChange={(e) => maj(c.id, { type: e.target.value })}
                    aria-label="Type"
                  >
                    <option value="">Type</option>
                    {TYPES_CONCURRENT.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-2 py-1.5 align-middle">
                  <input
                    type="text"
                    className={CELLULE}
                    value={c.bien}
                    onChange={(e) => maj(c.id, { bien: e.target.value })}
                    placeholder={`Ex : ${ex.bien}`}
                    aria-label="Ce qu’ils font bien"
                  />
                </td>
                <td className="px-2 py-1.5 align-middle">
                  <input
                    type="text"
                    className={CELLULE}
                    value={c.avantage}
                    onChange={(e) => maj(c.id, { avantage: e.target.value })}
                    placeholder={`Ex : ${ex.avantage}`}
                    aria-label="Notre avantage face à eux"
                  />
                </td>
                <td className="px-2 py-1.5 align-middle">
                  {/* Comme la maquette : la dernière ligne ne se supprime pas. */}
                  <button
                    type="button"
                    onClick={() =>
                      atelier.concurrents.length > 1 &&
                      modifier({ concurrents: atelier.concurrents.filter((x) => x.id !== c.id) })
                    }
                    aria-label={`Retirer ${c.nom || 'cette ligne'}`}
                    className="bg-transparent border-0 cursor-pointer text-[#c0c5d8] text-18.5 leading-none px-1 py-0.5 transition-colors hover:text-[#ef4444]"
                  >
                    ×
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button
        type="button"
        onClick={() => modifier({ concurrents: [...atelier.concurrents, nouveauConcurrent()] })}
        className="mt-2 w-full bg-transparent border-[1.5px] border-dashed border-line rounded-[10.5px] text-muted text-14.5 leading-[normal] font-semibold px-4 py-[7px] cursor-pointer transition-all hover:border-teal hover:text-navy hover:bg-[#f0faf8]"
      >
        + Ajouter un concurrent / une alternative
      </button>

      <CarteAtelier className="mt-[18px] mb-3">
        <ChampAtelier
          id="f-conc-raison"
          label="Pourquoi un client nous choisit-il plutôt qu’une alternative ?"
          lignes={3}
          value={atelier.concRaison}
          onChange={(v) => modifier({ concRaison: v })}
          placeholder={`Ex : ${exemples.fit.raison}…`}
        />
        <ChampAtelier
          id="f-conc-sans"
          label="Que font les clients qui ne font pas appel à nous ?"
          lignes={2}
          value={atelier.concSans}
          onChange={(v) => modifier({ concSans: v })}
          placeholder={`Ex : ${exemples.fit.sans}…`}
          note="Le « statu quo » est votre premier concurrent."
        />
      </CarteAtelier>
    </div>
  );
};

/* ═══ Étape 4 — Les signaux ═══ */

export const EtapeSignaux: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const ex = exemples.fit.signaux;
  // Dans la maquette, chaque champ de la grille garde sa marge basse de 14px,
  // sauf le dernier : la grille paraît donc plus aérée entre ses deux rangées.
  const grille = 'mb-3.5';
  return (
    <div>
      <EnTeteEtapeAtelier
        titre="Les signaux marché"
        promesse="Ce que le terrain confirme"
        aide="Les signaux sont les preuves que le marché « vote » pour vous — rétention, recommandations, croissance organique. Ils ne mentent pas."
      />

      <CarteAtelier prefixe="Signaux qualitatifs" prefixeAere>
        <ChampAtelier
          id="f-sig-verbatim"
          label="Retours clients spontanés (verbatims, témoignages)"
          lignes={3}
          value={atelier.sigVerbatim}
          onChange={(v) => modifier({ sigVerbatim: v })}
          placeholder={`Ex : ${exemples.fit.verbatim}…`}
        />
        <ChoixAtelier
          name="sig-bouche"
          label="Vos clients recommandent-ils spontanément ?"
          value={atelier.sigBouche}
          onChange={(v) => modifier({ sigBouche: v })}
          options={[
            { valeur: 'oui', libelle: 'Oui, régulièrement' },
            { valeur: 'parfois', libelle: 'Parfois, quand on leur demande' },
            { valeur: 'non', libelle: 'Rarement ou jamais' },
          ]}
        />
      </CarteAtelier>

      <CarteAtelier prefixe="Signaux quantitatifs" prefixeAere>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          <ChampAtelier
            id="f-sig-retention"
            label="Taux de rétention / renouvellement"
            value={atelier.sigRetention}
            onChange={(v) => modifier({ sigRetention: v })}
            placeholder={`Ex : ${ex.retention}`}
            className={grille}
          />
          <ChampAtelier
            id="f-sig-organique"
            label="Part de croissance organique"
            value={atelier.sigOrganique}
            onChange={(v) => modifier({ sigOrganique: v })}
            placeholder={`Ex : ${ex.organique}`}
            className={grille}
          />
          <ChampAtelier
            id="f-sig-nps"
            label="NPS ou satisfaction mesurée"
            value={atelier.sigNps}
            onChange={(v) => modifier({ sigNps: v })}
            placeholder={`Ex : ${ex.nps}`}
            className={grille}
          />
          <ChampAtelier
            id="f-sig-autre"
            label="Autre indicateur clé"
            value={atelier.sigAutre}
            onChange={(v) => modifier({ sigAutre: v })}
            placeholder={`Ex : ${ex.autre}…`}
            className="mb-0"
          />
        </div>
      </CarteAtelier>

      <CarteAtelier>
        <ChoixAtelier
          name="sig-demande"
          label="Ce que vous observez sur la demande entrante"
          value={atelier.sigDemande}
          onChange={(v) => modifier({ sigDemande: v })}
          options={[
            { valeur: 'forte', libelle: 'La demande augmente naturellement' },
            { valeur: 'stable', libelle: 'La demande est stable, il faut aller chercher' },
            { valeur: 'faible', libelle: 'La demande est faible, on tâtonne' },
          ]}
        />
      </CarteAtelier>
    </div>
  );
};
