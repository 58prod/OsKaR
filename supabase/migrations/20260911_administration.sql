-- Administration d'Oskar (écrans /admin, maquette plateforme/admin.html)
-- Date : 2026-09-11
--
-- Réservée aux comptes listés dans `admins` (Christophe et Eric).
--
-- Aucune policy n'est ajoutée aux tables existantes : l'administration lit et
-- écrit uniquement par des fonctions `admin_*` (SECURITY DEFINER) qui vérifient
-- d'abord `est_admin()`. Pour un compte ordinaire, les lectures renvoient une
-- liste vide et les écritures une erreur « Réservé aux administrateurs ».
--
-- Purement additive, la base est partagée avec l'application d'Eric :
--   - nouvelle table `admins` ;
--   - `candidatures_coachs` : statut « contactee », colonnes `notes` et `traitee_le` ;
--   - `diagnostics` : colonne `accepte_recontact` (faux par défaut) ;
--   - fonctions `est_admin` et `admin_*`.
--
-- Migration idempotente : peut être ré-exécutée intégralement sans erreur.
-- ⚠️ Exécuter TOUT le fichier d'un seul bloc (ne pas sélectionner une portion).


-- ─── 1. Les administrateurs ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.admins (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Aucune policy : la table ne se lit qu'à travers est_admin().
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.est_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid());
$$;


-- ─── 2. Colonnes ajoutées ──────────────────────────────────────────────────

-- Suivi des candidatures : un statut de plus, des notes internes.
ALTER TABLE public.candidatures_coachs
  ADD COLUMN IF NOT EXISTS notes TEXT CHECK (char_length(notes) <= 5000);
ALTER TABLE public.candidatures_coachs
  ADD COLUMN IF NOT EXISTS traitee_le TIMESTAMPTZ;
ALTER TABLE public.candidatures_coachs
  DROP CONSTRAINT IF EXISTS candidatures_coachs_statut_check;
ALTER TABLE public.candidatures_coachs
  ADD CONSTRAINT candidatures_coachs_statut_check
  CHECK (statut IN ('nouvelle', 'contactee', 'validee', 'refusee'));

-- RGPD : la personne qui laisse son email pour recevoir son bilan accepte-t-elle
-- d'être recontactée ? Faux par défaut, et pour tous les bilans déjà faits.
ALTER TABLE public.diagnostics
  ADD COLUMN IF NOT EXISTS accepte_recontact BOOLEAN NOT NULL DEFAULT FALSE;


-- ─── 3. Lectures ───────────────────────────────────────────────────────────

