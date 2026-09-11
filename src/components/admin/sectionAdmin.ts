import { CreditCard, LayoutDashboard, Mail, Star, Users } from 'lucide-react';
import type { SidebarSection } from '@/components/layout/Sidebar';
import { useCandidaturesAdmin, useDemandesAdmin, useEstAdmin } from '@/hooks/useAdmin';

/*
 * Section « Administration » du menu (admin.html), ajoutée sous le menu
 * habituel pour les seuls administrateurs. Les compteurs corail donnent le
 * nombre de candidatures coachs et de demandes de formule encore « nouvelles ».
 */
export function useSectionAdmin(): SidebarSection | null {
  const { estAdmin } = useEstAdmin();
  const { data: candidatures } = useCandidaturesAdmin(estAdmin);
  const { data: demandes } = useDemandesAdmin(estAdmin);
  if (!estAdmin) return null;

  const nouvelles = (candidatures ?? []).filter((c) => c.statut === 'nouvelle').length;
  const demandesNouvelles = (demandes ?? []).filter((d) => d.statut === 'nouvelle').length;
  return {
    label: 'Administration',
    items: [
      { accent: 'admin', href: '/admin', exact: true, label: 'Tableau de bord', icon: LayoutDashboard },
      { accent: 'admin', href: '/admin/comptes', label: 'Comptes', icon: Users },
      {
        accent: 'admin',
        href: '/admin/demandes',
        label: 'Demandes de formule',
        icon: CreditCard,
        badge: demandesNouvelles ? String(demandesNouvelles) : undefined,
        badgeTon: 'coral',
      },
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
