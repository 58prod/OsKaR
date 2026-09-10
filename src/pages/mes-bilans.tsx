import React, { useMemo, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  ClipboardCheck,
  Target,
  ArrowRight,
  Trash2,
  Loader2,
  AlertCircle,
  AlertTriangle,
  Check,
} from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';
import { useDiagnostics, useDeleteDiagnostic } from '@/hooks/useDiagnostics';
import { useToast } from '@/hooks/useToast';
import { urlConnexion } from '@/lib/authFlux';
import type { DiagnosticRecord } from '@/services/db/diagnostics';
import type { ProductFitAnalysis } from '@/lib/productFit/types';

/*
 * « Mes bilans » — ce qu'un compte apporte.
 *
 * Les deux bilans gratuits (maturité et Potentiel Produit) sont enregistrés
 * mais n'étaient affichés nulle part : la promesse « créez un compte pour
 * retrouver vos résultats » n'était pas tenue. Cette page les liste et permet
 * de les rouvrir dans l'outil qui les a produits.
 *
 * Mise en page reprise des pages Diagnostic et Potentiel Produit : surtitre,
 * titre, puis des cartes blanches `rounded-card` + `shadow-card`.
 */

/** Note et libellé à afficher, selon le type de bilan. */
function resume(bilan: DiagnosticRecord): { note: string; etat: string; ton: 'bon' | 'moyen' | 'faible' } {
  if (bilan.type === 'produit') {
    const analyse = bilan.scores as unknown as ProductFitAnalysis;
    const note = typeof analyse?.globalScoreOn10 === 'number' ? analyse.globalScoreOn10 : 0;
    const ton = analyse?.verdictTone;
    return {
      note: `${note}`,
      etat: analyse?.verdictLabel ?? '—',
      ton: ton === 'success' ? 'bon' : ton === 'danger' ? 'faible' : 'moyen',
    };
  }
  const moyenne = typeof bilan.scores?.average === 'number' ? bilan.scores.average : 0;
  const arrondi = Math.round(moyenne * 10) / 10;
  return {
    note: `${arrondi}`,
    etat: `${bilan.scores?.evaluatedCount ?? 0}/5 piliers évalués`,
    ton: arrondi >= 8 ? 'bon' : arrondi >= 5 ? 'moyen' : 'faible',
  };
}

const TONS = {
  bon: { bg: '#e6faf7', c: '#00806e', Icone: Check },
  moyen: { bg: '#fffbeb', c: '#b45309', Icone: AlertTriangle },
  faible: { bg: '#fff0ea', c: '#e2653f', Icone: AlertCircle },
};

