import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import { AlertCircle, AlertTriangle, Check } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthModal, type AuthModalTab } from '@/components/layout/AuthModal';
import { UserMenu } from '@/components/layout/UserMenu';
import { PillarCard } from '@/components/diagnostic/PillarCard';
import { SynthesisPanel } from '@/components/diagnostic/SynthesisPanel';
import { AnalysisModal } from '@/components/diagnostic/AnalysisModal';
import { EmailPromptModal } from '@/components/diagnostic/EmailPromptModal';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { useCreateDiagnostic } from '@/hooks/useDiagnostics';
import { DiagnosticsService } from '@/services/db/diagnostics';
import {
  PILLARS,
  createInitialState,
  buildAnalysis,
  type DiagnosticState,
  type AnalysisResult,
  type PillarId,
} from '@/lib/diagnostic';

/** Mode de la modale de saisie d'email (invité). */
type EmailPromptMode = 'save' | 'pdf' | 'restore';

const DiagnosticPage: React.FC = () => {
  const router = useRouter();
  const [state, setState] = useState<DiagnosticState>(createInitialState);

  const user = useAppStore((s) => s.user);
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const authReady = useAppStore((s) => s.authReady);
  const toast = useToast();
  const createDiagnostic = useCreateDiagnostic();

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthModalTab>('register');

  // Rouvrir un bilan enregistré, appelé depuis « Mes bilans » (?bilan=<id>).
  const bilanDemande = typeof router.query.bilan === 'string' ? router.query.bilan : null;
  const bilanChargeRef = useRef<string | null>(null);

  const [analysisOpen, setAnalysisOpen] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [pdfNotice, setPdfNotice] = useState('');
  const analysisTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Modale de saisie d'email pour les invités (enregistrement / envoi PDF)
  const [emailPromptOpen, setEmailPromptOpen] = useState(false);
  const [emailPromptMode, setEmailPromptMode] = useState<EmailPromptMode>('save');
  const [restoring, setRestoring] = useState(false);
  const [sendingPdf, setSendingPdf] = useState(false);
  // Email connu pour la session courante (après une restauration ou un enregistrement invité)
  // → permet de réenregistrer sans redemander l'email.
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  useEffect(() => {
    if (!bilanDemande || bilanChargeRef.current === bilanDemande) return;
    bilanChargeRef.current = bilanDemande;
    DiagnosticsService.getById(bilanDemande)
      .then((record) => {
        if (record?.type === 'organisation') {
          setState(record.responses);
          setCurrentEmail(record.email);
          toast.info('Bilan rouvert.');
        } else {
          toast.error('Ce bilan est introuvable.');
        }
      })
      .catch(() => toast.error('Ce bilan n’a pas pu être rouvert.'));
  }, [bilanDemande, toast]);

  const openAuth = useCallback((tab: AuthModalTab) => { setAuthTab(tab); setAuthOpen(true); }, []);

  const setSlider = useCallback((id: PillarId, value: number) => {
    setState((prev) => ({ ...prev, [id]: { ...prev[id], slider: value, touched: true } }));
  }, []);

  const toggleCheck = useCallback((id: PillarId, index: number) => {
    setState((prev) => {
      const checks = [...prev[id].checks] as [boolean, boolean, boolean];
      checks[index] = !checks[index];
      return { ...prev, [id]: { ...prev[id], checks, touched: true } };
    });
  }, []);

  const handleAnalyse = useCallback(() => {
    setAnalysisOpen(true);
    setAnalysisLoading(true);
    setAnalysisResult(null);
    if (analysisTimer.current) clearTimeout(analysisTimer.current);
    analysisTimer.current = setTimeout(() => {
      setAnalysisResult(buildAnalysis(state));
      setAnalysisLoading(false);
    }, 700);
  }, [state]);

  // Email connu sans saisie : compte connecté → email du compte ; sinon email courant
  // (session restaurée ou bilan déjà enregistré pendant la session).
  const knownEmail = (isAuthenticated && user?.email) ? user.email : currentEmail;

  // Enregistre le bilan rattaché à l'email, puis envoie le PDF par email (Resend).
  const sendPdf = useCallback((email: string, result: AnalysisResult) => {
    createDiagnostic.mutate(
      { userId: user?.id ?? null, email, scores: result, responses: state },
      {
        onSuccess: async () => {
          setCurrentEmail(email);
          setEmailPromptOpen(false);
          setSendingPdf(true);
          try {
            const res = await fetch('/api/send-diagnostic', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ email, scores: result }),
            });
            if (!res.ok) {
              let detail = '';
              try { detail = (await res.json())?.error ?? ''; } catch { /* réponse non JSON */ }
              throw new Error(detail);
            }
            setPdfNotice(`Votre synthèse PDF a été envoyée à ${email}.`);
            toast.success('Synthèse PDF envoyée par email.');
          } catch (err) {
            setPdfNotice('');
            const detail = err instanceof Error && err.message ? ` ${err.message}` : '';
            toast.error(`L'envoi de la synthèse PDF a échoué.${detail}`);
          } finally {
            setSendingPdf(false);
          }
        },
        onError: () => toast.error("Impossible d'enregistrer le bilan."),
      }
    );
  }, [state, user, createDiagnostic, toast]);

  // Enregistrer : connecté → sauvegarde directe ; email connu → réutilise sans redemander ;
  // invité sans email → saisie email.
  const handleSave = useCallback(() => {
    const result = buildAnalysis(state);
    if (!result) { toast.error('Évaluez au moins un pilier avant d\'enregistrer.'); return; }
    if (isAuthenticated && user) {
      createDiagnostic.mutate(
        { userId: user.id, email: user.email ?? null, scores: result, responses: state },
        {
          onSuccess: () => toast.success('Diagnostic enregistré dans votre espace.'),
          onError: () => toast.error("Impossible d'enregistrer le diagnostic."),
        }
      );
    } else if (currentEmail) {
      createDiagnostic.mutate(
        { userId: null, email: currentEmail, scores: result, responses: state },
        {
          onSuccess: () => toast.success('Bilan enregistré. Vous recevrez votre synthèse par email.'),
          onError: () => toast.error("Impossible d'enregistrer le bilan."),
        }
      );
    } else {
      setEmailPromptMode('save');
      setEmailPromptOpen(true);
    }
  }, [state, isAuthenticated, user, currentEmail, createDiagnostic, toast]);

  // Restaurer : on demande l'email utilisé lors du bilan (modèle invité, sans compte)
  const handleRestore = useCallback(() => {
    setEmailPromptMode('restore');
    setEmailPromptOpen(true);
  }, []);

  // Télécharger le PDF : email connu → envoi direct ; sinon saisie email.
  const handleDownloadPdf = useCallback(() => {
    const result = buildAnalysis(state);
    if (!result) { toast.error('Évaluez au moins un pilier avant de demander le PDF.'); return; }
    if (knownEmail) {
      sendPdf(knownEmail, result);
    } else {
      setEmailPromptMode('pdf');
      setEmailPromptOpen(true);
    }
  }, [state, knownEmail, sendPdf, toast]);

  // Soumission de la modale email (restauration, enregistrement invité ou envoi PDF)
  const handleEmailSubmit = useCallback(async (email: string) => {
    // Restauration : on récupère le dernier bilan associé à cet email
    if (emailPromptMode === 'restore') {
      setRestoring(true);
      try {
        const record = await DiagnosticsService.getLatestByEmail(email);
        if (!record) { toast.info('Aucun bilan trouvé pour cet email.'); return; }
        setState(record.responses);
        setCurrentEmail(email);
        setEmailPromptOpen(false);
        toast.success('Bilan restauré.');
      } catch {
        toast.error('Impossible de restaurer le bilan.');
      } finally {
        setRestoring(false);
      }
      return;
    }

    const result = buildAnalysis(state);
    if (!result) return;

    // PDF : enregistrement + envoi email
    if (emailPromptMode === 'pdf') {
      sendPdf(email, result);
      return;
    }

    // Enregistrement simple rattaché à cet email
    createDiagnostic.mutate(
      { userId: user?.id ?? null, email, scores: result, responses: state },
      {
        onSuccess: () => {
          setCurrentEmail(email);
          setEmailPromptOpen(false);
          toast.success('Bilan enregistré. Vous recevrez votre synthèse par email.');
        },
        onError: () => toast.error('Impossible d\'enregistrer le bilan.'),
      }
    );
  }, [state, user, emailPromptMode, createDiagnostic, sendPdf, toast]);

  return (
    <AppShell
      title="Diagnostic"
      topbarTitle="Bienvenue sur OSKAR"
      topbarSubtitle="Plateforme de productivité"
      topbarActions={
        !authReady ? null : isAuthenticated ? (
          <UserMenu />
        ) : (
          <>
            <button onClick={() => openAuth('login')} className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light transition-colors">
              Connexion
            </button>
            <button onClick={() => openAuth('register')} className="px-5 py-2.5 bg-teal text-navy-dark text-sm font-bold rounded-lg shadow-sm hover:bg-teal-dark hover:-translate-y-0.5 transition-all">
              Commencer gratuitement →
            </button>
          </>
        )
      }
    >
      {/* En-tête */}
      <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">Outil de pilotage</div>
          <h1 className="text-2xl font-extrabold text-navy">Diagnostic de maturité Oskar</h1>
        </div>
        <div className="flex items-center gap-2.5">
          <LegendPill icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />} label="0–4 Fragile" bg="#f0f2ff" border="#e2e4f0" />
          <LegendPill icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />} label="5–7 En construction" bg="#fffbeb" border="#fde68a" />
          <LegendPill icon={<Check className="h-3.5 w-3.5" aria-hidden />} label="8–10 Solide" bg="#e6faf7" border="#a7f3e4" />
        </div>
      </header>

      {pdfNotice && (
        <div role="status" aria-live="polite" className="mb-6 rounded-lg border border-teal/40 bg-teal-light px-4 py-3 text-sm text-navy">
          {pdfNotice}
        </div>
      )}

      {/* Grille : piliers / synthèse */}
      <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
        <div>
          {PILLARS.map((pillar) => (
            <PillarCard
              key={pillar.id}
              pillar={pillar}
              input={state[pillar.id]}
              onSliderChange={(v) => setSlider(pillar.id, v)}
              onToggleCheck={(i) => toggleCheck(pillar.id, i)}
              onOpenModule={() => openAuth('register')}
            />
          ))}
        </div>
        <SynthesisPanel
          state={state}
          onAnalyse={handleAnalyse}
          onSave={handleSave}
          onRestore={handleRestore}
          onDownloadPdf={handleDownloadPdf}
          saving={createDiagnostic.isPending && isAuthenticated && !emailPromptOpen}
          restoring={restoring}
        />
      </div>

      <AnalysisModal
        open={analysisOpen}
        loading={analysisLoading}
        result={analysisResult}
        onClose={() => setAnalysisOpen(false)}
        onStartModule={() => { setAnalysisOpen(false); openAuth('register'); }}
      />

      <EmailPromptModal
        open={emailPromptOpen}
        title={
          emailPromptMode === 'restore'
            ? 'Restaurer mon bilan'
            : emailPromptMode === 'pdf'
              ? 'Recevoir la synthèse PDF'
              : 'Enregistrer mon bilan'
        }
        description={
          emailPromptMode === 'restore'
            ? 'Saisissez l\'email utilisé lors de votre bilan pour le restaurer.'
            : emailPromptMode === 'pdf'
              ? 'Indiquez votre email pour recevoir votre synthèse PDF et conserver votre bilan.'
              : 'Indiquez votre email pour conserver votre bilan et recevoir votre synthèse.'
        }
        submitLabel={
          emailPromptMode === 'restore' ? 'Restaurer' : emailPromptMode === 'pdf' ? 'Envoyer' : 'Enregistrer'
        }
        defaultEmail={user?.email ?? currentEmail ?? ''}
        loading={
          emailPromptMode === 'restore'
            ? restoring
            : emailPromptMode === 'pdf'
              ? createDiagnostic.isPending || sendingPdf
              : createDiagnostic.isPending
        }
        onSubmit={handleEmailSubmit}
        onClose={() => setEmailPromptOpen(false)}
      />

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
    </AppShell>
  );
};

const LegendPill: React.FC<{ icon: React.ReactNode; label: string; bg: string; border: string }> = ({ icon, label, bg, border }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-muted" style={{ background: bg, border: `1px solid ${border}` }}>
    {icon} {label}
  </span>
);

export default DiagnosticPage;
