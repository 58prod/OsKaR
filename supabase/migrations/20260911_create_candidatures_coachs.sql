-- Candidatures à l'annuaire des coachs (formulaire « Rejoindre l'annuaire » de /coachs).
--
-- Tout le monde peut déposer une candidature, avec ou sans compte. Personne ne
-- peut les relire depuis l'application : on les consulte dans Supabase
-- (Table Editor > candidatures_coachs) tant qu'aucun écran d'administration
-- n'existe. Le formulaire envoie donc un INSERT sans lecture en retour.
--
-- Migration idempotente : peut être ré-exécutée intégralement sans erreur.
-- ⚠️ Exécuter TOUT le fichier d'un seul bloc (ne pas sélectionner une portion).

CREATE TABLE IF NOT EXISTS candidatures_coachs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prenom TEXT NOT NULL CHECK (char_length(prenom) BETWEEN 1 AND 100),
  nom TEXT NOT NULL CHECK (char_length(nom) BETWEEN 1 AND 100),
  email TEXT NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  zone TEXT CHECK (char_length(zone) <= 200),
  structure TEXT CHECK (char_length(structure) <= 200),
  site TEXT CHECK (char_length(site) <= 300),
  piliers TEXT[] NOT NULL DEFAULT '{}'
    CHECK (piliers <@ ARRAY['vision', 'fit', 'finance', 'okr', 'team']::TEXT[]),
  label_rpr BOOLEAN NOT NULL DEFAULT FALSE,
  approche TEXT CHECK (char_length(approche) <= 3000),
  -- Renseigné quand la personne était connectée en candidatant.
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  statut TEXT NOT NULL DEFAULT 'nouvelle' CHECK (statut IN ('nouvelle', 'validee', 'refusee')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_candidatures_coachs_date ON candidatures_coachs(created_at DESC);

ALTER TABLE candidatures_coachs ENABLE ROW LEVEL SECURITY;

-- Dépôt : invité ou connecté. Une candidature arrive toujours « nouvelle », et
-- une personne connectée ne peut la rattacher qu'à son propre compte.
DROP POLICY IF EXISTS "Tout le monde peut candidater a l'annuaire" ON candidatures_coachs;
CREATE POLICY "Tout le monde peut candidater a l'annuaire"
  ON candidatures_coachs FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    statut = 'nouvelle'
    AND (user_id IS NULL OR user_id = auth.uid())
  );

-- Aucune policy SELECT / UPDATE / DELETE : lecture et validation se font
-- depuis le tableau de bord Supabase (rôle de service).
