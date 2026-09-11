import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { CadrePageAuth, Carte, EnTeteCarte, MessageErreur } from '@/components/auth/CarteAuth';
import { AuthService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import { APRES_CONNEXION } from '@/lib/authFlux';

/**
 * Page de callback OAuth (Google, etc.)
 * Gère la redirection après authentification OAuth
 */
const AuthCallbackPage: React.FC = () => {
  const router = useRouter();
  const { setUser } = useAppStore();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Récupérer l'utilisateur courant après OAuth avec retry (cold start Supabase)
        let result = null;
        const MAX_RETRIES = 2;

        for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
          result = await AuthService.getCurrentUser();
          if (result?.profile) break;

          if (attempt < MAX_RETRIES) {
            console.warn(`⚠️ Profil OAuth introuvable (tentative ${attempt + 1}/${MAX_RETRIES + 1}), retry dans 1s...`);
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        if (result && result.profile) {
          // Convertir le profil en User
          const user = AuthService.profileToUser(result.profile);
          setUser(user);

          // Rediriger vers le dashboard ou onboarding selon le profil
          if ((result.profile as any).company_profile) {
            router.push(APRES_CONNEXION);
          } else {
            router.push('/onboarding');
          }
        } else {
          setError('Impossible de récupérer les informations utilisateur');
          setTimeout(() => router.push('/auth/login'), 3000);
        }
      } catch (err: any) {
        console.error('Erreur callback OAuth:', err);
        setError(err.message || 'Une erreur est survenue');
        setTimeout(() => router.push('/auth/login'), 3000);
      }
    };

    handleCallback();
  }, [router, setUser]);

  return (
    <CadrePageAuth titreOnglet="Authentification | Oskar">
      <Carte>
        <EnTeteCarte
          titre={error ? 'Erreur d’authentification' : 'Authentification en cours…'}
          sousTitre={
            error
              ? 'Redirection vers la page de connexion…'
              : 'Veuillez patienter pendant que nous finalisons votre connexion.'
          }
        />
        <div className="p-7">
          {error ? (
            <MessageErreur>{error}</MessageErreur>
          ) : (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 text-teal animate-spin" aria-label="Connexion en cours" />
            </div>
          )}
        </div>
      </Carte>
    </CadrePageAuth>
  );
};

export default AuthCallbackPage;
