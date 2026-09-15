import React from 'react';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { VueMesCoachs } from '@/components/accompagnement/VueMesCoachs';
import { VueMesDirigeants } from '@/components/accompagnement/VueMesDirigeants';
import { LectureDirigeant } from '@/components/accompagnement/LectureDirigeant';
import type { Accompagnement, ActivitePiliers, FicheDirigeant, ProfilCoach } from '@/lib/accompagnement/types';

/*
 * Les écrans d'accompagnement avec des données d'essai : les vraies passent par
 * les fonctions de la migration 20260915_accompagnements.
 */

const maintenant = new Date('2026-09-15T10:00:00Z');
const heures = (n: number) => new Date(maintenant.getTime() - n * 3600 * 1000);
const rien: ActivitePiliers = { vision: null, fit: null, finance: null, okr: null, team: null, bilans: null };

function lien(p: Partial<Accompagnement> & Pick<Accompagnement, 'id' | 'role'>): Accompagnement {
  return {
    statut: 'actif',
    initiePar: 'coach',
    aMoiDeRepondre: false,
    autre: { id: `u-${p.id}`, nom: null, email: `${p.id}@exemple.fr`, entreprise: null, activite: null, structure: null },
    resumeQuotidien: true,
    coachVuLe: null,
    creeLe: heures(48),
    reponduLe: heures(40),
    activite: null,
    ...p,
  };
}

