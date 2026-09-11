import React from 'react';
import { DocumentKit, EnTeteDoc, k } from '@/components/coachs/kit/DocumentKit';

/*
 * Grille de restitution du diagnostic — transposition de
 * `plateforme/kit-grille-restitution.html`. Page 1 : le déroulé minuté en six
 * séquences. Page 2 : la feuille de notes à remplir en séance.
 */

interface Sequence {
  nom: string;
  duree: string;
  but: string;
  faire: string;
  /** « À dire » ou « À demander ». */
  consigne: 'À dire' | 'À demander';
  phrase: string;
  piege?: string;
}

const SEQUENCES: Sequence[] = [
  {
    nom: '1 · Poser le cadre',
    duree: '5 min',
    but: 'Faire baisser la garde',
    faire:
      'Annoncez le déroulé et la durée. Aucun score n’est bon ou mauvais dans l’absolu : un jeune projet a normalement un radar déséquilibré.',
    consigne: 'À dire',
    phrase:
      '« Ce diagnostic ne juge pas votre entreprise. Il sert à choisir où mettre votre énergie les six prochains mois — pas plus. »',
  },
  {
    nom: '2 · Lire le radar ensemble',
    duree: '10 min',
    but: 'Il commente en premier',
    faire:
      'Montrez le radar sans le commenter. Laissez le silence travailler. Notez ses mots exacts : ils resserviront en séquence 5.',
    consigne: 'À demander',
    phrase: '« Qu’est-ce qui vous surprend là-dedans ? » puis « Et qu’est-ce qui ne vous surprend pas du tout ? »',
    piege: 'commenter avant lui. Vous vous privez de sa propre analyse, qui vaut dix fois la vôtre à ce stade.',
  },
  {
    nom: '3 · Creuser les deux piliers les plus bas',
    duree: '12 min',
    but: 'Passer du score au réel',
    faire:
      'Un pilier à la fois. Demandez un exemple concret et récent. Un score ne convainc personne ; une anecdote de la semaine dernière, si.',
    consigne: 'À demander',
    phrase:
      '« Racontez-moi la dernière fois où ça vous a coûté quelque chose. » Puis : « Combien de temps ou d’argent, à peu près ? »',
    piege: 'traiter les cinq piliers. Vous n’aurez le temps d’en creuser que deux — et c’est suffisant.',
  },
  {
    nom: '4 · Trouver le point d’appui',
    duree: '5 min',
    but: 'Repartir sur une force',
    faire:
      'Prenez le pilier le plus haut et cherchez ce qui l’a rendu solide : une habitude, une personne, un outil. C’est ce mécanisme que vous transposerez ailleurs.',
    consigne: 'À demander',
    phrase: '« Qu’est-ce que vous faites déjà bien ici, que vous ne faites pas ailleurs ? »',
  },
  {
    nom: '5 · Choisir le premier chantier',
    duree: '8 min',
    but: 'Une seule priorité, pas trois',
    faire:
      'Faites-le choisir. Reprenez ses mots de la séquence 2. Un seul chantier, formulé par lui, avec une raison qui lui appartient.',
    consigne: 'À demander',
    phrase: '« Si vous ne pouviez en traiter qu’un seul d’ici la fin de l’année, lequel changerait le plus la donne ? »',
    piege: 'choisir à sa place. Un chantier qu’il n’a pas choisi ne survit pas à trois semaines de quotidien.',
  },
  {
    nom: '6 · Poser la suite',
    duree: '5 min',
    but: 'Sortir avec une date',
    faire:
      'Décrivez le plan d’actions jusqu’à fin d’année et le rythme des points de coaching. Fixez la prochaine date avant de quitter la salle.',
    consigne: 'À dire',
    phrase:
      '« On cale la feuille de route sur une séance, puis on attaque le pilier que vous avez choisi. Quelle semaine vous arrange ? »',
  },
];

const PIED = 'OSKAR — Grille de restitution du diagnostic · Kit coach';

