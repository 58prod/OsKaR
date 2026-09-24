import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import { AlertCircle, AlertTriangle, ArrowRight, Check, Eye, ChevronDown, ChevronUp, FileText, Loader2, RotateCcw, Save, Sparkles, Target } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { EmailPromptModal } from '@/components/diagnostic/EmailPromptModal';
import { ouvrirConnexion, type OngletAuth } from '@/store/useConnexion';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { useCreateDiagnostic } from '@/hooks/useDiagnostics';
import { DiagnosticsService } from '@/services/db/diagnostics';
import { OPTIONS_DIAGNOSTIC, etat4Depuis, reponsesBilan4, scoresBilan4 } from '@/lib/diagnostic4/bilan';
import { COULEURS_PILIERS } from '@/constants/piliers';
import { PILLARS, fmt, stateLabel, stateColor, stateBorder, type PillarId, type StateKey } from '@/lib/diagnostic';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { analyser4, etatInitial4, nbExploitables4, nbReponses4, niveau4, note4, pilierComplet4, piliersAttendus4, REPONSES4, libelleReponse4, type Reponse4, type Etat4, type Verification4 } from '@/lib/diagnostic4/calcul';

/*
 * Le Diagnostic (depuis le 2026-09-24, ex-version d'essai 4b). Calcul et textes
 * de la V4 d'Eric (lib/diagnostic4), saisie progressive : un seul pilier ouvert
 * à la fois, ses pratiques qui apparaissent une à une, les piliers remplis
 * repliés en une ligne (rouvrables), ceux à venir réduits à leur question.
 *
 * Mêmes services que l'ancien Diagnostic, gardé dans /diagnostic-classique :
 * enregistrement (compte, ou email pour un visiteur), restauration par email,
 * synthèse PDF envoyée par email, réouverture depuis « Mes bilans » (?bilan=).
 * Format enregistré : lib/diagnostic4/bilan.ts.
 */

/** Mode de la fenêtre de saisie d'email (visiteur). */
type ModeEmail = 'save' | 'pdf' | 'restore';
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

/*
 * « Je ne sais pas » sort du calcul (ni zéro, ni note effacée d'office) et
 * reste à clarifier ; un pilier n'est noté qu'avec au moins deux pratiques
 * renseignées (Oui, En partie, Non) ; le score global pèse chaque pilier selon
 * ce nombre. Voir `couvertureMinimale` dans lib/diagnostic4/calcul.ts.
 */
const OPTIONS = OPTIONS_DIAGNOSTIC;
const COUVERTURE_MINIMALE = OPTIONS_DIAGNOSTIC.couvertureMinimale ?? 2;

/*
 * Score du pilier au fil des réponses : même barème, sur les pratiques déjà
 * renseignées. Il n'apparaît qu'à partir de deux pratiques, pour qu'un seul
 * « Oui » n'affiche pas 10/10, et reste marqué « Provisoire ».
 */
function noteProvisoire(saisie: Etat4['piliers'][PillarId]): number | null {
  const donnees = saisie.reponses.filter((r) => r === 'oui' || r === 'partiel' || r === 'non');
  if (donnees.length < COUVERTURE_MINIMALE) return null;
  const points = donnees.reduce((total, r) => total + (r === 'oui' ? 1 : r === 'partiel' ? 0.5 : 0), 0);
  return Math.round(points / donnees.length * 100) / 10;
}

/*
 * Perception : une jauge de 0 à 10 qui se remplit jusqu'à la note cliquée.
 * Des cases, donc on voit tout de suite qu'il faut cliquer — mais elles se
 * lisent comme une jauge, et le survol montre le remplissage à venir.
 */
