import React, { useCallback, useMemo } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { ouvrirConnexion, type OngletAuth } from '@/store/useConnexion';
import { UserMenu } from '@/components/layout/UserMenu';
import { EtapeVerrouillee } from '@/components/okr/EtapeVerrouillee';
import { BTN_OUTLINE, BTN_PRIMARY } from '@/components/okr/okrFlux';
import { BarreEtapesAtelier } from '@/components/atelier/BarreEtapesAtelier';
import { BTN_GHOST, BTN_NAVY } from '@/components/atelier/champs';
import { ConseilsFinance } from '@/components/finance/ConseilsFinance';
import { SyntheseFinance } from '@/components/finance/SyntheseFinance';
import { EtapeCouts, EtapeDecisions, EtapeRentabilite, EtapeRevenus } from '@/components/finance/EtapesFinance';
import { useAppStore } from '@/store/useAppStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useExemples } from '@/hooks/useExemples';
import { useAtelier } from '@/hooks/useAtelier';
import { etapeAccessible, niveauAcces } from '@/lib/acces';
import {
  ATELIER_FINANCE_VIDE,
  ETAPES_FINANCE,
  LIBELLES_ETAPES_FINANCE,
  fusionnerFinance,
  type AtelierFinance,
  type EtapeFinance,
} from '@/lib/finance/types';

/*
 * Atelier Finance — transposition de `Oskar/plateforme/finance-atelier.html`.
 *
 * Cinq étapes, synthèse comprise, l'étape courante portée par l'URL
 * (?etape=couts…). Mêmes règles d'accès que les autres ateliers : la première
 * étape est offerte avec un compte gratuit, les suivantes font partie des
 * formules. Ce qui est saisi est enregistré sans bouton dédié (table
 * `ateliers`, pilier « finance »).
 */

/** Ce que contient chaque étape, montré quand elle est encore verrouillée. */
const APERCU: Partial<Record<EtapeFinance, string[]>> = {
  couts: [
    'Séparer coûts variables et coûts fixes',
    'Voir votre marge brute se calculer au fil de la saisie',
    'Repérer les coûts à réduire sans dégrader la qualité',
  ],
  rentabilite: [
    'Calculer votre point mort, votre marge de sécurité et votre runway',
    'Situer votre CA sur la jauge du point mort',
    'Tester un objectif de CA et lire ce qu’il implique',
  ],
  decisions: [
    'Formaliser trois décisions financières à 90 jours',
    'Un levier, un responsable, un délai et un impact pour chacune',
  ],
  synthese: ['Clore l’atelier et exporter votre travail', 'Enchaîner sur le pilier OKR'],
};

