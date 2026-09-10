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

/*
 * Menu latéral OsKaR — transposition de la sidebar de `plateforme/oskar.css` :
 *   largeur      240px, 64px replié, transition 0.25s
 *   en-tête      hauteur 64px, fond blanc, logo 30px (icône 32px quand replié)
 *   libellé      15.5px / 500, retrait 20px, hauteur de ligne 11.5px
 *   section      11.5px / 600 / interlettrage 1.2px, blanc 30 %
 *   actif        fond teal 12 %, texte teal, liseré gauche 3px
 *   survol       fond blanc 7 %, texte blanc 95 %
 *
 * Largeur, opacité des libellés et choix du logo sont pilotés par la variable
 * CSS `--oskar-sidebar` et l'attribut `data-sidebar` (voir globals.css et
 * useSidebarCollapsed) : React ne rend pas l'état plié, ce qui évite tout
 * clignotement au chargement et aux changements de page.
 */

/**
 * Couleur d'accent d'une entrée quand elle est active, reprise de `oskar.css` :
 * chaque pilier a la sienne, le reste garde le turquoise de la marque.
 * Classes écrites en toutes lettres : Tailwind ne résout pas les noms construits.
 */
export type AccentPilier = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

const ACCENTS: Record<AccentPilier | 'defaut', { fond: string; texte: string; liseré: string }> = {
  vision: { fond: 'bg-vision/[0.12]', texte: 'text-vision', liseré: 'before:bg-vision' },
  fit: { fond: 'bg-fit/[0.12]', texte: 'text-fit', liseré: 'before:bg-fit' },
  finance: { fond: 'bg-finance/[0.12]', texte: 'text-finance', liseré: 'before:bg-finance' },
  okr: { fond: 'bg-okr/[0.12]', texte: 'text-okr', liseré: 'before:bg-okr' },
  team: { fond: 'bg-team/[0.12]', texte: 'text-team', liseré: 'before:bg-team' },
  defaut: { fond: 'bg-teal/[0.12]', texte: 'text-teal', liseré: 'before:bg-teal' },
};

export interface SidebarNavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  badge?: string;
  /** Vrai si l'entrée ne doit s'allumer que sur sa page, pas sur ses sous-pages. */
  exact?: boolean;
  /** Couleur prise quand l'entrée est active ; turquoise par défaut. */
  accent?: AccentPilier;
  /** Autres chemins qui allument l'entrée — l'atelier d'un pilier, par exemple. */
  aussi?: string[];
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
  /** Élément de pied de menu. `null` pour le masquer entièrement. */
  footerItem?: SidebarNavItem | null;
}

const DEFAULT_SECTIONS: SidebarSection[] = [
  {
    label: 'Navigation',
    items: [
      { href: '/', label: 'Accueil', icon: Home },
      { href: '/diagnostic', label: 'Diagnostic', icon: ClipboardCheck, badge: 'Gratuit' },
      { href: '/diagnostic-produit', label: 'Potentiel Produit', icon: TargetIcon, badge: 'Nouveau' },
    ],
  },
  {
    label: 'Les 5 Piliers',
    items: [
      { accent: 'vision', href: '/vision', aussi: ['/app/vision'], label: 'OsKaR Vision', icon: Eye },
      { accent: 'fit', href: '/fit', aussi: ['/app/fit'], label: 'OsKaR Fit', icon: LineChart },
      { accent: 'finance', href: '/finance', aussi: ['/app/finance'], label: 'OsKaR Finance', icon: TargetIcon },
      { accent: 'okr', href: '/okr', aussi: ['/app/okr'], label: 'OsKaR OKR', icon: CheckSquare },
      { accent: 'team', href: '/team', label: 'OsKaR Team', icon: Users },
    ],
  },
  {
    // La maquette range la boîte à outils avec « À propos », sous Ressources.
    label: 'Ressources',
    items: [
      { href: '/app/outils', label: 'Boîte à outils', icon: Wrench },
      { href: '/about', label: 'À propos', icon: Info },
    ],
  },
];

const DEFAULT_FOOTER: SidebarNavItem = {
  href: '/auth/login',
  label: 'Se connecter',
  icon: LogIn,
};

/**
 * Un élément est actif sur sa page et sur ses sous-pages, jamais sur une page
 * dont l'adresse commence par les mêmes lettres : « /diagnostic » ne doit pas
 * s'allumer sur « /diagnostic-produit », ni « /team » sur « /teams ».
 */
export function estActif(chemin: string, href: string, exact = false): boolean {
  const page = chemin.replace(/\/+$/, '') || '/';
  const cible = href.replace(/\/+$/, '') || '/';
  if (cible === '/' || exact) return page === cible;
  return page === cible || page.startsWith(`${cible}/`);
}

