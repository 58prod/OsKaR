import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { CLS, CadrePageAuth, Carte, EnTeteCarte, MessageErreur } from '@/components/auth/CarteAuth';
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
    <CadrePageAuth titreOnglet="Validation du lien | Oskar">
      <Carte>
        <EnTeteCarte
          titre={erreur ? 'Lien non valide' : 'Validation du lien…'}
          sousTitre={erreur ? 'Ce lien ne peut plus servir' : 'Veuillez patienter quelques secondes'}
        />
        <div className="p-7">
          {erreur ? (
            <>
              <MessageErreur>{erreur}</MessageErreur>
              <p className={CLS.note}>
                <Link href="/auth/forgot-password" className={CLS.lien}>
                  Demander un nouveau lien
                </Link>
              </p>
            </>
          ) : (
            <div className="flex justify-center py-4">
              <Loader2 className="h-8 w-8 text-teal animate-spin" aria-label="Validation en cours" />
            </div>
          )}
        </div>
      </Carte>
    </CadrePageAuth>
  );
};

export default ConfirmationLienPage;
