import React from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { BTN_OUTLINE } from '@/components/okr/okrFlux';
import { useAppStore } from '@/store/useAppStore';

/*
 * À propos — page institutionnelle (pas de maquette dans plateforme/).
 *
 * Voulue sobre par Christophe (2026-09-13) : rassurer entreprises et coachs
 * sur le sérieux de la plateforme, sans rien de commercial. Christophe exerce
 * aussi comme coach : pas de portrait, pas de téléphone, pas de références
 * clients.
 *
 * Les informations sur les données reprennent uniquement ce que disent déjà
 * les pages légales (src/pages/legal). Pas d'appel à useExemples() : aucune
 * phrase d'exemple métier sur cette page.
 */

const allerA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

const CARTE = 'bg-white border border-line shadow-card rounded-[16px] p-6 min-[600px]:p-8';

const TitreSection: React.FC<{ id?: string; children: React.ReactNode }> = ({ id, children }) => (
  <h2 id={id} className="text-19.5 font-bold text-navy mb-4 scroll-mt-20">
    {children}
  </h2>
);

const Coche: React.FC = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" className="shrink-0 w-[17px] h-[17px] mt-[3px] text-teal-dark" aria-hidden>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

const Liste: React.FC<{ lignes: React.ReactNode[] }> = ({ lignes }) => (
  <ul className="flex flex-col gap-3">
    {lignes.map((l, i) => (
      <li key={i} className="flex items-start gap-2.5 text-15 leading-[1.6] text-ink">
        <Coche />
        <span>{l}</span>
      </li>
    ))}
  </ul>
);

const PILIERS = [
  { nom: 'OSKAR Vision', texte: 'le cap de l’entreprise et ses valeurs', href: '/vision', puce: 'bg-vision' },
  { nom: 'OSKAR Market Fit', texte: 'l’adéquation entre l’offre et le marché', href: '/fit', puce: 'bg-fit' },
  { nom: 'OSKAR Finance', texte: 'les indicateurs financiers clés', href: '/finance', puce: 'bg-finance' },
  { nom: 'OSKAR OKR', texte: 'les objectifs et leur suivi', href: '/okr', puce: 'bg-okr' },
  { nom: 'OSKAR Team', texte: 'la santé et la cohésion des équipes', href: '/team', puce: 'bg-team' },
];

/** Fiche du responsable : libellé → valeur. */
const RESPONSABLE: { libelle: string; valeur: React.ReactNode }[] = [
  { libelle: 'Responsable', valeur: 'Christophe Grassi' },
  { libelle: 'Rôle', valeur: 'Conception de la méthode, pilotage de la plateforme et de son évolution' },
  {
    libelle: 'Expérience',
    valeur: 'Vingt-cinq ans en gestion de projet et de produit, dont dix consacrés à la productivité, aux processus et aux méthodes de travail',
  },
  { libelle: 'Précédemment', valeur: 'Delivery Manager d’un service public numérique utilisé par des millions de personnes' },
  { libelle: 'Implantation', valeur: 'Montpellier et Paris' },
  {
    libelle: 'Contact',
    valeur: (
      <a href="mailto:contact@oskar-coach.fr" className="font-semibold text-navy underline hover:text-teal-dark">
        contact@oskar-coach.fr
      </a>
    ),
  },
];

const LIENS_LEGAUX = [
  { href: '/legal/terms-of-service', libelle: 'Conditions générales d’utilisation' },
  { href: '/legal/privacy-policy', libelle: 'Politique de confidentialité' },
  { href: '/legal/gdpr', libelle: 'Vos droits RGPD' },
  { href: '/legal/cookies-policy', libelle: 'Politique cookies' },
];

