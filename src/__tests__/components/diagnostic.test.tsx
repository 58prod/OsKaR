import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import DiagnosticPage from '@/pages/diagnostic';
import { PILIERS4 } from '@/lib/diagnostic4/contenu';
import { PILLARS, type PillarId } from '@/lib/diagnostic';

jest.mock('@/components/layout/AppShell', () => ({ AppShell: ({ children }: { children: React.ReactNode }) => <main>{children}</main> }));
jest.mock('@/components/layout/UserMenu', () => ({ UserMenu: () => null }));
jest.mock('@/store/useConnexion', () => ({ ouvrirConnexion: jest.fn() }));
const store = { authReady: true, isAuthenticated: false, user: null as null | { id: string; email: string } };
jest.mock('@/store/useAppStore', () => ({ useAppStore: (selector: (s: unknown) => unknown) => selector(store) }));
const toast = { success: jest.fn(), error: jest.fn(), info: jest.fn() };
jest.mock('@/hooks/useToast', () => ({ useToast: () => toast }));
const enregistrer = jest.fn().mockResolvedValue({});
jest.mock('@/hooks/useDiagnostics', () => ({ useCreateDiagnostic: () => ({ mutateAsync: enregistrer, isPending: false }) }));
const getById = jest.fn();
jest.mock('@/services/db/diagnostics', () => ({ DiagnosticsService: { getById: (id: string) => getById(id), getLatestByEmail: jest.fn() } }));
const routeur = { query: {} as Record<string, string>, replace: jest.fn(), push: jest.fn() };
jest.mock('next/router', () => ({ useRouter: () => routeur }));
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
  store.isAuthenticated = false;
  store.user = null;
  routeur.query = {};
  jest.clearAllMocks();
});

