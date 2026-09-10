import React from 'react';
import Link from 'next/link';
import { Shield, FileText, Cookie, Mail, Github, Twitter, Linkedin, Settings } from 'lucide-react';
import { openCookieSettings } from '@/components/ui/CookieBanner';
import { APP_CONFIG } from '@/constants';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-50 border-t border-gray-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* À propos */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Oskar
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Votre coach IA pour définir et atteindre vos objectifs d'entreprise avec la méthode OKR.
            </p>
            <div className="flex space-x-4">
              <a
                href="https://github.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="GitHub"
              >
                <Github className="h-5 w-5" />
              </a>
              <a
                href="https://twitter.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="Twitter"
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a
                href="https://linkedin.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-gray-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Produit
            </h3>
            <ul className="space-y-3">
              <li>
                <Link href="/app/okr/canvas" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Canvas OKR
                </Link>
              </li>
              <li>
                <Link href="/app/okr" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Mes OKR
                </Link>
              </li>
              <li>
                <Link href="/app/okr/management" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Gestion
                </Link>
              </li>
              <li>
                <Link href="/app/okr/reports" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Rapports
                </Link>
              </li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Ressources
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Documentation
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Guide OKR
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  Blog
                </a>
              </li>
              <li>
                <a href="#" className="text-sm text-gray-600 hover:text-primary-600 transition-colors">
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-sm font-semibold text-gray-900 uppercase tracking-wider mb-4">
              Légal
            </h3>
            <ul className="space-y-3">
              <li>
                <Link
                  href="/legal/privacy-policy"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Confidentialité
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/terms-of-service"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/cookies-policy"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center"
                >
                  <Cookie className="h-4 w-4 mr-2" />
                  Cookies
                </Link>
              </li>
              <li>
                <Link
                  href="/legal/gdpr"
                  className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center"
                >
                  <Shield className="h-4 w-4 mr-2" />
                  Vos droits RGPD
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Séparateur */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center space-y-4 md:space-y-0">
            {/* Copyright et version */}
            {/* Même raison que dans AppShell : version et année peuvent différer
                entre le rendu serveur et le rendu client, sans conséquence. */}
            <p className="text-sm text-gray-500" suppressHydrationWarning>
              © {currentYear} Oskar v{APP_CONFIG.version}. Tous droits réservés.
            </p>

            {/* Bouton paramètres cookies */}
            <button
              onClick={openCookieSettings}
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" aria-hidden="true" />
              Paramètres des cookies
            </button>

            {/* Contact */}
            <a
              href="mailto:contact@oskar.com"
              className="text-sm text-gray-600 hover:text-primary-600 transition-colors flex items-center"
            >
              <Mail className="h-4 w-4 mr-2" />
              contact@oskar.com
            </a>
          </div>

          {/* Mentions légales supplémentaires */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              Oskar utilise l'IA Google Gemini pour fournir des conseils personnalisés.
              Les conseils fournis sont à titre informatif uniquement.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
};
