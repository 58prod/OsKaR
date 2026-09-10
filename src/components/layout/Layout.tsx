import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Header } from './Header';
import { Footer } from './Footer';
import { NotificationContainer } from '@/components/ui/Notification';
import { useAppStore } from '@/store/useAppStore';
import { urlConnexion } from '@/lib/authFlux';
import { APP_CONFIG } from '@/constants';

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  requireAuth?: boolean;
  /** Sans effet depuis que l'onboarding est facultatif ; conservé pour les
   *  pages qui le passent encore (connexion, inscription…). */
  skipOnboarding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  requireAuth = false,
  skipOnboarding: _skipOnboarding = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

  // Authentification : attendre que Supabase ait terminé l'initialisation
  // (INITIAL_SESSION reçu) avant de décider de rediriger
  useEffect(() => {
    if (!requireAuth) return;

    // Tant que l'auth n'est pas prête, ne rien faire
    if (!authReady) return;

    if (!isAuthenticated) {
      console.log('🔄 Redirection vers login (pas de session après initialisation auth)');
      router.replace(urlConnexion(router.asPath));
      return;
    }

    // L'onboarding n'est plus imposé : le profil d'entreprise se complète
    // quand la personne le décide, depuis son écran.
  }, [requireAuth, authReady, isAuthenticated, router]);


  const pageTitle = title ? `${title} - ${APP_CONFIG.name}` : APP_CONFIG.name;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
        <meta name="description" content={description || APP_CONFIG.description} />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header
          onMenuToggle={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          isMobileMenuOpen={isMobileMenuOpen}
        />

        <main className="flex-1">
          {children}
        </main>

        <Footer />
        <NotificationContainer />
      </div>
    </>
  );
};

export { Layout };
export default Layout;
