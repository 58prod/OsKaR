import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { VueFicheCoach } from '@/components/accompagnement/VueFicheCoach';
import { UserMenu } from '@/components/layout/UserMenu';
import type { ProfilCoach } from '@/lib/accompagnement/types';

/*
 * Le mode coach : le menu sous le nom change selon le compte, et le coach
 * tient sa fiche (structure et annuaire) lui-même.
 */

const mockPush = jest.fn();
let mockEstCoach = false;

jest.mock('next/router', () => ({
  useRouter: () => ({ pathname: '/', asPath: '/', query: {}, push: mockPush }),
}));
jest.mock('@/store/useAppStore', () => ({
  useAppStore: () => ({ user: { id: 'u1', name: 'Camille Roche', email: 'coach@demo.oskar' }, logout: jest.fn() }),
}));
jest.mock('@/hooks/useAccompagnements', () => ({
  useProfilCoach: () => ({ estCoach: mockEstCoach, profil: null, enCours: false }),
}));
jest.mock('@/services/auth', () => ({ AuthService: { signOut: jest.fn() } }));
jest.mock('@/lib/supabaseClient', () => ({ supabase: {}, isSupabaseConfigured: () => false }));

const ouvrirMenu = () => {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <UserMenu />
    </QueryClientProvider>
  );
  fireEvent.click(screen.getByRole('button', { name: /Camille Roche/ }));
  return screen.getAllByRole('menuitem').map((b) => b.textContent);
};

describe('Menu sous le nom', () => {
  it('propose au dirigeant ses bilans, ses coachs et son entreprise', () => {
    mockEstCoach = false;
    expect(ouvrirMenu()).toEqual(['Mes bilans', 'Mes coachs', "Profil d'entreprise", 'Paramètres', 'Déconnexion']);
    expect(screen.queryByText('Coach référencé')).not.toBeInTheDocument();
  });

  it('propose au coach ses dirigeants, sa fiche et son kit', () => {
    mockEstCoach = true;
    expect(ouvrirMenu()).toEqual(['Mes dirigeants', 'Ma fiche coach', 'Kit du coach', 'Paramètres', 'Déconnexion']);
    expect(screen.getByText('Coach référencé')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('menuitem', { name: 'Ma fiche coach' }));
    expect(mockPush).toHaveBeenCalledWith('/app/ma-fiche-coach');
  });
});

describe('Ma fiche coach', () => {
  const profil: ProfilCoach = {
    disponible: true,
    resumeQuotidien: false,
    structure: 'Cap Dirigeants',
    siret: null,
    site: null,
    zone: 'Lille',
    piliers: ['vision'],
    approche: null,
    referenceLe: new Date('2026-09-11T08:00:00Z'),
  };

  const vue = () => {
    const p = { onEnregistrer: jest.fn().mockResolvedValue(true), onReglages: jest.fn().mockResolvedValue(true) };
    render(<VueFicheCoach profil={profil} nom="Camille Roche" {...p} />);
    return p;
  };

  it('n’enregistre qu’une fiche modifiée et valide', async () => {
    const p = vue();
    const enregistrer = screen.getByRole('button', { name: 'Enregistrer' });
    expect(enregistrer).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/SIRET/), { target: { value: '1234' } });
    fireEvent.click(enregistrer);
    expect(await screen.findByRole('alert')).toHaveTextContent('Le SIRET compte 14 chiffres.');
    expect(p.onEnregistrer).not.toHaveBeenCalled();

    fireEvent.change(screen.getByLabelText(/SIRET/), { target: { value: '123 456 789 00012' } });
    fireEvent.click(screen.getByRole('button', { name: 'OKR' }));
    fireEvent.change(screen.getByLabelText('Votre approche en quelques lignes'), {
      target: { value: 'J’accompagne des artisans.' },
    });
    fireEvent.click(enregistrer);
    await waitFor(() =>
      expect(p.onEnregistrer).toHaveBeenCalledWith(
        expect.objectContaining({ siret: '123 456 789 00012', piliers: ['vision', 'okr'], approche: 'J’accompagne des artisans.' })
      )
    );
  });

  it('montre l’aperçu de la fiche au fil de la saisie', () => {
    vue();
    expect(screen.getByText('Cap Dirigeants · Lille')).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText('Votre approche en quelques lignes'), { target: { value: 'Mon approche' } });
    // Dans la zone de saisie, et recopié dans l'aperçu.
    expect(screen.getByText('Mon approche', { selector: 'p' })).toBeInTheDocument();
    expect(screen.getByText('Prend de nouveaux accompagnements')).toBeInTheDocument();
  });

  it('règle la disponibilité', () => {
    const p = vue();
    fireEvent.click(screen.getByRole('switch', { name: 'Je prends de nouveaux accompagnements' }));
    expect(p.onReglages).toHaveBeenCalledWith({ disponible: false });
  });
});
