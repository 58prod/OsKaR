-- ============================================================================
-- Effacement complet d'un compte (RGPD) — 2026-09-13
-- ============================================================================
-- « Supprimer mon compte » appelait delete_user(), qui efface auth.users et
-- compte sur les cascades. Deux trous :
--   1. action_assignees.assigned_by référence profiles SANS règle ON DELETE :
--      une personne ayant assigné une action dans l'OKR d'un autre compte ne
--      pouvait pas supprimer le sien (violation de clé étrangère).
--   2. Restaient en base, détachés du compte : les bilans faits sans compte
--      avec la même adresse, les demandes de formule et les candidatures coach
--      (ON DELETE SET NULL).
--
-- Rétrocompatible avec l'app d'Eric (base partagée) : delete_user() n'est pas
-- modifiée ; on ajoute une fonction et on élargit une contrainte.
-- ============================================================================

-- 1. Les assignations faites par un compte supprimé disparaissent avec lui.
--    La contrainte d'origine est anonyme : on la retrouve par sa colonne.
DO $$
DECLARE
  nom text;
BEGIN
  FOR nom IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY (c.conkey)
    WHERE c.conrelid = 'public.action_assignees'::regclass
      AND c.contype = 'f'
      AND a.attname = 'assigned_by'
  LOOP
    EXECUTE format('ALTER TABLE public.action_assignees DROP CONSTRAINT %I', nom);
  END LOOP;
END;
$$;
ALTER TABLE public.action_assignees
  ADD CONSTRAINT action_assignees_assigned_by_fkey
  FOREIGN KEY (assigned_by) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- 2. Efface toutes les données de la personne connectée, puis son compte.
CREATE OR REPLACE FUNCTION public.effacer_mon_compte()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  uid uuid := auth.uid();
  adresse text;
BEGIN
  IF uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT lower(email) INTO adresse FROM auth.users WHERE id = uid;

  -- Données détachées du compte, retrouvées par son id ou son adresse.
  DELETE FROM public.diagnostics
    WHERE user_id = uid OR (user_id IS NULL AND lower(email) = adresse);
  DELETE FROM public.demandes_formule
    WHERE user_id = uid OR lower(email) = adresse;
  DELETE FROM public.candidatures_coachs
    WHERE user_id = uid OR lower(email) = adresse;

  -- Le reste (profil, ateliers, OKR, équipes, abonnement…) suit par cascade.
  DELETE FROM auth.users WHERE id = uid;
END;
$$;

REVOKE ALL ON FUNCTION public.effacer_mon_compte() FROM public, anon;
GRANT EXECUTE ON FUNCTION public.effacer_mon_compte() TO authenticated;

COMMENT ON FUNCTION public.effacer_mon_compte() IS
  'Supprime le compte de la personne connectée et toutes ses données, y compris bilans sans compte, demandes de formule et candidatures coach à la même adresse.';
