import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Diagnostic4Page from '@/pages/diagnostic4';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

jest.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
jest.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => null }));
jest.mock('@/store/useConnexion', () => ({ ouvrirConnexion: jest.fn() }));
jest.mock('@/store/useAppStore', () => ({ useAppStore: (selector: (s: unknown) => unknown) => selector({ authReady: true, isAuthenticated: false }) }));
jest.mock('next/dynamic', () => () => function RadarMock({ valeurs }: { valeurs: { id: string }[] }) { return <div data-testid="radar">{valeurs.map((v) => v.id).join(',')}</div>; });
jest.mock('next/head', () => ({ __esModule: true, default: () => null }));

function repondre(id: PillarId, index: number, reponse: string) {
  fireEvent.click(within(screen.getByRole('group', { name: PILIERS4[id].criteres[index].texte })).getByRole('radio', { name: reponse }));
}
function perception(label: string, valeur = '7') {
  fireEvent.click(within(screen.getByRole('group', { name: `Votre perception · ${label}` })).getByRole('radio', { name: valeur }));
}
function remplir(options: { reponse?: string; sansTeam?: boolean } = {}) {
  PILLARS.filter((p) => !(options.sansTeam && p.id === 'team')).forEach((p) => {
    perception(p.label);
    PILIERS4[p.id].criteres.forEach((_, i) => repondre(p.id, i, options.reponse ?? 'Oui'));
  });
}
beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
});

it('impose une réponse explicite à chaque pratique, sans présélection', () => {
  render(<Diagnostic4Page />);
  expect(screen.getAllByRole('radio').every((r) => !(r as HTMLInputElement).checked)).toBe(true);
  PILLARS.forEach((p) => perception(p.label));
  expect(screen.getByRole('button', { name: 'Encore 20 réponses à renseigner' })).toBeDisabled();
  expect(screen.queryByTestId('radar')).not.toBeInTheDocument();
  remplir();
  expect(screen.getByRole('button', { name: 'Révéler mon analyse' })).toBeEnabled();
});

it('sépare perception et pratiques, et actualise les constats sans changer le score avec la perception', () => {
  render(<Diagnostic4Page />);
  remplir();
  repondre('okr', 3, 'Non');
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  const analyse = within(screen.getByRole('region', { name: 'Votre analyse' }));
  expect(analyse.getByText('Pratiques : 7,5/10')).toBeInTheDocument();
  expect(analyse.getAllByText(PILIERS4.okr.criteres[3].verification)).toHaveLength(2);
  expect(analyse.queryByText('Vos priorités sont claires et suivies.')).not.toBeInTheDocument();
  const scoreAvant = screen.getByRole('region', { name: 'Score global de pratiques' }).textContent;
  perception('OKR', '0');
  expect(screen.getByRole('region', { name: 'Score global de pratiques' }).textContent).toBe(scoreAvant);
  expect(analyse.getByText('Perception : 0/10')).toBeInTheDocument();
  expect(analyse.getAllByText('Preuves à examiner · non vérifiées')).toHaveLength(5);
  repondre('okr', 3, 'Oui');
  expect(analyse.queryByText(PILIERS4.okr.criteres[3].verification)).not.toBeInTheDocument();
});

it('donne une restitution aux réponses inconnues, sans zéro ni faux score global', () => {
  render(<Diagnostic4Page />);
  remplir();
  repondre('finance', 1, 'Je ne sais pas');
  expect(screen.queryByTestId('radar')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  const analyse = within(screen.getByRole('region', { name: 'Votre analyse' }));
  expect(analyse.getByText('Restitution disponible sans score global')).toBeInTheDocument();
  expect(analyse.getByText('Pratiques : non évaluées')).toBeInTheDocument();
  expect(analyse.getAllByText(/Clarifiez cette réponse/).length).toBeGreaterThan(0);
  expect(analyse.queryByText('Priorité proposée, à confirmer')).not.toBeInTheDocument();
  repondre('finance', 1, 'En partie');
  expect(analyse.queryByText('Restitution disponible sans score global')).not.toBeInTheDocument();
  expect(screen.getByTestId('radar')).toBeInTheDocument();
});

it('affiche les exclusions sans action corrective si toutes les réponses sont Non applicable', () => {
  render(<Diagnostic4Page />);
  remplir({ reponse: 'Non applicable' });
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getByText('Restitution disponible sans score global')).toBeInTheDocument();
  expect(screen.getAllByText('Pratiques : non évaluées')).toHaveLength(5);
  expect(screen.queryByText('Action à adapter :')).not.toBeInTheDocument();
});

it('gère le mode solo, son annulation et la remise à zéro', () => {
  render(<Diagnostic4Page />);
  fireEvent.click(screen.getByRole('checkbox', { name: 'Je travaille seul : passer ce pilier' }));
  remplir({ sansTeam: true });
  expect(screen.getByTestId('radar')).not.toHaveTextContent('team');
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getByRole('region', { name: 'Votre analyse' })).toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: 'Je travaille seul : passer ce pilier' }));
  expect(screen.getByRole('button', { name: 'Encore 5 réponses à renseigner' })).toBeDisabled();
  expect(screen.queryByRole('region', { name: 'Votre analyse' })).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Recommencer' }));
  expect(screen.getAllByRole('radio').every((r) => !(r as HTMLInputElement).checked)).toBe(true);
  expect(screen.getByRole('button', { name: 'Encore 25 réponses à renseigner' })).toBeDisabled();
});
