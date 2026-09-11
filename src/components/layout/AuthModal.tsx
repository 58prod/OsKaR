import React, { useEffect } from 'react';
import { useConnexion } from '@/store/useConnexion';
import { FormulaireAuth } from '@/components/auth/FormulaireAuth';

/*
 * Fenêtre de connexion de l'app — `.auth-overlay` / `.auth-modal` des
 * maquettes. Montée une seule fois dans _app.tsx et ouverte de partout avec
 * `ouvrirConnexion()` (voir store/useConnexion).
 */
export const AuthModal: React.FC = () => {
  const { ouverte, onglet, destination, ouverture, fermer } = useConnexion();

  useEffect(() => {
    if (!ouverte) return;
    const touche = (e: KeyboardEvent) => e.key === 'Escape' && fermer();
    document.addEventListener('keydown', touche);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', touche);
      document.body.style.overflow = '';
    };
  }, [ouverte, fermer]);

  if (!ouverte) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) fermer();
      }}
      className="fixed inset-0 z-[500] flex items-center justify-center bg-[rgba(15,20,60,0.55)] backdrop-blur-[4px] animate-fade-in"
    >
      <div className="animate-slide-up">
        <FormulaireAuth
          key={ouverture}
          ongletInitial={onglet}
          destination={destination}
          onFermer={fermer}
          titreId="auth-modal-title"
        />
      </div>
    </div>
  );
};

export default AuthModal;
