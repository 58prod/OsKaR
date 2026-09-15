import React from 'react';
import { AccompagnementShell } from '@/components/accompagnement/AccompagnementShell';
import { VueMesDirigeants } from '@/components/accompagnement/VueMesDirigeants';
import { ReserveAuxCoachs } from '@/components/accompagnement/elements';
import { Chargement, Erreur } from '@/components/admin/elements';
import {
  useInviterDirigeant,
  useMajReglagesCoach,
  useMajResumeDirigeant,
  useMesAccompagnements,
  useProfilCoach,
  useRepondreAccompagnement,
  useTerminerAccompagnement,
} from '@/hooks/useAccompagnements';
import { useToast } from '@/hooks/useToast';

/*
 * « Mes dirigeants » : l'espace du coach référencé. Les dirigeants qu'il suit,
 * ce qui a bougé, les invitations, ses réglages (disponibilité, résumé de 8 h).
 */

const message = (e: unknown, defaut: string) => (e instanceof Error && e.message ? e.message : defaut);

const MesDirigeantsPage: React.FC = () => {
  const { profil, estCoach, enCours } = useProfilCoach();
  const { data: liste, error, isLoading } = useMesAccompagnements();
  const inviter = useInviterDirigeant();
  const repondre = useRepondreAccompagnement();
  const terminer = useTerminerAccompagnement();
  const reglages = useMajReglagesCoach();
  const resume = useMajResumeDirigeant();
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

  const onInviter = async (email: string) => {
    try {
      const r = await inviter.mutateAsync(email);
      toast.success(
        !r.emailEnvoye
          ? 'Invitation enregistrée, mais l’email n’a pas pu partir : prévenez la personne.'
          : r.aUnCompte
            ? 'Invitation envoyée : elle la retrouvera dans son compte Oskar.'
            : 'Invitation envoyée : elle l’attendra à la création de son compte.'
      );
      return true;
    } catch (e) {
      toast.error(message(e, 'L’invitation n’a pas pu être envoyée.'));
      return false;
    }
  };

  return (
    <AccompagnementShell
      titre="Mes dirigeants"
      sousTitre="Les dirigeants que vous accompagnez, ce qu’ils ont fait depuis votre dernière visite, et vos invitations."
    >
      {enCours ? (
        <Chargement />
      ) : !estCoach || !profil ? (
        <ReserveAuxCoachs />
      ) : error ? (
        <Erreur message={(error as Error).message} />
      ) : isLoading || !liste ? (
        <Chargement />
      ) : (
        <VueMesDirigeants
          liste={liste}
          profil={profil}
          onInviter={onInviter}
          onRepondre={(id, accepte) =>
            tenter(
              () => repondre.mutateAsync({ id, accepte }),
              accepte ? 'Demande acceptée : vous suivez désormais son travail.' : 'Demande refusée.',
              'La réponse n’a pas pu être enregistrée.'
            )
          }
          onTerminer={(id, annulation) =>
            tenter(
              () => terminer.mutateAsync(id),
              annulation ? 'Invitation annulée.' : 'Accompagnement terminé.',
              'L’opération n’a pas pu aboutir.'
            )
          }
          onReglages={(r) => tenter(() => reglages.mutateAsync(r), 'Réglage enregistré.', 'Le réglage n’a pas pu être enregistré.')}
          onResumeDirigeant={(id, v) =>
            tenter(
              () => resume.mutateAsync({ id, resume: v }),
              v ? 'Ajouté au résumé de 8 h.' : 'Retiré du résumé de 8 h.',
              'Le réglage n’a pas pu être enregistré.'
            )
          }
        />
      )}
    </AccompagnementShell>
  );
};

export default MesDirigeantsPage;