const FinanceAtelierPage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();
  const userId = isAuthenticated ? user?.id : undefined;

  const etape: EtapeFinance = useMemo(() => {
    const q = router.query.etape;
    return typeof q === 'string' && (ETAPES_FINANCE as readonly string[]).includes(q) ? (q as EtapeFinance) : 'revenus';
  }, [router.query.etape]);

  const index = ETAPES_FINANCE.indexOf(etape);

  const { data: abonnement } = useSubscription(userId);
  const niveau = niveauAcces(isAuthenticated, abonnement);
  const ouverte = etapeAccessible(niveau, index);

  const exemples = useExemples();
  const { atelier, modifier, charge, enregistrement, enregistrerMaintenant } = useAtelier<AtelierFinance>(
    'finance',
    userId,
    ATELIER_FINANCE_VIDE,
    fusionnerFinance
  );

  // Après connexion, on revient à l'étape que la personne voulait faire.
  const ouvrirAuth = useCallback(
    (tab: OngletAuth) =>
      ouvrirConnexion(tab, etape === 'revenus' ? '/app/finance' : `/app/finance?etape=${etape}`),
    [etape]
  );

  const allerA = useCallback(
    async (e: EtapeFinance) => {
      await enregistrerMaintenant();
      router.push({ pathname: '/app/finance', query: e === 'revenus' ? {} : { etape: e } }, undefined, {
        shallow: true,
      });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router, enregistrerMaintenant]
  );

  // La maquette exporte par l'impression du navigateur.
  const exporter = () => window.print();

  const topbarActions = !authReady ? null : isAuthenticated ? (
    <>
      <button type="button" onClick={exporter} className={BTN_GHOST}>
        Exporter PDF
      </button>
      <button type="button" onClick={enregistrerMaintenant} className={BTN_PRIMARY}>
        {enregistrement === 'en cours' ? 'Enregistrement…' : 'Sauvegarder →'}
      </button>
      <UserMenu />
    </>
  ) : (
    <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={() => ouvrirAuth('login')}
        className="px-4 py-2 text-14 font-semibold text-navy hover:text-navy-light transition-colors"
      >
        Connexion
      </button>
      <button
        type="button"
        onClick={() => ouvrirAuth('register')}
        className="px-4 py-2 bg-teal text-navy-dark text-14 font-bold rounded-lg shadow-sm hover:bg-teal-dark transition-all"
      >
        Commencer gratuitement →
      </button>
    </div>
  );

  const props = { atelier, modifier, exemples };

  return (
    <>
      <Head>
        <title>OSKAR Finance · Atelier | Oskar</title>
      </Head>
      <AppShell
        title="OSKAR Finance"
        topbarTitle={
          <span className="flex items-center gap-[10.5px] text-15">
            <Link href="/" className="text-muted font-medium hover:text-navy transition-colors">
              OSKAR
            </Link>
            <span className="text-line" aria-hidden>›</span>
            <Link href="/finance" className="text-muted font-medium hover:text-navy transition-colors">
              Finance
            </Link>
            <span className="text-line" aria-hidden>›</span>
            <span className="text-finance font-bold">Atelier</span>
          </span>
        }
        topbarActions={topbarActions}
      >
        {!authReady ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-finance mb-4" aria-hidden />
            <p className="text-14">Chargement de votre atelier…</p>
          </div>
        ) : !isAuthenticated || !user ? (
          <Visiteur onConnexion={() => ouvrirAuth('login')} onInscription={() => ouvrirAuth('register')} />
        ) : (
          <>
            {/* En-tête compact, « identique à fit-atelier » dans la maquette. */}
            <header className="flex flex-wrap items-center justify-between gap-3 mb-[18px] pb-4 border-b border-line">
              <div>
                <div className="text-14 font-bold uppercase tracking-[1.4px] text-finance mb-1">
                  Module 03 — OSKAR Finance
                </div>
                <h1 className="text-23 font-extrabold text-navy leading-[1.6]">Atelier Finance &amp; Marge</h1>
              </div>
              <Link
                href="/finance"
                className="flex items-center gap-[5px] text-15 text-muted hover:text-navy transition-colors"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  strokeLinecap="round"
                  className="w-3.5 h-3.5"
                  aria-hidden
                >
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                Retour à l’accueil
              </Link>
            </header>

            <div className="grid gap-[23px] lg:grid-cols-[minmax(0,1fr)_340px] items-start">
              <div className="min-w-0">
                <BarreEtapesAtelier
                  pilier="finance"
                  nom="Finance"
                  etapes={ETAPES_FINANCE}
                  libelles={LIBELLES_ETAPES_FINANCE}
                  etape={etape}
                  onChange={allerA}
                />

                {!ouverte ? (
                  <EtapeVerrouillee
                    niveau={niveau}
                    titreEtape={`Étape ${index + 1} · ${LIBELLES_ETAPES_FINANCE[etape]}`}
                    apercu={APERCU[etape] ?? []}
                    onCreerCompte={() => ouvrirAuth('register')}
                  />
                ) : !charge ? (
                  <div className="flex items-center gap-2 text-muted py-20" aria-live="polite">
                    <Loader2 className="h-5 w-5 animate-spin text-finance" aria-hidden />
                    <span className="text-14">Chargement de vos réponses…</span>
                  </div>
                ) : (
                  <>
                    {etape === 'revenus' && <EtapeRevenus {...props} />}
                    {etape === 'couts' && <EtapeCouts {...props} />}
                    {etape === 'rentabilite' && <EtapeRentabilite {...props} />}
                    {etape === 'decisions' && <EtapeDecisions {...props} />}
                    {etape === 'synthese' ? (
                      <SyntheseFinance onRevoir={() => allerA('revenus')} onPdf={exporter} />
                    ) : (
                      <Navigation index={index} onChange={allerA} enregistrement={enregistrement} />
                    )}
                  </>
                )}
              </div>
              <ConseilsFinance etape={etape} />
            </div>
          </>
        )}
      </AppShell>
    </>
  );
};

