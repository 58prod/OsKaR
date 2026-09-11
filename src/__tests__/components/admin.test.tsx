import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import TableauDeBordAdmin from '@/pages/admin/index';
import ComptesAdmin from '@/pages/admin/comptes';
import CandidaturesAdmin from '@/pages/admin/candidatures';
import ContactsAdmin from '@/pages/admin/contacts';
import { FicheCompteVolet } from '@/components/admin/FicheCompteVolet';
import { EmailPromptModal } from '@/components/diagnostic/EmailPromptModal';
import type { BilanAdmin, CandidatureAdmin, CompteAdmin, FicheCompte } from '@/lib/admin/types';

/*
 * Les écrans d'administration s'affichent avec des données d'essai : les
 * données réelles passent par les fonctions admin_* de la base, simulées ici.
 */

jest.mock('next/router', () => ({
  useRouter: () => ({ query: {}, pathname: '/admin', asPath: '/admin', push: jest.fn(), replace: jest.fn() }),
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
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn(), info: jest.fn() }) }));

const jours = (n: number) => new Date(Date.now() + n * 24 * 60 * 60 * 1000);
const aucun = { vision: false, fit: false, finance: false, okr: false, team: false };

const mockComptes: CompteAdmin[] = [
  {
    id: 'c1', email: 'sophie@exemple.fr', nom: 'Sophie Lemaire', entreprise: 'Boulangerie du Marché',
    activite: 'Boulanger', creeLe: jours(-1), derniereConnexion: jours(-0.1), plan: 'free', statut: 'active',
    expireLe: null, offerte: false, motif: null, stripe: false, demo: false,
    ateliers: { ...aucun, vision: true }, nbBilans: 1,
  },
  {
    id: 'c2', email: 'karim@exemple.fr', nom: 'Karim Benali', entreprise: 'KB Plomberie', activite: 'Plombier',
    creeLe: jours(-3), derniereConnexion: null, plan: 'unlimited', statut: 'active', expireLe: jours(10),
    offerte: true, motif: 'Membre fondateur', stripe: false, demo: false,
    ateliers: { ...aucun, vision: true, fit: true }, nbBilans: 0,
  },
];

const mockBilans: BilanAdmin[] = [
  { id: 'b1', creeLe: jours(-1), email: 'oui@exemple.fr', type: 'produit', note: 6.8, accepteRecontact: true, aUnCompte: false, compteExiste: false },
  { id: 'b2', creeLe: jours(-2), email: 'non@exemple.fr', type: 'organisation', note: 4.4, accepteRecontact: false, aUnCompte: false, compteExiste: false },
];

const mockCandidatures: CandidatureAdmin[] = [
  {
    id: 'k1', prenom: 'Élodie', nom: 'Vasseur', email: 'elodie@exemple.fr', zone: 'Hérault', structure: 'Vasseur Coaching',
    site: 'vasseur-coaching.fr', piliers: ['vision', 'team'], labelRpr: true, approche: 'J’accompagne des dirigeants.',
    statut: 'nouvelle', notes: null, creeLe: jours(-3), traiteeLe: null,
  },
  {
    id: 'k2', prenom: 'Mathieu', nom: 'Perrin', email: 'm@exemple.fr', zone: 'Lyon', structure: null, site: null,
    piliers: ['okr'], labelRpr: false, approche: null, statut: 'validee', notes: 'Fiche publiée.', creeLe: jours(-20), traiteeLe: jours(-10),
  },
];

const mockFiche: FicheCompte = {
  vision: { pourquoi: 'Parce que' }, fit: null, finance: null, team: null,
  okr: { ambitions: 1, objectifs: 0, actions: 0 },
  bilans: [{ id: 'b9', type: 'organisation', creeLe: jours(-1), note: 5.8 }],
};

jest.mock('@/hooks/useAdmin', () => ({
  useEstAdmin: () => ({ estAdmin: true, enCours: false }),
  useComptesAdmin: () => ({ data: mockComptes, isLoading: false, error: null }),
  useBilansAdmin: () => ({ data: mockBilans, isLoading: false, error: null }),
  useCandidaturesAdmin: () => ({ data: mockCandidatures, isLoading: false, error: null }),
  useFicheCompte: () => ({ data: mockFiche, isLoading: false, error: null }),
  useMajCandidature: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useOffrirFormule: () => ({ mutateAsync: jest.fn(), isPending: false }),
  useRetirerFormule: () => ({ mutateAsync: jest.fn(), isPending: false }),
}));

