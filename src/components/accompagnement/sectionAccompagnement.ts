import { Briefcase, HeartHandshake } from 'lucide-react';
import type { SidebarNavItem, SidebarSection } from '@/components/layout/Sidebar';
import { useMesAccompagnements, useProfilCoach } from '@/hooks/useAccompagnements';
import { compteurCoach, compteurDirigeant } from '@/lib/accompagnement/regles';

/*
 * Section « Accompagnement » du menu, sous le menu habituel :
 *   - « Mes dirigeants » pour un coach référencé (accent corail, comme
 *     l'Espace coachs), compteur = demandes à traiter + dirigeants qui ont
 *     avancé depuis sa dernière visite ;
 *   - « Mes coachs » pour un dirigeant relié ou invité, compteur = invitations
 *     à traiter. Sans lien, l'entrée reste dans le menu du compte.
 */
export function useSectionAccompagnement(): SidebarSection | null {
  const { estCoach } = useProfilCoach();
  const { data } = useMesAccompagnements();
  const liste = data ?? [];
  const relieAUnCoach = liste.some((a) => a.role === 'dirigeant');
  if (!estCoach && !relieAUnCoach) return null;

  const items: SidebarNavItem[] = [];
  if (estCoach) {
    const n = compteurCoach(liste);
    items.push({
      accent: 'coach',
      href: '/app/mes-dirigeants',
      label: 'Mes dirigeants',
      icon: Briefcase,
      badge: n ? String(n) : undefined,
      badgeTon: 'coral',
    });
  }
  if (relieAUnCoach) {
    const n = compteurDirigeant(liste);
    items.push({
      href: '/app/mes-coachs',
      label: 'Mes coachs',
      icon: HeartHandshake,
      badge: n ? String(n) : undefined,
      badgeTon: 'coral',
    });
  }
  return { label: 'Accompagnement', items };
}
