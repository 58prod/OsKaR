import React, { useState } from 'react';
import Link from 'next/link';
import { Eye, Loader2 } from 'lucide-react';
import { Bandeau, Carte, TAG } from '@/components/admin/elements';
import { dateCourte, ilYA } from '@/lib/admin/formule';
import { emailValide, nomDe, rangerAccompagnements } from '@/lib/accompagnement/regles';
import type { Accompagnement } from '@/lib/accompagnement/types';
import {
  BOUTON_PRINCIPAL,
  BOUTON_RETRAIT,
  BOUTON_SECONDAIRE,
  BoutonAsync,
  CHAMP,
  CaseEngagement,
  CarteLien,
  LIBELLE,
  NOTE,
  TitreBloc,
  Vide,
} from './elements';

/*
 * « Mes coachs », côté dirigeant : les invitations reçues, les coachs qui
 * l'accompagnent, les demandes envoyées, et de quoi inviter son coach.
 * La transparence est annoncée en tête, puis acceptée case cochée à chaque
 * nouveau lien.
 */

interface Props {
  liste: Accompagnement[];
  /** Faux sans la formule Dirigeant (voir ACCOMPAGNEMENT_RESERVE_ABONNES). */
  peutRelier: boolean;
  onInviter: (email: string) => Promise<boolean>;
  onRepondre: (id: string, accepte: boolean) => Promise<boolean>;
  onTerminer: (id: string, annulation: boolean) => Promise<boolean>;
  maintenant?: Date;
}

