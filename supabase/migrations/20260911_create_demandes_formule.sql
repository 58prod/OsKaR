-- Demandes de formule (formulaire de la page Tarifs, /pricing).
-- Date : 2026-09-11
--
-- Tant que Stripe n'est pas branché, la formule Dirigeant (39 € HT/mois ou
-- 390 € HT/an) et le sur-mesure (plusieurs comptes, réseaux) se demandent par
-- formulaire. Un administrateur active ensuite la formule depuis /admin/comptes
-- (« Offrir la formule »).
--
-- Tout le monde peut déposer une demande, avec ou sans compte. Aucune lecture
-- depuis l'application : l'écran /admin/demandes passe par les fonctions
-- admin_demandes_formule() et admin_maj_demande_formule(), qui vérifient
-- est_admin().
-- Prérequis : 20260911_administration.sql (fonction est_admin), déjà exécutée.
--
-- Purement additive, la base est partagée avec l'application d'Eric.
-- Migration idempotente : peut être ré-exécutée intégralement sans erreur.
-- ⚠️ Exécuter TOUT le fichier d'un seul bloc (ne pas sélectionner une portion).


-- ─── 1. La table ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.demandes_formule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL CHECK (char_length(prenom) BETWEEN 1 AND 100),
  nom TEXT NOT NULL CHECK (char_length(nom) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  -- Nom de l'entreprise, ou du réseau quand objet = 'reseau'.
  entreprise TEXT NOT NULL CHECK (char_length(entreprise) BETWEEN 1 AND 200),
  objet TEXT NOT NULL CHECK (objet IN ('mensuel', 'annuel', 'plusieurs_comptes', 'reseau')),
  -- Nombre de comptes (ou d'adhérents) souhaités, pour le sur-mesure.
  comptes INTEGER CHECK (comptes BETWEEN 1 AND 100000),
  message TEXT CHECK (char_length(message) <= 3000),
  -- Renseigné quand la personne était connectée en faisant sa demande.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'nouvelle'
    CHECK (statut IN ('nouvelle', 'contactee', 'activee', 'abandonnee')),
  notes TEXT CHECK (char_length(notes) <= 5000),
  traitee_le TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_demandes_formule_date ON public.demandes_formule(created_at DESC);

ALTER TABLE public.demandes_formule ENABLE ROW LEVEL SECURITY;

-- Dépôt : invité ou connecté. Une demande arrive toujours « nouvelle », sans
-- note, et une personne connectée ne peut la rattacher qu'à son propre compte.
DROP POLICY IF EXISTS "Tout le monde peut demander une formule" ON public.demandes_formule;
CREATE POLICY "Tout le monde peut demander une formule"
  ON public.demandes_formule FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    statut = 'nouvelle'
    AND notes IS NULL
    AND traitee_le IS NULL
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Aucune policy SELECT / UPDATE / DELETE : l'administration passe par les
-- fonctions ci-dessous.


-- ─── 2. Administration ─────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_demandes_formule()
RETURNS SETOF public.demandes_formule
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT * FROM public.demandes_formule
  WHERE public.est_admin()
  ORDER BY created_at DESC;
$$;

CREATE OR REPLACE FUNCTION public.admin_maj_demande_formule(p_id UUID, p_statut TEXT, p_notes TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NOT public.est_admin() THEN
    RAISE EXCEPTION 'Réservé aux administrateurs' USING ERRCODE = '42501';
  END IF;

  UPDATE public.demandes_formule
  SET statut = p_statut,
      notes = NULLIF(btrim(p_notes), ''),
      traitee_le = NOW()
  WHERE id = p_id;
END;
$$;

-- Réservées aux comptes connectés ; chaque fonction vérifie ensuite est_admin().
REVOKE ALL ON FUNCTION public.admin_demandes_formule() FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.admin_maj_demande_formule(UUID, TEXT, TEXT) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.admin_demandes_formule() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_maj_demande_formule(UUID, TEXT, TEXT) TO authenticated;
