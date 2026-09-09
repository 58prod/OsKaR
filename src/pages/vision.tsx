import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowRight, Clock, ListChecks, FileDown, UserCog } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';

/** Les 8 étapes du parcours Vision, dans l'ordre de la maquette. */
const STEPS = [
  'Sens',
  'Cibles & Acteurs',
  'Réalité',
  'Projection',
  'Valeurs',
  'Synthèse',
  'Objectifs',
  'Récap',
] as const;

const HIGHLIGHTS = [
  {
    icon: Clock,
    value: '~1h30',
    label: 'Durée estimée',
    text: 'À votre rythme, en une ou plusieurs sessions.',
  },
  {
    icon: ListChecks,
    value: '8 étapes',
    label: 'Parcours structuré',
    text: 'Sens · Cibles · Réalité · Projection · Valeurs · Synthèse · Objectifs · Récap',
  },
  {
    icon: FileDown,
    value: 'PDF',
    label: 'Export inclus',
    text: 'Téléchargez votre fiche de cap à la fin de l’atelier.',
  },
] as const;

export default function VisionPage() {
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
        <title>OsKaR Vision · Clarifiez votre cap | OsKaR</title>
      </Head>
      <AppShell
        title="OsKaR Vision"
        topbarTitle="OsKaR Vision"
        topbarSubtitle="Formalisez votre cap et transformez-le en objectifs concrets"
        topbarActions={topbarActions}
      >
        <div className="max-w-5xl mx-auto space-y-10 pb-16">
          {/* Bannière */}
          <div className="bg-navy-dark text-white rounded-3xl p-8 sm:p-12 relative overflow-hidden shadow-card">
            <div className="relative z-10 max-w-2xl space-y-5">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-extrabold uppercase tracking-widest text-teal bg-white/10 px-3 py-1 rounded-full">
                Module 01 · OsKaR Vision
              </span>
              <h1 className="text-3xl sm:text-5xl font-black leading-tight">
                Clarifiez votre cap, transformez-le en{' '}
                <span className="text-teal">objectifs concrets</span>
              </h1>
              <p className="text-sm sm:text-base text-white/80 leading-relaxed">
                Un parcours guidé en 8 étapes pour formaliser votre vision, cartographier vos
                cibles et acteurs, définir vos valeurs et poser les 3 objectifs qui comptent
                vraiment.
              </p>
            </div>

            <div className="absolute -right-16 -top-16 w-80 h-80 bg-vision/10 rounded-full blur-[100px]" />
          </div>

          {/* Ce que contient l'atelier */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {HIGHLIGHTS.map(({ icon: Icon, value, label, text }) => (
              <div
                key={label}
                className="bg-white p-6 rounded-2xl border border-line shadow-card space-y-3"
              >
                <div className="w-10 h-10 rounded-xl bg-vision-light text-vision-dark flex items-center justify-center">
                  <Icon className="h-5 w-5" />
                </div>
                <p className="text-2xl font-black text-navy leading-none">{value}</p>
                <h3 className="font-bold text-navy text-base">{label}</h3>
                <p className="text-xs text-muted leading-relaxed">{text}</p>
              </div>
            ))}
          </div>

          {/* Profil : on renvoie vers le profil d'entreprise déjà existant */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-line shadow-card">
            <div className="flex flex-col sm:flex-row sm:items-center gap-5">
              <div className="w-11 h-11 shrink-0 rounded-xl bg-navy/5 text-navy flex items-center justify-center">
                <UserCog className="h-5 w-5" />
              </div>
              <div className="flex-1 space-y-1">
                <h2 className="font-bold text-navy text-base">Avant de commencer, votre profil</h2>
                <p className="text-xs text-muted leading-relaxed">
                  Votre secteur et votre rôle permettent de personnaliser les conseils tout au long
                  de l&rsquo;atelier.
                </p>
              </div>
              <button
                onClick={() => router.push('/company-profile')}
                className="shrink-0 px-5 py-2.5 border border-line text-navy font-bold text-sm rounded-xl hover:bg-surface transition-colors"
              >
                Compléter mon profil
              </button>
            </div>
          </div>

          {/* Le parcours */}
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-line shadow-card space-y-6">
            <div className="space-y-1">
              <h2 className="font-bold text-navy text-lg">Prêt à construire votre vision ?</h2>
              <p className="text-xs text-muted leading-relaxed">
                Répondez aux questions étape par étape. Vous pourrez naviguer librement entre les
                étapes à tout moment.
              </p>
            </div>

            <ol className="flex flex-wrap gap-2">
              {STEPS.map((step, i) => (
                <li
                  key={step}
                  className="inline-flex items-center gap-2 text-xs font-semibold text-navy bg-vision-light/60 border border-vision/20 rounded-full pl-2 pr-3.5 py-1.5"
                >
                  <span className="w-5 h-5 rounded-full bg-vision text-white grid place-items-center text-[10px] font-extrabold tabular-nums">
                    {i + 1}
                  </span>
                  {step}
                </li>
              ))}
            </ol>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <button
                type="button"
                disabled
                className="px-6 py-3.5 bg-line text-muted font-extrabold text-sm rounded-xl cursor-not-allowed inline-flex items-center gap-2"
              >
                Démarrer l&rsquo;atelier <ArrowRight className="h-4 w-4" />
              </button>
              <span className="text-[11px] font-extrabold uppercase tracking-widest text-vision-dark bg-vision-light px-3 py-1 rounded-full">
                Bientôt
              </span>
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
}
