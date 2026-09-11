import React, { useCallback, useEffect, useState } from 'react';
import { DocumentKit, LOGO, k } from '@/components/coachs/kit/DocumentKit';
import { PILIERS_KIT } from '@/lib/coachs/piliers';

/*
 * Deck de présentation du kit coach — 8 diapositives 16:9 à projeter chez le
 * client ou en visio (le constat, la méthode, les 5 piliers, ce que ça
 * change, un exemple de radar, le déroulé, la suite), puis l'argumentaire
 * express en annexe, réservé au coach : pitch, accroches, objections.
 *
 * « Présenter » ouvre les 8 diapositives client en plein écran (flèches,
 * espace ou clic pour avancer, Échap pour sortir) ; l'annexe n'y figure pas.
 * À l'impression, une diapositive par page, annexe comprise sur demande.
 */

const LOGO_BLANC = '/images/oskar/logo-oskar-blanc.png';

/** Dimensions d'une diapositive à l'écran : 297 × 167,06 mm à 96 dpi. */
const LARGEUR = (297 * 96) / 25.4;
const HAUTEUR = (167.06 * 96) / 25.4;
const NB_CLIENT = 8;

interface Contexte {
  coach: string;
  contact: string;
  client: string;
}

const Diapo: React.FC<{ sombre?: boolean; annexe?: boolean; pied: string; children: React.ReactNode }> = ({
  sombre,
  annexe,
  pied,
  children,
}) => (
  <section className={k('slide', sombre && 'sombre', annexe && 'annexe')}>
    {sombre && (
      <>
        <span className={k('sl-halo')} aria-hidden />
        <span className={k('sl-halo2')} aria-hidden />
      </>
    )}
    <div className={k('sl-contenu')}>{children}</div>
    <div className={k('sl-pied')}>
      {sombre ? (
        <span>Oskar · cadre de management en 5 piliers</span>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- diapositive imprimée, taille fixe
        <img src={LOGO} alt="Oskar" />
      )}
      <span>{pied}</span>
    </div>
  </section>
);

/* ── Radar d'exemple (scores sur 10, comme le diagnostic) ── */

const RADAR = [
  { nom: 'Vision', score: 7.0, couleur: '#0ea5e9' },
  { nom: 'Market Fit', score: 4.5, couleur: '#22c55e' },
  { nom: 'Finance', score: 5.5, couleur: '#f59e0b' },
  { nom: 'OKR', score: 3.8, couleur: '#6366f1' },
  { nom: 'Team', score: 7.1, couleur: '#ec4899' },
];
const CX = 180;
const CY = 132;
const R = 92;

const point = (i: number, v: number): [number, number] => {
  const a = -Math.PI / 2 + (i * 2 * Math.PI) / RADAR.length;
  return [CX + R * v * Math.cos(a), CY + R * v * Math.sin(a)];
};
const polygone = (v: (i: number) => number) =>
  RADAR.map((_, i) =>
    point(i, v(i))
      .map((n) => n.toFixed(1))
      .join(',')
  ).join(' ');
const virgule = (n: number) => n.toFixed(1).replace('.', ',');

