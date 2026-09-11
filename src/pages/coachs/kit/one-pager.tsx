import React from 'react';
import { DocumentKit, EnTeteDoc, LOGO_RPR, k } from '@/components/coachs/kit/DocumentKit';

/*
 * One-pager du kit coach — transposition de `plateforme/kit-one-pager.html`.
 * Le bloc « Votre coach » se modifie directement dans la page (texte
 * éditable), comme l'annonce la barre d'impression.
 */

const PILIERS = [
  {
    nom: 'Vision',
    classe: 'p-vision',
    question: 'Où allons-nous, et pourquoi cela vaut-il la peine ?',
    produit: 'Un cap à 1 an, des valeurs, 3 objectifs fondateurs',
  },
  {
    nom: 'Fit',
    classe: 'p-fit',
    question: 'Notre offre répond-elle vraiment à un besoin qui paie ?',
    produit: 'Des preuves de traction, pas des intuitions',
  },
  {
    nom: 'Finance',
    classe: 'p-finance',
    question: 'Nos chiffres nous préviennent-ils à temps ?',
    produit: 'Un tableau de bord mensuel tenu en 30 minutes',
  },
  {
    nom: 'OKR',
    classe: 'p-okr',
    question: 'Que faisons-nous ce trimestre, et comment le saurons-nous ?',
    produit: 'Des objectifs mesurables, revus chaque semaine',
  },
  {
    nom: 'Team',
    classe: 'p-team',
    question: 'L’équipe avance-t-elle dans le même sens ?',
    produit: 'Des rituels courts : rétro, météo, daily',
  },
];

const ETAPES = [
  { titre: 'Le diagnostic', texte: '10 minutes, 5 piliers, 15 critères. Seul ou avec votre coach.' },
  { titre: 'La restitution', texte: '45 minutes pour lire les résultats et nommer les vrais sujets.' },
  { titre: 'Le plan d’actions', texte: 'La feuille de route jusqu’à fin d’année et les points de coaching calés.' },
  { titre: 'Le premier pilier', texte: 'Celui qui débloque le reste. Atelier animé, résultats dans la plateforme.' },
];

/** Texte modifiable à l'écran ; le surlignage disparaît à l'impression. */
const Editable: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={`${className} ${k('editable')}`} contentEditable suppressContentEditableWarning spellCheck={false}>
    {children}
  </div>
);

export default function OnePagerPage() {
  return (
    <DocumentKit
      titreOnglet="One-pager | Oskar"
      nom="One-pager OSKAR"
      consigne="A4 recto. Personnalisez le bloc « Votre coach » en bas de page avant d’imprimer."
    >
      <div className={k('doc-page')}>
        <EnTeteDoc ligne1="Cadre de management" ligne2="en 5 piliers" />

        <div className={k('doc-title')}>
          La productivité, c’est créer
          <br />
          plus de <span>valeur durable</span>.
        </div>
        <p className={k('doc-lede')}>
          Ce qui manque rarement à un dirigeant, c’est l’ambition : c’est le cadre qui la transforme en décisions
          tenues. Oskar structure cinq domaines que l’on traite d’habitude séparément, et les relie par des rituels
          courts.
        </p>

        <div className={k('doc-sec-title')}>Les 5 piliers</div>
        <div className={k('doc-pillars')}>
          {PILIERS.map((p) => (
            <div key={p.nom} className={k('doc-pillar', p.classe)}>
              <div className={k('doc-pillar-name')}>{p.nom}</div>
              <div className={k('doc-pillar-q')}>{p.question}</div>
              <div className={k('doc-pillar-out')}>{p.produit}</div>
            </div>
          ))}
        </div>

        <div className={k('doc-cols')}>
          <div>
            <div className={k('doc-sec-title')}>Ce que ça change</div>
            <ul className={k('doc-list', 'check')}>
              <li>Les décisions se prennent sur des faits, pas sur l’humeur du mois.</li>
              <li>Chacun sait à quoi il contribue, et le vérifie chaque semaine.</li>
              <li>Les mauvaises nouvelles arrivent tôt, quand elles sont encore réparables.</li>
            </ul>
          </div>
          <div>
            <div className={k('doc-sec-title')}>C’est pour vous si…</div>
            <ul className={k('doc-list')}>
              <li>Vous pilotez à vue et découvrez les problèmes trop tard.</li>
              <li>Vos objectifs annuels sont oubliés dès février.</li>
              <li>Votre équipe travaille dur, mais pas forcément dans le même sens.</li>
            </ul>
          </div>
        </div>

        <div className={k('doc-sec-title')}>Comment ça se passe</div>
        <div className={k('doc-steps')}>
          {ETAPES.map((e, i) => (
            <div key={e.titre} className={k('doc-step')}>
              <div className={k('doc-step-n')}>{i + 1}</div>
              <h4>{e.titre}</h4>
              <p>{e.texte}</p>
            </div>
          ))}
        </div>

        <div className={k('doc-bottom')}>
          <div className={k('doc-cta')}>
            <div>
              <div className={k('doc-cta-k')}>Commencez par là</div>
              <h3>Le diagnostic est gratuit et sans inscription.</h3>
              <p>Dix minutes pour savoir où concentrer votre énergie les six prochains mois.</p>
            </div>
            <div className={k('doc-cta-url')}>hasenso.fr/oskar</div>
          </div>

          <div className={k('doc-coach')}>
            {/* eslint-disable-next-line @next/next/no-img-element -- document imprimé, taille fixe */}
            <img className={k('doc-coach-logo')} src={LOGO_RPR} alt="" />
            <div>
              <div className={k('doc-coach-k')}>Votre coach</div>
              <Editable className={k('doc-coach-name')}>Prénom Nom</Editable>
              <Editable className={k('doc-coach-line')}>
                Coach labellisé Réunir pour Réussir · Vision, OKR, Finance
                <br />
                prenom@cabinet.fr · 06 00 00 00 00 · Marseille &amp; distanciel
              </Editable>
            </div>
          </div>
        </div>

        <div className={k('doc-foot')}>
          <span>OSKAR — un cadre de management en 5 piliers · hasenso.fr/oskar</span>
          <span>Document remis par votre coach</span>
        </div>
      </div>
    </DocumentKit>
  );
}