describe('Mes coachs (dirigeant)', () => {
  const invitation = lien({
    id: 'i1',
    role: 'dirigeant',
    statut: 'en_attente',
    aMoiDeRepondre: true,
    autre: { id: 'c1', nom: 'Élodie Vasseur', email: 'elodie@exemple.fr', entreprise: null, activite: null, structure: 'Vasseur Coaching' },
  });
  const actif = lien({
    id: 'a1',
    role: 'dirigeant',
    autre: { id: 'c2', nom: 'Mathieu Perrin', email: 'm@exemple.fr', entreprise: null, activite: null, structure: null },
  });

  const props = () => ({
    liste: [invitation, actif],
    peutRelier: true,
    onInviter: jest.fn().mockResolvedValue(true),
    onRepondre: jest.fn().mockResolvedValue(true),
    onTerminer: jest.fn().mockResolvedValue(true),
    maintenant,
  });

  it('annonce la transparence et n’accepte une invitation qu’une fois la case cochée', async () => {
    const p = props();
    render(<VueMesCoachs {...p} />);
    expect(screen.getByText('Transparence totale.')).toBeInTheDocument();

    const carte = screen.getByText('Élodie Vasseur').closest('div.relative') as HTMLElement;
    const accepter = within(carte).getByRole('button', { name: 'Accepter' });
    expect(accepter).toBeDisabled();
    fireEvent.click(within(carte).getByRole('checkbox'));
    expect(accepter).toBeEnabled();
    fireEvent.click(accepter);
    await waitFor(() => expect(p.onRepondre).toHaveBeenCalledWith('i1', true));
  });

  it('invite un coach avec une adresse valide et la case cochée', async () => {
    const p = props();
    render(<VueMesCoachs {...p} />);
    const envoyer = screen.getByRole('button', { name: 'Envoyer la demande' });
    fireEvent.change(screen.getByLabelText('Adresse email de votre coach'), { target: { value: 'pas-une-adresse' } });
    fireEvent.click(screen.getByLabelText(/ce coach verra tout/, { selector: '#engagement-invitation' }));
    expect(envoyer).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Adresse email de votre coach'), { target: { value: ' coach@cabinet.fr ' } });
    expect(envoyer).toBeEnabled();
    fireEvent.click(envoyer);
    await waitFor(() => expect(p.onInviter).toHaveBeenCalledWith('coach@cabinet.fr'));
  });

  it('met fin à un accompagnement après confirmation', async () => {
    const p = props();
    jest.spyOn(window, 'confirm').mockReturnValueOnce(true);
    render(<VueMesCoachs {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Mettre fin' }));
    await waitFor(() => expect(p.onTerminer).toHaveBeenCalledWith('a1', false));
  });

  it('sans la formule, renvoie vers les formules au lieu du formulaire', () => {
    render(<VueMesCoachs {...props()} peutRelier={false} />);
    expect(screen.queryByRole('button', { name: 'Envoyer la demande' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Accepter' })).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: 'Voir les formules' }).length).toBeGreaterThan(0);
  });
});

describe('Mes dirigeants (coach)', () => {
  const profil: ProfilCoach = {
    disponible: true,
    resumeQuotidien: true,
    structure: 'Vasseur Coaching',
    zone: 'Hérault',
    piliers: ['vision'],
    referenceLe: new Date('2026-09-11T08:00:00Z'),
  };
  const sophie = lien({
    id: 'd1',
    role: 'coach',
    autre: { id: 'sophie', nom: 'Sophie Lemaire', email: 's@exemple.fr', entreprise: 'Boulangerie du Marché', activite: 'Boulanger', structure: null },
    coachVuLe: heures(10),
    activite: { ...rien, vision: heures(2), okr: heures(30) },
  });
  const karim = lien({
    id: 'd2',
    role: 'coach',
    autre: { id: 'karim', nom: 'Karim Benali', email: 'k@exemple.fr', entreprise: 'KB Plomberie', activite: null, structure: null },
    coachVuLe: heures(1),
    activite: { ...rien, fit: heures(5) },
  });
  const demande = lien({
    id: 'd3',
    role: 'coach',
    statut: 'en_attente',
    initiePar: 'dirigeant',
    aMoiDeRepondre: true,
    autre: { id: 'lea', nom: 'Léa Martin', email: 'lea@exemple.fr', entreprise: 'Atelier Léa', activite: null, structure: null },
  });

  const props = () => ({
    liste: [sophie, karim, demande],
    profil,
    onInviter: jest.fn().mockResolvedValue(true),
    onRepondre: jest.fn().mockResolvedValue(true),
    onTerminer: jest.fn().mockResolvedValue(true),
    onReglages: jest.fn().mockResolvedValue(true),
    onResumeDirigeant: jest.fn().mockResolvedValue(true),
    maintenant,
  });

  it('liste les dirigeants, signale ceux qui ont avancé et mène à leur fiche', () => {
    render(<VueMesDirigeants {...props()} />);
    const ligneSophie = screen.getByRole('link', { name: 'Sophie Lemaire' }).closest('tr') as HTMLElement;
    expect(ligneSophie).toHaveTextContent('Nouveau');
    expect(screen.getByRole('link', { name: 'Sophie Lemaire' })).toHaveAttribute('href', '/app/mes-dirigeants/sophie');
    const ligneKarim = screen.getByRole('link', { name: 'Karim Benali' }).closest('tr') as HTMLElement;
    expect(ligneKarim).not.toHaveTextContent('Nouveau');
    // Le plus actif récemment d'abord.
    const noms = screen.getAllByRole('row').slice(1).map((r) => within(r).getAllByRole('link')[0].textContent);
    expect(noms).toEqual(['Sophie Lemaire', 'Karim Benali']);
  });

  it('accepte une demande de dirigeant', async () => {
    const p = props();
    render(<VueMesDirigeants {...p} />);
    fireEvent.click(screen.getByRole('button', { name: 'Accepter' }));
    await waitFor(() => expect(p.onRepondre).toHaveBeenCalledWith('d3', true));
  });

  it('règle le résumé par dirigeant et la disponibilité', () => {
    const p = props();
    render(<VueMesDirigeants {...p} />);
    fireEvent.click(screen.getByRole('switch', { name: 'Sophie Lemaire dans le résumé de 8 h' }));
    expect(p.onResumeDirigeant).toHaveBeenCalledWith('d1', false);
    fireEvent.click(screen.getByRole('switch', { name: 'Je prends de nouveaux accompagnements' }));
    expect(p.onReglages).toHaveBeenCalledWith({ disponible: false });
  });
});

describe('Fiche d’un dirigeant', () => {
  const fiche: FicheDirigeant = {
    accompagnementId: 'd1',
    depuis: new Date('2026-09-01T08:00:00Z'),
    vuPrecedemment: heures(10),
    resumeQuotidien: true,
    profil: { nom: 'Sophie Lemaire', email: 's@exemple.fr', entreprise: 'Boulangerie du Marché', activite: 'Boulanger' },
    activite: { ...rien, vision: heures(2), okr: heures(30), bilans: heures(200) },
    vision: { pourquoi: 'Nourrir le quartier avec du vrai pain', probleme: 'Trop de pain industriel' },
    fit: null,
    finance: null,
    team: null,
    okr: {
      ambitions: [{ id: 'am1', titre: 'Devenir la boulangerie de référence', description: null, annee: 2026, cible: null, unite: null }],
      objectifs: [{ id: 'o1', ambitionId: 'am1', titre: 'Lancer la tournée', description: null, trimestre: 'Q4', annee: 2026 }],
      resultats: [{ id: 'k1', objectifId: 'o1', titre: 'Clients livrés', cible: 40, actuel: 10, unite: 'clients', echeance: null }],
      actions: [{ id: 'ac1', resultatId: 'k1', titre: 'Acheter un triporteur', statut: 'IN_PROGRESS', echeance: null }],
    },
    bilans: [{ id: 'b1', type: 'organisation', creeLe: new Date('2026-09-05T08:00:00Z'), note: 5.84 }],
  };

  it('dit ce qui a changé et montre ce que le dirigeant a saisi', () => {
    render(<LectureDirigeant fiche={fiche} maintenant={maintenant} />);
    expect(screen.getByRole('heading', { name: 'Sophie Lemaire' })).toBeInTheDocument();
    expect(screen.getByText(/Depuis votre dernière visite/)).toHaveTextContent('Vision');
    // Dans « Le sens », et dans « Votre vision » assemblée à partir du sens.
    expect(screen.getAllByText('Nourrir le quartier avec du vrai pain')).toHaveLength(2);
    expect(screen.getByText('Trop de pain industriel')).toBeInTheDocument();

    const okr = screen.getByRole('region', { name: 'OSKAR OKR' });
    expect(okr).toHaveTextContent('Devenir la boulangerie de référence');
    expect(okr).toHaveTextContent('Clients livrés');
    expect(okr).toHaveTextContent('10 / 40 clients · 25 %');
    expect(okr).toHaveTextContent('En cours');

    expect(screen.getByRole('region', { name: 'OSKAR Market Fit' })).toHaveTextContent('Pas encore commencé.');
    expect(screen.getByRole('region', { name: 'Bilans' })).toHaveTextContent('5,8/10');
  });

  it('ne signale rien comme nouveau à la première visite', () => {
    render(<LectureDirigeant fiche={{ ...fiche, vuPrecedemment: null }} maintenant={maintenant} />);
    expect(screen.getByText(/Première visite/)).toBeInTheDocument();
    expect(screen.queryByText('Nouveau')).not.toBeInTheDocument();
  });
});
