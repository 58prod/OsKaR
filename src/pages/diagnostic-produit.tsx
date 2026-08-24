import React, { useState, useMemo } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Target } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { PresetSelector } from '@/components/productFit/PresetSelector';
import { PersonaFormCard } from '@/components/productFit/PersonaFormCard';
import { ProductFitSynthesis } from '@/components/productFit/ProductFitSynthesis';
import { PRESET_CASES, EMPTY_PROJECT } from '@/lib/productFit/presets';
import { calculateProductFitAnalysis } from '@/lib/productFit/scoring';
import type { PresetCase, ProductFitProject, PersonaEvaluation } from '@/lib/productFit/types';
import { useAppStore } from '@/store/useAppStore';

export default function DiagnosticProduitPage() {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

  // État du projet (saisie vierge par défaut, exemples disponibles au clic)
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [project, setProject] = useState<ProductFitProject>(() => EMPTY_PROJECT);

  // Calcul temps réel de l'analyse
  const analysis = useMemo(() => {
    return calculateProductFitAnalysis(project);
  }, [project]);

  const handleSelectPreset = (preset: PresetCase) => {
    setSelectedPresetId(preset.id);
    setProject(JSON.parse(JSON.stringify(preset.project)));
  };

  const handleResetToEmpty = () => {
    setSelectedPresetId(null);
    setProject(JSON.parse(JSON.stringify(EMPTY_PROJECT)));
  };

  const handleUpdatePersona = (index: number, updated: PersonaEvaluation) => {
    setProject((prev) => {
      const nextPersonas = [...prev.personas];
      nextPersonas[index] = updated;
      return {
        ...prev,
        personas: nextPersonas,
      };
    });
  };

  const topbarActions = !authReady ? null : isAuthenticated ? (
    <UserMenu />
  ) : (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push('/auth/login')}
        className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light transition-colors"
      >
        Connexion
      </button>
      <button
        onClick={() => router.push('/auth/register')}
        className="px-4 py-2 bg-teal text-navy-dark text-sm font-bold rounded-lg shadow-sm hover:bg-teal-dark transition-all"
      >
        Commencer →
      </button>
    </div>
  );

  return (
    <>
      <Head>
        <title>Diagnostic : Quel potentiel pour mon produit ? | OsKaR</title>
        <meta
          name="description"
          content="Évaluez gratuitement le potentiel de votre produit grâce à la formule max(Problème x Urgence x Fréquence)."
        />
      </Head>

      <AppShell
        title="Diagnostic Produit"
        topbarTitle="Quel potentiel pour mon produit ?"
        topbarSubtitle="Évaluez la douleur réelle et trouvez votre cible prioritaire"
        topbarActions={topbarActions}
      >
        <div className="max-w-7xl mx-auto space-y-5 pb-16">
          {/* Barre supérieure compacte : Titre + Presets */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-line shadow-xs">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-black text-navy">
                  Bilan Potentiel Produit
                </h1>
                <span className="text-[11px] font-bold text-teal-dark bg-teal-light px-2.5 py-0.5 rounded-full">
                  max(P × U × F)
                </span>
              </div>
              <p className="text-xs text-muted mt-0.5">
                Ajustez les curseurs pour identifier votre cœur de cible (Early Adopter) et mesurer l'intensité du besoin.
              </p>
            </div>

            <PresetSelector
              selectedPresetId={selectedPresetId}
              onSelectPreset={handleSelectPreset}
              onResetToEmpty={handleResetToEmpty}
            />
          </div>

          {/* Grille principale 2 colonnes (Option A) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            {/* Colonne gauche : Projet & Saisie des 3 Personas */}
            <div className="lg:col-span-7 space-y-4">
              {/* Saisie rapide du projet */}
              <div className="bg-white p-4 rounded-2xl border border-line shadow-xs grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[11px] font-bold text-navy mb-1">
                    Nom du projet
                  </label>
                  <input
                    type="text"
                    value={project.projectName}
                    onChange={(e) => setProject({ ...project, projectName: e.target.value })}
                    placeholder="Ex: Mon Produit"
                    className="w-full text-xs font-semibold px-3 py-1.5 rounded-xl border border-line focus:ring-1 focus:ring-teal focus:border-teal transition-all bg-surface/30"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-navy mb-1">
                    Pitch / Promesse principale
                  </label>
                  <input
                    type="text"
                    value={project.pitch}
                    onChange={(e) => setProject({ ...project, pitch: e.target.value })}
                    placeholder="Ex: Permettre aux familles de capturer facilement leurs souvenirs..."
                    className="w-full text-xs font-medium px-3 py-1.5 rounded-xl border border-line focus:ring-1 focus:ring-teal focus:border-teal transition-all bg-surface/30"
                  />
                </div>
              </div>

              {/* Titre section personas */}
              <div className="flex items-center justify-between px-1">
                <h2 className="text-sm font-bold text-navy flex items-center gap-1.5">
                  <Target className="h-4 w-4 text-teal-dark" />
                  Les 3 Personas Cibles
                </h2>
                <span className="text-[11px] text-muted font-medium">
                  Problème (P) · Urgence (U) · Fréquence (F)
                </span>
              </div>

              {/* 3 Cartes personas compactes */}
              <div className="space-y-3.5">
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
            </div>

            {/* Colonne droite : Restitution Live Sticky */}
            <div className="lg:col-span-5 lg:sticky lg:top-6">
              <ProductFitSynthesis analysis={analysis} />
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}
