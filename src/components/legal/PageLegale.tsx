import React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { useAppStore } from '@/store/useAppStore';
import { MISE_A_JOUR } from '@/lib/legal/editeur';

/*
 * Gabarit commun des pages légales : fil d'Ariane, en-tête sobre (celui de
 * la page À propos), onglets entre les cinq pages, texte dans une carte.
 * Voulu succinct par Christophe (2026-09-13) : le minimum légal, rassurant.
 */

export const PAGES_LEGALES = [
  { href: '/legal/terms-of-service', libelle: 'Mentions légales et CGU' },
  { href: '/legal/privacy-policy', libelle: 'Confidentialité' },
  { href: '/legal/cookies-policy', libelle: 'Cookies' },
  { href: '/legal/gdpr', libelle: 'Vos droits RGPD' },
  { href: '/legal/parametres-cookies', libelle: 'Paramètres des cookies' },
];

/** Typographie du texte légal, posée sur le conteneur. */
const TEXTE = [
  '[&_h2]:text-17 [&_h2]:font-bold [&_h2]:text-navy [&_h2]:mt-8 [&_h2]:mb-2.5 [&_h2:first-child]:mt-0 [&_h2]:scroll-mt-20',
  '[&_p]:text-15 [&_p]:leading-[1.7] [&_p]:text-muted [&_p]:mb-3',
  '[&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5 [&_ul]:mb-3 [&_ul]:pl-5 [&_ul]:list-disc [&_li]:text-15 [&_li]:leading-[1.65] [&_li]:text-muted [&_li]:marker:text-teal-dark',
  '[&_strong]:font-semibold [&_strong]:text-ink',
  '[&_a]:font-semibold [&_a]:text-navy [&_a]:underline hover:[&_a]:text-teal-dark',
].join(' ');

export const PageLegale: React.FC<{
  titre: string;
  description: string;
  chapeau: React.ReactNode;
  children: React.ReactNode;
}> = ({ titre, description, chapeau, children }) => {
  const { pathname } = useRouter();
  const { authReady, isAuthenticated } = useAppStore();

  return (
    <AppShell
      title={titre}
      description={description}
      topbarTitle={
        <nav aria-label="Fil d’Ariane" className="flex items-center gap-[10.5px] text-15 font-normal text-muted">
          <Link href="/" className="font-medium text-muted hover:text-navy transition-colors">
            Accueil
          </Link>
          <span className="text-line" aria-hidden>
            /
          </span>
          <span className="font-bold text-navy" aria-current="page">
            {titre}
          </span>
        </nav>
      }
      topbarActions={authReady && isAuthenticated ? <UserMenu /> : undefined}
    >
      <header className="border-l-[3px] border-navy pl-5 min-[600px]:pl-7 mt-2 mb-6">
        <p className="text-12.5 font-bold uppercase tracking-[1.8px] text-teal-dark mb-2.5">Informations légales</p>
        <h1 className="text-29 font-extrabold text-navy mb-3">{titre}</h1>
        <div className="text-16 leading-[1.7] text-muted max-w-[760px]">{chapeau}</div>
        <p className="text-13 text-muted mt-3">Mise à jour : {MISE_A_JOUR}</p>
      </header>

      <nav aria-label="Pages légales" className="flex flex-wrap gap-2 mb-6">
        {PAGES_LEGALES.map((p) => {
          const actif = pathname === p.href;
          return (
            <Link
              key={p.href}
              href={p.href}
              aria-current={actif ? 'page' : undefined}
              className={`px-3.5 py-1.5 rounded-[20px] text-13.5 font-semibold border transition-colors ${
                actif ? 'bg-navy text-white border-navy' : 'bg-white text-muted border-line hover:text-navy hover:border-navy/40'
              }`}
            >
              {p.libelle}
            </Link>
          );
        })}
      </nav>

      <div className={`bg-white border border-line shadow-card rounded-[16px] p-6 min-[600px]:p-8 mb-10 max-w-[900px] ${TEXTE}`}>
        {children}
      </div>
    </AppShell>
  );
};

/** Tableau libellé → valeur (identité de l'éditeur, liste des traceurs…). */
export const Fiche: React.FC<{ lignes: { libelle: string; valeur: React.ReactNode }[] }> = ({ lignes }) => (
  <dl className="grid grid-cols-1 min-[700px]:grid-cols-[200px_1fr] border-t border-line mb-4">
    {lignes.map((l) => (
      <React.Fragment key={l.libelle}>
        <dt className="pt-3 min-[700px]:py-3 min-[700px]:border-b border-line text-12.5 font-bold uppercase tracking-[0.08em] text-muted">
          {l.libelle}
        </dt>
        <dd className="pb-3 pt-1 min-[700px]:py-3 border-b border-line text-15 leading-[1.6] text-ink">{l.valeur}</dd>
      </React.Fragment>
    ))}
  </dl>
);
