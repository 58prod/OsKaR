-- ============================================================================
-- Statistiques de fréquentation — 2026-09-14
-- ============================================================================
-- Mesure d'audience faite par Oskar lui-même, sans outil tiers ni cookie :
-- chaque page consultée est enregistrée dans `vues_pages`, avec le temps passé
-- dessus (temps où l'onglet est au premier plan). L'écran /admin/statistiques
-- en tire les chiffres.
--
-- Conçue pour l'exemption de consentement prévue par la CNIL pour la mesure
-- d'audience :
--   - identifiant de visiteur aléatoire, propre à Oskar, renouvelé tous les
--     13 mois (dans le navigateur, clé oskar.visiteur) ;
--   - aucun lien avec le compte : on garde seulement « connecté ou non » ;
--   - ni adresse IP, ni paramètres d'adresse : le chemin seul, et le modèle
--     de la page pour les adresses variables (/invitations/[token]) ;
--   - lignes effacées au bout de 25 mois ;
--   - refus possible depuis /legal/parametres-cookies.
--
-- Écriture : enregistrer_vue / terminer_vue, ouvertes aux visiteurs anonymes.
-- La table n'a aucune policy : elle ne se lit pas directement.
-- Lecture : admin_statistiques, réservée aux administrateurs (est_admin(),
-- migration 20260911_administration, à exécuter avant celle-ci).
--
-- Purement additive (base partagée avec l'app d'Eric) : une table, trois
-- fonctions. Idempotente : peut être ré-exécutée sans erreur.
-- ⚠️ Exécuter TOUT le fichier d'un seul bloc (ne pas sélectionner une portion).
-- ============================================================================


-- ─── 1. Les pages vues ─────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.vues_pages (
  id UUID PRIMARY KEY,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  hote TEXT NOT NULL CHECK (char_length(hote) <= 100),
  chemin TEXT NOT NULL CHECK (char_length(chemin) <= 200),
  visiteur UUID NOT NULL,
  visite UUID NOT NULL,
  provenance TEXT CHECK (char_length(provenance) <= 100),
  appareil TEXT NOT NULL CHECK (appareil IN ('mobile', 'tablette', 'ordinateur')),
  connecte BOOLEAN NOT NULL DEFAULT FALSE,
  -- Secondes passées sur la page, onglet visible, 30 minutes au plus.
  duree INTEGER NOT NULL DEFAULT 0 CHECK (duree BETWEEN 0 AND 1800)
);

CREATE INDEX IF NOT EXISTS vues_pages_cree_le_idx ON public.vues_pages (cree_le);
CREATE INDEX IF NOT EXISTS vues_pages_visiteur_idx ON public.vues_pages (visiteur, cree_le);

-- Aucune policy : écriture par les fonctions ci-dessous, lecture par l'administration.
ALTER TABLE public.vues_pages ENABLE ROW LEVEL SECURITY;


-- ─── 2. Enregistrer une page vue (tout visiteur) ───────────────────────────

CREATE OR REPLACE FUNCTION public.enregistrer_vue(
  p_id UUID,
  p_hote TEXT,
  p_chemin TEXT,
  p_visiteur UUID,
  p_visite UUID,
  p_provenance TEXT,
  p_appareil TEXT,
  p_connecte BOOLEAN
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF p_id IS NULL OR p_visiteur IS NULL OR p_visite IS NULL OR coalesce(p_chemin, '') = '' THEN
    RETURN;
  END IF;

  -- Garde-fou contre les envois en rafale : 60 pages par minute et par visiteur au plus.
  IF (SELECT count(*) FROM public.vues_pages
       WHERE visiteur = p_visiteur AND cree_le > NOW() - INTERVAL '1 minute') >= 60 THEN
    RETURN;
  END IF;

  INSERT INTO public.vues_pages (id, hote, chemin, visiteur, visite, provenance, appareil, connecte)
  VALUES (
    p_id,
    left(lower(coalesce(nullif(p_hote, ''), 'inconnu')), 100),
    left(p_chemin, 200),
    p_visiteur,
    p_visite,
    left(nullif(lower(p_provenance), ''), 100),
    CASE WHEN p_appareil IN ('mobile', 'tablette', 'ordinateur') THEN p_appareil ELSE 'ordinateur' END,
    coalesce(p_connecte, FALSE)
  )
  ON CONFLICT (id) DO NOTHING;
END;
$$;

REVOKE ALL ON FUNCTION public.enregistrer_vue(UUID, TEXT, TEXT, UUID, UUID, TEXT, TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.enregistrer_vue(UUID, TEXT, TEXT, UUID, UUID, TEXT, TEXT, BOOLEAN) TO anon, authenticated;


-- ─── 3. Noter le temps passé sur la page (tout visiteur) ───────────────────
-- Envoyé quand on quitte la page ou que l'onglet passe en arrière-plan : la
-- durée ne fait que grandir. L'identifiant, tiré au hasard par le navigateur,
-- ne se devine pas ; la ligne n'est plus modifiable au bout d'un jour.

CREATE OR REPLACE FUNCTION public.terminer_vue(p_id UUID, p_duree INTEGER)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  UPDATE public.vues_pages
     SET duree = GREATEST(duree, LEAST(GREATEST(coalesce(p_duree, 0), 0), 1800))
   WHERE id = p_id
     AND cree_le > NOW() - INTERVAL '1 day';
$$;

REVOKE ALL ON FUNCTION public.terminer_vue(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.terminer_vue(UUID, INTEGER) TO anon, authenticated;


-- ─── 4. Les chiffres de l'écran /admin/statistiques (administrateurs) ──────
-- p_jours : 7, 30, 90 ou 365 — aujourd'hui compris, jours de Paris.
-- p_hote  : oskar-coach.fr, ou NULL pour tous les sites branchés sur la base.
-- Renvoie NULL à qui n'est pas administrateur.

CREATE OR REPLACE FUNCTION public.admin_statistiques(p_jours INTEGER DEFAULT 30, p_hote TEXT DEFAULT NULL)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  nb_jours INTEGER := LEAST(GREATEST(coalesce(p_jours, 30), 1), 400);
  aujourdhui DATE := (NOW() AT TIME ZONE 'Europe/Paris')::date;
  debut TIMESTAMPTZ;
  debut_prec TIMESTAMPTZ;
  resultat JSONB;
BEGIN
  IF NOT public.est_admin() THEN
    RETURN NULL;
  END IF;

  -- Conservation : 25 mois au plus.
  DELETE FROM public.vues_pages WHERE cree_le < NOW() - INTERVAL '25 months';

  debut := ((aujourdhui - (nb_jours - 1))::timestamp) AT TIME ZONE 'Europe/Paris';
  debut_prec := ((aujourdhui - (2 * nb_jours - 1))::timestamp) AT TIME ZONE 'Europe/Paris';

  WITH v AS (
    SELECT * FROM public.vues_pages
     WHERE cree_le >= debut AND (p_hote IS NULL OR hote = p_hote)
  ),
  visites AS (
    SELECT visite,
           count(*) AS pages,
           sum(duree) AS duree,
           bool_or(connecte) AS connecte,
           (array_agg(chemin ORDER BY cree_le))[1] AS entree,
           (array_agg(provenance ORDER BY cree_le))[1] AS provenance,
           (array_agg(appareil ORDER BY cree_le))[1] AS appareil
      FROM v
     GROUP BY visite
  ),
  -- Première venue connue de chaque visiteur de la période : nouveau ou habitué.
  premieres AS (
    SELECT visiteur, min(cree_le) AS premiere
      FROM public.vues_pages
     WHERE visiteur IN (SELECT DISTINCT visiteur FROM v)
       AND (p_hote IS NULL OR hote = p_hote)
     GROUP BY visiteur
  )
  SELECT jsonb_build_object(
    'jours', nb_jours,
    'debut', debut,
    'totaux', jsonb_build_object(
      'vues', (SELECT count(*) FROM v),
      'visiteurs', (SELECT count(DISTINCT visiteur) FROM v),
      'visites', (SELECT count(*) FROM visites),
      'duree_totale', (SELECT coalesce(sum(duree), 0) FROM visites),
      'rebonds', (SELECT count(*) FROM visites WHERE pages = 1),
      'visites_connectees', (SELECT count(*) FROM visites WHERE connecte),
      'nouveaux', (SELECT count(*) FROM premieres WHERE premiere >= debut),
      'actifs', (SELECT count(DISTINCT visiteur) FROM v WHERE cree_le > NOW() - INTERVAL '5 minutes')
    ),
    'precedent', (
      SELECT jsonb_build_object(
        'vues', count(*),
        'visiteurs', count(DISTINCT visiteur),
        'visites', count(DISTINCT visite)
      )
        FROM public.vues_pages
       WHERE cree_le >= debut_prec AND cree_le < debut
         AND (p_hote IS NULL OR hote = p_hote)
    ),
    'par_jour', (
      SELECT coalesce(jsonb_agg(jsonb_build_object(
               'jour', j.jour,
               'vues', coalesce(x.vues, 0),
               'visites', coalesce(x.visites, 0)
             ) ORDER BY j.jour), '[]'::jsonb)
        FROM (SELECT (aujourdhui - n) AS jour FROM generate_series(0, nb_jours - 1) AS n) j
        LEFT JOIN (
          SELECT (cree_le AT TIME ZONE 'Europe/Paris')::date AS jour,
                 count(*) AS vues,
                 count(DISTINCT visite) AS visites
            FROM v
           GROUP BY 1
        ) x ON x.jour = j.jour
    ),
    'par_heure', (
      SELECT jsonb_agg(coalesce(x.vues, 0) ORDER BY h.heure)
        FROM generate_series(0, 23) AS h(heure)
        LEFT JOIN (
          SELECT extract(hour FROM cree_le AT TIME ZONE 'Europe/Paris')::int AS heure, count(*) AS vues
            FROM v
           GROUP BY 1
        ) x ON x.heure = h.heure
    ),
    'pages', (
      SELECT coalesce(jsonb_agg(p ORDER BY p.vues DESC, p.chemin), '[]'::jsonb)
        FROM (
          SELECT v.chemin,
                 count(*) AS vues,
                 count(DISTINCT v.visiteur) AS visiteurs,
                 coalesce(round(avg(v.duree) FILTER (WHERE v.duree > 0)), 0) AS duree_moyenne,
                 (SELECT count(*) FROM visites WHERE visites.entree = v.chemin) AS entrees
            FROM v
           GROUP BY v.chemin
           ORDER BY count(*) DESC, v.chemin
           LIMIT 50
        ) p
    ),
    'provenances', (
      SELECT coalesce(jsonb_agg(p ORDER BY p.visites DESC), '[]'::jsonb)
        FROM (
          SELECT provenance, count(*) AS visites
            FROM visites
           GROUP BY provenance
           ORDER BY count(*) DESC
           LIMIT 15
        ) p
    ),
    'appareils', (
      SELECT coalesce(jsonb_object_agg(appareil, nb), '{}'::jsonb)
        FROM (SELECT appareil, count(*) AS nb FROM visites GROUP BY appareil) a
    ),
    'hotes', (
      SELECT coalesce(jsonb_agg(h ORDER BY h.vues DESC), '[]'::jsonb)
        FROM (
          SELECT hote, count(*) AS vues
            FROM public.vues_pages
           WHERE cree_le >= debut
           GROUP BY hote
        ) h
    )
  )
  INTO resultat;

  RETURN resultat;
END;
$$;

REVOKE ALL ON FUNCTION public.admin_statistiques(INTEGER, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_statistiques(INTEGER, TEXT) TO authenticated;
