import React, { useCallback, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Loader2, Check, ArrowLeft, ArrowRight } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthModal, type AuthModalTab } from '@/components/layout/AuthModal';
import { UserMenu } from '@/components/layout/UserMenu';
import { EtapeVerrouillee } from '@/components/okr/EtapeVerrouillee';
import { BTN_OUTLINE, BTN_PRIMARY } from '@/components/okr/okrFlux';
import {
  EtapeCibles,
  EtapeObjectifsVision,
  EtapeProbleme,
  EtapeProjection,
  EtapeSens,
  EtapeValeurs,
  EtapeVision,
} from '@/components/vision/EtapesVision';
import { SyntheseVision } from '@/components/vision/SyntheseVision';
import { useAppStore } from '@/store/useAppStore';
import { useSubscription } from '@/hooks/useSubscription';
import { useExemples } from '@/hooks/useExemples';
import { useVision } from '@/hooks/useVision';
import { etapeAccessible, niveauAcces } from '@/lib/acces';
import { ETAPES_VISION, etapeRemplie, NB_ETAPES_VISION, type EtapeVision as Etape } from '@/lib/vision/types';

/*
 * Atelier Vision — transposition de `Oskar/plateforme/vision-atelier.html`.
 *
 * Sept étapes puis une synthèse, l'étape courante portée par l'URL
 * (?etape=cibles…). Mêmes règles que l'atelier OKR : la première étape est
 * offerte avec un compte gratuit, les suivantes font partie des formules.
 * Ce qui est saisi est enregistré sans bouton dédié (voir `useVision`).
 */

const LIBELLES: Record<Etape, string> = {
  sens: 'Le sens',
  cibles: 'Cibles & acteurs',
  probleme: 'Le problème',
  projection: 'Vision à 1 an',
  valeurs: 'Valeurs',
  vision: 'Votre vision',
  objectifs: 'Objectifs',
  synthese: 'Synthèse',
};

/** Ce que contient chaque étape, montré quand elle est encore verrouillée. */
const APERCU: Partial<Record<Etape, string[]>> = {
  cibles: [
    'Lister vos cibles prioritaires et les qualifier',
    'Cartographier les acteurs qui pèsent sur votre activité',
    'Voir d’un coup d’œil qui décide, qui finance, qui prescrit',
  ],
  probleme: [
    'Formuler la difficulté concrète que vous résolvez',
    'L’ancrer dans le vécu de vos clients, pas dans votre solution',
  ],
  projection: [
    'Poser où vous serez dans 12 mois, côté entreprise',
    'Et côté personnel : rythme, énergie, limites',
  ],
  valeurs: [
    'Choisir trois valeurs au maximum',
    'Traduire chacune en un comportement observable',
  ],
  vision: [
    'Obtenir une première formulation à partir de vos réponses',
    'La retravailler jusqu’à ce qu’elle soit vraiment la vôtre',
  ],
  objectifs: [
    'Transformer votre vision en trois objectifs au maximum',
    'Dire pour chacun pourquoi il est prioritaire et comment le mesurer',
  ],
  synthese: [
    'Réunir tout votre travail sur une page',
    'La partager avec votre équipe ou l’afficher',
    'Basculer vos objectifs vers le pilier OKR',
  ],
};

const VisionAtelierPage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();
  const userId = isAuthenticated ? user?.id : undefined;

  const etape: Etape = useMemo(() => {
    const q = router.query.etape;
    return typeof q === 'string' && (ETAPES_VISION as readonly string[]).includes(q) ? (q as Etape) : 'sens';
  }, [router.query.etape]);

  const index = ETAPES_VISION.indexOf(etape);

  const { data: abonnement } = useSubscription(userId);
  const niveau = niveauAcces(isAuthenticated, abonnement);
  const ouverte = etapeAccessible(niveau, index);

  const exemples = useExemples();
  const { atelier, modifier, charge, enregistrement, enregistrerMaintenant } = useVision(userId);

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<AuthModalTab>('register');
  const ouvrirAuth = useCallback((tab: AuthModalTab) => {
    setAuthTab(tab);
    setAuthOpen(true);
  }, []);

  const allerA = useCallback(
    async (e: Etape) => {
      await enregistrerMaintenant();
      router.push({ pathname: '/app/vision', query: e === 'sens' ? {} : { etape: e } }, undefined, { shallow: true });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router, enregistrerMaintenant]
  );

  const topbarActions = !authReady ? null : isAuthenticated ? (
    <UserMenu />
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
        <title>OsKaR Vision · Votre cap à 1 an | OsKaR</title>
      </Head>
      <AppShell
        title="OsKaR Vision"
        topbarTitle={<span className="text-vision">OSKAR VISION — {LIBELLES[etape]}</span>}
        topbarActions={topbarActions}
      >
        {!authReady ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-vision mb-4" aria-hidden />
            <p className="text-14">Chargement de votre atelier…</p>
          </div>
        ) : !isAuthenticated || !user ? (
          <Visiteur onConnexion={() => ouvrirAuth('login')} onInscription={() => ouvrirAuth('register')} />
        ) : (
          <>
            <FilEtapes atelier={atelier} etape={etape} onChange={allerA} />

            {!ouverte ? (
              <EtapeVerrouillee
                niveau={niveau}
                titreEtape={`Étape ${index + 1} · ${LIBELLES[etape]}`}
                apercu={APERCU[etape] ?? []}
                onCreerCompte={() => ouvrirAuth('register')}
              />
            ) : !charge ? (
              <div className="flex items-center gap-2 text-muted py-20" aria-live="polite">
                <Loader2 className="h-5 w-5 animate-spin text-vision" aria-hidden />
                <span className="text-14">Chargement de vos réponses…</span>
              </div>
            ) : (
              <>
                {etape === 'sens' && <EtapeSens {...props} />}
                {etape === 'cibles' && <EtapeCibles {...props} />}
                {etape === 'probleme' && <EtapeProbleme {...props} />}
                {etape === 'projection' && <EtapeProjection {...props} />}
                {etape === 'valeurs' && <EtapeValeurs {...props} />}
                {etape === 'vision' && <EtapeVision {...props} />}
                {etape === 'objectifs' && <EtapeObjectifsVision {...props} />}
                {etape === 'synthese' && <SyntheseVision atelier={atelier} />}

                <Navigation etape={etape} index={index} onChange={allerA} enregistrement={enregistrement} />
              </>
            )}
          </>
        )}
      </AppShell>
      <AuthModal
        open={authOpen}
        onClose={() => setAuthOpen(false)}
        initialTab={authTab}
        redirectTo={etape === 'sens' ? '/app/vision' : `/app/vision?etape=${etape}`}
      />
    </>
  );
};

