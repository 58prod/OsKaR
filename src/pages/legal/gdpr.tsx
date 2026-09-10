import React from 'react';
import { Layout } from '@/components/layout/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Shield, Database, Lock, Eye, Download, Trash2, Mail, Server } from 'lucide-react';

const GDPRPage: React.FC = () => {
  return (
    <Layout title="RGPD & Données Personnelles">
      <div className="min-h-screen bg-gray-50 py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* En-tête */}
          <div className="mb-8">
            <div className="flex items-center space-x-4 mb-4">
              <div className="bg-primary-600 rounded-lg p-3">
                <Shield className="h-8 w-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">RGPD & Données Personnelles</h1>
                <p className="text-gray-600 mt-1">
                  Conformité au Règlement Général sur la Protection des Données
                </p>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary-600" />
                Notre engagement RGPD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-4">
                Oskar s'engage à protéger vos données personnelles conformément au Règlement Général
                sur la Protection des Données (RGPD) et à la loi Informatique et Libertés.
              </p>
              <p className="text-gray-700">
                Cette page détaille vos droits, les données que nous collectons, comment nous les
                utilisons et les mesures de sécurité mises en place.
              </p>
            </CardContent>
          </Card>

          {/* Données collectées */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-primary-600" />
                Données collectées
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Données d'identification</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Nom et prénom</li>
                    <li>Adresse e-mail</li>
                    <li>Mot de passe (chiffré)</li>
                    <li>Photo de profil (optionnelle)</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Données professionnelles</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Nom de l'entreprise</li>
                    <li>Secteur d'activité</li>
                    <li>Taille de l'entreprise</li>
                    <li>Vision et mission de l'entreprise</li>
                  </ul>
                </div>

                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Données d'utilisation</h3>
                  <ul className="list-disc list-inside text-gray-700 space-y-1">
                    <li>Objectifs et Key Results créés</li>
                    <li>Actions et tâches</li>
                    <li>Historique de progression</li>
                    <li>Dates de connexion</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Finalités du traitement */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Eye className="h-5 w-5 mr-2 text-primary-600" />
                Utilisation de vos données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 mb-3">Vos données sont utilisées uniquement pour :</p>
              <ul className="list-disc list-inside text-gray-700 space-y-2">
                <li>Créer et gérer votre compte utilisateur</li>
                <li>Vous permettre d'utiliser les fonctionnalités de l'application</li>
                <li>Sauvegarder vos objectifs, Key Results et actions</li>
                <li>Générer des rapports et statistiques personnalisés</li>
                <li>Améliorer nos services (analyses anonymisées)</li>
                <li>Vous envoyer des notifications importantes (si activées)</li>
              </ul>
              <p className="text-gray-700 mt-4 font-semibold">
                ❌ Nous ne vendons jamais vos données à des tiers.
              </p>
            </CardContent>
          </Card>

          {/* Sécurité */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Lock className="h-5 w-5 mr-2 text-primary-600" />
                Sécurité des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-700">
                <div className="flex items-start">
                  <Server className="h-5 w-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Hébergement sécurisé</p>
                    <p className="text-sm">
                      Vos données sont hébergées sur Supabase (infrastructure AWS) avec chiffrement
                      au repos et en transit (SSL/TLS).
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Lock className="h-5 w-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Chiffrement des mots de passe</p>
                    <p className="text-sm">
                      Les mots de passe sont hachés avec bcrypt et ne sont jamais stockés en clair.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Shield className="h-5 w-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Row Level Security (RLS)</p>
                    <p className="text-sm">
                      Chaque utilisateur ne peut accéder qu'à ses propres données grâce aux
                      politiques de sécurité au niveau des lignes.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Vos droits */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2 text-primary-600" />
                Vos droits RGPD
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <Eye className="h-5 w-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Droit d'accès</p>
                    <p className="text-sm text-gray-700">
                      Vous pouvez consulter toutes vos données dans les Paramètres → Données.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Download className="h-5 w-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Droit à la portabilité</p>
                    <p className="text-sm text-gray-700">
                      Exportez toutes vos données au format JSON depuis Paramètres → Données →
                      Exporter mes données.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Trash2 className="h-5 w-5 mr-3 mt-0.5 text-red-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Droit à l'effacement</p>
                    <p className="text-sm text-gray-700">
                      Supprimez définitivement votre compte et toutes vos données depuis
                      Paramètres → Données → Supprimer mon compte.
                    </p>
                  </div>
                </div>

                <div className="flex items-start">
                  <Mail className="h-5 w-5 mr-3 mt-0.5 text-primary-600 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-gray-900">Droit de rectification</p>
                    <p className="text-sm text-gray-700">
                      Modifiez vos informations personnelles dans Paramètres → Profil.
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Conservation des données */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Database className="h-5 w-5 mr-2 text-primary-600" />
                Conservation des données
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-700">
                <p>
                  <span className="font-semibold">Compte actif :</span> Vos données sont conservées
                  tant que votre compte est actif.
                </p>
                <p>
                  <span className="font-semibold">Suppression de compte :</span> Toutes vos données
                  sont supprimées immédiatement et définitivement.
                </p>
                <p>
                  <span className="font-semibold">Inactivité :</span> Les comptes inactifs depuis
                  plus de 3 ans peuvent être supprimés après notification par e-mail.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-primary-600" />
                Contact & Réclamations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-gray-700">
                <p>
                  Pour toute question concernant vos données personnelles ou pour exercer vos droits :
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="font-semibold">Délégué à la Protection des Données (DPO)</p>
                  <p className="text-sm mt-1">E-mail : dpo@oskar.fr</p>
                </div>
                <p className="text-sm">
                  Vous disposez également du droit d'introduire une réclamation auprès de la
                  Commission Nationale de l'Informatique et des Libertés (CNIL) :
                  <a
                    href="https://www.cnil.fr"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:underline ml-1"
                  >
                    www.cnil.fr
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Footer */}
          <div className="mt-8 text-center text-sm text-gray-500">
            <p>Dernière mise à jour : 11 janvier 2025</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default GDPRPage;