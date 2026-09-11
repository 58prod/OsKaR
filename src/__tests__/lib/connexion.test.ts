import { APRES_CONNEXION } from '@/lib/authFlux';
import { ouvrirConnexion, useConnexion } from '@/store/useConnexion';

describe('fenêtre de connexion unique', () => {
  beforeEach(() => useConnexion.getState().fermer());

  it('s’ouvre par défaut sur l’inscription, vers l’espace', () => {
    ouvrirConnexion();
    const s = useConnexion.getState();
    expect(s.ouverte).toBe(true);
    expect(s.onglet).toBe('register');
    expect(s.destination).toBe(APRES_CONNEXION);
  });

  it('retient l’onglet et la page de retour demandés', () => {
    ouvrirConnexion('login', '/app/vision?etape=cibles');
    const s = useConnexion.getState();
    expect(s.onglet).toBe('login');
    expect(s.destination).toBe('/app/vision?etape=cibles');
  });

  it('repart d’un formulaire vide à chaque ouverture, et se ferme', () => {
    ouvrirConnexion('login');
    const premiere = useConnexion.getState().ouverture;
    ouvrirConnexion('oubli');
    expect(useConnexion.getState().ouverture).toBe(premiere + 1);
    useConnexion.getState().fermer();
    expect(useConnexion.getState().ouverte).toBe(false);
  });
});