const MesBilansPage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();
  const toast = useToast();

  React.useEffect(() => {
    if (authReady && !isAuthenticated) router.replace(urlConnexion(router.asPath));
  }, [authReady, isAuthenticated, router]);

  const { data: bilans = [], isLoading } = useDiagnostics(isAuthenticated ? user?.id : undefined);
  const supprimer = useDeleteDiagnostic();
  const [enSuppression, setEnSuppression] = useState<string | null>(null);

  const tries = useMemo(
    () => [...bilans].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
    [bilans]
  );

  const rouvrir = (bilan: DiagnosticRecord) => {
    const page = bilan.type === 'produit' ? '/diagnostic-produit' : '/diagnostic';
    router.push({ pathname: page, query: { bilan: bilan.id } });
  };

  const effacer = async (bilan: DiagnosticRecord) => {
    if (!window.confirm('Supprimer ce bilan ? Cette action est définitive.')) return;
    setEnSuppression(bilan.id);
    try {
      await supprimer.mutateAsync(bilan.id);
      toast.success('Bilan supprimé.');
    } catch {
      toast.error("Le bilan n'a pas pu être supprimé.");
    } finally {
      setEnSuppression(null);
    }
  };

  return (
    <>
      <Head>
        <title>Mes bilans | Oskar</title>
      </Head>
      <AppShell
        title="Mes bilans"
        topbarTitle="Mes bilans"
        topbarSubtitle="Vos résultats, conservés"
        topbarActions={authReady && isAuthenticated ? <UserMenu /> : null}
      >
        <header className="mb-8">
          <div className="text-[11px] font-bold uppercase tracking-widest text-teal-dark mb-1.5">
            Votre compte
          </div>
          <h1 className="text-2xl font-extrabold text-navy">Mes bilans</h1>
          <p className="text-sm text-muted mt-1.5">
            Vos bilans de maturité et vos analyses de potentiel produit, dans l&rsquo;ordre où vous
            les avez faits. Rouvrez-en un pour le reprendre là où vous l&rsquo;aviez laissé.
          </p>
        </header>

        {!authReady || isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 text-muted" aria-live="polite">
            <Loader2 className="h-7 w-7 animate-spin text-teal mb-3" aria-hidden />
            <p className="text-sm">Chargement de vos bilans…</p>
          </div>
        ) : tries.length === 0 ? (
          <div className="bg-white rounded-card border border-line shadow-card p-8 max-w-xl">
            <h2 className="text-lg font-bold text-navy mb-1.5">Aucun bilan pour l&rsquo;instant</h2>
            <p className="text-sm text-muted mb-5">
              Les deux bilans sont gratuits et prennent quelques minutes. Une fois enregistrés, vous
              les retrouverez ici à chaque visite.
            </p>
            <div className="flex flex-wrap gap-2.5">
              <button
                type="button"
                onClick={() => router.push('/diagnostic')}
                className="inline-flex items-center gap-2 px-4 py-3 bg-navy text-white text-sm font-bold rounded-lg hover:bg-navy-light transition-all"
              >
                <ClipboardCheck className="h-4 w-4" aria-hidden />
                Faire mon diagnostic
              </button>
              <button
                type="button"
                onClick={() => router.push('/diagnostic-produit')}
                className="inline-flex items-center gap-2 px-4 py-3 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg hover:border-navy transition-all"
              >
                <Target className="h-4 w-4" aria-hidden />
                Évaluer mon produit
              </button>
            </div>
          </div>
        ) : (
          <ul className="grid gap-4 sm:grid-cols-2 max-w-4xl">
            {tries.map((bilan) => {
              const { note, etat, ton } = resume(bilan);
              const { bg, c, Icone } = TONS[ton];
              const estProduit = bilan.type === 'produit';
              return (
                <li key={bilan.id} className="bg-white rounded-card border border-line shadow-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                          estProduit ? 'bg-fit-light text-fit-dark' : 'bg-teal-light text-teal-dark'
                        }`}
                      >
                        {estProduit ? (
                          <Target className="h-4 w-4" aria-hidden />
                        ) : (
                          <ClipboardCheck className="h-4 w-4" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <h2 className="text-lg font-bold text-navy truncate">
                          {estProduit ? 'Potentiel Produit' : 'Bilan de maturité'}
                        </h2>
                        <p className="text-xs text-muted">
                          {bilan.createdAt.toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-2xl font-extrabold text-navy leading-none">
                        {note}
                        <span className="text-xs font-normal text-muted"> /10</span>
                      </div>
                    </div>
                  </div>

                  <span
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold mb-4"
                    style={{ background: bg, color: c }}
                  >
                    <Icone className="h-3.5 w-3.5 shrink-0" aria-hidden /> {etat}
                  </span>

                  <div className="flex items-center gap-2 pt-4 border-t border-line">
                    <button
                      type="button"
                      onClick={() => rouvrir(bilan)}
                      className="flex-1 justify-center inline-flex items-center gap-1.5 px-3 py-2.5 bg-white text-navy text-sm font-semibold border-[1.5px] border-line rounded-lg hover:border-navy transition-all"
                    >
                      Rouvrir
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden />
                    </button>
                    <button
                      type="button"
                      onClick={() => effacer(bilan)}
                      disabled={enSuppression === bilan.id}
                      aria-label="Supprimer ce bilan"
                      className="px-3 py-2.5 text-muted hover:text-[#dc2626] transition-colors disabled:opacity-40"
                    >
                      {enSuppression === bilan.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                      ) : (
                        <Trash2 className="h-4 w-4" aria-hidden />
                      )}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppShell>
    </>
  );
};

export default MesBilansPage;
