import React, { useState } from 'react';
import Link from 'next/link';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { BTN_OUTLINE } from '@/components/okr/okrFlux';
import { FormulaireCandidature } from '@/components/coachs/FormulaireCandidature';
import { useAppStore } from '@/store/useAppStore';

/*
 * Espace coachs & consultants — transposition de `plateforme/coachs.html`.
 * Page libre, sans compte. L'accent de la page est le corail (`.coach-space`
 * dans oskar.css) : boutons, surtitres, halos de la bannière, liens.
 *
 * Valeurs relevées sur la maquette servie (1400 px) :
 *   bannière   dégradé navy, rayon 18.5, padding 53/48 (27.5/20 sous 600px),
 *              halos corail 22 % et 12 %, marge basse 32 ; titre 32px / 800
 *              borné à 540px, texte 16.5px blanc 70 % borné à 480px ;
 *              repères empilés à droite (écart 16), masqués quand la place manque
 *   sections   titre 19.5px / 700, 16px dessous ; blocs espacés de 36px
 *   cartes     rayon 12, padding 22/20, icône 40px rayon 11 ; grilles écart 16,
 *              4 → 2 → 1 colonnes à 1150 et 760px (3 → 2 → 1 pour le kit et l'annuaire)
 *   bandeau    rayon 18.5, padding 36/40, titre 29px / 800, texte 16px
 *   parcours   4 cartes rayon 14, écart 14 ; pastille 27px rayon 8
 *   tableau    en-tête 11.5px majuscules sur #f7f8fd, cellules 14.5px padding 16/18
 *   FAQ        une seule question ouverte à la fois
 *
 * Pas d'appel à useExemples() : la page s'adresse aux coachs, pas à un
 * dirigeant qui aurait choisi son métier ; ses exemples ne dépendent d'aucun secteur.
 */

const allerA = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

/** `.btn .btn-primary` sous `.coach-space`. */
const BTN_CORAIL =
  'inline-flex items-center gap-1.5 px-[18px] py-[10.5px] rounded-[10.5px] text-15.5 font-semibold bg-coral text-navy-dark transition-all hover:bg-coral-dark hover:text-white hover:-translate-y-px';
/** `.btn-outline` posé sur fond navy (styles en ligne de la maquette). */
const BTN_BLANC =
  'inline-flex items-center gap-1.5 px-[18px] py-[10.5px] rounded-[10.5px] text-15.5 font-semibold bg-white/[0.08] text-white border-[1.5px] border-white/[0.28] transition-all';
/** `.section-link` corail. */
const LIEN_SECTION = 'text-14.5 font-semibold text-coral-dark hover:underline cursor-pointer';

const Ico: React.FC<{ className: string; trait?: number; children: React.ReactNode }> = ({
  className,
  trait = 1.8,
  children,
}) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={trait}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    {children}
  </svg>
);

const TitreSection: React.FC<{ id?: string; lien?: React.ReactNode; children: React.ReactNode }> = ({
  id,
  lien,
  children,
}) => (
  <div id={id} className="flex items-center justify-between gap-4 mb-4 scroll-mt-20">
    <h2 className="text-19.5 font-bold text-navy">{children}</h2>
    {lien}
  </div>
);

type Pilier = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

/** `.badge-<pilier>` d'oskar.css. */
const BADGE: Record<Pilier, string> = {
  vision: 'bg-vision-light text-vision-dark',
  fit: 'bg-fit-light text-fit-dark',
  finance: 'bg-finance-light text-finance-dark',
  okr: 'bg-okr-light text-okr-dark',
  team: 'bg-team-light text-team-dark',
};

const PIN = (
  <>
    <path d="M21 10c0 6-9 12-9 12s-9-6-9-12a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </>
);

const REPERES = [
  { valeur: '5', libelle: 'Piliers à accompagner' },
  { valeur: '12+', libelle: 'Rituels prêts à animer' },
  { valeur: '10’', libelle: 'Le diagnostic qui ouvre la porte' },
];

