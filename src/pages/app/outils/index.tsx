import React, { useState } from 'react';
import Link from 'next/link';
import { ouvrirConnexion } from '@/store/useConnexion';
import { ArrowRight, Clock, MessageCircle, Plus, Users, ShieldCheck, Sparkles } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { SuggestToolModal } from '@/components/toolbox/SuggestToolModal';
import { useAppStore } from '@/store/useAppStore';
import { TOOLS, getRetentionLabel, type ToolDefinition } from '@/constants/toolbox';

const ToolboxPage: React.FC = () => {
  const { authReady, isAuthenticated } = useAppStore();
  const retention = getRetentionLabel();
  const [suggestOpen, setSuggestOpen] = useState(false);

  const topbarActions = !authReady ? null : isAuthenticated ? (
    <UserMenu />
  ) : (
    <button
      onClick={() => ouvrirConnexion('login')}
      className="px-4 py-2 text-sm font-semibold text-navy hover:text-navy-light transition-colors"
    >
      Connexion
    </button>
  );

  return (
    <AppShell
      title="Boîte à outils"
      topbarTitle="Boîte à outils collaborative"
      topbarSubtitle="Animez vos rituels d'équipe en temps réel"
      topbarActions={topbarActions}
    >
      {/* Bandeau conservation des données */}
      <div
        className="flex items-start gap-3 rounded-card border border-teal/40 bg-teal-light/60 px-5 py-4 mb-8"
        role="note"
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-teal-dark mt-0.5" aria-hidden />
        <div className="text-sm text-navy">
          <p className="font-semibold">Conservation des données : {retention}</p>
          <p className="text-navy/80">
            Chaque session collaborative et son contenu sont conservés{' '}
            <strong>{retention}</strong> après leur dernière activité, puis supprimés
            automatiquement. Aucun compte n'est nécessaire pour rejoindre une session :
            un lien et un prénom suffisent.
          </p>
        </div>
      </div>

      <section aria-labelledby="tools-heading">
        <h2 id="tools-heading" className="sr-only">Liste des outils</h2>
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
          {TOOLS.map((tool) => (
            <ToolCard key={tool.type} tool={tool} />
          ))}
          <SuggestCard onOpen={() => setSuggestOpen(true)} />
        </div>
      </section>

      {suggestOpen && <SuggestToolModal onClose={() => setSuggestOpen(false)} />}
    </AppShell>
  );
};

/** Carte fantôme « Il manque un outil ? » en fin de grille. */
const SuggestCard: React.FC<{ onOpen: () => void }> = ({ onOpen }) => (
  <article className="flex flex-col overflow-hidden rounded-2xl border-2 border-dashed border-line bg-white/60 transition-all hover:-translate-y-0.5 hover:border-muted/50">
    <div
      className="relative flex h-[130px] items-center justify-center"
      style={{
        background:
          'radial-gradient(circle, rgba(148,163,184,.35) 1.5px, transparent 1.5px) 0 0 / 20px 20px, linear-gradient(135deg, #f1f5f9, #e2e8f0)',
      }}
    >
      <div className="flex h-16 w-16 items-center justify-center rounded-[18px] border-2 border-dashed border-muted/40 bg-white/50">
        <Plus className="h-8 w-8 text-muted" aria-hidden />
      </div>
    </div>

    <div className="flex flex-1 flex-col p-5">
      <h3 className="text-lg font-bold text-navy">Il manque un outil ?</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">
        Vous avez un rituel d&apos;équipe qui vous manque ici ? Dites-le nous — les
        meilleurs retours deviennent les prochains outils.
      </p>
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
        <span className="inline-flex items-center gap-1.5">
          <MessageCircle className="h-4 w-4" aria-hidden />
          2 min pour suggérer
        </span>
      </div>
    </div>

    <div className="px-5 pb-5">
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center justify-center gap-2 rounded-xl border-[1.5px] border-line bg-surface px-4 py-3 text-sm font-bold text-muted transition-all hover:-translate-y-0.5 hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
      >
        Suggérer un outil
        <ArrowRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  </article>
);

const ToolCard: React.FC<{ tool: ToolDefinition }> = ({ tool }) => {
  const Icon = tool.icon;
  const isLive = tool.status === 'live';

  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-all hover:shadow-card-hover hover:-translate-y-0.5">
      <div className="relative flex h-[130px] items-center justify-center" style={{ background: tool.gradient }}>
        <div className="flex h-16 w-16 items-center justify-center rounded-[18px] bg-white/20 backdrop-blur-sm">
          <Icon className="h-8 w-8 text-white" aria-hidden />
        </div>
        {!isLive && (
          <span className="absolute right-3 top-3 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-bold text-navy">
            Bientôt
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-lg font-bold text-navy">{tool.title}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{tool.description}</p>

        <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-muted">
          <span className="inline-flex items-center gap-1.5">
            <Clock className="h-4 w-4" aria-hidden />
            {tool.duration}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Users className="h-4 w-4" aria-hidden />
            {tool.participants}
          </span>
        </div>
      </div>

      <div className="px-5 pb-5">
        {isLive ? (
          <Link
            href={`/app/outils/${tool.type}`}
            className="flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold text-white transition-transform hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy focus-visible:ring-offset-2"
            style={{ background: tool.gradient }}
          >
            {tool.cta ?? `Lancer le ${tool.title.toLowerCase()}`}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-surface px-4 py-3 text-sm font-bold text-muted cursor-not-allowed"
          >
            <Sparkles className="h-4 w-4" aria-hidden />
            Bientôt disponible
          </button>
        )}
      </div>
    </article>
  );
};

export default ToolboxPage;
