-- Accompagnement : les coachs référencés et les dirigeants qu'ils suivent
-- Date : 2026-09-15
--
-- Règles posées par Christophe le 2026-09-15 :
--   - seuls les coachs référencés (par un administrateur) peuvent être reliés ;
--   - le lien part du coach ou du dirigeant, mais le dirigeant l'accepte
--     toujours, prévenu de la transparence totale : le coach voit tout ce qu'il
--     saisit (ateliers, OKR, bilans) ;
--   - le coach reçoit chaque matin à 8 h le résumé de la veille (route
--     /api/resume-coachs, appelée par une fonction planifiée Netlify) ;
--   - un coach peut se dire indisponible : il ne reçoit plus de demande.
--
-- Même principe que l'administration : AUCUNE policy n'est ajoutée aux tables
-- existantes. Le coach lit les données de ses dirigeants uniquement à travers
-- des fonctions SECURITY DEFINER qui vérifient d'abord le lien actif.
--
-- Purement additive, la base est partagée avec l'application d'Eric :
--   - tables coachs_references, accompagnements, resumes_coachs_envoyes,
--     secrets_internes ;
--   - déclencheur « updated_at » sur ambitions, quarterly_objectives,
--     quarterly_key_results et actions (sans effet si la colonne était déjà
--     tenue à jour autrement) ;
--   - fonctions.
--
-- Migration idempotente : peut être ré-exécutée intégralement sans erreur.
-- ⚠️ Exécuter TOUT le fichier d'un seul bloc (ne pas sélectionner une portion).


-- ─── 1. Tables ─────────────────────────────────────────────────────────────

-- Les coachs référencés. Le référencement se fait depuis la fiche compte de
-- /admin/comptes ; zone, structure et piliers sont repris de la candidature.
CREATE TABLE IF NOT EXISTS public.coachs_references (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  structure TEXT CHECK (char_length(structure) <= 200),
  zone TEXT CHECK (char_length(zone) <= 200),
  piliers TEXT[] NOT NULL DEFAULT '{}',
  -- Faux : le coach ne prend plus de nouvel accompagnement (plus de demande).
  disponible BOOLEAN NOT NULL DEFAULT TRUE,
  -- Le résumé de 8 h, pour tous ses dirigeants.
  resume_quotidien BOOLEAN NOT NULL DEFAULT TRUE,
  reference_par UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reference_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.coachs_references ENABLE ROW LEVEL SECURITY;

-- Un lien coach → dirigeant. Quand le coach invite une adresse qui n'a pas
-- encore de compte, `dirigeant_id` reste vide : l'invitation apparaît dès que
-- la personne se connecte avec cette adresse.
CREATE TABLE IF NOT EXISTS public.accompagnements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  dirigeant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  email_invite TEXT CHECK (char_length(email_invite) <= 254),
  initie_par TEXT NOT NULL CHECK (initie_par IN ('coach', 'dirigeant')),
  statut TEXT NOT NULL DEFAULT 'en_attente'
    CHECK (statut IN ('en_attente', 'actif', 'refuse', 'termine')),
  -- Quand le dirigeant a accepté la transparence (en invitant ou en acceptant).
  consentement_le TIMESTAMPTZ,
  -- Ce dirigeant figure-t-il dans le résumé de 8 h du coach ?
  resume_quotidien BOOLEAN NOT NULL DEFAULT TRUE,
  -- Dernière ouverture de la fiche par le coach : repère des nouveautés.
  coach_vu_le TIMESTAMPTZ,
  -- L'email d'invitation ne part qu'une fois.
  email_envoye_le TIMESTAMPTZ,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  repondu_le TIMESTAMPTZ,
  termine_le TIMESTAMPTZ,
  CONSTRAINT accompagnements_destinataire CHECK (dirigeant_id IS NOT NULL OR email_invite IS NOT NULL),
  CONSTRAINT accompagnements_pas_soi_meme CHECK (dirigeant_id IS DISTINCT FROM coach_id)
);

