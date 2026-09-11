import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { FileText, AlertTriangle, Scale, Ban } from 'lucide-react';

const TermsOfServicePage: React.FC = () => {
  return (
    <Layout
      title="Conditions Générales d'Utilisation"
      description="Conditions générales d'utilisation du service Oskar"
      skipOnboarding
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête */}
        <div className="text-center mb-12">
          <FileText className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Conditions Générales d'Utilisation
          </h1>
          <p className="text-lg text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>1. Objet</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Les présentes Conditions Générales d'Utilisation (CGU) régissent l'utilisation de l'application
              web Oskar, un outil de gestion d'objectifs avec IA coach intégrée.
            </p>
            <p>
              En utilisant Oskar, vous acceptez sans réserve les présentes CGU. Si vous n'acceptez pas
              ces conditions, veuillez ne pas utiliser le service.
            </p>
          </CardContent>
        </Card>

        {/* Définitions */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>2. Définitions</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <ul>
              <li><strong>Service</strong> : L'application web Oskar accessible à l'adresse oskar-coach.fr</li>
              <li><strong>Utilisateur</strong> : Toute personne utilisant le Service</li>
              <li><strong>Compte</strong> : Espace personnel de l'Utilisateur sur le Service</li>
              <li><strong>Contenu</strong> : Toutes les données créées par l'Utilisateur (objectifs, ambitions, etc.)</li>
              <li><strong>IA Coach</strong> : Fonctionnalité d'intelligence artificielle fournissant des conseils personnalisés</li>
            </ul>
          </CardContent>
        </Card>

        {/* Accès au service */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>3. Accès au Service</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>3.1 Conditions d'accès</h3>
            <p>
              Le Service est accessible gratuitement à tout Utilisateur disposant d'un accès à Internet.
              Tous les coûts liés à l'accès au Service (matériel, logiciels, connexion Internet) sont
              à la charge exclusive de l'Utilisateur.
            </p>

            <h3>3.2 Création de compte</h3>
            <p>
              Actuellement, le Service fonctionne sans création de compte. Les données sont stockées
              localement dans votre navigateur. Vous êtes responsable de la sauvegarde de vos données.
            </p>

            <h3>3.3 Disponibilité</h3>
            <p>
              Nous nous efforçons de maintenir le Service accessible 24h/24 et 7j/7, mais nous ne
              garantissons pas une disponibilité continue. Le Service peut être interrompu pour
              maintenance, mises à jour ou raisons techniques.
            </p>
          </CardContent>
        </Card>

        {/* Utilisation du service */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertTriangle className="h-5 w-5 mr-2 text-orange-600" />
              4. Utilisation du Service
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>4.1 Usage autorisé</h3>
            <p>Le Service est destiné à un usage professionnel pour :</p>
            <ul>
              <li>Définir et suivre vos objectifs d'entreprise</li>
              <li>Gérer vos OKR (Objectives and Key Results)</li>
              <li>Bénéficier de conseils personnalisés de l'IA coach</li>
              <li>Exporter vos données et rapports</li>
            </ul>

            <h3>4.2 Usages interdits</h3>
            <p>Il est strictement interdit de :</p>
            <ul>
              <li>Utiliser le Service à des fins illégales ou frauduleuses</li>
              <li>Tenter de contourner les mesures de sécurité</li>
              <li>Extraire ou copier le code source de l'application</li>
              <li>Surcharger ou perturber le fonctionnement du Service</li>
              <li>Utiliser des robots, scripts ou outils automatisés non autorisés</li>
              <li>Revendre ou redistribuer le Service sans autorisation</li>
            </ul>

            <h3>4.3 Responsabilité de l'Utilisateur</h3>
            <p>Vous êtes seul responsable :</p>
            <ul>
              <li>Du contenu que vous créez et stockez</li>
              <li>De la sauvegarde de vos données</li>
              <li>De l'utilisation que vous faites des conseils de l'IA coach</li>
              <li>Des décisions prises sur la base des informations fournies</li>
            </ul>
          </CardContent>
        </Card>

        {/* Propriété intellectuelle */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Scale className="h-5 w-5 mr-2 text-primary-600" />
              5. Propriété Intellectuelle
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>5.1 Propriété du Service</h3>
            <p>
              Tous les éléments du Service (code, design, logos, textes, graphiques, etc.) sont la
              propriété exclusive d'Oskar et sont protégés par les lois sur la propriété intellectuelle.
            </p>

            <h3>5.2 Licence d'utilisation</h3>
            <p>
              Nous vous accordons une licence non exclusive, non transférable et révocable pour utiliser
              le Service conformément aux présentes CGU.
            </p>

            <h3>5.3 Propriété de votre contenu</h3>
            <p>
              Vous conservez tous les droits sur le contenu que vous créez dans le Service. Vous nous
              accordez une licence limitée pour stocker et traiter ce contenu afin de fournir le Service.
            </p>
          </CardContent>
        </Card>

        {/* IA Coach */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>6. IA Coach et Conseils</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>6.1 Nature des conseils</h3>
            <p>
              L'IA Coach fournit des suggestions et conseils générés automatiquement par intelligence
              artificielle (Google Gemini). Ces conseils sont fournis à titre informatif uniquement.
            </p>

            <h3>6.2 Absence de garantie</h3>
            <p>
              Nous ne garantissons pas l'exactitude, la pertinence ou l'exhaustivité des conseils fournis
              par l'IA Coach. Vous utilisez ces conseils à vos propres risques.
            </p>

            <h3>6.3 Responsabilité</h3>
            <p>
              Oskar ne peut être tenu responsable des décisions prises sur la base des conseils de l'IA
              Coach. Vous devez toujours exercer votre propre jugement professionnel.
            </p>
          </CardContent>
        </Card>

        {/* Données personnelles */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>7. Données Personnelles</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Le traitement de vos données personnelles est régi par notre{' '}
              <a href="/legal/privacy-policy" className="text-primary-600 hover:underline">
                Politique de Confidentialité
              </a>, qui fait partie intégrante des présentes CGU.
            </p>
          </CardContent>
        </Card>

        {/* Limitation de responsabilité */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Ban className="h-5 w-5 mr-2 text-red-600" />
              8. Limitation de Responsabilité
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>8.1 Service fourni "en l'état"</h3>
            <p>
              Le Service est fourni "en l'état" sans garantie d'aucune sorte, expresse ou implicite.
              Nous ne garantissons pas que le Service sera exempt d'erreurs ou disponible en permanence.
            </p>

            <h3>8.2 Exclusion de responsabilité</h3>
            <p>Oskar ne peut être tenu responsable :</p>
            <ul>
              <li>De la perte de données due à un problème technique ou à une erreur de l'Utilisateur</li>
              <li>Des dommages indirects, accessoires ou consécutifs</li>
              <li>De l'interruption ou de l'indisponibilité du Service</li>
              <li>Des décisions prises sur la base des conseils de l'IA Coach</li>
              <li>Des actes de tiers (piratage, virus, etc.)</li>
            </ul>

            <h3>8.3 Limitation de responsabilité</h3>
            <p>
              Dans tous les cas, notre responsabilité est limitée au montant payé par l'Utilisateur
              pour le Service au cours des 12 derniers mois (actuellement 0€ pour la version gratuite).
            </p>
          </CardContent>
        </Card>

        {/* Résiliation */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>9. Résiliation</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>9.1 Par l'Utilisateur</h3>
            <p>
              Vous pouvez cesser d'utiliser le Service à tout moment. Pour supprimer vos données,
              videz le cache de votre navigateur ou utilisez la fonction "Supprimer mes données"
              dans les paramètres.
            </p>

            <h3>9.2 Par Oskar</h3>
            <p>
              Nous nous réservons le droit de suspendre ou résilier votre accès au Service en cas de :
            </p>
            <ul>
              <li>Violation des présentes CGU</li>
              <li>Usage frauduleux ou abusif du Service</li>
              <li>Non-paiement (pour les versions payantes futures)</li>
              <li>Cessation du Service</li>
            </ul>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>10. Modifications des CGU</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Nous nous réservons le droit de modifier les présentes CGU à tout moment. Les modifications
              importantes vous seront notifiées par email ou via une notification dans l'application.
            </p>
            <p>
              La poursuite de l'utilisation du Service après modification des CGU vaut acceptation
              des nouvelles conditions.
            </p>
          </CardContent>
        </Card>

        {/* Droit applicable */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>11. Droit Applicable et Juridiction</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Les présentes CGU sont régies par le droit français. En cas de litige, les tribunaux
              français seront seuls compétents.
            </p>
            <p>
              Conformément à la réglementation européenne, vous pouvez également recourir à la
              plateforme de règlement en ligne des litiges de la Commission européenne :
              <br />
              <a
                href="https://ec.europa.eu/consumers/odr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline"
              >
                https://ec.europa.eu/consumers/odr
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>12. Contact</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Pour toute question concernant ces CGU :</p>
            <ul>
              <li>Email : <strong>legal@oskar-coach.fr</strong></li>
              <li>Email général : <strong>contact@oskar-coach.fr</strong></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default TermsOfServicePage;