export default function GrilleRestitutionPage() {
  return (
    <DocumentKit
      titreOnglet="Grille de restitution du diagnostic | Oskar"
      nom="Grille de restitution"
      consigne="2 pages A4. Page 1 : le déroulé minuté. Page 2 : la feuille de notes à remplir en séance."
    >
      {/* ══ Page 1 — déroulé ══ */}
      <div className={k('doc-page')}>
        <EnTeteDoc ligne1="Kit coach · Document" ligne2="de travail interne" />

        <div className={k('doc-title')}>
          Restituer le diagnostic
          <br />
          en <span>45 minutes</span>.
        </div>
        <p className={k('doc-lede')}>
          La restitution n’est pas une présentation de résultats : c’est la séance où le dirigeant s’entend dire
          lui-même ce qui ne va pas. Votre rôle est de le faire parler avant de parler, puis de transformer ce qu’il a
          dit en premier chantier.
        </p>

        <div className={k('doc-meta')}>
          <span className={k('doc-chip')}>45 minutes</span>
          <span className={k('doc-chip')}>Présentiel ou visio</span>
          <span className={k('doc-chip')}>Le radar sous les yeux</span>
          <span className={k('doc-chip', 'coral')}>Objectif : un premier chantier et une date</span>
        </div>

        <div className={k('seq-grid')}>
          {SEQUENCES.map((s) => (
            <div key={s.nom} className={k('seq')}>
              <div className={k('seq-head')}>
                <div className={k('seq-name')}>{s.nom}</div>
                <div className={k('seq-time')}>{s.duree}</div>
              </div>
              <div className={k('seq-goal')}>{s.but}</div>
              <div className={k('seq-do')}>{s.faire}</div>
              <div className={k('seq-q')}>
                <b>{s.consigne} :</b> {s.phrase}
              </div>
              {s.piege && (
                <div className={k('seq-warn')}>
                  <b>Piège :</b> {s.piege}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className={k('doc-foot')}>
          <span>{PIED}</span>
          <span>Page 1 / 2 — Déroulé</span>
        </div>
      </div>

      {/* ══ Page 2 — notes ══ */}
      <div className={k('doc-page')}>
        <EnTeteDoc ligne1="Feuille de notes" ligne2="à remplir en séance" />

        <div className={k('doc-sec-title')}>Le contexte</div>
        <table className={k('notes-table')}>
          <tbody>
            <tr>
              <td className={k('lbl')}>Organisation</td>
              <td />
              <td className={k('lbl')}>Date</td>
              <td />
            </tr>
            <tr>
              <td className={k('lbl')}>Interlocuteur · fonction</td>
              <td />
              <td className={k('lbl')}>Effectif</td>
              <td />
            </tr>
          </tbody>
        </table>

        <div className={k('doc-sec-title')}>Les scores</div>
        <table className={k('notes-table')}>
          <tbody>
            <tr>
              {['Vision', 'Fit', 'Finance', 'OKR', 'Team', 'Global'].map((p) => (
                <th key={p}>{p}</th>
              ))}
            </tr>
            <tr>
              {Array.from({ length: 6 }, (_, i) => (
                <td key={i} />
              ))}
            </tr>
          </tbody>
        </table>

        <div className={k('doc-sec-title')}>Ses mots — à reprendre en séquence 5</div>
        <div className={k('notes-lines')}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} className={k('notes-line')} />
          ))}
        </div>

        <div className={k('doc-sec-title')}>Les deux piliers creusés</div>
        <table className={k('notes-table')}>
          <tbody>
            <tr>
              <th style={{ width: '34mm' }}>Pilier</th>
              <th>Exemple concret donné</th>
              <th style={{ width: '38mm' }}>Ce que ça lui coûte</th>
            </tr>
            {[0, 1].map((i) => (
              <tr key={i}>
                <td />
                <td />
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <div className={k('doc-sec-title')}>Le point d’appui</div>
        <table className={k('notes-table')}>
          <tbody>
            {['Pilier le plus solide', 'Ce qui le rend solide'].map((l) => (
              <tr key={l}>
                <td className={k('lbl')}>{l}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <div className={k('doc-sec-title')}>La décision</div>
        <table className={k('notes-table')}>
          <tbody>
            {['Premier pilier à travailler', 'Sa raison, dans ses mots', 'Format proposé', 'Prochaine date'].map(
              (l) => (
                <tr key={l}>
                  <td className={k('lbl')}>{l}</td>
                  <td />
                </tr>
              )
            )}
          </tbody>
        </table>

        <div className={k('doc-warnbox')}>
          <h4>Les trois pièges de la restitution</h4>
          <ul>
            <li>
              <b>Parler avant lui.</b> Le radar doit être commenté par le dirigeant en premier, même si le silence dure.
            </li>
            <li>
              <b>Vouloir tout traiter.</b> Deux piliers creusés valent mieux que cinq survolés — et laissent de la
              matière pour la suite.
            </li>
            <li>
              <b>Sortir sans date.</b> Une restitution qui finit par « je vous envoie une proposition » se termine
              rarement par une mission.
            </li>
          </ul>
        </div>

        <div className={k('doc-foot')}>
          <span>{PIED}</span>
          <span>Page 2 / 2 — Notes</span>
        </div>
      </div>
    </DocumentKit>
  );
}
