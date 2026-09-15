import React from 'react';
import { History, Sparkles } from 'lucide-react';
import { Bandeau, PILULE, TAG, noteSur10 } from '@/components/admin/elements';
import { dateCourte, ilYA } from '@/lib/admin/formule';
import { SUJETS_SUIVIS, nomDe, sujetsNouveaux } from '@/lib/accompagnement/regles';
import {
  STATUTS_ACTION,
  arbreOkr,
  avancementResultat,
  lectureFinance,
  lectureFit,
  lectureVision,
  okrVide,
  type BrancheObjectif,
  type Ligne,
  type Rubrique,
} from '@/lib/accompagnement/lecture';
import type { FicheDirigeant, OkrDirigeant, SujetSuivi } from '@/lib/accompagnement/types';
import { Avatar, BOUTON_RETRAIT, BoutonAsync, FOND_SUJET, Interrupteur, TEXTE_SUJET } from './elements';

/*
 * La fiche d'un dirigeant, lue par son coach : l'en-tête (qui, depuis quand,
 * résumé de 8 h, fin de l'accompagnement), ce qui a changé depuis la dernière
 * visite, puis un bloc par pilier avec ce que le dirigeant a saisi, en lecture
 * seule. Chaque bloc porte le liseré et la couleur de son pilier.
 */

interface Props {
  fiche: FicheDirigeant;
  onResume?: (resume: boolean) => Promise<boolean>;
  onTerminer?: () => Promise<boolean>;
  maintenant?: Date;
}

const TITRES: Record<SujetSuivi, string> = {
  vision: 'OSKAR Vision',
  fit: 'OSKAR Market Fit',
  finance: 'OSKAR Finance',
  okr: 'OSKAR OKR',
  team: 'OSKAR Team',
  bilans: 'Bilans',
};