export const VueMesCoachs: React.FC<Props> = ({ liste, peutRelier, onInviter, onRepondre, onTerminer, maintenant = new Date() }) => {
  const { aRepondre, actifs, envoyees } = rangerAccompagnements(liste, 'dirigeant');

  return (
    <>
      <Bandeau ton="teal" icone={<Eye aria-hidden />}>
        <strong className="text-navy">Transparence totale.</strong> Le coach qui vous accompagne voit tout ce que vous
        saisissez dans Oskar : ateliers Vision, Market Fit, Finance et Team, vos OKR et vos bilans. Il reçoit chaque
        matin un résumé de ce que vous avez modifié la veille. Vous pouvez mettre fin à l&rsquo;accompagnement à tout
        moment : son accès s&rsquo;arrête aussitôt.
      </Bandeau>

      <div className="grid gap-[22px] min-[1000px]:grid-cols-[minmax(0,1fr)_360px] items-start">
        <div className="min-w-0">
          {aRepondre.length > 0 && (
            <section className="mb-7">
              <TitreBloc nombre={aRepondre.length}>Invitations reçues</TitreBloc>
              <div className="grid gap-3">
                {aRepondre.map((a) => (
                  <InvitationRecue key={a.id} a={a} peutRelier={peutRelier} onRepondre={onRepondre} maintenant={maintenant} />
                ))}
              </div>
            </section>
          )}

          <section className="mb-7">
            <TitreBloc nombre={actifs.length}>Vos coachs</TitreBloc>
            {actifs.length === 0 ? (
              <Vide>
                Aucun coach ne vous accompagne pour l&rsquo;instant. Invitez le vôtre : il suivra votre travail sans que
                vous ayez à lui envoyer quoi que ce soit.
              </Vide>
            ) : (
              <div className="grid gap-3">
                {actifs.map((a) => (
                  <CarteLien
                    key={a.id}
                    nom={nomDe(a.autre)}
                    accent="teal"
                    lignes={
                      <>
                        {a.autre.structure && <>{a.autre.structure} · </>}
                        <a href={`mailto:${a.autre.email}`} className="hover:text-navy hover:underline underline-offset-2">
                          {a.autre.email}
                        </a>
                        <br />
                        Vous accompagne depuis le {dateCourte(a.reponduLe ?? a.creeLe)}
                      </>
                    }
                  >
                    <BoutonAsync
                      classe={BOUTON_RETRAIT}
                      libelle="Mettre fin"
                      confirmation={`Mettre fin à l’accompagnement de ${nomDe(a.autre)} ? Il ne verra plus votre travail et ne recevra plus de résumé.`}
                      action={() => onTerminer(a.id, false)}
                    />
                  </CarteLien>
                ))}
              </div>
            )}
          </section>

          {envoyees.length > 0 && (
            <section className="mb-7">
              <TitreBloc nombre={envoyees.length}>Demandes envoyées</TitreBloc>
              <div className="grid gap-3">
                {envoyees.map((a) => (
                  <CarteLien
                    key={a.id}
                    nom={nomDe(a.autre)}
                    lignes={
                      <>
                        {a.autre.structure && <>{a.autre.structure} · </>}
                        Demande envoyée {ilYA(a.creeLe, maintenant)}
                      </>
                    }
                  >
                    <span className={`${TAG} bg-surface text-muted border border-line`}>En attente de réponse</span>
                    <BoutonAsync
                      classe={BOUTON_SECONDAIRE}
                      libelle="Annuler"
                      confirmation={`Annuler votre demande à ${nomDe(a.autre)} ?`}
                      action={() => onTerminer(a.id, true)}
                    />
                  </CarteLien>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0">{peutRelier ? <InviterMonCoach onInviter={onInviter} /> : <FormuleRequise />}</aside>
      </div>
    </>
  );
};

const InvitationRecue: React.FC<{
  a: Accompagnement;
  peutRelier: boolean;
  onRepondre: Props['onRepondre'];
  maintenant: Date;
}> = ({ a, peutRelier, onRepondre, maintenant }) => {
  const [coche, setCoche] = useState(false);
  const nom = nomDe(a.autre);
  const refuser = (
    <BoutonAsync
      classe={BOUTON_SECONDAIRE}
      libelle="Refuser"
      confirmation={`Refuser l’invitation de ${nom} ?`}
      action={() => onRepondre(a.id, false)}
    />
  );

  return (
    <CarteLien
      nom={nom}
      accent="coral"
      lignes={
        <>
          {a.autre.structure && <>{a.autre.structure} · </>}
          {a.autre.email}
          <br />
          Vous propose de vous accompagner · {ilYA(a.creeLe, maintenant)}
        </>
      }
      bas={
        peutRelier ? (
          <>
            <CaseEngagement id={`engagement-${a.id}`} coche={coche} onChange={setCoche} />
            <div className="flex gap-2.5 flex-wrap mt-3.5">
              <BoutonAsync
                classe={BOUTON_PRINCIPAL}
                libelle="Accepter"
                disabled={!coche}
                action={() => onRepondre(a.id, true)}
              />
              {refuser}
            </div>
          </>
        ) : (
          <>
            <p className={`${NOTE} mb-3`}>
              Être accompagné sur Oskar fait partie de la formule Dirigeant.{' '}
              <Link href="/pricing" className="font-semibold text-navy hover:text-teal-dark">
                Voir les formules
              </Link>
            </p>
            {refuser}
          </>
        )
      }
    />
  );
};

const InviterMonCoach: React.FC<{ onInviter: Props['onInviter'] }> = ({ onInviter }) => {
  const [email, setEmail] = useState('');
  const [coche, setCoche] = useState(false);
  const [occupe, setOccupe] = useState(false);
  const pret = emailValide(email) && coche;

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pret) return;
    setOccupe(true);
    const ok = await onInviter(email.trim());
    setOccupe(false);
    if (ok) {
      setEmail('');
      setCoche(false);
    }
  };

  return (
    <Carte titre="Inviter mon coach" compacte>
      <form onSubmit={envoyer} noValidate>
        <label className={LIBELLE} htmlFor="email-coach">
          Adresse email de votre coach
        </label>
        <input
          id="email-coach"
          type="email"
          autoComplete="off"
          placeholder="prenom@cabinet.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${CHAMP} mb-3.5`}
        />
        <CaseEngagement id="engagement-invitation" coche={coche} onChange={setCoche} />
        <button type="submit" className={`${BOUTON_PRINCIPAL} mt-3.5 w-full justify-center`} disabled={!pret || occupe}>
          {occupe && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Envoyer la demande
        </button>
      </form>
      <p className={`${NOTE} mt-3.5`}>
        Votre coach doit être référencé par Oskar. Il reçoit votre demande par email et l&rsquo;accepte depuis son
        espace.{' '}
        <Link href="/coachs#annuaire" className="font-semibold text-navy hover:text-teal-dark">
          L&rsquo;annuaire des coachs
        </Link>
      </p>
    </Carte>
  );
};

const FormuleRequise: React.FC = () => (
  <Carte titre="Être accompagné" compacte>
    <p className="text-14.5 leading-[1.6] text-ink mb-4">
      Relier votre compte à votre coach fait partie de la formule Dirigeant : il suit votre travail au fil de
      l&rsquo;eau, et vos séances partent de là où vous en êtes.
    </p>
    <Link href="/pricing" className={BOUTON_PRINCIPAL}>
      Voir les formules
    </Link>
  </Carte>
);

export default VueMesCoachs;
