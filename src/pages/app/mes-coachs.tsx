import React from 'react';
import { AccompagnementShell } from '@/components/accompagnement/AccompagnementShell';
import { VueMesCoachs } from '@/components/accompagnement/VueMesCoachs';
import { Chargement, Erreur } from '@/components/admin/elements';
import { useAppStore } from '@/store/useAppStore';
import { useSubscription } from '@/hooks/useSubscription';
import {
  useInviterCoach,
  useMesAccompagnements,
  useRepondreAccompagnement,
  useTerminerAccompagnement,
} from '@/hooks/useAccompagnements';
import { useToast } from '@/hooks/useToast';
import { niveauAcces } from '@/lib/acces';
import { peutEtreAccompagne } from '@/lib/accompagnement/regles';

/*
 * « Mes coachs » : le dirigeant relie son compte au coach qui l'accompagne,
 * accepte ou refuse les invitations, et peut mettre fin à tout moment.
 */

const message = (e: unknown, defaut: string) => (e instanceof Error && e.message ? e.message : defaut);

const MesCoachsPage: React.FC = () => {
  const { user, isAuthenticated } = useAppStore();
  const { data: abonnement } = useSubscription(isAuthenticated ? user?.id : undefined);
  const { data: liste, error, isLoading } = useMesAccompagnements();
  const inviter = useInviterCoach();
  const repondre = useRepondreAccompagnement();
  const terminer = useTerminerAccompagnement();
  const toast = useToast();

  const onInviter = async (email: string) => {
    try {
      const r = await inviter.mutateAsync(email);
      toast.success(
        r.emailEnvoye
          ? 'Demande envoyée : votre coach est prévenu par email.'
          : 'Demande enregistrée. L’email n’a pas pu partir : prévenez votre coach, il la trouvera dans son espace.'
      );
      return true;
    } catch (e) {
      toast.error(message(e, 'La demande n’a pas pu être envoyée.'));
      return false;
    }
  };

  const onRepondre = async (id: string, accepte: boolean) => {
    try {
      await repondre.mutateAsync({ id, accepte });
      toast.success(accepte ? 'C’est fait : votre coach suit désormais votre travail.' : 'Invitation refusée.');
      return true;
    } catch (e) {
      toast.error(message(e, 'La réponse n’a pas pu être enregistrée.'));
      return false;
    }
  };

  const onTerminer = async (id: string, annulation: boolean) => {
    try {
      await terminer.mutateAsync(id);
      toast.success(annulation ? 'Demande annulée.' : 'Accompagnement terminé : ce coach n’a plus accès à votre travail.');
      return true;
    } catch (e) {
      toast.error(message(e, 'L’opération n’a pas pu aboutir.'));
      return false;
    }
  };

  return (
    <AccompagnementShell
      titre="Mes coachs"
      sousTitre="Reliez votre compte au coach qui vous accompagne : il suit votre travail sur Oskar au fil de l’eau, sans que vous ayez à lui envoyer quoi que ce soit."
    >
      {error ? (
        <Erreur message={(error as Error).message} />
      ) : isLoading || !liste ? (
        <Chargement />
      ) : (
        <VueMesCoachs
          liste={liste}
          peutRelier={peutEtreAccompagne(niveauAcces(isAuthenticated, abonnement))}
          onInviter={onInviter}
          onRepondre={onRepondre}
          onTerminer={onTerminer}
        />
      )}
    </AccompagnementShell>
  );
};

export default MesCoachsPage;
