import React, { useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import { AlertCircle, AlertTriangle, Check } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthModal, type AuthModalTab } from '@/components/layout/AuthModal';
import { UserMenu } from '@/components/layout/UserMenu';
import { PresetSelector } from '@/components/productFit/PresetSelector';
import { PersonaFormCard } from '@/components/productFit/PersonaFormCard';
import { ProductFitSynthesis } from '@/components/productFit/ProductFitSynthesis';
import { EMPTY_PROJECT } from '@/lib/productFit/presets';
import { calculateProductFitAnalysis } from '@/lib/productFit/scoring';
import type { PresetCase, ProductFitProject, PersonaEvaluation } from '@/lib/productFit/types';
import { useAppStore } from '@/store/useAppStore';

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
  const { authReady, isAuthenticated } = useAppStore();

  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [project, setProject] = useState<ProductFitProject>(() => EMPTY_PROJECT);

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthModalTab>('register');
  const openAuth = useCallback((tab: AuthModalTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const analysis = useMemo(() => calculateProductFitAnalysis(project), [project]);

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
        <title>Potentiel Produit — Votre produit répond-il à un vrai besoin ? | OsKaR</title>
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
          <div className="flex items-center gap-2.5">
            <LegendPill icon={<AlertCircle className="h-3.5 w-3.5" aria-hidden />} label="0–3 Besoin faible" bg="#f0f2ff" border="#e2e4f0" />
            <LegendPill icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />} label="4–6 À préciser" bg="#fffbeb" border="#fde68a" />
            <LegendPill icon={<Check className="h-3.5 w-3.5" aria-hidden />} label="7–10 Besoin fort" bg="#e6faf7" border="#a7f3e4" />
          </div>
        </header>

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
                    placeholder="Mon produit"
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
                    placeholder="Aider les familles à garder la mémoire de leurs proches"
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
          <ProductFitSynthesis analysis={analysis} />
        </div>

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
