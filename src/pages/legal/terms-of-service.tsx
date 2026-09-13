import React from 'react';
import Link from 'next/link';
import { Fiche, PageLegale } from '@/components/legal/PageLegale';
import { EDITEUR, HEBERGEUR } from '@/lib/legal/editeur';

export default function ConditionsPage() {
  return (
    <PageLegale
      titre="Mentions légales et CGU"
      description="Mentions légales d’Oskar et conditions générales d’utilisation de la plateforme oskar-coach.fr, éditée par HaSenso."
      chapeau={
        <p>
          Qui édite Oskar, et les règles simples qui encadrent l’utilisation de la plateforme. En l’utilisant, vous
          acceptez ces conditions.
        </p>
      }
    >
      <h2 id="mentions-legales">Mentions légales</h2>
      <Fiche
        lignes={[
          { libelle: 'Éditeur', valeur: `${EDITEUR.nom}, ${EDITEUR.forme}` },
          { libelle: 'Siège social', valeur: EDITEUR.siege },
          { libelle: 'Immatriculation', valeur: EDITEUR.rcs },
          { libelle: 'N° de TVA', valeur: EDITEUR.tva },
          { libelle: 'Directeur de la publication', valeur: EDITEUR.directeurPublication },
          {
            libelle: 'Contact',
            valeur: (
              <>
                <a href={`mailto:${EDITEUR.email}`}>{EDITEUR.email}</a> · <a href={EDITEUR.telephone.lien}>{EDITEUR.telephone.affiche}</a>
              </>
            ),
          },
          { libelle: 'Hébergeur', valeur: `${HEBERGEUR.nom}, ${HEBERGEUR.adresse}` },
        ]}
      />

      <h2>1. Objet</h2>
      <p>
        Les présentes conditions encadrent l’utilisation de la plateforme Oskar, accessible à l’adresse oskar-coach.fr,
        qui aide les dirigeants et leurs équipes à structurer le pilotage de leur entreprise.
      </p>

      <h2>2. Accès au service</h2>
      <ul>
        <li>Le diagnostic et la boîte à outils d’équipe sont accessibles gratuitement, sans compte.</li>
        <li>Un compte gratuit permet de conserver ses travaux et d’accéder à la première étape de chaque atelier.</li>
        <li>
          La formule payante ouvre l’ensemble des ateliers ; ses prix et son contenu sont présentés sur la page{' '}
          <Link href="/pricing">Tarifs</Link>. Elle est facturée par HaSenso.
        </li>
      </ul>

      <h2>3. Votre compte</h2>
      <p>
        Vous vous engagez à fournir des informations exactes et à garder votre mot de passe confidentiel. Vous êtes
        responsable de l’usage fait de votre compte. Vous pouvez le supprimer à tout moment depuis vos paramètres.
      </p>

      <h2>4. Vos contenus</h2>
      <p>
        Vous restez propriétaire de tout ce que vous saisissez dans Oskar. HaSenso ne l’utilise que pour vous fournir le
        service, ne le vend jamais et ne le communique à personne sans votre accord.
      </p>

      <h2>5. Conseils et suggestions</h2>
      <p>
        Les recommandations d’Oskar, y compris celles produites par intelligence artificielle, sont fournies à titre
        indicatif. Elles ne remplacent pas l’avis d’un professionnel (expert-comptable, avocat…) et les décisions prises
        restent sous votre responsabilité.
      </p>

      <h2>6. Bon usage</h2>
      <p>
        Il est interdit d’utiliser Oskar à des fins illicites, de tenter d’accéder aux données d’autres utilisateurs, de
        perturber le fonctionnement de la plateforme ou de la revendre sans autorisation.
      </p>

      <h2>7. Disponibilité et responsabilité</h2>
      <p>
        HaSenso met tout en œuvre pour que la plateforme soit disponible et fiable, sans pouvoir garantir une absence
        totale d’interruption (maintenance, incident technique). Sa responsabilité ne peut être engagée qu’en cas de faute
        prouvée, et pour les seuls dommages directs.
      </p>

      <h2>8. Propriété intellectuelle</h2>
      <p>
        La marque Oskar, la méthode, les textes et les éléments graphiques de la plateforme sont protégés. Toute
        reproduction sans autorisation écrite est interdite.
      </p>

      <h2>9. Fin d’utilisation</h2>
      <p>
        Vous pouvez cesser d’utiliser Oskar et supprimer votre compte à tout moment. HaSenso peut suspendre un compte en
        cas de manquement grave aux présentes conditions, après vous en avoir informé.
      </p>

      <h2>10. Modification et droit applicable</h2>
      <p>
        Ces conditions peuvent évoluer ; la date de mise à jour figure en haut de page et toute modification importante
        vous sera signalée. Elles sont soumises au droit français. En cas de litige, une solution amiable sera recherchée
        en priorité.
      </p>
    </PageLegale>
  );
}