it('n’ouvre qu’un pilier, et fait apparaître ses pratiques une à une', () => {
  render(<DiagnosticPage />);
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
  render(<DiagnosticPage />);
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
  render(<DiagnosticPage />);
  PILLARS.filter((p) => p.id !== 'team').forEach((p) => remplirPilier(p.id, p.label));
  fireEvent.click(screen.getByRole('checkbox', { name: /Je travaille seul/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getByRole('region', { name: 'Votre analyse' })).toBeInTheDocument();
  expect(screen.getByText('Passé : je travaille seul')).toBeInTheDocument();
});

it('invite à cliquer, et remplit la jauge jusqu’à la note choisie', () => {
  render(<DiagnosticPage />);
  expect(screen.getByText('Cliquez sur votre note, de 0 à 10')).toBeInTheDocument();
  perception('Vision', '3');
  expect(screen.getByText('3/10')).toBeInTheDocument();
  const cases = within(curseur('Vision')!).getAllByRole('radio');
  expect(cases.filter((c) => c.className.includes('text-white'))).toHaveLength(4); // 0 à 3
  expect(cases[3].getAttribute('aria-checked')).toBe('true');
  expect(groupe(PILIERS4.vision.criteres[0].texte)).toBeInTheDocument();
});

it('« Je ne sais pas » sort du calcul sans valoir zéro, et la couverture s’affiche', () => {
  render(<DiagnosticPage />);
  perception('Vision');
  repondre('vision', 0, 'Je ne sais pas');
  [1, 2, 3].forEach((i) => repondre('vision', i));
  // 3 oui sur 3 pratiques renseignées → 10, et non 7,5.
  expect(screen.getByText('10,0')).toBeInTheDocument();
  expect(screen.getByText('sur 3/4 pratiques')).toBeInTheDocument();
  PILLARS.filter((p) => p.id !== 'vision').forEach((p) => remplirPilier(p.id, p.label));
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  const global = screen.getByRole('region', { name: 'Score global de pratiques' }).textContent;
  expect(global).toMatch(/10,0/);
  expect(global).toMatch(/Établi sur 19 pratiques sur 20/);
});

it('vingt « Je ne sais pas » : ni note, ni profil, et la clarification passe d’abord', () => {
  render(<DiagnosticPage />);
  PILLARS.forEach((p) => remplirPilier(p.id, p.label, 'Je ne sais pas'));
  expect(screen.getByRole('region', { name: 'Score global de pratiques' }).textContent).toMatch(/indisponible/);
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  const analyse = within(screen.getByRole('region', { name: 'Votre analyse' }));
  expect(analyse.getByText('Restitution disponible sans score global')).toBeInTheDocument();
  expect(analyse.queryByText(/pilote à vue/i)).not.toBeInTheDocument();
  expect(analyse.getAllByText('À clarifier :').length).toBeGreaterThan(0);
});

it('affiche le score du pilier au fil des réponses, marqué provisoire', () => {
  render(<DiagnosticPage />);
  perception('Vision');
  repondre('vision', 0, 'Oui');
  // Un seul « Oui » n'affiche pas 10/10 : seulement l'avancement.
  expect(screen.getByText('Provisoire · 1/4 répondues')).toBeInTheDocument();
  expect(screen.queryByText(/10,0/)).not.toBeInTheDocument();
  repondre('vision', 1, 'Non');
  expect(screen.getByText('Provisoire · 2/4 répondues')).toBeInTheDocument();
  expect(screen.getByText(/5,0/)).toBeInTheDocument();
  repondre('vision', 2, 'En partie');
  repondre('vision', 3, 'Oui');
  // Pilier complet : le score définitif et son niveau remplacent le provisoire.
  expect(screen.queryByText(/Provisoire/)).not.toBeInTheDocument();
  expect(screen.getByText(/6,3/)).toBeInTheDocument();
});


it('le rappel des réponses compte aussi les « Je ne sais pas »', () => {
  render(<DiagnosticPage />);
  PILLARS.forEach((p) => {
    perception(p.label);
    PILIERS4[p.id].criteres.forEach((_, i) => repondre(p.id, i, p.id === 'okr' ? ['Oui', 'En partie', 'Non', 'Je ne sais pas'][i] : 'Oui'));
  });
  fireEvent.click(screen.getByRole('button', { name: 'Révéler mon analyse' }));
  expect(screen.getAllByText('1 oui · 1 en partie · 1 non · 1 à clarifier').length).toBeGreaterThan(0);
});

it('la jauge se pilote au clavier comme des boutons radio', () => {
  render(<DiagnosticPage />);
  const cases = within(curseur('Vision')!).getAllByRole('radio');
  expect(cases.filter((c) => c.tabIndex === 0)).toHaveLength(1);
  perception('Vision', '5');
  fireEvent.keyDown(within(curseur('Vision')!).getByRole('radio', { name: '5' }), { key: 'ArrowRight' });
  expect(screen.getByText('6/10')).toBeInTheDocument();
  expect(document.activeElement).toBe(within(curseur('Vision')!).getByRole('radio', { name: '6' }));
  fireEvent.keyDown(document.activeElement!, { key: 'End' });
  expect(screen.getByText('10/10')).toBeInTheDocument();
});

it('au passage au pilier suivant, le focus va sur sa question', () => {
  render(<DiagnosticPage />);
  remplirPilier('vision', 'Vision');
  expect(document.activeElement?.textContent).toBe(PILIERS4.fit.question);
});

it('plus de remplissage automatique de test', () => {
  render(<DiagnosticPage />);
  expect(screen.queryByRole('button', { name: /remplir au hasard/ })).not.toBeInTheDocument();
});

it('enregistre le bilan dans le compte, au format de la version actuelle', async () => {
  store.isAuthenticated = true;
  store.user = { id: 'u1', email: 'dirigeant@exemple.fr' };
  render(<DiagnosticPage />);
  expect(screen.getByRole('button', { name: /Enregistrer/ })).toBeDisabled();
  PILLARS.forEach((p) => remplirPilier(p.id, p.label));
  fireEvent.click(screen.getByRole('button', { name: /Enregistrer/ }));
  await waitFor(() => expect(enregistrer).toHaveBeenCalled());
  const { userId, email, scores, responses } = enregistrer.mock.calls[0][0];
  expect(userId).toBe('u1');
  expect(email).toBe('dirigeant@exemple.fr');
  expect(scores).toMatchObject({ version: 4, average: 10, evaluatedCount: 5, nbPiliers: 5 });
  expect(responses.__version).toBe(4);
});

it('synthèse PDF : enregistre puis envoie les réponses au serveur', async () => {
  store.isAuthenticated = true;
  store.user = { id: 'u1', email: 'dirigeant@exemple.fr' };
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) }) as never;
  render(<DiagnosticPage />);
  PILLARS.forEach((p) => remplirPilier(p.id, p.label));
  fireEvent.click(screen.getByRole('button', { name: /Télécharger la synthèse PDF/ }));
  await waitFor(() => expect(global.fetch).toHaveBeenCalled());
  const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
  expect(url).toBe('/api/send-diagnostic');
  expect(JSON.parse(init.body)).toMatchObject({ email: 'dirigeant@exemple.fr', responses: { __version: 4 } });
  expect(await screen.findByText('Votre synthèse PDF a été envoyée à dirigeant@exemple.fr.')).toBeInTheDocument();
});

it('rouvre un bilan de « Mes bilans » ; un bilan de l’ancienne version part dans la version classique', async () => {
  const piliers = Object.fromEntries(PILLARS.map((p) => [p.id, { perception: 6, reponses: ['oui', 'oui', 'non', 'partiel'] }]));
  getById.mockResolvedValueOnce({ id: 'b4', type: 'organisation', version: 4, email: null, responses: { __version: 4, seul: false, piliers } });
  routeur.query = { bilan: 'b4' };
  const { unmount } = render(<DiagnosticPage />);
  expect(await screen.findByRole('region', { name: 'Votre analyse' })).toBeInTheDocument();
  unmount();
  getById.mockResolvedValueOnce({ id: 'b1', type: 'organisation', version: 1, email: null, responses: {} });
  routeur.query = { bilan: 'b1' };
  render(<DiagnosticPage />);
  await waitFor(() => expect(routeur.replace).toHaveBeenCalledWith('/diagnostic-classique?bilan=b1'));
});
