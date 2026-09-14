import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from '@/components/ui/Button';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * Error Boundary pour capturer les erreurs React et éviter que l'app ne plante
 */
class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    // Mettre à jour l'état pour afficher l'UI de fallback
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Logger l'erreur
    console.error('❌ Error Boundary a capturé une erreur:', error);
    console.error('❌ Stack trace:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });

    // Envoyer l'erreur à un service de monitoring (Sentry, etc.) si configuré
    // TODO: Intégrer Sentry ou autre service de monitoring
  }

  handleReset = () => {
    // Réinitialiser l'état
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });

    // Nettoyer le cache React Query et le localStorage corrompu
    if (typeof window !== 'undefined') {
      // Recharger la page pour repartir sur une base saine
      window.location.reload();
    }
  };

  handleGoHome = () => {
    // Nettoyer et rediriger vers l'accueil
    if (typeof window !== 'undefined') {
      window.location.href = '/';
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8">
            {/* Icône d'erreur */}
            <div className="flex justify-center mb-6">
              <div className="bg-red-100 rounded-full p-4">
                <AlertTriangle className="h-12 w-12 text-red-600" />
              </div>
            </div>

            {/* Titre */}
            <h1 className="text-3xl font-bold text-gray-900 text-center mb-4">
              Oups ! Une erreur s'est produite
            </h1>

            {/* Message */}
            <p className="text-gray-600 text-center mb-6">
              L'application a rencontré une erreur inattendue. Ne vous inquiétez pas, vos données sont sauvegardées.
            </p>

            {/* Détails de l'erreur (en mode développement) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h2 className="text-sm font-semibold text-gray-700 mb-2">
                  Détails de l'erreur (mode développement) :
                </h2>
                <pre className="text-xs text-red-600 overflow-auto max-h-40">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-600 cursor-pointer hover:text-gray-800">
                      Voir la stack trace
                    </summary>
                    <pre className="text-xs text-gray-600 overflow-auto max-h-60 mt-2">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button
                onClick={this.handleReset}
                leftIcon={<RefreshCw className="h-4 w-4" />}
                variant="primary"
              >
                Rafraîchir la page
              </Button>
              <Button
                onClick={this.handleGoHome}
                leftIcon={<Home className="h-4 w-4" />}
                variant="outline"
              >
                Retour à l'accueil
              </Button>
            </div>

            {/* Conseils */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="text-sm font-semibold text-blue-900 mb-2">
                💡 Que faire si le problème persiste ?
              </h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Essayez de vous déconnecter puis de vous reconnecter</li>
                <li>• Videz le cache de votre navigateur (Ctrl+Shift+Delete)</li>
                <li>• Ouvrez l'application dans une fenêtre de navigation privée</li>
                <li>• Contactez le support si le problème continue</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