export const LectureDirigeant: React.FC<Props> = ({ fiche, onResume, onTerminer, maintenant = new Date() }) => {
  const nom = nomDe(fiche.profil);
  const prenom = fiche.profil.nom?.trim().split(/\s+/)[0] || nom;
  const nouveaux = sujetsNouveaux(fiche.activite, fiche.vuPrecedemment);
  const nomsNouveaux = SUJETS_SUIVIS.filter((s) => nouveaux.includes(s.id)).map((s) => s.nom);

  const section = (id: SujetSuivi, contenu: React.ReactNode) => (
    <SectionSuivi
      key={id}
      id={id}
      date={fiche.activite[id]}
      neuf={fiche.vuPrecedemment != null && nouveaux.includes(id)}
      maintenant={maintenant}
    >
      {contenu}
    </SectionSuivi>
  );

  return (
    <>
      <section className="bg-white border border-line rounded-card shadow-card px-[26px] py-[22px] mb-3.5 flex gap-4 flex-wrap items-start">
        <Avatar nom={nom} grand />
        <div className="min-w-0 flex-1 basis-[260px]">
          <h1 className="text-[24px] font-extrabold text-navy leading-[1.2] break-words">{nom}</h1>
          <p className="text-14.5 text-muted mt-1">
            {[fiche.profil.entreprise, fiche.profil.activite].filter(Boolean).join(' · ') || 'Profil d’entreprise non renseigné'}
          </p>
          <p className="text-13.5 text-muted mt-1.5">
            <a href={`mailto:${fiche.profil.email}`} className="font-semibold text-navy hover:text-teal-dark break-all">
              {fiche.profil.email}
            </a>{' '}
            · accompagné depuis le {dateCourte(fiche.depuis)}
          </p>
        </div>
        {(onResume || onTerminer) && (
          <div className="grid gap-3 basis-[240px]">
            {onResume && (
              <Interrupteur
                id="resume-fiche"
                actif={fiche.resumeQuotidien}
                onChange={(v) => onResume(v)}
                libelle="Dans mon résumé de 8 h"
              />
            )}
            {onTerminer && (
              <BoutonAsync
                classe={`${BOUTON_RETRAIT} justify-center`}
                libelle="Mettre fin à l’accompagnement"
                confirmation={`Mettre fin à l’accompagnement de ${nom} ? Vous ne verrez plus son travail.`}
                action={onTerminer}
              />
            )}
          </div>
        )}
      </section>

      {fiche.vuPrecedemment ? (
        nouveaux.length ? (
          <Bandeau ton="teal" icone={<Sparkles aria-hidden />}>
            Depuis votre dernière visite ({ilYA(fiche.vuPrecedemment, maintenant)}) :{' '}
            <strong className="text-navy">{nomsNouveaux.join(', ')}</strong>.
          </Bandeau>
        ) : (
          <Bandeau icone={<History aria-hidden />}>
            Rien n&rsquo;a changé depuis votre dernière visite ({ilYA(fiche.vuPrecedemment, maintenant)}).
          </Bandeau>
        )
      ) : (
        <Bandeau icone={<Sparkles aria-hidden />}>
          Première visite : voici tout ce que {prenom} a saisi dans Oskar jusqu&rsquo;ici.
        </Bandeau>
      )}

      <nav aria-label="Aller à un pilier" className="flex gap-1.5 flex-wrap mb-[18px]">
        {SUJETS_SUIVIS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="inline-flex items-center gap-2 text-14 font-semibold leading-[normal] px-3.5 py-2 rounded-[22px] border-[1.5px] bg-white border-line text-muted transition-colors hover:border-navy hover:text-navy"
          >
            <span className={`w-2.5 h-2.5 rounded-full ${fiche.activite[s.id] ? FOND_SUJET[s.id] : 'bg-line'}`} aria-hidden />
            {s.nom}
            {fiche.vuPrecedemment != null && nouveaux.includes(s.id) && (
              <span className="w-1.5 h-1.5 rounded-full bg-coral" title="Nouveau" aria-label="nouveau" />
            )}
          </a>
        ))}
      </nav>

      {section('vision', fiche.vision ? <Rubriques liste={lectureVision(fiche.vision)} /> : <PasCommence />)}
      {section('fit', fiche.fit ? <VueFit contenu={fiche.fit} /> : <PasCommence />)}
      {section('finance', fiche.finance ? <VueFinance contenu={fiche.finance} /> : <PasCommence />)}
      {section('okr', okrVide(fiche.okr) ? <PasCommence /> : <VueOkr okr={fiche.okr} />)}
      {section(
        'team',
        fiche.team ? (
          <PasCommence texte="Atelier commencé : son contenu s’affichera ici dès que l’atelier Team sera ouvert." />
        ) : (
          <PasCommence />
        )
      )}
      {section('bilans', <VueBilans bilans={fiche.bilans} />)}
    </>
  );
};

const SectionSuivi: React.FC<{
  id: SujetSuivi;
  date: Date | null;
  neuf: boolean;
  maintenant: Date;
  children: React.ReactNode;
}> = ({ id, date, neuf, maintenant, children }) => (
  <section
    id={id}
    aria-labelledby={`titre-${id}`}
    className="scroll-mt-24 relative overflow-hidden bg-white border border-line rounded-card shadow-card p-5 min-[600px]:p-[27.5px] mb-3.5"
  >
    <span className={`absolute left-0 inset-y-0 w-1 ${FOND_SUJET[id]}`} aria-hidden />
    <header className="flex items-center gap-2.5 flex-wrap pb-3.5 border-b border-line mb-[18px]">
      <h2 id={`titre-${id}`} className={`text-[17px] font-extrabold ${TEXTE_SUJET[id]}`}>
        {TITRES[id]}
      </h2>
      {neuf && <span className={`${TAG} bg-coral-light text-coral-dark`}>Nouveau</span>}
      {date && <span className="ml-auto text-13 text-muted">Modifié {ilYA(date, maintenant)}</span>}
    </header>
    {children}
  </section>
);

const PasCommence: React.FC<{ texte?: string }> = ({ texte = 'Pas encore commencé.' }) => (
  <p className="text-14.5 text-muted">{texte}</p>
);

const Rubriques: React.FC<{ liste: Rubrique[] }> = ({ liste }) =>
  liste.length === 0 ? (
    <PasCommence texte="Atelier ouvert, rien de saisi pour l’instant." />
  ) : (
    <div className="grid gap-6">
      {liste.map((r) => (
        <RubriqueVue key={r.titre} r={r} />
      ))}
    </div>
  );

