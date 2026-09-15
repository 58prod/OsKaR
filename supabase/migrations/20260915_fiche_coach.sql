-- Fiche du coach : sa structure et sa fiche d'annuaire, qu'il tient lui-même
-- Date : 2026-09-15
--
-- Page « Ma fiche coach » (/app/ma-fiche-coach). Demande la migration
-- 20260915_accompagnements.
--
-- Purement additive (base partagée avec l'application d'Eric) :
--   - coachs_references : colonnes siret, site, approche, reprises de la
--     candidature pour les coachs déjà référencés ;
--   - mon_profil_coach et admin_referencer_coach renvoient / reprennent ces
--     colonnes ; nouvelle fonction coach_maj_fiche.
--
-- Migration idempotente : peut être ré-exécutée intégralement sans erreur.
-- ⚠️ Exécuter TOUT le fichier d'un seul bloc (ne pas sélectionner une portion).


-- ─── 1. Colonnes ───────────────────────────────────────────────────────────

ALTER TABLE public.coachs_references
  ADD COLUMN IF NOT EXISTS siret TEXT CHECK (char_length(siret) <= 20);
ALTER TABLE public.coachs_references
  ADD COLUMN IF NOT EXISTS site TEXT CHECK (char_length(site) <= 300);
ALTER TABLE public.coachs_references
  ADD COLUMN IF NOT EXISTS approche TEXT CHECK (char_length(approche) <= 3000);

-- Les coachs déjà référencés retrouvent le site et l'approche de leur candidature.
UPDATE public.coachs_references c
SET site = COALESCE(c.site, k.site),
    approche = COALESCE(c.approche, k.approche)
FROM public.profiles p
CROSS JOIN LATERAL (
  SELECT cc.site, cc.approche
  FROM public.candidatures_coachs cc
  WHERE cc.user_id = p.id OR lower(cc.email) = lower(p.email)
  ORDER BY (cc.statut = 'validee') DESC, cc.created_at DESC
  LIMIT 1
) k
WHERE p.id = c.user_id
  AND (c.site IS NULL OR c.approche IS NULL);


-- ─── 2. Lecture : le profil du coach connecté ──────────────────────────────

CREATE OR REPLACE FUNCTION public.mon_profil_coach()
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'disponible', c.disponible,
    'resume_quotidien', c.resume_quotidien,
    'structure', c.structure,
    'siret', c.siret,
    'site', c.site,
    'zone', c.zone,
    'piliers', to_jsonb(c.piliers),
    'approche', c.approche,
    'reference_le', c.reference_le
  )
  FROM public.coachs_references c
  WHERE c.user_id = auth.uid();
$$;


-- ─── 3. Écriture : le coach met sa fiche à jour ────────────────────────────

CREATE OR REPLACE FUNCTION public.coach_maj_fiche(
  p_structure TEXT,
  p_siret TEXT,
  p_site TEXT,
  p_zone TEXT,
  p_piliers TEXT[],
  p_approche TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_piliers IS NOT NULL AND NOT (p_piliers <@ ARRAY['vision', 'fit', 'finance', 'okr', 'team']::TEXT[]) THEN
    RAISE EXCEPTION 'Pilier inconnu.';
  END IF;

  UPDATE public.coachs_references
  SET structure = NULLIF(btrim(p_structure), ''),
      siret = NULLIF(regexp_replace(COALESCE(p_siret, ''), '\s', '', 'g'), ''),
      site = NULLIF(btrim(p_site), ''),
      zone = NULLIF(btrim(p_zone), ''),
      piliers = COALESCE(p_piliers, '{}'),
      approche = NULLIF(btrim(p_approche), '')
  WHERE user_id = auth.uid();

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservé aux coachs référencés.' USING ERRCODE = '42501';
  END IF;
END;
$$;


-- ─── 4. Référencement : reprendre aussi site et approche ───────────────────

CREATE OR REPLACE FUNCTION public.admin_referencer_coach(p_user_id UUID, p_reference BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;

  IF p_reference THEN
    IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
      RAISE EXCEPTION 'Compte introuvable.';
    END IF;
    INSERT INTO public.coachs_references (user_id, structure, zone, piliers, site, approche, reference_par)
    SELECT p.id, k.structure, k.zone, COALESCE(k.piliers, '{}'), k.site, k.approche, auth.uid()
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT cc.structure, cc.zone, cc.piliers, cc.site, cc.approche
      FROM public.candidatures_coachs cc
      WHERE cc.user_id = p.id OR lower(cc.email) = lower(p.email)
      ORDER BY (cc.statut = 'validee') DESC, cc.created_at DESC
      LIMIT 1
    ) k ON TRUE
    WHERE p.id = p_user_id
    ON CONFLICT (user_id) DO NOTHING;
  ELSE
    UPDATE public.accompagnements
    SET statut = 'termine', termine_le = NOW()
    WHERE coach_id = p_user_id AND statut IN ('en_attente', 'actif');
    DELETE FROM public.coachs_references WHERE user_id = p_user_id;
  END IF;
END;
$$;


-- ─── 5. Droits d'exécution ─────────────────────────────────────────────────

REVOKE ALL ON FUNCTION public.coach_maj_fiche(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.coach_maj_fiche(TEXT, TEXT, TEXT, TEXT, TEXT[], TEXT) TO authenticated;


-- Vérification : nombre de coachs référencés, et combien ont déjà une approche.
SELECT count(*) AS coachs_references, count(approche) AS avec_approche
FROM public.coachs_references;
