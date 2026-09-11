import { supabase } from '@/lib/supabaseClient';
import type { Candidature } from '@/lib/coachs/candidature';

/*
 * Dépôt des candidatures à l'annuaire des coachs (table `candidatures_coachs`,
 * migration 20260911_create_candidatures_coachs).
 *
 * Écriture seule : la table n'autorise aucune lecture depuis l'application,
 * d'où un INSERT sans `.select()` (il échouerait sur la RLS).
 */
export class CandidaturesCoachsService {
  static async deposer(c: Candidature, userId: string | null): Promise<void> {
    const facultatif = (v: string) => v.trim() || null;
    const { error } = await (supabase as any).from('candidatures_coachs').insert({
      prenom: c.prenom.trim(),
      nom: c.nom.trim(),
      email: c.email.trim().toLowerCase(),
      zone: facultatif(c.zone),
      structure: facultatif(c.structure),
      site: facultatif(c.site),
      piliers: c.piliers,
      label_rpr: c.labelRpr,
      approche: facultatif(c.approche),
      user_id: userId,
    });

    if (error) {
      console.error('❌ Dépôt de la candidature coach impossible :', error.message);
      throw error;
    }
  }
}

export default CandidaturesCoachsService;
