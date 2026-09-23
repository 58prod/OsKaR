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
const curseur = (label: string) => screen.queryByRole('radiogroup', { name: `Votre perception · ${label}` });
function perception(label: string, valeur = '7') {
  fireEvent.click(within(curseur(label)!).getByRole('radio', { name: valeur }));
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
  expect(curseur('Vision')).toBeInTheDocument();
  expect(curseur('Market Fit')).not.toBeInTheDocument();
  expect(groupe(PILIERS4.vision.criteres[0].texte)).not.toBeInTheDocument();
  perception('Vision');
  expect(groupe(PILIERS4.vision.criteres[0].texte)).toBeInTheDocument();
  expect(groupe(PILIERS4.vision.criteres[1].texte)).not.toBeInTheDocument();
  repondre('vision', 0, 'En partie');
  expect(groupe(PILIERS4.vision.criteres[1].texte)).toBeInTheDocument();
});

it('replie le pilier rempli, ouvre le suivant, et le rouvre à la flèche', () => {
  render(<Diagnostic4bPage />);
  remplirPilier('vision', 'Vision');
  expect(curseur('Vision')).not.toBeInTheDocument();
  expect(curseur('Market Fit')).toBeInTheDocument();
  // La flèche déplie le pilier rempli, modifiable sans fermer le pilier en cours.
  fireEvent.click(screen.getByRole('button', { name: 'Déplier Vision pour le modifier' }));
  expect(groupe(PILIERS4.vision.criteres[3].texte)).toBeInTheDocument();
  expect(curseur('Market Fit')).toBeInTheDocument();
  repondre('vision', 3, 'Non');
  expect(screen.getByText(/7,5/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Replier Vision' }));
  expect(groupe(PILIERS4.vision.criteres[3].texte)).not.toBeInTheDocument();
  expect(curseur('Market Fit')).toBeInTheDocument();
});

it('garde le calcul et la restitution de la V4, « Je travaille seul » compris', () => {
  render(<Diagnostic4bPage />);
  PILLARS.filter((p) => p.id !== 'team').forEach((p) => remplirPilier(p.id, p.label));
  fireEvent.click(screen.getByRole('checkbox', { name: /Je travaille seul/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getByRole('region', { name: 'Votre analyse' })).toBeInTheDocument();
  expect(screen.getByText('Passé : je travaille seul')).toBeInTheDocument();
});

it('invite à cliquer, et remplit la jauge jusqu’à la note choisie', () => {
  render(<Diagnostic4bPage />);
  expect(screen.getByText('Cliquez sur votre note, de 0 à 10')).toBeInTheDocument();
  perception('Vision', '3');
  expect(screen.getByText('3/10')).toBeInTheDocument();
  const cases = within(curseur('Vision')!).getAllByRole('radio');
  expect(cases.filter((c) => c.className.includes('text-white'))).toHaveLength(4); // 0 à 3
  expect(cases[3].getAttribute('aria-checked')).toBe('true');
  expect(groupe(PILIERS4.vision.criteres[0].texte)).toBeInTheDocument();
});

it('« Je ne sais pas » compte comme non en place sans effacer le score', () => {
  render(<Diagnostic4bPage />);
  perception('Vision');
  repondre('vision', 0, 'Je ne sais pas');
  [1, 2, 3].forEach((i) => repondre('vision', i));
  // 3 oui sur 4 → 7,5, affiché sur la ligne repliée de Vision.
  expect(screen.getByText('7,5')).toBeInTheDocument();
  PILLARS.filter((p) => p.id !== 'vision').forEach((p) => remplirPilier(p.id, p.label));
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getByRole('region', { name: 'Score global de pratiques' }).textContent).toMatch(/9,5/);
});

it('affiche le score du pilier au fil des réponses, marqué provisoire', () => {
  render(<Diagnostic4bPage />);
  perception('Vision');
  repondre('vision', 0, 'Oui');
  expect(screen.getByText('Provisoire · 1/4')).toBeInTheDocument();
  expect(screen.getByText(/10,0/)).toBeInTheDocument();
  repondre('vision', 1, 'Non');
  expect(screen.getByText('Provisoire · 2/4')).toBeInTheDocument();
  expect(screen.getByText(/5,0/)).toBeInTheDocument();
  repondre('vision', 2, 'En partie');
  repondre('vision', 3, 'Oui');
  // Pilier complet : le score définitif et son niveau remplacent le provisoire.
  expect(screen.queryByText(/Provisoire/)).not.toBeInTheDocument();
  expect(screen.getByText(/6,3/)).toBeInTheDocument();
});

it('le bouton de test remplit tout au hasard et affiche l’analyse', () => {
  render(<Diagnostic4bPage />);
  fireEvent.click(screen.getByRole('button', { name: 'Test : remplir au hasard' }));
  expect(screen.getByRole('region', { name: 'Votre analyse' })).toBeInTheDocument();
  expect(screen.getByRole('button', { name: 'Révéler mon analyse' })).toBeEnabled();
});

it('le rappel des réponses compte aussi les « Je ne sais pas »', () => {
  render(<Diagnostic4bPage />);
  PILLARS.forEach((p) => {
    perception(p.label);
    PILIERS4[p.id].criteres.forEach((_, i) => repondre(p.id, i, p.id === 'okr' ? ['Oui', 'En partie', 'Non', 'Je ne sais pas'][i] : 'Oui'));
  });
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getAllByText('1 oui · 1 en partie · 1 non · 1 à clarifier').length).toBeGreaterThan(0);
});
