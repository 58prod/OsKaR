import { supabase } from '@/lib/supabaseClient';
import { comptesDeLaDemande, type DemandeFormule } from '@/lib/tarifs/formules';

/*
 * Dépôt des demandes de formule (table `demandes_formule`, migration
 * 20260911_create_demandes_formule).
 *
 * Écriture seule : la table n'autorise aucune lecture depuis l'application,
 * d'où un INSERT sans `.select()` (il échouerait sur la RLS).
 */
export class DemandesFormuleService {
  static async deposer(d: DemandeFormule, userId: string | null): Promise<void> {
    const { error } = await (supabase as any).from('demandes_formule').insert({
      prenom: d.prenom.trim(),
      nom: d.nom.trim(),
      email: d.email.trim().toLowerCase(),
      entreprise: d.entreprise.trim(),
      objet: d.objet,
      comptes: comptesDeLaDemande(d),
      message: d.message.trim() || null,
      user_id: userId,
    });

    if (error) {
      console.error('❌ Dépôt de la demande de formule impossible :', error.message);
      throw error;
    }
  }
}

export default DemandesFormuleService;
