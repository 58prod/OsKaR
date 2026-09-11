import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { CLS, CadrePageAuth, Carte, EnTeteCarte, MessageErreur, MessageInfo } from '@/components/auth/CarteAuth';
import { AuthService } from '@/services/auth';
import { useAppStore } from '@/store/useAppStore';
import { APRES_CONNEXION, messageNouveauMotDePasse } from '@/lib/authFlux';

// Schéma de validation
const updatePasswordSchema = z
  .object({
    password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'],
  });

type UpdatePasswordFormData = z.infer<typeof updatePasswordSchema>;

/** Choix du nouveau mot de passe, après le lien reçu par email (voir /auth/confirm). */
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
    <CadrePageAuth titreOnglet="Nouveau mot de passe | Oskar">
      <Carte>
        <EnTeteCarte titre="Nouveau mot de passe" sousTitre="Choisissez un nouveau mot de passe sécurisé" />
        <div className="p-7">
          {success && <MessageInfo>Mot de passe mis à jour ! Redirection vers votre espace…</MessageInfo>}
          {error && <MessageErreur>{error}</MessageErreur>}

          {lienInvalide && !success && (
            <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm">
              <p className="font-semibold text-amber-900">Ce lien de réinitialisation est invalide ou a expiré.</p>
              <p className="text-amber-800 mt-1">
                <Link href="/auth/forgot-password" className="font-semibold underline">
                  Demandez un nouveau lien
                </Link>{' '}
                pour choisir votre mot de passe.
              </p>
            </div>
          )}

          {!success && !lienInvalide && (
            <form method="post" onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
              <div>
                <label htmlFor="password" className={CLS.intitule}>
                  Nouveau mot de passe
                </label>
                <input
                  {...register('password')}
                  type="password"
                  id="password"
                  autoComplete="new-password"
                  className={CLS.champ}
                  placeholder="6 caractères min."
                />
                {errors.password && <p className={CLS.erreur}>{errors.password.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={CLS.intitule}>
                  Confirmer le mot de passe
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  id="confirmPassword"
                  autoComplete="new-password"
                  className={CLS.champ}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && <p className={CLS.erreur}>{errors.confirmPassword.message}</p>}
              </div>

              <button type="submit" disabled={isLoading} className={CLS.bouton}>
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
                {isLoading ? 'Mise à jour…' : 'Mettre à jour le mot de passe →'}
              </button>
            </form>
          )}

          {!success && (
            <p className={`${CLS.note} mt-4`}>
              <Link href="/auth/login" className={CLS.lien}>
                Retour à la connexion
              </Link>
            </p>
          )}
        </div>
      </Carte>
    </CadrePageAuth>
  );
};

export default UpdatePasswordPage;
