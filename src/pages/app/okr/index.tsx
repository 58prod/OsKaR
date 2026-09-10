import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { Plus, Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { AuthModal } from '@/components/layout/AuthModal';
import { UserMenu } from '@/components/layout/UserMenu';
import { OkrTabs } from '@/components/okr/OkrTabs';
import { EtapeObjectifs } from '@/components/okr/EtapeObjectifs';
import { EtapeTrimestre } from '@/components/okr/EtapeTrimestre';
import { EtapeActions } from '@/components/okr/EtapeActions';
import { EtapeVerrouillee } from '@/components/okr/EtapeVerrouillee';
import { ANNEE, BTN_OUTLINE, BTN_PRIMARY, ETAPES, MAX_OBJECTIFS, trimLabel, type Etape } from '@/components/okr/okrFlux';
import { useAppStore } from '@/store/useAppStore';
import { useAmbitions } from '@/hooks/useAmbitions';
import { useQuarterlyObjectives } from '@/hooks/useQuarterlyObjectives';
import { useQuarterlyKeyResultsByUser } from '@/hooks/useQuarterlyKeyResults';
import { useActions } from '@/hooks/useActions';
import { useSubscription } from '@/hooks/useSubscription';
import { etapeAccessible, niveauAcces } from '@/lib/acces';
import { getCurrentQuarter } from '@/utils';
import type { Quarter } from '@/types';

/*
 * OsKaR OKR — parcours en 3 étapes, transposition de okr.html :
 *   1. Mes 3 objectifs annuels   2. Mon trimestre   3. Mes actions
 *
 * L'étape courante vit dans l'URL (?etape=trimestre|actions) pour être partageable ;
 * les données sont chargées ici une fois et passées aux trois écrans.
 * L'ancien espace en huit pages (dashboard, canvas, gestion…) reste accessible
 * par ses URL sous /app/okr/*, mais n'est plus le point d'entrée du pilier.
 */

const CLE_TRIMESTRE = 'oskar.okr.trimestre';

/** Ce que contient chaque étape, montré quand elle est encore verrouillée. */
const APERCU_ETAPES: Record<Etape, string[]> = {
  annee: [],
  trimestre: [
    'Décliner chacun de vos objectifs annuels en un objectif pour le trimestre',
    'Y attacher deux résultats clés chiffrés, que vous mettez à jour au fil des semaines',
    'Suivre votre progression trimestre après trimestre',
  ],
  actions: [
    'Transformer vos résultats clés en actions concrètes',
    'Les suivre dans un tableau à trois colonnes : à faire, en cours, terminé',
    'Garder le lien entre chaque action et le résultat clé qu’elle sert',
  ],
};

function lireTrimestre(): Quarter {
  try {
    const v = window.localStorage.getItem(CLE_TRIMESTRE);
    if (v === 'Q1' || v === 'Q2' || v === 'Q3' || v === 'Q4') return v as Quarter;
  } catch {
    /* stockage indisponible : on retombe sur le trimestre courant */
  }
  return getCurrentQuarter();
}

const OkrPage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();
  const userId = isAuthenticated ? user?.id : undefined;

  /* ── Étape courante, portée par l'URL ── */
  const etape: Etape = useMemo(() => {
    const q = router.query.etape;
    return typeof q === 'string' && (ETAPES as string[]).includes(q) ? (q as Etape) : 'annee';
  }, [router.query.etape]);

  const allerA = useCallback(
    (e: Etape) => {
      router.push({ pathname: '/app/okr', query: e === 'annee' ? {} : { etape: e } }, undefined, { shallow: true });
      if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    [router]
  );

  /* ── Trimestre sélectionné (mémorisé dans le navigateur) ── */
  const [quarter, setQuarter] = useState<Quarter>(getCurrentQuarter);
  useEffect(() => {
    setQuarter(lireTrimestre());
  }, []);
  const changerTrimestre = (q: Quarter) => {
    setQuarter(q);
    try {
      window.localStorage.setItem(CLE_TRIMESTRE, q);
    } catch {
      /* ignoré */
    }
  };

  /* ── Droits d'accès : la 1re étape est offerte, la suite est dans les formules ── */
  const { data: abonnement } = useSubscription(userId);
  const niveau = niveauAcces(isAuthenticated, abonnement);
  const indexEtape = ETAPES.indexOf(etape);
  const etapeOuverte = etapeAccessible(niveau, indexEtape);

  /* ── Données ── */
  const { data: ambitionsBrutes = [] } = useAmbitions(userId, ANNEE);
  const ambitions = useMemo(
    () =>
      [...ambitionsBrutes]
        .sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0) || a.createdAt.getTime() - b.createdAt.getTime())
        .slice(0, MAX_OBJECTIFS),
    [ambitionsBrutes]
  );
  const { data: objectifsBruts = [] } = useQuarterlyObjectives(userId, quarter, ANNEE);
  const ambitionIds = useMemo(() => new Set(ambitions.map((a) => a.id)), [ambitions]);
  const objectifs = useMemo(() => objectifsBruts.filter((o) => ambitionIds.has(o.ambitionId)), [objectifsBruts, ambitionIds]);
  const { data: keyResults = [] } = useQuarterlyKeyResultsByUser(userId);
  const krsTrimestre = useMemo(() => {
    const ids = new Set(objectifs.map((o) => o.id));
    return keyResults.filter((k) => ids.has(k.quarterlyObjectiveId));
  }, [keyResults, objectifs]);
  const { data: actions = [] } = useActions(userId);

  /* ── Barre du haut ── */
  const [demandeNouvelle, setDemandeNouvelle] = useState(0);
  const nouvelleAction = () => {
    if (etape !== 'actions') allerA('actions');
    setDemandeNouvelle((n) => n + 1);
  };

  const [authOpen, setAuthOpen] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register'>('register');
  const ouvrirAuth = (tab: 'login' | 'register') => {
    setAuthTab(tab);
    setAuthOpen(true);
  };

  const libelles: Record<Etape, string> = {
    annee: 'Mes 3 objectifs annuels',
    trimestre: `Mon trimestre ${trimLabel(quarter)}`,
    actions: 'Mes actions',
  };
  const titresBarre: Record<Etape, string> = {
    annee: 'Mes 3 objectifs annuels',
    trimestre: `Mon trimestre ${trimLabel(quarter)} ${ANNEE}`,
    actions: `Mes actions ${trimLabel(quarter)} ${ANNEE}`,
  };

  const topbarActions = !authReady ? null : isAuthenticated ? (
    <>
      <button type="button" onClick={nouvelleAction} className={`${BTN_OUTLINE} !py-2 !text-14`}>
        <Plus className="w-[15px] h-[15px]" aria-hidden />
        Nouvelle action
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
        Commencer →
      </button>
    </div>
  );

  return (
    <>
      <Head>
        <title>OsKaR OKR · Mes objectifs | OsKaR</title>
      </Head>
      <AppShell
        title="OsKaR OKR"
        topbarTitle={<span className="text-okr">OSKAR OKR — {titresBarre[etape]}</span>}
        topbarActions={topbarActions}
        contentMaxWidth="max-w-[1400px]"
      >
        {!authReady ? (
          <div className="flex flex-col items-center justify-center py-32 text-muted" aria-live="polite">
            <Loader2 className="h-8 w-8 animate-spin text-teal mb-4" aria-hidden />
            <p className="text-14">Chargement de votre espace…</p>
          </div>
        ) : !isAuthenticated || !user ? (
          <Visiteur onConnexion={() => ouvrirAuth('login')} onInscription={() => ouvrirAuth('register')} />
        ) : (
          <>
            <OkrTabs etape={etape} libelles={libelles} onChange={allerA} />

            {!etapeOuverte ? (
              <EtapeVerrouillee
                niveau={niveau}
                titreEtape={`Étape ${indexEtape + 1} · ${libelles[etape]}`}
                apercu={APERCU_ETAPES[etape]}
                onCreerCompte={() => ouvrirAuth('register')}
              />
            ) : (
            <>
            {etape === 'annee' && (
              <EtapeObjectifs
                userId={user.id}
                ambitions={ambitions}
                libelleSuivant={`Définir mon trimestre ${trimLabel(quarter)}`}
                onSuivant={() => allerA('trimestre')}
              />
            )}
            {etape === 'trimestre' && (
              <EtapeTrimestre
                userId={user.id}
                ambitions={ambitions}
                quarter={quarter}
                onQuarterChange={changerTrimestre}
                objectifs={objectifs}
                keyResults={keyResults}
                onRetourObjectifs={() => allerA('annee')}
                onSuivant={() => allerA('actions')}
              />
            )}
            {etape === 'actions' && (
              <EtapeActions
                userId={user.id}
                quarter={quarter}
                actions={actions}
                keyResults={krsTrimestre}
                demandeNouvelle={demandeNouvelle}
              />
            )}
            </>
            )}
          </>
        )}
      </AppShell>
      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} initialTab={authTab} redirectTo="/app/okr" />
    </>
  );
};

