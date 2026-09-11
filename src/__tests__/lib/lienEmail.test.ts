import { APRES_CONNEXION, destinationApresLien, messageLienEmail, typeLienEmail } from '@/lib/authFlux';

describe('liens reçus par email (/auth/confirm)', () => {
  it('ne reconnaît que les types de lien connus de Supabase', () => {
    expect(typeLienEmail('recovery')).toBe('recovery');
    expect(typeLienEmail('email_change')).toBe('email_change');
    expect(typeLienEmail('pirate')).toBeNull();
    expect(typeLienEmail(undefined)).toBeNull();
    expect(typeLienEmail(['recovery'])).toBeNull();
  });

  it('envoie toujours un lien de réinitialisation vers le choix du mot de passe', () => {
    expect(destinationApresLien('recovery')).toBe('/auth/update-password');
    expect(destinationApresLien('recovery', 'https://evil.example')).toBe('/auth/update-password');
  });

  it('suit `next` seulement s’il est interne, sinon l’espace', () => {
    expect(destinationApresLien('signup', '/app/vision')).toBe('/app/vision');
    expect(destinationApresLien('signup', '//evil.example')).toBe(APRES_CONNEXION);
    expect(destinationApresLien('magiclink')).toBe(APRES_CONNEXION);
  });

  it('traduit les erreurs en français', () => {
    expect(messageLienEmail('Email link is invalid or has expired')).toMatch(/invalide ou a expiré/);
    expect(messageLienEmail('Failed to fetch')).toMatch(/joindre le serveur/);
  });
});
