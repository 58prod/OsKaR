import {
  CLE_VISITE,
  CLE_VISITEUR,
  Chrono,
  PAUSE_VISITE,
  VIE_VISITEUR,
  appareil,
  cheminMesurable,
  hoteMesure,
  identifiantVisite,
  identifiantVisiteur,
  mesureAutorisee,
  provenance,
  uuid,
} from '@/lib/statistiques/mesure';
import {
  dureeLisible,
  evolution,
  nomPage,
  part,
  pasPour,
  regrouper,
  uneDecimale,
  versStatistiques,
  type JourStats,
} from '@/lib/statistiques/rapport';

/*
 * Mesure d'audience : ce qui est compté, les identifiants anonymes, le temps
 * passé, puis les mises en forme de l'écran /admin/statistiques.
 */

const memoire = () => {
  const m = new Map<string, string>();
  return { getItem: (k: string) => m.get(k) ?? null, setItem: (k: string, v: string) => void m.set(k, v), m };
};

let compteur = 0;
const nouvelId = () => `id-${++compteur}`;
const T0 = new Date(2026, 8, 14, 10, 0).getTime();

describe('ce qui est compté', () => {
  const base = { hote: 'oskar-coach.fr', refus: false };

  it('compte le site en ligne', () => {
    expect(mesureAutorisee(base)).toBe(true);
  });

  it('ne compte ni le poste de développement, ni un refus, ni Global Privacy Control, ni Do Not Track, ni un robot', () => {
    expect(mesureAutorisee({ ...base, hote: 'localhost' })).toBe(false);
    expect(mesureAutorisee({ ...base, hote: '127.0.0.1' })).toBe(false);
    expect(mesureAutorisee({ ...base, refus: true })).toBe(false);
    expect(mesureAutorisee({ ...base, gpc: true })).toBe(false);
    expect(mesureAutorisee({ ...base, dnt: '1' })).toBe(false);
    expect(mesureAutorisee({ ...base, robot: true })).toBe(false);
  });

  it("laisse de côté l'administration, les retours de connexion et les erreurs", () => {
    expect(cheminMesurable('/')).toBe(true);
    expect(cheminMesurable('/app/okr')).toBe(true);
    expect(cheminMesurable('/invitations/[token]')).toBe(true);
    expect(cheminMesurable('/auth/login')).toBe(true);
    expect(cheminMesurable('/admin')).toBe(false);
    expect(cheminMesurable('/admin/statistiques')).toBe(false);
    expect(cheminMesurable('/auth/callback')).toBe(false);
    expect(cheminMesurable('/_error')).toBe(false);
    expect(cheminMesurable('/404')).toBe(false);
    // Une page dont le nom commence comme « admin » reste comptée.
    expect(cheminMesurable('/administratif')).toBe(true);
  });

  it('confond www et le domaine nu', () => {
    expect(hoteMesure('WWW.Oskar-Coach.fr')).toBe('oskar-coach.fr');
  });
});

describe('provenance', () => {
  it("garde le site précédent, sans le www, et ignore les pages d'Oskar", () => {
    expect(provenance('https://www.google.com/search?q=okr', 'oskar-coach.fr')).toBe('google.com');
    expect(provenance('https://www.oskar-coach.fr/pricing', 'oskar-coach.fr')).toBeNull();
    expect(provenance('', 'oskar-coach.fr')).toBeNull();
    expect(provenance('pas une adresse', 'oskar-coach.fr')).toBeNull();
  });

  it("préfère l'utm_source d'un lien de campagne", () => {
    expect(provenance('https://www.linkedin.com/', 'oskar-coach.fr', '?utm_source=Newsletter')).toBe('newsletter');
  });
});

describe('appareil', () => {
  it('suit la largeur de la fenêtre', () => {
    expect(appareil(390)).toBe('mobile');
    expect(appareil(820)).toBe('tablette');
    expect(appareil(1440)).toBe('ordinateur');
  });
});

describe('identifiants anonymes', () => {
  it('garde le même visiteur, puis le renouvelle au bout de 13 mois', () => {
    const s = memoire();
    const a = identifiantVisiteur(s, T0, nouvelId);
    expect(identifiantVisiteur(s, T0 + VIE_VISITEUR - 1, nouvelId)).toBe(a);
    const b = identifiantVisiteur(s, T0 + VIE_VISITEUR, nouvelId);
    expect(b).not.toBe(a);
    expect(JSON.parse(s.m.get(CLE_VISITEUR) as string)).toEqual({ id: b, depuis: T0 + VIE_VISITEUR });
  });

  it('refait un identifiant si le stockage est abîmé', () => {
    const s = memoire();
    s.setItem(CLE_VISITEUR, '{pas du json');
    expect(identifiantVisiteur(s, T0, nouvelId)).toMatch(/^id-/);
  });

  it('prolonge la visite à chaque page, en ouvre une nouvelle après 30 minutes sans page', () => {
    const s = memoire();
    const v1 = identifiantVisite(s, T0, nouvelId);
    expect(v1.nouvelle).toBe(true);
    const v2 = identifiantVisite(s, T0 + PAUSE_VISITE - 1, nouvelId);
    expect(v2).toEqual({ id: v1.id, nouvelle: false });
    // 29 minutes après la page précédente : toujours la même visite.
    expect(identifiantVisite(s, T0 + 2 * PAUSE_VISITE - 2, nouvelId).id).toBe(v1.id);
    const v3 = identifiantVisite(s, T0 + 4 * PAUSE_VISITE, nouvelId);
    expect(v3.nouvelle).toBe(true);
    expect(v3.id).not.toBe(v1.id);
    expect(s.m.has(CLE_VISITE)).toBe(true);
  });

  it('tire des UUID valides', () => {
    expect(uuid()).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/);
  });
});

