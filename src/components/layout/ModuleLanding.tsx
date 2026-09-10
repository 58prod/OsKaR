import React from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Check, type LucideIcon } from 'lucide-react';
import { ChoixSecteur } from '@/components/ui/ChoixSecteur';
import { useSecteurChoisi } from '@/hooks/useSecteurChoisi';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { BTN_OUTLINE, BTN_PRIMARY } from '@/components/okr/okrFlux';
import { useAppStore } from '@/store/useAppStore';

/*
 * Page de presentation d'un pilier ("module").
 * Transposition de vision.html / fit.html / finance.html / team.html : les
 * maquettes partagent la meme structure, d'ou un seul composant configure par
 * pilier. OKR n'a pas de maquette de presentation, il suit le meme gabarit.
 *
 * Valeurs relevees sur les maquettes servies (styles calcules, 1400 px) :
 *   cadre         pleine largeur du contenu, comme les ateliers : le bloc
 *                 demarre a 42.5px du menu (padding de `.page-content`)
 *   banniere      degrade 135deg #151f5e / #1e2d7d 60% / #2a3d99, rayon 20.5,
 *                 padding 56/52, deux halos (vert 15 % en haut a droite,
 *                 bleu 50 % en bas), texte borne a 680px, marge basse 28
 *   eyebrow       14px / 700 / interlettrage 1.6px / couleur du pilier, marge 14
 *   titre         34.5px / 800 / interligne 1.2 / blanc, marge 14
 *   description   18.5px / interligne 1.7 / blanc 75 %
 *   reperes       3 colonnes, ecart 18.5, marge basse 28 ; carte rayon 16,
 *                 padding 23/22 ; icone 40px rayon 11.5 trait 1.8, 12px dessous ;
 *                 valeur 27.5px / 800 ; libelle 15px gris a 4px ; texte 15px a 8px
 *   bloc final    2 colonnes, ecart 20, alignees en haut
 *   profil        rayon 18.5, padding 32 ; aide 15px, 22px avant le champ ;
 *                 intitule 14px / 700 gris en majuscules, menu 16px rayon 11.5
 *                 bord 1.5, 48px. La maquette propose aussi le role : retire le
 *                 2026-09-10 a la demande de Christophe, un menu de trop.
 *   appel         degrade navy, rayon 18.5, padding 32 ; texte a gauche, bouton
 *                 a droite (ecart 27.5) ; pastilles 14px, point 6px du pilier ;
 *                 bouton 17px / 700 rayon 14, padding 16/28
 *   Team          liseré haut rose 3px sur les cartes, degrade #1a2570, pastilles
 *                 blanc 18 % ; bouton grise et badge « Bientot disponible » quand
 *                 l'atelier n'existe pas encore (repris pour tout atelier absent)
 */

export type Pilier = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

/** Classes ecrites en toutes lettres : Tailwind ne resout pas les noms construits. */
const COULEURS: Record<Pilier, { texte: string; valeur: string; icone: string; bouton: string; point: string }> = {
  vision: {
    texte: 'text-vision',
    valeur: 'text-vision',
    icone: 'bg-vision-light text-vision-dark',
    bouton: 'bg-vision hover:bg-vision-dark',
    point: 'bg-vision',
  },
  fit: {
    texte: 'text-fit',
    valeur: 'text-fit-dark',
    icone: 'bg-fit-light text-fit-dark',
    bouton: 'bg-fit hover:bg-fit-dark',
    point: 'bg-fit',
  },
  finance: {
    texte: 'text-finance',
    valeur: 'text-finance',
    icone: 'bg-finance-light text-finance-dark',
    bouton: 'bg-finance hover:bg-finance-dark',
    point: 'bg-finance',
  },
  okr: {
    texte: 'text-okr',
    valeur: 'text-okr',
    icone: 'bg-okr-light text-okr-dark',
    bouton: 'bg-okr hover:bg-okr-dark',
    point: 'bg-okr',
  },
  team: {
    texte: 'text-team',
    valeur: 'text-team',
    // team.html redefinit --team-dark a #be185d.
    icone: 'bg-team-light text-[#be185d]',
    bouton: 'bg-team hover:bg-team-dark',
    point: 'bg-team',
  },
};

/** Chevron des menus du profil (`.profil-select`). */
const CHEVRON =
  "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 24 24' fill='none' stroke='%237b82a0' stroke-width='2' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E\")";

const MENU_PROFIL =
  'w-full appearance-none cursor-pointer text-16 leading-[normal] text-ink bg-white border-[1.5px] border-line rounded-[11.5px] pl-3.5 pr-10 py-[12.5px] outline-none transition-colors focus:border-teal bg-no-repeat bg-[length:16px] bg-[position:right_12px_center]';

const INTITULE_PROFIL = 'block text-14 font-bold uppercase tracking-[0.8px] text-muted mb-[7px]';