const Radar: React.FC = () => (
  <svg
    viewBox="-20 0 400 262"
    className={k('sl-radar')}
    role="img"
    aria-label="Exemple de radar : Vision 7, Market Fit 4,5, Finance 5,5, OKR 3,8, Team 7,1"
  >
    {[0.25, 0.5, 0.75, 1].map((t) => (
      <polygon key={t} points={polygone(() => t)} fill="none" stroke="#e2e4f0" strokeWidth={1} />
    ))}
    {RADAR.map((_, i) => {
      const [x, y] = point(i, 1);
      return <line key={i} x1={CX} y1={CY} x2={x} y2={y} stroke="#e2e4f0" strokeWidth={1} />;
    })}
    <polygon
      points={polygone((i) => RADAR[i].score / 10)}
      fill="rgba(255,160,137,0.28)"
      stroke="#e2653f"
      strokeWidth={2}
      strokeLinejoin="round"
    />
    {RADAR.map((p, i) => {
      const [x, y] = point(i, p.score / 10);
      return <circle key={p.nom} cx={x} cy={y} r={4.5} fill={p.couleur} stroke="#fff" strokeWidth={1.5} />;
    })}
    {RADAR.map((p, i) => {
      const [x, y] = point(i, 1.2);
      const ancre = Math.abs(x - CX) < 5 ? 'middle' : x > CX ? 'start' : 'end';
      return (
        <text
          key={p.nom}
          x={x}
          y={y}
          textAnchor={ancre}
          dominantBaseline="middle"
          fontFamily="Outfit, sans-serif"
          fontSize={12}
          fontWeight={700}
          fill={p.couleur}
        >
          {p.nom}{' '}
          <tspan fill="#1e2d7d" fontWeight={800}>
            {virgule(p.score)}
          </tspan>
        </text>
      );
    })}
  </svg>
);

/* ── Les diapositives ── */

