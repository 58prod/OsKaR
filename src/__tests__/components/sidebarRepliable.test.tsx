import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { Settings, Star, Users } from 'lucide-react';
import { Sidebar, type SidebarSection } from '@/components/layout/Sidebar';

/*
 * Menu des administrateurs : les sections se rabattent d'un clic sur leur
 * titre, et le choix est retenu par le navigateur.
 */

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/admin/comptes', asPath: '/admin/comptes', query: {} }),
}));
jest.mock('next/image', () => ({
  __esModule: true,
  default: ({ alt }: { alt: string }) => <span>{alt}</span>,
}));

const sections: SidebarSection[] = [
  { label: 'Navigation', items: [{ href: '/', label: 'Accueil', icon: Star }] },
  {
    label: 'Ressources',
    items: [
      { href: '/app/outils', label: 'Boîte à outils', icon: Settings },
      { href: '/pricing', label: 'Tarifs', icon: Settings },
    ],
  },
  {
    label: 'Administration',
    items: [
      { href: '/admin', exact: true, label: 'Tableau de bord', icon: Users },
      { href: '/admin/comptes', label: 'Comptes', icon: Users },
    ],
  },
];

const menu = (repliable = true) =>
  render(<Sidebar collapsed={false} onToggle={jest.fn()} sections={sections} footerItem={null} repliable={repliable} />);

beforeEach(() => window.localStorage.clear());

describe('Sections rabattables du menu', () => {
  it('rabat une section et retient le choix', () => {
    menu();
    const titre = screen.getByRole('button', { name: 'Ressources' });
    expect(titre).toHaveAttribute('aria-expanded', 'true');
    fireEvent.click(titre);
    expect(titre).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('link', { name: /Tarifs/ })).not.toBeInTheDocument();
    expect(JSON.parse(window.localStorage.getItem('oskar.menu.sectionsRepliees') ?? '[]')).toEqual(['Ressources']);

    fireEvent.click(titre);
    expect(screen.getByRole('link', { name: /Tarifs/ })).toBeInTheDocument();
  });

  it('garde la page en cours dans une section rabattue', () => {
    menu();
    fireEvent.click(screen.getByRole('button', { name: 'Administration' }));
    const groupe = screen.getByRole('group', { name: 'Administration' });
    expect(within(groupe).getByRole('link', { name: /Comptes/ })).toBeInTheDocument();
    expect(within(groupe).queryByRole('link', { name: /Tableau de bord/ })).not.toBeInTheDocument();
  });

  it('reprend les sections rabattues à la visite suivante', () => {
    window.localStorage.setItem('oskar.menu.sectionsRepliees', JSON.stringify(['Ressources']));
    menu();
    expect(screen.getByRole('button', { name: 'Ressources' })).toHaveAttribute('aria-expanded', 'false');
  });

  it('ne rabat ni la première section, ni rien hors administration', () => {
    const { unmount } = menu();
    expect(screen.queryByRole('button', { name: 'Navigation' })).not.toBeInTheDocument();
    unmount();
    menu(false);
    expect(screen.queryByRole('button', { name: 'Ressources' })).not.toBeInTheDocument();
  });
});
