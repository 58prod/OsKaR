import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import { Loader2, AlertCircle } from 'lucide-react';
import Layout from '@/components/layout/Layout';
import { AuthService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import { destinationApresLien, messageLienEmail, typeLienEmail } from '@/lib/authFlux';

/**
 * Arrivée depuis un lien reçu par email (mot de passe oublié…).
 *
 * Le modèle d'email Supabase pointe ici avec `token_hash` et `type` : la page
 * valide le jeton elle-même, ce qui garde le lien sur le domaine du site au
 * lieu de passer par supabase.co. Modèle : supabase/templates/reset-password.html.
 */
const ConfirmationLienPage: React.FC = () => {
  const router = useRouter();
  const { isAuthenticated } = useAppStore();
  const [erreur, setErreur] = useState<string | null>(null);
  const [destination, setDestination] = useState<string | null>(null);
  // Un jeton ne sert qu'une fois : le double montage du mode strict le « brûlerait ».
  const dejaLance = useRef(false);

  useEffect(() => {
    if (!router.isReady || dejaLance.current) return;
    dejaLance.current = true;

    const tokenHash = typeof router.query.token_hash === 'string' ? router.query.token_hash : '';
    const type = typeLienEmail(router.query.type);
    if (!tokenHash || !type) {
      setErreur(messageLienEmail(undefined));
      return;
    }

    AuthService.verifierLienEmail(tokenHash, type)
      .then(() => setDestination(destinationApresLien(type, router.query.next)))
      .catch((err) => setErreur(messageLienEmail(err?.message)));
  }, [router.isReady, router.query]);

  // On attend que l'app ait pris la session en compte avant de changer de page :
  // sans session, la page du nouveau mot de passe jugerait le lien invalide.
  useEffect(() => {
    if (!destination) return;
    if (isAuthenticated) {
      router.replace(destination);
      return;
    }
    const secours = setTimeout(() => router.replace(destination), 4000);
    return () => clearTimeout(secours);
  }, [destination, isAuthenticated, router]);

  return (
    <Layout title="Validation du lien" skipOnboarding>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full text-center"
        >
          <div className="bg-white rounded-xl shadow-lg p-8">
            {erreur ? (
              <>
                <div className="flex justify-center mb-4">
                  <div className="bg-red-100 rounded-full p-3">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                  </div>
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Lien non valide</h1>
                <p className="text-gray-600 mb-6">{erreur}</p>
                <Link
                  href="/auth/forgot-password"
                  className="inline-block font-medium text-primary-600 hover:text-primary-700 underline"
                >
                  Demander un nouveau lien
                </Link>
              </>
            ) : (
              <>
                <div className="flex justify-center mb-4">
                  <Loader2 className="h-12 w-12 text-primary-600 animate-spin" />
                </div>
                <h1 className="text-2xl font-bold text-gray-900 mb-2">Validation du lien…</h1>
                <p className="text-gray-600">Veuillez patienter quelques secondes.</p>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default ConfirmationLienPage;
