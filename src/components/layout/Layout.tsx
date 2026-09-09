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
  skipOnboarding?: boolean;
}

const Layout: React.FC<LayoutProps> = ({
  children,
  title,
  description,
  requireAuth = false,
  skipOnboarding = false,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const router = useRouter();
  const { user, authReady, isAuthenticated, profileReady } = useAppStore();

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

    // Session valide mais profil encore en cours de résolution
    if (!user) return;

    // Vérifier l'onboarding uniquement quand le profil est résolu
    if (profileReady && !user.companyProfile && !skipOnboarding && router.pathname !== '/onboarding') {
      router.push('/onboarding');
    }
  }, [requireAuth, user, authReady, isAuthenticated, profileReady, skipOnboarding, router]);


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