const RAISONS = [
  {
    titre: 'Un cadre commun, pas des supports à refaire',
    texte:
      'Vous arrêtez de reconstruire vos matrices et vos slides pour chaque mission. Les 5 piliers donnent un langage partagé dès la première séance.',
    icone: (
      <>
        <rect x="3" y="3" width="7" height="7" rx="1.5" />
        <rect x="14" y="3" width="7" height="7" rx="1.5" />
        <rect x="3" y="14" width="7" height="7" rx="1.5" />
        <rect x="14" y="14" width="7" height="7" rx="1.5" />
      </>
    ),
  },
  {
    titre: 'Une porte d’entrée commerciale',
    texte:
      'Le diagnostic gratuit en 10 minutes ne vend rien : il révèle un écart. C’est l’écart qui déclenche la mission — et vous menez la restitution.',
    icone: (
      <>
        <path d="M11 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-6" />
        <path d="M14 3h7v7" />
        <path d="M10 14L21 3" />
      </>
    ),
  },
  {
    titre: 'Du travail qui continue entre vos séances',
    texte:
      'Les rituels de la boîte à outils tournent en autonomie chez le client. Vous vendez de l’impact et de la durée, pas des heures de présence.',
    icone: (
      <>
        <circle cx="12" cy="12" r="9" />
        <polyline points="12 7 12 12 15.5 14" />
      </>
    ),
  },
  {
    titre: 'De la visibilité entrante',
    texte:
      'Les entreprises qui font le diagnostic seules découvrent leurs points faibles. L’annuaire vous propose à celles dont les piliers faibles sont vos spécialités.',
    icone: PIN,
  },
];

const PARCOURS: {
  titre: string;
  texte: string;
  quand: React.ReactNode;
  lien?: { href: string; libelle: string };
}[] = [
  {
    titre: 'Le diagnostic est posé',
    texte:
      'Vous envoyez le lien au client, ou vous l’offrez et le remplissez avec lui en séance. 10 minutes, 5 piliers, 15 critères.',
    quand: (
      <>
        Avant ou pendant le 1<sup>er</sup> RDV
      </>
    ),
  },
  {
    titre: 'Vous animez la restitution',
    texte:
      '45 minutes pour dérouler le radar, faire réagir, hiérarchiser. C’est là que se joue la vente — la grille de restitution du kit vous guide.',
    quand: 'Séance 1',
  },
  {
    titre: 'Vous bâtissez le plan d’actions',
    texte:
      'Ensemble, vous posez la feuille de route jusqu’à la fin de l’année : les chantiers, leur ordre, et les points de coaching à caler dans l’agenda.',
    lien: { href: '/coachs/kit/calendrier', libelle: 'Le calendrier des ateliers →' },
    quand: 'Séance 1 ou 2',
  },
  {
    titre: 'Vous attaquez le premier pilier',
    texte:
      'Celui qui débloque le reste — et logiquement, celui que vous maîtrisez. Vous animez l’atelier, le client renseigne ses réponses dans la plateforme.',
    quand: 'Séances suivantes',
  },
];

const REPARTITION: { pilier: Pilier; nom: string; vous: string; client: string }[] = [
  {
    pilier: 'vision',
    nom: 'OSKAR Vision',
    vous: 'L’atelier de cadrage : raison d’être, valeurs, cap à 1 an. Vous faites trancher là où le dirigeant hésite.',
    client: 'Il saisit sa vision et ses objectifs fondateurs, et les relit à chaque trimestre.',
  },
  {
    pilier: 'fit',
    nom: 'OSKAR Market Fit',
    vous: 'La lecture des signaux de traction et la confrontation aux preuves réelles plutôt qu’aux intuitions.',
    client: 'Il documente ses entretiens clients et met à jour son statut produit-marché.',
  },
  {
    pilier: 'finance',
    nom: 'OSKAR Finance',
    vous: 'La revue mensuelle des indicateurs et les arbitrages difficiles : quoi arrêter, quoi financer.',
    client: 'Il renseigne ses chiffres clés chaque mois et suit ses tendances.',
  },
  {
    pilier: 'okr',
    nom: 'OSKAR OKR',
    vous: 'Le cadrage trimestriel des objectifs et la revue de fin de trimestre. Vous empêchez la dérive vers la to-do list.',
    client: 'Il tient le check-in hebdomadaire et met à jour ses résultats clés.',
  },
  {
    pilier: 'team',
    nom: 'OSKAR Team',
    vous: 'Les ateliers de cohésion et les sujets sensibles : tensions, non-dits, répartition des rôles.',
    client: 'Il fait tourner les rituels de la boîte à outils : rétro, météo d’équipe, daily, boîte à idées.',
  },
];