const Lignes: React.FC<{ lignes: Ligne[]; className?: string }> = ({ lignes, className = '' }) => (
  <dl className={`grid gap-x-5 gap-y-1 min-[700px]:gap-y-2.5 text-14.5 min-[700px]:grid-cols-[250px_minmax(0,1fr)] ${className}`}>
    {lignes.map((l, i) => (
      <React.Fragment key={i}>
        <dt className="text-muted">{l.libelle}</dt>
        <dd className="text-ink font-medium whitespace-pre-wrap break-words mb-2 min-[700px]:mb-0">{l.valeur}</dd>
      </React.Fragment>
    ))}
  </dl>
);

const RubriqueVue: React.FC<{ r: Rubrique }> = ({ r }) => (
  <div>
    <h3 className="text-12.5 font-bold leading-[1.6] tracking-[.08em] uppercase text-muted mb-2">{r.titre}</h3>
    {r.texte && <p className="text-14.5 leading-[1.65] text-ink whitespace-pre-wrap">{r.texte}</p>}
    {r.avant && <Lignes lignes={r.avant} className="mb-3" />}
    {r.tableau && (
      <div className="overflow-x-auto border border-line rounded-[10px] mb-3 last:mb-0">
        <table className="w-full border-collapse text-13.5">
          <thead>
            <tr>
              {r.tableau.colonnes.map((c) => (
                <th key={c} className="text-left font-bold text-muted bg-[#fafbfd] px-3 py-2 border-b border-line whitespace-nowrap">
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {r.tableau.lignes.map((ligne, i) => (
              <tr key={i} className="[&:last-child>td]:border-b-0">
                {ligne.map((cellule, j) => (
                  <td key={j} className={`px-3 py-2 border-b border-line align-top ${j === 0 ? 'font-semibold text-navy' : 'text-ink'}`}>
                    {cellule || '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
    {r.lignes && <Lignes lignes={r.lignes} />}
  </div>
);

const VueFit: React.FC<{ contenu: unknown }> = ({ contenu }) => {
  const { statut, score, rubriques } = lectureFit(contenu);
  return (
    <>
      {rubriques.length > 0 && (
        <div className="flex items-baseline gap-x-3 gap-y-1 flex-wrap rounded-[11px] px-4 py-3 mb-6" style={{ background: statut.fond }}>
          <strong className="text-15" style={{ color: statut.couleur }}>
            {statut.libelle}
          </strong>
          <span className="text-13.5 text-ink">
            Score {score}/17 — {statut.description}
          </span>
        </div>
      )}
      <Rubriques liste={rubriques} />
    </>
  );
};

const VueFinance: React.FC<{ contenu: unknown }> = ({ contenu }) => {
  const { chiffres, rubriques } = lectureFinance(contenu);
  return (
    <>
      {chiffres.length > 0 && (
        <div className="grid gap-3 grid-cols-2 min-[900px]:grid-cols-5 mb-6">
          {chiffres.map((c) => (
            <div key={c.libelle} className="bg-surface rounded-[11px] px-4 py-3">
              <div className="text-12 font-bold tracking-[.06em] uppercase text-muted">{c.libelle}</div>
              <div className="text-[19px] font-extrabold text-navy mt-1 whitespace-nowrap">{c.valeur}</div>
            </div>
          ))}
        </div>
      )}
      <Rubriques liste={rubriques} />
    </>
  );
};

const TON_ACTION: Record<string, string> = {
  TODO: 'bg-surface text-muted',
  IN_PROGRESS: 'bg-vision-light text-vision-dark',
  DONE: 'bg-fit-light text-fit-dark',
  BLOCKED: 'bg-coral-light text-coral-dark',
  CANCELLED: 'bg-[#f3f4f6] text-[#6b7280]',
};

const chiffre = (n: number | null) => (n == null ? '—' : n.toLocaleString('fr-FR'));

const Branche: React.FC<{ b: BrancheObjectif }> = ({ b }) => (
  <div className="border-l-[3px] border-okr/40 pl-4 mt-3.5">
    <div className="text-14.5 font-semibold text-ink">
      <span className={`${PILULE} bg-okr-light text-okr-dark mr-2`}>
        {b.objectif.trimestre} {b.objectif.annee}
      </span>
      {b.objectif.titre}
    </div>
    {b.resultats.length === 0 ? (
      <p className="text-13.5 text-muted mt-1.5">Aucun résultat clé.</p>
    ) : (
      b.resultats.map(({ resultat: r, actions }) => {
        const pct = avancementResultat(r);
        return (
          <div key={r.id} className="mt-3">
            <div className="flex items-baseline gap-3 text-14">
              <span className="flex-1 min-w-0">{r.titre}</span>
              <span className="text-13 text-muted whitespace-nowrap">
                {chiffre(r.actuel)} / {chiffre(r.cible)}
                {r.unite ? ` ${r.unite}` : ''}
                {pct != null ? ` · ${pct} %` : ''}
              </span>
            </div>
            {pct != null && (
              <div className="h-2 bg-surface rounded-md overflow-hidden mt-1.5 max-w-[460px]">
                <div className="h-full bg-okr rounded-md" style={{ width: `${pct}%` }} />
              </div>
            )}
            {actions.length > 0 && (
              <ul className="mt-2 grid gap-1.5">
                {actions.map((ac) => (
                  <li key={ac.id} className="text-13.5 flex gap-2 items-baseline">
                    <span className={`${PILULE} ${TON_ACTION[ac.statut] ?? TON_ACTION.TODO}`}>
                      {STATUTS_ACTION[ac.statut] ?? ac.statut}
                    </span>
                    <span className="min-w-0">{ac.titre}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })
    )}
  </div>
);

const VueOkr: React.FC<{ okr: OkrDirigeant }> = ({ okr }) => {
  const arbre = arbreOkr(okr);
  return (
    <div className="grid gap-6">
      {arbre.ambitions.map(({ ambition, objectifs }) => (
        <div key={ambition.id}>
          <h3 className="text-16 font-bold text-navy">
            <span className={`${PILULE} bg-okr text-white mr-2 align-middle`}>Ambition {ambition.annee}</span>
            {ambition.titre}
          </h3>
          {ambition.description && <p className="text-14 text-muted mt-1 leading-[1.6]">{ambition.description}</p>}
          {objectifs.length === 0 ? (
            <p className="text-13.5 text-muted mt-2">Aucun objectif trimestriel.</p>
          ) : (
            objectifs.map((b) => <Branche key={b.objectif.id} b={b} />)
          )}
        </div>
      ))}
      {arbre.objectifsSeuls.length > 0 && (
        <div>
          <h3 className="text-16 font-bold text-navy">Objectifs trimestriels</h3>
          {arbre.objectifsSeuls.map((b) => (
            <Branche key={b.objectif.id} b={b} />
          ))}
        </div>
      )}
      {arbre.actionsSeules.length > 0 && (
        <div>
          <h3 className="text-16 font-bold text-navy mb-2">Autres actions</h3>
          <ul className="grid gap-1.5">
            {arbre.actionsSeules.map((ac) => (
              <li key={ac.id} className="text-13.5 flex gap-2 items-baseline">
                <span className={`${PILULE} ${TON_ACTION[ac.statut] ?? TON_ACTION.TODO}`}>{STATUTS_ACTION[ac.statut] ?? ac.statut}</span>
                <span className="min-w-0">{ac.titre}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

const VueBilans: React.FC<{ bilans: FicheDirigeant['bilans'] }> = ({ bilans }) =>
  bilans.length === 0 ? (
    <PasCommence texte="Aucun bilan enregistré." />
  ) : (
    <div>
      {bilans.map((b) => (
        <div
          key={b.id}
          className="flex justify-between items-center py-[9px] border-b border-line first:pt-0 last:pb-0 last:border-b-0 text-14.5"
        >
          <span>
            {b.type === 'produit' ? 'Potentiel Produit' : 'Bilan de maturité'}
            <span className="text-13 text-muted"> · {dateCourte(b.creeLe)}</span>
          </span>
          {b.note != null && (
            <span className="font-extrabold text-navy">
              {noteSur10(b.note)}
              <small className="font-medium text-muted text-[0.8em]">/10</small>
            </span>
          )}
        </div>
      ))}
    </div>
  );

export default LectureDirigeant;
