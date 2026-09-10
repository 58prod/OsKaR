import { useCallback, useEffect, useState } from 'react';
import { useAppStore } from '@/store/useAppStore';
import { AuthService } from '@/services/auth';
import { isSupabaseConfigured } from '@/lib/supabaseClient';
import type { CompanyProfile } from '@/types';

/*
 * Le domaine d'activité, choisi depuis la page d'un pilier.
 *
 * Deux cas, parce que le Diagnostic et les présentations sont libres d'accès :
 *  - avec un compte : le secteur rejoint le profil d'entreprise, et suit la
 *    personne d'un appareil à l'autre ;
 *  - sans compte : il est gardé dans ce navigateur, ce qui suffit pour que les
 *    exemples soient adaptés dès la visite. Il rejoindra le profil si la
 *    personne crée un compte ensuite.
 */

export const CLE_SECTEUR_VISITEUR = 'oskar.secteur';

/** Le secteur mémorisé dans ce navigateur, ou une chaîne vide. */
export function secteurDuNavigateur(): string {
  try {
    return window.localStorage.getItem(CLE_SECTEUR_VISITEUR) ?? '';
  } catch {
    return '';
  }
}

export function useSecteurChoisi() {
  const user = useAppStore((s) => s.user);
  const setUser = useAppStore((s) => s.setUser);
  const updateCompanyProfile = useAppStore((s) => s.updateCompanyProfile);
  const secteurDuProfil = user?.companyProfile?.industry ?? '';

  const [secteur, setSecteur] = useState(secteurDuProfil);

  // Le profil arrive en différé ; à défaut, on reprend ce que le navigateur sait.
  useEffect(() => {
    setSecteur(secteurDuProfil || secteurDuNavigateur());
  }, [secteurDuProfil]);

  const choisirSecteur = useCallback(
    async (valeur: string) => {
      setSecteur(valeur);
      try {
        window.localStorage.setItem(CLE_SECTEUR_VISITEUR, valeur);
      } catch {
        /* stockage indisponible : le choix vaut pour cette page */
      }
      if (!user?.id) return;
      const profil = { ...(user.companyProfile ?? {}), industry: valeur } as CompanyProfile;
      try {
        if (isSupabaseConfigured()) {
          const maj = await AuthService.updateCompanyProfile(user.id, profil);
          setUser(AuthService.profileToUser(maj));
        } else {
          updateCompanyProfile(profil);
        }
      } catch (err) {
        console.error('Enregistrement du secteur impossible :', err);
      }
    },
    [user, setUser, updateCompanyProfile]
  );

  return { secteur, choisirSecteur, enregistre: Boolean(user?.id) };
}

export default useSecteurChoisi;
