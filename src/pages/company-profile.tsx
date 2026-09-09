import React, { useEffect } from 'react';
import { useRouter } from 'next/router';
import { Loader2 } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { UserMenu } from '@/components/layout/UserMenu';
import { CompanyProfileForm } from '@/components/ui/CompanyProfileForm';
import { useAppStore } from '@/store/useAppStore';
import { APRES_CONNEXION, urlConnexion } from '@/lib/authFlux';
import type { CompanyProfile } from '@/types';

const CompanyProfilePage: React.FC = () => {
  const router = useRouter();
  const { user, authReady, isAuthenticated, updateCompanyProfile } = useAppStore();

  useEffect(() => {
    if (authReady && !isAuthenticated) router.replace(urlConnexion(router.asPath));
  }, [authReady, isAuthenticated, router]);

  const handleCompanyProfileSubmit = (companyProfile: CompanyProfile) => {
    updateCompanyProfile(companyProfile);
    router.push(APRES_CONNEXION);
  };

  return (
    <AppShell
      title="Profil d'entreprise"
      description="Modifiez les informations de votre entreprise"
      topbarTitle="Profil d'entreprise"
      topbarSubtitle="Vos informations société"
      topbarActions={<UserMenu />}
      contentMaxWidth="max-w-4xl"
    >
      {isAuthenticated && user ? (
        <CompanyProfileForm
          initialData={user?.companyProfile}
          onSubmit={handleCompanyProfileSubmit}
        />
      ) : (
        <div className="flex flex-col items-center justify-center py-32 text-muted" aria-live="polite">
          <Loader2 className="h-8 w-8 animate-spin text-teal mb-4" aria-hidden />
          <p className="text-sm">Chargement de votre profil…</p>
        </div>
      )}
    </AppShell>
  );
};

export default CompanyProfilePage;
