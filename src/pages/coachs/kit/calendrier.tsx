import React, { useEffect, useMemo, useState } from 'react';
import { DocumentKit, EnTeteDoc, k } from '@/components/coachs/kit/DocumentKit';
import {
  EVENEMENTS,
  MOIS,
  MOIS_COURTS,
  PILIERS_CALENDRIER,
  colonnes,
  lancementParDefaut,
  periode,
  programme,
  type CleEvenement,
  type NatureEvenement,
} from '@/lib/coachs/calendrier';

/*
 * Calendrier des ateliers — reprise de `Oskar/timeline.html` (programme
 * annuel), mise au format des documents du kit : réglages au-dessus, page A4
 * paysage imprimable, accent corail. Le détail de chaque case, affiché au
 * survol dans l'original, passe dans une légende sous le tableau pour rester
 * lisible sur tablette et sur papier.
 *
 * La section « Réunir pour Réussir » de l'original (niveaux et tarifs du
 * partenaire) n'est pas reprise ici : elle n'a pas sa place dans une page publique.
 */

/** Rendu d'une case selon sa nature, repris de `chipStyle` de l'original. */
function styleCase(nature: NatureEvenement, couleur: string): React.CSSProperties {
  if (nature === 'atelier') return { background: couleur, color: '#fff' };
  if (nature === 'suivi') return { background: '#fff', border: `1.5px solid ${couleur}`, color: couleur };
  return { background: `${couleur}1a`, border: `1px solid ${couleur}55`, color: couleur };
}

const COULEUR = Object.fromEntries(PILIERS_CALENDRIER.map((p) => [p.id, p.couleur])) as Record<string, string>;

export default function CalendrierPage() {
  const [orga, setOrga] = useState('');
  const [lancement, setLancement] = useState(0);
  const [annee, setAnnee] = useState(() => new Date().getFullYear());

  // Posé au montage : la page est pré-rendue à la compilation.
  useEffect(() => {
    const d = lancementParDefaut(new Date());
    setLancement(d.lancement);
    setAnnee(d.annee);
  }, []);

  const cols = colonnes(lancement, annee);
  const parCase = useMemo(() => {
    const table: Record<string, CleEvenement[]> = {};
    for (const e of programme(lancement)) {
      const cle = `${EVENEMENTS[e.cle].pilier}-${e.rang}`;
      (table[cle] ??= []).push(e.cle);
    }
    return table;
  }, [lancement]);

  return (
    <DocumentKit
      titreOnglet="Calendrier des ateliers | Oskar"
      nom="Calendrier des ateliers"
      consigne="A4 paysage. Choisissez le mois de lancement : ateliers, suivis et rituels se placent sur les douze mois."
    >
      {/* ═══ Réglages (masqués à l'impression) ═══ */}
      <div className={k('cal-controls')}>
        <div className={k('prop-group')}>
          <label htmlFor="c_orga">Organisation</label>
          <input
            type="text"
            id="c_orga"
            placeholder="Nom de l’entreprise"
            value={orga}
            onChange={(e) => setOrga(e.target.value)}
          />
        </div>
        <div className={k('prop-group')}>
          <label htmlFor="c_mois">Mois de lancement</label>
          <select id="c_mois" value={lancement} onChange={(e) => setLancement(Number(e.target.value))}>
            {MOIS.map((m, i) => (
              <option key={m} value={i}>
                {m}
              </option>
            ))}
          </select>
        </div>
        <div className={k('prop-group')}>
          <label>Année</label>
          <div className={k('cal-annee')}>
            <button type="button" aria-label="Année précédente" onClick={() => setAnnee((a) => a - 1)}>
              ‹
            </button>
            <strong>{annee}</strong>
            <button type="button" aria-label="Année suivante" onClick={() => setAnnee((a) => a + 1)}>
              ›
            </button>
          </div>
        </div>
        <div className={k('cal-periode')}>
          Programme : <strong>{periode(lancement, annee)}</strong>
        </div>
      </div>

      {/* ═══ Document ═══ */}
      <div className={k('doc-page', 'paysage')}>
        <EnTeteDoc ligne1="Calendrier des ateliers" ligne2={periode(lancement, annee)} />

        <div className={k('doc-title')}>
          Le programme de l’année pour <span>{orga.trim() || 'votre entreprise'}</span>
        </div>
        <p className={k('doc-lede')}>
          Vision, Market Fit et Finance ouvrent l’année en {MOIS[lancement].toLowerCase()} ; l’atelier OKR suit le
          mois d’après, puis les suivis tombent en fin de trimestre. L’équipe se retrouve chaque mois.
        </p>

        <table className={k('cal-table')}>
          <thead>
            <tr>
              <th className={k('cal-pilier-th')}>Pilier</th>
              {cols.map((c, rang) => (
                <th key={rang} className={k(rang === 0 && 'cal-lancement')}>
                  {MOIS_COURTS[c.mois]}
                  {(rang === 0 || c.mois === 0) && ` ${c.annee}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PILIERS_CALENDRIER.map((p) => (
              <tr key={p.id}>
                <td className={k('cal-pilier')}>
                  <span className={k('cal-pl')} style={{ color: p.couleur }}>
                    <span className={k('cal-dot')} style={{ background: p.couleur }} />
                    {p.libelle}
                  </span>
                </td>
                {cols.map((_, rang) => (
                  <td key={rang} className={k(rang === 0 && 'cal-lancement')}>
                    {(parCase[`${p.id}-${rang}`] ?? []).map((cle) => {
                      const e = EVENEMENTS[cle];
                      return (
                        <span key={cle} className={k('cal-chip')} style={styleCase(e.nature, p.couleur)}>
                          <span className={k('cal-chip-t')}>{e.court}</span>
                          <span className={k('cal-chip-s')}>{e.duree}</span>
                        </span>
                      );
                    })}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>

        <div className={k('doc-sec-title')}>Le détail</div>
        <div className={k('cal-legende')}>
          {(Object.keys(EVENEMENTS) as CleEvenement[]).map((cle) => {
            const e = EVENEMENTS[cle];
            return (
              <div key={cle} className={k('cal-leg')}>
                <span className={k('cal-leg-mark')} style={styleCase(e.nature, COULEUR[e.pilier])} />
                <div>
                  <div className={k('cal-leg-t')}>
                    {e.titre}{' '}
                    <span>
                      · {e.duree} · {e.public}
                    </span>
                  </div>
                  <div className={k('cal-leg-d')}>{e.detail}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className={k('doc-foot')}>
          <span>OSKAR — Calendrier des ateliers · Kit coach</span>
          <span>Document remis par votre coach</span>
        </div>
      </div>
    </DocumentKit>
  );
}
