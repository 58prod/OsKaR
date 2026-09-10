-- Migration : ateliers des piliers Fit, Finance et Team
-- Date : 2026-09-10
--
-- Une ligne par personne et par pilier. Même principe que `vision_ateliers` :
-- l'atelier se reprend au fil du temps, son contenu tient dans un JSONB dont la
-- structure vit dans le code (`src/lib/fit/types.ts` pour Fit).
--
-- Une seule table pour les trois ateliers restants, distingués par `pilier` :
-- Finance et Team n'exigeront pas de nouvelle migration.
--
-- Purement additive : la base est partagée avec l'application d'Eric, cette
-- table ne touche à rien d'existant.

CREATE TABLE IF NOT EXISTS public.ateliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  pilier text NOT NULL CHECK (pilier IN ('fit', 'finance', 'team')),
  contenu jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW(),
  UNIQUE (user_id, pilier)
);

CREATE INDEX IF NOT EXISTS idx_ateliers_user ON public.ateliers(user_id);

ALTER TABLE public.ateliers ENABLE ROW LEVEL SECURITY;

-- Chacun ne voit et ne modifie que ses propres ateliers.
DROP POLICY IF EXISTS "Lire ses ateliers" ON public.ateliers;
CREATE POLICY "Lire ses ateliers"
  ON public.ateliers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creer ses ateliers" ON public.ateliers;
CREATE POLICY "Creer ses ateliers"
  ON public.ateliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modifier ses ateliers" ON public.ateliers;
CREATE POLICY "Modifier ses ateliers"
  ON public.ateliers FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Supprimer ses ateliers" ON public.ateliers;
CREATE POLICY "Supprimer ses ateliers"
  ON public.ateliers FOR DELETE
  USING (auth.uid() = user_id);

-- Tenir `updated_at` à jour, comme les autres tables du schéma.
CREATE OR REPLACE FUNCTION public.touch_atelier()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS ateliers_touch ON public.ateliers;
CREATE TRIGGER ateliers_touch
  BEFORE UPDATE ON public.ateliers
  FOR EACH ROW EXECUTE FUNCTION public.touch_atelier();