/** Vue visiteur : la bannière de l'étape 1 et une invitation à se connecter. */
const Visiteur: React.FC<{ onConnexion: () => void; onInscription: () => void }> = ({ onConnexion, onInscription }) => (
  <div className="max-w-3xl">
    <div className="relative overflow-hidden rounded-[18px] px-10 py-9 mb-7 bg-[linear-gradient(135deg,#151f5e_0%,#1e2d7d_60%,#2a3d99_100%)]">
      <div
        className="absolute -right-10 -top-10 w-[220px] h-[220px] rounded-full bg-[radial-gradient(circle,rgba(0,212,180,0.13)_0%,transparent_70%)]"
        aria-hidden
      />
      <div className="relative">
        <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-teal mb-2">Pilier 04 · OsKaR OKR</div>
        <h1 className="text-[24px] leading-[1.25] font-extrabold text-white mb-2">
          Trois objectifs pour l&rsquo;année, un trimestre à la fois.
        </h1>
        <p className="text-14.5 leading-[1.6] text-white/60 max-w-[480px]">
          Fixez vos 3 objectifs annuels avec une cible chiffrée, déclinez-les en résultats clés chaque trimestre, puis
          pilotez vos actions au quotidien.
        </p>
      </div>
    </div>
    <div className="bg-white border border-line rounded-card shadow-card px-8 py-7 flex flex-col sm:flex-row sm:items-center gap-5">
      <div className="flex-1">
        <p className="text-15.5 font-bold text-navy mb-1">Un compte est nécessaire pour construire vos OKR</p>
        <p className="text-13.5 text-muted">Vos objectifs, résultats clés et actions sont enregistrés et retrouvés à chaque visite.</p>
      </div>
      <div className="flex items-center gap-2.5 shrink-0">
        <button type="button" onClick={onConnexion} className={BTN_OUTLINE}>
          Connexion
        </button>
        <button type="button" onClick={onInscription} className={BTN_PRIMARY}>
          Créer mon compte →
        </button>
      </div>
    </div>
  </div>
);

export default OkrPage;
