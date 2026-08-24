import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Compass, ArrowRight, Target, Sparkles, CheckCircle2, Zap } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';

export default function FitPage() {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

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
        <title>OsKaR Fit · Adéquation Produit-Marché | OsKaR</title>
      </Head>
      <AppShell
        title="OsKaR Fit"
        topbarTitle="OsKaR Fit"
        topbarSubtitle="Validez votre adéquation produit-marché et trouvez vos Early Adopters"
        topbarActions={topbarActions}
      >
        <div className="max-w-5xl mx-auto space-y-10 pb-16">
          {/* Hero Banner */}
          <div className="bg-navy-dark text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-card">
            <div className="relative z-10 max-w-2xl space-y-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-teal bg-white/10 px-3 py-1 rounded-full">
                Pilier 02 · OsKaR Fit
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight">
                Quel potentiel pour votre <span className="text-teal">produit</span> ?
              </h1>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Avant de dépenser du temps et des ressources à développer un produit, vérifiez si vous résolvez un problème douloureux, urgent et fréquent pour une cible bien identifiée.
              </p>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => router.push('/diagnostic-produit')}
                  className="px-6 py-3.5 bg-teal text-navy-dark font-extrabold text-sm rounded-xl shadow-lg hover:bg-teal-dark hover:-translate-y-0.5 transition-all flex items-center gap-2"
                >
                  Lancer le diagnostic potentiel gratuit <ArrowRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="absolute -right-16 -top-16 w-80 h-80 bg-teal/10 rounded-full blur-[100px]" />
          </div>

          {/* 3 Blocs piliers de la méthode */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-line shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center font-bold">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-navy text-base">La Formule de la Douleur</h3>
              <p className="text-xs text-muted leading-relaxed">
                Un bon produit répond à l’équation : <code>max (Problème × Urgence × Fréquence)</code>. Évaluez la douleur réelle ressentie par vos cibles.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-line shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-teal-light text-teal-dark flex items-center justify-center font-bold">
                <Target className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-navy text-base">Détection Early Adopter</h3>
              <p className="text-xs text-muted leading-relaxed">
                Comparez 3 personas pour savoir avec certitude qui contacter et convaincre en premier sans gaspiller vos efforts.
              </p>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-line shadow-card space-y-3">
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Sparkles className="h-5 w-5" />
              </div>
              <h3 className="font-bold text-navy text-base">Plan d'Action & Tests</h3>
              <p className="text-xs text-muted leading-relaxed">
                Obtenez des recommandations concrètes pour mener vos interviews de découverte et valider l'intérêt avant de développer.
              </p>
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}
