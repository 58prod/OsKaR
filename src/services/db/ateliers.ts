import { supabase } from '@/lib/supabaseClient';

/*
 * Persistance des ateliers Fit, Finance et Team : une ligne par personne et
 * par pilier (table `ateliers`, migration 20260910_create_ateliers).
 *
 * Le contenu est stocké tel quel en JSONB ; c'est à chaque atelier de le
 * compléter à la lecture avec ses valeurs vides (voir `fusionnerFit`), pour
 * qu'un atelier enregistré avant l'ajout d'un champ reste lisible.
 */

export type PilierAtelier = 'fit' | 'finance' | 'team';

export class AteliersService {
  /** Le contenu brut de l'atelier, ou null si la personne n'en a pas encore. */
  static async get(userId: string, pilier: PilierAtelier): Promise<unknown | null> {
    const { data, error } = await (supabase as any)
      .from('ateliers')
      .select('contenu')
      .eq('user_id', userId)
      .eq('pilier', pilier)
      .maybeSingle();

    if (error) {
      console.error(`❌ Lecture de l’atelier ${pilier} impossible :`, error.message);
      throw error;
    }
    return data ? (data as { contenu: unknown }).contenu : null;
  }

  /** Enregistre l'atelier en écrasant la version précédente. */
  static async enregistrer(userId: string, pilier: PilierAtelier, contenu: unknown): Promise<void> {
    const { error } = await (supabase as any)
      .from('ateliers')
      .upsert({ user_id: userId, pilier, contenu }, { onConflict: 'user_id,pilier' });

    if (error) {
      console.error(`❌ Enregistrement de l’atelier ${pilier} impossible :`, error.message);
      throw error;
    }
  }
}

export default AteliersService;
