import React, { useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthModal, type AuthModalTab } from '@/components/layout/AuthModal';
import { UserMenu } from '@/components/layout/UserMenu';
import { EtapeVerrouillee } from '@/components/okr/EtapeVerrouillee';
import { BTN_OUTLINE, BTN_PRIMARY } from '@/components/okr/okrFlux';
import { BarreEtapesAtelier } from '@/components/atelier/BarreEtapesAtelier';
import { ConseilsFit } from '@/components/fit/ConseilsFit';
import { DiagnosticFit } from '@/components/fit/DiagnosticFit';
import { EtapeConcurrence, EtapeDifferenciation, EtapeOffre, EtapeSignaux } from '@/components/fit/EtapesFit';
import { BTN_GHOST, BTN_NAVY } from '@/components/atelier/champs';
import { useAppStore } from '@/store/useAppStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useExemples } from '@/hooks/useExemples';
import { useAtelier } from '@/hooks/useAtelier';
import { etapeAccessible, niveauAcces } from '@/lib/acces';
import {
  ATELIER_FIT_VIDE,
  ETAPES_FIT,
  LIBELLES_ETAPES_FIT,
  fusionnerFit,
  type AtelierFit,
  type EtapeFit,
} from '@/lib/fit/types';

/*
 * Atelier Fit — transposition de `Oskar/plateforme/fit-atelier.html`.
 *
 * Cinq étapes, diagnostic compris, l'étape courante portée par l'URL
 * (?etape=differenciation…). Mêmes règles d'accès que les autres ateliers :
 * la première étape est offerte avec un compte gratuit, les suivantes font
 * partie des formules. Ce qui est saisi est enregistré sans bouton dédié.
 */

/** Ce que contient chaque étape, montré quand elle est encore verrouillée. */
const APERCU: Partial<Record<EtapeFit, string[]>> = {
  differenciation: [
    'Formuler l’avantage que vos clients perçoivent vraiment',
    'Vérifier s’ils l’expriment spontanément, et s’il est durable',
  ],
  concurrence: [
    'Cartographier concurrents directs, indirects et statu quo',
    'Dire ce qu’ils font bien et votre avantage face à eux',
    'Comprendre pourquoi un client vous choisit',
  ],
  signaux: [
    'Réunir vos retours clients et vos verbatims',
    'Mesurer rétention, croissance organique et satisfaction',
    'Lire ce que dit la demande entrante',
  ],
  diagnostic: [
    'Obtenir votre statut Market Fit, calculé sur vos réponses',
    'Voir vos quatre dimensions d’un coup d’œil',
    'Repartir avec la prochaine étape recommandée et votre PDF',
  ],
};

/** Le PDF n'est chargé qu'au clic : jsPDF n'alourdit pas la page. */
async function telecharger(atelier: AtelierFit) {
  const { telechargerPdfFit } = await import('@/lib/fit/pdf');
  telechargerPdfFit(atelier);
}

