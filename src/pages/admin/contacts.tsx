import React, { useMemo, useState } from 'react';
import { Download, ShieldCheck } from 'lucide-react';
import { AdminShell } from '@/components/admin/AdminShell';
import {
  Bandeau,
  BarreOutils,
  CadreTableau,
  Chargement,
  Erreur,
  PILULE,
  Puces,
  Recherche,
  TAG,
  TD,
  TH,
  noteSur10,
  pluriel,
} from '@/components/admin/elements';
import { useBilansAdmin, useEstAdmin } from '@/hooks/useAdmin';
import { useToast } from '@/hooks/useToast';
import { contactsEnCsv } from '@/lib/admin/csv';
import { dateCourte, dateDeChamp } from '@/lib/admin/formule';
import { contactsSansCompte } from '@/lib/admin/tableauDeBord';
import type { BilanAdmin } from '@/lib/admin/types';

/*
 * Contacts des bilans — vue 4 de plateforme/admin.html. Les personnes qui ont
 * fait un bilan sans compte et laissé leur email (une ligne par email, le
 * bilan le plus récent). Par défaut, seules celles qui acceptent d'être
 * recontactées ; l'export ne contient jamais qu'elles.
 */

type Filtre = 'accepte' | 'tous' | 'organisation' | 'produit';

const FILTRES: { id: Filtre; libelle: string; garde: (b: BilanAdmin) => boolean }[] = [
  { id: 'accepte', libelle: 'Recontact accepté', garde: (b) => b.accepteRecontact },
  { id: 'tous', libelle: 'Tous', garde: () => true },
  { id: 'organisation', libelle: 'Bilan de maturité', garde: (b) => b.type === 'organisation' },
  { id: 'produit', libelle: 'Potentiel Produit', garde: (b) => b.type === 'produit' },
];

function telecharger(nom: string, contenu: string) {
  const url = URL.createObjectURL(new Blob([contenu], { type: 'text/csv;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = nom;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const ContactsAdmin: React.FC = () => {
  const toast = useToast();
  const { estAdmin } = useEstAdmin();
  const { data: bilans, error, isLoading } = useBilansAdmin(estAdmin);
  const [filtre, setFiltre] = useState<Filtre>('accepte');
  const [recherche, setRecherche] = useState('');

  const contacts = useMemo(() => contactsSansCompte(bilans ?? []), [bilans]);
  const options = FILTRES.map((f) => ({ id: f.id, libelle: f.libelle, nombre: contacts.filter(f.garde).length }));

  const garde = FILTRES.find((f) => f.id === filtre)?.garde ?? (() => true);
  const q = recherche.trim().toLowerCase();
  const lignes = contacts.filter((b) => garde(b) && (!q || (b.email ?? '').toLowerCase().includes(q)));

  const exporter = () => {
    const autorises = lignes.filter((b) => b.accepteRecontact);
    if (!autorises.length) {
      toast.info('Aucun contact de cette liste n’a accepté d’être recontacté.');
      return;
    }
    telecharger(`contacts-oskar-${dateDeChamp(new Date())}.csv`, contactsEnCsv(autorises));
    toast.success(`${pluriel(autorises.length, 'contact exporté', 'contacts exportés')}.`);
  };

  return (
    <AdminShell
      titre="Contacts des bilans"
      sousTitre="Les personnes qui ont fait le Diagnostic ou le Potentiel Produit sans créer de compte, et laissé leur email pour recevoir leur synthèse."
      actions={
        <button
          type="button"
          onClick={exporter}
          disabled={!contacts.length}
          className="inline-flex items-center gap-1.5 px-[18px] py-[10.5px] text-15.5 font-semibold rounded-[10.5px] bg-transparent text-navy border-[1.5px] border-line transition-all hover:border-navy hover:bg-[#f0f2ff] disabled:opacity-50"
        >
          <Download className="w-[15px] h-[15px]" aria-hidden />
          Exporter (CSV)
        </button>
      }
    >
      <Bandeau ton="teal" icone={<ShieldCheck aria-hidden />}>
        <strong className="text-navy">RGPD.</strong> Ces personnes ont demandé leur synthèse, pas forcément à être
        recontactées. Seules celles qui ont coché « J&rsquo;accepte qu&rsquo;Oskar me recontacte » peuvent être
        sollicitées. L&rsquo;export ne contient qu&rsquo;elles.
      </Bandeau>

      <BarreOutils>
        <Recherche valeur={recherche} onChange={setRecherche} placeholder="Email…" />
        <Puces libelle="Filtrer les contacts" options={options} valeur={filtre} onChange={setFiltre} />
      </BarreOutils>

      {error ? (
        <Erreur message={(error as Error).message} />
      ) : isLoading || !bilans ? (
        <Chargement />
      ) : (
        <CadreTableau
          pied={
            <>
              <span>{pluriel(lignes.length, 'contact')}</span>
              <span>Un contact qui crée ensuite un compte avec le même email y est rattaché automatiquement.</span>
            </>
          }
        >
          <table className="w-full border-collapse text-14.5">
            <thead>
              <tr>
                <th className={TH}>Email</th>
                <th className={TH}>Bilan</th>
                <th className={TH}>Date</th>
                <th className={TH}>Résultat</th>
                <th className={TH}>Recontact accepté</th>
                <th className={TH}>Compte créé depuis</th>
              </tr>
            </thead>
            <tbody className="[&>tr:last-child>td]:border-b-0">
              {lignes.map((b) => (
                <tr key={b.id}>
                  <td className={`${TD} font-bold text-navy break-all`}>{b.email}</td>
                  <td className={TD}>
                    {b.type === 'produit' ? (
                      <span className={`${PILULE} bg-fit-light text-fit-dark`}>Potentiel Produit</span>
                    ) : (
                      <span className={`${PILULE} bg-teal-light text-teal-dark`}>Bilan de maturité</span>
                    )}
                  </td>
                  <td className={`${TD} text-muted whitespace-nowrap`}>{dateCourte(b.creeLe)}</td>
                  <td className={TD}>
                    {b.note == null ? (
                      <span className="text-muted">—</span>
                    ) : (
                      <span className="font-extrabold text-navy">
                        {noteSur10(b.note)}
                        <small className="font-medium text-muted text-[0.8em]">/10</small>
                      </span>
                    )}
                  </td>
                  <td className={TD}>
                    {b.accepteRecontact ? (
                      <span className={`${TAG} bg-fit-light text-fit-dark`}>Oui</span>
                    ) : (
                      <span className={`${TAG} bg-[#f3f4f6] text-[#9ca3af]`}>Non</span>
                    )}
                  </td>
                  <td className={TD}>
                    {b.compteExiste ? <span className={`${TAG} bg-[#f0f2ff] text-navy`}>Oui</span> : <span className="text-muted">—</span>}
                  </td>
                </tr>
              ))}
              {lignes.length === 0 && (
                <tr>
                  <td colSpan={6} className={`${TD} text-center text-muted py-7`}>
                    Aucun contact ne correspond.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CadreTableau>
      )}
    </AdminShell>
  );
};

export default ContactsAdmin;