-- Tous les comptes, avec leur formule et les ateliers commencés.
CREATE OR REPLACE FUNCTION public.admin_comptes()
RETURNS TABLE (
  id UUID,
  email TEXT,
  nom TEXT,
  entreprise TEXT,
  activite TEXT,
  cree_le TIMESTAMPTZ,
  derniere_connexion TIMESTAMPTZ,
  plan TEXT,
  statut TEXT,
  expire_le TIMESTAMPTZ,
  offerte BOOLEAN,
  motif TEXT,
  stripe BOOLEAN,
  demo BOOLEAN,
  vision BOOLEAN,
  fit BOOLEAN,
  finance BOOLEAN,
  okr BOOLEAN,
  team BOOLEAN,
  nb_bilans INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    p.id,
    p.email,
    p.name,
    p.company,
    p.company_profile->>'industry',
    p.created_at,
    u.last_sign_in_at,
    s.plan_type::TEXT,
    s.status::TEXT,
    s.expires_at,
    COALESCE(s.metadata->>'offerte' = 'true', FALSE),
    s.metadata->>'motif',
    s.stripe_subscription_id IS NOT NULL,
    COALESCE(s.metadata->>'demo' = 'true', FALSE),
    EXISTS (SELECT 1 FROM public.vision_ateliers v WHERE v.user_id = p.id),
    EXISTS (SELECT 1 FROM public.ateliers a WHERE a.user_id = p.id AND a.pilier = 'fit'),
    EXISTS (SELECT 1 FROM public.ateliers a WHERE a.user_id = p.id AND a.pilier = 'finance'),
    EXISTS (SELECT 1 FROM public.ambitions am WHERE am.user_id = p.id)
      OR EXISTS (SELECT 1 FROM public.quarterly_objectives q WHERE q.user_id = p.id),
    EXISTS (SELECT 1 FROM public.ateliers a WHERE a.user_id = p.id AND a.pilier = 'team'),
    (SELECT COUNT(*)::INTEGER FROM public.diagnostics d WHERE d.user_id = p.id)
  FROM public.profiles p
  LEFT JOIN auth.users u ON u.id = p.id
  LEFT JOIN public.subscriptions s ON s.user_id = p.id
  WHERE public.est_admin()
  ORDER BY p.created_at DESC;
$$;

-- Le détail d'un compte : contenu des ateliers (l'app en déduit les étapes
-- remplies), volumes OKR, bilans. NULL pour un compte non administrateur.
CREATE OR REPLACE FUNCTION public.admin_fiche_compte(p_user_id UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'vision', (SELECT v.contenu FROM public.vision_ateliers v WHERE v.user_id = p_user_id),
    'fit', (SELECT a.contenu FROM public.ateliers a WHERE a.user_id = p_user_id AND a.pilier = 'fit'),
    'finance', (SELECT a.contenu FROM public.ateliers a WHERE a.user_id = p_user_id AND a.pilier = 'finance'),
    'team', (SELECT a.contenu FROM public.ateliers a WHERE a.user_id = p_user_id AND a.pilier = 'team'),
    'okr', jsonb_build_object(
      'ambitions', (SELECT COUNT(*) FROM public.ambitions am WHERE am.user_id = p_user_id),
      'objectifs', (SELECT COUNT(*) FROM public.quarterly_objectives q WHERE q.user_id = p_user_id),
      'actions', (SELECT COUNT(*) FROM public.actions ac WHERE ac.user_id = p_user_id)
    ),
    'bilans', COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'id', d.id,
          'type', COALESCE(d.responses->>'__bilan', 'organisation'),
          'cree_le', d.created_at,
          'note', CASE WHEN d.responses->>'__bilan' = 'produit'
                       THEN d.scores->'globalScoreOn10'
                       ELSE d.scores->'average' END
        )
        ORDER BY d.created_at DESC
      )
      FROM public.diagnostics d
      WHERE d.user_id = p_user_id
    ), '[]'::JSONB)
  )
  WHERE public.est_admin();
$$;

