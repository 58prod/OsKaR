-- Migration : atelier Vision
-- Date : 2026-09-10
--
-- Une ligne par personne : l'atelier Vision se reprend et se complète au fil du
-- temps, il n'est pas une suite d'instantanés comme les bilans. Le contenu tient
-- dans un JSONB (`contenu`) plutôt que dans une colonne par champ : les étapes
-- de l'atelier bougeront encore, et la structure vit dans
-- `src/lib/vision/types.ts`.
--
-- Purement additive : la base est partagée avec l'application d'Eric, cette
-- table ne touche à rien d'existant.

CREATE TABLE IF NOT EXISTS public.vision_ateliers (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  contenu jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vision_ateliers_user ON public.vision_ateliers(user_id);

ALTER TABLE public.vision_ateliers ENABLE ROW LEVEL SECURITY;

-- Chacun ne voit et ne modifie que son propre atelier.
DROP POLICY IF EXISTS "Lire son atelier vision" ON public.vision_ateliers;
CREATE POLICY "Lire son atelier vision"
  ON public.vision_ateliers FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Creer son atelier vision" ON public.vision_ateliers;
CREATE POLICY "Creer son atelier vision"
  ON public.vision_ateliers FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Modifier son atelier vision" ON public.vision_ateliers;
CREATE POLICY "Modifier son atelier vision"
  ON public.vision_ateliers FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Supprimer son atelier vision" ON public.vision_ateliers;
CREATE POLICY "Supprimer son atelier vision"
  ON public.vision_ateliers FOR DELETE
  USING (auth.uid() = user_id);

-- Tenir `updated_at` à jour, comme les autres tables du schéma.
CREATE OR REPLACE FUNCTION public.touch_vision_atelier()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS vision_ateliers_touch ON public.vision_ateliers;
CREATE TRIGGER vision_ateliers_touch
  BEFORE UPDATE ON public.vision_ateliers
  FOR EACH ROW EXECUTE FUNCTION public.touch_vision_atelier();
