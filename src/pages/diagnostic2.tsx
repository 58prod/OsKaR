import React, { useCallback, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AlertCircle, AlertTriangle, ArrowRight, Check, FlaskConical, RotateCcw } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { ouvrirConnexion } from '@/store/useConnexion';
import { useAppStore } from '@/store/useAppStore';
import { COULEURS_PILIERS } from '@/constants/piliers';
import { PILLARS, fmt, stateLabel, stateColor, stateBorder, type PillarId, type StateKey } from '@/lib/diagnostic';
import { QUESTIONS2 } from '@/lib/diagnostic2/questions';
import {
  ATELIER_PILIER,
  analyser2,
  etatInitial2,
  nbReponses,
  niveau2,
  note2,
  type Etat2,
} from '@/lib/diagnostic2/calcul';

/*
 * Diagnostic 2 — version d'essai, à tester avec Eric avant de remplacer (ou
 * non) le Diagnostic actuel. Page hors menu et non indexée ; rien n'est
 * enregistré. Questions en situation à 4 réponses, ressenti hors de la note.
 */

const Radar2 = dynamic(() => import('@/components/diagnostic2/Radar2'), { ssr: false });

const IconeNiveau: React.FC<{ niveau: StateKey }> = ({ niveau }) => {
  if (niveau === 'f') return <AlertCircle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  if (niveau === 'c') return <AlertTriangle className="h-3.5 w-3.5 shrink-0" aria-hidden />;
  return <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />;
};

const Pastille: React.FC<{ niveau: StateKey; children?: React.ReactNode }> = ({ niveau, children }) => {
  const c = stateColor(niveau);
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold" style={{ background: c.bg, color: c.c }}>
      <IconeNiveau niveau={niveau} /> {children ?? stateLabel(niveau)}
    </span>
  );
};