export interface Repere {
  icon: LucideIcon;
  valeur: string;
  libelle: string;
  texte: string;
}

interface ModuleLandingProps {
  pilier: Pilier;
  /** Numero affiche dans l'eyebrow, ex. « 01 ». */
  numero: string;
  /** Nom du module, ex. « OSKAR Vision ». */
  nom: string;
  /** Titre du bandeau ; la partie mise en avant est passee en <span>. */
  titre: React.ReactNode;
  description: string;
  /** Titre de l'onglet du navigateur. */
  titreOnglet: string;
  reperes: Repere[];
  etapes: readonly string[];
  /** Phrase sous « Avant de commencer — votre profil ». */
  profilAide?: string;
  ctaTitre: string;
  ctaSousTitre: string;
  /** Vrai tant que l'atelier n'existe pas : bouton grise et badge « Bientot disponible ». */
  ctaIndisponible?: boolean;
  ctaMentionIndispo?: string;
  /** Destination du bouton quand l'atelier existe. */
  ctaHref?: string;
  /** Bloc libre insere entre les reperes et le bloc final (Fit, Finance). */
  children?: React.ReactNode;
}

/** Fleche des boutons « Demarrer l'atelier », trace de la maquette. */
const Fleche: React.FC<{ className: string }> = ({ className }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
    aria-hidden
  >
    <path d="M5 12h14M12 5l7 7-7 7" />
  </svg>
);

