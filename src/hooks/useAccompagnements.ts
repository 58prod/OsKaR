import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAppStore } from '@/store/useAppStore';
import { AccompagnementsService } from '@/services/db/accompagnements';

/*
 * Données de l'accompagnement coach ↔ dirigeant. Rien ne part tant que la
 * personne n'est pas connectée ; toute écriture recharge la liste des liens.
 */

function useConnecte() {
  const { user, authReady, isAuthenticated } = useAppStore();
  return { userId: user?.id, actif: authReady && isAuthenticated && !!user?.id, authReady };
}

/** Le compte connecté est-il coach référencé ? */
export function useProfilCoach() {
  const { userId, actif, authReady } = useConnecte();
  const q = useQuery({
    queryKey: ['accompagnement', 'profil-coach', userId],
    queryFn: () => AccompagnementsService.profilCoach(),
    enabled: actif,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
  return {
    profil: actif ? q.data ?? null : null,
    estCoach: actif && !!q.data,
    /** Vrai tant qu'on ne sait pas encore répondre. */
    enCours: !authReady || (actif && q.isLoading),
  };
}

export function useMesAccompagnements() {
  const { userId, actif } = useConnecte();
  return useQuery({
    queryKey: ['accompagnement', 'liste', userId],
    queryFn: () => AccompagnementsService.liste(),
    enabled: actif,
    staleTime: 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    // Avant la migration, la fonction n'existe pas : inutile d'insister.
    retry: false,
  });
}

/**
 * La fiche d'un dirigeant, chargée une fois par visite : chaque chargement
 * note la visite du coach, qui sert de repère aux nouveautés.
 */
export function useFicheDirigeant(dirigeantId: string | undefined) {
  const { actif } = useConnecte();
  return useQuery({
    queryKey: ['accompagnement', 'fiche', dirigeantId],
    queryFn: () => AccompagnementsService.fiche(dirigeantId as string),
    enabled: actif && !!dirigeantId,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    retry: false,
  });
}

function useRecharger() {
  const queryClient = useQueryClient();
  return () => queryClient.invalidateQueries({ queryKey: ['accompagnement'] });
}

/** Invite puis prévient par email ; `emailEnvoye` faux si l'email n'est pas parti. */
export function useInviterCoach() {
  const recharger = useRecharger();
  return useMutation({
    mutationFn: async (email: string) => {
      const id = await AccompagnementsService.inviterCoach(email);
      return { id, emailEnvoye: await AccompagnementsService.prevenir(id) };
    },
    onSuccess: recharger,
  });
}

export function useInviterDirigeant() {
  const recharger = useRecharger();
  return useMutation({
    mutationFn: async (email: string) => {
      const r = await AccompagnementsService.inviterDirigeant(email);
      return { ...r, emailEnvoye: await AccompagnementsService.prevenir(r.id) };
    },
    onSuccess: recharger,
  });
}

export function useRepondreAccompagnement() {
  const recharger = useRecharger();
  return useMutation({
    mutationFn: ({ id, accepte }: { id: string; accepte: boolean }) => AccompagnementsService.repondre(id, accepte),
    onSuccess: recharger,
  });
}

export function useTerminerAccompagnement() {
  const recharger = useRecharger();
  return useMutation({
    mutationFn: (id: string) => AccompagnementsService.terminer(id),
    onSuccess: recharger,
  });
}

export function useMajReglagesCoach() {
  const recharger = useRecharger();
  return useMutation({
    mutationFn: (r: { disponible?: boolean; resumeQuotidien?: boolean }) => AccompagnementsService.majReglages(r),
    onSuccess: recharger,
  });
}

export function useMajResumeDirigeant() {
  const recharger = useRecharger();
  return useMutation({
    mutationFn: ({ id, resume }: { id: string; resume: boolean }) => AccompagnementsService.majResumeDirigeant(id, resume),
    onSuccess: recharger,
  });
}