function diaposClient({ coach, contact, client }: Contexte): React.ReactNode[] {
  const pied = (n: number) => `${n} / ${NB_CLIENT}`;
  return [
    <Diapo key="couverture" sombre pied={pied(1)}>
      {/* eslint-disable-next-line @next/next/no-img-element -- diapositive imprimée, taille fixe */}
      <img className={k('sl-logo')} src={LOGO_BLANC} alt="Oskar" />
      <div style={{ marginTop: 'auto' }}>
        <div className={k('sl-eyebrow')}>Un cadre de management en 5 piliers</div>
        <div className={k('sl-titre', 'grand')}>
          La productivité, c’est créer
          <br />
          plus de <span>valeur durable</span>.
        </div>
      </div>
      <div className={k('sl-couv-bas')}>
        <div className={k('sl-couv-pour')}>
          Présentation pour <b>{client || 'votre entreprise'}</b>
          <br />
          par <b>{coach || 'votre coach'}</b>
        </div>
      </div>
    </Diapo>,

    <Diapo key="constat" pied={pied(2)}>
      <div className={k('sl-eyebrow')}>Le constat</div>
      <div className={k('sl-titre')}>
        Ce qui manque rarement à un dirigeant,
        <br />
        c’est <span>l’ambition</span>.
      </div>
      <p className={k('sl-lede')}>
        C’est le cadre qui la transforme en décisions tenues. Sans lui, on reconnaît vite les symptômes.
      </p>
      <div className={k('sl-bas', 'sl-grille', 'sl-g3')}>
        {[
          ['On pilote à vue', 'Les problèmes se découvrent trop tard, quand ils coûtent déjà cher.'],
          ['Les objectifs s’oublient', 'Fixés en janvier, oubliés dès février : le quotidien reprend le dessus.'],
          ['L’équipe tire dans tous les sens', 'Tout le monde travaille dur, mais pas forcément dans la même direction.'],
        ].map(([t, p], i) => (
          <div key={t} className={k('sl-carte')}>
            <div className={k('sl-carte-n')}>0{i + 1}</div>
            <div className={k('sl-carte-t')}>{t}</div>
            <div className={k('sl-carte-p')}>{p}</div>
          </div>
        ))}
      </div>
    </Diapo>,

    <Diapo key="methode" pied={pied(3)}>
      <div className={k('sl-eyebrow')}>La méthode</div>
      <div className={k('sl-titre')}>
        Un cadre, des rituels, <span>une plateforme</span>.
      </div>
      <p className={k('sl-lede')}>
        Oskar structure cinq domaines que l’on traite d’habitude séparément, et les relie par des rituels courts.
      </p>
      <div className={k('sl-bas', 'sl-grille', 'sl-g3')}>
        {[
          ['Un cadre commun', 'Cinq piliers et un même langage pour toute l’équipe dirigeante, dès la première séance.'],
          ['Des rituels courts', 'Un suivi chaque trimestre, une rétro d’équipe chaque mois : le cap tient dans la durée.'],
          [
            'Une plateforme',
            'Vos réponses, vos objectifs et vos documents au même endroit : le travail continue entre les séances.',
          ],
        ].map(([t, p], i) => (
          <div key={t} className={k('sl-carte')}>
            <div className={k('sl-carte-n')}>0{i + 1}</div>
            <div className={k('sl-carte-t')}>{t}</div>
            <div className={k('sl-carte-p')}>{p}</div>
          </div>
        ))}
      </div>
    </Diapo>,

    <Diapo key="piliers" pied={pied(4)}>
      <div className={k('sl-eyebrow')}>Les 5 piliers</div>
      <div className={k('sl-titre')}>
        Cinq questions que tout dirigeant se pose,
        <br />
        <span>une par pilier</span>.
      </div>
      <div className={k('sl-bas', 'sl-grille', 'sl-g5')}>
        {PILIERS_KIT.map((p) => (
          <div key={p.id} className={k('sl-pilier')} style={{ borderTopColor: p.couleur }}>
            <div className={k('sl-pilier-nom')} style={{ color: p.fonce }}>
              {p.court}
            </div>
            <div className={k('sl-pilier-q')}>{p.question}</div>
            <div className={k('sl-pilier-out')}>{p.enBref}</div>
          </div>
        ))}
      </div>
    </Diapo>,

    <Diapo key="change" pied={pied(5)}>
      <div className={k('sl-eyebrow')}>Ce que ça change</div>
      <div className={k('sl-titre')}>
        Des décisions sur des faits,
        <br />
        <span>pas sur l’humeur du mois</span>.
      </div>
      {/* Enveloppe : `.sl-liste` remet ses marges à zéro, ce qui annulerait `.sl-bas`. */}
      <div className={k('sl-bas')}>
        <ul className={k('sl-liste', 'grande')}>
          <li>
            <b>Des décisions sur des faits.</b> Vos chiffres, vos clients et vos objectifs sont posés, pas supposés.
          </li>
          <li>
            <b>Chacun sait à quoi il contribue.</b> Les objectifs descendent jusqu’au quotidien de l’équipe, et se
            vérifient.
          </li>
          <li>
            <b>Les mauvaises nouvelles arrivent tôt</b>, quand elles sont encore réparables.
          </li>
          <li>
            <b>L’équipe avance dans le même sens</b>, parce qu’elle connaît le cap et s’y retrouve chaque mois.
          </li>
        </ul>
      </div>
    </Diapo>,

    <Diapo key="radar" pied={pied(6)}>
      <div className={k('sl-eyebrow')}>Le diagnostic</div>
      <div className={k('sl-titre')}>
        10 minutes pour savoir où mettre <span>votre énergie</span>.
      </div>
      <div className={k('sl-deux')}>
        <Radar />
        <div>
          <p className={k('sl-lede')} style={{ marginBottom: '5mm' }}>
            5 piliers, 15 critères, un score sur 10 par pilier. Gratuit et sans inscription.
          </p>
          <ul className={k('sl-liste')}>
            <li>
              <b>Deux piliers bas</b> — ici Market Fit et OKR : vos premiers chantiers.
            </li>
            <li>
              <b>Un pilier solide</b> — ici Team : le point d’appui sur lequel repartir.
            </li>
            <li>
              <b>Un radar déséquilibré n’est pas un échec</b> : c’est la norme pour une entreprise qui grandit.
            </li>
          </ul>
          <p className={k('sl-note')}>Exemple fictif.</p>
        </div>
      </div>
    </Diapo>,

    <Diapo key="deroule" pied={pied(7)}>
      <div className={k('sl-eyebrow')}>Comment ça se passe</div>
      <div className={k('sl-titre')}>
        Quatre temps, puis <span>un rythme</span> sur l’année.
      </div>
      <div className={k('sl-bas', 'sl-grille', 'sl-g4')}>
        {[
          ['Le diagnostic', '10 minutes, 5 piliers, 15 critères. Seul ou avec votre coach.', 'Avant le 1er RDV'],
          ['La restitution', '45 minutes pour lire les résultats et nommer les vrais sujets.', 'Séance 1'],
          ['Le plan d’actions', 'La feuille de route jusqu’à la fin de l’année et les points de coaching calés.', 'Séance 1 ou 2'],
          ['Le premier pilier', 'Celui qui débloque le reste. Atelier animé, résultats dans la plateforme.', 'Séances suivantes'],
        ].map(([t, p, quand], i) => (
          <div key={t} className={k('sl-carte')}>
            <div className={k('sl-etape-n')}>{i + 1}</div>
            <div className={k('sl-carte-t')}>{t}</div>
            <div className={k('sl-carte-p')}>{p}</div>
            <span className={k('sl-quand')}>{quand}</span>
          </div>
        ))}
      </div>
      <div className={k('sl-bandeau')}>
        Ensuite : <b>un suivi OKR chaque trimestre</b>, un suivi Finance au semestre, <b>une rétro d’équipe chaque
        mois</b>.
      </div>
    </Diapo>,

    <Diapo key="suite" sombre pied={pied(8)}>
      <div className={k('sl-eyebrow')}>Et maintenant</div>
      <div className={k('sl-titre', 'grand')}>
        On commence par <span>le diagnostic</span>.
      </div>
      <p className={k('sl-lede')}>
        Gratuit, sans inscription, dix minutes. Nous en lisons les résultats ensemble lors de la restitution.
      </p>
      <div className={k('sl-cta')}>
        <div className={k('sl-url')}>hasenso.fr/oskar</div>
        <div className={k('sl-coach')}>
          <div className={k('sl-coach-k')}>Votre coach</div>
          <div className={k('sl-coach-nom')}>{coach || 'Prénom Nom'}</div>
          <div className={k('sl-coach-l')}>{contact || 'prenom@cabinet.fr · 06 00 00 00 00'}</div>
        </div>
      </div>
    </Diapo>,
  ];
}

