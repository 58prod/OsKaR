import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowRight, UserCog, type LucideIcon } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';

/*
 * Page de presentation d'un pilier ("module").
 * Transposition de vision.html / finance.html / team.html : les trois maquettes
 * partagent la meme structure, d'ou un seul composant configure par pilier.
 *
 * Valeurs relevees sur les maquettes (styles calcules a 1440 px) :
 *   banniere      degrade 135deg #151f5e 0% / #1e2d7d 60% / #2a3d99 100%,
 *                 rayon 20.5px, padding 56/52
 *   eyebrow       14px / 700 / interlettrage 1.6px / couleur du pilier
 *   titre         34.5px / 800 / interligne 1.2 / blanc
 *   description   18.5px / 400 / interligne 1.7 / blanc 75 %
 *   carte         blanche, rayon 16px, padding 23/22
 *   icone carte   40x40, rayon 11.5px, fond clair et trait fonce du pilier
 *   valeur        27.5px / 800 / interligne 1 / couleur du pilier
 *   libelle       15px / 400 / gris
 *   texte         15px / 400 / encre
 *   bloc final    2 colonnes, ecart 20px : profil (blanc) + appel a l'action
 *                 (degrade navy, rayon 18.5px, padding 32)
 *   titre appel   20.5px / 700 / blanc
 *   sous-titre    15px / 400 / interligne 1.5 / blanc 60 %
 *   pastille      14px / 400 / blanc 75 % sur blanc 10 %, rayon 23px, 4/12
 *   bouton        17px / 700 / blanc sur couleur du pilier, rayon 14px, 16/28
 */

export type Pilier = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

/** Classes ecrites en toutes lettres : Tailwind ne resout pas les noms construits. */
const COULEURS: Record<Pilier, { texte: string; fond: string; icone: string; pastilleBord: string }> = {
  vision: {
    texte: 'text-vision',
    fond: 'bg-vision hover:bg-vision-dark',
    icone: 'bg-vision-light text-vision-dark',
    pastilleBord: 'border-vision/20',
  },
  fit: {
    texte: 'text-fit',
    fond: 'bg-fit hover:bg-fit-dark',
    icone: 'bg-fit-light text-fit-dark',
    pastilleBord: 'border-fit/20',
  },
  finance: {
    texte: 'text-finance',
    fond: 'bg-finance hover:bg-finance-dark',
    icone: 'bg-finance-light text-finance-dark',
    pastilleBord: 'border-finance/20',
  },
  okr: {
    texte: 'text-okr',
    fond: 'bg-okr hover:bg-okr-dark',
    icone: 'bg-okr-light text-okr-dark',
    pastilleBord: 'border-okr/20',
  },
  team: {
    texte: 'text-team',
    fond: 'bg-team hover:bg-team-dark',
    icone: 'bg-team-light text-team-dark',
    pastilleBord: 'border-team/20',
  },
};

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
  /** Nom du module, ex. « OsKaR Vision ». */
  nom: string;
  /** Titre du bandeau ; la partie mise en avant est passee en <span>. */
  titre: React.ReactNode;
  description: string;
  /** Titre de l'onglet du navigateur. */
  titreOnglet: string;
  sousTitreBarre: string;
  reperes: Repere[];
  etapes: readonly string[];
  ctaTitre: string;
  ctaSousTitre: string;
  /** Vrai tant que l'atelier n'existe pas : le bouton reste visible mais inerte. */
  ctaIndisponible?: boolean;
  ctaMentionIndispo?: string;
  /** Destination du bouton quand l'atelier existe. */
  ctaHref?: string;
  /** Bloc libre insere entre les reperes et le bloc final (Finance l'utilise). */
  children?: React.ReactNode;
}