CREATE UNIQUE INDEX IF NOT EXISTS accompagnements_un_seul_lien
  ON public.accompagnements (coach_id, dirigeant_id)
  WHERE statut IN ('en_attente', 'actif') AND dirigeant_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS accompagnements_une_invitation
  ON public.accompagnements (coach_id, lower(email_invite))
  WHERE statut = 'en_attente' AND dirigeant_id IS NULL;
CREATE INDEX IF NOT EXISTS idx_accompagnements_dirigeant ON public.accompagnements (dirigeant_id);
CREATE INDEX IF NOT EXISTS idx_accompagnements_email
  ON public.accompagnements (lower(email_invite)) WHERE dirigeant_id IS NULL;

ALTER TABLE public.accompagnements ENABLE ROW LEVEL SECURITY;

-- Les résumés déjà envoyés : la route peut tourner deux fois sans doublon.
CREATE TABLE IF NOT EXISTS public.resumes_coachs_envoyes (
  coach_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  jour DATE NOT NULL,
  envoye_le TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (coach_id, jour)
);

ALTER TABLE public.resumes_coachs_envoyes ENABLE ROW LEVEL SECURITY;

-- Secrets des tâches automatiques, jamais lisibles depuis l'application.
-- Le secret du résumé est tiré au hasard à la première exécution ; il est
-- affiché à la fin de ce fichier, à recopier dans Netlify (RESUME_COACHS_SECRET).
CREATE TABLE IF NOT EXISTS public.secrets_internes (
  nom TEXT PRIMARY KEY,
  valeur TEXT NOT NULL,
  cree_le TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.secrets_internes ENABLE ROW LEVEL SECURITY;

INSERT INTO public.secrets_internes (nom, valeur)
VALUES ('resume_coachs', replace(gen_random_uuid()::TEXT || gen_random_uuid()::TEXT, '-', ''))
ON CONFLICT (nom) DO NOTHING;


-- ─── 2. « updated_at » tenu à jour sur les tables OKR ──────────────────────
-- Le résumé repère ce qui a changé la veille grâce à cette colonne.
-- Réutilise touch_atelier() (migration 20260910_create_ateliers).

DO $$
DECLARE
  t TEXT;
BEGIN
  FOREACH t IN ARRAY ARRAY['ambitions', 'quarterly_objectives', 'quarterly_key_results', 'actions'] LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS %I ON public.%I', t || '_touch_suivi', t);
    EXECUTE format(
      'CREATE TRIGGER %I BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.touch_atelier()',
      t || '_touch_suivi', t
    );
  END LOOP;
END $$;


-- ─── 3. Fonctions internes (jamais appelables depuis l'application) ────────

CREATE OR REPLACE FUNCTION public.est_coach()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS (SELECT 1 FROM public.coachs_references WHERE user_id = auth.uid());
$$;

-- L'adresse du compte connecté, en minuscules.
CREATE OR REPLACE FUNCTION public.mon_adresse()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT lower(email) FROM auth.users WHERE id = auth.uid();
$$;

-- Date de la dernière modification de chaque pilier d'un dirigeant.
CREATE OR REPLACE FUNCTION public.derniere_activite_dirigeant(p_user UUID)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'vision', (SELECT v.updated_at FROM public.vision_ateliers v WHERE v.user_id = p_user),
    'fit', (SELECT a.updated_at FROM public.ateliers a WHERE a.user_id = p_user AND a.pilier = 'fit'),
    'finance', (SELECT a.updated_at FROM public.ateliers a WHERE a.user_id = p_user AND a.pilier = 'finance'),
    'team', (SELECT a.updated_at FROM public.ateliers a WHERE a.user_id = p_user AND a.pilier = 'team'),
    'okr', (
      SELECT MAX(m) FROM (
        SELECT MAX(GREATEST(am.created_at, am.updated_at)) AS m FROM public.ambitions am WHERE am.user_id = p_user
        UNION ALL
        SELECT MAX(GREATEST(q.created_at, q.updated_at)) FROM public.quarterly_objectives q WHERE q.user_id = p_user
        UNION ALL
        SELECT MAX(GREATEST(k.created_at, k.updated_at))
        FROM public.quarterly_key_results k
        JOIN public.quarterly_objectives q ON q.id = k.objective_id
        WHERE q.user_id = p_user
        UNION ALL
        SELECT MAX(GREATEST(ac.created_at, ac.updated_at)) FROM public.actions ac WHERE ac.user_id = p_user
      ) x
    ),
    'bilans', (SELECT MAX(d.created_at) FROM public.diagnostics d WHERE d.user_id = p_user)
  );
$$;

-- Ce qu'un dirigeant a modifié entre deux instants, pour le résumé du matin :
-- vrai / faux par atelier, nombre d'éléments pour les OKR et les bilans.
CREATE OR REPLACE FUNCTION public.activite_dirigeant_entre(p_user UUID, p_debut TIMESTAMPTZ, p_fin TIMESTAMPTZ)
RETURNS JSONB
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT jsonb_build_object(
    'vision', EXISTS (
      SELECT 1 FROM public.vision_ateliers v
      WHERE v.user_id = p_user AND v.updated_at >= p_debut AND v.updated_at < p_fin
    ),
    'fit', EXISTS (
      SELECT 1 FROM public.ateliers a
      WHERE a.user_id = p_user AND a.pilier = 'fit' AND a.updated_at >= p_debut AND a.updated_at < p_fin
    ),
    'finance', EXISTS (
      SELECT 1 FROM public.ateliers a
      WHERE a.user_id = p_user AND a.pilier = 'finance' AND a.updated_at >= p_debut AND a.updated_at < p_fin
    ),
    'team', EXISTS (
      SELECT 1 FROM public.ateliers a
      WHERE a.user_id = p_user AND a.pilier = 'team' AND a.updated_at >= p_debut AND a.updated_at < p_fin
    ),
    'okr', (
      SELECT COUNT(*)::INTEGER FROM (
        SELECT GREATEST(am.created_at, am.updated_at) AS m FROM public.ambitions am WHERE am.user_id = p_user
        UNION ALL
        SELECT GREATEST(q.created_at, q.updated_at) FROM public.quarterly_objectives q WHERE q.user_id = p_user
        UNION ALL
        SELECT GREATEST(k.created_at, k.updated_at)
        FROM public.quarterly_key_results k
        JOIN public.quarterly_objectives q ON q.id = k.objective_id
        WHERE q.user_id = p_user
        UNION ALL
        SELECT GREATEST(ac.created_at, ac.updated_at) FROM public.actions ac WHERE ac.user_id = p_user
      ) x
      WHERE x.m >= p_debut AND x.m < p_fin
    ),
    'bilans', (
      SELECT COUNT(*)::INTEGER FROM public.diagnostics d
      WHERE d.user_id = p_user AND d.created_at >= p_debut AND d.created_at < p_fin
    )
  );
$$;

CREATE OR REPLACE FUNCTION public.secret_interne_valide(p_nom TEXT, p_valeur TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT p_valeur IS NOT NULL
     AND char_length(p_valeur) >= 32
     AND EXISTS (SELECT 1 FROM public.secrets_internes s WHERE s.nom = p_nom AND s.valeur = p_valeur);
$$;


-- ─── 4. Lectures (coach et dirigeant) ──────────────────────────────────────

-- Le profil du coach connecté ; NULL pour un compte qui n'est pas coach.
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
    'zone', c.zone,
    'piliers', to_jsonb(c.piliers),
    'reference_le', c.reference_le
  )
  FROM public.coachs_references c
  WHERE c.user_id = auth.uid();
$$;

-- Les liens en cours du compte connecté, côté coach comme côté dirigeant
-- (dont les invitations faites à son adresse avant qu'il ait un compte).
-- Côté coach, un lien actif porte la date de dernière modification de chaque pilier.
CREATE OR REPLACE FUNCTION public.mes_accompagnements()
RETURNS TABLE (
  id UUID,
  role TEXT,
  statut TEXT,
  initie_par TEXT,
  a_moi_de_repondre BOOLEAN,
  autre_id UUID,
  autre_nom TEXT,
  autre_email TEXT,
  autre_entreprise TEXT,
  autre_activite TEXT,
  autre_structure TEXT,
  resume_quotidien BOOLEAN,
  coach_vu_le TIMESTAMPTZ,
  cree_le TIMESTAMPTZ,
  repondu_le TIMESTAMPTZ,
  activite JSONB
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT
    a.id,
    'coach'::TEXT,
    a.statut,
    a.initie_par,
    a.statut = 'en_attente' AND a.initie_par = 'dirigeant',
    a.dirigeant_id,
    p.name,
    COALESCE(p.email, a.email_invite),
    p.company,
    p.company_profile->>'industry',
    NULL::TEXT,
    a.resume_quotidien,
    a.coach_vu_le,
    a.cree_le,
    a.repondu_le,
    CASE WHEN a.statut = 'actif' THEN public.derniere_activite_dirigeant(a.dirigeant_id) END
  FROM public.accompagnements a
  LEFT JOIN public.profiles p ON p.id = a.dirigeant_id
  WHERE a.coach_id = auth.uid()
    AND a.statut IN ('en_attente', 'actif')
  UNION ALL
  SELECT
    a.id,
    'dirigeant'::TEXT,
    a.statut,
    a.initie_par,
    a.statut = 'en_attente' AND a.initie_par = 'coach',
    a.coach_id,
    p.name,
    p.email,
    p.company,
    NULL::TEXT,
    c.structure,
    NULL::BOOLEAN,
    NULL::TIMESTAMPTZ,
    a.cree_le,
    a.repondu_le,
    NULL::JSONB
  FROM public.accompagnements a
  JOIN public.profiles p ON p.id = a.coach_id
  LEFT JOIN public.coachs_references c ON c.user_id = a.coach_id
  WHERE (a.dirigeant_id = auth.uid()
         OR (a.dirigeant_id IS NULL AND lower(a.email_invite) = public.mon_adresse()))
    AND a.statut IN ('en_attente', 'actif')
  ORDER BY 14 DESC;
$$;

-- Tout ce qu'un dirigeant a saisi, pour son coach ; NULL sans lien actif.
-- Note la visite du coach ; `vu_precedemment` garde la visite d'avant, pour
-- signaler ce qui a changé depuis.
CREATE OR REPLACE FUNCTION public.coach_fiche_dirigeant(p_dirigeant UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lien public.accompagnements%ROWTYPE;
  v_fiche JSONB;
BEGIN
  SELECT * INTO v_lien
  FROM public.accompagnements a
  WHERE a.coach_id = auth.uid() AND a.dirigeant_id = p_dirigeant AND a.statut = 'actif';
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT jsonb_build_object(
    'accompagnement_id', v_lien.id,
    'depuis', COALESCE(v_lien.repondu_le, v_lien.cree_le),
    'vu_precedemment', v_lien.coach_vu_le,
    'resume_quotidien', v_lien.resume_quotidien,
    'profil', (
      SELECT jsonb_build_object(
        'nom', p.name,
        'email', p.email,
        'entreprise', p.company,
        'activite', p.company_profile->>'industry'
      )
      FROM public.profiles p WHERE p.id = p_dirigeant
    ),
    'activite', public.derniere_activite_dirigeant(p_dirigeant),
    'vision', (SELECT v.contenu FROM public.vision_ateliers v WHERE v.user_id = p_dirigeant),
    'fit', (SELECT a.contenu FROM public.ateliers a WHERE a.user_id = p_dirigeant AND a.pilier = 'fit'),
    'finance', (SELECT a.contenu FROM public.ateliers a WHERE a.user_id = p_dirigeant AND a.pilier = 'finance'),
    'team', (SELECT a.contenu FROM public.ateliers a WHERE a.user_id = p_dirigeant AND a.pilier = 'team'),
    'okr', jsonb_build_object(
      'ambitions', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', am.id, 'titre', am.title, 'description', am.description,
            'annee', am.year, 'cible', am.target_value, 'unite', am.unit
          )
          ORDER BY am.year DESC, am.order_index
        )
        FROM public.ambitions am WHERE am.user_id = p_dirigeant
      ), '[]'::JSONB),
      'objectifs', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', q.id, 'ambition_id', q.ambition_id, 'titre', q.title,
            'description', q.description, 'trimestre', q.quarter, 'annee', q.year
          )
          ORDER BY q.year DESC, q.quarter DESC, q.order_index
        )
        FROM public.quarterly_objectives q WHERE q.user_id = p_dirigeant
      ), '[]'::JSONB),
      'resultats', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', k.id, 'objectif_id', k.objective_id, 'titre', k.title,
            'cible', k.target_value, 'actuel', k.current_value, 'unite', k.unit,
            'echeance', k.deadline
          )
          ORDER BY k.order_index
        )
        FROM public.quarterly_key_results k
        JOIN public.quarterly_objectives q ON q.id = k.objective_id
        WHERE q.user_id = p_dirigeant
      ), '[]'::JSONB),
      'actions', COALESCE((
        SELECT jsonb_agg(
          jsonb_build_object(
            'id', ac.id, 'resultat_id', ac.key_result_id, 'titre', ac.title,
            'statut', ac.status, 'echeance', ac.deadline
          )
          ORDER BY ac.order_index
        )
        FROM public.actions ac WHERE ac.user_id = p_dirigeant
      ), '[]'::JSONB)
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
      FROM public.diagnostics d WHERE d.user_id = p_dirigeant
    ), '[]'::JSONB)
  ) INTO v_fiche;

  UPDATE public.accompagnements SET coach_vu_le = NOW() WHERE id = v_lien.id;
  RETURN v_fiche;
