import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/router';
import {
  BookOpen,
  Briefcase,
  Building2,
  ChevronDown,
  ClipboardList,
  HeartHandshake,
  IdCard,
  LogOut,
  Settings,
  User as UserIcon,
} from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { useQueryClient } from '@tanstack/react-query';
import { AuthService } from '@/services/auth';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { useProfilCoach } from '@/hooks/useAccompagnements';

/**
 * Menu déroulant utilisateur (nom d'utilisateur), réutilisable dans tous les
 * shells (AppShell, OkrShell).
 *
 * Deux jeux d'entrées :
 *   - dirigeant : ses bilans, ses coachs, le profil d'entreprise ;
 *   - coach référencé : ses dirigeants, sa fiche coach (structure et
 *     annuaire), le kit du coach.
 * Paramètres (nom, mot de passe, confidentialité) et déconnexion pour tous.
 */
export const UserMenu: React.FC = () => {
  const router = useRouter();
  const { user, logout } = useAppStore();
  const { estCoach } = useProfilCoach();
  const queryClient = useQueryClient();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Fermer le menu au clic extérieur
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  // Fermer le menu avec la touche Échap (accessibilité)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const handleLogout = async () => {
    try {
      if (isSupabaseConfigured()) await AuthService.signOut();
    } finally {
      logout();
      // Ne pas laisser en mémoire les données du compte qui vient de se déconnecter.
      queryClient.clear();
      router.push('/');
    }
  };

  const aller = (chemin: string) => () => {
    setMenuOpen(false);
    router.push(chemin);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold text-navy hover:bg-surface transition-colors"
      >
        <span className={`w-7 h-7 rounded-full text-white flex items-center justify-center ${estCoach ? 'bg-coral' : 'bg-navy'}`}>
          <UserIcon className="h-4 w-4" aria-hidden />
        </span>
        <span className="hidden sm:inline max-w-[140px] truncate">{user?.name ?? 'Mon compte'}</span>
        <ChevronDown className={`h-4 w-4 text-muted transition-transform ${menuOpen ? 'rotate-180' : ''}`} aria-hidden />
      </button>
      {menuOpen && (
        <div role="menu" className="absolute right-0 mt-2 w-60 bg-white rounded-xl shadow-card border border-line py-2 z-50">
          <div className="px-4 py-2 border-b border-line">
            <p className="text-sm font-semibold text-navy truncate">{user?.name ?? 'Mon compte'}</p>
            <p className="text-xs text-muted truncate">{user?.email ?? ''}</p>
            {estCoach && (
              <span className="inline-block mt-1.5 text-[11px] font-bold leading-[1.6] px-2 rounded-[20px] bg-coral-light text-coral-dark">
                Coach référencé
              </span>
            )}
          </div>
          {estCoach ? (
            <>
              <MenuLink icon={Briefcase} label="Mes dirigeants" onClick={aller('/app/mes-dirigeants')} />
              <MenuLink icon={IdCard} label="Ma fiche coach" onClick={aller('/app/ma-fiche-coach')} />
              <MenuLink icon={BookOpen} label="Kit du coach" onClick={aller('/coachs#kit')} />
            </>
          ) : (
            <>
              <MenuLink icon={ClipboardList} label="Mes bilans" onClick={aller('/mes-bilans')} />
              <MenuLink icon={HeartHandshake} label="Mes coachs" onClick={aller('/app/mes-coachs')} />
              <MenuLink icon={Building2} label="Profil d'entreprise" onClick={aller('/company-profile')} />
            </>
          )}
          <MenuLink icon={Settings} label="Paramètres" onClick={aller('/settings')} />
          <div className="border-t border-line my-1" />
          <MenuLink icon={LogOut} label="Déconnexion" danger onClick={() => { setMenuOpen(false); handleLogout(); }} />
        </div>
      )}
    </div>
  );
};

interface MenuLinkProps {
  icon: React.ComponentType<{ className?: string; 'aria-hidden'?: boolean }>;
  label: string;
  onClick: () => void;
  danger?: boolean;
}

const MenuLink: React.FC<MenuLinkProps> = ({ icon: Icon, label, onClick, danger }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    className={`flex items-center w-full gap-3 px-4 py-2 text-sm transition-colors ${
      danger ? 'text-red-600 hover:bg-red-50' : 'text-navy hover:bg-surface'
    }`}
  >
    <Icon className="h-4 w-4" aria-hidden />
    {label}
  </button>
);

export default UserMenu;
