import React, { useState } from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { CadreTableau, Carte, Kpi, TAG, TD, TH, pluriel } from '@/components/admin/elements';
import { ilYA } from '@/lib/admin/formule';
import { derniereActivite, emailValide, nomDe, rangerAccompagnements, sujetsNouveaux } from '@/lib/accompagnement/regles';
import type { Accompagnement, ProfilCoach } from '@/lib/accompagnement/types';
import {
  BOUTON_PRINCIPAL,
  BOUTON_SECONDAIRE,
  BoutonAsync,
  CHAMP,
  CarteLien,
  Interrupteur,
  LIBELLE,
  NOTE,
  PastillesSuivi,
  ReglagesCoach,
  TitreBloc,
  Vide,
} from './elements';

/*
 * « Mes dirigeants », côté coach référencé : trois chiffres, les demandes
 * reçues, le tableau des dirigeants suivis (pastilles par pilier, cerclées
 * quand quelque chose a bougé depuis la dernière visite), les invitations en
 * attente ; à droite, inviter et régler disponibilité et résumé de 8 h.
 */

interface Props {
  liste: Accompagnement[];
  profil: ProfilCoach;
  onInviter: (email: string) => Promise<boolean>;
  onRepondre: (id: string, accepte: boolean) => Promise<boolean>;
  onTerminer: (id: string, annulation: boolean) => Promise<boolean>;
  onReglages: (r: { disponible?: boolean; resumeQuotidien?: boolean }) => Promise<boolean>;
  onResumeDirigeant: (id: string, resume: boolean) => Promise<boolean>;
  maintenant?: Date;
}

