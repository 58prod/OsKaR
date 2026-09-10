import React from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { CHAMP, CarteChamp, ChampTexte, EnTeteEtape } from './champs';
import {
  NIVEAUX,
  PRIORITES,
  ROLES_ACTEUR,
  TYPES_CIBLE,
  visionAssemblee,
  type Acteur,
  type AtelierVision,
  type Cible,
  type TypeObjectif,
} from '@/lib/vision/types';
import type { JeuExemples } from '@/lib/exemples';

/*
 * Les sept étapes de l'atelier Vision, transposées de `vision-atelier.html`.
 * Chaque étape reçoit l'atelier et une fonction de modification : la
 * sauvegarde est gérée par `useVision`, il n'y a pas de bouton « Enregistrer ».
 *
 * Les exemples affichés viennent du métier déclaré (`useExemples`), selon la
 * règle posée pour toute l'application.
 */

interface EtapeProps {
  atelier: AtelierVision;
  modifier: (patch: Partial<AtelierVision>) => void;
  exemples: JeuExemples;
}

const nouvelId = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : String(Date.now() + Math.random());

/* ═══ Étape 1 — Le sens ═══ */

export const EtapeSens: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => (
  <div>
    <EnTeteEtape titre="Le sens" promesse="Clarifier l’identité profonde de l’organisation" />
    <CarteChamp
      prefixe="Pourquoi l’entreprise existe"
      badge="Pourquoi"
      note="La raison d’être profonde — pas ce que vous faites, mais pourquoi vous le faites."
    >
      <textarea
        rows={3}
        value={atelier.pourquoi}
        onChange={(e) => modifier({ pourquoi: e.target.value })}
        placeholder={`Ex : ${exemples.vision.pourquoi}`}
        className={`${CHAMP} resize-y`}
        aria-label="Pourquoi l’entreprise existe"
      />
    </CarteChamp>
    <CarteChamp
      prefixe="Comment elle agit, sa différence"
      badge="Comment"
      note="Ce qui vous rend unique — votre approche, votre manière de faire."
    >
      <textarea
        rows={3}
        value={atelier.comment}
        onChange={(e) => modifier({ comment: e.target.value })}
        placeholder={`Ex : ${exemples.vision.comment}`}
        className={`${CHAMP} resize-y`}
        aria-label="Comment elle agit"
      />
    </CarteChamp>
    <CarteChamp prefixe="Ce qu’elle fait concrètement" badge="Quoi" note="L’offre concrète — produits, services, prestations.">
      <textarea
        rows={3}
        value={atelier.quoi}
        onChange={(e) => modifier({ quoi: e.target.value })}
        placeholder={`Ex : ${exemples.vision.quoi}`}
        className={`${CHAMP} resize-y`}
        aria-label="Ce qu’elle fait concrètement"
      />
    </CarteChamp>
  </div>
);

/* ═══ Étape 2 — Cibles & acteurs ═══ */

const BOUTON_AJOUT =
  'flex items-center gap-1.5 px-3 py-2 rounded-lg border-[1.5px] border-dashed border-[#d0d5f0] text-muted text-13 font-medium transition-all hover:border-vision hover:text-vision hover:bg-vision-light';

