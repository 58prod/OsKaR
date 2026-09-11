import React from 'react';
import { DocumentKit, EnTeteDoc, LOGO_RPR, k } from '@/components/coachs/kit/DocumentKit';
import { PILIERS_KIT, type PilierKit } from '@/lib/coachs/piliers';

/*
 * Fiche « les 5 piliers » du kit coach — A4 recto-verso à laisser au client
 * après la séance. Un pilier par bloc : à quoi il sert, ce qu'il produit, en
 * combien de temps, d'après les pages de pilier de l'app. Même habillage que
 * le one-pager ; le bloc « Votre coach » se modifie dans la page.
 */

const Editable: React.FC<{ className: string; children: React.ReactNode }> = ({ className, children }) => (
  <div className={`${className} ${k('editable')}`} contentEditable suppressContentEditableWarning spellCheck={false}>
    {children}
  </div>
);

const BlocPilier: React.FC<{ p: PilierKit }> = ({ p }) => (
  <div className={k('fp-pilier')} style={{ borderLeftColor: p.couleur }}>
    <div className={k('fp-tete')}>
      <div className={k('fp-nom')} style={{ color: p.fonce }}>
        <span className={k('fp-num')}>{p.numero}</span>
        {p.nom}
      </div>
      <span className={k('fp-duree')} style={{ background: p.clair, color: p.fonce }}>
        {p.duree}
        {p.bientot && ' · bientôt disponible'}
      </span>
    </div>
    <div className={k('fp-q')}>{p.question}</div>
    <div className={k('fp-cols')}>
      <div>
        <div className={k('fp-lbl')}>À quoi il sert</div>
        <div className={k('fp-txt')}>{p.sert}</div>
      </div>
      <div>
        <div className={k('fp-lbl')}>Ce qu’il produit</div>
        <ul className={k('doc-list', 'check')}>
          {p.produit.map((l) => (
            <li key={l}>{l}</li>
          ))}
        </ul>
      </div>
    </div>
    <div className={k('fp-etapes')}>
      {p.etapes.map((e) => (
        <span key={e} className={k('fp-etape')}>
          {e}
        </span>
      ))}
    </div>
  </div>
);

export default function FicheCinqPiliersPage() {
  return (
    <DocumentKit
      titreOnglet="Fiche « les 5 piliers » | Oskar"
      nom="Fiche « les 5 piliers »"
      consigne="A4 recto-verso, à laisser au client. Personnalisez le bloc « Votre coach » au verso avant d’imprimer."
    >
      {/* ══ Recto ══ */}
      <div className={k('doc-page')}>
        <EnTeteDoc ligne1="Les 5 piliers" ligne2="Fiche à conserver" />

        <div className={k('doc-title')}>
          Cinq piliers pour transformer
          <br />
          l’ambition en <span>décisions tenues</span>.
        </div>
        <p className={k('doc-lede')}>
          Chaque pilier répond à une question que tout dirigeant se pose. Vous pouvez les parcourir dans l’ordre, ou
          commencer par celui que votre diagnostic a désigné : chacun se fait dans la plateforme, seul ou avec votre
          coach, et produit un document que vous gardez.
        </p>

        {PILIERS_KIT.slice(0, 3).map((p) => (
          <BlocPilier key={p.id} p={p} />
        ))}

        <div className={k('doc-foot')}>
          <span>OSKAR — Les 5 piliers · oskar-coach.fr</span>
          <span>Recto — 1 / 2</span>
        </div>
      </div>

      {/* ══ Verso ══ */}
      <div className={k('doc-page')}>
        <EnTeteDoc ligne1="Les 5 piliers" ligne2="Fiche à conserver" />

        {PILIERS_KIT.slice(3).map((p) => (
          <BlocPilier key={p.id} p={p} />
        ))}

        <div className={k('doc-sec-title')} style={{ marginTop: 6 }}>
          Le rythme de l’année
        </div>
        <div className={k('doc-meta')}>
          <span className={k('doc-chip')}>Un suivi OKR chaque trimestre</span>
          <span className={k('doc-chip')}>Un suivi Finance au semestre</span>
          <span className={k('doc-chip')}>Une rétro d’équipe chaque mois</span>
          <span className={k('doc-chip', 'coral')}>Un point d’alignement en janvier et en septembre</span>
        </div>

        <div className={k('doc-sec-title')}>Et maintenant</div>
        <div className={k('doc-bottom')}>
          <div className={k('doc-cta')}>
            <div>
              <div className={k('doc-cta-k')}>Pour avancer</div>
              <h3>Reprenez le pilier choisi ensemble.</h3>
              <p>Vos réponses restent dans la plateforme : vous les retrouvez à la prochaine séance.</p>
            </div>
            <div className={k('doc-cta-url')}>oskar-coach.fr</div>
          </div>

          <div className={k('doc-coach')}>
            {/* eslint-disable-next-line @next/next/no-img-element -- document imprimé, taille fixe */}
            <img className={k('doc-coach-logo')} src={LOGO_RPR} alt="" />
            <div>
              <div className={k('doc-coach-k')}>Votre coach</div>
              <Editable className={k('doc-coach-name')}>Prénom Nom</Editable>
              <Editable className={k('doc-coach-line')}>
                Coach labellisé Réunir pour Réussir
                <br />
                prenom@cabinet.fr · 06 00 00 00 00
              </Editable>
            </div>
          </div>
        </div>

        <div className={k('doc-foot')}>
          <span>OSKAR — Les 5 piliers · Document remis par votre coach</span>
          <span>Verso — 2 / 2</span>
        </div>
      </div>
    </DocumentKit>
  );
}
