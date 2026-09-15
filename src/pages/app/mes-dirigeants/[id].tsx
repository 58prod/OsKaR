import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AccompagnementShell } from '@/components/accompagnement/AccompagnementShell';
import { LectureDirigeant } from '@/components/accompagnement/LectureDirigeant';
import { ReserveAuxCoachs } from '@/components/accompagnement/elements';
import { Chargement, Erreur } from '@/components/admin/elements';
import {
  useFicheDirigeant,
  useMajResumeDirigeant,
  useProfilCoach,
  useTerminerAccompagnement,
} from '@/hooks/useAccompagnements';
import { useToast } from '@/hooks/useToast';
import { nomDe } from '@/lib/accompagnement/regles';

/*
 * La fiche d'un dirigeant, lue par son coach : tout ce qu'il a saisi, en
 * lecture seule. L'ouvrir note la visite (repère des nouveautés).
 */

const message = (e: unknown, defaut: string) => (e instanceof Error && e.message ? e.message : defaut);

const FicheDirigeantPage: React.FC = () => {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : undefined;
  const { estCoach, enCours } = useProfilCoach();
  const { data: fiche, error, isPending } = useFicheDirigeant(estCoach ? id : undefined);
  const terminer = useTerminerAccompagnement();
  const resume = useMajResumeDirigeant();
  const toast = useToast();
  const nom = fiche ? nomDe(fiche.profil) : null;

  return (
    <AccompagnementShell
      titre={nom ?? 'Fiche dirigeant'}
      sansEntete
      fil={
        <>
          <Link href="/app/mes-dirigeants" className="text-muted hover:text-navy">
            Mes dirigeants
          </Link>
          <span className="text-line mx-2">/</span>
          <span className="text-navy font-bold">{nom ?? '…'}</span>
        </>
      }
    >
      <Link href="/app/mes-dirigeants" className="inline-flex items-center gap-1.5 text-14 font-semibold text-muted hover:text-navy mb-4">
        ← Mes dirigeants
      </Link>
      {enCours || !router.isReady || (estCoach && isPending) ? (
        <Chargement />
      ) : !estCoach ? (
        <ReserveAuxCoachs />
      ) : error ? (
        <Erreur message={(error as Error).message} />
      ) : !fiche ? (
        <div className="max-w-[560px] bg-white border border-line rounded-card shadow-card p-[27.5px] text-15 text-muted leading-[1.6]">
          <strong className="block text-navy text-[17px] mb-1">Fiche indisponible</strong>
          Vous n&rsquo;accompagnez pas, ou plus, ce dirigeant : son travail n&rsquo;est visible que tant qu&rsquo;il vous en
          donne l&rsquo;accès.
        </div>
      ) : (
        <LectureDirigeant
          fiche={fiche}
          onResume={async (v) => {
            try {
              await resume.mutateAsync({ id: fiche.accompagnementId, resume: v });
              toast.success(v ? 'Ajouté au résumé de 8 h.' : 'Retiré du résumé de 8 h.');
              return true;
            } catch (e) {
              toast.error(message(e, 'Le réglage n’a pas pu être enregistré.'));
              return false;
            }
          }}
          onTerminer={async () => {
            try {
              await terminer.mutateAsync(fiche.accompagnementId);
              toast.success('Accompagnement terminé.');
              router.push('/app/mes-dirigeants');
              return true;
            } catch (e) {
              toast.error(message(e, 'L’opération n’a pas pu aboutir.'));
              return false;
            }
          }}
        />
      )}
    </AccompagnementShell>
  );
};

export default FicheDirigeantPage;