const FitAtelierPage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();
  const userId = isAuthenticated ? user?.id : undefined;

  const etape: EtapeFit = useMemo(() => {
    const q = router.query.etape;
    return typeof q === 'string' && (ETAPES_FIT as readonly string[]).includes(q) ? (q as EtapeFit) : 'offre';
  }, [router.query.etape]);

  const index = ETAPES_FIT.indexOf(etape);

  const { data: abonnement } = useSubscription(userId);
  const niveau = niveauAcces(isAuthenticated, abonnement);
  const ouverte = etapeAccessible(niveau, index);

  const exemples = useExemples();
  const { atelier, modifier, charge, enregistrement, enregistrerMaintenant } = useAtelier<AtelierFit>(
    'fit',
    userId,
    ATELIER_FIT_VIDE,
    fusionnerFit
  );

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthModalTab>('register');
  const ouvrirAuth = useCallback((tab: AuthModalTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const allerA = useCallback(
    async (e: EtapeFit) => {
      await enregistrerMaintenant();
      router.push({ pathname: '/app/fit', query: e === 'offre' ? {} : { etape: e } }, undefined, { shallow: true });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router, enregistrerMaintenant]
  );

  const topbarActions = !authReady ? null : isAuthenticated ? (
    <>
      <button type="button" onClick={() => telecharger(atelier)} className={BTN_GHOST}>
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
        <title>OSKAR Market Fit · Atelier | Oskar</title>
      </Head>
      <AppShell
        title="OSKAR Market Fit"
        topbarTitle={
          <span className="flex items-center gap-[10.5px] text-15">
            <Link href="/" className="text-muted font-medium hover:text-navy transition-colors">
              OSKAR
            </Link>
            <span className="text-line" aria-hidden>›</span>
            <Link href="/fit" className="text-muted font-medium hover:text-navy transition-colors">
              Fit
            </Link>
            <span className="text-line" aria-hidden>›</span>
            <span className="text-fit font-bold">Atelier</span>
          </span>
        }
        topbarActions={topbarActions}
      >
        {!authReady ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-fit mb-4" aria-hidden />
            <p className="text-14">Chargement de votre atelier…</p>
          </div>
        ) : !isAuthenticated || !user ? (
          <Visiteur onConnexion={() => ouvrirAuth('login')} onInscription={() => ouvrirAuth('register')} />
        ) : (
          <>
            {/* En-tête compact de la maquette : filet bas, 16px dessous, 18px avant le contenu. */}
            <header className="flex flex-wrap items-center justify-between gap-3 mb-[18px] pb-4 border-b border-line">
              <div>
                <div className="text-14 font-bold uppercase tracking-[1.4px] text-teal mb-1">Module 02 — OSKAR Market Fit</div>
                <h1 className="text-23 font-extrabold text-navy leading-[1.6]">Atelier Market Fit</h1>
              </div>
              <Link
                href="/fit"
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

            {/* Deux colonnes relevées sur la maquette : le formulaire (barre
                d'étapes comprise) à gauche, les conseils sur 340px à droite,
                23px d'écart. */}
            <div className="grid gap-[23px] lg:grid-cols-[minmax(0,1fr)_340px] items-start">
              <div className="min-w-0">
                <BarreEtapesAtelier
                  pilier="fit"
                  nom="Fit"
                  etapes={ETAPES_FIT}
                  libelles={LIBELLES_ETAPES_FIT}
                  etape={etape}
                  onChange={allerA}
                />

                {!ouverte ? (
                  <EtapeVerrouillee
                    niveau={niveau}
                    titreEtape={`Étape ${index + 1} · ${LIBELLES_ETAPES_FIT[etape]}`}
                    apercu={APERCU[etape] ?? []}
                    onCreerCompte={() => ouvrirAuth('register')}
                  />
                ) : !charge ? (
                  <div className="flex items-center gap-2 text-muted py-20" aria-live="polite">
                    <Loader2 className="h-5 w-5 animate-spin text-fit" aria-hidden />
                    <span className="text-14">Chargement de vos réponses…</span>
                  </div>
                ) : (
                  <>
                    {etape === 'offre' && <EtapeOffre {...props} />}
                    {etape === 'differenciation' && <EtapeDifferenciation {...props} />}
                    {etape === 'concurrence' && <EtapeConcurrence {...props} />}
                    {etape === 'signaux' && <EtapeSignaux {...props} />}
                    {etape === 'diagnostic' && <DiagnosticFit atelier={atelier} />}

                    <Navigation
                      index={index}
                      onChange={allerA}
                      enregistrement={enregistrement}
                      onPdf={() => telecharger(atelier)}
                    />
                  </>
                )}
              </div>
              <ConseilsFit etape={etape} exemples={exemples} />
            </div>
          </>
        )}
      </AppShell>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authTab}
        redirectTo={etape === 'offre' ? '/app/fit' : `/app/fit?etape=${etape}`}
      />
    </>
  );
};

/**
 * Pied d'étape de la maquette : « ← Retour » à gauche (absent à l'étape 1),
 * « Suivant → » en navy à droite, « Voir le diagnostic → » à l'étape 4, et
 * « Télécharger PDF » au diagnostic.
 */
const Navigation: React.FC<{
  index: number;
  onChange: (e: EtapeFit) => void;
  enregistrement: 'repos' | 'en cours' | 'echec';
  onPdf: () => void;
}> = ({ index, onChange, enregistrement, onPdf }) => {
  const dernier = index === ETAPES_FIT.length - 1;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${dernier ? 'mt-[18px]' : 'mt-2.5'}`}>
      <div>
        {index > 0 && (
          <button type="button" onClick={() => onChange(ETAPES_FIT[index - 1])} className={BTN_OUTLINE}>
            ← Retour
          </button>
        )}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-12.5 text-muted" aria-live="polite">
          {enregistrement === 'en cours' && 'Enregistrement…'}
          {enregistrement === 'echec' && 'Enregistrement impossible'}
        </span>
        {dernier ? (
          <button type="button" onClick={onPdf} className={BTN_GHOST}>
            Télécharger PDF
          </button>
        ) : (
          <button type="button" onClick={() => onChange(ETAPES_FIT[index + 1])} className={BTN_NAVY}>
            {index === ETAPES_FIT.length - 2 ? 'Voir le diagnostic →' : 'Suivant →'}
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
        className="absolute -right-10 -top-10 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(34,197,94,0.16)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-fit mb-2">Pilier 02 · OSKAR Market Fit</div>
        <h1 className="text-[24px] leading-[1.25] font-extrabold text-white mb-2">
          Vérifiez que votre offre répond à un vrai besoin marché.
        </h1>
        <p className="text-14.5 leading-[1.6] text-white/60 max-w-[480px]">
          Votre offre, votre différenciation, votre environnement concurrentiel et vos signaux terrain, puis un
          diagnostic Market Fit calculé sur vos réponses.
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

export default FitAtelierPage;
