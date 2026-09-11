import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { BTN_OUTLINE, BTN_PRIMARY } from '@/components/okr/okrFlux';
import { FormulaireDemande } from '@/components/tarifs/FormulaireDemande';
import { useAppStore } from '@/store/useAppStore';
import { ouvrirConnexion } from '@/store/useConnexion';
import { useSubscription } from '@/hooks/useSubscription';
import { niveauAcces } from '@/lib/acces';
import {
  PRIX_ANNUEL_HT,
  PRIX_MENSUEL_HT,
  euros,
  mensuelALAnnee,
  moisOfferts,
  ttc,
  type ObjetDemande,
  type Periode,
} from '@/lib/tarifs/formules';

/*
 * Tarifs — grille arrêtée par Christophe le 2026-09-11 (pas de maquette) :
 *   Gratuit · Dirigeant 39 € HT/mois ou 390 € HT/an par entreprise · Sur mesure
 *   (plusieurs comptes, réseaux et groupements).
 *
 * Remplace la page d'origine, qui lisait les plans Free / Pro / Team /
 * Unlimited de la table `subscription_plans` : les prix vivent désormais dans
 * src/lib/tarifs/formules.ts, et ce que chaque formule ouvre suit
 * src/lib/acces.ts. Sans Stripe, les boutons payants mènent au formulaire de
 * demande, en bas de page.
 *
 * Habillage de l'Espace coachs (bannière navy, cartes, FAQ, appel final), à
 * l'accent turquoise de la plateforme. Pas d'appel à useExemples() : aucune
 * phrase d'exemple métier sur cette page.
 */

const allerA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** `.btn-outline` posé sur fond navy. */
const BTN_BLANC =
  'inline-flex items-center gap-1.5 px-[18px] py-[10.5px] rounded-[10.5px] text-15.5 font-semibold bg-white/[0.08] text-white border-[1.5px] border-white/[0.28] transition-all hover:bg-white/[0.14]';

const TitreSection: React.FC<{ id?: string; droite?: React.ReactNode; children: React.ReactNode }> = ({
  id,
  droite,
  children,
}) => (
  <div id={id} className="flex items-center justify-between flex-wrap gap-4 mb-4 scroll-mt-20">
    <h2 className="text-19.5 font-bold text-navy">{children}</h2>
    {droite}
  </div>
);