export const EtapeCibles: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const majCible = (id: string, patch: Partial<Cible>) =>
    modifier({ cibles: atelier.cibles.map((c) => (c.id === id ? { ...c, ...patch } : c)) });
  const majActeur = (id: string, patch: Partial<Acteur>) =>
    modifier({ acteurs: atelier.acteurs.map((a) => (a.id === id ? { ...a, ...patch } : a)) });

  return (
    <div>
      <EnTeteEtape
        titre="Cibles & acteurs"
        promesse="Pour qui et avec qui ?"
        aide="Définissez vos cibles prioritaires et cartographiez les acteurs clés de votre écosystème."
      />

      <section className="mb-8" aria-label="Vos cibles">
        <h2 className="text-15.5 font-bold text-navy mb-3">Vos cibles</h2>
        {atelier.cibles.length === 0 && (
          <p className="text-13.5 text-muted mb-3">
            Aucune cible pour l’instant. Ajoutez celles à qui vous vous adressez en priorité.
          </p>
        )}
        <ul className="space-y-2 mb-3">
          {atelier.cibles.map((cible) => (
            <li key={cible.id} className="bg-white border border-line rounded-card shadow-card p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  className={`${CHAMP} sm:col-span-4`}
                  value={cible.nom}
                  onChange={(e) => majCible(cible.id, { nom: e.target.value })}
                  placeholder={`Ex : ${exemples.vision.cible}`}
                  aria-label="Nom de la cible"
                />
                <select
                  className={`${CHAMP} sm:col-span-2`}
                  value={cible.type}
                  onChange={(e) => majCible(cible.id, { type: e.target.value })}
                  aria-label="Type"
                >
                  <option value="">Type</option>
                  {TYPES_CIBLE.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
                <input
                  className={`${CHAMP} sm:col-span-2`}
                  value={cible.segment}
                  onChange={(e) => majCible(cible.id, { segment: e.target.value })}
                  placeholder="Segment"
                  aria-label="Segment"
                />
                <select
                  className={`${CHAMP} sm:col-span-2`}
                  value={cible.priorite}
                  onChange={(e) => majCible(cible.id, { priorite: e.target.value })}
                  aria-label="Priorité"
                >
                  <option value="">Priorité</option>
                  {PRIORITES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </select>
                <div className="sm:col-span-2 flex gap-1.5">
                  <input
                    className={CHAMP}
                    value={cible.notes}
                    onChange={(e) => majCible(cible.id, { notes: e.target.value })}
                    placeholder="Notes"
                    aria-label="Notes"
                  />
                  <button
                    type="button"
                    onClick={() => modifier({ cibles: atelier.cibles.filter((c) => c.id !== cible.id) })}
                    aria-label={`Retirer ${cible.nom || 'cette cible'}`}
                    className="px-2 text-muted hover:text-[#dc2626] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={BOUTON_AJOUT}
          onClick={() =>
            modifier({
              cibles: [...atelier.cibles, { id: nouvelId(), nom: '', type: '', segment: '', priorite: '', notes: '' }],
            })
          }
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Ajouter une cible
        </button>
      </section>

      <section aria-label="Votre écosystème d’acteurs">
        <h2 className="text-15.5 font-bold text-navy mb-3">Votre écosystème d’acteurs</h2>
        {atelier.acteurs.length === 0 && (
          <p className="text-13.5 text-muted mb-3">
            Qui pèse sur votre activité&nbsp;? Financeurs, prescripteurs, partenaires, équipe…
          </p>
        )}
        <ul className="space-y-2 mb-3">
          {atelier.acteurs.map((acteur) => (
            <li key={acteur.id} className="bg-white border border-line rounded-card shadow-card p-4">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                <input
                  className={`${CHAMP} sm:col-span-3`}
                  value={acteur.nom}
                  onChange={(e) => majActeur(acteur.id, { nom: e.target.value })}
                  placeholder={`Ex : ${exemples.vision.acteur}`}
                  aria-label="Nom de l’acteur"
                />
                <select
                  className={`${CHAMP} sm:col-span-2`}
                  value={acteur.portee}
                  onChange={(e) => majActeur(acteur.id, { portee: e.target.value })}
                  aria-label="Interne ou externe"
                >
                  <option value="">Interne / externe</option>
                  <option value="Interne">Interne</option>
                  <option value="Externe">Externe</option>
                </select>
                <select
                  className={`${CHAMP} sm:col-span-2`}
                  value={acteur.role}
                  onChange={(e) => majActeur(acteur.id, { role: e.target.value })}
                  aria-label="Rôle"
                >
                  <option value="">Rôle</option>
                  {ROLES_ACTEUR.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
                <select
                  className={`${CHAMP} sm:col-span-2`}
                  value={acteur.pouvoir}
                  onChange={(e) => majActeur(acteur.id, { pouvoir: e.target.value })}
                  aria-label="Pouvoir"
                >
                  <option value="">Pouvoir</option>
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <select
                  className={`${CHAMP} sm:col-span-2`}
                  value={acteur.interet}
                  onChange={(e) => majActeur(acteur.id, { interet: e.target.value })}
                  aria-label="Intérêt"
                >
                  <option value="">Intérêt</option>
                  {NIVEAUX.map((n) => (
                    <option key={n} value={n}>{n}</option>
                  ))}
                </select>
                <div className="sm:col-span-1 flex justify-end">
                  <button
                    type="button"
                    onClick={() => modifier({ acteurs: atelier.acteurs.filter((a) => a.id !== acteur.id) })}
                    aria-label={`Retirer ${acteur.nom || 'cet acteur'}`}
                    className="px-2 text-muted hover:text-[#dc2626] transition-colors"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button
          type="button"
          className={BOUTON_AJOUT}
          onClick={() =>
            modifier({
              acteurs: [
                ...atelier.acteurs,
                { id: nouvelId(), nom: '', portee: '', role: '', pouvoir: '', interet: '', notes: '' },
              ],
            })
          }
        >
          <Plus className="h-3.5 w-3.5" aria-hidden />
          Ajouter un acteur
        </button>
      </section>
    </div>
  );
};

/* ═══ Étape 3 — Le problème ═══ */

export const EtapeProbleme: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => (
  <div>
    <EnTeteEtape
      titre="Le problème"
      promesse="Ancrer dans le réel"
      aide="La difficulté concrète que vous résolvez — ce qui bloque réellement vos clients aujourd’hui."
    />
    <CarteChamp prefixe="Qui rencontrent…" note="Décrivez la situation vécue, pas votre solution.">
      <textarea
        rows={5}
        value={atelier.probleme}
        onChange={(e) => modifier({ probleme: e.target.value })}
        placeholder={exemples.vision.probleme}
        className={`${CHAMP} resize-y`}
        aria-label="Le problème rencontré"
      />
    </CarteChamp>
  </div>
);

/* ═══ Étape 4 — Vision à 1 an ═══ */

export const EtapeProjection: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const maj = (champ: keyof AtelierVision['projection'], v: string) =>
    modifier({ projection: { ...atelier.projection, [champ]: v } });
  const ex = exemples.vision.projection;

  return (
    <div>
      <EnTeteEtape
        titre="Vision à 1 an"
        promesse="Projection concrète"
        aide="Où serez-vous dans 12 mois ? Soyez précis sur les deux dimensions — l’entreprise et vous."
      />
      <div className="bg-white border border-line rounded-card shadow-card p-5 mb-3">
        <h2 className="text-13 font-bold text-navy mb-3">Côté entreprise</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ChampTexte id="v-ca" label="Chiffre d’affaires" value={atelier.projection.ca} onChange={(v) => maj('ca', v)} placeholder={`Ex : ${ex.ca}`} />
          <ChampTexte id="v-clients" label="Clients" value={atelier.projection.clients} onChange={(v) => maj('clients', v)} placeholder={`Ex : ${ex.clients}`} />
          <ChampTexte id="v-offre" label="Offre" value={atelier.projection.offre} onChange={(v) => maj('offre', v)} placeholder={`Ex : ${ex.offre}`} />
          <ChampTexte id="v-orga" label="Organisation" value={atelier.projection.organisation} onChange={(v) => maj('organisation', v)} placeholder={`Ex : ${ex.organisation}`} />
        </div>
      </div>
      <div className="bg-white border border-line rounded-card shadow-card p-5">
        <h2 className="text-13 font-bold text-navy mb-3">Côté personnel</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <ChampTexte id="v-rythme" label="Rythme de travail" value={atelier.projection.rythme} onChange={(v) => maj('rythme', v)} placeholder="Ex : 4 jours par semaine" />
          <ChampTexte id="v-energie" label="Énergie et santé" value={atelier.projection.energie} onChange={(v) => maj('energie', v)} placeholder="Ex : du sport 3 fois par semaine" />
          <ChampTexte id="v-perso" label="Vie personnelle" value={atelier.projection.viePerso} onChange={(v) => maj('viePerso', v)} placeholder="Ex : 6 semaines de vacances" />
          <ChampTexte id="v-limites" label="Limites" value={atelier.projection.limites} onChange={(v) => maj('limites', v)} placeholder="Ex : pas de rendez-vous le vendredi" />
        </div>
      </div>
    </div>
  );
};

/* ═══ Étape 5 — Valeurs ═══ */

export const EtapeValeurs: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const maj = (i: number, patch: Partial<{ nom: string; traduction: string }>) =>
    modifier({ valeurs: atelier.valeurs.map((v, idx) => (idx === i ? { ...v, ...patch } : v)) });

  return (
    <div>
      <EnTeteEtape
        titre="Valeurs"
        promesse="Trois au maximum"
        aide="Pas des mots creux — des principes avec leur traduction concrète en comportements observables."
      />
      {atelier.valeurs.map((valeur, i) => (
        <div key={i} className="bg-white border border-line rounded-card shadow-card p-5 mb-3">
          <div className="grid grid-cols-1 sm:grid-cols-[1fr_1.6fr] gap-3">
            <ChampTexte
              id={`valeur-${i}`}
              label={i === 2 ? 'Troisième valeur (facultative)' : `Valeur ${i + 1}`}
              value={valeur.nom}
              onChange={(v) => maj(i, { nom: v })}
              placeholder={exemples.vision.valeurs[i]?.nom ?? 'Ex : Simplicité'}
            />
            <ChampTexte
              id={`traduction-${i}`}
              label="Ce que cela veut dire, concrètement"
              value={valeur.traduction}
              onChange={(v) => maj(i, { traduction: v })}
              placeholder={exemples.vision.valeurs[i]?.traduction ?? 'Ex : une règle que l’on peut vérifier'}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

/* ═══ Étape 6 — Votre vision ═══ */

export const EtapeVision: React.FC<EtapeProps> = ({ atelier, modifier }) => {
  const assemblee = visionAssemblee(atelier);
  return (
    <div>
      <EnTeteEtape
        titre="Votre vision"
        promesse="Assemblée, à ajuster"
        aide="Construite à partir de vos réponses. Retravaillez la formulation jusqu’à ce qu’elle soit vraiment la vôtre."
      />
      {assemblee && (
        <div className="rounded-[18px] px-8 py-7 mb-4 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
          <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-vision mb-2">
            À partir de vos réponses
          </div>
          <p className="text-white text-[17px] leading-[1.6]">{assemblee}</p>
        </div>
      )}
      <CarteChamp
        prefixe="Ajuster la formulation"
        note="Ce texte est celui qui sera repris dans votre synthèse et dans vos objectifs."
      >
        <textarea
          rows={5}
          value={atelier.vision}
          onChange={(e) => modifier({ vision: e.target.value })}
          placeholder={assemblee || 'Reformulez librement jusqu’à ce que ce soit vraiment votre vision…'}
          className={`${CHAMP} resize-y`}
          aria-label="Votre vision"
        />
      </CarteChamp>
      {!assemblee && (
        <p className="text-13.5 text-muted">
          Remplissez d’abord l’étape « Le sens » pour obtenir une première formulation.
        </p>
      )}
    </div>
  );
};

/* ═══ Étape 7 — Objectifs ═══ */

const TYPES: TypeObjectif[] = ['Business', 'Personnel'];

export const EtapeObjectifsVision: React.FC<EtapeProps> = ({ atelier, modifier, exemples }) => {
  const maj = (i: number, patch: Partial<AtelierVision['objectifs'][number]>) =>
    modifier({ objectifs: atelier.objectifs.map((o, idx) => (idx === i ? { ...o, ...patch } : o)) });

  return (
    <div>
      <EnTeteEtape
        titre="La vision devient action"
        promesse="Trois objectifs au maximum"
        aide="Ambitieux, orientés résultat, directement reliés à votre vision. Indiquez pour chacun s’il concerne l’entreprise ou vous."
      />
      {atelier.objectifs.map((objectif, i) => (
        <div key={i} className="bg-white border border-line rounded-card shadow-card p-5 mb-3">
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-11 font-extrabold tracking-[1.4px] uppercase text-muted">Objectif {i + 1}</span>
            <div className="flex gap-1.5" role="radiogroup" aria-label={`Type de l’objectif ${i + 1}`}>
              {TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  role="radio"
                  aria-checked={objectif.type === type}
                  onClick={() => maj(i, { type })}
                  className={`px-3 py-1.5 rounded-lg border-[1.5px] text-12 font-semibold transition-all ${
                    objectif.type === type
                      ? 'bg-vision-light border-vision text-vision-dark'
                      : 'bg-white border-line text-muted hover:border-vision hover:text-vision'
                  }`}
                >
                  {type === 'Business' ? 'Entreprise' : 'Personnel'}
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <ChampTexte
              id={`obj-${i}`}
              label="Intitulé de l’objectif"
              value={objectif.intitule}
              onChange={(v) => maj(i, { intitule: v })}
              placeholder={`Ex : ${exemples.objectifs[i]?.titre ?? 'Atteindre 50 clients actifs'}`}
            />
            <div>
              <label htmlFor={`obj-pourquoi-${i}`} className="block text-12.5 font-bold text-navy mb-1.5">
                Pourquoi c’est prioritaire
              </label>
              <textarea
                id={`obj-pourquoi-${i}`}
                rows={2}
                value={objectif.pourquoi}
                onChange={(e) => maj(i, { pourquoi: e.target.value })}
                placeholder="Ex : c’est le seuil qui rend le modèle rentable…"
                className={`${CHAMP} resize-y`}
              />
            </div>
            <ChampTexte
              id={`obj-mesure-${i}`}
              label="Mesure de succès"
              value={objectif.mesure}
              onChange={(v) => maj(i, { mesure: v })}
              placeholder={`Ex : ${exemples.objectifs[i]?.cible ?? '50'} ${exemples.objectifs[i]?.unite ?? 'clients'} au 31/12`}
            />
          </div>
        </div>
      ))}
    </div>
  );
};