describe('temps passé sur la page', () => {
  it("ne compte que l'onglet visible", () => {
    const c = new Chrono(T0, true);
    c.pause(T0 + 20_000);
    c.reprise(T0 + 80_000); // une minute en arrière-plan
    expect(c.secondes(T0 + 90_000)).toBe(30);
  });

  it('démarre à zéro pour un onglet ouvert en arrière-plan', () => {
    const c = new Chrono(T0, false);
    expect(c.secondes(T0 + 60_000)).toBe(0);
    c.reprise(T0 + 60_000);
    expect(c.secondes(T0 + 65_000)).toBe(5);
  });

  it('plafonne à 30 minutes et ignore les pauses répétées', () => {
    const c = new Chrono(T0, true);
    c.pause(T0 + 1000);
    c.pause(T0 + 5000);
    expect(c.secondes(T0 + 10_000)).toBe(1);
    c.reprise(T0 + 10_000);
    expect(c.secondes(T0 + 3 * 60 * 60 * 1000)).toBe(1800);
  });
});

describe('mises en forme', () => {
  it('écrit les durées', () => {
    expect(dureeLisible(0)).toBe('0 s');
    expect(dureeLisible(45)).toBe('45 s');
    expect(dureeLisible(185)).toBe('3 min 05');
    expect(dureeLisible(4320)).toBe('1 h 12');
  });

  it('calcule évolutions et parts', () => {
    expect(evolution(120, 100)).toBe(20);
    expect(evolution(50, 100)).toBe(-50);
    expect(evolution(10, 0)).toBeNull();
    expect(part(1, 3)).toBe(33);
    expect(part(4, 0)).toBe(0);
    expect(uneDecimale(2.46)).toBe('2,5');
  });

  it('nomme les pages connues et laisse les autres à leur adresse', () => {
    expect(nomPage('/')).toBe('Accueil');
    expect(nomPage('/app/outils/roti')).toBeNull();
  });
});

describe('regroupement des barres', () => {
  const periode = (debut: string, nb: number): JourStats[] =>
    Array.from({ length: nb }, (_, i) => {
      const d = new Date(`${debut}T12:00:00`);
      d.setDate(d.getDate() + i);
      const jour = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      return { jour, vues: 3, visites: 1 };
    });

  it('choisit le pas selon la période', () => {
    expect(pasPour(7)).toBe('jour');
    expect(pasPour(30)).toBe('jour');
    expect(pasPour(90)).toBe('semaine');
    expect(pasPour(365)).toBe('mois');
  });

  it('une barre par jour sur 7 jours, le dernier en cours', () => {
    const b = regrouper(periode('2026-09-08', 7), 7);
    expect(b).toHaveLength(7);
    expect(b[6]).toMatchObject({ libelle: '14/09', visites: 1, vues: 3, courante: true });
    expect(b.filter((x) => x.courante)).toHaveLength(1);
  });

  it('additionne les jours par semaine ISO sur 3 mois', () => {
    const jours = periode('2026-06-17', 90); // du mercredi 17 juin au lundi 14 septembre
    const b = regrouper(jours, 90);
    expect(b[b.length - 1]).toMatchObject({ libelle: 'S38', visites: 1, courante: true });
    expect(b[0].visites).toBe(5); // mercredi → dimanche
    expect(b.reduce((n, x) => n + x.visites, 0)).toBe(90);
  });

  it('additionne par mois sur 12 mois', () => {
    const b = regrouper(periode('2025-09-15', 365), 365);
    expect(b).toHaveLength(13);
    expect(b.reduce((n, x) => n + x.vues, 0)).toBe(365 * 3);
  });
});

describe('lecture de admin_statistiques', () => {
  it('convertit la réponse de la base et comble les manques', () => {
    const s = versStatistiques({
      jours: 7,
      debut: '2026-09-07T22:00:00+00:00',
      totaux: { vues: '12', visiteurs: 4, visites: 5, duree_totale: 600, rebonds: 2, visites_connectees: 1, nouveaux: 3, actifs: 0 },
      precedent: { vues: 6, visiteurs: 2, visites: 3 },
      par_jour: [{ jour: '2026-09-14', vues: 12, visites: 5 }],
      par_heure: [1, 2],
      pages: [{ chemin: '/', vues: 8, visiteurs: 4, duree_moyenne: 42, entrees: 5 }],
      provenances: [{ provenance: null, visites: 3 }, { provenance: 'google.com', visites: 2 }],
      appareils: { mobile: 2 },
      hotes: [{ hote: 'oskar-coach.fr', vues: 12 }],
    });
    expect(s.totaux.vues).toBe(12);
    expect(s.parHeure).toHaveLength(24);
    expect(s.parHeure.slice(0, 3)).toEqual([1, 2, 0]);
    expect(s.appareils).toEqual({ mobile: 2, tablette: 0, ordinateur: 0 });
    expect(s.pages[0]).toEqual({ chemin: '/', vues: 8, visiteurs: 4, dureeMoyenne: 42, entrees: 5 });
    expect(s.provenances[0].provenance).toBeNull();
  });
});
