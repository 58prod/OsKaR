import React, { useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { ShieldAlert } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';
import { useEstAdmin } from '@/hooks/useAdmin';
import { urlConnexion } from '@/lib/authFlux';
import { Chargement } from './elements';

/*
 * Cadre commun des écrans d'administration (plateforme/admin.html) :
 *   fil d'Ariane   « Administration / <écran> » dans la barre du haut
 *   pastille       initiales + « Prénom · administrateur », fond #f0f2ff
 *   en-tête        surtitre 11.5px / 700 / 1.6px navy clair, titre 28px / 800,
 *                  sous-titre 15px gris 620px maxi, 26px sous l'en-tête
 *
 * La page n'affiche rien à qui n'est pas administrateur : les données sont de
 * toute façon protégées côté base (fonctions admin_*).
 */

interface AdminShellProps {
  titre: string;
  sousTitre: string;
  /** Bouton à droite de l'en-tête (export…). */
  actions?: React.ReactNode;
  children: React.ReactNode;
}

function initiales(texte: string): string {
  return texte
    .split(/[\s.@_-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((m) => m[0]?.toUpperCase() ?? '')
    .join('');
}

export const AdminShell: React.FC<AdminShellProps> = ({ titre, sousTitre, actions, children }) => {
  const router = useRouter();
  const { user, authReady, isAuthenticated } = useAppStore();
  const { estAdmin, enCours } = useEstAdmin();

  useEffect(() => {
    if (authReady && !isAuthenticated) router.replace(urlConnexion(router.asPath));
  }, [authReady, isAuthenticated, router]);

  const nom = user?.name?.trim() || user?.email?.split('@')[0] || '';
  const prenom = nom.split(' ')[0];

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AppShell
        title={`${titre} · Administration`}
        topbarTitle={
          <span className="text-15 font-medium">
            <span className="text-muted">Administration</span>
            <span className="text-line mx-2">/</span>
            <span className="text-navy font-bold">{titre}</span>
          </span>
        }
        topbarActions={
          authReady && isAuthenticated ? (
            <>
              {estAdmin && (
                <span className="hidden min-[700px]:inline-flex items-center gap-[9px] text-14 font-semibold text-navy bg-[#f0f2ff] border border-[#d9ddf6] rounded-[22px] py-[5px] pl-[5px] pr-3.5">
                  <span className="w-7 h-7 rounded-full bg-navy text-white flex items-center justify-center text-12.5 font-extrabold">
                    {initiales(nom)}
                  </span>
                  {prenom} · administrateur
                </span>
              )}
              <UserMenu />
            </>
          ) : null
        }
      >
        {enCours || !isAuthenticated ? (
          <Chargement texte="Vérification de vos droits…" />
        ) : !estAdmin ? (
          <div className="max-w-[560px] bg-white border border-line rounded-card shadow-card p-[27.5px]">
            <div className="flex items-center gap-3 mb-3">
              <ShieldAlert className="h-6 w-6 text-coral-dark" aria-hidden />
              <h1 className="text-20.5 font-extrabold text-navy">Accès réservé</h1>
            </div>
            <p className="text-15 text-muted leading-[1.6] mb-5">
              Cet espace est réservé aux administrateurs d&rsquo;Oskar. Si vous devriez y avoir accès, demandez à
              être ajouté à la liste des administrateurs.
            </p>
            <Link href="/" className="text-15 font-bold text-navy hover:text-teal-dark">
              Revenir à l&rsquo;accueil →
            </Link>
          </div>
        ) : (
          <>
            <header className="flex flex-wrap items-end justify-between gap-5 mb-[26px]">
              <div>
                <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-navy-light mb-1.5">Administration</div>
                <h1 className="text-[28px] font-extrabold text-navy leading-[1.2]">{titre}</h1>
                <p className="text-15 text-muted mt-1.5 max-w-[620px] leading-[1.6]">{sousTitre}</p>
              </div>
              {actions}
            </header>
            {children}
          </>
        )}
      </AppShell>
    </>
  );
};

export default AdminShell;