END;
$$;


-- ─── 5. Écritures ──────────────────────────────────────────────────────────

-- Le dirigeant demande à un coach référencé de l'accompagner. En invitant, il
-- accepte la transparence (case cochée dans l'application).
CREATE OR REPLACE FUNCTION public.inviter_coach(p_email TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_coach UUID;
  v_disponible BOOLEAN;
  v_id UUID;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Connectez-vous d''abord.' USING ERRCODE = '42501';
  END IF;

  SELECT c.user_id, c.disponible INTO v_coach, v_disponible
  FROM public.coachs_references c
  JOIN auth.users u ON u.id = c.user_id
  WHERE lower(u.email) = lower(btrim(p_email));

  IF v_coach IS NULL THEN
    RAISE EXCEPTION 'Aucun coach référencé Oskar n''utilise cette adresse.';
  END IF;
  IF v_coach = auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas être votre propre coach.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.accompagnements a
    WHERE a.coach_id = v_coach
      AND a.statut IN ('en_attente', 'actif')
      AND (a.dirigeant_id = auth.uid()
           OR (a.dirigeant_id IS NULL AND lower(a.email_invite) = public.mon_adresse()))
  ) THEN
    RAISE EXCEPTION 'Ce coach vous accompagne déjà, ou une invitation est en cours entre vous.';
  END IF;
  IF NOT v_disponible THEN
    RAISE EXCEPTION 'Ce coach ne prend pas de nouvel accompagnement pour le moment.';
  END IF;

  INSERT INTO public.accompagnements (coach_id, dirigeant_id, initie_par, consentement_le)
  VALUES (v_coach, auth.uid(), 'dirigeant', NOW())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Le coach invite un dirigeant, avec ou sans compte Oskar.
CREATE OR REPLACE FUNCTION public.inviter_dirigeant(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_email TEXT := lower(btrim(COALESCE(p_email, '')));
  v_dirigeant UUID;
  v_id UUID;
BEGIN
  IF NOT public.est_coach() THEN
    RAISE EXCEPTION 'Réservé aux coachs référencés.' USING ERRCODE = '42501';
  END IF;
  IF v_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$' OR char_length(v_email) > 254 THEN
    RAISE EXCEPTION 'Adresse email invalide.';
  END IF;

  SELECT u.id INTO v_dirigeant FROM auth.users u WHERE lower(u.email) = v_email;

  IF v_dirigeant = auth.uid() THEN
    RAISE EXCEPTION 'Vous ne pouvez pas vous inviter vous-même.';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.accompagnements a
    WHERE a.coach_id = auth.uid()
      AND a.statut IN ('en_attente', 'actif')
      AND (a.dirigeant_id = v_dirigeant
           OR (a.dirigeant_id IS NULL AND lower(a.email_invite) = v_email))
  ) THEN
    RAISE EXCEPTION 'Vous accompagnez déjà cette personne, ou une invitation est en cours entre vous.';
  END IF;

  INSERT INTO public.accompagnements (coach_id, dirigeant_id, email_invite, initie_par)
  VALUES (auth.uid(), v_dirigeant, v_email, 'coach')
  RETURNING id INTO v_id;
  RETURN jsonb_build_object('id', v_id, 'a_un_compte', v_dirigeant IS NOT NULL);
END;
$$;

-- Accepter ou refuser une invitation. Répond celui qui ne l'a pas envoyée.
CREATE OR REPLACE FUNCTION public.repondre_accompagnement(p_id UUID, p_accepte BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lien public.accompagnements%ROWTYPE;
BEGIN
  SELECT * INTO v_lien FROM public.accompagnements a WHERE a.id = p_id AND a.statut = 'en_attente' FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Cette invitation n''est plus en attente.';
  END IF;

  IF v_lien.initie_par = 'coach' THEN
    -- Le dirigeant répond : en acceptant, il accepte la transparence.
    IF NOT (COALESCE(v_lien.dirigeant_id = auth.uid(), FALSE)
            OR COALESCE(v_lien.dirigeant_id IS NULL AND lower(v_lien.email_invite) = public.mon_adresse(), FALSE)) THEN
      RAISE EXCEPTION 'Cette invitation ne vous est pas adressée.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.accompagnements
    SET dirigeant_id = auth.uid(),
        statut = CASE WHEN p_accepte THEN 'actif' ELSE 'refuse' END,
        consentement_le = CASE WHEN p_accepte THEN NOW() END,
        repondu_le = NOW()
    WHERE id = p_id;
  ELSE
    -- Le coach répond à une demande de dirigeant.
    IF v_lien.coach_id IS DISTINCT FROM auth.uid() THEN
      RAISE EXCEPTION 'Cette demande ne vous est pas adressée.' USING ERRCODE = '42501';
    END IF;
    UPDATE public.accompagnements
    SET statut = CASE WHEN p_accepte THEN 'actif' ELSE 'refuse' END,
        repondu_le = NOW()
    WHERE id = p_id;
  END IF;
END;
$$;

-- Mettre fin à un accompagnement, ou annuler une invitation. Le coach perd
-- aussitôt l'accès. Coach comme dirigeant peuvent le faire.
CREATE OR REPLACE FUNCTION public.terminer_accompagnement(p_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.accompagnements a
  SET statut = 'termine', termine_le = NOW()
  WHERE a.id = p_id
    AND a.statut IN ('en_attente', 'actif')
    AND (a.coach_id = auth.uid()
         OR a.dirigeant_id = auth.uid()
         OR (a.dirigeant_id IS NULL AND lower(a.email_invite) = public.mon_adresse()));
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Accompagnement introuvable ou déjà terminé.';
  END IF;
END;
$$;

-- Réglages du coach : disponibilité, résumé de 8 h. NULL = inchangé.
CREATE OR REPLACE FUNCTION public.coach_maj_reglages(p_disponible BOOLEAN, p_resume_quotidien BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.coachs_references
  SET disponible = COALESCE(p_disponible, disponible),
      resume_quotidien = COALESCE(p_resume_quotidien, resume_quotidien)
  WHERE user_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Réservé aux coachs référencés.' USING ERRCODE = '42501';
  END IF;
END;
$$;

-- Un dirigeant dans le résumé de 8 h, ou pas.
CREATE OR REPLACE FUNCTION public.coach_maj_resume_dirigeant(p_id UUID, p_resume BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  UPDATE public.accompagnements
  SET resume_quotidien = p_resume
  WHERE id = p_id AND coach_id = auth.uid();
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Accompagnement introuvable.';
  END IF;
END;
$$;

-- Pour l'email d'invitation (route /api/notifier-accompagnement) : ne sert
-- qu'une fois, à l'auteur de l'invitation, dans le quart d'heure qui suit.
CREATE OR REPLACE FUNCTION public.accompagnement_a_notifier(p_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_lien public.accompagnements%ROWTYPE;
  v JSONB;
BEGIN
  SELECT * INTO v_lien
  FROM public.accompagnements a
  WHERE a.id = p_id
    AND a.statut = 'en_attente'
    AND a.email_envoye_le IS NULL
    AND a.cree_le > NOW() - INTERVAL '15 minutes'
    AND ((a.initie_par = 'coach' AND a.coach_id = auth.uid())
         OR (a.initie_par = 'dirigeant' AND a.dirigeant_id = auth.uid()))
  FOR UPDATE;
  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  UPDATE public.accompagnements SET email_envoye_le = NOW() WHERE id = p_id;

  IF v_lien.initie_par = 'coach' THEN
    SELECT jsonb_build_object(
      'sens', 'coach_vers_dirigeant',
      'destinataire_email', COALESCE(d.email, v_lien.email_invite),
      'destinataire_nom', d.name,
      'a_un_compte', v_lien.dirigeant_id IS NOT NULL,
      'auteur_nom', c.name,
      'auteur_email', c.email,
      'auteur_structure', r.structure
    ) INTO v
    FROM public.profiles c
    LEFT JOIN public.coachs_references r ON r.user_id = c.id
    LEFT JOIN public.profiles d ON d.id = v_lien.dirigeant_id
    WHERE c.id = v_lien.coach_id;
  ELSE
    SELECT jsonb_build_object(
      'sens', 'dirigeant_vers_coach',
      'destinataire_email', c.email,
      'destinataire_nom', c.name,
      'a_un_compte', TRUE,
      'auteur_nom', d.name,
      'auteur_email', d.email,
      'auteur_entreprise', d.company
    ) INTO v
    FROM public.profiles c, public.profiles d
    WHERE c.id = v_lien.coach_id AND d.id = v_lien.dirigeant_id;
  END IF;
  RETURN v;
END;
$$;


-- ─── 6. Administration : référencer un coach ───────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_coachs()
RETURNS SETOF UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT c.user_id FROM public.coachs_references c WHERE public.est_admin();
$$;

-- Référencer : zone, structure et piliers repris de la dernière candidature
-- faite avec la même adresse (la validée d'abord). Retirer le référencement
-- met fin aux accompagnements du coach.
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
    INSERT INTO public.coachs_references (user_id, structure, zone, piliers, reference_par)
    SELECT p.id, k.structure, k.zone, COALESCE(k.piliers, '{}'), auth.uid()
    FROM public.profiles p
    LEFT JOIN LATERAL (
      SELECT cc.structure, cc.zone, cc.piliers
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


-- ─── 7. Le résumé de 8 h (route /api/resume-coachs) ────────────────────────
-- Appelées avec la clé publique : c'est le secret interne qui protège. Un
-- appel sans le bon secret est refusé.

-- Un résumé par coach pour la journée `p_jour` (heure de Paris), avec les
-- dirigeants qui ont travaillé ce jour-là. Coachs déjà servis exclus.
CREATE OR REPLACE FUNCTION public.resume_coachs(p_secret TEXT, p_jour DATE)
RETURNS TABLE (coach_id UUID, coach_email TEXT, coach_nom TEXT, dirigeants JSONB)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
#variable_conflict use_column
DECLARE
  v_debut TIMESTAMPTZ := p_jour::TIMESTAMP AT TIME ZONE 'Europe/Paris';
  v_fin TIMESTAMPTZ := (p_jour + 1)::TIMESTAMP AT TIME ZONE 'Europe/Paris';
BEGIN
  IF NOT public.secret_interne_valide('resume_coachs', p_secret) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT c.user_id, p.email, p.name, x.liste
  FROM public.coachs_references c
  JOIN public.profiles p ON p.id = c.user_id
  CROSS JOIN LATERAL (
    SELECT jsonb_agg(
      jsonb_build_object(
        'id', d.id,
        'nom', d.name,
        'email', d.email,
        'entreprise', d.company,
        'activite', act.j
      )
      ORDER BY d.name
    ) AS liste
    FROM public.accompagnements a
    JOIN public.profiles d ON d.id = a.dirigeant_id
    CROSS JOIN LATERAL (
      SELECT public.activite_dirigeant_entre(a.dirigeant_id, v_debut, v_fin) AS j
    ) act
    WHERE a.coach_id = c.user_id
      AND a.statut = 'actif'
      AND a.resume_quotidien
      AND (
        (act.j->>'vision')::BOOLEAN
        OR (act.j->>'fit')::BOOLEAN
        OR (act.j->>'finance')::BOOLEAN
        OR (act.j->>'team')::BOOLEAN
        OR (act.j->>'okr')::INTEGER > 0
        OR (act.j->>'bilans')::INTEGER > 0
      )
  ) x
  WHERE c.resume_quotidien
    AND x.liste IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.resumes_coachs_envoyes r
      WHERE r.coach_id = c.user_id AND r.jour = p_jour
    );
END;
$$;

-- Noter un résumé envoyé (et oublier ceux de plus de 90 jours).
CREATE OR REPLACE FUNCTION public.resume_coachs_marquer(p_secret TEXT, p_coach_id UUID, p_jour DATE)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.secret_interne_valide('resume_coachs', p_secret) THEN
    RAISE EXCEPTION 'Accès refusé' USING ERRCODE = '42501';
  END IF;
  INSERT INTO public.resumes_coachs_envoyes (coach_id, jour)
  VALUES (p_coach_id, p_jour)
  ON CONFLICT DO NOTHING;
  DELETE FROM public.resumes_coachs_envoyes WHERE jour < p_jour - 90;
END;
$$;


-- ─── 8. Droits d'exécution ─────────────────────────────────────────────────
-- Supabase donne par défaut le droit d'exécution à anon et authenticated :
-- on le retire partout, puis on le rend fonction par fonction.

REVOKE ALL ON FUNCTION public.est_coach() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mon_adresse() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.derniere_activite_dirigeant(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.activite_dirigeant_entre(UUID, TIMESTAMPTZ, TIMESTAMPTZ) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.secret_interne_valide(TEXT, TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mon_profil_coach() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.mes_accompagnements() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.coach_fiche_dirigeant(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inviter_coach(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.inviter_dirigeant(TEXT) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.repondre_accompagnement(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.terminer_accompagnement(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.coach_maj_reglages(BOOLEAN, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.coach_maj_resume_dirigeant(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.accompagnement_a_notifier(UUID) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_coachs() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.admin_referencer_coach(UUID, BOOLEAN) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resume_coachs(TEXT, DATE) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.resume_coachs_marquer(TEXT, UUID, DATE) FROM PUBLIC, anon, authenticated;

-- Comptes connectés : chaque fonction vérifie ensuite qui appelle.
GRANT EXECUTE ON FUNCTION public.mon_profil_coach() TO authenticated;
GRANT EXECUTE ON FUNCTION public.mes_accompagnements() TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_fiche_dirigeant(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inviter_coach(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.inviter_dirigeant(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.repondre_accompagnement(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.terminer_accompagnement(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_maj_reglages(BOOLEAN, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.coach_maj_resume_dirigeant(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accompagnement_a_notifier(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_coachs() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_referencer_coach(UUID, BOOLEAN) TO authenticated;

-- Le résumé de 8 h : appelé par le serveur avec la clé publique, protégé par le secret.
GRANT EXECUTE ON FUNCTION public.resume_coachs(TEXT, DATE) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.resume_coachs_marquer(TEXT, UUID, DATE) TO anon, authenticated;


-- ─── 9. Le secret à recopier dans Netlify ──────────────────────────────────
-- Netlify > Site configuration > Environment variables :
--   RESUME_COACHS_SECRET = la valeur affichée sous l'éditeur.

SELECT valeur AS "RESUME_COACHS_SECRET (à recopier dans Netlify)"
FROM public.secrets_internes
WHERE nom = 'resume_coachs';
