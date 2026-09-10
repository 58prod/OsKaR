import React, { useEffect } from 'react';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { useAppStore } from '@/store/useAppStore';
import { AuthService } from '@/services/auth';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import { QueryProvider } from '@/providers/QueryProvider';
import ErrorBoundary from '@/components/ErrorBoundary';
import { ToastContainer } from '@/components/ui/Toast';
import { CookieBanner } from '@/components/ui/CookieBanner';
import { useToastStore } from '@/hooks/useToast';
import '@/styles/globals.css';

/**
 * Charge le profil utilisateur depuis Supabase.
 * Retourne un User complet si disponible, sinon null.
 */
async function loadProfile(userId: string) {
  try {
    const result = await AuthService.fetchProfileForUser(userId);
    if (result?.profile) {
      return AuthService.profileToUser(result.profile);
    }
  } catch (error) {
    console.error('❌ Erreur chargement profil:', error);
  }
  return null;
}

function isCurrentAuthEvent(
  mountedRef: { current: boolean },
  authEventRef: { current: number },
  eventId: number
) {
  return mountedRef.current && authEventRef.current === eventId;
}

async function processAuthEvent(
  event: string,
  session: any,
  mountedRef: { current: boolean },
  authEventRef: { current: number },
  eventId: number
) {
  if (!isCurrentAuthEvent(mountedRef, authEventRef, eventId)) return;

  const store = useAppStore.getState();

  if (event === 'SIGNED_OUT') {
    if (!store.authReady) return;
    store.logout();
    return;
  }

  if (!session?.user) {
    if (event === 'INITIAL_SESSION') {
      store.setAuthReady();
    }
    return;
  }

  store.setSessionUser(AuthService.authUserToUser(session.user));

  const profileUser = await loadProfile(session.user.id);

  if (!isCurrentAuthEvent(mountedRef, authEventRef, eventId)) return;

  if (profileUser) {
    useAppStore.getState().setUser(profileUser);
  } else {
    useAppStore.getState().setProfileReady();
  }
}

export default function App({ Component, pageProps }: AppProps) {
  const { toasts, removeToast } = useToastStore();

  /**
   * Gestion de session simplifiée.
   *
   * Principes :
   * 1. On écoute onAuthStateChange (source unique de vérité Supabase).
   * 2. INITIAL_SESSION : premier event, on charge le profil si session présente.
   * 3. SIGNED_IN / TOKEN_REFRESHED : on (re)charge le profil.
   * 4. SIGNED_OUT : on ne réagit QUE si l'initialisation est terminée
   *    (= authReady est true). Cela ignore les SIGNED_OUT transitoires
   *    émis pendant un refresh de token au démarrage.
   */
  useEffect(() => {
    if (!isSupabaseConfigured()) return;

    const mountedRef = { current: true };
    const authEventRef = { current: 0 };

    const { data: { subscription } } = AuthService.onAuthStateChange((event, session) => {
      if (!mountedRef.current) return;

      const eventId = ++authEventRef.current;

      // Important: ne pas await d'appel Supabase dans le callback onAuthStateChange.
      // Supabase documente un risque de deadlock/hang sinon.
      window.setTimeout(() => {
        void processAuthEvent(event, session, mountedRef, authEventRef, eventId);
      }, 0);
    });

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, []);

  return (
    <ErrorBoundary>
      <QueryProvider>
        <Head>
          <meta name="viewport" content="width=device-width, initial-scale=1" />
        </Head>
        <Component {...pageProps} />
        <ToastContainer toasts={toasts} onClose={removeToast} />
        <CookieBanner />
      </QueryProvider>
    </ErrorBoundary>
  );
}
