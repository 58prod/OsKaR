import { LayoutDashboard, Mail, Star, Users } from 'lucide-react';
import type { SidebarSection } from '@/components/layout/Sidebar';
import { useCandidaturesAdmin, useEstAdmin } from '@/hooks/useAdmin';

/*
 * Section « Administration » du menu (admin.html), ajoutée sous le menu
 * habituel pour les seuls administrateurs. Le compteur corail donne le nombre
 * de candidatures coachs encore « nouvelles ».
 */
export function useSectionAdmin(): SidebarSection | null {
  const { estAdmin } = useEstAdmin();
  const { data: candidatures } = useCandidaturesAdmin(estAdmin);
  if (!estAdmin) return null;

  const nouvelles = (candidatures ?? []).filter((c) => c.statut === 'nouvelle').length;
  return {
    label: 'Administration',
    items: [
      { accent: 'admin', href: '/admin', exact: true, label: 'Tableau de bord', icon: LayoutDashboard },
      { accent: 'admin', href: '/admin/comptes', label: 'Comptes', icon: Users },
      {
        accent: 'admin',
        href: '/admin/candidatures',
        label: 'Candidatures coachs',
        icon: Star,
        badge: nouvelles ? String(nouvelles) : undefined,
        badgeTon: 'coral',
      },
      { accent: 'admin', href: '/admin/contacts', label: 'Contacts des bilans', icon: Mail },
    ],
  };
}
