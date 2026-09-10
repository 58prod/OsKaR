-- Migration : rattacher au compte les bilans faits sans compte
-- Date : 2026-09-10
--
-- Contexte
-- --------
-- Le Diagnostic et le Potentiel Produit sont gratuits et utilisables sans
-- compte : le bilan est alors enregistré avec `user_id = NULL` et l'email saisi
-- par la personne. Quand elle crée ensuite un compte avec la même adresse, ces
-- bilans restent invisibles : la policy de lecture est `user_id = auth.uid()`,
-- et une ligne à NULL n'y répond jamais.
--
-- La promesse « créez un compte pour retrouver vos résultats » n'était donc pas
-- tenue pour les bilans faits en visiteur.
--
-- Cette fonction rattache au compte connecté les bilans portant son adresse.
-- Elle est SECURITY DEFINER parce qu'elle doit lire et modifier des lignes que
-- la policy interdit à l'utilisateur, mais elle ne touche que les lignes dont
-- l'email correspond exactement à celui de son propre compte : elle ne permet
-- pas de s'approprier le bilan de quelqu'un d'autre.
--
-- Idempotente : la relancer ne fait rien de plus une fois les lignes rattachées.

CREATE OR REPLACE FUNCTION public.rattacher_bilans_par_email()
RETURNS integer AS $$
DECLARE
  v_email text;
  v_rattaches integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN 0;
  END IF;

  -- L'email du compte connecté, tel que Supabase Auth le connaît.
  SELECT email INTO v_email FROM auth.users WHERE id = auth.uid();

  IF v_email IS NULL OR v_email = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.diagnostics
     SET user_id = auth.uid()
   WHERE user_id IS NULL
     AND lower(email) = lower(v_email);

  GET DIAGNOSTICS v_rattaches = ROW_COUNT;
  RETURN v_rattaches;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Seuls les utilisateurs authentifiés peuvent l'appeler, et uniquement pour eux.
REVOKE ALL ON FUNCTION public.rattacher_bilans_par_email() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.rattacher_bilans_par_email() TO authenticated;
