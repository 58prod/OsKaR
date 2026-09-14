import React, { useMemo, useState } from 'react';
import { ShieldCheck } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import { Bandeau, Carte, Chargement, Erreur, Kpi, Puces, TD, TH, pluriel } from '@/components/admin/elements';
import { useEstAdmin, useStatistiquesAdmin } from '@/hooks/useAdmin';
import {
  dureeLisible,
  evolution,
  nomPage,
  part,
  pasPour,
  regrouper,
  uneDecimale,
  type Statistiques,
} from '@/lib/statistiques/rapport';

/*
 * Statistiques de fréquentation (migration 20260914_statistiques), dans le
 * langage visuel du tableau de bord (plateforme/admin.html) :
 *   chiffres clés  les 4 cartes à liseré du tableau de bord
 *   grilles        1.5fr / 1fr, écart 16
 *   barres         navy, la période en cours en turquoise, infobulle au survol
 *   répartitions   libellé + valeur, barre de 8px dessous, fond #f5f6fa
 */

const PERIODES = [
  { id: '7', libelle: '7 jours' },
  { id: '30', libelle: '30 jours' },
  { id: '90', libelle: '3 mois' },
  { id: '365', libelle: '12 mois' },
];

/** Le site de production ; les autres hôtes branchés sur la même base se choisissent à part. */
const SITE_PRINCIPAL = 'oskar-coach.fr';
const TOUS = '*';
const PAGES_VISIBLES = 12;

const nb = (v: number) => v.toLocaleString('fr-FR');

const Evolution: React.FC<{ actuel: number; precedent: number; jours: number }> = ({ actuel, precedent, jours }) => {
  const e = evolution(actuel, precedent);
  if (e == null) return <>rien à comparer sur les {jours} jours d&rsquo;avant</>;
  return (
    <>
      <span className={`font-bold ${e >= 0 ? 'text-fit-dark' : 'text-coral-dark'}`}>
        {e > 0 ? '+' : ''}
        {e} %
      </span>{' '}
      par rapport aux {jours} jours d&rsquo;avant
    </>
  );
};

interface BarreGraphe {
  cle: string;
  libelle: string;
  valeur: number;
  infobulle: string;
  accent?: boolean;
}