export const ModuleLanding: React.FC<ModuleLandingProps> = ({
  pilier,
  numero,
  nom,
  titre,
  description,
  titreOnglet,
  reperes,
  etapes,
  profilAide = 'Ces informations nous permettent de personnaliser les conseils tout au long de l’atelier.',
  ctaTitre,
  ctaSousTitre,
  ctaIndisponible = false,
  ctaMentionIndispo = 'Bientôt disponible',
  ctaHref,
  children,
}) => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();
  const { secteur, choisirSecteur, enregistre } = useSecteurChoisi();
  const c = COULEURS[pilier];
  const team = pilier === 'team';

  // Boutons de la barre du haut : `.btn-outline` puis `.btn-primary`, comme la maquette.
  const topbarActions = !authReady ? null : isAuthenticated ? (
    <UserMenu />
  ) : (
    <>
      <button type="button" onClick={() => router.push('/auth/login')} className={BTN_OUTLINE}>
        Connexion
      </button>
      <button type="button" onClick={() => router.push('/auth/register')} className={BTN_PRIMARY}>
        Commencer gratuitement →
      </button>
    </>
  );

  return (
    <>
      <Head>
        <title>{titreOnglet}</title>
      </Head>
      <AppShell
        title={nom}
        topbarTitle="Bienvenue sur OSKAR"
        topbarSubtitle="— productivité max"
        topbarActions={topbarActions}
      >
        {/* Bannière du module */}
        <section className="relative overflow-hidden rounded-[20.5px] px-8 py-10 sm:px-[52px] sm:py-14 mb-7 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
          <span
            className="absolute -right-[60px] -top-[60px] w-[280px] h-[280px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.15)_0%,transparent_70%)]"
            aria-hidden
          />
          <span
            className="absolute right-20 -bottom-10 w-40 h-40 rounded-full bg-[radial-gradient(circle,rgba(42,61,153,0.5)_0%,transparent_70%)]"
            aria-hidden
          />
          <div className="relative z-[1] max-w-[680px]">
            <p className={`text-14 font-bold uppercase tracking-[1.6px] ${c.texte} mb-3.5`}>
              Module {numero} — {nom}
            </p>
            <h1 className="text-34.5 font-extrabold text-white mb-3.5">{titre}</h1>
            <p className="text-18.5 leading-[1.7] text-white/75">{description}</p>
          </div>
        </section>

        {/* Les repères */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-[18.5px] mb-7">
          {reperes.map(({ icon: Icon, valeur, libelle, texte }) => (
            <div
              key={libelle}
              className={`bg-white rounded-2xl border border-line px-[22px] py-[23px] shadow-card ${
                team ? 'border-t-[3px] border-t-team' : ''
              }`}
            >
              <div className={`w-10 h-10 rounded-[11.5px] ${c.icone} flex items-center justify-center mb-3`}>
                <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
              </div>
              <p className={`text-27.5 leading-none font-extrabold ${c.valeur}`}>{valeur}</p>
              <p className="text-15 text-muted mt-1">{libelle}</p>
              <p className="text-15 leading-[1.6] text-ink mt-2">{texte}</p>
            </div>
          ))}
        </div>

        {children && <div className="mb-5">{children}</div>}

        {/* Profil + appel à l'action, en deux colonnes alignées en haut */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-start">
          <div className="bg-white rounded-[18.5px] border border-line p-8 shadow-card">
            <h2 className="text-18.5 font-bold text-navy mb-1.5">Avant de commencer — votre profil</h2>
            <p className="text-15 leading-[1.5] text-muted mb-[22px]">{profilAide}</p>
            {/* Le secteur adapte tous les exemples de l'atelier au métier. */}
            <label htmlFor="profil-secteur" className={INTITULE_PROFIL}>
              Votre secteur d’activité
            </label>
            <ChoixSecteur
              id="profil-secteur"
              value={secteur}
              onChange={choisirSecteur}
              placeholder="-- Sélectionnez votre secteur --"
              className={MENU_PROFIL}
              style={{ backgroundImage: CHEVRON }}
            />
            {secteur && (
              <p className="flex items-center gap-1.5 text-13 text-teal-dark mt-3">
                <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                {enregistre
                  ? 'Enregistré : les exemples de l’atelier sont adaptés à votre métier.'
                  : 'Les exemples sont adaptés. Créez un compte pour le conserver.'}
              </p>
            )}
          </div>

          <div
            className={`rounded-[18.5px] p-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-[27.5px] ${
              team
                ? 'bg-[linear-gradient(135deg,#1a2570_0%,#1e2d7d_100%)]'
                : 'bg-[linear-gradient(135deg,#151f5e,#1e2d7d)]'
            }`}
          >
            <div>
              <h2 className="text-20.5 font-bold text-white mb-1.5">{ctaTitre}</h2>
              <p className="text-15 leading-[1.5] text-white/60">{ctaSousTitre}</p>
              <ol className="flex flex-wrap gap-[10.5px] mt-3.5">
                {etapes.map((etape) => (
                  <li
                    key={etape}
                    className={`inline-flex items-center gap-[5px] text-14 rounded-[23px] px-3 py-1 ${
                      team ? 'bg-white/[0.18] text-white' : 'bg-white/10 text-white/75'
                    }`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.point}`} aria-hidden />
                    {etape}
                  </li>
                ))}
              </ol>
              {ctaIndisponible && (
                <p className="inline-flex items-center gap-1.5 mt-3.5 px-3 py-[5px] rounded-[20px] bg-white/15 text-white/80 text-12 font-semibold uppercase tracking-[0.04em]">
                  <span className="w-[7px] h-[7px] rounded-full bg-white/60" aria-hidden />
                  {ctaMentionIndispo}
                </p>
              )}
            </div>

            {ctaIndisponible ? (
              <span
                aria-disabled="true"
                className="inline-flex items-center gap-2.5 shrink-0 whitespace-nowrap px-7 py-4 rounded-xl text-16 font-bold bg-[#d1d5db] text-[#9ca3af] cursor-not-allowed"
              >
                Démarrer l’atelier <Fleche className="w-5 h-5" />
              </span>
            ) : (
              <button
                type="button"
                onClick={ctaHref ? () => router.push(ctaHref) : undefined}
                className={`inline-flex items-center gap-[10.5px] shrink-0 whitespace-nowrap px-7 py-4 rounded-[14px] text-17 font-bold text-white transition-all hover:-translate-y-0.5 ${c.bouton}`}
              >
                Démarrer l’atelier <Fleche className="w-[18px] h-[18px]" />
              </button>
            )}
          </div>
        </div>
      </AppShell>
    </>
  );
};

/*
 * Encart « Ce module complete… » de fit.html et finance.html : une carte
 * profil (rayon 18.5, padding 32), pictogramme 40px rayon 11, titre 18.5px,
 * texte 15px gris interligne 1.5, lien borde 14px / 600 a droite.
 */
export const EncartLien: React.FC<{
  titre: string;
  /** Fond et trait du pictogramme : #eef0fb/navy pour Fit, #fef3c7/orange pour Finance. */
  icone: 'navy' | 'finance';
  href: string;
  libelle: string;
  children: React.ReactNode;
}> = ({ titre, icone, href, libelle, children }) => (
  <div className="bg-white border border-line rounded-[18.5px] p-8 shadow-card">
    <div className="flex flex-col sm:flex-row items-start gap-[18px]">
      <div
        className={`shrink-0 w-10 h-10 rounded-[11px] flex items-center justify-center mt-0.5 ${
          icone === 'finance' ? 'bg-[#fef3c7] text-finance-dark' : 'bg-[#eef0fb] text-navy'
        }`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={1.8}
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-5 h-5"
          aria-hidden
        >
          <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <div className="flex-1">
        <h2 className="text-18.5 font-bold text-navy mb-1.5">{titre}</h2>
        <p className="text-15 leading-[1.5] text-muted">{children}</p>
      </div>
      <Link
        href={href}
        className="shrink-0 text-14 font-semibold text-navy border-[1.5px] border-line rounded-[9px] px-3.5 py-2 whitespace-nowrap transition-colors hover:border-teal"
      >
        {libelle}
      </Link>
    </div>
  </div>
);

export default ModuleLanding;