/** Fil des huit étapes, dans l'esprit des onglets du parcours OKR. */
const FilEtapes: React.FC<{
  atelier: Parameters<typeof etapeRemplie>[0];
  etape: Etape;
  onChange: (e: Etape) => void;
}> = ({ atelier, etape, onChange }) => {
  const courante = ETAPES_VISION.indexOf(etape);
  return (
    <nav aria-label="Étapes de l’atelier Vision" className="bg-white border border-line rounded-card shadow-card mb-7 p-1.5 flex flex-wrap gap-1">
      {ETAPES_VISION.map((e, i) => {
        const active = e === etape;
        const faite = etapeRemplie(atelier, e);
        const passee = i < courante;
        return (
          <button
            key={e}
            type="button"
            onClick={() => onChange(e)}
            aria-current={active ? 'step' : undefined}
            className={`flex items-center gap-2 px-3 py-2.5 rounded-[9px] text-13 font-semibold transition-all ${
              active ? 'bg-vision-light text-vision-dark' : 'text-muted hover:bg-surface hover:text-navy'
            }`}
          >
            <span
              className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-11 font-extrabold shrink-0 ${
                active || faite || passee ? 'bg-vision text-white' : 'bg-vision/10 text-vision-dark'
              }`}
            >
              {faite && !active ? <Check className="w-3 h-3" aria-hidden /> : i + 1 <= NB_ETAPES_VISION ? i + 1 : '★'}
            </span>
            <span className="hidden sm:inline">{LIBELLES[e]}</span>
          </button>
        );
      })}
    </nav>
  );
};

/** Précédent / suivant, avec l'état d'enregistrement. */
const Navigation: React.FC<{
  etape: Etape;
  index: number;
  onChange: (e: Etape) => void;
  enregistrement: 'repos' | 'en cours' | 'echec';
}> = ({ index, onChange, enregistrement }) => (
  <div className="flex flex-wrap items-center justify-between gap-3 mt-8 max-w-3xl">
    <div>
      {index > 0 && (
        <button type="button" onClick={() => onChange(ETAPES_VISION[index - 1])} className={BTN_OUTLINE}>
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Retour
        </button>
      )}
    </div>
    <div className="flex items-center gap-3">
      <span className="text-12.5 text-muted" aria-live="polite">
        {enregistrement === 'en cours' && 'Enregistrement…'}
        {enregistrement === 'echec' && 'Enregistrement impossible'}
      </span>
      {index < ETAPES_VISION.length - 1 && (
        <button type="button" onClick={() => onChange(ETAPES_VISION[index + 1])} className={BTN_PRIMARY}>
          Suivant
          <ArrowRight className="h-4 w-4" aria-hidden />
        </button>
      )}
    </div>
  </div>
);

/** Vue sans compte : ce que l'atelier apporte, et l'invitation à commencer. */
const Visiteur: React.FC<{ onConnexion: () => void; onInscription: () => void }> = ({ onConnexion, onInscription }) => (
  <div className="max-w-3xl">
    <div className="relative overflow-hidden rounded-[18px] px-10 py-9 mb-7 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
      <div
        className="absolute -right-10 -top-10 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(14,165,233,0.16)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-vision mb-2">Pilier 01 · OsKaR Vision</div>
        <h1 className="text-[24px] leading-[1.25] font-extrabold text-white mb-2">
          Clarifiez votre cap, en sept étapes.
        </h1>
        <p className="text-14.5 leading-[1.6] text-white/60 max-w-[480px]">
          Le sens, vos cibles, le problème que vous résolvez, votre projection à un an, vos valeurs,
          puis votre vision et les objectifs qui en découlent.
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

export default VisionAtelierPage;
