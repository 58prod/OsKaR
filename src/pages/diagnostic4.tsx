import React, { useCallback, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AlertCircle, AlertTriangle, ArrowRight, Check, Eye, FlaskConical, RotateCcw, Sparkles, Target } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { ouvrirConnexion } from '@/store/useConnexion';
import { useAppStore } from '@/store/useAppStore';
import { COULEURS_PILIERS } from '@/constants/piliers';
import { PILLARS, fmt, stateLabel, stateColor, stateBorder, type PillarId, type StateKey } from '@/lib/diagnostic';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { analyser4, etatInitial4, nbPreuves, niveau4, note4, piliersAttendus4, type Etat4 } from '@/lib/diagnostic4/calcul';

/*
 * Diagnostic 4 — version d'essai rapide, à comparer avec /diagnostic et
 * /diagnostic2. Même format que le Diagnostic en ligne (ressenti + cases),
 * critères vérifiables, nouveau calcul (lib/diagnostic4/calcul.ts) et
 * analyse réécrite. Hors menu, non indexée, rien n'est enregistré.
 */

const Radar4 = dynamic(() => import('@/components/diagnostic4/Radar4'), { ssr: false });

const IconeNiveau: React.FC<{ niveau: StateKey }> = ({ niveau }) => {
  if (niveau === 'f') return <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (niveau === 'c') return <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  return <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />;
};

const Pastille: React.FC<{ niveau: StateKey; children?: React.ReactNode }> = ({ niveau, children }) => {
  const c = stateColor(niveau);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: c.bg, color: c.c }}>
      <IconeNiveau niveau={niveau} /> {children ?? stateLabel(niveau)}
    </span>
  );
};

