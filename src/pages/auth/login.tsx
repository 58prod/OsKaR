import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { CadrePageAuth } from '@/components/auth/CarteAuth';
import { FormulaireAuth } from '@/components/auth/FormulaireAuth';
import { useAppStore } from '@/store/useAppStore';
import { APRES_CONNEXION, destinationSure } from '@/lib/authFlux';

/**
 * Page de connexion — le même formulaire que la fenêtre de connexion, pour les
 * cas où l'on arrive par une adresse : page protégée (?redirect=), lien
 * d'invitation, session expirée (?error=session_expired), déconnexion.
 */
const LoginPage: React.FC = () => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

  // Page demandée avant la redirection vers la connexion, sinon le pilier OKR.
  const destination = destinationSure(router.query.redirect) ?? APRES_CONNEXION;

  // Session déjà ouverte (ou qui vient de l'être) : on part sans attendre le profil.
  useEffect(() => {
    if (authReady && isAuthenticated) router.replace(destination);
  }, [authReady, isAuthenticated, destination, router]);

  const erreur = router.query.error === 'session_expired' ? 'Votre session a expiré. Veuillez vous reconnecter.' : null;

  return (
    <CadrePageAuth titreOnglet="Connexion | Oskar">
      <FormulaireAuth ongletInitial="login" destination={destination} naviguer={false} erreurInitiale={erreur} />
    </CadrePageAuth>
  );
};

export default LoginPage;
