import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import StatistiquesAdmin from '@/pages/admin/statistiques';
import type { Statistiques } from '@/lib/statistiques/rapport';

/*
 * L'écran /admin/statistiques avec des chiffres d'essai : la base
 * (admin_statistiques) est simulée.
 */

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, pathname: '/admin/statistiques', asPath: '/admin/statistiques', push: jest.fn(), replace: jest.fn() }),
}));
jest.mock('@/components/layout/AppShell', () => ({
  AppShell: ({ children, topbarTitle }: { children: React.ReactNode; topbarTitle: React.ReactNode }) => (
    <div>
      <div>{topbarTitle}</div>
      {children}
    </div>
  ),
}));
jest.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => null }));
jest.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({ user: { id: 'u1', name: 'Christophe G', email: 'c@exemple.fr' }, authReady: true, isAuthenticated: true }),
}));

const jour = (n: number) => `2026-09-${String(8 + n).padStart(2, '0')}`;

const mockStats: Statistiques = {
  jours: 7,
  debut: new Date(2026, 8, 8),
  totaux: { vues: 12, visiteurs: 4, visites: 5, dureeTotale: 600, rebonds: 2, visitesConnectees: 1, nouveaux: 3, actifs: 1 },
  precedent: { vues: 6, visiteurs: 2, visites: 3 },
  parJour: Array.from({ length: 7 }, (_, i) => ({ jour: jour(i), vues: i === 6 ? 2 : 1, visites: i === 6 ? 1 : 0 })),
  parHeure: Array.from({ length: 24 }, (_, h) => (h === 9 ? 5 : 0)),
  pages: [
    { chemin: '/', vues: 8, visiteurs: 4, dureeMoyenne: 42, entrees: 5 },
    { chemin: '/app/outils/roti', vues: 4, visiteurs: 1, dureeMoyenne: 0, entrees: 0 },
  ],
  provenances: [
    { provenance: null, visites: 3 },
    { provenance: 'google.com', visites: 2 },
  ],
  appareils: { mobile: 2, tablette: 0, ordinateur: 3 },
  hotes: [{ hote: 'oskar-coach.fr', vues: 12 }],
};

let mockReponse: { data: Statistiques | null; error: Error | null; isFetching: boolean } = {
  data: mockStats,
  error: null,
  isFetching: false,
};
const mockUseStatistiques = jest.fn((..._args: unknown[]) => mockReponse);

jest.mock('@/hooks/useAdmin', () => ({
  useEstAdmin: () => ({ estAdmin: true, enCours: false }),
  useStatistiquesAdmin: (...args: unknown[]) => mockUseStatistiques(...args),
}));

beforeEach(() => {
  mockReponse = { data: mockStats, error: null, isFetching: false };
  mockUseStatistiques.mockClear();
});

describe('Statistiques de fréquentation', () => {
  it('affiche les chiffres clés, sur 30 jours et le site en ligne par défaut', () => {
    render(<StatistiquesAdmin />);
    expect(mockUseStatistiques).toHaveBeenLastCalledWith(true, 30, 'oskar-coach.fr');
    expect(screen.getAllByText('+100 %')).toHaveLength(2); // visiteurs et pages vues
    expect(screen.getByText('2,4 pages par visite')).toBeInTheDocument();
    expect(screen.getByText('2 min 00')).toBeInTheDocument();
    expect(screen.getByText('40 % repartent après une seule page')).toBeInTheDocument();
    expect(screen.getByText('1 visiteur')).toBeInTheDocument();
  });

  it('nomme les pages connues et garde l’adresse des autres', () => {
    render(<StatistiquesAdmin />);
    const tableau = screen.getByRole('table');
    expect(within(tableau).getByText('Accueil')).toBeInTheDocument();
    expect(within(tableau).getByText('/app/outils/roti')).toBeInTheDocument();
    expect(within(tableau).getByText('42 s')).toBeInTheDocument();
  });

  it('montre la provenance, l’accès direct compris', () => {
    render(<StatistiquesAdmin />);
    expect(screen.getByText('Accès direct (adresse tapée, favori, email…)')).toBeInTheDocument();
    expect(screen.getByText('google.com')).toBeInTheDocument();
  });

  it('donne le détail d’une barre au survol', () => {
    render(<StatistiquesAdmin />);
    const graphe = screen.getByRole('img', { name: /^Visites par jour/ });
    fireEvent.mouseEnter(graphe.lastElementChild as Element);
    expect(within(graphe).getByText(/1 visite, 2 pages vues/)).toBeInTheDocument();
  });

  it('change de période', () => {
    render(<StatistiquesAdmin />);
    fireEvent.click(screen.getByRole('button', { name: '12 mois' }));
    expect(mockUseStatistiques).toHaveBeenLastCalledWith(true, 365, 'oskar-coach.fr');
  });

  it('explique l’absence de chiffres au démarrage', () => {
    mockReponse = { data: { ...mockStats, totaux: { ...mockStats.totaux, vues: 0 } }, error: null, isFetching: false };
    render(<StatistiquesAdmin />);
    expect(screen.getByText(/Aucune page vue sur cette période/)).toBeInTheDocument();
  });

  it('signale une migration pas encore exécutée', () => {
    mockReponse = { data: null, error: new Error('Could not find the function public.admin_statistiques'), isFetching: false };
    render(<StatistiquesAdmin />);
    expect(screen.getByRole('alert')).toHaveTextContent('admin_statistiques');
  });
});