export const ModuleLanding: React.FC<ModuleLandingProps> = ({
  pilier,
  numero,
  nom,
  titre,
  description,
  titreOnglet,
  sousTitreBarre,
  reperes,
  etapes,
  ctaTitre,
  ctaSousTitre,
  ctaIndisponible = false,
  ctaMentionIndispo = 'Bientôt',
  ctaHref,
  children,
}) => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();
  const c = COULEURS[pilier];

  const topbarActions = !authReady ? null : isAuthenticated ? (
    <UserMenu />
  ) : (
    <div className="flex items-center gap-2">
      <button
        onClick={() => router.push('/auth/login')}
        className="px-4 py-2 text-14 font-semibold text-navy hover:text-navy-light transition-colors"
      >
        Connexion
      </button>
      <button
        onClick={() => router.push('/auth/register')}
        className="px-4 py-2 bg-teal text-navy-dark text-14 font-bold rounded-lg shadow-sm hover:bg-teal-dark transition-all"
      >
        Commencer gratuitement →
      </button>
    </div>
  );

  return (
    <>
      <Head>
        <title>{titreOnglet}</title>
      </Head>
      <AppShell
        title={nom}
        topbarTitle={nom}
        topbarSubtitle={sousTitreBarre}
        topbarActions={topbarActions}
      >
        <div className="max-w-5xl mx-auto space-y-5 pb-16">
          {/* Bannière du module */}
          <div className="rounded-[20.5px] px-8 py-10 sm:px-[52px] sm:py-14 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)] shadow-card">
            <div className="max-w-2xl">
              <p className={`text-14 font-bold uppercase tracking-[1.6px] ${c.texte} mb-3`}>
                Module {numero} — {nom}
              </p>
              <h1 className="text-34.5 font-extrabold text-white mb-4">{titre}</h1>
              <p className="text-18.5 leading-[1.7] text-white/75">{description}</p>
            </div>
          </div>

          {/* Les repères */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {reperes.map(({ icon: Icon, valeur, libelle, texte }) => (
              <div
                key={libelle}
                className="bg-white rounded-2xl border border-line px-[22px] py-[23px] shadow-card"
              >
                <div
                  className={`w-10 h-10 rounded-[11.5px] ${c.icone} flex items-center justify-center mb-4`}
                >
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className={`text-27.5 leading-none font-extrabold ${c.texte} mb-1.5`}>{valeur}</p>
                <p className="text-15 text-muted mb-2">{libelle}</p>
                <p className="text-15 text-ink">{texte}</p>
              </div>
            ))}
          </div>

          {children}

          {/* Profil + appel à l'action, en deux colonnes comme la maquette */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-2xl border border-line p-8 shadow-card flex flex-col">
              <h2 className="text-18.5 font-bold text-navy mb-1.5">
                Avant de commencer — votre profil
              </h2>
              <p className="text-15 leading-[1.5] text-muted mb-6">
                Ces informations permettent de personnaliser les conseils tout au long de
                l&rsquo;atelier.
              </p>
              <button
                onClick={() => router.push('/company-profile')}
                className="mt-auto self-start inline-flex items-center gap-2 px-5 py-3 border border-line rounded-xl text-15 font-bold text-navy hover:bg-surface transition-colors"
              >
                <UserCog className="h-5 w-5" aria-hidden />
                Compléter mon profil
              </button>
            </div>

            <div className="rounded-[18.5px] p-8 bg-gradient-to-br from-navy-dark to-navy shadow-card">
              <h2 className="text-20.5 font-bold text-white mb-1.5">{ctaTitre}</h2>
              <p className="text-15 leading-[1.5] text-white/60 mb-6">{ctaSousTitre}</p>

              <ol className="flex flex-wrap gap-2 mb-7">
                {etapes.map((etape) => (
                  <li
                    key={etape}
                    className="text-14 text-white/75 bg-white/10 rounded-[23px] px-3 py-1"
                  >
                    {etape}
                  </li>
                ))}
              </ol>

              <div className="flex flex-wrap items-center gap-4">
                <button
                  type="button"
                  disabled={ctaIndisponible}
                  onClick={ctaHref ? () => router.push(ctaHref) : undefined}
                  className={
                    ctaIndisponible
                      ? 'inline-flex items-center gap-2 px-7 py-4 rounded-[14px] text-17 font-bold text-white/40 bg-white/10 cursor-not-allowed'
                      : `inline-flex items-center gap-2 px-7 py-4 rounded-[14px] text-17 font-bold text-white ${c.fond} transition-colors`
                  }
                >
                  Démarrer l&rsquo;atelier <ArrowRight className="h-5 w-5" aria-hidden />
                </button>
                {ctaIndisponible && (
                  <span className="text-12.5 font-bold uppercase tracking-[1.2px] text-white/50">
                    {ctaMentionIndispo}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </AppShell>
    </>
  );
};

export default ModuleLanding;
