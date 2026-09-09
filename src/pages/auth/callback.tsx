import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
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
    <Layout title="Authentification..." skipOnboarding>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            {error ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Erreur d'authentification
                </h1>
                <p className="text-gray-600 mb-4">{error}</p>
                <p className="text-sm text-gray-500">
                  Redirection vers la page de connexion...
                </p>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">
                  Authentification en cours...
                </h1>
                <p className="text-gray-600">
                  Veuillez patienter pendant que nous finalisons votre connexion.
                </p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default AuthCallbackPage;

