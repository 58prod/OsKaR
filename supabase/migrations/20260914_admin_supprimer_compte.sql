-- ============================================================================
-- Administration : supprimer un compte — 2026-09-14
-- ============================================================================
-- Depuis la fiche d'un compte (/admin/comptes), un administrateur peut effacer
-- le compte et toutes ses données. Même effacement que « Supprimer mon compte »
-- (migration 20260913_effacer_mon_compte, à exécuter avant celle-ci) : bilans,
-- demandes de formule et candidatures coach à la même adresse, puis le compte
-- lui-même ; le reste (profil, ateliers, OKR, équipes, abonnement…) suit par
-- cascade.
--
-- Refusé :
--   - pour son propre compte (passer par « Supprimer mon compte ») ;
--   - pour un autre administrateur (le retirer d'abord de la table admins) ;
--   - pour le compte de démonstration (supabase/demo/compte_demo.sql) ;
--   - pour un compte avec un abonnement Stripe en cours (le résilier d'abord,
--     sinon Stripe continuerait de facturer).
--
-- Purement additive (base partagée avec l'app d'Eric) : une fonction de plus.
-- Idempotente : peut être ré-exécutée sans erreur.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_supprimer_compte(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  adresse TEXT;
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF p_user_id = auth.uid() THEN
    RAISE EXCEPTION 'Pour supprimer votre propre compte, passez par Paramètres > Supprimer mon compte.';
  END IF;
  IF EXISTS (SELECT 1 FROM public.admins WHERE user_id = p_user_id) THEN
    RAISE EXCEPTION 'Ce compte est administrateur : retirez-le d''abord des administrateurs.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id AND metadata->>'demo' = 'true'
  ) THEN
    RAISE EXCEPTION 'C''est le compte de démonstration : le script supabase/demo/compte_demo.sql le remet à zéro.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
      AND stripe_subscription_id IS NOT NULL
      AND status IN ('active', 'trialing')
  ) THEN
    RAISE EXCEPTION 'Ce compte a un abonnement Stripe en cours : résiliez-le d''abord dans Stripe.';
  END IF;

  SELECT lower(email) INTO adresse FROM auth.users WHERE id = p_user_id;
  IF adresse IS NULL THEN
    RAISE EXCEPTION 'Ce compte n''existe plus.';
  END IF;

  -- Données détachées du compte, retrouvées par son id ou son adresse.
  DELETE FROM public.diagnostics
    WHERE user_id = p_user_id OR (user_id IS NULL AND lower(email) = adresse);
  DELETE FROM public.demandes_formule
    WHERE user_id = p_user_id OR lower(email) = adresse;
  DELETE FROM public.candidatures_coachs
    WHERE user_id = p_user_id OR lower(email) = adresse;

  -- Le reste suit par cascade.
  DELETE FROM auth.users WHERE id = p_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_supprimer_compte(UUID) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_supprimer_compte(UUID) TO authenticated;

COMMENT ON FUNCTION public.admin_supprimer_compte(UUID) IS
  'Administration : supprime un compte et toutes ses données (sauf soi-même, un administrateur, le compte de démo, un abonnement Stripe en cours).';