export default function AboutPage() {
  const { authReady, isAuthenticated } = useAppStore();

  const topbarActions = (
    <>
      <button type="button" onClick={() => allerA('contact')} className={BTN_OUTLINE}>
        Contact
      </button>
      {authReady && isAuthenticated && <UserMenu />}
    </>
  );

  return (
    <AppShell
      title="À propos"
      description="Oskar est une méthode et une plateforme d’accompagnement des dirigeants, placée sous la responsabilité de Christophe Grassi. Qui la conçoit et comment vos données sont protégées."
      topbarTitle={
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-[10.5px] text-15 font-normal text-muted">
          <Link href="/" className="font-medium text-muted hover:text-navy transition-colors">
            Accueil
          </Link>
          <span className="text-line" aria-hidden>
            /
          </span>
          <span className="font-bold text-navy" aria-current="page">
            À propos
          </span>
        </nav>
      }
      topbarActions={topbarActions}
    >
      {/* ── En-tête ── */}
      <header className="border-l-[3px] border-navy pl-5 min-[600px]:pl-7 mt-2 mb-9">
        <p className="text-12.5 font-bold uppercase tracking-[1.8px] text-teal-dark mb-2.5">À propos</p>
        <h1 className="text-29 font-extrabold text-navy max-w-[720px] mb-3">
          Une méthode et une plateforme au service des dirigeants et de leurs équipes
        </h1>
        <p className="text-16.5 leading-[1.7] text-muted max-w-[720px]">
          Oskar aide les dirigeants de TPE et de PME à structurer leur pilotage : clarifier le cap, vérifier l’adéquation
          au marché, suivre les chiffres clés, fixer des objectifs et prendre soin des équipes. La plateforme s’utilise en
          autonomie ou avec l’appui d’un coach.
        </p>
      </header>

      {/* ── Ce qu'est Oskar ── */}
      <TitreSection>Ce qu’est Oskar</TitreSection>
      <div className="grid gap-5 mb-9 grid-cols-1 min-[1000px]:grid-cols-[1.1fr_0.9fr] items-start">
        <div className={CARTE}>
          <p className="text-15.5 leading-[1.7] text-muted mb-3">
            Oskar repose sur cinq piliers, travaillés dans des ateliers guidés. Chaque atelier aboutit à des décisions
            concrètes, conservées dans le compte de l’entreprise et reprises au fil des trimestres.
          </p>
          <p className="text-15.5 leading-[1.7] text-muted">
            Un diagnostic gratuit, sans inscription, indique par quel pilier commencer. Une boîte à outils d’équipe
            (rétrospective, météo, point quotidien…) est ouverte à tous, sans compte pour les collaborateurs invités.
          </p>
        </div>
        <ul className={`${CARTE} !p-0 overflow-hidden`}>
          {PILIERS.map((p) => (
            <li key={p.nom} className="border-b border-line last:border-b-0">
              <Link href={p.href} className="flex items-center gap-3.5 px-6 py-3.5 hover:bg-[#fafbff] transition-colors">
                <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.puce}`} aria-hidden />
                <span className="text-15 leading-[1.5]">
                  <strong className="font-bold text-navy">{p.nom}</strong> <span className="text-muted">— {p.texte}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </div>

      {/* ── Responsable ── */}
      <TitreSection>Qui est responsable d’Oskar</TitreSection>
      <div className={`${CARTE} mb-9`}>
        <dl className="grid grid-cols-1 min-[700px]:grid-cols-[190px_1fr] border-t border-line">
          {RESPONSABLE.map((r) => (
            <React.Fragment key={r.libelle}>
              <dt className="pt-3.5 min-[700px]:py-3.5 min-[700px]:border-b border-line text-12.5 font-bold uppercase tracking-[0.08em] text-muted">
                {r.libelle}
              </dt>
              <dd className="pb-3.5 pt-1 min-[700px]:py-3.5 border-b border-line text-15.5 leading-[1.6] text-ink">
                {r.valeur}
              </dd>
            </React.Fragment>
          ))}
        </dl>
      </div>

      {/* ── Données ── */}
      <TitreSection>Vos données</TitreSection>
      <div className="grid gap-5 mb-9 grid-cols-1 min-[1000px]:grid-cols-2 items-start">
        <div className={CARTE}>
          <Liste
            lignes={[
              'Les données sont hébergées sur Supabase (infrastructure AWS), chiffrées au repos et en transit.',
              'Les mots de passe sont hachés et ne sont jamais stockés en clair.',
              'Vos données ne sont jamais vendues à des tiers.',
              'Vous pouvez à tout moment consulter, rectifier ou supprimer vos données, conformément au RGPD.',
            ]}
          />
        </div>
        <div className={CARTE}>
          <p className="text-13 font-bold uppercase tracking-[0.08em] text-muted mb-3">Documents de référence</p>
          <ul className="flex flex-col">
            {LIENS_LEGAUX.map((l) => (
              <li key={l.href} className="border-b border-line last:border-b-0">
                <Link href={l.href} className="flex items-center justify-between gap-3 py-3 text-15 font-semibold text-navy hover:text-teal-dark transition-colors">
                  {l.libelle}
                  <span aria-hidden>→</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* ── Contact ── */}
      <TitreSection id="contact">Contact</TitreSection>
      <div className="grid gap-5 mb-10 grid-cols-1 min-[1000px]:grid-cols-3">
        <div className={CARTE}>
          <p className="text-16 font-bold text-navy mb-1.5">Questions générales</p>
          <p className="text-14.5 leading-[1.6] text-muted mb-3">Fonctionnement de la plateforme, formules, partenariats.</p>
          <a href="mailto:contact@oskar-coach.fr" className="text-15 font-semibold text-navy underline hover:text-teal-dark">
            contact@oskar-coach.fr
          </a>
        </div>
        <div className={CARTE}>
          <p className="text-16 font-bold text-navy mb-1.5">Données personnelles</p>
          <p className="text-14.5 leading-[1.6] text-muted mb-3">Accès, rectification ou suppression de vos données.</p>
          <a href="mailto:privacy@oskar-coach.fr" className="text-15 font-semibold text-navy underline hover:text-teal-dark">
            privacy@oskar-coach.fr
          </a>
        </div>
        <div className={CARTE}>
          <p className="text-16 font-bold text-navy mb-1.5">Coachs et consultants</p>
          <p className="text-14.5 leading-[1.6] text-muted mb-3">Conditions de référencement, kit et annuaire.</p>
          <Link href="/coachs" className="text-15 font-semibold text-navy underline hover:text-teal-dark">
            Espace coachs
          </Link>
        </div>
      </div>
    </AppShell>
  );
}
