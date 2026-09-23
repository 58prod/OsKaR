import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Diagnostic4cPage from '@/pages/diagnostic4c';
import { PILIERS4C, VERDICTS4C } from '@/lib/diagnostic4c/contenu';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

jest.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
jest.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => null }));
jest.mock('@/store/useConnexion', () => ({ ouvrirConnexion: jest.fn() }));
jest.mock('@/hooks/useToast', () => ({ useToast: () => ({ success: jest.fn(), error: jest.fn(), info: jest.fn() }) }));
jest.mock('@/store/useAppStore', () => ({ useAppStore: (selector: (s: unknown) => unknown) => selector({ authReady: true, isAuthenticated: false, user: null }) }));
jest.mock('next/dynamic', () => () => function RadarMock() { return <div data-testid="radar" />; });
jest.mock('next/head', () => ({ __esModule: true, default: () => null }));

const jauge = (label: string) => screen.queryByRole('radiogroup', { name: `Votre perception · ${label}` });
const pratique = (texte: string) => screen.queryByRole('group', { name: texte });
function repondre(id: PillarId, i: number, reponse = 'Oui') {
  fireEvent.click(within(pratique(PILIERS4C[id].criteres[i].texte)!).getByRole('radio', { name: reponse }));
}
function remplirPilier(id: PillarId, label: string, reponse = 'Oui', perception = '7') {
  fireEvent.click(within(jauge(label)!).getByRole('radio', { name: perception }));
  PILIERS4C[id].criteres.forEach((_, i) => repondre(id, i, reponse));
}
beforeEach(() => {
  Element.prototype.scrollIntoView = jest.fn();
  window.scrollTo = jest.fn();
});

it('demande d’abord seul ou avec une équipe, puis ouvre Vision', () => {
  render(<Diagnostic4cPage />);
  expect(jauge('Vision')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: /Avec une équipe/ }));
  expect(jauge('Vision')).toBeInTheDocument();
  fireEvent.click(within(jauge('Vision')!).getByRole('radio', { name: '6' }));
  // Quatre réponses, plus de « Non applicable ».
  const options = within(pratique(PILIERS4C.vision.criteres[0].texte)!).getAllByRole('radio').map((r) => (r.parentElement as HTMLElement).textContent);
  expect(options).toEqual(['Non', 'En partie', 'Oui', 'Je ne sais pas']);
});

it('adapte les pratiques à qui travaille seul et passe Team', () => {
  render(<Diagnostic4cPage />);
  fireEvent.click(screen.getByRole('button', { name: /Seul, sans équipe/ }));
  fireEvent.click(within(jauge('Vision')!).getByRole('radio', { name: '6' }));
  repondre('vision', 0);
  expect(pratique(PILIERS4C.vision.criteres[1].texteSeul!)).toBeInTheDocument();
  expect(screen.getByText('Passé : vous travaillez seul')).toBeInTheDocument();
});

it('restitue un verdict net, des actions reliées à Oskar, et propose le bilan par email', () => {
  render(<Diagnostic4cPage />);
  fireEvent.click(screen.getByRole('button', { name: /Avec une équipe/ }));
  // Les piliers s'ouvrent l'un après l'autre : on les remplit dans l'ordre.
  PILLARS.forEach((p) => (p.id === 'finance' ? remplirPilier('finance', 'Finance', 'Non', '8') : remplirPilier(p.id, p.label)));
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  const analyse = within(screen.getByRole('region', { name: 'Votre analyse' }));
  expect(analyse.getByText(VERDICTS4C.finance.f.titre, { selector: 'p' })).toBeInTheDocument();
  expect(analyse.getByText('Angle mort · Finance')).toBeInTheDocument();
  expect(analyse.getAllByRole('link', { name: /Atelier OSKAR Finance ·/ }).length).toBeGreaterThan(0);
  expect(analyse.queryByText(/cause établie|Lecture indicative/)).not.toBeInTheDocument();
  expect(screen.getAllByRole('button', { name: 'Recevoir mon bilan par email' }).length).toBeGreaterThan(0);
});