/**
 * Pied d'étape de la maquette : filet haut, 28px au-dessus. À gauche « Étape 1
 * sur 4 » puis « ← <étape précédente> » ; à droite « <étape suivante> → »,
 * « Voir la synthèse → » à l'étape 4.
 */
const Navigation: React.FC<{
  index: number;
  onChange: (e: EtapeFinance) => void;
  enregistrement: 'repos' | 'en cours' | 'echec';
}> = ({ index, onChange, enregistrement }) => {
  const precedente = ETAPES_FINANCE[index - 1];
  const suivante = ETAPES_FINANCE[index + 1];
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-7 pt-5 border-t border-line">
      {precedente ? (
        <button type="button" onClick={() => onChange(precedente)} className={BTN_GHOST}>
          ← {LIBELLES_ETAPES_FINANCE[precedente]}
        </button>
      ) : (
        <span className="text-14 text-muted">Étape 1 sur 4</span>
      )}
      <div className="flex items-center gap-3">
        <span className="text-12.5 text-muted" aria-live="polite">
          {enregistrement === 'en cours' && 'Enregistrement…'}
          {enregistrement === 'echec' && 'Enregistrement impossible'}
        </span>
        {suivante && (
          <button type="button" onClick={() => onChange(suivante)} className={BTN_NAVY}>
            {suivante === 'synthese' ? 'Voir la synthèse' : LIBELLES_ETAPES_FINANCE[suivante]} →
          </button>
        )}
      </div>
    </div>
  );
};

/** Vue sans compte : ce que l'atelier apporte, et l'invitation à commencer. */
const Visiteur: React.FC<{ onConnexion: () => void; onInscription: () => void }> = ({ onConnexion, onInscription }) => (
  <div className="max-w-3xl">
    <div className="relative overflow-hidden rounded-[18px] px-10 py-9 mb-7 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
      <div
        className="absolute -right-10 -top-10 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(245,158,11,0.16)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-finance mb-2">Pilier 03 · OSKAR Finance</div>
        <h1 className="text-[24px] leading-[1.25] font-extrabold text-white mb-2">
          Maîtrisez votre marge. Solidifiez votre modèle économique.
        </h1>
        <p className="text-14.5 leading-[1.6] text-white/60 max-w-[480px]">
          Vos revenus, vos coûts et votre marge, votre seuil de rentabilité, puis trois décisions financières à
          engager dans les 90 jours.
        </p>
      </div>
    </div>
    <div className="bg-white border border-line rounded-card shadow-card px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-5">
      <div className="flex-1">
        <p className="text-15.5 font-bold text-navy mb-1">La première étape est offerte</p>
        <p className="text-13.5 text-muted">
          Un compte gratuit suffit pour commencer et retrouver vos réponses à chaque visite.
        </p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <button type="button" onClick={onConnexion} className={BTN_OUTLINE}>
          Connexion
        </button>
        <button type="button" onClick={onInscription} className={BTN_PRIMARY}>
          Commencer gratuitement →
        </button>
      </div>
    </div>
  </div>
);

export default FinanceAtelierPage;
