import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { Sidebar, DEFAULT_SECTIONS, type SidebarSection, type SidebarNavItem } from './Sidebar';
import { useSectionAdmin } from '@/components/admin/sectionAdmin';
import { Topbar } from './Topbar';
import { openCookieSettings } from '@/components/ui/CookieBanner';
import { useAppStore } from '@/store/useAppStore';
import { useSidebarCollapsed } from '@/hooks/useSidebarCollapsed';
import { APP_CONFIG } from '@/constants';

interface AppShellProps {
  children: React.ReactNode;
  /** Titre HTML (préfixe ajouté automatiquement avec le nom de l'app) */
  title?: string;
  description?: string;
  /** Contenu du titre topbar (texte ou node) */
  topbarTitle?: React.ReactNode;
  topbarSubtitle?: React.ReactNode;
  topbarActions?: React.ReactNode;
  /** Sections de navigation custom (sinon utilise les sections par défaut) */
  sections?: SidebarSection[];
  /** Élément de pied de sidebar. `null` pour le masquer. Si non fourni, déduit de l'état d'authentification. */
  footerItem?: SidebarNavItem | null;
  /** Largeur max du contenu (défaut: 1200px / max-w-content) */
  contentMaxWidth?: string;
  /** Padding du conteneur principal. Défaut : les 42,5px de `.page-content`
   * dans `plateforme/oskar.css`, ramenés à 18,5px sous 600px comme la maquette. */
  contentPadding?: string;
}

export const AppShell: React.FC<AppShellProps> = ({
  children,
  title,
  description,
  topbarTitle,
  topbarSubtitle,
  topbarActions,
  sections,
  footerItem,
  contentMaxWidth = 'max-w-content',
  contentPadding = 'p-[18.5px] min-[600px]:p-[42.5px]',
}) => {
  const { authReady, isAuthenticated } = useAppStore();
  const { collapsed: sidebarCollapsed, toggle: handleToggle } = useSidebarCollapsed();

  // Les administrateurs voient une section de plus sous le menu habituel.
  const sectionAdmin = useSectionAdmin();
  const sectionsMenu = sections ?? (sectionAdmin ? [...DEFAULT_SECTIONS, sectionAdmin] : undefined);

  // Pied de sidebar : si non fourni par l'appelant, on déduit de l'auth.
  // - utilisateur connecté (ou état en cours de résolution) : masqué (null)
  // - visiteur : on laisse le Sidebar afficher son lien « Se connecter » par défaut (undefined)
  const resolvedFooterItem =
    footerItem !== undefined ? footerItem : !authReady || isAuthenticated ? null : undefined;

  const pageTitle = title ? `${title} — ${APP_CONFIG.name}` : APP_CONFIG.name;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        {description && <meta name="description" content={description} />}
      </Head>
      <div className="min-h-screen bg-surface text-ink font-sans">
        <Sidebar collapsed={sidebarCollapsed} onToggle={handleToggle} sections={sectionsMenu} footerItem={resolvedFooterItem} />
        <div
          className="oskar-main flex flex-col min-h-screen transition-[margin] duration-250"
          style={{ marginLeft: 'var(--oskar-sidebar)' }}
        >
          <Topbar title={topbarTitle} subtitle={topbarSubtitle} actions={topbarActions} />
          <main className={`flex-1 w-full ${contentMaxWidth} ${contentPadding}`}>{children}</main>
          <footer className={`w-full ${contentMaxWidth} px-[18.5px] min-[600px]:px-[42.5px] py-5 mt-auto border-t border-line`}>
            <nav aria-label="Liens légaux" className="flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] text-muted">
              <Link href="/legal/privacy-policy" className="hover:text-ink transition-colors">Confidentialité</Link>
              <Link href="/legal/terms-of-service" className="hover:text-ink transition-colors">CGU</Link>
              <Link href="/legal/cookies-policy" className="hover:text-ink transition-colors">Cookies</Link>
              <Link href="/legal/gdpr" className="hover:text-ink transition-colors">Vos droits RGPD</Link>
              <button type="button" onClick={openCookieSettings} className="hover:text-ink transition-colors">
                Paramètres des cookies
              </button>
            </nav>
            {/*
               * Le numéro de version est lu dans package.json à la compilation.
               * En développement, il change à chaque commit alors que le serveur
               * tourne encore avec l'ancien : Turbopack ne recharge pas ce
               * fichier, et React signalait un écart entre serveur et client à
               * chaque montée de version. L'année a le même défaut la nuit du
               * 31 décembre. Un écart sur ce paragraphe est sans conséquence.
               */}
            <p className="mt-3 text-[12px] text-muted" suppressHydrationWarning>
              © {new Date().getFullYear()} {APP_CONFIG.name} · v{APP_CONFIG.version}
            </p>
          </footer>
        </div>
      </div>
    </>
  );
};

export default AppShell;
