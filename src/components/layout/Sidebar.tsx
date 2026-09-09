import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/router';
import {
  Home,
  ClipboardCheck,
  Eye,
  Target as TargetIcon,
  LineChart,
  CheckSquare,
  Users,
  Info,
  Wrench,
  LogIn,
  ChevronLeft,
} from 'lucide-react';

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  badge?: string;
  external?: boolean;
  onClick?: (e: React.MouseEvent) => void;
}

export interface SidebarSection {
  label: string;
  items: SidebarNavItem[];
}

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
  sections?: SidebarSection[];
  /** Élément de pied de sidebar. `null` pour le masquer entièrement. */
  footerItem?: SidebarNavItem | null;
}

const DEFAULT_SECTIONS: SidebarSection[] = [
  {
    label: 'Navigation',
    items: [
      { href: '/', label: 'Accueil', icon: Home },
      { href: '/diagnostic', label: 'Bilan Organisation', icon: ClipboardCheck, badge: 'Gratuit' },
      { href: '/diagnostic-produit', label: 'Potentiel Produit', icon: TargetIcon, badge: 'Nouveau' },
    ],
  },
  {
    label: 'Les 5 Piliers',
    items: [
      { href: '/vision', label: 'OsKaR Vision', icon: Eye },
      { href: '/fit', label: 'OsKaR Fit', icon: LineChart },
      { href: '/finance', label: 'OsKaR Finance', icon: TargetIcon },
      { href: '/app/okr', label: 'OsKaR OKR', icon: CheckSquare },
      { href: '/team', label: 'OsKaR Team', icon: Users },
    ],
  },
  {
    label: 'Collaboration',
    items: [{ href: '/app/outils', label: 'Boîte à outils', icon: Wrench }],
  },
  {
    label: 'Ressources',
    items: [{ href: '/about', label: 'À propos', icon: Info }],
  },
];

const DEFAULT_FOOTER: SidebarNavItem = {
  href: '/auth/login',
  label: 'Se connecter',
  icon: LogIn,
};

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  sections = DEFAULT_SECTIONS,
  footerItem = DEFAULT_FOOTER,
}) => {
  const router = useRouter();

  const renderItem = (item: SidebarNavItem) => {
    const Icon = item.icon;
    const isActive =
      router.pathname === item.href ||
      (item.href !== '/' && router.pathname.startsWith(item.href));

    const className = `relative flex items-center gap-[14px] px-5 py-[11.5px] text-15.5 font-medium transition-colors whitespace-nowrap ${
      isActive
        ? 'bg-teal/10 text-teal before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] before:bg-teal before:rounded-r'
        : 'text-white/65 hover:bg-white/[0.07] hover:text-white/95'
    }`;

    const content = (
      <>
        <Icon
          className={`icone-fine h-5 w-5 shrink-0 ${isActive ? 'opacity-100' : 'opacity-80'}`}
          aria-hidden
        />
        <span className={`transition-opacity ${collapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          {item.label}
        </span>
        {item.badge && (
          <span
            className={`ml-auto bg-teal text-navy-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full transition-opacity ${
              collapsed ? 'opacity-0' : 'opacity-100'
            }`}
          >
            {item.badge}
          </span>
        )}
      </>
    );

    if (item.external) {
      return (
        <a key={item.href + item.label} href={item.href} target="_blank" rel="noreferrer" className={className}>
          {content}
        </a>
      );
    }
    return (
      <Link key={item.href + item.label} href={item.href} className={className} aria-current={isActive ? 'page' : undefined} onClick={item.onClick}>
        {content}
      </Link>
    );
  };

  const width = collapsed ? 'w-16' : 'w-60';

  return (
    <aside
      className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-dark transition-[width] duration-250 overflow-visible ${width}`}
      aria-label="Navigation principale"
    >
      <div className="flex items-center min-h-[64px] px-4 bg-white border-b border-white/10 overflow-hidden">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          {collapsed ? (
            <Image src="/images/oskar/logo-oskar2.png" alt="OsKaR" width={32} height={32} className="object-contain" priority />
          ) : (
            <Image src="/images/oskar/logo-oskar.png" alt="OsKaR" width={150} height={30} className="object-contain h-[30px] w-auto" priority />
          )}
        </Link>
      </div>
      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
        aria-expanded={!collapsed}
        className={`absolute top-[74px] w-6 h-6 rounded-full bg-teal shadow-[0_2px_8px_rgba(0,212,180,0.3)] flex items-center justify-center z-50 transition-[left,transform] duration-250 ${
          collapsed ? 'left-[calc(4rem-12px)] rotate-180' : 'left-[calc(15rem-12px)]'
        }`}
      >
        <ChevronLeft className="h-3 w-3 text-navy-dark" aria-hidden />
      </button>
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-thin">
        {sections.map((section) => (
          <div key={section.label}>
            <div className={`text-11.5 font-semibold tracking-[1.2px] uppercase text-white/30 px-5 pt-[14px] pb-1 whitespace-nowrap transition-opacity ${collapsed ? 'opacity-0' : 'opacity-100'}`}>
              {section.label}
            </div>
            {section.items.map(renderItem)}
          </div>
        ))}
      </nav>
      {footerItem && <div className="py-3 border-t border-white/10">{renderItem(footerItem)}</div>}
    </aside>
  );
};

export default Sidebar;
