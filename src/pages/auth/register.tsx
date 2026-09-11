import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { CadrePageAuth } from '@/components/auth/CarteAuth';
import { FormulaireAuth } from '@/components/auth/FormulaireAuth';
import { useAppStore } from '@/store/useAppStore';
import { APRES_CONNEXION, destinationSure } from '@/lib/authFlux';

/**
 * Page d'inscription — le même formulaire que la fenêtre de connexion, pour
 * les liens directs vers /auth/register.
 */
const RegisterPage: React.FC = () => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

  // Page demandée avant la redirection, sinon l'espace OKR — même règle que la connexion.
  const destination = destinationSure(router.query.redirect) ?? APRES_CONNEXION;

  // Déjà connecté (ou compte tout juste créé) : le formulaire n'a plus de sens.
  useEffect(() => {
    if (authReady && isAuthenticated) router.replace(destination);
  }, [authReady, isAuthenticated, destination, router]);

  return (
    <CadrePageAuth titreOnglet="Inscription | Oskar">
      <FormulaireAuth ongletInitial="register" destination={destination} naviguer={false} />
    </CadrePageAuth>
  );
};

export default RegisterPage;