const ACCROCHES = [
  {
    profil: 'Le dirigeant débordé',
    phrase: '« Tout passe par vous ? Et si votre équipe savait quoi faire sans venir vous demander ? »',
    piliers: 'OKR · Team',
  },
  {
    profil: 'L’entreprise qui grandit',
    phrase: '« Ce qui marchait à cinq ne marche plus à quinze. Vous l’avez déjà senti ? »',
    piliers: 'Vision · OKR',
  },
  {
    profil: 'L’inquiet des chiffres',
    phrase: '« Si votre chiffre d’affaires baissait de 20 %, combien de mois tiendriez-vous ? »',
    piliers: 'Finance',
  },
  {
    profil: 'Le passionné de son produit',
    phrase: '« Combien de clients vous ont dit non ce trimestre, et savez-vous pourquoi ? »',
    piliers: 'Market Fit',
  },
  {
    profil: 'Le repreneur',
    phrase: '« Vous reprenez une équipe et une histoire : par où commencer sans tout casser ? »',
    piliers: 'Vision · Team',
  },
];

const OBJECTIONS = [
  {
    q: '« Je n’ai pas le temps. »',
    r: 'C’est justement le symptôme. Le diagnostic prend 10 minutes, les rituels une heure par mois : on reprend le temps perdu à redécider les mêmes choses.',
  },
  {
    q: '« On a déjà des objectifs. »',
    r: 'Tant mieux. Combien votre équipe peut-elle en citer ? Oskar ne les remplace pas : il les fait descendre dans le quotidien.',
  },
  {
    q: '« C’est trop cher. »',
    r: 'Comparé à une mauvaise embauche, un trimestre sans cap ou une offre qui ne se vend pas ? Le diagnostic est gratuit : on vérifie d’abord qu’il y a un écart qui vaut la peine.',
  },
  {
    q: '« Encore un outil. »',
    r: 'Ce n’est pas l’outil qui compte, c’est le rythme. La plateforme garde la trace ; l’essentiel se passe en séance et avec l’équipe.',
  },
  {
    q: '« Mon activité est particulière. »',
    r: 'Les exemples de la plateforme s’adaptent à votre métier. Les questions de fond — cap, clients, chiffres, objectifs, équipe — sont les mêmes pour tous.',
  },
  {
    q: '« Je peux le faire seul. »',
    r: 'Oui, la plateforme le permet. Un coach apporte le regard extérieur : faire trancher, poser la question qui dérange, tenir le rythme.',
  },
];

