import React, { useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { AlertCircle, AlertTriangle, ArrowRight, Check, ChevronDown, ChevronUp, Eye, FlaskConical, Mail, RotateCcw, Sparkles, Target, User, Users } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { EmailPromptModal } from '@/components/diagnostic/EmailPromptModal';
import { ouvrirConnexion } from '@/store/useConnexion';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { COULEURS_PILIERS } from '@/constants/piliers';
import { PILLARS, fmt, stateLabel, stateColor, stateBorder, type PillarId, type StateKey } from '@/lib/diagnostic';
import { PILIERS4C } from '@/lib/diagnostic4c/contenu';
import {
  REPONSES4C, analyser4c, etatInitial4c, libelleReponse4c, nbReponses4c, niveau4c, note4c, noteProvisoire4c,
  pilierComplet4c, piliersAttendus4c, textePratique, type Etat4c, type Reponse4c,
} from '@/lib/diagnostic4c/calcul';

/*
 * Diagnostic 4c — la V4b (saisie pilier par pilier) avec la revue du
 * 2026-09-23 appliquée : pratiques corrigées, « seul ou avec une équipe »
 * demandé d'entrée, quatre réponses par pratique (plus de « Non applicable »),
 * restitution nette, actions reliées aux outils Oskar, bilan envoyé par email.
 * Textes : lib/diagnostic4c/contenu.ts ; calcul : lib/diagnostic4c/calcul.ts.
 * Version d'essai : page non indexée, réponses non enregistrées.
 */

const Radar4 = dynamic(() => import('@/components/diagnostic4/Radar4'), { ssr: false });

type Couleur = { DEFAULT: string; dark: string; light: string };

const Pastille = ({ niveau, children }: { niveau: StateKey; children?: React.ReactNode }) => {
  const c = stateColor(niveau);
  const Icone = niveau === 'f' ? AlertCircle : niveau === 'c' ? AlertTriangle : Check;
  return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold whitespace-nowrap" style={{ background: c.bg, color: c.c }}>
    <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden />{children ?? stateLabel(niveau)}
  </span>;
};

/* Perception : une jauge de 0 à 10 qui se remplit jusqu'à la note cliquée (reprise de la V4b). */
const JaugePerception = ({ label, couleur, valeur, onChoisir }: { label: string; couleur: Couleur; valeur: number | null; onChoisir: (v: number) => void }) => {
  const [survol, setSurvol] = useState<number | null>(null);
  const apercu = survol ?? valeur;
  const enApercu = survol !== null && (valeur === null || survol > valeur);
  return (
    <div className="mb-5 rounded-lg bg-surface px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2">
        <span className="text-sm font-semibold text-ink">Votre perception · {label}</span>
        <span className="text-sm text-muted">{valeur === null ? 'Cliquez sur votre note, de 0 à 10' : <span className="font-bold text-navy">{valeur}/10</span>}</span>
      </div>
      <div className="flex gap-[3px]" role="radiogroup" aria-label={`Votre perception · ${label}`} onMouseLeave={() => setSurvol(null)}>
        {Array.from({ length: 11 }, (_, v) => {
          const remplie = apercu !== null && v <= apercu;
          return (
            <button key={v} type="button" role="radio" aria-checked={valeur === v} aria-label={String(v)}
              onClick={() => onChoisir(v)} onMouseEnter={() => setSurvol(v)} onFocus={() => setSurvol(v)} onBlur={() => setSurvol(null)}
              className={`flex-1 h-10 text-[13px] font-bold transition-colors first:rounded-l-lg last:rounded-r-lg ${remplie ? 'text-white' : 'bg-white text-muted hover:text-navy'} ${valeur === v ? 'ring-2 ring-offset-1 ring-navy relative z-10' : ''}`}
              style={remplie ? { background: enApercu ? couleur.light : couleur.DEFAULT, color: enApercu ? couleur.dark : '#fff' } : undefined}>
              {v}
            </button>
          );
        })}
      </div>
      <div className="flex justify-between gap-4 mt-1.5 text-[11px] leading-snug text-muted">
        <span><strong className="font-semibold">0</strong> · nous sommes nettement en retrait sur ce sujet</span>
        <span className="text-right"><strong className="font-semibold">10</strong> · nous le maîtrisons pleinement</span>
      </div>
    </div>
  );
};

const BoutonFleche = ({ ouvert, libelle, onClick }: { ouvert: boolean; libelle: string; onClick: () => void }) => (
  <button type="button" onClick={onClick} aria-expanded={ouvert}
    className="w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-full border border-line text-navy hover:border-navy hover:bg-surface transition-colors">
    {ouvert ? <ChevronUp className="h-4 w-4" aria-hidden /> : <ChevronDown className="h-4 w-4" aria-hidden />}<span className="sr-only">{libelle}</span>
  </button>
);

const couleurReponse = (r: Reponse4c) => (r === 'oui' ? 'text-[#065f46]' : r === 'partiel' ? 'text-[#92400e]' : r === 'inconnu' ? 'text-muted' : 'text-[#dc2626]');

export default function Diagnostic4cPage() {
  const [etat, setEtat] = useState<Etat4c>(etatInitial4c);
  const [revele, setRevele] = useState(false);
  const [ouverts, setOuverts] = useState<PillarId[]>([]);
  const [choixOuvert, setChoixOuvert] = useState(false);
  const [emailOuvert, setEmailOuvert] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [envoye, setEnvoye] = useState('');
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authReady = useAppStore((s) => s.authReady);
  const user = useAppStore((s) => s.user);
  const toast = useToast();
  const analyseRef = useRef<HTMLElement>(null);
  const analyse = useMemo(() => analyser4c(etat), [etat]);

  const demarre = etat.seul !== null;
  const attendus = piliersAttendus4c(etat);
  const estFait = (id: PillarId) => (etat.seul === true && id === 'team') || pilierComplet4c(etat.piliers[id]);
  const courant = demarre ? attendus.find((id) => !estFait(id)) ?? null : null;
  const deplie = (id: PillarId) => id === courant || ouverts.includes(id);
  const basculer = (id: PillarId) => setOuverts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);

  const carteActive = useRef<HTMLElement>(null);
  const derniereQuestion = useRef<HTMLFieldSetElement>(null);
  const premierRendu = useRef(true);
  const nbVisibles = courant ? nbReponses4c(etat.piliers[courant]) + (etat.piliers[courant].perception === null ? 0 : 1) : 0;
  // Au passage au pilier suivant, on l'amène en haut de l'écran ; chaque nouvelle pratique reste visible.
  useEffect(() => {
    if (premierRendu.current) { premierRendu.current = false; return; }
    carteActive.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [courant]);
  useEffect(() => {
    if (nbVisibles > 0) derniereQuestion.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, [nbVisibles]);

  const valeursRadar = analyse.notes.map((n) => ({ id: n.id, perception: n.perception, pratiques: n.note }));

  const choisirEquipe = (seul: boolean) => {
    setEtat((prev) => ({ ...prev, seul }));
    setChoixOuvert(false);
    if (seul) setOuverts((prev) => prev.filter((x) => x !== 'team'));
  };
  const noter = (id: PillarId, perception: number) => {
    setEtat((prev) => ({ ...prev, piliers: { ...prev.piliers, [id]: { ...prev.piliers[id], perception } } }));
  };
  const repondre = (id: PillarId, i: number, reponse: Reponse4c) => {
    setEtat((prev) => {
      const reponses = [...prev.piliers[id].reponses] as Etat4c['piliers'][PillarId]['reponses'];
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
    setEtat(etatInitial4c());
    setOuverts([]);
    setRevele(false);
    setEnvoye('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const envoyerBilan = async (email: string) => {
    setEnvoi(true);
    try {
      const res = await fetch('/api/send-diagnostic4c', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Le serveur recalcule l'analyse à partir des réponses.
        body: JSON.stringify({ email, etat }),
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json())?.error ?? ''; } catch { /* réponse non JSON */ }
        throw new Error(detail);
      }
      setEmailOuvert(false);
      setEnvoye(email);
      toast.success('Votre bilan est parti par email.');
    } catch (err) {
      toast.error(`L’envoi du bilan a échoué.${err instanceof Error && err.message ? ` ${err.message}` : ''}`);
    } finally {
      setEnvoi(false);
    }
  };

  const boutonEmail = (clair: boolean) => (
    <button type="button" onClick={() => setEmailOuvert(true)}
      className={clair
        ? 'w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border border-line rounded-lg hover:border-navy'
        : 'inline-flex items-center gap-2 px-5 py-3 border border-white/25 text-white text-sm font-bold rounded-lg hover:border-white/60'}>
      <Mail className="h-4 w-4" aria-hidden />{envoye ? 'Renvoyer mon bilan par email' : 'Recevoir mon bilan par email'}
    </button>
  );

  return (
    <AppShell title="Diagnostic (essai 4c)" topbarTitle="Bienvenue sur OSKAR" topbarSubtitle="Votre vision. Vos objectifs. Vos actions."
      topbarActions={!authReady ? null : isAuthenticated ? <UserMenu /> : (
        <button onClick={() => ouvrirConnexion('login')} className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light">Connexion</button>
      )}>
      <Head><meta name="robots" content="noindex, nofollow" /></Head>
      <div className="flex items-start gap-3 mb-6 rounded-lg border border-dashed border-navy/30 bg-white px-4 py-3 text-[13px] text-muted">
        <FlaskConical className="h-4 w-4 mt-0.5 shrink-0 text-navy" aria-hidden />
        <p><strong className="text-navy">Version d’essai 4c</strong> — la <Link href="/diagnostic4b" className="font-semibold text-navy underline">version 4b</Link> avec
          les pratiques revues, une restitution réécrite et le bilan par email. Voir aussi la <Link href="/diagnostic4" className="font-semibold text-navy underline">version 4</Link>. Rien n’est enregistré.</p>
      </div>

      <header className="mb-8 max-w-3xl">
        <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">Diagnostic Oskar · 5 piliers · 5 minutes environ</div>
        <h1 className="text-[28px] leading-tight font-extrabold text-navy">Où en est vraiment votre entreprise&nbsp;?</h1>
        <p className="text-[15px] text-muted mt-2 leading-relaxed">Un pilier à la fois : votre perception d’abord, puis quatre pratiques concrètes.
          À la fin, votre profil, votre priorité et trois actions pour les 30 prochains jours.</p>
      </header>

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div className="min-w-0">
          {/* Avant de commencer : seul ou avec une équipe, pour adapter les pratiques. */}
          {!demarre || choixOuvert ? (
            <section className="bg-white rounded-card border border-line shadow-card p-5 mb-4 animate-fade-in" aria-label="Votre situation">
              <h2 className="text-lg font-bold text-navy">Pour commencer, vous dirigez…</h2>
              <p className="text-sm text-muted mt-1 mb-4">Les pratiques s’adaptent à votre situation.</p>
              <div className="grid sm:grid-cols-2 gap-3">
                {([[true, 'Seul, sans équipe', 'Le pilier Team sera laissé de côté.', User], [false, 'Avec une équipe', 'Associés, salariés, managers…', Users]] as const).map(([seul, titre, sousTitre, Icone]) => (
                  <button key={titre} type="button" onClick={() => choisirEquipe(seul)}
                    className={`flex items-start gap-3 text-left rounded-lg border-[1.5px] px-4 py-3.5 transition-colors ${etat.seul === seul ? 'border-navy bg-surface' : 'border-line hover:border-navy/50'}`}>
                    <Icone className="h-5 w-5 mt-0.5 shrink-0 text-navy" aria-hidden />
                    <span><span className="block text-sm font-bold text-navy">{titre}</span><span className="block text-xs text-muted mt-0.5">{sousTitre}</span></span>
                  </button>
                ))}
              </div>
            </section>
          ) : (
            <div className="flex items-center gap-3 rounded-card border border-line bg-white px-5 py-3 mb-3 text-sm">
              {etat.seul ? <User className="h-4 w-4 text-navy" aria-hidden /> : <Users className="h-4 w-4 text-navy" aria-hidden />}
              <span className="text-muted">Vous dirigez <strong className="text-navy">{etat.seul ? 'seul, sans équipe' : 'avec une équipe'}</strong></span>
              <button type="button" onClick={() => setChoixOuvert(true)} className="ml-auto text-xs font-semibold text-navy hover:underline">Modifier</button>
            </div>
          )}

          {PILLARS.map((pilier, index) => {
            const saisie = etat.piliers[pilier.id];
            const couleur = COULEURS_PILIERS[pilier.id];
            const contenu = PILIERS4C[pilier.id];
            const note = note4c(saisie);
            const provisoire = noteProvisoire4c(saisie);
            const entete = <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: couleur.dark }}>{index + 1}/5 · {pilier.module}</div>;

            if (etat.seul === true && pilier.id === 'team') {
              return (
                <div key={pilier.id} className="flex items-center gap-3 rounded-card border border-dashed border-line bg-white/60 px-5 py-3 mb-3 text-sm text-muted">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleur.DEFAULT, opacity: 0.45 }} aria-hidden />
                  <span className="font-semibold text-navy/70">{index + 1}/5 · {pilier.module}</span><span className="text-xs">Passé : vous travaillez seul</span>
                </div>
              );
            }

            // Pilier pas encore commencé : son numéro et sa question, pour garder le fil.
            if (!deplie(pilier.id) && !estFait(pilier.id)) {
              return (
                <div key={pilier.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-dashed border-line bg-white/60 px-5 py-3 mb-3 text-sm text-muted">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleur.DEFAULT, opacity: 0.45 }} aria-hidden />
                  <span className="font-semibold text-navy/70">{index + 1}/5 · {pilier.module}</span>
                  <span className="text-xs">{contenu.question}</span>
                </div>
              );
            }

            // Pilier rempli : replié en une ligne, rouvrable à la flèche.
            if (!deplie(pilier.id)) {
              const oui = saisie.reponses.filter((r) => r === 'oui').length;
              return (
                <div key={pilier.id} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-card border border-line bg-white shadow-card px-5 py-3.5 mb-3" style={{ borderLeft: `4px solid ${couleur.DEFAULT}` }}>
                  <div className="min-w-0">{entete}<div className="text-sm text-muted mt-0.5">Perception {saisie.perception}/10 · {oui} oui sur 4</div></div>
                  <div className="ml-auto flex items-center gap-3">
                    {note !== null && <><span className="text-lg font-extrabold text-navy">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></span><Pastille niveau={niveau4c(note)} /></>}
                    <BoutonFleche ouvert={false} libelle={`Déplier ${pilier.label} pour le modifier`} onClick={() => basculer(pilier.id)} />
                  </div>
                </div>
              );
            }

            // Pilier ouvert : la perception, puis les pratiques une à une (toutes, s'il a été rouvert).
            const premiereVide = saisie.reponses.findIndex((r) => r === null);
            const visibles = pilier.id !== courant ? 4 : saisie.perception === null ? 0 : premiereVide === -1 ? 4 : premiereVide + 1;
            return (
              <article key={pilier.id} ref={pilier.id === courant ? carteActive : undefined} className="bg-white rounded-card border border-line shadow-card p-5 mb-4 scroll-mt-24 animate-fade-in" style={{ borderTop: `3px solid ${couleur.DEFAULT}` }}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>{entete}<h2 className="text-lg font-bold text-navy leading-snug mt-0.5">{contenu.question}</h2></div>
                  <div className="flex items-center gap-3 shrink-0">
                    {note !== null ? (
                      <div className="sm:text-right">
                        <div className="text-2xl font-extrabold text-navy leading-none">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></div>
                        <div className="mt-1.5"><Pastille niveau={niveau4c(note)} /></div>
                      </div>
                    ) : provisoire !== null && (
                      <div className="sm:text-right">
                        <div className="text-2xl font-extrabold text-navy/70 leading-none">{fmt(provisoire)}<span className="text-xs font-normal text-muted"> /10</span></div>
                        <div className="text-[11px] text-muted mt-1">Provisoire · {nbReponses4c(saisie)}/4</div>
                      </div>
                    )}
                    {pilier.id !== courant && <BoutonFleche ouvert libelle={`Replier ${pilier.label}`} onClick={() => basculer(pilier.id)} />}
                  </div>
                </div>
                <JaugePerception label={pilier.label} couleur={couleur} valeur={saisie.perception} onChoisir={(v) => noter(pilier.id, v)} />
                {visibles > 0 && (
                  <div className="mb-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-semibold text-ink">Vos pratiques</span>
                      <span className="text-xs font-bold text-muted">{nbReponses4c(saisie)}/4</span>
                    </div>
                    {index === 0 && <p className="text-xs text-muted mt-0.5">« En partie » : c’est commencé, ou pas systématique.</p>}
                  </div>
                )}
                <div className="space-y-3">
                  {contenu.criteres.slice(0, visibles).map((_, i) => {
                    const texte = textePratique(pilier.id, i, etat.seul);
                    return (
                      <fieldset key={i} ref={i === visibles - 1 ? derniereQuestion : undefined} className="rounded-lg border border-line p-3 min-w-0 animate-fade-in">
                        <legend className="px-1 text-[13.5px] font-medium text-ink">{texte}</legend>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          {REPONSES4C.map((option) => {
                            const choisie = saisie.reponses[i] === option.valeur;
                            return <label key={option.valeur}
                              className="flex items-center gap-2 rounded-md border px-2.5 py-2 text-xs cursor-pointer focus-within:ring-2 focus-within:ring-navy focus-within:ring-offset-2"
                              style={choisie ? { borderColor: couleur.DEFAULT, background: couleur.light } : undefined}>
                              <input type="radio" name={`pratique-${pilier.id}-${i}`} value={option.valeur} checked={choisie}
                                onChange={() => repondre(pilier.id, i, option.valeur)} className="shrink-0" style={{ accentColor: couleur.DEFAULT }} />
                              {option.libelle}
                            </label>;
                          })}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
                {saisie.reponses.includes('inconnu') && <p className="text-xs text-muted mt-2">« Je ne sais pas » compte comme une pratique non en place : c’est un point à vérifier.</p>}
                {pilier.id !== courant && (
                  <button type="button" onClick={() => basculer(pilier.id)} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light">
                    <ChevronUp className="h-4 w-4" aria-hidden />Replier ce pilier
                  </button>
                )}
              </article>
            );
          })}
        </div>

        <div className="flex flex-col gap-4 lg:sticky lg:top-24">
          <section className="bg-navy-dark rounded-card p-6 text-white" aria-label="Score global">
            <div className="text-[11px] font-bold uppercase tracking-widest text-white/60 mb-2">Score global</div>
            {analyse.moyenne !== null && analyse.niveauGlobal ? <>
              <div className="text-5xl font-extrabold leading-none tracking-tight">{fmt(analyse.moyenne)}<span className="text-lg font-normal text-white/60"> /10</span></div>
              <div className="mt-3"><Pastille niveau={analyse.niveauGlobal} /></div>
            </> : <p className="text-sm text-white/70 mt-1">Il apparaît quand tous les piliers sont remplis.</p>}
            <div className="flex justify-between text-xs text-white/70 mt-4 mb-1.5"><span>Réponses</span><span>{analyse.nbReponses}/{analyse.nbAttendu}</span></div>
            <div className="h-1.5 bg-white/10 rounded-full overflow-hidden"><div className="h-full rounded-full bg-teal transition-all" style={{ width: `${analyse.nbReponses / analyse.nbAttendu * 100}%` }} /></div>
          </section>
          <section className="bg-white rounded-card border border-line shadow-card p-5" aria-label="Radar perception et pratiques">
            <div className="text-sm font-bold text-navy mb-2">Perception ou réalité&nbsp;?</div>
            <div className="flex flex-wrap gap-3 text-xs text-muted mb-2">
              <span className="inline-flex items-center gap-1.5"><span className="w-4 border-t-2 border-dashed border-[#9098c5]" aria-hidden /> Votre perception</span>
              <span className="inline-flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm bg-teal/30 border border-navy" aria-hidden /> Vos pratiques</span>
            </div>
            {analyse.complet ? <div className="w-full h-56"><Radar4 valeurs={valeursRadar} /></div>
              : <p className="text-sm text-muted py-4">Le radar compare votre perception à vos pratiques, une fois tous les piliers remplis.</p>}
          </section>
          <button type="button" disabled={!analyse.complet} onClick={reveler}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-teal text-navy-dark text-sm font-extrabold rounded-lg shadow-sm hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed">
            <Sparkles className="h-4 w-4" aria-hidden />{analyse.complet ? 'Révéler mon analyse' : `Encore ${analyse.nbAttendu - analyse.nbReponses} réponse${analyse.nbAttendu - analyse.nbReponses > 1 ? 's' : ''}`}
          </button>
          {revele && analyse.complet && boutonEmail(true)}
          <button type="button" onClick={recommencer} className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border border-line rounded-lg hover:border-navy">
            <RotateCcw className="h-4 w-4" aria-hidden />Recommencer
          </button>
        </div>
      </div>

      {revele && analyse.complet && analyse.profil && analyse.moyenne !== null && analyse.niveauGlobal && (
        <section ref={analyseRef} className="mt-8 scroll-mt-24 space-y-5 animate-fade-in" aria-label="Votre analyse">
          {/* Profil */}
          <div className="rounded-card bg-gradient-to-br from-navy-dark to-navy p-6 sm:p-8 text-white flex flex-wrap justify-between gap-6">
            <div className="max-w-2xl">
              <div className="text-[11px] font-bold uppercase tracking-widest text-teal mb-2">Votre profil</div>
              <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">{analyse.profil.nom}</div>
              <p className="text-[15px] text-white/80 leading-relaxed mt-3">{analyse.profil.texte}</p>
            </div>
            <div className="text-right"><div className="text-5xl font-extrabold leading-none">{fmt(analyse.moyenne)}<span className="text-lg font-normal text-white/40"> /10</span></div><div className="mt-2.5"><Pastille niveau={analyse.niveauGlobal} /></div></div>
          </div>

          {/* Priorité */}
          {analyse.priorite && (
            <div className="rounded-card bg-white border border-line shadow-card p-6 border-l-4" style={{ borderLeftColor: stateBorder(analyse.priorite.niveau) }}>
              <div className="flex flex-wrap items-center gap-2.5 mb-3"><Target className="h-4 w-4 text-navy" aria-hidden />
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted">Votre priorité</span>
                <Pastille niveau={analyse.priorite.niveau}>{analyse.priorite.label} · {fmt(analyse.priorite.note)}/10</Pastille></div>
              <p className="text-xl font-extrabold text-navy leading-snug">{analyse.priorite.titre}</p>
              <p className="text-[15px] text-ink leading-relaxed mt-1.5">{analyse.priorite.texte}</p>
              {analyse.domino && (
                <p className="mt-4 rounded-lg bg-surface px-4 py-3 text-sm text-ink leading-relaxed">
                  <strong className="text-navy">Effet domino sur {analyse.domino.fort.label}, votre point fort · </strong>{analyse.domino.texte}
                </p>
              )}
              <Link href={analyse.priorite.atelier.href} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-teal text-navy-dark text-sm font-extrabold rounded-lg hover:bg-teal-dark">
                {analyse.priorite.atelier.libelle}<ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </div>
          )}

          <div className="grid gap-5 lg:grid-cols-2">
            {/* Perception face aux pratiques */}
            <div className="rounded-card bg-white border border-line shadow-card p-6">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted mb-3"><Eye className="h-4 w-4 text-navy" aria-hidden />Votre perception face à vos pratiques</h2>
              {analyse.ecarts.length === 0 ? (
                <p className="text-[15px] text-ink leading-relaxed"><strong className="text-navy">Votre regard est lucide.</strong> Sur chaque pilier, votre perception rejoint vos pratiques : vous décidez sur une image juste de votre entreprise.</p>
              ) : (
                <ul className="space-y-3">{analyse.ecarts.map((e) => (
                  <li key={e.id} className="text-sm text-ink leading-relaxed">
                    <strong className="text-navy">{e.sens === 'angle-mort' ? `Angle mort · ${e.label}` : `Force sous-estimée · ${e.label}`}</strong><br />
                    Vous vous donnez {e.perception}/10, vos pratiques disent {fmt(e.note)}.{' '}
                    <span className="text-muted">{e.sens === 'angle-mort' ? 'C’est souvent là que se cachent les mauvaises surprises.' : 'Vous êtes plus avancé que vous ne le pensez : faites-le savoir à votre équipe.'}</span>
                  </li>
                ))}</ul>
              )}
            </div>

            {/* Actions reliées à Oskar */}
            <div className="rounded-card bg-white border border-line shadow-card p-6">
              <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-muted mb-3"><Check className="h-4 w-4 text-navy" aria-hidden />Vos actions pour les 30 prochains jours</h2>
              {analyse.actions.length === 0 ? (
                <p className="text-[15px] text-ink leading-relaxed">Toutes vos pratiques sont en place : l’enjeu est de le rester. Refaites le diagnostic dans trois mois.</p>
              ) : (
                <ol className="space-y-4">{analyse.actions.map((a, i) => (
                  <li key={`${a.id}-${i}`} className="flex gap-3">
                    <span className="w-6 h-6 shrink-0 rounded-full text-white text-xs font-bold flex items-center justify-center" style={{ background: COULEURS_PILIERS[a.id].DEFAULT }}>{i + 1}</span>
                    <div className="text-sm text-ink leading-relaxed">
                      <strong className="text-navy">{a.label} · </strong>
                      {a.reponse === 'inconnu' && <span className="text-muted">À vérifier d’abord : {a.verification} </span>}
                      {a.action}
                      <Link href={a.outil.href} className="mt-1.5 flex w-fit items-center gap-1 text-[13px] font-bold text-navy hover:underline">
                        {a.outil.libelle}<ArrowRight className="h-3.5 w-3.5" aria-hidden />
                      </Link>
                    </div>
                  </li>
                ))}</ol>
              )}
            </div>
          </div>

          {/* Pilier par pilier */}
          <div className="rounded-card bg-white border border-line shadow-card p-6">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-muted mb-4">Pilier par pilier</h2>
            <ul className="divide-y divide-line">{analyse.verdicts.map((v) => (
              <li key={v.id} className="py-5 first:pt-0 last:pb-0">
                <div className="flex items-start gap-4">
                  <span className="w-1 self-stretch rounded-full shrink-0" style={{ background: COULEURS_PILIERS[v.id].DEFAULT }} aria-hidden />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-bold text-navy">{v.titre}</div>
                    <div className="text-[13px] text-muted leading-relaxed mt-0.5">{v.texte}</div>
                    <ul className="mt-2 space-y-1 text-[13px]">{v.reponses.map((r) => (
                      <li key={r.pratique} className="text-ink"><strong className={couleurReponse(r.reponse)}>{libelleReponse4c(r.reponse)}</strong> · {r.pratique}</li>
                    ))}</ul>
                    <details className="mt-2 text-[13px]">
                      <summary className="cursor-pointer font-semibold text-navy">Pour aller plus loin avec un coach : les preuves à examiner</summary>
                      <ul className="mt-2 space-y-1.5 text-muted">{v.reponses.map((r) => <li key={r.pratique}><strong className="text-ink">{r.pratique}</strong><br />{r.preuveAExaminer}</li>)}</ul>
                    </details>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-xs font-bold text-muted">{v.label}</div>
                    <div className="text-lg font-extrabold leading-tight" style={{ color: stateColor(v.niveau).c }}>{fmt(v.note)}</div>
                    <div className="text-[11px] text-muted">perçu {v.perception}</div>
                  </div>
                </div>
              </li>
            ))}</ul>
          </div>

          {/* Et maintenant ? */}
          <div className="rounded-card bg-navy-dark p-6 sm:p-8 text-white">
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal mb-2">Et maintenant&nbsp;?</div>
            <p className="text-2xl font-extrabold leading-snug max-w-2xl">{analyse.priorite ? `Passez du constat à l’action sur ${analyse.priorite.label}.` : 'Gardez ce niveau en grandissant.'}</p>
            <p className="text-[15px] text-white/75 mt-2 max-w-2xl leading-relaxed">{analyse.priorite
              ? `${analyse.priorite.atelier.promesse} La première étape est gratuite.`
              : 'Suivez vos objectifs et animez vos rituels d’équipe avec Oskar, pour que ce qui marche aujourd’hui tienne demain.'}</p>
            <div className="flex flex-wrap gap-3 mt-5">
              <Link href={analyse.priorite ? analyse.priorite.atelier.href : '/app/okr'} className="inline-flex items-center gap-2 px-5 py-3 bg-teal text-navy-dark text-sm font-extrabold rounded-lg hover:bg-teal-dark">
                {analyse.priorite ? analyse.priorite.atelier.libelle : 'Construire mes OKR'}<ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
              {boutonEmail(false)}
              {authReady && !isAuthenticated && <button type="button" onClick={() => ouvrirConnexion('register')} className="px-5 py-3 border border-white/25 text-white text-sm font-bold rounded-lg hover:border-white/60">Créer mon compte gratuit</button>}
            </div>
            {envoye && <p role="status" className="text-sm text-teal mt-4">Votre bilan a été envoyé à {envoye}.</p>}
            <p className="text-xs text-white/50 mt-4">Refaites ce diagnostic dans trois mois : vous verrez vos progrès sur le radar.</p>
          </div>
        </section>
      )}

      {/* Explications et précautions, une seule fois, en fin de page. */}
      <section className="mt-8 rounded-lg bg-surface p-4 text-sm text-muted space-y-2 max-w-3xl" aria-label="Comprendre le diagnostic">
        <p><strong className="text-navy">Perception :</strong> votre appréciation spontanée, de 0 à 10. Elle ne compte pas dans le score : elle sert à repérer les écarts.</p>
        <p><strong className="text-navy">Pratiques :</strong> vos réponses, sans vérification externe.</p>
        <p><strong className="text-navy">Preuves :</strong> des documents ou exemples à examiner avec un coach. Aucune preuve n’est collectée ni validée par ce questionnaire.</p>
        <details>
          <summary className="cursor-pointer font-semibold text-navy">Comment est calculé le score&nbsp;?</summary>
          <p className="mt-2">Oui = 1, En partie = 0,5, Non = 0. « Je ne sais pas » compte 0 : une pratique qu’on ne voit pas n’est pas en place ; elle est signalée à vérifier.
            Le score d’un pilier est la moyenne de ses quatre pratiques, ramenée sur 10.</p>
          <p className="mt-2">Le score global est la moyenne des piliers. Fragile en dessous de 4, En construction de 4 à moins de 7, Solide à partir de 7.
            Un pilier Fragile empêche le niveau global Solide : une entreprise vaut aussi son maillon faible. Ces repères ouvrent une discussion ; ils ne valent pas audit.</p>
        </details>
      </section>

      <EmailPromptModal
        open={emailOuvert}
        title="Recevoir mon bilan"
        description="Votre profil, votre priorité et vos trois actions, dans votre boîte mail. Votre adresse sert uniquement à cet envoi."
        submitLabel="Envoyer"
        defaultEmail={user?.email ?? envoye}
        loading={envoi}
        onSubmit={(email) => envoyerBilan(email)}
        onClose={() => setEmailOuvert(false)}
      />
    </AppShell>
  );
}
