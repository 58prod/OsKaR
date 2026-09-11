import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { CadrePageAuth } from '@/components/auth/CarteAuth';
import { FormulaireAuth } from '@/components/auth/FormulaireAuth';
import { useAppStore } from '@/store/useAppStore';
import { APRES_CONNEXION } from '@/lib/authFlux';

/**
 * Mot de passe oublié — le volet « Mot de passe oublié » de la fenêtre de
 * connexion, en page (liens directs, page « lien invalide »).
 */
const ForgotPasswordPage: React.FC = () => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

  // Déjà connecté : on change son mot de passe dans les paramètres, pas ici.
  useEffect(() => {
    if (authReady && isAuthenticated) router.replace(APRES_CONNEXION);
  }, [authReady, isAuthenticated, router]);

  return (
    <CadrePageAuth titreOnglet="Mot de passe oublié | Oskar">
      <FormulaireAuth ongletInitial="oubli" destination={APRES_CONNEXION} naviguer={false} />
    </CadrePageAuth>
  );
};

export default ForgotPasswordPage;