interface DocumentKit {
  titre: string;
  format: string;
  texte: string;
  icone: React.ReactNode;
  /** Page du kit à ouvrir dans un nouvel onglet ; absent tant que le document n'existe pas. */
  href?: string;
  action?: string;
  phare?: boolean;
}

/*
 * Le deck, la fiche « 5 piliers » et l'argumentaire sont des PDF que la
 * maquette propose au téléchargement mais qui n'existent pas encore : leur
 * carte reste affichée avec la mention « Bientôt disponible ».
 */
const KIT: DocumentKit[] = [
  {
    titre: 'One-pager OSKAR',
    format: 'PDF · A4 recto',
    texte:
      'La méthode en une page : les 5 piliers, la promesse, le déroulé. À envoyer en pièce jointe avant le rendez-vous.',
    href: '/coachs/kit/one-pager',
    action: 'Ouvrir · imprimer',
    icone: (
      <>
        <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
        <path d="M14 2v6h6" />
        <line x1="8" y1="13" x2="16" y2="13" />
        <line x1="8" y1="17" x2="13" y2="17" />
      </>
    ),
  },
  {
    titre: 'Deck de présentation',
    format: '8 slides',
    texte: 'À projeter chez le client ou en visio. Le problème, la méthode, les 5 piliers, un exemple de radar, la suite.',
    icone: (
      <>
        <rect x="2" y="4" width="20" height="13" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </>
    ),
  },
  {
    titre: 'Grille de restitution du diagnostic',
    format: 'Le plus important',
    texte:
      'Le déroulé minuté d’une restitution en 45 minutes : quoi montrer, quelles questions poser, comment amener la proposition sans forcer.',
    href: '/coachs/kit/grille-restitution',
    action: 'Ouvrir · imprimer',
    phare: true,
    icone: (
      <>
        <path d="M9 11l3 3L22 4" />
        <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
      </>
    ),
  },
  {
    titre: 'Fiche « les 5 piliers »',
    format: 'Recto-verso',
    texte:
      'À laisser au client après la séance. Un pilier par bloc : à quoi il sert, ce qu’il produit, en combien de temps.',
    icone: (
      <>
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <line x1="12" y1="4" x2="12" y2="20" />
      </>
    ),
  },
  {
    titre: 'Trame de proposition',
    format: 'Générateur',
    texte:
      'Un générateur : vous remplissez le formulaire, la proposition A4 se compose à côté. Trois formats préchargés, déroulé et livrables inclus.',
    href: '/coachs/kit/proposition',
    action: 'Ouvrir · remplir',
    icone: <path d="M12 2l2.9 6.3 6.6.8-4.9 4.6 1.3 6.8L12 17.3 6.1 20.5l1.3-6.8L2.5 9.1l6.6-.8z" />,
  },
  {
    titre: 'Calendrier des ateliers',
    format: 'A4 paysage',
    texte:
      'Le programme de l’année en un tableau : vous choisissez le mois de lancement, ateliers, suivis et rituels d’équipe se placent seuls.',
    href: '/coachs/kit/calendrier',
    action: 'Ouvrir · remplir',
    icone: (
      <>
        <rect x="3" y="4" width="18" height="18" rx="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
      </>
    ),
  },
  {
    titre: 'Argumentaire express',
    format: '1 page',
    texte:
      'Le pitch en 30 secondes, cinq accroches selon le profil du dirigeant, et une réponse tenable aux six objections les plus fréquentes.',
    icone: (
      <path d="M21 11.5a8.4 8.4 0 01-9 8.4 8.5 8.5 0 01-3.8-.9L3 21l1.9-5.2A8.4 8.4 0 013.6 8 8.5 8.5 0 0112 3.1h.5A8.5 8.5 0 0121 11z" />
    ),
  },
];

