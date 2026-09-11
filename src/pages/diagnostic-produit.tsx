import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AlertCircle, AlertTriangle, Check } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthModal, type AuthModalTab } from '@/components/layout/AuthModal';
import { UserMenu } from '@/components/layout/UserMenu';
import { EmailPromptModal } from '@/components/diagnostic/EmailPromptModal';
import { PresetSelector } from '@/components/productFit/PresetSelector';
import { PersonaFormCard } from '@/components/productFit/PersonaFormCard';
import { ProductFitSynthesis } from '@/components/productFit/ProductFitSynthesis';
import { EMPTY_PROJECT } from '@/lib/productFit/presets';
import { calculateProductFitAnalysis, SEUIL_FAIBLE, SEUIL_REEL, SEUIL_FORT } from '@/lib/productFit/scoring';
import type { PresetCase, ProductFitProject, PersonaEvaluation } from '@/lib/productFit/types';
import { useAppStore } from '@/store/useAppStore';
import { useToast } from '@/hooks/useToast';
import { useExemples } from '@/hooks/useExemples';
import { useCreateDiagnostic } from '@/hooks/useDiagnostics';
import { DiagnosticsService } from '@/services/db/diagnostics';
import type { DiagnosticState, AnalysisResult } from '@/lib/diagnostic';

/*
 * Bilan « Potentiel Produit ».
 *
 * Même mise en page que la page Diagnostic : en-tête avec surtitre, titre et
 * légende des niveaux, puis une grille `1fr / 340px` — la saisie à gauche, le
 * résultat qui suit le défilement à droite.
 *
 * Le vocabulaire est celui de tout le monde : on décrit trois personnes, on dit
 * à quel point le problème les gêne, et on découvre par laquelle commencer.
 */