function diaposAnnexe(): React.ReactNode[] {
  return [
    <Diapo key="pitch" annexe pied="Annexe 1 / 2">
      <div className={k('sl-badge')}>Annexe · pour vous, coach — à ne pas projeter</div>
      <div className={k('sl-titre')}>
        Le pitch en 30 secondes, <span>et cinq accroches</span>.
      </div>
      <div className={k('sl-pitch')}>
        Vous avez de l’ambition ; ce qui manque, c’est le temps de la transformer en décisions tenues. Oskar est un
        cadre en <b>5 piliers</b> — vision, marché, finances, objectifs, équipe — avec des <b>rituels courts</b> et
        une plateforme où le travail continue entre nos séances. On commence par un{' '}
        <b>diagnostic gratuit de 10 minutes</b> : il montre où mettre votre énergie les six prochains mois.
      </div>
      <div className={k('sl-bas', 'sl-grille', 'sl-g5')}>
        {ACCROCHES.map((a) => (
          <div key={a.profil} className={k('sl-acc')}>
            <div className={k('sl-acc-p')}>{a.profil}</div>
            <div className={k('sl-acc-q')}>{a.phrase}</div>
            <div className={k('sl-acc-v')}>→ {a.piliers}</div>
          </div>
        ))}
      </div>
    </Diapo>,

    <Diapo key="objections" annexe pied="Annexe 2 / 2">
      <div className={k('sl-badge')}>Annexe · pour vous, coach — à ne pas projeter</div>
      <div className={k('sl-titre')}>
        Six objections, <span>six réponses tenables</span>.
      </div>
      <div className={k('sl-bas', 'sl-grille', 'sl-g3')}>
        {OBJECTIONS.map((o) => (
          <div key={o.q} className={k('sl-carte')}>
            <div className={k('sl-obj-q')}>{o.q}</div>
            <div className={k('sl-obj-r')}>{o.r}</div>
          </div>
        ))}
      </div>
    </Diapo>,
  ];
}

