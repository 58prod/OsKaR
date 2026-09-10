import { supabase } from '@/lib/supabaseClient';
import { ATELIER_VIDE, type AtelierVision } from '@/lib/vision/types';

/*
 * Persistance de l'atelier Vision : une ligne par personne, mise à jour au fil
 * des étapes (table `vision_ateliers`, migration 20260910).
 *
 * Le contenu est stocké tel quel en JSONB. À la lecture, on le fusionne avec
 * l'atelier vide : un atelier enregistré avant l'ajout d'un champ reste lisible,
 * et les étapes à venir n'exigeront pas de migration.
 */

export class VisionService {
  /** L'atelier de la personne connectée, ou null si elle n'en a pas encore. */
  static async get(userId: string): Promise<AtelierVision | null> {
    const { data, error } = await supabase
      .from('vision_ateliers')
      .select('contenu')
      .eq('user_id', userId)
      .maybeSingle();

    if (error) {
      console.error('❌ Lecture de l’atelier Vision impossible :', error.message);
      throw error;
    }
    if (!data) return null;
    return fusionner((data as { contenu: unknown }).contenu);
  }

  /**
   * Enregistre l'atelier. Une seule ligne par personne : on écrase la
   * précédente (`upsert` sur `user_id`, qui porte une contrainte d'unicité).
   */
  static async enregistrer(userId: string, atelier: AtelierVision): Promise<void> {
    const { error } = await (supabase as any)
      .from('vision_ateliers')
      .upsert({ user_id: userId, contenu: atelier }, { onConflict: 'user_id' });

    if (error) {
      console.error('❌ Enregistrement de l’atelier Vision impossible :', error.message);
      throw error;
    }
  }
}

/** Complète un contenu enregistré avec les champs que l'atelier vide définit. */
function fusionner(contenu: unknown): AtelierVision {
  const brut = (contenu ?? {}) as Partial<AtelierVision>;
  return {
    ...ATELIER_VIDE,
    ...brut,
    projection: { ...ATELIER_VIDE.projection, ...(brut.projection ?? {}) },
    valeurs: brut.valeurs?.length ? brut.valeurs : ATELIER_VIDE.valeurs,
    objectifs: brut.objectifs?.length ? brut.objectifs : ATELIER_VIDE.objectifs,
    cibles: brut.cibles ?? [],
    acteurs: brut.acteurs ?? [],
  };
}

export default VisionService;
