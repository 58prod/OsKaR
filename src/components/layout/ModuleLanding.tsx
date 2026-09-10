import React from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { ArrowRight, Check, type LucideIcon } from 'lucide-react';
import { ChoixSecteur } from '@/components/ui/ChoixSecteur';
import { useSecteurChoisi } from '@/hooks/useSecteurChoisi';
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
 *   pastille      14px / 400 / blanc 75 % sur blanc 10 %, rayon 23px, 4/12,
 *                 point de 6px couleur du pilier a 5px du texte, ecart 10.5px
 *   bouton        17px / 700 / blanc sur couleur du pilier, rayon 14px, 16/28
 */

export type Pilier = 'vision' | 'fit' | 'finance' | 'okr' | 'team';

/** Classes ecrites en toutes lettres : Tailwind ne resout pas les noms construits. */
const COULEURS: Record<Pilier, { texte: string; fond: string; icone: string; pastilleBord: string; point: string }> = {
  vision: {
    texte: 'text-vision',
    fond: 'bg-vision hover:bg-vision-dark',
    icone: 'bg-vision-light text-vision-dark',
    pastilleBord: 'border-vision/20',
    point: 'bg-vision',
  },
  fit: {
    texte: 'text-fit',
    fond: 'bg-fit hover:bg-fit-dark',
    icone: 'bg-fit-light text-fit-dark',
    pastilleBord: 'border-fit/20',
    point: 'bg-fit',
  },
  finance: {
    texte: 'text-finance',
    fond: 'bg-finance hover:bg-finance-dark',
    icone: 'bg-finance-light text-finance-dark',
    pastilleBord: 'border-finance/20',
    point: 'bg-finance',
  },
  okr: {
    texte: 'text-okr',
    fond: 'bg-okr hover:bg-okr-dark',
    icone: 'bg-okr-light text-okr-dark',
    pastilleBord: 'border-okr/20',
    point: 'bg-okr',
  },
  team: {
    texte: 'text-team',
    fond: 'bg-team hover:bg-team-dark',
    icone: 'bg-team-light text-team-dark',
    pastilleBord: 'border-team/20',
    point: 'bg-team',
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
  const { secteur, choisirSecteur, enregistre } = useSecteurChoisi();
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
              {/* La maquette pose ici la liste des secteurs : c'est le moment
                  où l'on apprend le métier, et tous les exemples de l'atelier
                  s'y adaptent ensuite. */}
              <div className="mt-auto">
                <label htmlFor="secteur-module" className="block text-sm font-semibold text-ink mb-1.5">
                  Votre secteur d&rsquo;activité
                </label>
                <ChoixSecteur id="secteur-module" value={secteur} onChange={choisirSecteur} />
                {secteur && (
                  <p className="flex items-center gap-1.5 text-13 text-teal-dark mt-2">
                    <Check className="h-3.5 w-3.5 shrink-0" aria-hidden />
                    {enregistre
                      ? 'Enregistré : les exemples de l’atelier sont adaptés à votre métier.'
                      : 'Les exemples sont adaptés. Créez un compte pour le conserver.'}
                  </p>
                )}
              </div>
            </div>

            <div className="rounded-[18.5px] p-8 bg-gradient-to-br from-navy-dark to-navy shadow-card">
              <h2 className="text-20.5 font-bold text-white mb-1.5">{ctaTitre}</h2>
              <p className="text-15 leading-[1.5] text-white/60 mb-6">{ctaSousTitre}</p>

              <ol className="flex flex-wrap gap-[10.5px] mb-7">
                {etapes.map((etape) => (
                  <li
                    key={etape}
                    className="inline-flex items-center gap-[5px] text-14 text-white/75 bg-white/10 rounded-[23px] px-3 py-1"
                  >
                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${c.point}`} aria-hidden />
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
