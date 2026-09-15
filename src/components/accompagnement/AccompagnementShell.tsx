import React, { useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { Chargement } from '@/components/admin/elements';
import { useAppStore } from '@/store/useAppStore';
import { urlConnexion } from '@/lib/authFlux';

/*
 * Cadre des écrans d'accompagnement (Mes coachs, Mes dirigeants, fiche d'un
 * dirigeant), calqué sur celui de l'administration : fil d'Ariane dans la
 * barre du haut, surtitre 11.5px / 700, titre 28px / 800, sous-titre 15px.
 * Il faut être connecté ; les données sont protégées côté base.
 */

interface Props {
  titre: string;
  sousTitre?: React.ReactNode;
  /** Remplace la fin du fil d'Ariane (« Mes dirigeants / Sophie… »). */
  fil?: React.ReactNode;
  /** La fiche d'un dirigeant a son propre en-tête. */
  sansEntete?: boolean;
  children: React.ReactNode;
}

export const AccompagnementShell: React.FC<Props> = ({ titre, sousTitre, fil, sansEntete, children }) => {
  const router = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

  useEffect(() => {
    if (authReady && !isAuthenticated) router.replace(urlConnexion(router.asPath));
  }, [authReady, isAuthenticated, router]);

  return (
    <>
      <Head>
        <meta name="robots" content="noindex, nofollow" />
      </Head>
      <AppShell
        title={titre}
        topbarTitle={
          <span className="text-15 font-medium">
            <span className="text-muted">Accompagnement</span>
            <span className="text-line mx-2">/</span>
            {fil ?? <span className="text-navy font-bold">{titre}</span>}
          </span>
        }
        topbarActions={authReady && isAuthenticated ? <UserMenu /> : null}
      >
        {!authReady || !isAuthenticated ? (
          <Chargement />
        ) : (
          <>
            {!sansEntete && (
              <header className="mb-[26px]">
                <div className="text-11.5 font-bold tracking-[1.6px] uppercase text-navy-light mb-1.5">Accompagnement</div>
                <h1 className="text-[28px] font-extrabold text-navy leading-[1.2]">{titre}</h1>
                {sousTitre && <p className="text-15 text-muted mt-1.5 max-w-[680px] leading-[1.6]">{sousTitre}</p>}
              </header>
            )}
            {children}
          </>
        )}
      </AppShell>
    </>
  );
};

export default AccompagnementShell;