const Coche: React.FC<{ className?: string }> = ({ className = 'w-[17px] h-[17px] text-teal-dark' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className={`shrink-0 ${className}`} aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const REPERES = [
  { valeur: euros(0), libelle: 'pour commencer' },
  { valeur: `${euros(PRIX_MENSUEL_HT)} HT`, libelle: 'par mois et par entreprise' },
  { valeur: euros(0), libelle: 'par collaborateur invité' },
];

/** Le détail formule par formule : vrai = inclus, faux = non, texte = précision. */
const COMPARAISON: { libelle: string; gratuit: boolean | string; dirigeant: boolean | string; surMesure: boolean | string }[] = [
  { libelle: 'Diagnostic et Potentiel Produit, bilan envoyé par email', gratuit: true, dirigeant: true, surMesure: true },
  { libelle: 'Boîte à outils d’équipe : rétro, météo, daily, récré…', gratuit: true, dirigeant: true, surMesure: true },
  { libelle: 'Collaborateurs invités par lien, sans compte', gratuit: 'Sans limite', dirigeant: 'Sans limite', surMesure: 'Sans limite' },
  { libelle: 'Bilans et travaux conservés dans votre compte', gratuit: true, dirigeant: true, surMesure: true },
  { libelle: 'Ateliers OSKAR Vision, Market Fit, Finance, OKR', gratuit: '1re étape de chaque atelier', dirigeant: 'Toutes les étapes', surMesure: 'Toutes les étapes' },
  { libelle: 'Comptes connectés', gratuit: '1', dirigeant: '1 par entreprise', surMesure: 'Plusieurs' },
  { libelle: 'Licence pour les adhérents d’un réseau', gratuit: false, dirigeant: false, surMesure: true },
  { libelle: 'Facturation', gratuit: false, dirigeant: 'Au mois ou à l’année', surMesure: 'Sur devis' },
];

const FAQ: { question: string; reponse: React.ReactNode }[] = [
  {
    question: 'Puis-je essayer avant de payer ?',
    reponse:
      'Oui. Le diagnostic et la boîte à outils se passent de compte. Avec un compte gratuit, vous faites en plus la première étape de chaque atelier : de quoi juger sur pièce avant de passer à la formule Dirigeant.',
  },
  {
    question: 'Mes collaborateurs doivent-ils payer ?',
    reponse:
      'Non, jamais. Votre équipe rejoint les outils par un lien, avec son prénom, sans créer de compte. La formule se prend une fois, pour l’entreprise.',
  },
  {
    question: 'Pourquoi des prix hors taxes ?',
    reponse: (
      <>
        Oskar s’adresse aux entreprises, qui récupèrent la TVA. Avec la TVA à 20 %, la formule Dirigeant revient à{' '}
        <strong>{euros(ttc(PRIX_MENSUEL_HT))} TTC par mois</strong>, ou <strong>{euros(ttc(PRIX_ANNUEL_HT))} TTC par an</strong>.
      </>
    ),
  },
  {
    question: 'Puis-je arrêter quand je veux ?',
    reponse:
      'Au mois, la formule est sans engagement : vous arrêtez à la fin du mois en cours. À l’année, elle est réglée pour douze mois. Dans les deux cas, votre compte repasse ensuite en gratuit sans rien effacer : vous retrouvez vos travaux si vous revenez.',
  },
  {
    question: 'Comment se passe le paiement ?',
    reponse:
      'Le paiement en ligne arrive bientôt. En attendant, vous faites votre demande avec le formulaire de cette page : nous vous recontactons pour activer la formule sur votre compte et vous envoyer la facture.',
  },
  {
    question: 'Qu’appelez-vous « plusieurs comptes » ?',
    reponse:
      'La formule Dirigeant donne un compte, celui du dirigeant. Si vos associés ou vos managers doivent eux aussi travailler dans les ateliers avec leur propre accès, nous établissons un tarif selon le nombre de comptes.',
  },
  {
    question: 'Nous sommes un réseau, une fédération, une chambre consulaire…',
    reponse:
      'Une licence vous permet d’offrir Oskar à vos adhérents : chacun dispose de la formule Dirigeant pour son entreprise. Le tarif dépend du nombre d’adhérents concernés ; décrivez-nous votre projet dans le formulaire.',
  },
  {
    question: 'Je suis coach ou consultant : quelles conditions ?',
    reponse: (
      <>
        Elles sont présentées dans l’<Link href="/coachs" className="font-semibold text-navy underline hover:text-teal-dark">Espace coachs</Link>,
        où vous pouvez aussi rejoindre l’annuaire et récupérer le kit de présentation.
      </>
    ),
  },
];

const CARTE = 'bg-white border shadow-card rounded-[16px] p-6 flex flex-col relative';

export default function TarifsPage() {
  const { user, authReady, isAuthenticated } = useAppStore();
  const { data: abonnement } = useSubscription(user?.id);
  const niveau = niveauAcces(authReady && isAuthenticated, abonnement);
  const [periode, setPeriode] = useState<Periode>('mensuel');
  const [objet, setObjet] = useState<ObjetDemande>('mensuel');
  const [question, setQuestion] = useState<number | null>(null);

  const demander = (o: ObjetDemande) => {
    setObjet(o);
    allerA('demande');
  };

  const annuel = periode === 'annuel';

  const topbarActions = (
    <>
      <button type="button" onClick={() => allerA('detail')} className={`${BTN_OUTLINE} max-sm:hidden`}>
        Comparer
      </button>
      <button type="button" onClick={() => demander(periode)} className={BTN_PRIMARY}>
        Demander la formule →
      </button>
      {authReady && isAuthenticated && <UserMenu />}
    </>
  );

  const Badge: React.FC<{ children: React.ReactNode; ton?: 'teal' | 'navy' }> = ({ children, ton = 'teal' }) => (
    <span
      className={`absolute -top-3 left-6 text-11.5 font-bold uppercase tracking-[0.06em] px-2.5 py-[3px] rounded-[20px] ${
        ton === 'teal' ? 'bg-teal text-navy-dark' : 'bg-navy text-white'
      }`}
    >
      {children}
    </span>
  );

  const Inclus: React.FC<{ titre?: string; lignes: React.ReactNode[] }> = ({ titre, lignes }) => (
    <div className="border-t border-line pt-4 mt-5">
      {titre && <p className="text-13 font-bold text-navy mb-2.5">{titre}</p>}
      <ul className="flex flex-col gap-2.5">
        {lignes.map((l, i) => (
          <li key={i} className="flex items-start gap-2.5 text-14.5 leading-[1.5] text-ink">
            <Coche className="w-[17px] h-[17px] mt-[2px] text-teal-dark" />
            <span>{l}</span>
          </li>
        ))}
      </ul>
    </div>
  );

  const PLEINE = '!w-full justify-center';

  return (
    <AppShell
      title="Tarifs"
      description="Oskar est gratuit pour commencer. La formule Dirigeant ouvre tous les ateliers pour 39 € HT par mois et par entreprise."
      topbarTitle={
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-[10.5px] text-15 font-normal text-muted">
          <Link href="/" className="font-medium text-muted hover:text-navy transition-colors">
            Accueil
          </Link>
          <span className="text-line" aria-hidden>
            /
          </span>
          <span className="font-bold text-navy" aria-current="page">
            Tarifs
          </span>
        </nav>
      }
      topbarActions={topbarActions}
    >
      {/* ── Bannière ── */}
      <section className="relative overflow-hidden rounded-[18.5px] px-5 py-[27.5px] min-[600px]:px-12 min-[600px]:py-[53px] mb-8 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
        <span
          className="absolute -right-[60px] -top-[60px] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(0,212,180,0.22)_0%,transparent_70%)]"
          aria-hidden
        />
        <span
          className="absolute right-20 -bottom-10 w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(0,212,180,0.12)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative">
          <p className="text-12.5 font-bold uppercase tracking-[1.8px] text-teal mb-2.5">Tarifs</p>
          <h1 className="text-32 font-extrabold text-white max-w-[540px] mb-3">
            Commencez gratuitement.
            <br />
            Passez à la suite quand vous êtes <span className="text-teal">prêt</span>.
          </h1>
          <p className="text-16.5 leading-[1.7] text-white/70 max-w-[480px] mb-6">
            Le diagnostic et la boîte à outils d’équipe sont gratuits, sans compte. La formule Dirigeant ouvre tous les
            ateliers pour votre entreprise — et votre équipe vous rejoint sans rien payer.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <button type="button" onClick={() => allerA('formules')} className={BTN_PRIMARY}>
              Voir les formules →
            </button>
            <Link href="/diagnostic" className={BTN_BLANC}>
              Faire le diagnostic gratuit
            </Link>
          </div>
        </div>
        {/* Masqués quand la bannière n'a plus la place de les poser à côté du titre. */}
        <ul className="hidden min-[1080px]:flex flex-col gap-4 absolute right-12 top-1/2 -translate-y-1/2 z-[1]">
          {REPERES.map((r) => (
            <li
              key={r.libelle}
              className="bg-white/[0.07] border border-white/[0.12] rounded-[11.5px] px-[18px] py-3.5 text-center min-w-[200px]"
            >
              <p className="text-25.5 leading-none font-extrabold text-teal">{r.valeur}</p>
              <p className="text-12.5 text-white/55 mt-1">{r.libelle}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Formules ── */}
      <TitreSection
        id="formules"
        droite={
          <div role="radiogroup" aria-label="Période de facturation" className="inline-flex bg-white border border-line rounded-[11px] p-1">
            {(
              [
                { id: 'mensuel', libelle: 'Au mois' },
                { id: 'annuel', libelle: 'À l’année' },
              ] as { id: Periode; libelle: string }[]
            ).map((p) => {
              const actif = periode === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  role="radio"
                  aria-checked={actif}
                  onClick={() => setPeriode(p.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-[8px] text-14 font-semibold transition-colors ${
                    actif ? 'bg-navy text-white' : 'text-muted hover:text-navy'
                  }`}
                >
                  {p.libelle}
                  {p.id === 'annuel' && (
                    <span
                      className={`text-11.5 font-bold px-2 py-px rounded-[20px] ${
                        actif ? 'bg-teal text-navy-dark' : 'bg-teal-light text-teal-dark'
                      }`}
                    >
                      {moisOfferts()} mois offerts
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        }
      >
        Trois formules, sans surprise
      </TitreSection>

      <div className="grid gap-5 mb-4 pt-3 grid-cols-1 min-[1000px]:grid-cols-3 items-stretch">
        {/* Gratuit */}
        <div className={`${CARTE} ${niveau === 'gratuit' ? 'border-navy/40' : 'border-line'}`}>
          {niveau === 'gratuit' && <Badge ton="navy">Votre formule</Badge>}
          <h3 className="text-20.5 font-extrabold text-navy">Gratuit</h3>
          <p className="text-14.5 text-muted mb-5">Pour découvrir la méthode et embarquer l’équipe.</p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-[40px] leading-none font-extrabold text-navy">{euros(0)}</span>
          </p>
          <p className="text-13.5 text-muted mt-2 mb-5">Pour toujours · sans carte bancaire</p>
          {niveau === 'visiteur' ? (
            <button type="button" onClick={() => ouvrirConnexion('register')} className={`${BTN_OUTLINE} ${PLEINE}`}>
              Créer mon compte gratuit
            </button>
          ) : (
            <Link href="/app/okr" className={`${BTN_OUTLINE} ${PLEINE}`}>
              Continuer mes ateliers
            </Link>
          )}
          <Inclus
            lignes={[
              'Le Diagnostic et le Potentiel Produit, bilan envoyé par email',
              'La boîte à outils d’équipe, sans limite',
              'Vos bilans et vos travaux conservés dans votre compte',
              'La première étape de chaque atelier',
            ]}
          />
        </div>

        {/* Dirigeant */}
        <div className={`${CARTE} border-2 border-teal shadow-card-hover`}>
          <Badge>{niveau === 'abonne' ? 'Votre formule' : 'Tous les ateliers'}</Badge>
          <h3 className="text-20.5 font-extrabold text-navy">Dirigeant</h3>
          <p className="text-14.5 text-muted mb-5">Pour avancer sur les 5 piliers de votre entreprise.</p>
          <p className="flex items-baseline flex-wrap gap-x-1.5">
            <span className="text-[40px] leading-none font-extrabold text-navy">
              {euros(annuel ? PRIX_ANNUEL_HT : PRIX_MENSUEL_HT)}
            </span>
            <span className="text-15.5 font-semibold text-muted">HT {annuel ? '/ an' : '/ mois'}</span>
          </p>
          <p className="text-13.5 text-muted mt-2 mb-5">
            {annuel
              ? `Soit ${euros(mensuelALAnnee())} HT par mois · ${moisOfferts()} mois offerts`
              : `Soit ${euros(ttc(PRIX_MENSUEL_HT))} TTC · sans engagement`}
          </p>
          {niveau === 'abonne' ? (
            <button type="button" disabled className={`${BTN_PRIMARY} ${PLEINE} opacity-60 pointer-events-none`}>
              Formule active
            </button>
          ) : (
            <button type="button" onClick={() => demander(periode)} className={`${BTN_PRIMARY} ${PLEINE}`}>
              Demander la formule →
            </button>
          )}
          <Inclus
            titre="Tout le gratuit, et en plus :"
            lignes={[
              <>
                <strong className="font-bold text-navy">Toutes les étapes</strong> des ateliers Vision, Market Fit,
                Finance et OKR
              </>,
              'Les ateliers Team dès leur ouverture, sans supplément',
              'Votre équipe invitée gratuitement, sans limite',
              'Un compte dirigeant, facturé à l’entreprise',
            ]}
          />
        </div>

        {/* Sur mesure */}
        <div className={`${CARTE} border-line`}>
          <h3 className="text-20.5 font-extrabold text-navy">Sur mesure</h3>
          <p className="text-14.5 text-muted mb-5">Pour plusieurs comptes, ou pour tout un réseau.</p>
          <p className="flex items-baseline gap-1.5">
            <span className="text-[40px] leading-none font-extrabold text-navy">Sur devis</span>
          </p>
          <p className="text-13.5 text-muted mt-2 mb-5">Selon le nombre de comptes ou d’adhérents</p>
          <button type="button" onClick={() => demander('plusieurs_comptes')} className={`${BTN_OUTLINE} ${PLEINE}`}>
            Nous contacter →
          </button>
          <Inclus
            titre="Tout ce que comprend la formule Dirigeant, et :"
            lignes={[
              <>
                <strong className="font-bold text-navy">Plusieurs comptes</strong> pour une même entreprise : associés,
                managers
              </>,
              <>
                <strong className="font-bold text-navy">Une licence réseau</strong> pour offrir Oskar aux adhérents
                d’un groupement, d’une fédération, d’une CCI…
              </>,
              'Un tarif établi avec vous',
            ]}
          />
        </div>
      </div>
      <p className="text-13.5 text-muted mb-9">
        Prix hors taxes, TVA 20 % en sus.{' '}
        {annuel
          ? `À l’année : ${euros(PRIX_ANNUEL_HT)} HT, soit ${euros(ttc(PRIX_ANNUEL_HT))} TTC.`
          : `Au mois : ${euros(PRIX_MENSUEL_HT)} HT, soit ${euros(ttc(PRIX_MENSUEL_HT))} TTC.`}
      </p>

      {/* ── Détail ── */}
      <TitreSection id="detail">Le détail, formule par formule</TitreSection>
      <div className="bg-white border border-line rounded-card shadow-card overflow-x-auto mb-9">
        <table className="w-full min-w-[640px] border-collapse">
          <thead className="bg-[#f7f8fd]">
            <tr>
              {['', 'Gratuit', 'Dirigeant', 'Sur mesure'].map((t, i) => (
                <th
                  key={t || 'ligne'}
                  className={`text-11.5 font-bold uppercase tracking-[0.09em] px-[18px] py-3.5 border-b border-line ${
                    i === 0 ? 'text-left text-muted' : 'text-center'
                  } ${i === 2 ? 'text-teal-dark' : i > 0 ? 'text-muted' : ''}`}
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {COMPARAISON.map((l) => (
              <tr key={l.libelle} className="hover:bg-[#fafbff]">
                <td className="px-[18px] py-3.5 border-b border-line text-14.5 font-medium text-ink">{l.libelle}</td>
                {[l.gratuit, l.dirigeant, l.surMesure].map((v, i) => (
                  <td
                    key={i}
                    className={`px-[18px] py-3.5 border-b border-line text-center text-14 ${i === 1 ? 'bg-teal-light/40' : ''}`}
                  >
                    {v === true ? (
                      <Coche className="w-[18px] h-[18px] text-teal-dark mx-auto" />
                    ) : v === false ? (
                      <span className="text-line font-bold" aria-label="Non inclus">
                        —
                      </span>
                    ) : (
                      <span className="text-muted font-medium">{v}</span>
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Coachs ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-coral-light border border-coral/50 rounded-[14px] px-6 py-5 mb-9">
        <div>
          <p className="text-16 font-bold text-navy">Vous accompagnez des dirigeants ?</p>
          <p className="text-14.5 text-muted">
            Coachs, consultants, experts-comptables : l’Espace coachs vous présente la méthode, le kit et l’annuaire.
          </p>
        </div>
        <Link href="/coachs" className="text-14.5 font-bold text-coral-dark hover:underline whitespace-nowrap">
          Découvrir l’Espace coachs →
        </Link>
      </div>

      {/* ── Demande ── */}
      <FormulaireDemande objet={objet} onObjet={setObjet} />

      {/* ── Questions ── */}
      <TitreSection>Les questions que vous vous posez</TitreSection>
      <div className="mb-9">
        {FAQ.map((q, i) => {
          const ouverte = question === i;
          return (
            <div
              key={q.question}
              className={`bg-white border rounded-xl mb-2.5 overflow-hidden transition-colors ${
                ouverte ? 'border-[#c8ccec]' : 'border-line'
              }`}
            >
              <h3>
                <button
                  type="button"
                  aria-expanded={ouverte}
                  aria-controls={`faq-${i}`}
                  onClick={() => setQuestion(ouverte ? null : i)}
                  className="w-full flex items-center justify-between gap-3.5 px-5 py-4 text-left text-16 font-bold text-navy hover:bg-[#fafbff]"
                >
                  {q.question}
                  <span
                    aria-hidden
                    className={`w-[9px] h-[9px] shrink-0 border-r-2 border-b-2 border-muted transition-transform duration-200 ${
                      ouverte ? '[transform:rotate(-135deg)_translate(-2px,-2px)]' : '[transform:rotate(45deg)_translate(-2px,-2px)]'
                    }`}
                  />
                </button>
              </h3>
              {ouverte && (
                <div id={`faq-${i}`} className="px-5 pb-[18px] text-15 leading-[1.7] text-muted [&_strong]:font-bold [&_strong]:text-navy">
                  {q.reponse}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Appel final ── */}
      <div className="relative overflow-hidden text-center rounded-[18.5px] px-5 min-[600px]:px-10 py-[41.5px] mb-10 bg-[linear-gradient(135deg,#151f5e,#1e2d7d)]">
        <span
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(0,212,180,0.16)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative z-[1]">
          <p className="text-12.5 font-bold uppercase tracking-[1.8px] text-teal mb-2.5">Le bon point de départ</p>
          <h2 className="text-27.5 font-extrabold text-white mb-2.5">Dix minutes pour savoir où vous en êtes.</h2>
          <p className="text-16 text-white/65 max-w-[520px] mx-auto mb-6">
            Le diagnostic est gratuit et sans inscription. Il vous dit quel pilier travailler en premier.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Link href="/diagnostic" className={`${BTN_PRIMARY} !px-7 !py-3.5 !text-17`}>
              Démarrer le diagnostic →
            </Link>
            {niveau === 'visiteur' && (
              <button type="button" onClick={() => ouvrirConnexion('register')} className={`${BTN_BLANC} !px-7 !py-3.5 !text-17`}>
                Créer mon compte gratuit
              </button>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