const JaugePerception = ({ label, couleur, valeur, onChoisir }: {
  label: string;
  couleur: { DEFAULT: string; dark: string; light: string };
  valeur: number | null;
  onChoisir: (valeur: number) => void;
}) => {
  const [survol, setSurvol] = useState<number | null>(null);
  const cases = useRef<(HTMLButtonElement | null)[]>([]);
  const apercu = survol ?? valeur;
  // Clavier : une seule case dans l'ordre de tabulation, les flèches changent la note.
  const auClavier = (e: React.KeyboardEvent, v: number) => {
    const cible = { ArrowRight: v + 1, ArrowUp: v + 1, ArrowLeft: v - 1, ArrowDown: v - 1, Home: 0, End: 10 }[e.key];
    if (cible === undefined) return;
    e.preventDefault();
    const n = Math.min(10, Math.max(0, cible));
    onChoisir(n);
    cases.current[n]?.focus();
  };
  return (
    <div className="mb-5 rounded-lg bg-surface px-4 py-3">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 mb-2">
        <span className="text-sm font-semibold text-ink">Votre perception · {label}</span>
        <span className="text-sm text-muted">
          {valeur === null ? 'Cliquez sur votre note, de 0 à 10' : <span className="font-bold text-navy">{valeur}/10</span>}
        </span>
      </div>
      {/* Sur téléphone : deux rangées de grandes cases ; à partir de 640 px, une jauge d'un seul tenant. */}
      <div className="grid grid-cols-6 gap-1.5 sm:flex sm:gap-[3px]" role="radiogroup" aria-label={`Votre perception · ${label}`} onMouseLeave={() => setSurvol(null)}>
        {Array.from({ length: 11 }, (_, v) => {
          const remplie = apercu !== null && v <= apercu;
          const choisie = valeur === v;
          return (
            <button
              key={v}
              ref={(el) => { cases.current[v] = el; }}
              type="button"
              role="radio"
              aria-checked={choisie}
              aria-label={String(v)}
              tabIndex={(valeur ?? 0) === v ? 0 : -1}
              onKeyDown={(e) => auClavier(e, v)}
              onClick={() => onChoisir(v)}
              onMouseEnter={() => setSurvol(v)}
              onFocus={() => setSurvol(v)}
              onBlur={() => setSurvol(null)}
              className={`h-11 rounded-md sm:rounded-none sm:flex-1 sm:h-10 sm:first:rounded-l-lg sm:last:rounded-r-lg text-[13px] font-bold transition-colors ${remplie ? 'text-white' : 'bg-white text-muted hover:text-navy'} ${choisie ? 'ring-2 ring-offset-1 ring-navy relative z-10' : ''}`}
              style={remplie
                ? { background: survol !== null && (valeur === null || survol > valeur) ? couleur.light : couleur.DEFAULT, color: survol !== null && (valeur === null || survol > valeur) ? couleur.dark : '#fff' }
                : undefined}
            >
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

export default function DiagnosticPage() {
  const [etat, setEtat] = useState<Etat4>(etatInitial4);
  const [revele, setRevele] = useState(false);
  const router = useRouter();
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authReady = useAppStore((s) => s.authReady);
  const user = useAppStore((s) => s.user);
  const toast = useToast();
  const createDiagnostic = useCreateDiagnostic();
  const analyseRef = useRef<HTMLElement>(null);
  const analyse = useMemo(() => analyser4(etat, OPTIONS), [etat]);

  // Enregistrement, restauration et synthèse PDF (mêmes parcours que l'ancien Diagnostic).
  const [emailOuvert, setEmailOuvert] = useState(false);
  const [modeEmail, setModeEmail] = useState<ModeEmail>('save');
  const [restauration, setRestauration] = useState(false);
  const [envoiPdf, setEnvoiPdf] = useState(false);
  const [noticePdf, setNoticePdf] = useState('');
  // Email connu pendant la session (bilan restauré ou déjà enregistré) : on ne le redemande pas.
  const [emailCourant, setEmailCourant] = useState<string | null>(null);
  const emailConnu = isAuthenticated && user?.email ? user.email : emailCourant;
  // Piliers dépliés à la main, en plus du pilier en cours de saisie.
  const [ouverts, setOuverts] = useState<PillarId[]>([]);
  const estFait = (id: PillarId) => (etat.seul && id === 'team') || pilierComplet4(etat.piliers[id]);
  const courant = piliersAttendus4(etat).find((id) => !estFait(id)) ?? null;
  const deplie = (id: PillarId) => id === courant || ouverts.includes(id);
  const basculer = (id: PillarId) => setOuverts((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
  const carteActive = useRef<HTMLElement>(null);
  const titreActif = useRef<HTMLHeadingElement>(null);
  const boutonReveler = useRef<HTMLButtonElement>(null);
  const derniereQuestion = useRef<HTMLFieldSetElement>(null);
  const premierRendu = useRef(true);
  const nbVisibles = courant ? nbReponses4(etat.piliers[courant]) + (etat.piliers[courant].perception === null ? 0 : 1) : 0;

  // Quand on passe au pilier suivant, on l'amène en haut de l'écran.
  useEffect(() => {
    if (premierRendu.current) { premierRendu.current = false; return; }
    carteActive.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    // Le pilier qu'on vient de finir se replie : le focus clavier passe au suivant, ou au bouton d'analyse.
    (courant ? titreActif.current : boutonReveler.current)?.focus({ preventScroll: true });
  }, [courant]);
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
    setOuverts([]);
    setRevele(false);
    setNoticePdf('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /** Charge un bilan enregistré et affiche directement son analyse. */
  const chargerBilan = useCallback((responses: unknown): boolean => {
    const charge = etat4Depuis(responses);
    if (!charge) return false;
    setEtat(charge);
    setOuverts([]);
    setRevele(true);
    setTimeout(() => analyseRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
    return true;
  }, []);

  // Rouvrir un bilan enregistré, depuis « Mes bilans » (?bilan=<id>). Un bilan de l'ancienne version part dans /diagnostic-classique.
  const bilanDemande = typeof router.query.bilan === 'string' ? router.query.bilan : null;
  const bilanCharge = useRef<string | null>(null);
  useEffect(() => {
    if (!bilanDemande || bilanCharge.current === bilanDemande) return;
    bilanCharge.current = bilanDemande;
    DiagnosticsService.getById(bilanDemande)
      .then((record) => {
        if (record?.type === 'organisation' && record.version !== 4) {
          router.replace(`/diagnostic-classique?bilan=${record.id}`);
        } else if (record?.type === 'organisation' && chargerBilan(record.responses)) {
          setEmailCourant(record.email);
          toast.info('Bilan rouvert.');
        } else {
          toast.error('Ce bilan est introuvable.');
        }
      })
      .catch(() => toast.error('Ce bilan n’a pas pu être rouvert.'));
  }, [bilanDemande, chargerBilan, router, toast]);

  const enregistrer = useCallback((email: string | null, accepteRecontact = false) => createDiagnostic.mutateAsync({
    userId: user?.id ?? null, email, scores: scoresBilan4(analyse), responses: reponsesBilan4(etat), accepteRecontact,
  }), [createDiagnostic, user, analyse, etat]);

  // Synthèse PDF : le bilan est enregistré, puis envoyé par email avec le PDF (le serveur recalcule l'analyse).
  const envoyerPdf = useCallback(async (email: string, accepteRecontact = false) => {
    try {
      await enregistrer(email, accepteRecontact);
    } catch {
      toast.error('Impossible d’enregistrer le bilan.');
      return;
    }
    setEmailCourant(email);
    setEmailOuvert(false);
    setEnvoiPdf(true);
    try {
      const res = await fetch('/api/send-diagnostic', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, responses: reponsesBilan4(etat) }),
      });
      if (!res.ok) {
        let detail = '';
        try { detail = (await res.json())?.error ?? ''; } catch { /* réponse non JSON */ }
        throw new Error(detail);
      }
      setNoticePdf(`Votre synthèse PDF a été envoyée à ${email}.`);
      toast.success('Synthèse PDF envoyée par email.');
    } catch (err) {
      setNoticePdf('');
      toast.error(`L’envoi de la synthèse PDF a échoué.${err instanceof Error && err.message ? ` ${err.message}` : ''}`);
    } finally {
      setEnvoiPdf(false);
    }
  }, [enregistrer, etat, toast]);

  // Enregistrer : compte connecté ou email déjà connu → directement ; sinon on demande l'email.
  const surEnregistrer = () => {
    if (!analyse.complet) return;
    if (isAuthenticated && user) {
      enregistrer(user.email ?? null)
        .then(() => toast.success('Diagnostic enregistré dans votre espace.'))
        .catch(() => toast.error('Impossible d’enregistrer le diagnostic.'));
    } else if (emailCourant) {
      enregistrer(emailCourant)
        .then(() => toast.success('Bilan enregistré. Vous recevrez votre synthèse par email.'))
        .catch(() => toast.error('Impossible d’enregistrer le bilan.'));
    } else {
      setModeEmail('save');
      setEmailOuvert(true);
    }
  };
  const surPdf = () => {
    if (!analyse.complet) return;
    if (emailConnu) envoyerPdf(emailConnu);
    else { setModeEmail('pdf'); setEmailOuvert(true); }
  };
  const surRestaurer = () => { setModeEmail('restore'); setEmailOuvert(true); };

  const surEmail = async (email: string, accepteRecontact = false) => {
    if (modeEmail === 'restore') {
      setRestauration(true);
      try {
        const record = await DiagnosticsService.getLatestByEmail(email);
        if (!record) { toast.info('Aucun bilan trouvé pour cet email.'); return; }
        if (record.version !== 4) {
          toast.info('Votre dernier bilan a été fait avec l’ancienne version du diagnostic : restaurez-le depuis /diagnostic-classique.');
          return;
        }
        if (!chargerBilan(record.responses)) { toast.error('Impossible de restaurer le bilan.'); return; }
        setEmailCourant(email);
        setEmailOuvert(false);
        toast.success('Bilan restauré.');
      } catch {
        toast.error('Impossible de restaurer le bilan.');
      } finally {
        setRestauration(false);
      }
      return;
    }
    if (modeEmail === 'pdf') { envoyerPdf(email, accepteRecontact); return; }
    try {
      await enregistrer(email, accepteRecontact);
      setEmailCourant(email);
      setEmailOuvert(false);
      toast.success('Bilan enregistré. Vous recevrez votre synthèse par email.');
    } catch {
      toast.error('Impossible d’enregistrer le bilan.');
    }
  };

  return (
    <AppShell title="Diagnostic" topbarTitle="Bienvenue sur OSKAR" topbarSubtitle="Votre vision. Vos objectifs. Vos actions."
      topbarActions={!authReady ? null : isAuthenticated ? <UserMenu /> : (
        <>
          <button onClick={() => ouvrirConnexion('login' as OngletAuth)} className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light transition-colors">
            Connexion
          </button>
          <button onClick={() => ouvrirConnexion('register' as OngletAuth)} className="px-5 py-2.5 bg-teal text-navy-dark text-sm font-bold rounded-lg shadow-sm hover:bg-teal-dark hover:-translate-y-0.5 transition-all">
            Commencer gratuitement →
          </button>
        </>
      )}>
      <header className="mb-8 max-w-3xl">
        <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">Diagnostic Oskar · 5 piliers · 20 pratiques</div>
        <h1 className="text-[28px] leading-tight font-extrabold text-navy">Où en est votre entreprise selon vous&nbsp;?</h1>
        <p className="text-[15px] text-muted mt-2 leading-relaxed">Un pilier à la fois : votre perception d’abord, puis quatre pratiques.
          Votre perception ne modifie pas le score de pratiques ; leur écart ouvre une discussion.</p>
      </header>

      {noticePdf && (
        <div role="status" aria-live="polite" className="mb-6 rounded-lg border border-teal/40 bg-teal-light px-4 py-3 text-sm text-navy">{noticePdf}</div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div className="min-w-0">
          {PILLARS.map((pilier, index) => {
            const saisie = etat.piliers[pilier.id];
            const couleur = COULEURS_PILIERS[pilier.id];
            const contenu = PILIERS4[pilier.id];
            const note = note4(saisie, OPTIONS);
            const provisoire = noteProvisoire(saisie);
            const ecarte = etat.seul && pilier.id === 'team';
            const entete = <div className="text-[11px] font-bold uppercase tracking-wider" style={{ color: couleur.dark }}>{index + 1}/5 · {pilier.module}</div>;

            // Pilier à venir : une ligne discrète, pour garder le fil sans charger l'écran.
            if (!deplie(pilier.id) && !estFait(pilier.id)) {
              return (
                <div key={pilier.id} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-card border border-dashed border-line bg-white/60 px-5 py-3 mb-3 text-sm text-muted">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: couleur.DEFAULT, opacity: 0.45 }} aria-hidden />
                  <span className="font-semibold text-navy/70">{index + 1}/5 · {pilier.module}</span>
                  <span className="text-xs">{contenu.question}</span>
                </div>
              );
            }

            // Pilier rempli : replié en une ligne, rouvrable.
            if (!deplie(pilier.id)) {
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
                      ? <><span className="text-lg font-extrabold text-navy">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></span>
                        <span className="text-xs text-muted">sur {nbExploitables4(saisie)}/4 pratiques</span><Pastille niveau={niveau4(note)} /></>
                      : <span className="text-xs font-semibold text-muted">{saisie.reponses.every((r) => r === 'na') ? 'Non applicable' : 'À clarifier'}</span>)}
                    <button type="button" onClick={() => basculer(pilier.id)} aria-expanded={false}
                      className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-line text-navy hover:border-navy hover:bg-surface transition-colors">
                      <ChevronDown className="h-4 w-4" aria-hidden /><span className="sr-only">Déplier {pilier.label} pour le modifier</span>
                    </button>
                  </div>
                </div>
              );
            }

            // Pilier en cours : la perception, puis les pratiques une à une.
            const premiereVide = saisie.reponses.findIndex((r) => r === null);
            const visibles = pilier.id !== courant ? 4 : saisie.perception === null ? 0 : premiereVide === -1 ? 4 : premiereVide + 1;
            return (
              <article key={pilier.id} ref={pilier.id === courant ? carteActive : undefined} className="bg-white rounded-card border border-line shadow-card p-5 mb-4 scroll-mt-24 animate-fade-in" style={{ borderTop: `3px solid ${couleur.DEFAULT}` }}>
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                  <div>
                    {entete}
                    <h2 ref={pilier.id === courant ? titreActif : undefined} tabIndex={-1} className="text-lg font-bold text-navy leading-snug mt-0.5 focus:outline-none">{contenu.question}</h2>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {!ecarte && (note !== null ? (
                      <div className="sm:text-right">
                        <div className="text-2xl font-extrabold text-navy leading-none">{fmt(note)}<span className="text-xs font-normal text-muted"> /10</span></div>
                        <div className="mt-1.5"><Pastille niveau={niveau4(note)} /></div>
                        <div className="text-[11px] text-muted mt-1">sur {nbExploitables4(saisie)}/4 pratiques</div>
                      </div>
                    ) : nbReponses4(saisie) === 4 ? (
                      <span className="rounded-full bg-surface px-2.5 py-1 text-xs font-bold text-muted">{saisie.reponses.every((r) => r === 'na') ? 'Non applicable' : 'Note suspendue · à clarifier'}</span>
                    ) : nbReponses4(saisie) > 0 && (
                      // Le score avance au fil des réponses ; son statut est aussi visible que le chiffre.
                      <div className="sm:text-right">
                        <span className="inline-block rounded-full border border-dashed border-navy/30 px-2.5 py-1 text-xs font-bold text-navy">Provisoire · {nbReponses4(saisie)}/4 répondues</span>
                        {provisoire !== null && <div className="text-xl font-extrabold text-navy/60 leading-none mt-1.5">{fmt(provisoire)}<span className="text-xs font-normal text-muted"> /10</span></div>}
                      </div>
                    ))}
                    {pilier.id !== courant && (
                      <button type="button" onClick={() => basculer(pilier.id)} aria-expanded
                        className="w-8 h-8 inline-flex items-center justify-center rounded-full border border-line text-navy hover:border-navy hover:bg-surface transition-colors">
                        <ChevronUp className="h-4 w-4" aria-hidden /><span className="sr-only">Replier {pilier.label}</span>
                      </button>
                    )}
                  </div>
                </div>
                {pilier.id === 'team' && (
                  <label className="flex items-center gap-2.5 mb-4 text-sm text-muted cursor-pointer">
                    <input type="checkbox" checked={etat.seul} onChange={(e) => { const seul = e.target.checked; setEtat((prev) => ({ ...prev, seul })); if (seul) setOuverts((prev) => prev.filter((x) => x !== 'team')); }}
                      className="h-4 w-4 rounded border-line" style={{ accentColor: couleur.DEFAULT }} />
                    Je travaille seul : passer ce pilier
                  </label>
                )}
                {!ecarte && <>
                  <JaugePerception
                    label={pilier.label}
                    couleur={couleur}
                    valeur={saisie.perception}
                    onChoisir={(v) => noter(pilier.id, v)}
                  />
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
                  {saisie.reponses.includes('inconnu') && <p className="text-xs text-muted mt-2">« Je ne sais pas » n’entre pas dans la note : c’est un point à clarifier. Un pilier se note à partir de {COUVERTURE_MINIMALE} pratiques renseignées.</p>}
                  {pilier.id !== courant && (
                    <button type="button" onClick={() => basculer(pilier.id)} className="mt-4 inline-flex items-center gap-2 px-4 py-2.5 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light">
                      <ChevronUp className="h-4 w-4" aria-hidden />Replier ce pilier
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
              <p className="text-xs text-white/70 mt-3">Établi sur {analyse.nbExploitables} pratiques sur {analyse.nbAttendu / 5 * 4}</p>
            </> : <p className="text-sm text-white/70 mt-1">{analyse.complet
              ? `Score global indisponible : au moins un pilier a moins de ${COUVERTURE_MINIMALE} pratiques renseignées. Clarifiez d’abord les réponses « Je ne sais pas » ou vérifiez les « Non applicable ».`
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
              : <p className="text-sm text-muted py-4">Le radar apparaît quand chaque pilier a une note. Un pilier à clarifier n’y est jamais tracé à zéro.</p>}
          </section>
          <button ref={boutonReveler} type="button" disabled={!analyse.complet} onClick={reveler}
            className="w-full inline-flex items-center justify-center gap-2 px-4 py-3.5 bg-teal text-navy-dark text-sm font-extrabold rounded-lg shadow-sm hover:bg-teal-dark disabled:opacity-40 disabled:cursor-not-allowed">
            <Sparkles className="h-4 w-4" aria-hidden />{analyse.complet ? 'Révéler mon analyse' : `Encore ${analyse.nbAttendu - analyse.nbReponses} réponse${analyse.nbAttendu - analyse.nbReponses > 1 ? 's' : ''} à renseigner`}
          </button>
          {/* Enregistrer / Restaurer / PDF : comme dans l'ancien Diagnostic. */}
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" onClick={surEnregistrer} disabled={!analyse.complet || createDiagnostic.isPending}
              className="justify-center inline-flex items-center gap-2 px-3 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg transition-all hover:border-navy disabled:opacity-35 disabled:cursor-not-allowed">
              {createDiagnostic.isPending && !emailOuvert ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <Save className="h-4 w-4" aria-hidden />}
              Enregistrer
            </button>
            <button type="button" onClick={surRestaurer} disabled={restauration}
              className="justify-center inline-flex items-center gap-2 px-3 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg transition-all hover:border-navy disabled:opacity-35 disabled:cursor-not-allowed">
              {restauration ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <RotateCcw className="h-4 w-4" aria-hidden />}
              Restaurer
            </button>
          </div>
          <button type="button" onClick={surPdf} disabled={!analyse.complet || envoiPdf}
            className="w-full justify-center inline-flex items-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg transition-all hover:border-navy disabled:opacity-35 disabled:cursor-not-allowed">
            {envoiPdf ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden /> : <FileText className="h-4 w-4" aria-hidden />}
            Télécharger la synthèse PDF
          </button>
          <button type="button" onClick={recommencer} className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-muted border border-line rounded-lg hover:border-navy hover:text-navy">
            Recommencer
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
              {/* Le titre nomme le pilier ; le décompte des réponses n'est qu'un rappel, en petit. */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <Target className="h-5 w-5 text-navy shrink-0" aria-hidden />
                <h2 className="text-xl font-extrabold text-navy leading-snug">Priorité proposée, à confirmer : {analyse.priorite.label}</h2>
                <Pastille niveau={analyse.priorite.niveau}>{fmt(analyse.priorite.note)}/10</Pastille>
              </div>
              <p className="text-xs text-muted mt-1.5">{analyse.priorite.titre}</p>
              <p className="text-sm text-ink mt-3">{analyse.priorite.texte}</p>
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
              <button type="button" onClick={surPdf} disabled={envoiPdf} className="inline-flex items-center gap-2 px-5 py-3 border border-white/25 text-white text-sm font-bold rounded-lg hover:border-white/60 disabled:opacity-50">
                <FileText className="h-4 w-4" aria-hidden />Recevoir la synthèse PDF
              </button>
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
            « Non applicable » et « Je ne sais pas » sont exclus ; « Je ne sais pas » reste signalé à clarifier. Un pilier n’est noté qu’à partir de deux pratiques renseignées (Oui, En partie ou Non) ; sa note affiche sur combien.
            Sans réponse, le questionnaire reste incomplet. « En partie » indique une pratique mise en œuvre partiellement ou irrégulièrement.</p>
          <p className="mt-2">Le score global est la moyenne de toutes les pratiques renseignées, uniquement si chaque pilier peut être noté : un pilier noté sur deux pratiques pèse moitié moins qu’un pilier noté sur quatre.
            Les niveaux sont : Fragile en dessous de 4, En construction de 4 à moins de 7, Solide à partir de 7.
            Par convention, un pilier Fragile empêche le niveau global Solide. Ces repères ne constituent pas une validation de la performance.</p>
        </details>
      </section>
      <EmailPromptModal
        open={emailOuvert}
        title={modeEmail === 'restore' ? 'Restaurer mon bilan' : modeEmail === 'pdf' ? 'Recevoir la synthèse PDF' : 'Enregistrer mon bilan'}
        description={modeEmail === 'restore'
          ? 'Saisissez l’email utilisé lors de votre bilan pour le restaurer.'
          : modeEmail === 'pdf'
            ? 'Indiquez votre email pour recevoir votre synthèse PDF et conserver votre bilan.'
            : 'Indiquez votre email pour conserver votre bilan et recevoir votre synthèse.'}
        submitLabel={modeEmail === 'restore' ? 'Restaurer' : modeEmail === 'pdf' ? 'Envoyer' : 'Enregistrer'}
        defaultEmail={user?.email ?? emailCourant ?? ''}
        demanderConsentement={modeEmail !== 'restore'}
        loading={modeEmail === 'restore' ? restauration : createDiagnostic.isPending || envoiPdf}
        onSubmit={surEmail}
        onClose={() => setEmailOuvert(false)}
      />
    </AppShell>
  );
}
