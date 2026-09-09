import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Lock, AlertCircle, Loader2, CheckCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import Layout from '@/components/layout/Layout';
import Button from '@/components/ui/Button';
import { AuthService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import { APRES_CONNEXION, messageNouveauMotDePasse } from '@/lib/authFlux';

// Schéma de validation
const updatePasswordSchema = z.object({
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword'],
});

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

const UpdatePasswordPage: React.FC = () => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();
  // Le lien reçu par email ouvre une session de récupération ; sans session, le lien est invalide ou expiré.
  const lienInvalide = authReady && !isAuthenticated;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdatePasswordFormData>({
    resolver: zodResolver(updatePasswordSchema),
  });

  const onSubmit = async (data: UpdatePasswordFormData) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await AuthService.updatePassword({ password: data.password });
      setSuccess(true);

      // Rediriger vers l'espace après 2 secondes
      setTimeout(() => {
        router.push(APRES_CONNEXION);
      }, 2000);
    } catch (err: any) {
      console.error('Erreur de mise à jour:', err);
      setError(messageNouveauMotDePasse(err?.message));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Nouveau mot de passe" skipOnboarding>
      <div className="min-h-screen bg-gradient-to-br from-primary-50 via-white to-indigo-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="max-w-md w-full"
        >
          {/* En-tête */}
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <div className="bg-gradient-to-r from-primary-600 to-indigo-600 rounded-full p-3">
                <Lock className="h-8 w-8 text-white" />
              </div>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Nouveau mot de passe
            </h1>
            <p className="text-gray-600">
              Choisissez un nouveau mot de passe sécurisé
            </p>
          </div>

          {/* Carte */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            {/* Message de succès */}
            {success && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex items-start">
                  <CheckCircle className="h-5 w-5 text-green-600 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-green-800">Mot de passe mis à jour !</p>
                    <p className="text-sm text-green-700 mt-1">
                      Redirection vers votre espace...
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Message d'erreur */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start"
              >
                <AlertCircle className="h-5 w-5 text-red-600 mr-3 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-800">{error}</p>
              </motion.div>
            )}

            {lienInvalide && !success && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <p className="text-sm font-medium text-amber-900">Ce lien de réinitialisation est invalide ou a expiré.</p>
                <p className="text-sm text-amber-800 mt-1">
                  <Link href="/auth/forgot-password" className="font-medium underline">Demandez un nouveau lien</Link>
                  {' '}pour choisir votre mot de passe.
                </p>
              </div>
            )}

            {!success && !lienInvalide && (
              <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Nouveau mot de passe */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                    Nouveau mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('password')}
                      type="password"
                      id="password"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                </div>

                {/* Confirmation */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmer le mot de passe
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      {...register('confirmPassword')}
                      type="password"
                      id="confirmPassword"
                      className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                      placeholder="••••••••"
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
                  )}
                </div>

                {/* Bouton de mise à jour */}
                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full"
                  disabled={isLoading}
                  leftIcon={isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Lock className="h-5 w-5" />}
                >
                  {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                </Button>
              </form>
            )}

            {/* Lien retour connexion */}
            {!success && (
              <div className="mt-6 text-center">
                <Link
                  href="/auth/login"
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  Retour à la connexion
                </Link>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
};

export default UpdatePasswordPage;