/** Histogramme à une seule série : les valeurs au-dessus quand il y a la place, sinon au survol. */
const Barres: React.FC<{
  barres: BarreGraphe[];
  resume: string;
  hauteur?: number;
  /** Quels libellés afficher sous l'axe (par défaut : tous s'il y a la place, sinon un sur n). */
  libelleVisible?: (i: number) => boolean;
}> = ({ barres, resume, hauteur = 130, libelleVisible }) => {
  const [survol, setSurvol] = useState<number | null>(null);
  const max = Math.max(1, ...barres.map((b) => b.valeur));
  const peu = barres.length <= 14;
  const pas = peu ? 1 : Math.ceil(barres.length / 8);
  const visible = libelleVisible ?? ((i: number) => (barres.length - 1 - i) % pas === 0);

  return (
    <div role="img" aria-label={resume} className="flex items-end pt-8" style={{ gap: peu ? 12 : 3, height: hauteur + 70 }}>
      {barres.map((b, i) => (
        <div
          key={b.cle}
          className="relative flex-1 min-w-0 h-full flex flex-col items-center justify-end gap-2 cursor-default"
          onMouseEnter={() => setSurvol(i)}
          onMouseLeave={() => setSurvol(null)}
        >
          {peu && <span className="text-13 font-bold text-navy">{nb(b.valeur)}</span>}
          <div
            className={`w-full max-w-[44px] transition-opacity ${
              b.valeur
                ? `rounded-t-[4px] rounded-b-[2px] bg-gradient-to-b ${b.accent ? 'from-teal to-teal-dark' : 'from-navy-light to-navy'}`
                : 'bg-line rounded-sm'
            } ${survol != null && survol !== i ? 'opacity-50' : ''}`}
            style={{ height: b.valeur ? Math.max(3, Math.round((b.valeur / max) * hauteur)) : 2 }}
          />
          <span className={`text-12 font-semibold text-muted whitespace-nowrap ${visible(i) ? '' : 'invisible'}`}>
            {b.libelle}
          </span>
          {survol === i && (
            <div
              className={`absolute top-0 -translate-y-full z-10 bg-navy text-white text-12.5 leading-[1.5] rounded-lg px-2.5 py-1.5 whitespace-nowrap shadow-card pointer-events-none ${
                i < barres.length / 2 ? 'left-0' : 'right-0'
              }`}
            >
              {b.infobulle}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

/** Une ligne de répartition : libellé et valeur, barre fine dessous. */
const Repartition: React.FC<{ libelle: React.ReactNode; valeur: number; total: number; max: number; accent?: boolean }> = ({
  libelle,
  valeur,
  total,
  max,
  accent,
}) => (
  <div className="mb-3 last:mb-0">
    <div className="flex items-baseline justify-between gap-3 text-14.5 mb-1.5">
      <span className="font-semibold text-navy min-w-0 truncate">{libelle}</span>
      <span className="shrink-0 text-14 font-bold text-navy">
        {nb(valeur)} <span className="font-semibold text-muted">· {part(valeur, total)} %</span>
      </span>
    </div>
    <div className="h-2 bg-surface rounded-md overflow-hidden">
      <div
        className={`h-full rounded-md ${accent ? 'bg-teal' : 'bg-navy-light'}`}
        style={{ width: `${max ? (valeur / max) * 100 : 0}%` }}
      />
    </div>
  </div>
);

const APPAREILS = [
  { id: 'ordinateur', libelle: 'Ordinateur' },
  { id: 'tablette', libelle: 'Tablette' },
  { id: 'mobile', libelle: 'Mobile' },
] as const;

const Rapport: React.FC<{ s: Statistiques }> = ({ s }) => {
  const [toutesLesPages, setToutesLesPages] = useState(false);
  const t = s.totaux;
  const pas = pasPour(s.jours);
  const barres = useMemo(() => regrouper(s.parJour, s.jours), [s.parJour, s.jours]);

  if (t.vues === 0) {
    return (
      <Carte>
        <p className="text-15 text-muted leading-[1.6]">
          Aucune page vue sur cette période. La mesure démarre avec la version 2.40.0 : les chiffres apparaissent ici au
          fil des visites.
        </p>
      </Carte>
    );
  }

  const habitues = t.visiteurs - t.nouveaux;
  const maxAppareil = Math.max(...APPAREILS.map((a) => s.appareils[a.id]));
  const maxProvenance = Math.max(1, ...s.provenances.map((p) => p.visites));
  const pages = toutesLesPages ? s.pages : s.pages.slice(0, PAGES_VISIBLES);
  const maxPage = Math.max(1, ...s.pages.map((p) => p.vues));
  const unite = pas === 'jour' ? 'jour' : pas === 'semaine' ? 'semaine' : 'mois';

  return (
    <>
      <div className="grid grid-cols-1 min-[600px]:grid-cols-2 min-[1100px]:grid-cols-4 gap-4 mb-[22px]">
        <Kpi libelle="Visiteurs" valeur={nb(t.visiteurs)} couleur="bg-navy">
          <Evolution actuel={t.visiteurs} precedent={s.precedent.visiteurs} jours={s.jours} />
        </Kpi>
        <Kpi libelle="Visites" valeur={nb(t.visites)} couleur="bg-teal">
          {uneDecimale(t.visites ? t.vues / t.visites : 0)} pages par visite
        </Kpi>
        <Kpi libelle="Pages vues" valeur={nb(t.vues)} couleur="bg-okr">
          <Evolution actuel={t.vues} precedent={s.precedent.vues} jours={s.jours} />
        </Kpi>
        <Kpi libelle="Temps par visite" valeur={dureeLisible(t.visites ? t.dureeTotale / t.visites : 0)} couleur="bg-finance">
          {part(t.rebonds, t.visites)} % repartent après une seule page
        </Kpi>
      </div>

      <div className="grid grid-cols-1 min-[1100px]:grid-cols-[1.5fr_1fr] gap-4 mb-4 [&>section]:mb-0">
        <Carte titre={`Visites par ${unite}`}>
          <Barres
            resume={`Visites par ${unite} : ${barres.map((b) => `${b.libelle} ${b.visites}`).join(', ')}`}
            barres={barres.map((b) => ({
              cle: b.cle,
              libelle: b.libelle,
              valeur: b.visites,
              accent: b.courante,
              infobulle: `${b.detail} — ${pluriel(b.visites, 'visite')}, ${pluriel(b.vues, 'page vue', 'pages vues')}`,
            }))}
          />
        </Carte>

        <Carte titre="Qui vient">
          <div className="flex items-center gap-3 pb-4 mb-4 border-b border-line">
            <span className="relative flex h-2.5 w-2.5 shrink-0" aria-hidden>
              {t.actifs > 0 && <span className="absolute inline-flex h-full w-full rounded-full bg-teal opacity-60 animate-ping" />}
              <span className={`relative inline-flex h-2.5 w-2.5 rounded-full ${t.actifs > 0 ? 'bg-teal' : 'bg-line'}`} />
            </span>
            <span className="text-14.5 text-ink">
              <strong className="text-navy">{pluriel(t.actifs, 'visiteur')}</strong> sur le site ces 5 dernières minutes
            </span>
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-14 mb-1.5">
              <span className="font-semibold text-navy">
                {pluriel(t.nouveaux, 'nouveau', 'nouveaux')} <span className="font-normal text-muted">({part(t.nouveaux, t.visiteurs)} %)</span>
              </span>
              <span className="font-semibold text-navy">
                {pluriel(habitues, 'habitué')} <span className="font-normal text-muted">({part(habitues, t.visiteurs)} %)</span>
              </span>
            </div>
            <div className="flex h-2 gap-0.5 rounded-md overflow-hidden bg-surface">
              <div className="bg-teal" style={{ width: `${part(t.nouveaux, t.visiteurs)}%` }} />
              <div className="bg-navy-light flex-1" />
            </div>
            <p className="text-13 text-muted mt-1.5">
              {part(t.visitesConnectees, t.visites)} % des visites se font avec un compte connecté.
            </p>
          </div>

          {APPAREILS.map((a) => (
            <Repartition key={a.id} libelle={a.libelle} valeur={s.appareils[a.id]} total={t.visites} max={maxAppareil} />
          ))}
        </Carte>
      </div>

      <Carte titre="Pages les plus consultées">
        <div className="overflow-x-auto -mx-[27.5px] -mb-[27.5px]">
          <table className="w-full border-collapse text-14.5">
            <thead>
              <tr>
                <th className={TH}>Page</th>
                <th className={`${TH} text-right`}>Vues</th>
                <th className={`${TH} text-right`}>Visiteurs</th>
                <th className={`${TH} text-right`}>Temps moyen</th>
                <th className={`${TH} text-right`} title="Visites qui ont commencé par cette page">
                  Entrées
                </th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {pages.map((p) => {
                const nom = nomPage(p.chemin);
                return (
                  <tr key={p.chemin}>
                    <td className={`${TD} min-w-[220px]`}>
                      <div className="font-bold text-navy">{nom ?? p.chemin}</div>
                      {nom && <div className="text-13 text-muted">{p.chemin}</div>}
                      <div className="h-1 mt-1.5 bg-surface rounded-sm overflow-hidden max-w-[260px]">
                        <div className="h-full bg-navy-light rounded-sm" style={{ width: `${(p.vues / maxPage) * 100}%` }} />
                      </div>
                    </td>
                    <td className={`${TD} text-right font-bold text-navy`}>{nb(p.vues)}</td>
                    <td className={`${TD} text-right`}>{nb(p.visiteurs)}</td>
                    <td className={`${TD} text-right`}>{p.dureeMoyenne ? dureeLisible(p.dureeMoyenne) : '—'}</td>
                    <td className={`${TD} text-right`}>{nb(p.entrees)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {s.pages.length > PAGES_VISIBLES && (
            <div className="px-4 py-3 text-13.5 border-t border-line bg-[#fafbfd]">
              <button
                type="button"
                onClick={() => setToutesLesPages((v) => !v)}
                className="font-bold text-navy hover:text-teal-dark"
              >
                {toutesLesPages ? 'Afficher moins' : `Afficher les ${s.pages.length} pages`} →
              </button>
            </div>
          )}
        </div>
      </Carte>

      <div className="grid grid-cols-1 min-[1100px]:grid-cols-2 gap-4 [&>section]:mb-0">
        <Carte titre="D'où arrivent les visiteurs">
          {s.provenances.map((p) => (
            <Repartition
              key={p.provenance ?? '—'}
              libelle={p.provenance ?? 'Accès direct (adresse tapée, favori, email…)'}
              valeur={p.visites}
              total={t.visites}
              max={maxProvenance}
              accent={!p.provenance}
            />
          ))}
        </Carte>
        <Carte titre="Heures de visite">
          <Barres
            hauteur={110}
            resume={`Pages vues par heure : ${s.parHeure.map((v, h) => `${h} h ${v}`).join(', ')}`}
            libelleVisible={(h) => h % 6 === 0}
            barres={s.parHeure.map((v, h) => ({
              cle: String(h),
              libelle: `${h} h`,
              valeur: v,
              infobulle: `${h} h – ${h + 1} h : ${pluriel(v, 'page vue', 'pages vues')}`,
            }))}
          />
          <p className="text-13 text-muted mt-3">Heure de Paris, sur toute la période.</p>
        </Carte>
      </div>
    </>
  );
};

const StatistiquesAdmin: React.FC = () => {
  const { estAdmin } = useEstAdmin();
  const [periode, setPeriode] = useState('30');
  const [site, setSite] = useState(SITE_PRINCIPAL);
  const q = useStatistiquesAdmin(estAdmin, Number(periode), site === TOUS ? null : site);
  const s = q.data;

  const sites = useMemo(() => {
    const hotes = s?.hotes ?? [];
    const liste = hotes.some((h) => h.hote === SITE_PRINCIPAL) ? hotes : [{ hote: SITE_PRINCIPAL, vues: 0 }, ...hotes];
    return [
      ...liste.map((h) => ({ id: h.hote, libelle: h.hote, nombre: h.vues })),
      { id: TOUS, libelle: 'Tous les sites', nombre: hotes.reduce((n, h) => n + h.vues, 0) },
    ];
  }, [s?.hotes]);

  return (
    <AdminShell
      titre="Statistiques"
      sousTitre="La fréquentation d'Oskar : combien de visiteurs, ce qu'ils consultent, combien de temps ils restent et d'où ils viennent."
      actions={<Puces libelle="Période" options={PERIODES} valeur={periode} onChange={setPeriode} />}
    >
      <Bandeau ton="teal" icone={<ShieldCheck aria-hidden />}>
        Mesure anonyme, faite par Oskar lui-même : ni cookie tiers, ni adresse IP, aucun lien avec les comptes. Ne sont
        pas comptés les administrateurs, les pages d&rsquo;administration et les visiteurs qui refusent la mesure. Le
        temps passé ne court que lorsque l&rsquo;onglet est au premier plan.
      </Bandeau>

      {sites.length > 2 && (
        <div className="mb-4">
          <Puces libelle="Site" options={sites} valeur={site} onChange={setSite} />
        </div>
      )}

      {q.error ? (
        <Erreur message={(q.error as Error).message} />
      ) : !s ? (
        <Chargement />
      ) : (
        <div className={q.isFetching ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
          <Rapport s={s} />
        </div>
      )}
    </AdminShell>
  );
};

export default StatistiquesAdmin;
