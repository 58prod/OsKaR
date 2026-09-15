import React from 'react';
import { AccompagnementShell } from '@/components/accompagnement/AccompagnementShell';
import { VueFicheCoach } from '@/components/accompagnement/VueFicheCoach';
import { ReserveAuxCoachs } from '@/components/accompagnement/elements';
import { Chargement } from '@/components/admin/elements';
import { useMajFicheCoach, useMajReglagesCoach, useProfilCoach } from '@/hooks/useAccompagnements';
import { useToast } from '@/hooks/useToast';
import { useAppStore } from '@/store/useAppStore';

/*
 * « Ma fiche coach » : le coach référencé tient sa structure et sa fiche
 * d'annuaire, règle sa disponibilité et son résumé de 8 h.
 */

const message = (e: unknown, defaut: string) => (e instanceof Error && e.message ? e.message : defaut);

const MaFicheCoachPage: React.FC = () => {
  const { user } = useAppStore();
  const { profil, estCoach, enCours } = useProfilCoach();
  const majFiche = useMajFicheCoach();
  const reglages = useMajReglagesCoach();
  const toast = useToast();

  const tenter = async (faire: () => Promise<unknown>, succes: string, echec: string) => {
    try {
      await faire();
      toast.success(succes);
      return true;
    } catch (e) {
      toast.error(message(e, echec));
      return false;
    }
  };

  return (
    <AccompagnementShell
      titre="Ma fiche coach"
      sousTitre="Votre structure et votre fiche dans l’annuaire des coachs Oskar : ce que les dirigeants verront de vous."
    >
      {enCours ? (
        <Chargement />
      ) : !estCoach || !profil ? (
        <ReserveAuxCoachs />
      ) : (
        <VueFicheCoach
          profil={profil}
          nom={user?.name?.trim() || user?.email || ''}
          onEnregistrer={(f) => tenter(() => majFiche.mutateAsync(f), 'Fiche enregistrée.', 'La fiche n’a pas pu être enregistrée.')}
          onReglages={(r) => tenter(() => reglages.mutateAsync(r), 'Réglage enregistré.', 'Le réglage n’a pas pu être enregistré.')}
        />
      )}
    </AccompagnementShell>
  );
};

export default MaFicheCoachPage;