export const VueMesDirigeants: React.FC<Props> = ({
  liste,
  profil,
  onInviter,
  onRepondre,
  onTerminer,
  onReglages,
  onResumeDirigeant,
  maintenant = new Date(),
}) => {
  const { aRepondre, actifs, envoyees } = rangerAccompagnements(liste, 'coach');
  const avances = actifs.filter((a) => sujetsNouveaux(a.activite, a.coachVuLe).length > 0).length;

  return (
    <>
      <div className="grid gap-3.5 grid-cols-1 min-[760px]:grid-cols-3 mb-[26px]">
        <Kpi libelle="Dirigeants suivis" valeur={actifs.length} couleur="bg-teal">
          {envoyees.length ? `+ ${pluriel(envoyees.length, 'invitation')} en attente` : 'Aucune invitation en attente'}
        </Kpi>
        <Kpi libelle="Ont avancé" valeur={avances} couleur="bg-coral">
          depuis votre dernière visite
        </Kpi>
        <Kpi libelle="Demandes à traiter" valeur={aRepondre.length} couleur="bg-navy-light">
          {profil.disponible ? 'Vous acceptez de nouvelles demandes' : 'Vous ne prenez plus de demande'}
        </Kpi>
      </div>

      <div className="grid gap-[22px] min-[1100px]:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          {aRepondre.length > 0 && (
            <section className="mb-7">
              <TitreBloc nombre={aRepondre.length}>Demandes reçues</TitreBloc>
              <div className="grid gap-3">
                {aRepondre.map((a) => (
                  <CarteLien
                    key={a.id}
                    nom={nomDe(a.autre)}
                    accent="coral"
                    lignes={
                      <>
                        {a.autre.entreprise && <>{a.autre.entreprise} · </>}
                        {a.autre.email}
                        <br />
                        Vous demande de l&rsquo;accompagner · {ilYA(a.creeLe, maintenant)}
                      </>
                    }
                    bas={
                      <>
                        <p className={`${NOTE} mb-3`}>
                          En acceptant, vous verrez tout ce que cette personne saisit dans Oskar ; elle l&rsquo;a déjà
                          accepté en vous écrivant.
                        </p>
                        <div className="flex gap-2.5 flex-wrap">
                          <BoutonAsync classe={BOUTON_PRINCIPAL} libelle="Accepter" action={() => onRepondre(a.id, true)} />
                          <BoutonAsync
                            classe={BOUTON_SECONDAIRE}
                            libelle="Refuser"
                            confirmation={`Refuser la demande de ${nomDe(a.autre)} ?`}
                            action={() => onRepondre(a.id, false)}
                          />
                        </div>
                      </>
                    }
                  />
                ))}
              </div>
            </section>
          )}

          <section className="mb-7">
            <TitreBloc nombre={actifs.length}>Vos dirigeants</TitreBloc>
            {actifs.length === 0 ? (
              <Vide>
                Aucun dirigeant pour l&rsquo;instant. Invitez ceux que vous accompagnez : dès qu&rsquo;ils acceptent,
                vous suivez leur travail d&rsquo;ici, et le résumé de 8 h vous dit qui a avancé.
              </Vide>
            ) : (
              <CadreTableau
                pied={
                  <>
                    <span>Pastilles : Vision, Market Fit, Finance, OKR, Team, bilans.</span>
                    <span className="inline-flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-line ring-2 ring-coral ring-offset-[1.5px]" aria-hidden />
                      a bougé depuis votre dernière visite
                    </span>
                  </>
                }
              >
                <table className="w-full border-collapse text-14.5 min-w-[680px]">
                  <thead>
                    <tr>
                      <th className={TH}>Dirigeant</th>
                      <th className={TH}>Suivi</th>
                      <th className={TH}>Dernière activité</th>
                      <th className={TH}>Résumé 8 h</th>
                      <th className={TH}>
                        <span className="sr-only">Fiche</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {actifs.map((a) => {
                      const nom = nomDe(a.autre);
                      const href = `/app/mes-dirigeants/${a.autre.id}`;
                      const derniere = derniereActivite(a.activite);
                      const neuf = sujetsNouveaux(a.activite, a.coachVuLe).length > 0;
                      return (
                        <tr key={a.id}>
                          <td className={TD}>
                            <Link href={href} className="font-bold text-navy hover:text-teal-dark">
                              {nom}
                            </Link>
                            {neuf && <span className={`${TAG} bg-coral-light text-coral-dark ml-2 align-middle`}>Nouveau</span>}
                            <div className="text-13 text-muted">
                              {[a.autre.entreprise, a.autre.activite].filter(Boolean).join(' · ') || a.autre.email}
                            </div>
                          </td>
                          <td className={TD}>
                            <PastillesSuivi activite={a.activite} vuLe={a.coachVuLe} maintenant={maintenant} />
                          </td>
                          <td className={`${TD} text-13.5 text-muted whitespace-nowrap`}>
                            {derniere ? ilYA(derniere, maintenant) : 'Rien encore'}
                          </td>
                          <td className={TD}>
                            <Interrupteur
                              compact
                              id={`resume-${a.id}`}
                              actif={a.resumeQuotidien}
                              libelle={`${nom} dans le résumé de 8 h`}
                              onChange={(v) => onResumeDirigeant(a.id, v)}
                            />
                          </td>
                          <td className={`${TD} text-right whitespace-nowrap`}>
                            <Link href={href} className={BOUTON_SECONDAIRE}>
                              Voir la fiche →
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CadreTableau>
            )}
          </section>

          {envoyees.length > 0 && (
            <section className="mb-7">
              <TitreBloc nombre={envoyees.length}>Invitations envoyées</TitreBloc>
              <div className="grid gap-3">
                {envoyees.map((a) => (
                  <CarteLien
                    key={a.id}
                    nom={nomDe(a.autre)}
                    lignes={
                      <>
                        {a.autre.id ? 'A un compte Oskar' : 'Pas encore de compte Oskar'} · envoyée{' '}
                        {ilYA(a.creeLe, maintenant)}
                      </>
                    }
                  >
                    <span className={`${TAG} bg-surface text-muted border border-line`}>En attente de réponse</span>
                    <BoutonAsync
                      classe={BOUTON_SECONDAIRE}
                      libelle="Annuler"
                      confirmation={`Annuler l’invitation envoyée à ${nomDe(a.autre)} ?`}
                      action={() => onTerminer(a.id, true)}
                    />
                  </CarteLien>
                ))}
              </div>
            </section>
          )}
        </div>

        <aside className="min-w-0 grid gap-3.5">
          <InviterDirigeant onInviter={onInviter} />
          <div id="reglages" className="scroll-mt-24">
            <ReglagesCoach profil={profil} onReglages={onReglages} />
          </div>
        </aside>
      </div>
    </>
  );
};

const InviterDirigeant: React.FC<{ onInviter: Props['onInviter'] }> = ({ onInviter }) => {
  const [email, setEmail] = useState('');
  const [occupe, setOccupe] = useState(false);
  const pret = emailValide(email);

  const envoyer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pret) return;
    setOccupe(true);
    const ok = await onInviter(email.trim());
    setOccupe(false);
    if (ok) setEmail('');
  };

  return (
    <Carte titre="Inviter un dirigeant" compacte>
      <form onSubmit={envoyer} noValidate>
        <label className={LIBELLE} htmlFor="email-dirigeant">
          Adresse email du dirigeant
        </label>
        <input
          id="email-dirigeant"
          type="email"
          autoComplete="off"
          placeholder="prenom@entreprise.fr"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={`${CHAMP} mb-3.5`}
        />
        <button type="submit" className={`${BOUTON_PRINCIPAL} w-full justify-center`} disabled={!pret || occupe}>
          {occupe && <Loader2 className="h-4 w-4 animate-spin" aria-hidden />}
          Envoyer l&rsquo;invitation
        </button>
      </form>
      <p className={`${NOTE} mt-3.5`}>
        Il reçoit un email et accepte depuis son compte Oskar — ou en le créant, s&rsquo;il n&rsquo;en a pas encore. En
        acceptant, il vous ouvre tout son travail.
      </p>
    </Carte>
  );
};

export default VueMesDirigeants;
