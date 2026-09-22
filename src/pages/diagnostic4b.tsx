import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AlertCircle, AlertTriangle, ArrowRight, Check, Eye, FlaskConical, Pencil, RotateCcw, Sparkles, Target } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { ouvrirConnexion } from '@/store/useConnexion';
import { useAppStore } from '@/store/useAppStore';
import { COULEURS_PILIERS } from '@/constants/piliers';
import { PILLARS, fmt, stateLabel, stateColor, stateBorder, type PillarId, type StateKey } from '@/lib/diagnostic';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { analyser4, etatInitial4, type Options4, nbReponses4, niveau4, note4, pilierComplet4, piliersAttendus4, REPONSES4, libelleReponse4, type Reponse4, type Etat4, type Verification4 } from '@/lib/diagnostic4/calcul';

/*
 * Diagnostic 4b — la V4 d'Eric (même calcul, même restitution : lib/diagnostic4),
 * avec une saisie progressive pour alléger l'écran : un seul pilier ouvert à la
 * fois, ses pratiques qui apparaissent une à une, les piliers remplis repliés
 * en une ligne (rouvrables), ceux à venir réduits à leur nom.
 * Version d'essai : aucune réponse enregistrée, page non indexée.
 */
const Radar4 = dynamic(() => import('@/components/diagnostic4/Radar4'), { ssr: false });

const Pastille = ({ niveau, children }: { niveau: StateKey; children?: React.ReactNode }) => {
  const c = stateColor(niveau);
  const Icone = niveau === 'f' ? AlertCircle : niveau === 'c' ? AlertTriangle : Check;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: c.bg, color: c.c }}>
    <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden />{children ?? stateLabel(niveau)}
  </span>;
};

const PointAVerifier = ({ point }: { point: Verification4 }) => (
  <div className="text-sm leading-relaxed">
    <p className="text-ink">{point.verification}</p>
    <p className="text-muted mt-1">Votre réponse : {libelleReponse4(point.reponse)} · « {point.texte} »</p>
    <p className="text-ink mt-1"><strong>{point.reponse === 'inconnu' ? 'À clarifier : ' : 'Action à adapter : '}</strong>{point.action}</p>
  </div>
);

// V4b : « Je ne sais pas » compte comme une pratique non en place, sans effacer le score.
const OPTIONS: Options4 = { inconnuCommeNon: true };