export default function DeckPage() {
  const [coach, setCoach] = useState('');
  const [contact, setContact] = useState('');
  const [client, setClient] = useState('');
  const [annexeImprimee, setAnnexeImprimee] = useState(false);
  const [plein, setPlein] = useState<number | null>(null);
  const [echelle, setEchelle] = useState(1);

  const ctx = { coach: coach.trim(), contact: contact.trim(), client: client.trim() };
  const projetees = diaposClient(ctx);
  const annexes = diaposAnnexe();

  const suivante = useCallback(() => setPlein((p) => (p === null ? p : Math.min(p + 1, NB_CLIENT - 1))), []);
  const precedente = useCallback(() => setPlein((p) => (p === null ? p : Math.max(p - 1, 0))), []);
  const quitter = useCallback(() => {
    setPlein(null);
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
  }, []);

  const presenter = () => {
    setPlein(0);
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  const enPresentation = plein !== null;
  useEffect(() => {
    if (!enPresentation) return;
    const ajuster = () =>
      setEchelle(Math.min(window.innerWidth / LARGEUR, (window.innerHeight - 56) / HAUTEUR));
    const touche = (e: KeyboardEvent) => {
      if (['ArrowRight', 'ArrowDown', 'PageDown', ' ', 'Enter'].includes(e.key)) {
        e.preventDefault();
        suivante();
      } else if (['ArrowLeft', 'ArrowUp', 'PageUp', 'Backspace'].includes(e.key)) {
        e.preventDefault();
        precedente();
      } else if (e.key === 'Home') setPlein(0);
      else if (e.key === 'End') setPlein(NB_CLIENT - 1);
      else if (e.key === 'Escape') quitter();
    };
    // Échap fait d'abord sortir le navigateur du plein écran : on suit.
    const sortie = () => {
      if (!document.fullscreenElement) setPlein(null);
    };
    ajuster();
    window.addEventListener('resize', ajuster);
    window.addEventListener('keydown', touche);
    document.addEventListener('fullscreenchange', sortie);
    return () => {
      window.removeEventListener('resize', ajuster);
      window.removeEventListener('keydown', touche);
      document.removeEventListener('fullscreenchange', sortie);
    };
  }, [enPresentation, suivante, precedente, quitter]);

  return (
    <DocumentKit
      titreOnglet="Deck de présentation | Oskar"
      nom="Deck de présentation"
      consigne="8 diapositives à projeter, puis l’argumentaire en annexe (pour vous)."
      actions={
        <button type="button" className={k('btn-clair')} onClick={presenter}>
          Présenter ▸
        </button>
      }
    >
      {/* ═══ Réglages (masqués à l'impression) ═══ */}
      <div className={k('cal-controls')}>
        <div className={k('prop-group')}>
          <label htmlFor="d_client">Client</label>
          <input type="text" id="d_client" placeholder="Nom de l’entreprise" value={client} onChange={(e) => setClient(e.target.value)} />
        </div>
        <div className={k('prop-group')}>
          <label htmlFor="d_coach">Coach</label>
          <input type="text" id="d_coach" placeholder="Prénom Nom" value={coach} onChange={(e) => setCoach(e.target.value)} />
        </div>
        <div className={k('prop-group')}>
          <label htmlFor="d_contact">Contact</label>
          <input
            type="text"
            id="d_contact"
            placeholder="prenom@cabinet.fr · 06 00 00 00 00"
            value={contact}
            onChange={(e) => setContact(e.target.value)}
          />
        </div>
        <label className={k('cal-case')}>
          <input type="checkbox" checked={annexeImprimee} onChange={(e) => setAnnexeImprimee(e.target.checked)} />
          Imprimer aussi l’argumentaire
        </label>
      </div>

      <div className={k('deck', !annexeImprimee && 'sans-annexe')}>
        {projetees}
        {annexes}
      </div>

      {plein !== null && (
        <div className={k('plein')} onClick={suivante} role="dialog" aria-label="Présentation">
          <div style={{ width: LARGEUR * echelle, height: HAUTEUR * echelle }}>
            <div
              className={k('plein-diapo')}
              style={{ width: LARGEUR, height: HAUTEUR, transform: `scale(${echelle})`, transformOrigin: 'top left' }}
            >
              {projetees[plein]}
            </div>
          </div>
          <div className={k('plein-barre')} onClick={(e) => e.stopPropagation()}>
            <button type="button" aria-label="Diapositive précédente" onClick={precedente}>
              ‹
            </button>
            <span>
              {plein + 1} / {NB_CLIENT}
            </span>
            <button type="button" aria-label="Diapositive suivante" onClick={suivante}>
              ›
            </button>
            <button type="button" onClick={quitter}>
              Quitter (Échap)
            </button>
          </div>
        </div>
      )}
    </DocumentKit>
  );
}
