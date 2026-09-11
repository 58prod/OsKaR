import { supabase } from '@/lib/supabaseClient';
import { fusionnerVision, type AtelierVision } from '@/lib/vision/types';

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
    return fusionnerVision((data as { contenu: unknown }).contenu);
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

export default VisionService;