const TELECHARGER = (
  <>
    <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </>
);

/** Fiches d'illustration de la maquette, en attendant les premiers coachs référencés. */
const ANNUAIRE: {
  initiales: string;
  nom: string;
  lieu: string;
  texte: string;
  piliers: { id: Pilier; nom: string }[];
  labelRpr?: boolean;
  secteurs: string;
}[] = [
  {
    initiales: 'CL',
    nom: 'Christophe L.',
    lieu: 'Marseille · PACA · Distanciel',
    texte:
      'Accompagne les dirigeants de PME sur le cadrage stratégique et la mise en place des OKR. 15 ans en direction d’entreprise.',
    piliers: [
      { id: 'vision', nom: 'Vision' },
      { id: 'okr', nom: 'OKR' },
      { id: 'finance', nom: 'Finance' },
    ],
    labelRpr: true,
    secteurs: 'Industrie · Services B2B',
  },
  {
    initiales: 'SM',
    nom: 'Sophie M.',
    lieu: 'Lyon · AURA · Présentiel',
    texte: 'Facilitatrice d’équipes. Rituels de cohésion, gestion des tensions et rôles. Certifiée coach professionnelle.',
    piliers: [
      { id: 'team', nom: 'Team' },
      { id: 'vision', nom: 'Vision' },
    ],
    secteurs: 'Startups · Associations',
  },
  {
    initiales: 'KB',
    nom: 'Karim B.',
    lieu: 'Nantes · Pays de la Loire',
    texte: 'Consultant produit-marché. Aide les jeunes structures à confronter leur offre au terrain avant de recruter.',
    piliers: [
      { id: 'fit', nom: 'Fit' },
      { id: 'finance', nom: 'Finance' },
    ],
    secteurs: 'Startups · Tech',
  },
];

const FAQ: { question: string; reponse: React.ReactNode }[] = [
  {
    question: 'Oskar va-t-il me remplacer auprès de mes clients ?',
    reponse:
      'Non, et c’est le contraire qui se produit en pratique. Un outil structuré rend visible ce qui ne va pas — mais il ne fait pas trancher, ne gère pas la résistance au changement et ne dit pas au dirigeant ce qu’il ne veut pas entendre. Oskar vous débarrasse de la partie support pour vous laisser le temps de la partie relation, qui est celle que vos clients paient.',
  },
  {
    question: 'Mes clients peuvent-ils s’en servir sans moi ?',
    reponse:
      'Oui, et c’est voulu : la plateforme est utilisable en autonomie. Concrètement, cela signifie que le travail continue entre vos séances au lieu de s’arrêter. Ceux qui vont au bout seuls n’auraient de toute façon pas fait appel à un coach ; ceux qui bloquent vous appellent, et l’annuaire est là pour ça.',
  },
  {
    question: 'Puis-je l’utiliser à ma marque ?',
    reponse: (
      <>
        La méthode et l’interface restent Oskar. En revanche, votre fiche coach, vos supports et votre proposition
        commerciale sont à vous : le kit de conviction est fourni en formats modifiables pour que vous y mettiez votre
        identité. <strong>Une option marque blanche pour les cabinets est à l’étude</strong> — dites-le nous dans
        votre candidature si le sujet vous intéresse.
      </>
    ),
  },
  {
    question: 'À qui appartiennent les données de mes clients ?',
    reponse:
      'À vos clients. Chaque organisation dispose de son espace ; vous y accédez parce qu’elle vous y invite, et elle peut retirer cet accès à tout moment. Le diagnostic peut être réalisé sans inscription, donc sans qu’aucune donnée nominative ne soit conservée.',
  },
  {
    question: 'Combien ça coûte, pour moi et pour eux ?',
    reponse: (
      <>
        Le diagnostic est gratuit et sans inscription. L’accès aux modules et à la boîte à outils fait l’objet d’un
        abonnement côté entreprise.{' '}
        <strong>
          Les conditions coachs — référencement, accès aux espaces clients, conditions apporteur — sont en cours de
          finalisation
        </strong>{' '}
        et vous seront communiquées avec le kit.
      </>
    ),
  },
  {
    question: 'Faut-il être certifié pour figurer dans l’annuaire ?',
    reponse:
      'Pas de certification Oskar à ce stade. Nous vous demandons d’avoir parcouru vous-même les piliers sur lesquels vous vous positionnez, et de décrire un accompagnement réel que vous avez mené. Un échange de trente minutes suffit à valider une fiche.',
  },
];

