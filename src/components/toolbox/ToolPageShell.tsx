import React from 'react';
import Head from 'next/head';
import type { ToolIdentity } from '@/hooks/useToolSession';
import { JoinSessionModal } from '@/components/toolbox/JoinSessionModal';
import { ToolHeader } from '@/components/toolbox/ToolHeader';
import { Sidebar } from '@/components/layout/Sidebar';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { useAppStore } from '@/store/useAppStore';

interface ToolPageShellProps {
  title: string;
  code: string | null;
  isCreating: boolean;
  identity: ToolIdentity | null;
  isFacilitator: boolean;
  onToggleFacilitator: () => void;
  onJoin: (name: string) => void;
  onShare: () => void;
  /** Rétention propre à l'outil, affichée à l'entrée dans la session. */
  retentionLabel?: string;
  /** Précision sur le code, affichée à l'entrée dans la session. */
  codeHint?: string;
  children: React.ReactNode;
}

/**
 * Ossature commune d'une page d'outil :
 * - sidebar Oskar (navigation inter-modules), comme le reste de l'app ;
 * - écran de chargement tant que le code n'est pas résolu ;
 * - modal de connexion (prénom) tant qu'aucune identité ;
 * - en-tête (logo, titre, toggle animateur, invitation) + contenu de l'outil.
 */
export const ToolPageShell: React.FC<ToolPageShellProps> = ({
  title, code, isCreating, identity, isFacilitator, onToggleFacilitator, onJoin, onShare, retentionLabel, codeHint, children,
}) => {
  const { collapsed, toggle } = useSidebarCollapsed();
  const { authReady, isAuthenticated } = useAppStore();
  // Pied de sidebar : connecté → masqué ; visiteur → lien « Se connecter » par défaut.
  const footerItem = !authReady || isAuthenticated ? null : undefined;

  const content = !code ? (
    <div className="flex flex-1 items-center justify-center bg-surface" role="status" aria-live="polite">
      <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-teal" />
      <span className="sr-only">Préparation de la session…</span>
    </div>
  ) : !identity ? (
    <div className="flex flex-1 items-center justify-center bg-surface">
      <JoinSessionModal
        toolTitle={title}
        sessionCode={code}
        isCreating={isCreating}
        onJoin={onJoin}
        retentionLabel={retentionLabel}
        codeHint={codeHint}
      />
    </div>
  ) : (
    // `relative` : les éléments en position absolue des panneaux (textes réservés
    // aux lecteurs d'écran, bulles…) restent dans l'outil au lieu d'allonger la
    // page, ce qui la ferait défiler et montrerait une bande vide en bas.
    <div className="relative flex flex-1 flex-col overflow-hidden bg-surface">
      <ToolHeader
        title={title}
        sessionCode={code}
        isFacilitator={isFacilitator}
        onToggleFacilitator={onToggleFacilitator}
        onShare={onShare}
      />
      {children}
    </div>
  );

  return (
    <>
      <Head>
        <title>{`${title} — Oskar`}</title>
        <meta name="robots" content="noindex" />
      </Head>

      <div className="min-h-screen bg-surface text-ink font-sans">
        <Sidebar collapsed={collapsed} onToggle={toggle} footerItem={footerItem} />
        <div
          className="oskar-main flex h-screen flex-col transition-[margin] duration-250"
          style={{ marginLeft: 'var(--oskar-sidebar)' }}
        >
          {content}
        </div>
      </div>
    </>
  );
};

export default ToolPageShell;
