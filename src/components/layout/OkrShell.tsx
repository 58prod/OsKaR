import React, { useEffect, useMemo } from 'react';
import { useRouter } from 'next/router';
import {
  Route,
  LayoutDashboard,
  FileText,
  FolderKanban,
  CheckSquare,
  Calendar,
  AlarmClock,
  ClipboardCheck,
  History,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { AppShell } from './AppShell';
import { UserMenu } from './UserMenu';
import { NotificationContainer } from '@/components/ui/Notification';
import type { SidebarSection, SidebarNavItem } from './Sidebar';
import { useAppStore } from '@/store/useAppStore';
import { urlConnexion } from '@/lib/authFlux';

interface OkrShellProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  topbarTitle?: React.ReactNode;
  topbarSubtitle?: React.ReactNode;
  /** Actions de page additionnelles, rendues avant le menu utilisateur. */
  topbarActions?: React.ReactNode;
  contentMaxWidth?: string;
  contentPadding?: string;
}

/** Élément de sous-nav OKR avec clé de feature expérimentale optionnelle. */
type OkrNavItem = SidebarNavItem & { featureKey?: 'checkIn' | 'focus' | 'canvas' };

const OKR_NAV: { label: string; items: OkrNavItem[] }[] = [
  {
    label: 'Espace OKR',
    items: [
      // Sans cette entrée, les pages de l'espace ne permettent pas de revenir
      // au parcours en 3 étapes : la sidebar de la plateforme n'y est pas affichée.
      { href: '/app/okr', label: 'Mon parcours', icon: Route, exact: true },
      { href: '/app/okr/dashboard', label: 'Dashboard', icon: LayoutDashboard },
      { href: '/app/okr/canvas', label: 'Canvas guidé', icon: FileText, featureKey: 'canvas' },
      { href: '/app/okr/management', label: 'Gestion', icon: FolderKanban },
      { href: '/app/okr/actions', label: 'Actions', icon: CheckSquare },
      { href: '/app/okr/progress', label: 'Suivi', icon: Calendar },
    ],
  },
  {
    label: 'Rituels',
    items: [
      { href: '/app/okr/focus', label: 'Focus', icon: AlarmClock, featureKey: 'focus' },
      { href: '/app/okr/check-in', label: 'Check-in', icon: ClipboardCheck, featureKey: 'checkIn' },
      { href: '/app/okr/retrospective', label: 'Rétrospective', icon: History },
    ],
  },
  { label: 'Analyses', items: [{ href: '/app/okr/reports', label: 'Rapports', icon: FileText }] },
];

export const OkrShell: React.FC<OkrShellProps> = ({
  children,
  title,
  description,
  topbarTitle,
  topbarSubtitle,
  topbarActions,
  contentMaxWidth,
  contentPadding,
}) => {
  const router = useRouter();
  const { user, authReady, isAuthenticated, profileReady, experimentalFeatures } = useAppStore();

  // Gating auth + onboarding (aligné sur Layout)
  useEffect(() => {
    if (!authReady) return;
    if (!isAuthenticated) {
      router.replace(urlConnexion(router.asPath));
      return;
    }
    if (!user) return;
    if (profileReady && router.pathname !== '/onboarding') {
      if (!user.companyProfile) {
        router.push('/onboarding?module=okr');
      } else if (!user.settings?.onboarding?.okr) {
        router.push('/onboarding?module=okr');
      }
    }
  }, [authReady, isAuthenticated, user, profileReady, router]);

  const sections: SidebarSection[] = useMemo(
    () =>
      OKR_NAV.map((s) => ({
        label: s.label,
        items: s.items.filter((it) => !it.featureKey || experimentalFeatures[it.featureKey]),
      })).filter((s) => s.items.length > 0),
    [experimentalFeatures]
  );

  const footerItem: SidebarNavItem = { href: '/', label: 'Retour à la plateforme', icon: ArrowLeft };

  return (
    <AppShell
      title={title}
      description={description}
      topbarTitle={topbarTitle}
      topbarSubtitle={topbarSubtitle}
      topbarActions={<>{topbarActions}<UserMenu /></>}
      sections={sections}
      footerItem={footerItem}
      contentMaxWidth={contentMaxWidth}
      contentPadding={contentPadding}
    >
      {isAuthenticated && user ? (
        children
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-muted" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-teal mb-4" aria-hidden />
          <p className="text-sm">Chargement de votre espace…</p>
        </div>
      )}
      <NotificationContainer />
    </AppShell>
  );
};

export default OkrShell;