const CARTE = 'bg-white border border-line shadow-card transition-all duration-[180ms] hover:shadow-card-hover hover:-translate-y-0.5';

export default function EspaceCoachsPage() {
  const { authReady, isAuthenticated } = useAppStore();
  const [question, setQuestion] = useState<number | null>(null);

  const topbarActions = (
    <>
      <button type="button" onClick={() => allerA('kit')} className={`${BTN_OUTLINE} max-sm:hidden`}>
        Kit coach
      </button>
      <button type="button" onClick={() => allerA('candidature')} className={BTN_CORAIL}>
        Rejoindre l’annuaire →
      </button>
      {authReady && isAuthenticated && <UserMenu />}
    </>
  );

  return (
    <AppShell
      title="Espace coachs"
      description="Coachs, consultants, facilitateurs : Oskar porte le cadre, vous portez la relation."
      topbarTitle={
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-[10.5px] text-15 font-normal text-muted">
          <Link href="/" className="font-medium text-muted hover:text-navy transition-colors">
            Accueil
          </Link>
          <span className="text-line" aria-hidden>
            /
          </span>
          <span className="font-bold text-navy" aria-current="page">
            Espace coachs
          </span>
        </nav>
      }
      topbarActions={topbarActions}
    >
      {/* ── Bannière ── */}
      <section className="relative overflow-hidden rounded-[18.5px] px-5 py-[27.5px] min-[600px]:px-12 min-[600px]:py-[53px] mb-8 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
        <span
          className="absolute -right-[60px] -top-[60px] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(255,160,137,0.22)_0%,transparent_70%)]"
          aria-hidden
        />
        <span
          className="absolute right-20 -bottom-10 w-[180px] h-[180px] rounded-full bg-[radial-gradient(circle,rgba(255,160,137,0.12)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative">
          <p className="text-12.5 font-bold uppercase tracking-[1.8px] text-coral mb-2.5">
            Coachs · Consultants · Facilitateurs
          </p>
          <h1 className="text-32 font-extrabold text-white max-w-[540px] mb-3">
            Oskar porte le cadre.
            <br />
            Vous portez la <span className="text-coral">relation</span>.
          </h1>
          <p className="text-16.5 leading-[1.7] text-white/70 max-w-[480px] mb-6">
            Une méthode structurée en 5 piliers, des rituels prêts à animer et un diagnostic gratuit qui ouvre la
            conversation avec vos prospects. Vous gardez votre style, votre posture et vos clients.
          </p>
          <div className="flex flex-wrap gap-3.5">
            <a
              href="#candidature"
              onClick={(e) => {
                e.preventDefault();
                allerA('candidature');
              }}
              className={BTN_CORAIL}
            >
              Rejoindre l’annuaire →
            </a>
            <a
              href="#kit"
              onClick={(e) => {
                e.preventDefault();
                allerA('kit');
              }}
              className={BTN_BLANC}
            >
              Voir le kit de conviction
            </a>
          </div>
        </div>
        {/* Masqués quand la bannière n'a plus la place de les poser à côté du titre. */}
        <ul className="hidden min-[1080px]:flex flex-col gap-4 absolute right-12 top-1/2 -translate-y-1/2 z-[1]">
          {REPERES.map((r) => (
            <li
              key={r.libelle}
              className="bg-white/[0.07] border border-white/[0.12] rounded-[11.5px] px-[18px] py-3.5 text-center"
            >
              <p className="text-25.5 leading-none font-extrabold text-coral">{r.valeur}</p>
              <p className="text-12.5 text-white/55 mt-0.5">{r.libelle}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ── Pourquoi ── */}
      <TitreSection>Pourquoi intégrer Oskar à votre pratique</TitreSection>
      <div className="grid gap-4 mb-9 grid-cols-1 min-[761px]:grid-cols-2 min-[1151px]:grid-cols-4">
        {RAISONS.map((r, i) => (
          <div key={r.titre} className={`${CARTE} rounded-card px-5 py-[22px] hover:border-[#c8ccec]`}>
            <div className="w-10 h-10 rounded-[11px] bg-[#f0f2ff] text-navy flex items-center justify-center mb-[13px]">
              <Ico className="w-5 h-5">{r.icone}</Ico>
            </div>
            <p className="text-11.5 font-bold uppercase tracking-[0.12em] text-muted mb-1.5">
              {String(i + 1).padStart(2, '0')}
            </p>
            <h3 className="text-16.5 leading-[1.35] font-bold text-navy mb-1.5">{r.titre}</h3>
            <p className="text-14.5 leading-[1.65] text-muted">{r.texte}</p>
          </div>
        ))}
      </div>

      {/* ── Bandeau ── */}
      <div className="relative overflow-hidden text-center rounded-[18.5px] px-5 min-[600px]:px-10 py-9 mb-9 bg-[linear-gradient(135deg,#151f5e,#1e2d7d)]">
        <span
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_40%,rgba(255,160,137,0.20)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative z-[1]">
          <p className="text-12 font-bold uppercase tracking-[1.8px] text-coral mb-3">Ce qu’Oskar ne fera jamais</p>
          <p className="text-29 font-extrabold text-white">
            Un outil ne remplace pas
            <br />
            un <span className="text-coral">regard extérieur</span>.
          </p>
          <p className="text-16 leading-[1.65] text-white/65 max-w-[560px] mx-auto mt-3">
            Oskar structure, mesure et ritualise. Il ne pose pas la bonne question au bon moment, ne lit pas les
            non-dits d’un comité de direction et ne recadre pas un dirigeant qui se ment à lui-même. C’est votre métier.
          </p>
        </div>
      </div>

      {/* ── Parcours ── */}
      <TitreSection>Comment ça se passe avec un client</TitreSection>
      <ol className="grid gap-3.5 mb-9 grid-cols-1 min-[621px]:grid-cols-2 min-[1001px]:grid-cols-4">
        {PARCOURS.map((etape, i) => (
          <li key={etape.titre} className="bg-white border border-line rounded-[14px] px-[18px] py-5 shadow-card">
            <div className="w-[27px] h-[27px] rounded-lg bg-navy text-white text-13.5 font-bold flex items-center justify-center mb-[11px]">
              {i + 1}
            </div>
            <h3 className="text-15.5 font-bold text-navy mb-1.5">{etape.titre}</h3>
            <p className="text-14 leading-[1.6] text-muted">{etape.texte}</p>
            {etape.lien && (
              <a
                href={etape.lien.href}
                target="_blank"
                rel="noopener"
                className="block mt-2 text-14 font-bold text-coral-dark hover:underline"
              >
                {etape.lien.libelle}
              </a>
            )}
            <span className="inline-block mt-2.5 text-11.5 font-bold uppercase tracking-[0.05em] bg-surface border border-line text-muted px-2.5 py-[3px] rounded-[20px]">
              {etape.quand}
            </span>
          </li>
        ))}
      </ol>

      {/* ── Qui fait quoi ── */}
      <TitreSection>Qui fait quoi, pilier par pilier</TitreSection>
      <div className="bg-white border border-line rounded-card shadow-card overflow-hidden mb-9">
        <table className="w-full border-collapse">
          <thead className="bg-[#f7f8fd] max-[900px]:hidden">
            <tr>
              {['Pilier', 'Ce que vous animez', 'Ce que le client fait seul dans Oskar'].map((t) => (
                <th
                  key={t}
                  className="text-left text-11.5 font-bold uppercase tracking-[0.09em] text-muted px-[18px] py-3.5 border-b border-line"
                >
                  {t}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="[&>tr:last-child>td]:border-b-0">
            {REPARTITION.map((r) => (
              <tr
                key={r.pilier}
                className="hover:bg-[#fafbff] max-[900px]:block max-[900px]:py-1.5 max-[900px]:border-b max-[900px]:border-line max-[900px]:last:border-b-0"
              >
                <td className="w-[176px] align-top px-[18px] py-4 border-b border-line max-[900px]:block max-[900px]:w-auto max-[900px]:border-0 max-[900px]:pt-3.5 max-[900px]:pb-1.5">
                  <span className={`inline-block whitespace-nowrap text-12.5 font-bold px-[11px] py-1 rounded-[20px] ${BADGE[r.pilier]}`}>
                    {r.nom}
                  </span>
                </td>
                <td className="align-top px-[18px] py-4 border-b border-line text-14.5 leading-[1.6] font-medium text-ink max-[900px]:block max-[900px]:border-0 max-[900px]:py-1.5">
                  {r.vous}
                </td>
                <td className="align-top px-[18px] py-4 border-b border-line text-14.5 leading-[1.6] text-muted max-[900px]:block max-[900px]:border-0 max-[900px]:py-1.5">
                  {r.client}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Kit de conviction ── */}
      <TitreSection
        id="kit"
        lien={
          <button type="button" onClick={() => allerA('candidature')} className={LIEN_SECTION}>
            Recevoir le kit complet →
          </button>
        }
      >
        Le kit de conviction
      </TitreSection>
      <div className="grid gap-4 mb-9 grid-cols-1 min-[761px]:grid-cols-2 min-[1151px]:grid-cols-3">
        {KIT.map((d) => (
          <div
            key={d.titre}
            className={`${CARTE} rounded-[14px] p-5 flex flex-col gap-[9px] ${
              d.phare ? 'border-coral/60' : 'hover:border-[#c8ccec]'
            }`}
          >
            <div className="flex items-center justify-between gap-2.5">
              <div
                className={`w-[38px] h-[38px] rounded-[10px] flex items-center justify-center shrink-0 ${
                  d.phare ? 'bg-coral-light text-coral-dark' : 'bg-[#f0f2ff] text-navy'
                }`}
              >
                <Ico className="w-[19px] h-[19px]">{d.icone}</Ico>
              </div>
              <span
                className={`text-11 font-bold uppercase tracking-[0.06em] border px-[9px] py-[3px] rounded-[20px] whitespace-nowrap ${
                  d.phare ? 'bg-coral-light text-coral-dark border-coral/50' : 'bg-surface text-muted border-line'
                }`}
              >
                {d.format}
              </span>
            </div>
            <h3 className="text-16 leading-[1.35] font-bold text-navy">{d.titre}</h3>
            <p className="text-14 leading-[1.6] text-muted flex-1">{d.texte}</p>
            {d.href ? (
              <a
                href={d.href}
                target="_blank"
                rel="noopener"
                className="inline-flex items-center gap-[7px] mt-0.5 text-14 font-bold text-coral-dark hover:underline"
              >
                <Ico className="w-[15px] h-[15px] shrink-0" trait={2}>
                  {TELECHARGER}
                </Ico>
                {d.action}
              </a>
            ) : (
              <span className="inline-flex items-center gap-[7px] mt-0.5 text-14 font-bold text-muted">
                <Ico className="w-[15px] h-[15px] shrink-0" trait={2}>
                  <circle cx="12" cy="12" r="9" />
                  <polyline points="12 7 12 12 15.5 14" />
                </Ico>
                Bientôt disponible
              </span>
            )}
          </div>
        ))}
      </div>

      {/* ── Annuaire ── */}
      <TitreSection id="annuaire">L’annuaire des coachs Oskar</TitreSection>
      <p className="text-15.5 leading-[1.7] text-muted max-w-[760px] mb-[18px]">
        À la fin de son diagnostic, une entreprise voit ses deux ou trois piliers les plus faibles. On lui propose alors
        les coachs référencés <strong className="text-navy">sur ces piliers-là</strong>, dans sa région. Vous choisissez
        les piliers sur lesquels vous vous positionnez.
      </p>
      <p className="inline-flex items-center gap-[7px] text-13.5 text-muted bg-[#f0f2ff] rounded-[9px] px-3.5 py-[9px] mb-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="#1e2d7d" strokeWidth={1.9} strokeLinecap="round" className="w-3.5 h-3.5 shrink-0" aria-hidden>
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
        Fiches d’illustration — l’annuaire ouvrira avec les premiers coachs référencés.
      </p>
      <div className="grid gap-4 mb-9 grid-cols-1 min-[761px]:grid-cols-2 min-[1151px]:grid-cols-3">
        {ANNUAIRE.map((f) => (
          <div key={f.nom} className={`${CARTE} rounded-[14px] p-5 flex flex-col gap-3`}>
            <div className="flex items-center gap-[13px]">
              <div className="w-[46px] h-[46px] rounded-full bg-[linear-gradient(135deg,#1e2d7d,#2a3d99)] text-white text-16 font-bold flex items-center justify-center shrink-0">
                {f.initiales}
              </div>
              <div>
                <p className="text-16 leading-[1.3] font-bold text-navy">{f.nom}</p>
                <p className="flex items-center gap-[5px] text-13.5 text-muted mt-0.5">
                  <Ico className="w-[13px] h-[13px] shrink-0" trait={1.9}>
                    {PIN}
                  </Ico>
                  {f.lieu}
                </p>
              </div>
            </div>
            <p className="text-14 leading-[1.6] text-muted flex-1">{f.texte}</p>
            <div className="flex flex-wrap gap-1.5">
              {f.piliers.map((p) => (
                <span key={p.id} className={`text-11.5 font-bold px-2.5 py-[3px] rounded-[20px] ${BADGE[p.id]}`}>
                  {p.nom}
                </span>
              ))}
            </div>
            {f.labelRpr && (
              <div className="flex items-center gap-2 text-13 font-semibold text-navy bg-[#f0f2ff] rounded-[9px] px-[11px] py-[7px]">
                {/* eslint-disable-next-line @next/next/no-img-element -- vignette fixe */}
                <img
                  src="/images/oskar/reunir-pour-reussir.jpg"
                  alt="Réunir pour Réussir"
                  className="w-[22px] h-[22px] rounded-[5px] object-cover shrink-0"
                />
                Coach labellisé Réunir pour Réussir
              </div>
            )}
            <div className="flex items-center justify-between pt-3 border-t border-line text-13.5 text-muted">
              <span>{f.secteurs}</span>
              {/* Fiche d'illustration : pas de contact réel derrière. */}
              <span className="text-14.5 font-semibold text-coral-dark" aria-disabled="true">
                Contacter →
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Candidature ── */}
      <FormulaireCandidature />

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
          className="absolute inset-0 bg-[radial-gradient(ellipse_at_70%_50%,rgba(255,160,137,0.16)_0%,transparent_70%)]"
          aria-hidden
        />
        <div className="relative z-[1]">
          <p className="text-12.5 font-bold uppercase tracking-[1.8px] text-coral mb-2.5">Le meilleur test</p>
          <h2 className="text-27.5 font-extrabold text-white mb-2.5">Faites le diagnostic sur votre propre activité.</h2>
          <p className="text-16 text-white/65 max-w-[520px] mx-auto mb-6">
            Dix minutes pour comprendre ce que vos clients vivront —
            <br />
            et pour savoir exactement quoi leur en dire.
          </p>
          <div className="flex flex-wrap justify-center gap-3.5">
            <Link href="/diagnostic" className={`${BTN_CORAIL} !px-7 !py-3.5 !text-17`}>
              Démarrer le diagnostic →
            </Link>
            <a
              href="#candidature"
              onClick={(e) => {
                e.preventDefault();
                allerA('candidature');
              }}
              className={`${BTN_BLANC} !px-7 !py-3.5 !text-17`}
            >
              Rejoindre l’annuaire
            </a>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