export const Sidebar: React.FC<SidebarProps> = ({
  collapsed,
  onToggle,
  sections = DEFAULT_SECTIONS,
  footerItem = DEFAULT_FOOTER,
}) => {
  const router = useRouter();
  const idBase = React.useId();

  const renderItem = (item: SidebarNavItem) => {
    const Icon = item.icon;
    const actif =
      estActif(router.pathname, item.href, item.exact) ||
      (item.aussi ?? []).some((chemin) => estActif(router.pathname, chemin));

    const accent = ACCENTS[item.accent ?? 'defaut'];
    const className = `relative flex items-center gap-[14px] px-5 py-[11.5px] text-15.5 font-medium transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:bg-white/10 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-teal ${
      actif
        ? `${accent.fond} ${accent.texte} before:absolute before:left-0 before:top-1 before:bottom-1 before:w-[3px] ${accent.liseré} before:rounded-r-[2px]`
        : 'text-white/65 hover:bg-white/[0.07] hover:text-white/95'
    }`;

    const content = (
      <>
        <Icon className={`icone-fine h-5 w-5 shrink-0 ${actif ? 'opacity-100' : 'opacity-80'}`} aria-hidden />
        <span className="oskar-nav-label">{item.label}</span>
        {item.badge && (
          <span className="oskar-nav-label ml-auto bg-teal text-navy-dark text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            {item.badge}
          </span>
        )}
      </>
    );

    // Replié, il ne reste que l'icône : l'infobulle native donne le nom de la page.
    // L'attribut n'existe pas au rendu serveur, d'où la tolérance à l'hydratation.
    const infobulle = collapsed ? item.label : undefined;

    return (
      <li key={item.href + item.label}>
        {item.external ? (
          <a href={item.href} target="_blank" rel="noreferrer" className={className} title={infobulle} suppressHydrationWarning>
            {content}
          </a>
        ) : (
          <Link
            href={item.href}
            className={className}
            aria-current={actif ? 'page' : undefined}
            onClick={item.onClick}
            title={infobulle}
            suppressHydrationWarning
          >
            {content}
          </Link>
        )}
      </li>
    );
  };

  return (
    <div
      className="oskar-sidebar fixed inset-y-0 left-0 z-40 flex flex-col bg-navy-dark transition-[width] duration-250"
      style={{ width: 'var(--oskar-sidebar)' }}
    >
      <div className="flex items-center min-h-[64px] px-4 bg-white border-b border-white/10 overflow-hidden">
        <Link
          href="/"
          aria-label="Retour à l'accueil"
          className="flex items-center rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal"
        >
          <Image
            src="/images/oskar/logo-oskar.png"
            alt="OsKaR"
            width={150}
            height={30}
            style={{ width: 'auto', height: 30 }}
            className="oskar-logo-full object-contain"
            priority
          />
          {/* Les deux dimensions sont posees en classes : Tailwind impose
              `height:auto` a toutes les images, et next/image previent quand une
              seule des deux est fixee. Pas de `priority` ici : l'icone n'est
              visible que menu replie, et l'attribut `loading` qu'elle ajoute
              differait entre le rendu serveur et le rendu client. */}
          <Image
            src="/images/oskar/logo-oskar2.png"
            alt="OsKaR"
            width={32}
            height={32}
            className="oskar-logo-icon object-contain h-8 w-8"
          />
        </Link>
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={collapsed ? 'Déployer le menu' : 'Réduire le menu'}
        aria-expanded={!collapsed}
        aria-controls={`${idBase}-nav`}
        suppressHydrationWarning
        className="oskar-sidebar-toggle absolute top-[74px] w-6 h-6 rounded-full bg-teal shadow-[0_2px_8px_rgba(0,212,180,0.3)] flex items-center justify-center z-50 transition-[left,transform] duration-250 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
        style={{ left: 'calc(var(--oskar-sidebar) - 12px)' }}
      >
        <ChevronLeft className="h-3 w-3 text-navy-dark" aria-hidden />
      </button>

      <nav
        id={`${idBase}-nav`}
        aria-label="Navigation principale"
        className="flex-1 py-3 overflow-y-auto overflow-x-hidden scrollbar-thin"
      >
        {sections.map((section, i) => (
          <div key={section.label} role="group" aria-labelledby={`${idBase}-s${i}`}>
            <div
              id={`${idBase}-s${i}`}
              className="oskar-nav-label text-11.5 font-semibold tracking-[1.2px] uppercase text-white/30 px-5 pt-[14px] pb-1 whitespace-nowrap"
            >
              {section.label}
            </div>
            <ul>{section.items.map(renderItem)}</ul>
          </div>
        ))}
      </nav>

      {footerItem && (
        <nav aria-label="Mon compte" className="py-3 border-t border-white/10">
          <ul>{renderItem(footerItem)}</ul>
        </nav>
      )}
    </div>
  );
};

export default Sidebar;
