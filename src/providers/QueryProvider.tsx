import { QueryClient, QueryClientProvider, MutationCache, QueryCache } from '@tanstack/react-query';
import { ReactNode, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { urlConnexion } from '@/lib/authFlux';

interface QueryProviderProps {
  children: ReactNode;
}

// Détection d'erreur d'authentification Supabase
function isAuthError(error: any): boolean {
  return (
    error?.message?.includes('JWT') ||
    error?.code === 'PGRST301' ||
    error?.message?.includes('Auth session missing')
  );
}

// Éviter les redirections multiples
let isRedirecting = false;

/**
 * Sur erreur d'auth dans une query → redirection login.
 * Ne détruit PAS la session (signOut) — c'est le rôle de _app.tsx.
 * Ne se déclenche PAS tant que l'auth n'est pas initialisée.
 */
function handleQueryError(error: any) {
  const { authReady } = useAppStore.getState();
  if (!authReady) return;

  if (isAuthError(error) && !isRedirecting) {
    isRedirecting = true;
    console.warn('⚠️ Erreur d\'auth dans une query, redirection vers login...');
    if (typeof window !== 'undefined') {
      window.location.href = urlConnexion(window.location.pathname, 'session_expired');
    }
  }
}

export function QueryProvider({ children }: QueryProviderProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        queryCache: new QueryCache({ onError: handleQueryError }),
        mutationCache: new MutationCache({ onError: handleQueryError }),
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5, // 5 minutes
            gcTime: 1000 * 60 * 30, // 30 minutes
            refetchOnWindowFocus: false,
            retry: (failureCount, error: any) => {
              if (isAuthError(error)) return false;
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
          mutations: {
            retry: (failureCount, error: any) => {
              if (isAuthError(error)) return false;
              return failureCount < 1;
            },
            retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
          },
        },
      })
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