const DiagnosticProduitPage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();
  const toast = useToast();
  // Exemples adaptés au métier déclaré ; génériques tant qu'il n'est pas choisi.
  const exemples = useExemples();
  const enregistrerBilan = useCreateDiagnostic();

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [project, setProject] = useState<ProductFitProject>(() => EMPTY_PROJECT);

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthModalTab>('register');
  const openAuth = useCallback((tab: AuthModalTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const analysis = useMemo(() => calculateProductFitAnalysis(project), [project]);

  /* ── Conserver le bilan : le projet fait office de réponses, l'analyse de scores ── */
  const conserver = useCallback(
    async (email: string | null, accepteRecontact = false) => {
      await enregistrerBilan.mutateAsync({
        userId: user?.id ?? null,
        email,
        accepteRecontact,
        type: 'produit',
        scores: analysis as unknown as AnalysisResult,
        responses: project as unknown as DiagnosticState,
      });
    },
    [analysis, project, user, enregistrerBilan]
  );

  const [avisEnregistrement, setAvisEnregistrement] = useState('');
  const enregistrerPourMonCompte = useCallback(async () => {
    try {
      await conserver(user?.email ?? null);
      setAvisEnregistrement('Bilan enregistré. Vous le retrouverez dans « Mes bilans ».');
      toast.success('Bilan enregistré.');
    } catch {
      toast.error("Le bilan n'a pas pu être enregistré.");
    }
  }, [conserver, user, toast]);

  /* ── Rouvrir un bilan enregistré (?bilan=<id>) ── */
  const bilanDemande = typeof router.query.bilan === 'string' ? router.query.bilan : null;
  const bilanChargeRef = useRef<string | null>(null);
  useEffect(() => {
    if (!bilanDemande || bilanChargeRef.current === bilanDemande) return;
    bilanChargeRef.current = bilanDemande;
    DiagnosticsService.getById(bilanDemande)
      .then((record) => {
        if (record?.type === 'produit') {
          setProject(record.responses as unknown as ProductFitProject);
          setSelectedPresetId(null);
          toast.info('Bilan rouvert.');
        } else {
          toast.error('Ce bilan est introuvable.');
        }
      })
      .catch(() => toast.error('Ce bilan n’a pas pu être rouvert.'));
  }, [bilanDemande, toast]);

  /* ── Recevoir la synthèse par email : libre, aucun compte requis ── */
  const [emailOuvert, setEmailOuvert] = useState(false);
  const [envoiEnCours, setEnvoiEnCours] = useState(false);
  const [avisEnvoi, setAvisEnvoi] = useState('');

  const envoyerSynthese = useCallback(
    async (email: string, accepteRecontact = false) => {
      setEnvoiEnCours(true);
      try {
        const res = await fetch('/api/send-product-fit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, analysis, project }),
        });
        if (!res.ok) {
          let detail = '';
          try {
            detail = (await res.json())?.error ?? '';
          } catch {
            /* réponse non JSON */
          }
          throw new Error(detail);
        }
        // Comme sur le Diagnostic : on garde le bilan rattaché à cet email,
        // pour que la personne le retrouve si elle crée un compte ensuite.
        try {
          await conserver(email, accepteRecontact);
        } catch {
          /* l'envoi a réussi : un échec d'enregistrement ne doit pas alarmer */
        }
        setEmailOuvert(false);
        setAvisEnvoi(`Votre synthèse a été envoyée à ${email}.`);
        toast.success('Synthèse envoyée par email.');
      } catch (err) {
        setAvisEnvoi('');
        const detail = err instanceof Error && err.message ? ` ${err.message}` : '';
        toast.error(`L'envoi de la synthèse a échoué.${detail}`);
      } finally {
        setEnvoiEnCours(false);
      }
    },
    [analysis, project, toast, conserver]
  );

  const handleSelectPreset = (preset: PresetCase) => {
    setSelectedPresetId(preset.id);
    setProject(structuredClone(preset.project));
  };

  const handleResetToEmpty = () => {
    setSelectedPresetId(null);
    setProject(structuredClone(EMPTY_PROJECT));
  };

  const handleUpdatePersona = (index: number, updated: PersonaEvaluation) => {
    setProject((prev) => {
      const personas = [...prev.personas];
      personas[index] = updated;
      return { ...prev, personas };
    });
  };

  return (
    <>
      <Head>
        <title>Potentiel Produit — Votre produit répond-il à un vrai besoin ? | Oskar</title>
        <meta
          name="description"
          content="Décrivez trois personnes à qui votre produit pourrait servir, dites à quel point le problème les gêne, et découvrez par laquelle commencer."
        />
      </Head>

      <AppShell
        title="Potentiel Produit"
        topbarTitle="Bienvenue sur OSKAR"
        topbarSubtitle="Plateforme de productivité"
        topbarActions={
          !authReady ? null : isAuthenticated ? (
            <UserMenu />
          ) : (
            <>
              <button
                onClick={() => openAuth('login')}
                className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light transition-colors"
              >
                Connexion
              </button>
              <button
                onClick={() => openAuth('register')}
                className="px-5 py-2.5 bg-teal text-navy-dark text-sm font-bold rounded-lg shadow-sm hover:bg-teal-dark hover:-translate-y-0.5 transition-all"
              >
                Commencer gratuitement →
              </button>
            </>
          )
        }
      >
        {/* En-tête, calqué sur la page Diagnostic */}
        <header className="flex flex-wrap items-end justify-between gap-4 mb-8">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">
              Outil de pilotage
            </div>
            <h1 className="text-2xl font-extrabold text-navy">
              Votre produit répond-il à un vrai besoin&nbsp;?
            </h1>
          </div>
          {/* Les bornes viennent du calcul : la légende ne peut pas mentir. */}
          <div className="flex flex-wrap items-center gap-2.5">
            <LegendPill icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />} label={`0–${SEUIL_FAIBLE} À trouver`} bg="#fff0ea" border="#ffd4c4" />
            <LegendPill icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />} label={`${SEUIL_FAIBLE}–${SEUIL_REEL} Pas indispensable`} bg="#fffbeb" border="#fde68a" />
            <LegendPill icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />} label={`${SEUIL_REEL}–${SEUIL_FORT} Besoin réel`} bg="#e0f2fe" border="#bae6fd" />
            <LegendPill icon={<Check className="h-3.5 w-3.5" aria-hidden />} label={`${SEUIL_FORT}–10 Besoin fort`} bg="#e6faf7" border="#a7f3e4" />
          </div>
        </header>

        {(avisEnvoi || avisEnregistrement) && (
          <div role="status" aria-live="polite" className="mb-6 rounded-lg border border-teal/40 bg-teal-light px-4 py-3 text-sm text-navy">
            {avisEnvoi || avisEnregistrement}
          </div>
        )}

        <div className="grid gap-5 lg:grid-cols-[1fr_340px] items-start">
          {/* Saisie */}
          <div>
            <section className="bg-white rounded-card border border-line shadow-card p-5 mb-4">
              <h2 className="text-lg font-bold text-navy mb-1">Votre produit</h2>
              <p className="text-sm text-muted mb-4">
                Deux lignes suffisent. Vous pourrez les modifier à tout moment.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                <div>
                  <label htmlFor="nom-produit" className="block text-sm font-semibold text-ink mb-1.5">
                    Son nom
                  </label>
                  <input
                    id="nom-produit"
                    type="text"
                    value={project.projectName}
                    onChange={(e) => setProject({ ...project, projectName: e.target.value })}
                    placeholder={exemples.produit.nom}
                    className="w-full text-sm text-ink px-3 py-2 rounded-lg border border-line bg-white transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 placeholder:text-muted/60"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="promesse-produit" className="block text-sm font-semibold text-ink mb-1.5">
                    Ce qu&rsquo;il apporte, en une phrase
                  </label>
                  <input
                    id="promesse-produit"
                    type="text"
                    value={project.pitch}
                    onChange={(e) => setProject({ ...project, pitch: e.target.value })}
                    placeholder={exemples.produit.promesse}
                    className="w-full text-sm text-ink px-3 py-2 rounded-lg border border-line bg-white transition-colors focus:border-teal focus:outline-none focus:ring-2 focus:ring-teal/20 placeholder:text-muted/60"
                  />
                </div>
              </div>
            </section>

            <section className="bg-white rounded-card border border-line shadow-card p-5 mb-4">
              <h2 className="text-lg font-bold text-navy mb-1">À qui cela peut-il servir&nbsp;?</h2>
              <p className="text-sm text-muted mb-4">
                Décrivez trois personnes bien réelles. Vous découvrirez laquelle a le plus besoin de
                vous&nbsp;: c&rsquo;est par elle qu&rsquo;il faut commencer.
              </p>
              <PresetSelector
                selectedPresetId={selectedPresetId}
                onSelectPreset={handleSelectPreset}
                onResetToEmpty={handleResetToEmpty}
              />
            </section>

            {project.personas.map((persona, idx) => (
              <PersonaFormCard
                key={persona.id || idx}
                index={idx}
                persona={persona}
                isPriority={analysis.priorityPersona?.personaId === persona.id}
                onChange={(updated) => handleUpdatePersona(idx, updated)}
              />
            ))}
          </div>

          {/* Résultat */}
          <ProductFitSynthesis
            analysis={analysis}
            onRecevoirParEmail={() => setEmailOuvert(true)}
            envoiEnCours={envoiEnCours}
            onEnregistrer={isAuthenticated ? enregistrerPourMonCompte : undefined}
            enregistrementEnCours={enregistrerBilan.isPending}
          />
        </div>

        <EmailPromptModal
          open={emailOuvert}
          title="Recevoir ma synthèse"
          description="Indiquez votre email pour recevoir votre bilan en PDF. Aucun compte n'est nécessaire."
          submitLabel="Envoyer"
          defaultEmail={user?.email ?? ''}
          demanderConsentement
          loading={envoiEnCours}
          onSubmit={envoyerSynthese}
          onClose={() => setEmailOuvert(false)}
        />

        <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} />
      </AppShell>
    </>
  );
};

const LegendPill: React.FC<{ icon: React.ReactNode; label: string; bg: string; border: string }> = ({ icon, label, bg, border }) => (
  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs text-muted" style={{ background: bg, border: `1px solid ${border}` }}>
    {icon} {label}
  </span>
);

export default DiagnosticProduitPage;
