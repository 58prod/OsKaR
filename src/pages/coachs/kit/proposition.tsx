import React, { useEffect, useState } from 'react';
import { DocumentKit, EnTeteDoc, LOGO_RPR, k } from '@/components/coachs/kit/DocumentKit';
import {
  FORMATS,
  PILIERS_SCORES,
  VALIDITE_JOURS,
  appliquerFormat,
  dateLongue,
  lireDeroule,
  lireLignes,
  ouRepli,
  saisieInitiale,
  type FormatProposition,
  type SaisieProposition,
} from '@/lib/coachs/proposition';

/*
 * Trame de proposition — transposition de `plateforme/kit-proposition.html`.
 * Formulaire à gauche, proposition A4 composée en direct à droite ; le
 * formulaire disparaît à l'impression.
 *
 * Les dates du jour sont posées au montage : la page est pré-rendue à la
 * compilation, une date calculée à ce moment-là serait figée.
 */

type ChampTexte = Exclude<keyof SaisieProposition, 'format' | 'scores' | 'labelRpr'>;

export default function PropositionPage() {
  const [s, setS] = useState<SaisieProposition>(() => ({ ...saisieInitiale(new Date()), date: '', validite: '' }));

  useEffect(() => {
    const aujourdhui = new Date();
    const validite = new Date(aujourdhui.getTime() + VALIDITE_JOURS * 24 * 3600 * 1000);
    setS((p) => ({ ...p, date: dateLongue(aujourdhui), validite: dateLongue(validite) }));
  }, []);

  const champ = (cle: ChampTexte) => ({
    value: s[cle],
    onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setS((p) => ({ ...p, [cle]: e.target.value })),
  });

  const changerScore = (i: number, valeur: string) =>
    setS((p) => {
      const scores = [...p.scores] as SaisieProposition['scores'];
      scores[i] = valeur;
      return { ...p, scores };
    });

  const seances = lireDeroule(s.deroule);
  const livrables = lireLignes(s.livrables);
  const coach = ouRepli(s.coach);
  const contact = ouRepli(s.contact);

  return (
    <DocumentKit
      titreOnglet="Trame de proposition | Oskar"
      nom="Trame de proposition"
      consigne="remplissez à gauche, le document se met à jour à droite. Le formulaire n’apparaît pas à l’impression."
    >
      <div className={k('prop-layout')}>
        {/* ═══ Formulaire ═══ */}
        <form className={k('prop-form')} onSubmit={(e) => e.preventDefault()}>
          <h3>Votre proposition</h3>
          <div className={k('hint')}>
            Reprenez la page 2 de votre grille de restitution : les scores, les piliers creusés et sa phrase y sont
            déjà.
          </div>

          <div className={k('prop-group')}>
            <label htmlFor="f_format">Format</label>
            <select
              id="f_format"
              value={s.format}
              onChange={(e) => setS((p) => appliquerFormat(p, e.target.value as FormatProposition))}
            >
              {(Object.keys(FORMATS) as FormatProposition[]).map((f) => (
                <option key={f} value={f}>
                  {FORMATS[f].libelle}
                </option>
              ))}
            </select>
          </div>

          <div className={k('prop-group')}>
            <label htmlFor="f_orga">Organisation</label>
            <input type="text" id="f_orga" {...champ('orga')} />
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_contact">Interlocuteur · fonction</label>
            <input type="text" id="f_contact" {...champ('contact')} />
          </div>
          <div className={k('prop-row')}>
            <div className={k('prop-group')}>
              <label htmlFor="f_date">Date</label>
              <input type="text" id="f_date" {...champ('date')} />
            </div>
            <div className={k('prop-group')}>
              <label htmlFor="f_valid">Valable jusqu’au</label>
              <input type="text" id="f_valid" {...champ('validite')} />
            </div>
          </div>

          <div className={k('prop-sep')} />

          <div className={k('prop-group')}>
            <label>Scores du diagnostic</label>
            <div className={k('prop-scores')}>
              {PILIERS_SCORES.map((p, i) => (
                <div key={p.court}>
                  <span>{p.court}</span>
                  <input
                    type="text"
                    aria-label={`Score ${p.libelle}`}
                    value={s.scores[i]}
                    onChange={(e) => changerScore(i, e.target.value)}
                  />
                </div>
              ))}
            </div>
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_constat">Constat — ce que vous avez creusé</label>
            <textarea id="f_constat" {...champ('constat')} />
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_quote">Sa phrase, mot pour mot</label>
            <textarea id="f_quote" style={{ minHeight: 56 }} {...champ('citation')} />
            <div className={k('prop-note')}>
              C’est le bloc qui fait la différence : il se lit lui-même avant de lire un prix.
            </div>
          </div>

          <div className={k('prop-sep')} />

          <div className={k('prop-group')}>
            <label htmlFor="f_objectif">Objectif de la mission</label>
            <textarea id="f_objectif" style={{ minHeight: 60 }} {...champ('objectif')} />
            <div className={k('prop-note')}>Formulez un résultat, pas une activité.</div>
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_deroule">Déroulé — une séance par ligne</label>
            <textarea id="f_deroule" style={{ minHeight: 120 }} {...champ('deroule')} />
            <div className={k('prop-note')}>Format : Titre de la séance | ce qui s’y passe</div>
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_livrables">Livrables — un par ligne</label>
            <textarea id="f_livrables" style={{ minHeight: 90 }} {...champ('livrables')} />
          </div>

          <div className={k('prop-sep')} />

          <div className={k('prop-row')}>
            <div className={k('prop-group')}>
              <label htmlFor="f_duree">Durée</label>
              <input type="text" id="f_duree" {...champ('duree')} />
            </div>
            <div className={k('prop-group')}>
              <label htmlFor="f_seances">Séances</label>
              <input type="text" id="f_seances" {...champ('seances')} />
            </div>
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_montant">Montant</label>
            <input type="text" id="f_montant" placeholder="0 000 € HT" {...champ('montant')} />
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_modalites">Modalités de règlement</label>
            <input type="text" id="f_modalites" {...champ('modalites')} />
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_inclus">Inclus dans le prix</label>
            <input type="text" id="f_inclus" {...champ('inclus')} />
          </div>

          <div className={k('prop-sep')} />

          <div className={k('prop-group')}>
            <label htmlFor="f_coach">Coach</label>
            <input type="text" id="f_coach" {...champ('coach')} />
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_structure">Structure</label>
            <input type="text" id="f_structure" {...champ('structure')} />
          </div>
          <div className={k('prop-group')}>
            <label htmlFor="f_contactcoach">Contact</label>
            <input type="text" id="f_contactcoach" {...champ('contactCoach')} />
          </div>
          <div className={k('prop-group')}>
            <label className={k('rpr-check')}>
              <input
                type="checkbox"
                checked={s.labelRpr}
                onChange={(e) => setS((p) => ({ ...p, labelRpr: e.target.checked }))}
              />
              {/* eslint-disable-next-line @next/next/no-img-element -- vignette fixe */}
              <img src={LOGO_RPR} alt="" />
              <span className={k('rpr-title')}>Coach labellisé Réunir pour Réussir</span>
            </label>
          </div>
        </form>

        {/* ═══ Document ═══ */}
        <div className={k('doc-page', 'flow')}>
          <EnTeteDoc ligne1="Proposition" ligne2="d’accompagnement" />

          <div className={k('doc-title')}>
            Proposition pour
            <br />
            <span>{ouRepli(s.orga, 'l’organisation')}</span>
          </div>

          <div className={k('prop-meta')}>
            {[
              ['Interlocuteur', contact],
              ['Format', FORMATS[s.format].libelle],
              ['Date', ouRepli(s.date)],
              ['Valable jusqu’au', ouRepli(s.validite)],
            ].map(([libelle, valeur]) => (
              <div key={libelle} className={k('prop-meta-cell')}>
                <div className={k('prop-meta-lbl')}>{libelle}</div>
                <div className={k('prop-meta-val')}>{valeur}</div>
              </div>
            ))}
          </div>

          <div className={k('prop-block')}>
            <div className={k('doc-sec-title')}>1 · Ce que nous avons vu ensemble</div>
            <div className={k('prop-scores-row')}>
              {PILIERS_SCORES.map((p, i) => (
                <div key={p.court} className={k('prop-sc', `p-${p.couleur}`)}>
                  <div className={k('prop-sc-v')}>{ouRepli(s.scores[i])}</div>
                  <div className={k('prop-sc-l')}>{p.libelle}</div>
                </div>
              ))}
            </div>
            <p className={k('prop-p')}>{ouRepli(s.constat)}</p>
            <div className={k('prop-quote')}>
              <div className={k('prop-quote-txt')}>« {ouRepli(s.citation, '…')} »</div>
              <div className={k('prop-quote-src')}>— vos mots, lors de la restitution du diagnostic</div>
            </div>
          </div>

          <div className={k('prop-block')}>
            <div className={k('doc-sec-title')}>2 · L’objectif de la mission</div>
            <div className={k('prop-obj')}>{ouRepli(s.objectif)}</div>
          </div>

          <div className={k('prop-block')}>
            <div className={k('doc-sec-title')}>3 · Le déroulé</div>
            <ul className={k('prop-steps')}>
              {seances.map((seance, i) => (
                <li key={i}>
                  <span className={k('n')}>{i + 1}</span>
                  <span>
                    <b>{seance.titre}</b>
                    {seance.detail && ` — ${seance.detail}`}
                  </span>
                </li>
              ))}
            </ul>
          </div>

          <div className={k('prop-block')}>
            <div className={k('doc-sec-title')}>4 · Ce que vous avez à la fin</div>
            <ul className={k('prop-deliv')}>
              {livrables.map((l, i) => (
                <li key={i}>{l}</li>
              ))}
            </ul>
          </div>

          <div className={k('prop-block')}>
            <div className={k('doc-sec-title')}>5 · Conditions</div>
            <table className={k('prop-cond')}>
              <tbody>
                <tr>
                  <td className={k('lbl')}>Durée</td>
                  <td>{ouRepli(s.duree)}</td>
                  <td className={k('lbl')}>Séances</td>
                  <td>{ouRepli(s.seances)}</td>
                </tr>
                <tr>
                  <td className={k('lbl')}>Inclus</td>
                  <td colSpan={3}>{ouRepli(s.inclus)}</td>
                </tr>
                <tr>
                  <td className={k('lbl')}>Règlement</td>
                  <td colSpan={3}>{ouRepli(s.modalites)}</td>
                </tr>
                <tr>
                  <td className={k('total-lbl')}>Montant</td>
                  <td className={k('total')} colSpan={3}>
                    {ouRepli(s.montant, 'À compléter')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className={k('prop-block')}>
            <div className={k('doc-sec-title')}>6 · Bon pour accord</div>
            <div className={k('prop-sign')}>
              <div className={k('prop-sign-box')}>
                <div className={k('prop-sign-lbl')}>Pour l’organisation</div>
                <div className={k('prop-sign-sub')}>{contact} — date et signature</div>
              </div>
              <div className={k('prop-sign-box')}>
                <div className={k('prop-sign-lbl')}>Le coach</div>
                <div className={k('prop-sign-sub')}>{coach} — date et signature</div>
              </div>
            </div>
          </div>

          <div className={k('doc-coach')} style={{ marginTop: 4 }}>
            {s.labelRpr && (
              // eslint-disable-next-line @next/next/no-img-element -- document imprimé, taille fixe
              <img className={k('doc-coach-logo')} src={LOGO_RPR} alt="" />
            )}
            <div>
              <div className={k('doc-coach-k')}>Votre coach</div>
              <div className={k('doc-coach-name')}>{coach}</div>
              <div className={k('doc-coach-line')}>
                {s.labelRpr && 'Coach labellisé Réunir pour Réussir · '}
                {s.structure.trim()}
                <br />
                {s.contactCoach.trim()}
              </div>
            </div>
          </div>

          <div className={k('doc-foot')}>
            <span>Proposition établie sur la base du diagnostic Oskar · oskar-coach.fr</span>
            <span>{ouRepli(s.date)}</span>
          </div>
        </div>
      </div>
    </DocumentKit>
  );
}