describe('Administration', () => {
  it('le tableau de bord affiche les chiffres clés et ce qui attend une réponse', () => {
    render(<TableauDeBordAdmin />);
    expect(screen.getByRole('heading', { name: 'Tableau de bord' })).toBeInTheDocument();
    expect(screen.getByText('1 nouvelle candidature coach')).toBeInTheDocument();
    expect(screen.getByText('1 formule offerte expire dans moins de 30 jours')).toBeInTheDocument();
    expect(screen.getByText('1 offerte · 0 abonnement')).toBeInTheDocument();
    expect(screen.getAllByText('Sophie Lemaire').length).toBeGreaterThan(0);
  });

  it('la liste des comptes se filtre par formule', () => {
    render(<ComptesAdmin />);
    expect(screen.getByText('Sophie Lemaire')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Formule offerte/ }));
    expect(screen.queryByText('Sophie Lemaire')).not.toBeInTheDocument();
    expect(screen.getByText('Karim Benali')).toBeInTheDocument();
  });

  it('la fiche d’un compte gratuit propose d’offrir la formule', () => {
    render(<FicheCompteVolet compte={mockComptes[0]} onFermer={jest.fn()} />);
    const fiche = screen.getByRole('dialog', { name: 'Fiche de Sophie Lemaire' });
    expect(within(fiche).getByRole('button', { name: 'Offrir la formule payante' })).toBeInTheDocument();
    // Vision : le sens, et le texte de vision que l'atelier en assemble.
    expect(within(fiche).getByText('2/7')).toBeInTheDocument();
    expect(within(fiche).getByText('1/3')).toBeInTheDocument();
  });

  it('la fiche d’une formule offerte permet de la prolonger ou de la retirer', () => {
    render(<FicheCompteVolet compte={mockComptes[1]} onFermer={jest.fn()} />);
    expect(screen.getByRole('button', { name: 'Prolonger' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retirer la formule' })).toBeInTheDocument();
    expect(screen.getByText('Motif : Membre fondateur')).toBeInTheDocument();
  });

  it('les candidatures s’ouvrent sur les nouvelles', () => {
    render(<CandidaturesAdmin />);
    expect(screen.getByText('Élodie Vasseur')).toBeInTheDocument();
    expect(screen.queryByText('Mathieu Perrin')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Toutes/ }));
    expect(screen.getByText('Mathieu Perrin')).toBeInTheDocument();
  });

  it('les contacts montrent d’abord ceux qui acceptent d’être recontactés', () => {
    render(<ContactsAdmin />);
    expect(screen.getByText('oui@exemple.fr')).toBeInTheDocument();
    expect(screen.queryByText('non@exemple.fr')).not.toBeInTheDocument();
  });
});

describe('Consentement dans la fenêtre d’email des bilans', () => {
  it('la case est décochée par défaut et sa valeur est transmise', () => {
    const envoyer = jest.fn();
    render(
      <EmailPromptModal
        open
        title="Recevoir ma synthèse"
        description="Votre email"
        submitLabel="Envoyer"
        defaultEmail="a@exemple.fr"
        demanderConsentement
        onSubmit={envoyer}
        onClose={jest.fn()}
      />
    );
    const caseRecontact = screen.getByRole('checkbox', { name: /me recontacte/ });
    expect(caseRecontact).not.toBeChecked();
    fireEvent.click(caseRecontact);
    fireEvent.click(screen.getByRole('button', { name: 'Envoyer' }));
    expect(envoyer).toHaveBeenCalledWith('a@exemple.fr', true);
  });

  it('sans la demande, pas de case et jamais de consentement', () => {
    const envoyer = jest.fn();
    render(
      <EmailPromptModal open title="Restaurer" description="Email" submitLabel="Restaurer" defaultEmail="a@exemple.fr" onSubmit={envoyer} onClose={jest.fn()} />
    );
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Restaurer' }));
    expect(envoyer).toHaveBeenCalledWith('a@exemple.fr', false);
  });
});
