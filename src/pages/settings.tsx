import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAppStore } from '@/store/useAppStore';
import { urlConnexion } from '@/lib/authFlux';
import { supabase } from '@/lib/supabaseClient';
import { Settings, User, Bell, Lock, Trash2, Download, Eye, EyeOff, Save, CreditCard, Beaker, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { SubscriptionTab } from '@/components/settings/SubscriptionTab';

const SettingsPage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated, experimentalFeatures, toggleExperimentalFeature } = useAppStore();

  useEffect(() => {
    if (authReady && !isAuthenticated) router.replace(urlConnexion(router.asPath));
  }, [authReady, isAuthenticated, router]);
  const [activeTab, setActiveTab] = useState<'profile' | 'subscription' | 'notifications' | 'privacy' | 'data' | 'experimental'>('profile');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // États pour le profil
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  // États pour les notifications
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [pushNotifications, setPushNotifications] = useState(false);
  const [weeklyDigest, setWeeklyDigest] = useState(true);

  // États pour la confidentialité
  const [showEmail, setShowEmail] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleUpdateProfile = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        data: { name }
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Profil mis à jour avec succès' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdatePassword = async () => {
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'Les mots de passe ne correspondent pas' });
      return;
    }

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: 'Le mot de passe doit contenir au moins 6 caractères' });
      return;
    }

    setIsLoading(true);
    setMessage(null);

    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) throw error;

      setMessage({ type: 'success', text: 'Mot de passe mis à jour avec succès' });
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la mise à jour' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = async () => {
    if (!user) return;
    setIsLoading(true);
    setMessage(null);

    try {
      // Récupérer toutes les données de l'utilisateur
      const { data: ambitions } = await supabase.from('ambitions').select('*').eq('user_id', user.id);
      const { data: quarterlyObjectives } = await supabase.from('quarterly_objectives').select('*').eq('user_id', user.id);
      const { data: quarterlyKeyResults } = await supabase.from('quarterly_key_results').select('*').eq('user_id', user.id);
      const { data: actions } = await supabase.from('actions').select('*').eq('user_id', user.id);

      const exportData = {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          exportedAt: new Date().toISOString(),
        },
        ambitions: ambitions || [],
        quarterlyObjectives: quarterlyObjectives || [],
        quarterlyKeyResults: quarterlyKeyResults || [],
        actions: actions || [],
      };

      // Télécharger le fichier JSON
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `oskar-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setMessage({ type: 'success', text: 'Données exportées avec succès' });
    } catch (error: any) {
      setMessage({ type: 'error', text: error.message || 'Erreur lors de l\'export' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    const confirmed = window.confirm(
      '⚠️ ATTENTION : Cette action est irréversible !\n\n' +
      'Toutes vos données seront définitivement supprimées :\n' +
      '- Objectifs annuels et objectifs trimestriels\n' +
      '- Key Results et actions\n' +
      '- Équipes et invitations\n' +
      '- Historique de progression\n\n' +
      'Voulez-vous vraiment supprimer votre compte ?'
    );

    if (!confirmed) return;

    const doubleConfirm = window.confirm(
      'Êtes-vous ABSOLUMENT sûr(e) ?\n\n' +
      'Cette action ne peut pas être annulée.'
    );

    if (!doubleConfirm) return;

    setIsLoading(true);
    setMessage(null);

    try {
      // Supprimer toutes les données de l'utilisateur dans l'ordre (pour respecter les contraintes FK)
      console.log('🗑️ Suppression des données utilisateur...');

      // 1. Supprimer les commentaires
      await supabase.from('comments').delete().eq('user_id', user.id);
      console.log('✅ Commentaires supprimés');

      // 2. Supprimer les actions
      await supabase.from('actions').delete().eq('user_id', user.id);
      console.log('✅ Actions supprimées');

      // 3. Supprimer les quarterly_key_results (via cascade depuis quarterly_objectives)
      // Les quarterly_key_results seront supprimés automatiquement via ON DELETE CASCADE

      // 4. Supprimer les quarterly_objectives
      await supabase.from('quarterly_objectives').delete().eq('user_id', user.id);
      console.log('✅ Quarterly Objectives supprimés (+ KRs trimestriels via cascade)');

      // 5. Supprimer les key_results (annuels) (via cascade depuis ambitions)
      // Les key_results seront supprimés automatiquement via ON DELETE CASCADE

      // 6. Supprimer les ambitions
      await supabase.from('ambitions').delete().eq('user_id', user.id);
      console.log('✅ Ambitions supprimées (+ KRs annuels via cascade)');

      // 7. Supprimer les partages d'objectifs (partagés par l'utilisateur)
      await supabase.from('shared_objectives').delete().eq('shared_by', user.id);
      console.log('✅ Partages créés supprimés');

      // 8. Supprimer les partages d'objectifs (partagés avec l'utilisateur)
      await supabase.from('shared_objectives').delete().eq('shared_with_user_id', user.id);
      console.log('✅ Partages reçus supprimés');

      // 9. Supprimer les notifications
      await supabase.from('notifications').delete().eq('user_id', user.id);
      console.log('✅ Notifications supprimées');

      // 10. Supprimer les invitations (envoyées)
      await supabase.from('invitations').delete().eq('invited_by', user.id);
      console.log('✅ Invitations envoyées supprimées');

      // 11. Supprimer les invitations (reçues)
      await supabase.from('invitations').delete().eq('email', user.email);
      console.log('✅ Invitations reçues supprimées');

      // 12. Supprimer les team_members
      await supabase.from('team_members').delete().eq('user_id', user.id);
      console.log('✅ Membres d\'équipe supprimés');

      // 13. Supprimer les équipes dont l'utilisateur est propriétaire
      await supabase.from('teams').delete().eq('owner_id', user.id);
      console.log('✅ Équipes supprimées');

      // 14. Supprimer l'historique de progression
      await supabase.from('progress').delete().eq('user_id', user.id);
      console.log('✅ Historique de progression supprimé');

      // 15. Supprimer l'abonnement
      await supabase.from('subscriptions').delete().eq('user_id', user.id);
      console.log('✅ Abonnement supprimé');

      // 16. Supprimer le profil
      await supabase.from('profiles').delete().eq('id', user.id);
      console.log('✅ Profil supprimé');

      // 17. Supprimer le compte Supabase Auth
      const { error } = await supabase.rpc('delete_user');

      if (error) throw error;

      console.log('✅ Compte supprimé avec succès');

      // Déconnexion
      await supabase.auth.signOut();
      window.location.href = '/auth/login';
    } catch (error: any) {
      console.error('❌ Erreur lors de la suppression:', error);
      setMessage({ type: 'error', text: error.message || 'Erreur lors de la suppression' });
      setIsLoading(false);
    }
  };

  const tabs = [
    { id: 'profile' as const, label: 'Profil', icon: User },
    { id: 'subscription' as const, label: 'Abonnement', icon: CreditCard },
    { id: 'experimental' as const, label: 'Expérimental', icon: Beaker },
    { id: 'notifications' as const, label: 'Notifications', icon: Bell },
    { id: 'privacy' as const, label: 'Confidentialité', icon: Lock },
    { id: 'data' as const, label: 'Données', icon: Download },
  ];

  if (!user) {
    return (
      <AppShell title="Paramètres" topbarTitle="Paramètres">
        <div className="flex flex-col items-center justify-center py-32 text-muted" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-teal mb-4" aria-hidden />
          <p className="text-sm">Chargement de vos paramètres…</p>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell
      title="Paramètres"
      description="Gérez votre compte et vos préférences"
      topbarTitle="Paramètres"
      topbarSubtitle="Compte & préférences"
      topbarActions={<UserMenu />}
      contentMaxWidth="max-w-7xl"
    >
      <div>
        {/* En-tête */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-navy flex items-center">
            <Settings className="h-7 w-7 mr-3 text-teal-dark" aria-hidden />
            Paramètres
          </h1>
          <p className="mt-2 text-muted">
            Gérez votre compte et vos préférences
          </p>
        </div>

        {/* Message de feedback */}
        {message && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            role={message.type === 'error' ? 'alert' : 'status'}
            className={`mb-6 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}
          >
            {message.text}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="mb-6 border-b border-line">
          <nav className="-mb-px flex flex-wrap gap-x-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  aria-current={activeTab === tab.id ? 'page' : undefined}
                  className={`flex items-center py-4 px-1 border-b-2 font-medium text-sm transition-colors ${activeTab === tab.id
                    ? 'border-teal text-teal-dark'
                    : 'border-transparent text-muted hover:text-navy hover:border-line'
                    }`}
                >
                  <Icon className="h-5 w-5 mr-2" aria-hidden />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Contenu des tabs */}
        <div className="space-y-6">
          {/* Tab Profil */}
          {activeTab === 'profile' && (
            <Card>
              <CardHeader>
                <CardTitle>Informations du profil</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label htmlFor="settings-name" className="block text-sm font-medium text-gray-700 mb-2">Nom</label>
                  <input
                    id="settings-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-lg border border-line px-3 py-2 text-sm shadow-sm transition-colors focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                  />
                </div>
                <div>
                  <label htmlFor="settings-email" className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                  <input
                    id="settings-email"
                    type="email"
                    value={email}
                    disabled
                    className="block w-full rounded-lg border border-line bg-surface px-3 py-2 text-sm text-muted cursor-not-allowed"
                  />
                  <p className="text-xs text-muted mt-1">L'email ne peut pas être modifié</p>
                </div>
                <Button onClick={handleUpdateProfile} disabled={isLoading} leftIcon={<Save className="h-4 w-4" />}>
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Tab Abonnement */}
          {activeTab === 'subscription' && user && (
            <SubscriptionTab userId={user.id} />
          )}

          {/* Tab Expérimental */}
          {activeTab === 'experimental' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-navy">
                  <Beaker className="h-5 w-5 text-teal-dark" aria-hidden />
                  Fonctionnalités expérimentales
                </CardTitle>
                <p className="text-sm text-muted mt-2">
                  Activez ou désactivez les fonctionnalités en cours de développement
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">Check-in</p>
                    <p className="text-sm text-muted">Page de suivi quotidien et hebdomadaire</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={experimentalFeatures.checkIn}
                    aria-label="Activer la fonctionnalité Check-in"
                    onClick={() => toggleExperimentalFeature('checkIn')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${experimentalFeatures.checkIn ? 'bg-teal' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${experimentalFeatures.checkIn ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">Focus</p>
                    <p className="text-sm text-muted">Mode concentration avec pomodoro</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={experimentalFeatures.focus}
                    aria-label="Activer la fonctionnalité Focus"
                    onClick={() => toggleExperimentalFeature('focus')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${experimentalFeatures.focus ? 'bg-teal' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${experimentalFeatures.focus ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">Canvas</p>
                    <p className="text-sm text-muted">Visualisation stratégique de vos objectifs</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={experimentalFeatures.canvas}
                    aria-label="Activer la fonctionnalité Canvas"
                    onClick={() => toggleExperimentalFeature('canvas')}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${experimentalFeatures.canvas ? 'bg-teal' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${experimentalFeatures.canvas ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Notifications */}
          {activeTab === 'notifications' && (
            <Card>
              <CardHeader>
                <CardTitle>Préférences de notifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">Notifications par email</p>
                    <p className="text-sm text-muted">Recevoir des emails pour les mises à jour importantes</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={emailNotifications}
                    aria-label="Activer les notifications par email"
                    onClick={() => setEmailNotifications(!emailNotifications)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${emailNotifications ? 'bg-teal' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${emailNotifications ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-navy">Résumé hebdomadaire</p>
                    <p className="text-sm text-muted">Recevoir un résumé de vos progrès chaque semaine</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={weeklyDigest}
                    aria-label="Activer le résumé hebdomadaire"
                    onClick={() => setWeeklyDigest(!weeklyDigest)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal focus-visible:ring-offset-2 ${weeklyDigest ? 'bg-teal' : 'bg-gray-200'
                      }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${weeklyDigest ? 'translate-x-6' : 'translate-x-1'
                        }`}
                    />
                  </button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Confidentialité */}
          {activeTab === 'privacy' && (
            <Card>
              <CardHeader>
                <CardTitle>Sécurité et confidentialité</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="font-medium text-navy">Changer le mot de passe</h3>
                  <div>
                    <label htmlFor="settings-new-password" className="block text-sm font-medium text-gray-700 mb-2">Nouveau mot de passe</label>
                    <div className="relative">
                      <input
                        id="settings-new-password"
                        type={showPassword ? 'text' : 'password'}
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="block w-full rounded-lg border border-line px-3 py-2 pr-10 text-sm shadow-sm transition-colors focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                        placeholder="Minimum 6 caractères"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        aria-label={showPassword ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-navy"
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" aria-hidden /> : <Eye className="h-4 w-4" aria-hidden />}
                      </button>
                    </div>
                  </div>
                  <div>
                    <label htmlFor="settings-confirm-password" className="block text-sm font-medium text-gray-700 mb-2">Confirmer le mot de passe</label>
                    <input
                      id="settings-confirm-password"
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full rounded-lg border border-line px-3 py-2 text-sm shadow-sm transition-colors focus:border-teal focus:outline-none focus:ring-1 focus:ring-teal"
                      placeholder="Retapez le mot de passe"
                    />
                  </div>
                  <Button onClick={handleUpdatePassword} disabled={isLoading || !newPassword || !confirmPassword}>
                    {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Tab Données */}
          {activeTab === 'data' && (
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Exporter mes données</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted mb-4">
                    Téléchargez toutes vos données au format JSON (conforme RGPD)
                  </p>
                  <Button onClick={handleExportData} disabled={isLoading} leftIcon={<Download className="h-4 w-4" />}>
                    {isLoading ? 'Export en cours...' : 'Exporter mes données'}
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="text-red-600">Zone de danger</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted mb-4">
                    La suppression de votre compte est définitive et irréversible. Toutes vos données seront perdues.
                  </p>
                  <Button
                    variant="danger"
                    onClick={handleDeleteAccount}
                    disabled={isLoading}
                    leftIcon={<Trash2 className="h-4 w-4" />}
                  >
                    {isLoading ? 'Suppression...' : 'Supprimer mon compte'}
                  </Button>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
};

export default SettingsPage;

