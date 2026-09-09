import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';
import { useAppStore } from '@/store/useAppStore';
import { urlConnexion } from '@/lib/authFlux';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  /** Destination si non connecté ; par défaut la connexion, qui ramènera ici ensuite. */
  redirectTo?: string;
}

/**
 * Composant de protection de routes
 * S'appuie sur le flag authReady du store (mis à jour par _app.tsx via onAuthStateChange)
 * pour éviter les appels Supabase redondants et les race conditions.
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requireAuth = true,
  redirectTo,
}) => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();

  useEffect(() => {
    if (!requireAuth || !authReady) return;

    // Auth prête mais pas de session → rediriger
    if (!isAuthenticated) {
      router.replace(redirectTo ?? urlConnexion(router.asPath));
    }
  }, [requireAuth, authReady, isAuthenticated, redirectTo, router]);

  // Afficher un loader tant que l'auth n'est pas prête, ou pendant la transition session -> user
  if (requireAuth && (!authReady || (isAuthenticated && !user))) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <Loader2 className="h-12 w-12 text-primary-600 animate-spin mx-auto mb-4" aria-hidden="true" />
          <p className="text-gray-600" role="status">Vérification de l'authentification...</p>
        </motion.div>
      </div>
    );
  }

  // Auth prête mais pas de session → ne rien afficher (redirection en cours)
  if (requireAuth && !isAuthenticated) {
    return null;
  }

  // Afficher le contenu protégé
  return <>{children}</>;
};

export default ProtectedRoute;

