import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Mail, Database, Lock, Eye, Trash2 } from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
  return (
    <Layout
      title="Politique de Confidentialité"
      description="Politique de confidentialité et protection des données personnelles - Oskar"
      skipOnboarding
    >
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* En-tête */}
        <div className="text-center mb-12">
          <Shield className="h-16 w-16 text-primary-600 mx-auto mb-4" />
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Politique de Confidentialité
          </h1>
          <p className="text-lg text-gray-600">
            Dernière mise à jour : {new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>

        {/* Introduction */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Introduction</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Oskar s'engage à protéger la vie privée de ses utilisateurs. Cette politique de confidentialité
              explique comment nous collectons, utilisons, stockons et protégeons vos données personnelles
              conformément au Règlement Général sur la Protection des Données (RGPD).
            </p>
          </CardContent>
        </Card>

        {/* Responsable du traitement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Mail className="h-5 w-5 mr-2 text-primary-600" />
              Responsable du Traitement
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p><strong>Oskar</strong></p>
            <p>Email : contact@okarina.com</p>
            <p>
              Pour toute question concernant vos données personnelles, vous pouvez nous contacter à l'adresse
              ci-dessus.
            </p>
          </CardContent>
        </Card>

        {/* Données collectées */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="h-5 w-5 mr-2 text-primary-600" />
              Données Collectées
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>1. Données d'identification</h3>
            <ul>
              <li>Nom et prénom</li>
              <li>Adresse email</li>
              <li>Nom de l'entreprise</li>
              <li>Secteur d'activité</li>
            </ul>

            <h3>2. Données de profil d'entreprise</h3>
            <ul>
              <li>Taille de l'entreprise</li>
              <li>Stade de développement</li>
              <li>Modèle économique</li>
              <li>Marché cible</li>
              <li>Objectifs et défis</li>
            </ul>

            <h3>3. Données d'utilisation</h3>
            <ul>
              <li>Objectifs annuels et objectifs trimestriels créés</li>
              <li>Résultats clés et actions</li>
              <li>Progression et métriques</li>
              <li>Interactions avec l'IA coach</li>
            </ul>

            <h3>4. Données techniques</h3>
            <ul>
              <li>Adresse IP</li>
              <li>Type de navigateur</li>
              <li>Système d'exploitation</li>
              <li>Pages visitées et durée de visite</li>
              <li>Cookies (avec votre consentement)</li>
            </ul>
          </CardContent>
        </Card>

        {/* Finalités du traitement */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Eye className="h-5 w-5 mr-2 text-primary-600" />
              Finalités du Traitement
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Nous utilisons vos données personnelles pour :</p>
            
            <h3>1. Fourniture du service</h3>
            <ul>
              <li>Créer et gérer votre compte utilisateur</li>
              <li>Sauvegarder vos objectifs et données</li>
              <li>Personnaliser les conseils de l'IA coach</li>
              <li>Générer des rapports et exports</li>
            </ul>

            <h3>2. Amélioration du service</h3>
            <ul>
              <li>Analyser l'utilisation de l'application</li>
              <li>Améliorer les fonctionnalités</li>
              <li>Développer de nouvelles fonctionnalités</li>
              <li>Corriger les bugs et problèmes techniques</li>
            </ul>

            <h3>3. Communication</h3>
            <ul>
              <li>Envoyer des notifications importantes</li>
              <li>Répondre à vos demandes de support</li>
              <li>Envoyer des newsletters (avec votre consentement)</li>
            </ul>

            <h3>4. Sécurité</h3>
            <ul>
              <li>Prévenir la fraude et les abus</li>
              <li>Assurer la sécurité de la plateforme</li>
              <li>Respecter nos obligations légales</li>
            </ul>
          </CardContent>
        </Card>

        {/* Base légale */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Lock className="h-5 w-5 mr-2 text-primary-600" />
              Base Légale du Traitement
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Le traitement de vos données repose sur :</p>
            <ul>
              <li><strong>Exécution du contrat</strong> : Pour fournir le service Oskar</li>
              <li><strong>Consentement</strong> : Pour les cookies non essentiels et les newsletters</li>
              <li><strong>Intérêt légitime</strong> : Pour améliorer le service et assurer la sécurité</li>
              <li><strong>Obligation légale</strong> : Pour respecter les lois applicables</li>
            </ul>
          </CardContent>
        </Card>

        {/* Stockage des données */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Stockage et Sécurité des Données</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <h3>Localisation</h3>
            <p>
              Actuellement, vos données sont stockées localement dans votre navigateur (localStorage).
              Aucune donnée n'est transmise à des serveurs externes, sauf pour les interactions avec
              l'API Google Gemini (IA coach).
            </p>

            <h3>Sécurité</h3>
            <p>Nous mettons en œuvre des mesures de sécurité appropriées :</p>
            <ul>
              <li>Chiffrement HTTPS pour toutes les communications</li>
              <li>Stockage local sécurisé dans le navigateur</li>
              <li>Pas de transmission de données sensibles à des tiers</li>
              <li>Validation et sanitisation des données</li>
            </ul>

            <h3>Durée de conservation</h3>
            <p>
              Vos données sont conservées tant que vous utilisez l'application. Vous pouvez les supprimer
              à tout moment en vidant le cache de votre navigateur ou en utilisant la fonction
              "Supprimer mes données" dans les paramètres.
            </p>
          </CardContent>
        </Card>

        {/* Partage des données */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Partage des Données</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Nous ne vendons jamais vos données personnelles.</p>
            
            <h3>Partage limité avec :</h3>
            <ul>
              <li>
                <strong>Google Gemini AI</strong> : Pour fournir les conseils personnalisés de l'IA coach.
                Seules les données nécessaires (profil d'entreprise, objectifs) sont transmises.
              </li>
              <li>
                <strong>Services d'hébergement</strong> : Netlify pour l'hébergement de l'application
                (données techniques uniquement).
              </li>
            </ul>

            <h3>Transferts internationaux</h3>
            <p>
              L'API Google Gemini peut impliquer des transferts de données vers les États-Unis.
              Ces transferts sont encadrés par les clauses contractuelles types de la Commission européenne.
            </p>
          </CardContent>
        </Card>

        {/* Vos droits */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Trash2 className="h-5 w-5 mr-2 text-primary-600" />
              Vos Droits RGPD
            </CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Conformément au RGPD, vous disposez des droits suivants :</p>

            <h3>1. Droit d'accès</h3>
            <p>Vous pouvez demander une copie de toutes vos données personnelles.</p>

            <h3>2. Droit de rectification</h3>
            <p>Vous pouvez corriger vos données inexactes ou incomplètes.</p>

            <h3>3. Droit à l'effacement ("droit à l'oubli")</h3>
            <p>Vous pouvez demander la suppression de vos données personnelles.</p>

            <h3>4. Droit à la portabilité</h3>
            <p>Vous pouvez recevoir vos données dans un format structuré (JSON, Excel).</p>

            <h3>5. Droit d'opposition</h3>
            <p>Vous pouvez vous opposer au traitement de vos données à des fins de marketing.</p>

            <h3>6. Droit de limitation</h3>
            <p>Vous pouvez demander la limitation du traitement de vos données.</p>

            <h3>Comment exercer vos droits ?</h3>
            <p>
              Pour exercer vos droits, contactez-nous à : <strong>privacy@okarina.com</strong>
              <br />
              Nous répondrons dans un délai maximum de 30 jours.
            </p>

            <h3>Réclamation</h3>
            <p>
              Si vous estimez que vos droits ne sont pas respectés, vous pouvez déposer une réclamation
              auprès de la CNIL (Commission Nationale de l'Informatique et des Libertés) :
              <br />
              <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">
                www.cnil.fr
              </a>
            </p>
          </CardContent>
        </Card>

        {/* Cookies */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Cookies et Technologies Similaires</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Pour plus d'informations sur notre utilisation des cookies, consultez notre{' '}
              <a href="/legal/cookies-policy" className="text-primary-600 hover:underline">
                Politique de Cookies
              </a>.
            </p>
          </CardContent>
        </Card>

        {/* Modifications */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Modifications de cette Politique</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>
              Nous pouvons modifier cette politique de confidentialité à tout moment. Les modifications
              importantes vous seront notifiées par email ou via une notification dans l'application.
            </p>
            <p>
              La date de dernière mise à jour est indiquée en haut de cette page.
            </p>
          </CardContent>
        </Card>

        {/* Contact */}
        <Card>
          <CardHeader>
            <CardTitle>Contact</CardTitle>
          </CardHeader>
          <CardContent className="prose max-w-none">
            <p>Pour toute question concernant cette politique de confidentialité :</p>
            <ul>
              <li>Email : <strong>privacy@okarina.com</strong></li>
              <li>Email général : <strong>contact@okarina.com</strong></li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default PrivacyPolicyPage;