const Diagnostic2Page: React.FC = () => {
  const [etat, setEtat] = useState<Etat2>(etatInitial2);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authReady = useAppStore((s) => s.authReady);
  const analyseRef = useRef<HTMLElement>(null);

  const analyse = useMemo(() => analyser2(etat), [etat]);
  const { faites, attendues } = nbReponses(etat);

  const repondre = useCallback((id: PillarId, question: number, reponse: number) => {
    setEtat((prev) => {
      const reponses = [...prev.piliers[id].reponses] as Etat2['piliers'][PillarId]['reponses'];
      reponses[question] = reponse;
      return { ...prev, piliers: { ...prev.piliers, [id]: { ...prev.piliers[id], reponses } } };
    });
  }, []);

  const ressentir = useCallback((id: PillarId, valeur: number) => {
    setEtat((prev) => ({ ...prev, piliers: { ...prev.piliers, [id]: { ...prev.piliers[id], ressenti: valeur } } }));
  }, []);

  const notesRadar = useMemo(() => {
    const r: Partial<Record<PillarId, number>> = {};
    analyse.notes.forEach((n) => { r[n.id] = n.note; });
    return r;
  }, [analyse.notes]);

  return (
    <AppShell
      title="Diagnostic (essai)"
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
          <strong className="text-navy">Version d’essai</strong> — nouvelles questions et nouveau calcul, à comparer avec le{' '}
          <Link href="/diagnostic" className="font-semibold text-navy underline">Diagnostic actuel</Link>. Rien n’est enregistré.
        </p>
      </div>

      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">Outil de pilotage</div>
          <h1 className="text-2xl font-extrabold text-navy">Diagnostic de maturité Oskar</h1>
          <p className="text-sm text-muted mt-1.5">15 situations, une réponse à chaque fois : celle qui ressemble le plus à votre entreprise aujourd’hui.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5">
          <Pastille niveau="f">moins de 4 · Fragile</Pastille>
          <Pastille niveau="c">4 à 6,9 · En construction</Pastille>
          <Pastille niveau="s">7 et plus · Solide</Pastille>
        </div>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div>
          {PILLARS.map((pilier) => {
            const saisie = etat.piliers[pilier.id];
            const couleur = COULEURS_PILIERS[pilier.id];
            const note = note2(saisie);
            const ecarte = etat.seul && pilier.id === 'team';
            return (
              <article key={pilier.id} className="bg-white rounded-card border border-line shadow-card p-5 mb-4" style={{ borderTop: `3px solid ${couleur.DEFAULT}` }}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-stretch gap-3">
                    <span className="w-1 rounded-full" style={{ background: couleur.DEFAULT }} aria-hidden />
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: couleur.dark }}>{pilier.module}</div>
                      <h2 className="text-lg font-bold text-navy">{pilier.label}</h2>
                    </div>
                  </div>
                  {note !== null && !ecarte && (
                    <div className="text-right">
                      <div className="text-2xl font-extrabold text-navy leading-none">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></div>
                      <div className="mt-1.5"><Pastille niveau={niveau2(note)} /></div>
                    </div>
                  )}
                </div>
                <p className="text-sm text-muted mb-4">{pilier.desc}</p>

                {pilier.id === 'team' && (
                  <label className="flex items-center gap-2.5 mb-4 text-sm text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={etat.seul}
                      onChange={(e) => setEtat((prev) => ({ ...prev, seul: e.target.checked }))}
                      className="h-4 w-4 rounded border-line"
                      style={{ accentColor: couleur.DEFAULT }}
                    />
                    Je travaille seul : ce pilier ne me concerne pas pour l’instant
                  </label>
                )}

                {!ecarte && (
                  <>
                    <div className="mb-5 rounded-lg bg-surface px-4 py-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-ink">D’abord, à vue de nez, vous vous donnez combien&nbsp;?</span>
                        <span className="text-sm font-bold text-navy">{saisie.ressenti === null ? '—' : `${saisie.ressenti}/10`}</span>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={10}
                        step={1}
                        value={saisie.ressenti ?? 5}
                        onChange={(e) => ressentir(pilier.id, parseInt(e.target.value, 10))}
                        onClick={(e) => ressentir(pilier.id, parseInt((e.target as HTMLInputElement).value, 10))}
                        className="w-full h-1.5 cursor-pointer"
                        style={{ accentColor: couleur.DEFAULT, opacity: saisie.ressenti === null ? 0.45 : 1 }}
                        aria-label={`Ressenti sur le pilier ${pilier.label}, de 0 à 10`}
                      />
                      <p className="text-[11.5px] text-muted mt-1">Facultatif, et hors de la note : il sert à comparer votre intuition à vos réponses.</p>
                    </div>

                    <ol className="space-y-5">
                      {QUESTIONS2[pilier.id].map((question, qi) => (
                        <li key={qi}>
                          <fieldset>
                            <legend className="text-sm font-semibold text-ink mb-2">
                              <span className="text-muted font-normal mr-1.5">{qi + 1}.</span>{question.q}
                            </legend>
                            <div className="grid gap-2 2xl:grid-cols-2">
                              {question.o.map((option, oi) => {
                                const choisie = saisie.reponses[qi] === oi;
                                return (
                                  <label
                                    key={oi}
                                    className={`flex items-start gap-2.5 rounded-lg border-[1.5px] px-3 py-2.5 text-[13px] leading-snug cursor-pointer transition-colors ${choisie ? 'text-navy font-semibold' : 'border-line text-ink hover:border-navy/40'}`}
                                    style={choisie ? { borderColor: couleur.DEFAULT, background: couleur.light } : undefined}
                                  >
                                    <input
                                      type="radio"
                                      name={`${pilier.id}-${qi}`}
                                      checked={choisie}
                                      onChange={() => repondre(pilier.id, qi, oi)}
                                      className="mt-0.5 h-4 w-4 shrink-0"
                                      style={{ accentColor: couleur.DEFAULT }}
                                    />
                                    {option}
                                  </label>
                                );
                              })}
                            </div>
                          </fieldset>
                        </li>
                      ))}
                    </ol>
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
              <div className="text-sm font-light text-white/50 mt-1">Il s’affiche une fois toutes les questions répondues.</div>
            )}
            <div className="flex items-center justify-between text-[11.5px] text-white/50 mt-4 mb-1.5">
              <span>Réponses</span><span>{faites}/{attendues}</span>
            </div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full bg-teal transition-all duration-500" style={{ width: `${(faites / attendues) * 100}%` }} />
            </div>
          </section>

          <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Radar des piliers">
            <div className="text-sm font-bold text-navy mb-3">Radar OSKAR</div>
            <div className="w-full h-60"><Radar2 notes={notesRadar} /></div>
          </section>

          <button
            type="button"
            disabled={!analyse.complet}
            onClick={() => analyseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="w-full px-4 py-3.5 bg-navy text-white text-sm font-bold rounded-lg transition-all hover:bg-navy-light disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {analyse.complet ? 'Voir mon analyse ↓' : `Encore ${attendues - faites} réponse${attendues - faites > 1 ? 's' : ''}`}
          </button>
          <button
            type="button"
            onClick={() => setEtat(etatInitial2())}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg hover:border-navy transition-all"
          >
            <RotateCcw className="h-4 w-4" aria-hidden /> Recommencer
          </button>
        </div>
      </div>

      {analyse.complet && (
        <section ref={analyseRef} className="mt-6 scroll-mt-24 bg-white rounded-card border border-line shadow-card p-6 space-y-6" aria-label="Analyse">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">Votre analyse</div>
            <p className="text-lg font-bold text-navy leading-snug">{analyse.message}</p>
          </div>

          {analyse.priorite && (
            <div className="rounded-xl p-5 border-l-4 bg-surface" style={{ borderLeftColor: stateBorder(analyse.priorite.niveau) }}>
              <div className="flex flex-wrap items-center gap-2.5 mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Votre priorité</span>
                <Pastille niveau={analyse.priorite.niveau}>{analyse.priorite.label} · {fmt(analyse.priorite.note)}/10</Pastille>
              </div>
              <p className="text-sm text-ink font-semibold">{analyse.priorite.prio}</p>
              <p className="text-sm text-muted mt-1">{analyse.priorite.detail}</p>
              <Link
                href={ATELIER_PILIER[analyse.priorite.id].href}
                className="mt-4 inline-flex items-center gap-1.5 px-4 py-2.5 bg-teal text-navy-dark text-sm font-bold rounded-lg hover:bg-teal-dark transition-colors"
              >
                {ATELIER_PILIER[analyse.priorite.id].libelle} <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}

          {analyse.ecarts.length > 0 && (
            <Bloc titre="Votre intuition et vos réponses">
              {analyse.ecarts.map((e) => (
                <p key={e.id} className="text-sm text-ink mb-1.5 last:mb-0">
                  <strong className="text-navy">{e.label}</strong> : vous vous donniez {e.ressenti}/10, vos réponses donnent {fmt(e.note)}.{' '}
                  <span className="text-muted">
                    {e.ressenti > e.note ? 'Ce pilier est peut-être moins solide que vous ne le pensez.' : 'Vous êtes plus avancé que vous ne le pensez.'}
                  </span>
                </p>
              ))}
            </Bloc>
          )}

          {analyse.croisements.length > 0 && (
            <Bloc titre="Ce que cela provoque">
              {analyse.croisements.map((r, i) => (
                <div key={i} className="mb-3 last:mb-0">
                  <p className="text-sm text-ink">{r.t1}</p>
                  <p className="text-sm text-muted mt-0.5">{r.t2}</p>
                </div>
              ))}
            </Bloc>
          )}

          {analyse.autresChantiers.length > 0 && (
            <Bloc titre="Ensuite">
              {analyse.autresChantiers.map((c) => (
                <p key={c.id} className="text-sm text-ink mb-1.5 last:mb-0">
                  <strong className="text-navy">{c.label} · {fmt(c.note)}/10</strong> — {c.prio}
                </p>
              ))}
            </Bloc>
          )}

          {analyse.appuis.length > 0 && (
            <Bloc titre="Vos points d’appui">
              {analyse.appuis.map((a) => (
                <p key={a.id} className="text-sm text-ink mb-1.5 last:mb-0">
                  <strong className="text-navy">{a.label} · {fmt(a.note)}/10</strong> — {a.detail}
                </p>
              ))}
            </Bloc>
          )}
        </section>
      )}
    </AppShell>
  );
};

const Bloc: React.FC<{ titre: string; children: React.ReactNode }> = ({ titre, children }) => (
  <div>
    <div className="text-[11px] font-bold uppercase tracking-wider text-muted mb-2">{titre}</div>
    {children}
  </div>
);

export default Diagnostic2Page;
