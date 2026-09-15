-- ════════════════════════════════════════════════════════════════════════
-- Compte de démonstration « coach »
--   identifiant : coach          (l'app complète en coach@demo.oskar)
--   mot de passe : coach2026
--
-- Camille Roche, coach référencée (fictive). Elle accompagne Marc Durand, le
-- compte de démonstration « oskar » (Menuiserie Durand) : en se connectant,
-- on voit « Mes dirigeants » et la fiche de Marc ; côté « oskar », « Mes
-- coachs » montre Camille.
--
-- Pas de résumé de 8 h : l'adresse est fictive, aucun email ne peut partir.
--
-- RELANÇABLE : le script supprime le compte (et ses liens) puis le recrée.
-- À RELANCER après compte_demo.sql : remettre la démo « oskar » à zéro
-- supprime Marc, et avec lui son lien avec Camille.
--
-- Demande les migrations 20260915_accompagnements et 20260915_fiche_coach. À exécuter en entier dans
-- Supabase > SQL Editor. Généré par Claude le 2026-09-15.
-- ════════════════════════════════════════════════════════════════════════

BEGIN;

-- 1. Remise à zéro : le compte emporte son profil, son référencement et ses liens.
DELETE FROM auth.users WHERE id = '0d5a0000-0000-4000-8000-000000000002' OR email = 'coach@demo.oskar';

-- 2. Le compte, email confirmé, mot de passe chiffré par pgcrypto.
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change_token_new, email_change,
  email_change_token_current, reauthentication_token, phone_change, phone_change_token
) VALUES (
  '00000000-0000-0000-0000-000000000000', '0d5a0000-0000-4000-8000-000000000002', 'authenticated', 'authenticated', 'coach@demo.oskar',
  extensions.crypt('coach2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}',
  '{"name":"Camille Roche","company":"Cap Dirigeants","role":"Coach"}',
  now(), now(), '', '', '', '', '', '', '', ''
);

INSERT INTO auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
VALUES (gen_random_uuid(), '0d5a0000-0000-4000-8000-000000000002', '0d5a0000-0000-4000-8000-000000000002',
  jsonb_build_object('sub', '0d5a0000-0000-4000-8000-000000000002', 'email', 'coach@demo.oskar', 'email_verified', true),
  'email', now(), now(), now());

-- 3. Profil (le déclencheur l'a créé : on le complète).
INSERT INTO public.profiles (id, email, name, company, role, settings)
VALUES ('0d5a0000-0000-4000-8000-000000000002', 'coach@demo.oskar', 'Camille Roche', 'Cap Dirigeants', 'Coach',
  '{"onboarding":{"okr":true}}'::jsonb)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, company = EXCLUDED.company, role = EXCLUDED.role,
  settings = EXCLUDED.settings;

-- 4. Coach référencée, disponible, sans résumé par email.
INSERT INTO public.coachs_references (user_id, structure, site, zone, piliers, approche, disponible, resume_quotidien)
VALUES ('0d5a0000-0000-4000-8000-000000000002', 'Cap Dirigeants', 'cap-dirigeants.example', 'Métropole lilloise · Distanciel',
  ARRAY['vision', 'finance', 'okr'],
  'J''accompagne des dirigeants d''entreprises artisanales et de services, de 5 à 50 personnes, qui veulent reprendre la main sur leur cap et leurs chiffres. Séances mensuelles d''une demi-journée, entre lesquelles nous avançons sur Oskar. Dernier accompagnement : un atelier de menuiserie qui a retrouvé trois mois de trésorerie en un an.',
  TRUE, FALSE);

-- 5. Elle accompagne Marc Durand (compte « oskar »), s'il existe.
INSERT INTO public.accompagnements (
  coach_id, dirigeant_id, email_invite, initie_par, statut, consentement_le,
  resume_quotidien, cree_le, repondu_le
)
SELECT '0d5a0000-0000-4000-8000-000000000002', p.id, p.email, 'coach', 'actif', now() - interval '9 days',
  FALSE, now() - interval '10 days', now() - interval '9 days'
FROM public.profiles p
WHERE p.id = '0d5a0000-0000-4000-8000-000000000001';

COMMIT;

-- Vérification : doit renvoyer 1 compte, coach référencée oui, 1 dirigeant suivi.
SELECT
  (SELECT count(*) FROM auth.users WHERE id = '0d5a0000-0000-4000-8000-000000000002') AS compte,
  EXISTS (SELECT 1 FROM public.coachs_references WHERE user_id = '0d5a0000-0000-4000-8000-000000000002') AS coach_referencee,
  (SELECT count(*) FROM public.accompagnements
    WHERE coach_id = '0d5a0000-0000-4000-8000-000000000002' AND statut = 'actif') AS dirigeants_suivis;