-- Tous les bilans (avec ou sans compte) : contacts, tableau de bord.
-- La note est sur 10 pour les deux types de bilans.
CREATE OR REPLACE FUNCTION public.admin_bilans()
RETURNS TABLE (
  id UUID,
  cree_le TIMESTAMPTZ,
  email TEXT,
  type TEXT,
  note NUMERIC,
  accepte_recontact BOOLEAN,
  a_un_compte BOOLEAN,
  compte_existe BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    d.id,
    d.created_at,
    COALESCE(d.email, p.email),
    COALESCE(d.responses->>'__bilan', 'organisation'),
    CASE
      WHEN d.responses->>'__bilan' = 'produit' THEN
        CASE WHEN jsonb_typeof(d.scores->'globalScoreOn10') = 'number'
             THEN (d.scores->>'globalScoreOn10')::NUMERIC END
      ELSE
        CASE WHEN jsonb_typeof(d.scores->'average') = 'number'
             THEN (d.scores->>'average')::NUMERIC END
    END,
    d.accepte_recontact,
    d.user_id IS NOT NULL,
    d.user_id IS NOT NULL
      OR EXISTS (SELECT 1 FROM public.profiles p2 WHERE lower(p2.email) = lower(d.email))
  FROM public.diagnostics d
  LEFT JOIN public.profiles p ON p.id = d.user_id
  WHERE public.est_admin()
  ORDER BY d.created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_candidatures()
RETURNS SETOF public.candidatures_coachs
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.candidatures_coachs
  WHERE public.est_admin()
  ORDER BY created_at DESC;
$$;


-- ─── 4. Écritures ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_maj_candidature(p_id UUID, p_statut TEXT, p_notes TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;

  UPDATE public.candidatures_coachs
  SET statut = p_statut,
      notes = NULLIF(btrim(p_notes), ''),
      traitee_le = NOW()
  WHERE id = p_id;
END;
$$;

-- Offrir la formule payante jusqu'à une date incluse (fin de journée, heure de
-- Paris). Sans Stripe : offres membres fondateurs, coachs partenaires, tests.
-- À l'échéance, l'app traite le compte comme gratuit ; ses données restent.
CREATE OR REPLACE FUNCTION public.admin_offrir_formule(p_user_id UUID, p_jusqu_au DATE, p_motif TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;
  IF p_jusqu_au IS NULL OR p_jusqu_au < CURRENT_DATE THEN
    RAISE EXCEPTION 'La date de fin doit être aujourd''hui ou plus tard.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id
      AND stripe_subscription_id IS NOT NULL
      AND status IN ('active', 'trialing')
  ) THEN
    RAISE EXCEPTION 'Ce compte a un abonnement Stripe en cours.';
  END IF;

  INSERT INTO public.subscriptions (user_id, plan_type, status, started_at, expires_at, cancelled_at, metadata)
  VALUES (
    p_user_id,
    'unlimited',
    'active',
    NOW(),
    (p_jusqu_au + 1)::TIMESTAMP AT TIME ZONE 'Europe/Paris',
    NULL,
    jsonb_build_object(
      'offerte', TRUE,
      'motif', NULLIF(btrim(p_motif), ''),
      'offerte_par', auth.uid(),
      'offerte_le', NOW()
    )
  )
  ON CONFLICT (user_id) DO UPDATE SET
    plan_type = 'unlimited',
    status = 'active',
    expires_at = EXCLUDED.expires_at,
    cancelled_at = NULL,
    metadata = COALESCE(public.subscriptions.metadata, '{}'::JSONB) || EXCLUDED.metadata,
    updated_at = NOW();
END;
$$;

-- Retirer une formule offerte : le compte repasse en gratuit tout de suite.
CREATE OR REPLACE FUNCTION public.admin_retirer_formule(p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;

  UPDATE public.subscriptions
  SET plan_type = 'free',
      status = 'active',
      expires_at = NULL,
      metadata = (COALESCE(metadata, '{}'::JSONB) - 'offerte' - 'motif')
                 || jsonb_build_object('offre_retiree_le', NOW()),
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND metadata->>'offerte' = 'true';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ce compte n''a pas de formule offerte.';
  END IF;
END;
$$;


-- ─── 5. Droits d'exécution ─────────────────────────────────────────────────
-- Réservées aux comptes connectés ; chaque fonction vérifie ensuite est_admin().

REVOKE ALL ON FUNCTION public.est_admin() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_comptes() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_fiche_compte(UUID) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_bilans() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_candidatures() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_maj_candidature(UUID, TEXT, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_offrir_formule(UUID, DATE, TEXT) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_retirer_formule(UUID) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.est_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_comptes() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_fiche_compte(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_bilans() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_candidatures() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_maj_candidature(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_offrir_formule(UUID, DATE, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_retirer_formule(UUID) TO authenticated;


-- ─── 6. Christophe et Eric ─────────────────────────────────────────────────
-- Rattache les comptes Oskar existants à ces adresses. Une adresse sans compte
-- est ignorée : créer le compte, puis relancer ce fichier.

INSERT INTO public.admins (user_id)
SELECT id FROM auth.users
WHERE lower(email) IN ('christophe@hasenso.fr', 'erich34@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

-- Vérification : la liste des administrateurs s'affiche sous l'éditeur.
SELECT u.email AS administrateur
FROM public.admins a
JOIN auth.users u ON u.id = a.user_id
ORDER BY u.email;
