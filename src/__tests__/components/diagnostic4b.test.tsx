import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Diagnostic4bPage from '@/pages/diagnostic4b';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

jest.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
jest.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => null }));
jest.mock('@/store/useConnexion', () => ({ ouvrirConnexion: jest.fn() }));
jest.mock('@/store/useAppStore', () => ({ useAppStore: (selector: (s: unknown) => unknown) => selector({ authReady: true, isAuthenticated: false }) }));
jest.mock('next/dynamic', () => () => function RadarMock() { return <div data-testid="radar" />; });
jest.mock('next/head', () => ({ __esModule: true, default: () => null }));

const groupe = (nom: string) => screen.queryByRole('group', { name: nom });
function repondre(id: PillarId, index: number, reponse = 'Oui') {
  fireEvent.click(within(screen.getByRole('group', { name: PILIERS4[id].criteres[index].texte })).getByRole('radio', { name: reponse }));
}
function perception(label: string, valeur = '7') {
  fireEvent.click(within(screen.getByRole('group', { name: `Votre perception · ${label}` })).getByRole('radio', { name: valeur }));
}
function remplirPilier(id: PillarId, label: string, reponse = 'Oui') {
  perception(label);
  PILIERS4[id].criteres.forEach((_, i) => repondre(id, i, reponse));
}
beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
});

it('n’ouvre qu’un pilier, et fait apparaître ses pratiques une à une', () => {
  render(<Diagnostic4bPage />);
  expect(groupe('Votre perception · Vision')).toBeInTheDocument();
  expect(groupe('Votre perception · Market Fit')).not.toBeInTheDocument();
  expect(groupe(PILIERS4.vision.criteres[0].texte)).not.toBeInTheDocument();
  perception('Vision');
  expect(groupe(PILIERS4.vision.criteres[0].texte)).toBeInTheDocument();
  expect(groupe(PILIERS4.vision.criteres[1].texte)).not.toBeInTheDocument();
  repondre('vision', 0, 'En partie');
  expect(groupe(PILIERS4.vision.criteres[1].texte)).toBeInTheDocument();
});

it('replie le pilier rempli, ouvre le suivant, et permet de revenir le modifier', () => {
  render(<Diagnostic4bPage />);
  remplirPilier('vision', 'Vision');
  expect(groupe('Votre perception · Vision')).not.toBeInTheDocument();
  expect(groupe('Votre perception · Market Fit')).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Modifier Vision' }));
  expect(groupe(PILIERS4.vision.criteres[3].texte)).toBeInTheDocument();
  repondre('vision', 3, 'Non');
  fireEvent.click(screen.getByRole('button', { name: 'Valider ce pilier' }));
  expect(groupe('Votre perception · Market Fit')).toBeInTheDocument();
});

it('garde le calcul et la restitution de la V4, « Je travaille seul » compris', () => {
  render(<Diagnostic4bPage />);
  PILLARS.filter((p) => p.id !== 'team').forEach((p) => remplirPilier(p.id, p.label));
  fireEvent.click(screen.getByRole('checkbox', { name: /Je travaille seul/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getByRole('region', { name: 'Votre analyse' })).toBeInTheDocument();
  expect(screen.getByText('Passé : je travaille seul')).toBeInTheDocument();
});
