import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useToast } from '@/hooks/useToast';
import { buildIdentity } from '@/utils/toolIdentity';
import { generateSessionCode } from '@/services/toolSession';
import type { ToolIdentity } from '@/hooks/useToolSession';
import type { ToolType } from '@/constants/toolbox';

/**
 * Logique commune des pages d'outils (Option A : lien + prénom, sans compte) :
 * - détermine le code de session depuis l'URL ou en génère un nouveau ;
 * - gère l'identité locale (prénom) ;
 * - fournit le partage du lien d'invitation.
 */
export function useToolPage(toolType: ToolType) {
  const router = useRouter();
  const toast = useToast();
  const [code, setCode] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [identity, setIdentity] = useState<ToolIdentity | null>(null);

  useEffect(() => {
    if (!router.isReady) return;
    const q = router.query.s;
    const fromUrl = typeof q === 'string' ? q.trim().toUpperCase() : '';
    if (fromUrl) {
      // Suit aussi un changement de code en cours de route (« Rejoindre avec un code »).
      if (fromUrl !== code) {
        setCode(fromUrl);
        setIsCreating(false);
      }
    } else if (!code) {
      const generated = generateSessionCode(toolType);
      setCode(generated);
      setIsCreating(true);
      void router.replace({ query: { ...router.query, s: generated } }, undefined, { shallow: true });
    }
  }, [router.isReady, router.query, code, router, toolType]);

  const handleJoin = useCallback((name: string) => setIdentity(buildIdentity(name)), []);

  const handleShare = useCallback(async () => {
    if (typeof window === 'undefined' || !code) return;
    const url = `${window.location.origin}/app/outils/${toolType}?s=${code}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Lien d'invitation copié !");
    } catch {
      toast.info(`Lien d'invitation : ${url}`);
    }
  }, [code, toast, toolType]);

  return { code, isCreating, identity, handleJoin, handleShare };
}

export default useToolPage;
