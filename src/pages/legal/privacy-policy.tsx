import React from 'react';
import Link from 'next/link';
import { Fiche, PageLegale } from '@/components/legal/PageLegale';
import { EDITEUR, EMAIL_DONNEES, SOUS_TRAITANTS } from '@/lib/legal/editeur';

export default function ConfidentialitePage() {
  return (
    <PageLegale
      titre="Confidentialité"
      description="Quelles données Oskar collecte, pourquoi, combien de temps elles sont conservées et avec qui elles sont partagées."
      chapeau={
        <p>
          Oskar ne collecte que les données nécessaires à son fonctionnement. Elles ne sont jamais vendues, ni utilisées
          pour de la publicité.
        </p>
      }
    >
      <h2>Responsable du traitement</h2>
      <p>
        <strong>{EDITEUR.nom}</strong>, {EDITEUR.forme}, {EDITEUR.siege} ({EDITEUR.rcs}). Pour toute question sur vos
        données : <a href={`mailto:${EMAIL_DONNEES}`}>{EMAIL_DONNEES}</a>.
      </p>

      <h2>Données collectées et finalités</h2>
      <Fiche
        lignes={[
          {
            libelle: 'Votre compte',
            valeur: 'Nom, adresse email, entreprise et secteur : pour créer votre compte et vous fournir le service.',
          },
          {
            libelle: 'Vos travaux',
            valeur: 'Réponses aux diagnostics, contenus des ateliers et objectifs : pour les conserver et vous les restituer.',
          },
          {
            libelle: 'Bilan par email',
            valeur: 'L’adresse que vous indiquez à la fin d’un diagnostic : pour vous envoyer votre bilan.',
          },
          {
            libelle: 'Outils d’équipe',
            valeur: 'Le prénom choisi et vos contributions à une séance : pour faire fonctionner la séance partagée.',
          },
          {
            libelle: 'Vos demandes',
            valeur: 'Coordonnées et message d’une demande de formule ou d’une candidature coach : pour vous répondre.',
          },
        ]}
      />
      <p>
        Ces traitements reposent sur l’exécution du service que vous demandez et, pour les demandes de contact, sur notre
        intérêt légitime à y répondre. Aucune décision automatisée n’est prise à votre sujet.
      </p>

      <h2>Qui a accès à vos données</h2>
      <p>Seul HaSenso y accède, ainsi que les prestataires techniques nécessaires au service :</p>
      <ul>
        {SOUS_TRAITANTS.map((s) => (
          <li key={s.nom}>
            <strong>{s.nom}</strong> : {s.role}
          </li>
        ))}
      </ul>
      <p>
        Certains de ces prestataires sont établis hors de l’Union européenne, notamment aux États-Unis. Ces transferts
        sont encadrés par les garanties prévues par le RGPD (clauses contractuelles types de la Commission européenne ou
        cadre de protection des données UE–États-Unis).
      </p>

      <h2>Durée de conservation</h2>
      <ul>
        <li>Compte et travaux : tant que votre compte existe, puis effacés à sa suppression.</li>
        <li>Bilans demandés sans compte et demandes de contact : 3 ans après le dernier échange.</li>
        <li>Factures : 10 ans, comme l’exige la loi.</li>
      </ul>

      <h2>Sécurité</h2>
      <p>
        Les échanges sont chiffrés (HTTPS), les données sont chiffrées sur les serveurs, les mots de passe ne sont jamais
        stockés en clair et chaque utilisateur n’accède qu’à ses propres données.
      </p>

      <h2>Vos droits</h2>
      <p>
        Vous pouvez accéder à vos données, les corriger, les faire effacer ou les récupérer. La marche à suivre est
        détaillée sur la page <Link href="/legal/gdpr">Vos droits RGPD</Link>.
      </p>
    </PageLegale>
  );
}