const Diagnostic4Page: React.FC = () => {
  const [etat, setEtat] = useState<Etat4>(etatInitial4);
  const [revele, setRevele] = useState(false);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authReady = useAppStore((s) => s.authReady);
  const analyseRef = useRef<HTMLElement>(null);

  const analyse = useMemo(() => analyser4(etat), [etat]);
  const attendus = piliersAttendus4(etat).length;

  const noter = useCallback((id: PillarId, ressenti: number) => {
    setEtat((prev) => ({ ...prev, piliers: { ...prev.piliers, [id]: { ...prev.piliers[id], ressenti } } }));
  }, []);

  const cocher = useCallback((id: PillarId, i: number) => {
    setEtat((prev) => {
      const preuves = [...prev.piliers[id].preuves] as Etat4['piliers'][PillarId]['preuves'];
      preuves[i] = !preuves[i];
      return { ...prev, piliers: { ...prev.piliers, [id]: { ...prev.piliers[id], preuves } } };
    });
  }, []);

  const valeursRadar = useMemo(() => {
    const v: Partial<Record<PillarId, { ressenti: number; preuves: number }>> = {};
    analyse.notes.forEach((n) => { v[n.id] = { ressenti: n.ressenti, preuves: n.preuves }; });
    return v;
  }, [analyse.notes]);

  const reveler = () => {
    setRevele(true);
    requestAnimationFrame(() => analyseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  };

  const recommencer = () => {
    setEtat(etatInitial4());
    setRevele(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const montrerAnalyse = revele && analyse.complet;

  return (
    <AppShell
      title="Diagnostic (essai 4)"
      topbarTitle="Bienvenue sur OSKAR"
      topbarSubtitle="Votre vision. Vos objectifs. Vos actions."
      topbarActions={
        !authReady ? null : isAuthenticated ? (
          <UserMenu />
        ) : (
          <button onClick={() => ouvrirConnexion('login')} className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light transition-colors">
            Connexion
          </button>
        )
      }
    >
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>

      <div className="flex items-start gap-3 mb-6 rounded-lg border border-dashed border-navy/30 bg-white px-4 py-3 text-[13px] text-muted">
        <FlaskConical className="h-4 w-4 mt-0.5 shrink-0 text-navy" aria-hidden />
        <p>
          <strong className="text-navy">Version d’essai 4</strong> — format rapide à cases. À comparer avec le{' '}
          <Link href="/diagnostic" className="font-semibold text-navy underline">Diagnostic actuel</Link> et la{' '}
          <Link href="/diagnostic2" className="font-semibold text-navy underline">version 2</Link>, ainsi que la <Link href="/diagnostic3" className="font-semibold text-navy underline">version 3</Link>. Rien n’est enregistré.
        </p>
      </div>

      <header className="mb-8 max-w-3xl">
        <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">Diagnostic Oskar · 3 minutes</div>
        <h1 className="text-[28px] leading-tight font-extrabold text-navy">Où en est vraiment votre entreprise&nbsp;?</h1>
        <p className="text-[15px] text-muted mt-2 leading-relaxed">
          Cinq piliers. Pour chacun, donnez d’abord votre note spontanée, puis cochez ce qui est déjà vrai.
          L’écart entre les deux est souvent le plus instructif.
        </p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div>
          {PILLARS.map((pilier, index) => {
            const saisie = etat.piliers[pilier.id];
            const couleur = COULEURS_PILIERS[pilier.id];
            const contenu = PILIERS4[pilier.id];
            const note = note4(saisie);
            const ecarte = etat.seul && pilier.id === 'team';
            return (
              <article key={pilier.id} className="bg-white rounded-card border border-line shadow-card p-5 mb-4" style={{ borderTop: `3px solid ${couleur.DEFAULT}` }}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: couleur.dark }}>
                      {index + 1}/5 · {pilier.module}
                    </div>
                    <h2 className="text-lg font-bold text-navy leading-snug mt-0.5">{contenu.question}</h2>
                  </div>
                  {note !== null && !ecarte && (
                    <div className="flex items-center gap-3 sm:block sm:text-right shrink-0">
                      <div className="text-2xl font-extrabold text-navy leading-none">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></div>
                      <div className="sm:mt-1.5"><Pastille niveau={niveau4(note)} /></div>
                    </div>
                  )}
                </div>

                {pilier.id === 'team' && (
                  <label className="flex items-center gap-2.5 mb-4 text-sm text-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={etat.seul}
                      onChange={(e) => setEtat((prev) => ({ ...prev, seul: e.target.checked }))}
                      className="h-4 w-4 rounded border-line"
                      style={{ accentColor: couleur.DEFAULT }}
                    />
                    Je travaille seul : passer ce pilier
                  </label>
                )}

                {!ecarte && (
                  <>
                    <div className="mb-4">
                      <div className="text-sm font-semibold text-ink mb-2">Votre note spontanée</div>
                      <div className="grid grid-cols-11 gap-1" role="radiogroup" aria-label={`Note spontanée, pilier ${pilier.label}`}>
                        {Array.from({ length: 11 }, (_, v) => {
                          const choisie = saisie.ressenti === v;
                          return (
                            <button
                              key={v}
                              type="button"
                              role="radio"
                              aria-checked={choisie}
                              onClick={() => noter(pilier.id, v)}
                              className={`h-9 rounded-md text-sm font-bold border-[1.5px] transition-colors ${choisie ? 'text-white' : 'bg-white text-navy border-line hover:border-navy/40'}`}
                              style={choisie ? { background: couleur.DEFAULT, borderColor: couleur.DEFAULT } : undefined}
                            >
                              {v}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-ink">Cochez ce qui est déjà vrai</span>
                        <span className="text-xs font-bold text-muted">{nbPreuves(saisie)}/4</span>
                      </div>
                      <ul className="space-y-1.5">
                        {contenu.criteres.map((critere, i) => {
                          const coche = saisie.preuves[i];
                          return (
                            <li key={i}>
                              <label
                                className={`flex items-start gap-2.5 rounded-lg border-[1.5px] px-3 py-2.5 text-[13.5px] leading-snug cursor-pointer transition-colors ${coche ? 'text-navy' : 'border-transparent text-ink hover:bg-surface'}`}
                                style={coche ? { borderColor: couleur.DEFAULT, background: couleur.light } : undefined}
                              >
                                <input
                                  type="checkbox"
                                  checked={coche}
                                  onChange={() => cocher(pilier.id, i)}
                                  className="mt-0.5 h-4 w-4 shrink-0 rounded border-line"
                                  style={{ accentColor: couleur.DEFAULT }}
                                />
                                {critere.texte}
                              </label>
                            </li>
                          );
                        })}
                      </ul>
                      {saisie.ressenti === null && nbPreuves(saisie) > 0 && (
                        <p className="text-xs text-muted mt-2">Donnez votre note spontanée pour compléter ce pilier.</p>
                      )}
                    </div>
                  </>
                )}
              </article>
            );
          })}
        </div>

        {/* Synthèse */}
        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className="bg-navy-dark rounded-card p-6 text-white" aria-label="Score global">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/40 mb-2">Score global</div>
            {analyse.complet && analyse.moyenne !== null && analyse.niveauGlobal ? (
              <>
                <div className="text-5xl font-extrabold leading-none tracking-tight">
                  {fmt(analyse.moyenne)}<span className="text-lg font-normal text-white/35"> /10</span>
                </div>
                <div className="mt-3"><Pastille niveau={analyse.niveauGlobal} /></div>
              </>
            ) : (
              <div className="text-sm font-light text-white/55 mt-1">Il apparaît quand les {attendus} piliers ont leur note.</div>
            )}
            <div className="flex items-center justify-between text-[11.5px] text-white/50 mt-4 mb-1.5">
              <span>Piliers évalués</span><span>{analyse.notes.length}/{attendus}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${(analyse.notes.length / attendus) * 100}%` }} />
            </div>
          </section>

          <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Radar ressenti et pratiques déclarées">
            <div className="text-sm font-bold text-navy mb-1">Ressenti et pratiques déclarées</div>
            <div className="flex items-center gap-4 text-[11.5px] text-muted mb-2">
              <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[#9098c5]" aria-hidden /> Votre ressenti</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal/30 border border-navy" aria-hidden /> Pratiques déclarées</span>
            </div>
            <div className="w-full h-56"><Radar4 valeurs={valeursRadar} /></div>
          </section>

          <button
            type="button"
            disabled={!analyse.complet}
            onClick={reveler}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-teal text-navy-dark text-sm font-extrabold rounded-lg shadow-sm transition-all hover:bg-teal-dark hover:-translate-y-0.5 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            {analyse.complet ? 'Révéler mon analyse' : `Encore ${attendus - analyse.notes.length} pilier${attendus - analyse.notes.length > 1 ? 's' : ''} à noter`}
          </button>
          <button
            type="button"
            onClick={recommencer}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg hover:border-navy transition-all"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Recommencer
          </button>
        </div>
      </div>

      {montrerAnalyse && analyse.profil && analyse.moyenne !== null && analyse.niveauGlobal && (
        <section ref={analyseRef} className="mt-8 scroll-mt-24 space-y-5 animate-fade-in" aria-label="Votre analyse">
          <p className="text-sm text-muted leading-relaxed">
            Cette lecture repose sur vos déclarations. Une case non cochée reste un point à vérifier :
            elle ne permet pas de conclure que la pratique est absente. Les scores combinent les cases cochées
            (8 points) et le ressenti (2 points) ; ils ne mesurent pas les résultats de votre entreprise.
          </p>
          {/* Profil */}
          <div className="rounded-card bg-gradient-to-br from-navy-dark to-navy p-6 sm:p-8 text-white">
            <div className="flex flex-wrap items-start justify-between gap-6">
              <div className="max-w-2xl">
                <div className="text-[11px] font-bold uppercase tracking-widest text-teal mb-2">Votre profil</div>
                <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">{analyse.profil.nom}</div>
                <p className="text-[15px] text-white/80 leading-relaxed mt-3">{analyse.profil.texte}</p>
              </div>
              <div className="text-right">
                <div className="text-5xl font-extrabold leading-none">{fmt(analyse.moyenne)}<span className="text-lg font-normal text-white/40"> /10</span></div>
                <div className="mt-2.5"><Pastille niveau={analyse.niveauGlobal} /></div>
              </div>
            </div>
          </div>

          {/* Priorité */}
          {analyse.priorite && (
            <div className="rounded-card bg-white border border-line shadow-card p-6 border-l-4" style={{ borderLeftColor: stateBorder(analyse.priorite.niveau) }}>
              <div className="flex flex-wrap items-center gap-2.5 mb-3">
                <Target className="h-4 w-4 text-navy" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Priorité proposée, à confirmer</span>
                <Pastille niveau={analyse.priorite.niveau}>{analyse.priorite.label} · {fmt(analyse.priorite.note)}/10</Pastille>
              </div>
              <p className="text-xl font-extrabold text-navy leading-snug">{analyse.priorite.titre}</p>
              <p className="text-[15px] text-ink leading-relaxed mt-1.5">{analyse.priorite.texte}</p>
              <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-ink leading-relaxed">{analyse.priorite.justification}</p>
              <p className="mt-3 text-sm text-muted">Les réponses qui fondent cette piste sont détaillées dans « Pilier par pilier ».</p>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Lucidité */}
            <div className="rounded-card bg-white border border-line shadow-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Eye className="h-4 w-4 text-navy" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Votre ressenti face aux pratiques déclarées</span>
              </div>
              {analyse.lucidite.length === 0 ? (
                <p className="text-[15px] text-ink leading-relaxed">
                  Sur chaque pilier évalué, l’écart entre votre ressenti et les cases cochées ramenées sur 10
                  est inférieur à 3 points. Cette proximité ne valide pas à elle seule les pratiques déclarées.
                </p>
              ) : (
                <ul className="space-y-3">
                  {analyse.lucidite.map((l) => (
                    <li key={l.id} className="text-sm text-ink leading-relaxed">
                      <strong className="text-navy">Écart à explorer · {l.label}</strong>
                      <br />
                      Vous vous donnez {l.ressenti}/10 ; vos cases cochées représentent {fmt(l.preuves)}/10.{' '}
                      <span className="text-muted">
                        {l.sens === 'angle-mort'
                          ? 'Qu’est-ce qui explique cette perception plus favorable ? Précisez les cases restées vides et les éléments sur lesquels vous vous appuyez.'
                          : 'Quelles difficultés expliquent cette perception plus réservée malgré les pratiques cochées ?'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Actions */}
            <div className="rounded-card bg-white border border-line shadow-card p-6">
              <div className="flex items-center gap-2 mb-3">
                <Check className="h-4 w-4 text-navy" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Pistes d’action pour les 30 prochains jours</span>
              </div>
              {analyse.leviers.length === 0 ? (
                <p className="text-[15px] text-ink leading-relaxed">Toutes les pratiques des piliers évalués sont cochées. Appuyez chacune sur un exemple récent et vérifiez les résultats obtenus avant de choisir une prochaine action.</p>
              ) : (
                <ol className="space-y-3">
                  {analyse.leviers.map((l, i) => (
                    <li key={i} className="flex gap-3">
                      <span className="w-6 h-6 shrink-0 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: COULEURS_PILIERS[l.id].DEFAULT }}>{i + 1}</span>
                      <div className="text-sm text-ink leading-relaxed">
                        <strong className="text-navy">{l.label} · À vérifier</strong>
                        <p>{l.verification}</p>
                        <p className="mt-1 text-muted">Pratique non cochée : « {l.texte} »</p>
                        <p className="mt-1"><strong>Si le besoin est confirmé : </strong>{l.action}</p>
                      </div>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </div>

          {/* Pilier par pilier */}
          <div className="rounded-card bg-white border border-line shadow-card p-6">
            <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-4">Pilier par pilier</div>
            <ul className="divide-y divide-line">
              {analyse.verdicts.map((v) => (
                <li key={v.id} className="flex items-start gap-4 py-3 first:pt-0 last:pb-0">
                  <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: COULEURS_PILIERS[v.id].DEFAULT }} aria-hidden />
                  <div className="flex-1">
                    <div className="text-sm font-bold text-navy">{v.titre}</div>
                    <div className="text-[13px] text-muted leading-relaxed mt-0.5">{v.texte}</div>
                    <div className="mt-3 text-sm leading-relaxed">
                      <strong className="text-navy">Constats déclarés</strong>
                      {v.constats.length === 0 ? (
                        <p className="text-muted">Aucune pratique confirmée par une case cochée.</p>
                      ) : (
                        <ul className="mt-1 list-disc pl-5 space-y-1 text-ink">
                          {v.constats.map((c) => <li key={c.index}>{c.texte}</li>)}
                        </ul>
                      )}
                    </div>
                    {v.aVerifier.length > 0 && (
                      <div className="mt-3 text-sm leading-relaxed">
                        <strong className="text-navy">Points à vérifier et actions proposées</strong>
                        <ul className="mt-1 space-y-3">
                          {v.aVerifier.map((c) => (
                            <li key={c.index}>
                              <p className="text-ink">{c.verification}</p>
                              <p className="text-muted">Pratique non cochée : « {c.texte} »</p>
                              <p className="text-ink"><strong>Si le besoin est confirmé : </strong>{c.action}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-muted">{v.label}</div>
                    <div className="text-lg font-extrabold leading-tight" style={{ color: stateColor(v.niveau).c }}>{fmt(v.note)}</div>
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* Aller plus loin */}
          <div className="rounded-card bg-navy-dark p-6 sm:p-8 text-white">
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal mb-2">Et maintenant&nbsp;?</div>
            {analyse.priorite ? (
              <>
                <p className="text-2xl font-extrabold leading-snug max-w-2xl">Approfondissez la piste {analyse.priorite.label}.</p>
                <p className="text-[15px] text-white/75 mt-2 max-w-2xl leading-relaxed">{analyse.priorite.atelier.promesse} La première étape est gratuite.</p>
              </>
            ) : (
              <>
                <p className="text-2xl font-extrabold leading-snug max-w-2xl">Approfondissez vos pratiques et leurs résultats.</p>
                <p className="text-[15px] text-white/75 mt-2 max-w-2xl leading-relaxed">Choisissez un point à explorer dans la restitution de chaque pilier, puis définissez une action adaptée à votre contexte.</p>
              </>
            )}
            <div className="flex flex-wrap gap-3 mt-5">
              <Link
                href={analyse.priorite ? analyse.priorite.atelier.href : '/app/okr'}
                className="inline-flex items-center gap-2 px-5 py-3 bg-teal text-navy-dark text-sm font-extrabold rounded-lg hover:bg-teal-dark transition-colors"
              >
                {analyse.priorite ? analyse.priorite.atelier.libelle : 'Construire mes OKR'} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {authReady && !isAuthenticated && (
                <button
                  type="button"
                  onClick={() => ouvrirConnexion('register')}
                  className="inline-flex items-center gap-2 px-5 py-3 border-[1.5px] border-white/25 text-white text-sm font-bold rounded-lg hover:border-white/60 transition-colors"
                >
                  Créer mon compte gratuit
                </button>
              )}
            </div>
            <p className="text-xs text-white/45 mt-4">Refaites ce diagnostic dans trois mois pour comparer vos réponses.</p>
          </div>
        </section>
      )}
    </AppShell>
  );
};

export default Diagnostic4Page;
