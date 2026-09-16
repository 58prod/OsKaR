import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import Diagnostic4Page from '@/pages/diagnostic4';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { PILLARS } from '@/lib/diagnostic';

jest.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
jest.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => null }));
jest.mock('@/store/useConnexion', () => ({ ouvrirConnexion: jest.fn() }));
jest.mock('@/store/useAppStore', () => ({ useAppStore: (selector: (s: unknown) => unknown) => selector({ authReady: true, isAuthenticated: false }) }));
jest.mock('next/dynamic', () => () => function RadarMock() { return null; });
jest.mock('next/head', () => ({ __esModule: true, default: () => null }));

it('affiche les réponses exactes, puis actualise la conclusion quand le suivi est coché', () => {
  Element.prototype.scrollIntoView = jest.fn();
  render(<Diagnostic4Page />);
  PILLARS.forEach((p) => {
    fireEvent.click(within(screen.getByRole('radiogroup', { name: `Note spontanée, pilier ${p.label}` })).getByRole('radio', { name: '7' }));
    PILIERS4[p.id].criteres.forEach((c, index) => {
      if (p.id !== 'okr' || index !== 3) fireEvent.click(screen.getByRole('checkbox', { name: c.texte }));
    });
  });
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  const analyse = within(screen.getByRole('region', { name: 'Votre analyse' }));
  expect(analyse.getByText('Nos objectifs de l’année sont chiffrés et datés.')).toBeInTheDocument();
  expect(analyse.getAllByText('À quelle fréquence faites-vous le point sur l’avancement des priorités ?')).toHaveLength(2);
  expect(analyse.queryByText('Nos priorités sont claires et suivies.')).not.toBeInTheDocument();
  expect(analyse.queryByText('Votre regard est lucide.')).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole('checkbox', { name: PILIERS4.okr.criteres[3].texte }));
  expect(analyse.queryByText('À quelle fréquence faites-vous le point sur l’avancement des priorités ?')).not.toBeInTheDocument();
  expect(analyse.getByText(PILIERS4.okr.criteres[3].texte)).toBeInTheDocument();
  expect(analyse.getByText(/Toutes les pratiques des piliers évalués sont cochées/)).toBeInTheDocument();
});