export default function Diagnostic4bPage() {
  const [etat, setEtat] = useState<Etat4>(etatInitial4);
  const [revele, setRevele] = useState(false);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authReady = useAppStore((s) => s.authReady);
  const analyseRef = useRef<HTMLElement>(null);
  const analyse = useMemo(() => analyser4(etat, OPTIONS), [etat]);
  // Pilier rouvert pour modification ; sinon, le premier pilier pas encore rempli.
  const [ouvert, setOuvert] = useState<PillarId | null>(null);
  const estFait = (id: PillarId) => (etat.seul && id === 'team') || pilierComplet4(etat.piliers[id]);
  const courant = piliersAttendus4(etat).find((id) => !estFait(id)) ?? null;
  const actif = ouvert ?? courant;
  const carteActive = useRef<HTMLElement>(null);
  const derniereQuestion = useRef<HTMLFieldSetElement>(null);
  const premierRendu = useRef(true);
  const nbVisibles = actif ? nbReponses4(etat.piliers[actif]) + (etat.piliers[actif].perception === null ? 0 : 1) : 0;

  // Quand un pilier s'ouvre, on l'amène en haut de l'écran.
  useEffect(() => {
    if (premierRendu.current) { premierRendu.current = false; return; }
    carteActive.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [actif]);
  // Quand une pratique apparaît, on s'assure qu'elle est visible.
  useEffect(() => {
    if (nbVisibles > 0) derniereQuestion.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [nbVisibles]);
  const attendus = piliersAttendus4(etat).length;
  const valeursRadar = analyse.notes.flatMap((n) => n.perception === null ? [] : [{ id: n.id, perception: n.perception, pratiques: n.note }]);
  const radarComplet = valeursRadar.length === attendus;

  const noter = (id: PillarId, perception: number) => {
    setEtat((prev) => ({ ...prev, piliers: { ...prev.piliers, [id]: { ...prev.piliers[id], perception } } }));
  };
  const repondre = (id: PillarId, i: number, reponse: Reponse4) => {
    setEtat((prev) => {
      const reponses = [...prev.piliers[id].reponses] as Etat4['piliers'][PillarId]['reponses'];
      reponses[i] = reponse;
      return { ...prev, piliers: { ...prev.piliers, [id]: { ...prev.piliers[id], reponses } } };
    });
  };
  const reveler = () => {
    if (!analyse.complet) return;
    setRevele(true);
    requestAnimationFrame(() => analyseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };
  const recommencer = () => {
    setEtat(etatInitial4());
    setOuvert(null);
    setRevele(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <AppShell title="Diagnostic (essai 4b)" topbarTitle="Bienvenue sur OSKAR" topbarSubtitle="Votre vision. Vos objectifs. Vos actions."
      topbarActions={!authReady ? null : isAuthenticated ? <UserMenu /> : (
        <button onClick={() => ouvrirConnexion('login')} className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light">Connexion</button>
      )}>
      <Head><meta name="robots" content="noindex, nofollow" /></Head>
      <div className="flex items-start gap-3 mb-6 rounded-lg border border-dashed border-navy/30 bg-white px-4 py-3 text-[13px] text-muted">
        <FlaskConical className="h-4 w-4 mt-0.5 shrink-0 text-navy" aria-hidden />
        <p><strong className="text-navy">Version d’essai 4b</strong> — la <Link href="/diagnostic4" className="font-semibold text-navy underline">version 4</Link>, affichée pilier par pilier. À comparer aussi avec le{' '}
          <Link href="/diagnostic" className="font-semibold text-navy underline">Diagnostic actuel</Link>, la{' '}
          <Link href="/diagnostic2" className="font-semibold text-navy underline">version 2</Link> et la{' '}
          <Link href="/diagnostic3" className="font-semibold text-navy underline">version 3</Link>. Rien n’est enregistré.</p>
      </div>

      <header className="mb-8 max-w-3xl">
        <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">Diagnostic Oskar · 5 piliers</div>
        <h1 className="text-[28px] leading-tight font-extrabold text-navy">Où en est votre entreprise selon vous&nbsp;?</h1>
        <p className="text-[15px] text-muted mt-2 leading-relaxed">Un pilier à la fois : votre perception d’abord, puis quatre pratiques.
          Votre perception ne modifie pas le score de pratiques ; leur écart ouvre une discussion.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div className="min-w-0">
          {PILLARS.map((pilier, index) => {
            const saisie = etat.piliers[pilier.id];
            const couleur = COULEURS_PILIERS[pilier.id];
            const contenu = PILIERS4[pilier.id];
            const note = note4(saisie, OPTIONS);
            const ecarte = etat.seul && pilier.id === 'team';
            const entete = <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: couleur.dark }}>{index + 1}/5 · {pilier.module}</div>;

            // Pilier à venir : une ligne discrète, pour garder le fil sans charger l'écran.
            if (pilier.id !== actif && !estFait(pilier.id)) {
              return (
                <div key={pilier.id} className="flex items-center gap-3 rounded-card border border-dashed border-line bg-white/60 px-5 py-3 mb-3 text-sm text-muted">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleur.DEFAULT, opacity: 0.35 }} aria-hidden />
                  <span className="font-semibold">{pilier.module}</span><span className="ml-auto text-xs">À venir</span>
                </div>
              );
            }

            // Pilier rempli : replié en une ligne, rouvrable.
            if (pilier.id !== actif) {
              return (
                <div key={pilier.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-line bg-white shadow-card px-5 py-3.5 mb-3" style={{ borderLeft: `4px solid ${couleur.DEFAULT}` }}>
                  <div className="min-w-0">
                    {entete}
                    <div className="text-sm text-muted mt-0.5">
                      {ecarte ? 'Passé : je travaille seul' : `Perception ${saisie.perception}/10 · ${saisie.reponses.filter((r) => r === 'oui').length} oui sur 4`}
                    </div>
                  </div>
                  <div className="ml-auto flex items-center gap-3">
                    {!ecarte && (note !== null
                      ? <><span className="text-lg font-extrabold text-navy">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></span><Pastille niveau={niveau4(note)} /></>
                      : <span className="text-xs text-muted">Non applicable</span>)}
                    <button type="button" onClick={() => setOuvert(pilier.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-navy hover:underline">
                      <Pencil className="h-3.5 w-3.5" aria-hidden />Modifier<span className="sr-only"> {pilier.label}</span>
                    </button>
                  </div>
                </div>
              );
            }

            // Pilier en cours : la perception, puis les pratiques une à une.
            const premiereVide = saisie.reponses.findIndex((r) => r === null);
            const visibles = ouvert === pilier.id ? 4 : saisie.perception === null ? 0 : premiereVide === -1 ? 4 : premiereVide + 1;
            return (
              <article key={pilier.id} ref={carteActive} className="bg-white rounded-card border border-line shadow-card p-5 mb-4 scroll-mt-24 animate-fade-in" style={{ borderTop: `3px solid ${couleur.DEFAULT}` }}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    {entete}
                    <h2 className="text-lg font-bold text-navy leading-snug mt-0.5">{contenu.question}</h2>
                  </div>
                  {note !== null && !ecarte && (
                    <div className="sm:text-right shrink-0">
                      <div className="text-2xl font-extrabold text-navy leading-none">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></div>
                      <div className="mt-1.5"><Pastille niveau={niveau4(note)} /></div>
                    </div>
                  )}
                </div>
                {pilier.id === 'team' && (
                  <label className="flex items-center gap-2.5 mb-4 text-sm text-muted cursor-pointer">
                    <input type="checkbox" checked={etat.seul} onChange={(e) => { const seul = e.target.checked; setEtat((prev) => ({ ...prev, seul })); if (seul) setOuvert(null); }}
                      className="h-4 w-4 rounded border-line" style={{ accentColor: couleur.DEFAULT }} />
                    Je travaille seul : passer ce pilier
                  </label>
                )}
                {!ecarte && <>
                  <div className="mb-5 rounded-lg bg-surface px-4 py-3">
                    <div className="flex items-center justify-between mb-2">
                      <label htmlFor={`perception-${pilier.id}`} className="text-sm font-semibold text-ink">Votre perception · {pilier.label}</label>
                      <span className="text-sm font-bold text-navy">{saisie.perception === null ? '—' : `${saisie.perception}/10`}</span>
                    </div>
                    <input
                      id={`perception-${pilier.id}`}
                      type="range"
                      min={0}
                      max={10}
                      step={1}
                      value={saisie.perception ?? 5}
                      onChange={(e) => noter(pilier.id, parseInt(e.target.value, 10))}
                      // Un simple clic sur la valeur du milieu doit aussi compter comme une réponse.
                      onPointerUp={(e) => noter(pilier.id, parseInt(e.currentTarget.value, 10))}
                      onKeyUp={(e) => noter(pilier.id, parseInt(e.currentTarget.value, 10))}
                      className="w-full h-1.5 cursor-pointer"
                      style={{ accentColor: couleur.DEFAULT, opacity: saisie.perception === null ? 0.45 : 1 }}
                      aria-valuetext={saisie.perception === null ? 'Non renseignée' : `${saisie.perception} sur 10`}
                    />
                    <div className="flex justify-between gap-4 mt-1.5 text-[11px] leading-snug text-muted">
                      <span><strong className="font-semibold">0</strong> · nous sommes nettement en retrait sur ce sujet</span>
                      <span className="text-right"><strong className="font-semibold">10</strong> · nous le maîtrisons pleinement</span>
                    </div>
                    {saisie.perception === null && <p className="text-[11.5px] text-muted mt-1">Faites glisser le curseur pour donner votre appréciation.</p>}
                  </div>
                  {visibles > 0 && (
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-semibold text-ink">Vos pratiques</span>
                      <span className="text-xs font-bold text-muted">{nbReponses4(saisie)}/4</span>
                    </div>
                  )}
                  <div className="space-y-3">
                    {contenu.criteres.slice(0, visibles).map((critere, i) => (
                      <fieldset key={i} ref={i === visibles - 1 ? derniereQuestion : undefined} className="rounded-lg border border-line p-3 min-w-0 animate-fade-in">
                        <legend className="px-1 text-[13.5px] font-medium text-ink">{critere.texte}</legend>
                        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-5 gap-2">
                          {REPONSES4.map((option) => {
                            const choisie = saisie.reponses[i] === option.valeur;
                            return <label key={option.valeur}
                              className="flex items-center gap-2 rounded-md border px-2 py-2 text-xs cursor-pointer focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-2"
                              style={choisie ? { borderColor: couleur.DEFAULT, background: couleur.light } : undefined}>
                              <input type="radio" name={`pratique-${pilier.id}-${i}`} value={option.valeur} checked={choisie}
                                onChange={() => repondre(pilier.id, i, option.valeur)} className="shrink-0" style={{ accentColor: couleur.DEFAULT }} />
                              {option.libelle}
                            </label>;
                          })}
                        </div>
                      </fieldset>
                    ))}
                  </div>
                  {nbReponses4(saisie) === 4 && note === null && <p className="text-xs text-muted mt-2">Aucun score : toutes les pratiques sont déclarées non applicables.</p>}
                  {saisie.reponses.includes('inconnu') && <p className="text-xs text-muted mt-2">« Je ne sais pas » compte comme une pratique non en place, à clarifier.</p>}
                  {ouvert === pilier.id && (
                    <button type="button" onClick={() => setOuvert(null)} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light">
                      <Check className="h-4 w-4" aria-hidden />Valider ce pilier
                    </button>
                  )}
                </>}
              </article>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className="bg-navy-dark rounded-card p-6 text-white" aria-label="Score global de pratiques">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">Score global de pratiques</div>
            {analyse.moyenne !== null && analyse.niveauGlobal ? <>
              <div className="text-5xl font-extrabold leading-none tracking-tight">{fmt(analyse.moyenne)}<span className="text-lg font-normal text-white/60"> /10</span></div>
              <div className="mt-3"><Pastille niveau={analyse.niveauGlobal} /></div>
            </> : <p className="text-sm text-white/70 mt-1">{analyse.complet
              ? 'Score global indisponible : un ou plusieurs piliers restent à clarifier ou ne comportent aucune pratique applicable.'
              : 'Répondez à chaque pratique et donnez votre perception pour accéder à la restitution.'}</p>}
            <div className="flex justify-between text-xs text-white/70 mt-4 mb-1.5"><span>Réponses renseignées</span><span>{analyse.nbReponses}/{analyse.nbAttendu}</span></div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-teal transition-all" style={{ width: `${analyse.nbReponses / analyse.nbAttendu * 100}%` }} /></div>
          </section>
          <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Radar perception et pratiques déclarées">
            <div className="text-sm font-bold text-navy mb-2">Perception et pratiques déclarées</div>
            <div className="flex flex-wrap gap-3 text-xs text-muted mb-2">
              <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[#9098c5]" aria-hidden /> Perception</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal/30 border border-navy" aria-hidden /> Pratiques déclarées</span>
            </div>
            {radarComplet ? <div className="w-full h-56"><Radar4 valeurs={valeursRadar} /></div>
              : <p className="text-sm text-muted py-4">Le radar apparaît lorsque chaque pilier retenu dispose d’une perception et d’un score de pratiques. Les valeurs inconnues ne sont pas représentées comme des zéros.</p>}
          </section>
          <button type="button" disabled={!analyse.complet} onClick={reveler}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-teal text-navy-dark text-sm font-extrabold rounded-lg shadow-sm hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed">
            <Sparkles className="h-4 w-4" aria-hidden />{analyse.complet ? 'Révéler mon analyse' : `Encore ${analyse.nbAttendu - analyse.nbReponses} réponse${analyse.nbAttendu - analyse.nbReponses > 1 ? 's' : ''} à renseigner`}
          </button>
          <button type="button" onClick={recommencer} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border border-line rounded-lg hover:border-navy">
            <RotateCcw className="h-4 w-4" aria-hidden />Recommencer
          </button>
        </div>
      </div>

      {revele && analyse.complet && (
        <section ref={analyseRef} className="mt-8 scroll-mt-24 space-y-5 animate-fade-in" aria-label="Votre analyse">
          <p className="text-sm text-muted leading-relaxed">Cette lecture porte sur des pratiques déclarées, pas sur des preuves vérifiées.
            La perception est présentée séparément et ne compte jamais dans le score. Les réponses « Je ne sais pas » appellent une clarification ; les réponses « Non applicable » sont hors calcul.</p>
          {analyse.profil && analyse.moyenne !== null && analyse.niveauGlobal ? (
            <div className="rounded-card bg-gradient-to-br from-navy-dark to-navy p-6 sm:p-8 text-white flex flex-wrap justify-between gap-6">
              <div className="max-w-2xl">
                <div className="text-[11px] font-bold uppercase tracking-widest text-teal mb-2">Lecture indicative des pratiques</div>
                <div className="text-3xl font-extrabold">{analyse.profil.nom}</div>
                <p className="text-[15px] text-white/80 leading-relaxed mt-3">{analyse.profil.texte}</p>
              </div>
              <div className="text-right"><div className="text-4xl font-extrabold">{fmt(analyse.moyenne)}<span className="text-lg font-normal text-white/60"> /10</span></div><Pastille niveau={analyse.niveauGlobal} /></div>
            </div>
          ) : (
            <div className="rounded-card border border-line bg-white p-6">
              <h2 className="text-lg font-bold text-navy">Restitution disponible sans score global</h2>
              <p className="mt-2 text-sm text-muted">Certaines réponses ne permettent pas de noter tous les piliers. Retrouvez ci-dessous vos déclarations, les points à clarifier et les éléments à examiner. Aucun profil global ni classement prioritaire n’est attribué.</p>
            </div>
          )}
          {analyse.priorite && (
            <div className="rounded-card bg-white border border-line shadow-card p-6 border-l-4" style={{ borderLeftColor: stateBorder(analyse.priorite.niveau) }}>
              <div className="flex flex-wrap items-center gap-2.5 mb-3"><Target className="h-4 w-4 text-navy" aria-hidden /><span className="text-xs font-bold text-muted">Priorité proposée, à confirmer</span>
                <Pastille niveau={analyse.priorite.niveau}>{analyse.priorite.label} · {fmt(analyse.priorite.note)}/10</Pastille></div>
              <p className="text-xl font-extrabold text-navy">{analyse.priorite.titre}</p><p className="text-sm text-ink mt-2">{analyse.priorite.texte}</p>
              <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-ink">{analyse.priorite.justification}</p>
              <p className="mt-3 text-sm text-muted">Les réponses qui fondent cette piste sont détaillées dans « Pilier par pilier ».</p>
            </div>
          )}
          <div className="grid gap-5 lg:grid-cols-2">
            <div className="rounded-card bg-white border border-line shadow-card p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-navy mb-3"><Eye className="h-4 w-4" aria-hidden />Votre perception face aux pratiques déclarées</h2>
              {analyse.ecarts.length === 0 ? <p className="text-sm text-ink leading-relaxed">{analyse.notes.length === 0
                ? 'Aucun écart ne peut être calculé : les pratiques restent à clarifier ou sont non applicables.'
                : 'Sur les piliers disposant d’un score, aucun écart n’atteint 3 points. Cette proximité ne valide pas les pratiques déclarées.'}</p>
                : <ul className="space-y-3">{analyse.ecarts.map((e) => <li key={e.id} className="text-sm text-ink leading-relaxed">
                  <strong className="text-navy">Écart à explorer · {e.label}</strong><br />Votre perception : {e.perception}/10 ; votre score de pratiques déclarées : {fmt(e.pratiques)}/10.{' '}
                  <span className="text-muted">{e.sens === 'superieure' ? 'Qu’est-ce qui explique cette perception plus favorable ? Examinez les éléments sur lesquels vous vous appuyez.' : 'Quelles difficultés expliquent cette perception plus réservée malgré les pratiques déclarées ?'}</span>
                </li>)}</ul>}
              {analyse.notes.length < attendus && <p className="mt-3 text-xs text-muted">La comparaison exclut les piliers sans score. Leurs perceptions restent visibles ci-dessous.</p>}
            </div>
            <div className="rounded-card bg-white border border-line shadow-card p-6">
              <h2 className="flex items-center gap-2 text-sm font-bold text-navy mb-3"><Check className="h-4 w-4" aria-hidden />Pistes d’action pour les 30 prochains jours</h2>
              {analyse.leviers.length === 0 ? <p className="text-sm text-ink leading-relaxed">Aucune action corrective déduite de vos réponses « Oui » ou « Non applicable ». Examinez les exemples associés aux pratiques applicables et confirmez la pertinence des exclusions.</p>
                : <ol className="space-y-4">{analyse.leviers.map((l) => <li key={`${l.id}-${l.index}`}><strong className="text-sm text-navy">{l.label} · À approfondir</strong><PointAVerifier point={l} /></li>)}</ol>}
            </div>
          </div>
          <div className="rounded-card bg-white border border-line shadow-card p-6">
            <h2 className="text-sm font-bold text-navy mb-4">Pilier par pilier</h2>
            <ul className="divide-y divide-line">{analyse.verdicts.map((v) => <li key={v.id} className="py-5 first:pt-0 last:pb-0">
              <div className="flex flex-wrap justify-between gap-3 border-l-4 pl-3" style={{ borderColor: COULEURS_PILIERS[v.id].DEFAULT }}>
                <div><h3 className="text-base font-bold text-navy">{v.label}</h3><p className="text-sm text-ink mt-1">{v.titre}</p></div>
                <div className="text-sm sm:text-right"><p className="text-muted">Perception : {v.perception}/10</p><p className="font-bold" style={{ color: v.niveau ? stateColor(v.niveau).c : undefined }}>Pratiques : {v.note === null ? 'non évaluées' : `${fmt(v.note)}/10`}</p></div>
              </div>
              <p className="mt-2 text-sm text-muted">{v.texte}</p>
              <div className="mt-3 text-sm"><strong className="text-navy">Vos réponses déclarées</strong>
                <ul className="mt-1 list-disc pl-5 space-y-1 text-ink">{v.constats.map((c) => <li key={c.index}><strong>{libelleReponse4(c.reponse)} · </strong>{c.texte}</li>)}</ul>
              </div>
              <details className="mt-3 text-sm">
                <summary className="font-semibold text-navy cursor-pointer">Preuves à examiner · non vérifiées</summary>
                <p className="mt-2 text-muted">Exemples suggérés pour approfondir les pratiques applicables. Leur présence et leur qualité restent à vérifier avec vous.</p>
                <ul className="mt-2 space-y-2 text-ink">{v.constats.filter((c) => c.reponse !== 'na').map((c) => <li key={c.index}><strong>{c.texte}</strong><br />{c.preuveAExaminer}</li>)}</ul>
                {v.nbApplicables === 0 && <p className="mt-2 text-muted">Aucune pratique applicable déclarée. Confirmez ces exclusions avec votre coach.</p>}
              </details>
              {v.aVerifier.length > 0 && <div className="mt-3"><strong className="text-sm text-navy">Points à vérifier et actions proposées</strong><ul className="mt-2 space-y-3">{v.aVerifier.map((c) => <li key={c.index}><PointAVerifier point={c} /></li>)}</ul></div>}
            </li>)}</ul>
          </div>
          <div className="rounded-card bg-navy-dark p-6 sm:p-8 text-white">
            <div className="text-xs font-bold uppercase tracking-widest text-teal mb-2">Et maintenant&nbsp;?</div>
            <p className="text-2xl font-extrabold">{analyse.priorite ? `Approfondissez la piste ${analyse.priorite.label}.` : 'Approfondissez vos pratiques et leurs résultats.'}</p>
            <p className="text-[15px] text-white/75 mt-2 max-w-2xl">{analyse.priorite ? analyse.priorite.atelier.promesse : 'Choisissez un point à explorer dans la restitution, puis définissez une action adaptée à votre contexte.'}</p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link href={analyse.priorite ? analyse.priorite.atelier.href : '/app/okr'} className="inline-flex items-center gap-2 px-5 py-3 bg-teal text-navy-dark text-sm font-extrabold rounded-lg hover:bg-teal-dark">
                {analyse.priorite ? analyse.priorite.atelier.libelle : 'Construire mes OKR'}<ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {authReady && !isAuthenticated && <button type="button" onClick={() => ouvrirConnexion('register')} className="px-5 py-3 border border-white/25 text-white text-sm font-bold rounded-lg hover:border-white/60">Créer mon compte gratuit</button>}
            </div>
            <p className="text-xs text-white/60 mt-4">Refaites ce diagnostic dans trois mois pour comparer vos réponses, en tenant compte des pratiques applicables.</p>
          </div>
        </section>
      )}
      {/* Explications, en fin de page : la saisie reste au premier plan. */}
      <section className="mt-8 rounded-lg bg-surface p-4 text-sm text-muted space-y-2 max-w-3xl" aria-label="Comprendre le diagnostic">
        <p><strong className="text-navy">Perception :</strong> votre appréciation spontanée, de 0 à 10.</p>
        <p><strong className="text-navy">Pratiques déclarées :</strong> vos réponses, sans vérification externe.</p>
        <p><strong className="text-navy">Preuves :</strong> des documents ou exemples à examiner avec votre coach. Aucune preuve n’est collectée ni validée par ce questionnaire.</p>
        <details>
          <summary className="cursor-pointer font-semibold text-navy">Comment est calculé le score ?</summary>
          <p className="mt-2">Non = 0, En partie = 0,5, Oui = 1. La moyenne des pratiques applicables est ramenée sur 10.
            « Non applicable » est exclu. « Je ne sais pas » compte comme une pratique non en place (0), signalée comme à clarifier.
            Sans réponse, le questionnaire reste incomplet. « En partie » indique une pratique mise en œuvre partiellement ou irrégulièrement.</p>
          <p className="mt-2">Le score global est la moyenne des piliers, uniquement si chacun peut être noté.
            Les niveaux sont : Fragile en dessous de 4, En construction de 4 à moins de 7, Solide à partir de 7.
            Par convention, un pilier Fragile empêche le niveau global Solide. Ces repères ne constituent pas une validation de la performance.</p>
        </details>
      </section>
    </AppShell>
  );
}
