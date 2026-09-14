import React from 'react';
import { act, render } from '@testing-library/react';

/*
 * MesureAudience : ce qui part vers la base à chaque page, et quand rien ne
 * part. L'autorisation (poste local, refus, GPC…) est testée à part dans
 * __tests__/lib/statistiques.test.ts : ici, elle est toujours accordée.
 */

const mockRouter = { pathname: '/pricing', events: { on: jest.fn(), off: jest.fn() } };
let mockEtat = { authReady: true, isAuthenticated: false };
let mockAdmin = { estAdmin: false, enCours: false };

jest.mock('next/router', () => ({ __esModule: true, default: mockRouter }));
jest.mock('@/store/useAppStore', () => {
  const useAppStore = (selecteur?: (s: typeof mockEtat) => unknown) => (selecteur ? selecteur(mockEtat) : mockEtat);
  useAppStore.getState = () => mockEtat;
  return { useAppStore };
});
jest.mock('@/hooks/useAdmin', () => ({ useEstAdmin: () => mockAdmin }));
jest.mock('@/lib/statistiques/mesure', () => ({
  ...jest.requireActual('@/lib/statistiques/mesure'),
  mesureAutorisee: () => true,
}));

process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://exemple.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'cle-publique';
// Chargé après les variables d'environnement, lues à l'import.
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { MesureAudience } = require('@/components/MesureAudience');

const fetchMock = jest.fn((..._args: unknown[]) => Promise.resolve({}));
global.fetch = fetchMock as unknown as typeof fetch;

let visibilite: DocumentVisibilityState = 'visible';
Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => visibilite });

const appels = () =>
  fetchMock.mock.calls.map(([url, init]) => ({
    fonction: String(url).split('/').pop(),
    corps: JSON.parse((init as RequestInit).body as string),
    init: init as RequestInit,
  }));

const T0 = new Date(2026, 8, 14, 10, 0).getTime();

beforeEach(() => {
  fetchMock.mockClear();
  mockRouter.pathname = '/pricing';
  mockRouter.events.on.mockClear();
  mockEtat = { authReady: true, isAuthenticated: false };
  mockAdmin = { estAdmin: false, enCours: false };
  visibilite = 'visible';
  localStorage.clear();
  sessionStorage.clear();
});

describe('MesureAudience', () => {
  it('enregistre la page affichée, avec la seule clé publique et keepalive', () => {
    render(<MesureAudience />);
    const [a] = appels();
    expect(appels()).toHaveLength(1);
    expect(fetchMock.mock.calls[0][0]).toBe('https://exemple.supabase.co/rest/v1/rpc/enregistrer_vue');
    expect(a.init.keepalive).toBe(true);
    expect((a.init.headers as Record<string, string>).apikey).toBe('cle-publique');
    expect(a.corps).toMatchObject({ p_chemin: '/pricing', p_connecte: false, p_appareil: 'ordinateur' });
    expect(a.corps.p_visiteur).toMatch(/^[0-9a-f-]{36}$/);
  });

  it('envoie le temps passé quand l’onglet passe en arrière-plan', () => {
    const horloge = jest.spyOn(Date, 'now').mockReturnValue(T0);
    render(<MesureAudience />);
    const id = appels()[0].corps.p_id;
    horloge.mockReturnValue(T0 + 42_000);
    visibilite = 'hidden';
    act(() => {
      document.dispatchEvent(new Event('visibilitychange'));
    });
    expect(appels()[1]).toMatchObject({ fonction: 'terminer_vue', corps: { p_id: id, p_duree: 42 } });
    horloge.mockRestore();
  });

  it('clôt la page précédente et compte la suivante au changement de page, dans la même visite', () => {
    const horloge = jest.spyOn(Date, 'now').mockReturnValue(T0);
    render(<MesureAudience />);
    const premiere = appels()[0].corps;
    const surChangement = mockRouter.events.on.mock.calls.find(([nom]) => nom === 'routeChangeComplete')?.[1];
    horloge.mockReturnValue(T0 + 10_000);
    mockRouter.pathname = '/diagnostic';
    act(() => surChangement());
    const [, fin, suivante] = appels();
    expect(fin).toMatchObject({ fonction: 'terminer_vue', corps: { p_id: premiere.p_id, p_duree: 10 } });
    expect(suivante).toMatchObject({ fonction: 'enregistrer_vue', corps: { p_chemin: '/diagnostic', p_visite: premiere.p_visite } });
    // La provenance ne compte que pour la première page de la visite.
    expect(suivante.corps.p_provenance).toBeNull();
    horloge.mockRestore();
  });

  it('ne compte ni les administrateurs, ni avant de savoir qui visite, ni les pages d’administration', () => {
    mockAdmin = { estAdmin: true, enCours: false };
    const { unmount } = render(<MesureAudience />);
    unmount();
    mockAdmin = { estAdmin: false, enCours: true };
    render(<MesureAudience />).unmount();
    mockAdmin = { estAdmin: false, enCours: false };
    mockRouter.pathname = '/admin/comptes';
    render(<MesureAudience />);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
