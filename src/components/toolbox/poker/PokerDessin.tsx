import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Eraser, FlipHorizontal2, PaintBucket, Pencil, Send, Undo2 } from 'lucide-react';
import {
  DERNIERS_DESSINS_MAX, DESSIN_TAILLE, POKER_ACCENT, ajouterAuxDerniers, cadreDuDessin, estDessinValide, remplirZone,
} from './pokerLogic';

/** Résolution interne du cadre de dessin (px), affiché à la largeur du panneau. */
const COTE = 256;
const COULEURS = [
  { valeur: '#1a1a2e', nom: 'Noir' },
  { valeur: '#1e2d7d', nom: 'Bleu nuit' },
  { valeur: '#00d4b4', nom: 'Turquoise' },
  { valeur: '#ec4899', nom: 'Rose' },
  { valeur: '#f59e0b', nom: 'Jaune' },
  { valeur: '#ef4444', nom: 'Rouge' },
];
/** Le dessin est réduit à 56 px chez les autres : même « fin » doit rester lisible. */
const EPAISSEURS = [
  { valeur: 6, nom: 'Fin', point: 4 },
  { valeur: 11, nom: 'Moyen', point: 7 },
  { valeur: 20, nom: 'Gros feutre', point: 11 },
];
/** Marge et contour blanc de l'effet autocollant, en px de l'image envoyée. */
const MARGE = 10;
const CONTOUR = 5;
const CLE_DERNIERS = 'oskar.poker.derniersDessins';

type Point = { x: number; y: number };
type Geste =
  | { type: 'trait'; couleur: string; epaisseur: number; miroir: boolean; points: Point[] }
  | { type: 'remplir'; couleur: string; miroir: boolean; point: Point }
  | { type: 'effacer' };

const enMiroir = (p: Point): Point => ({ x: COTE - p.x, y: p.y });

const enRGB = (hex: string) =>
  [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)) as [number, number, number];

/** Rien n'est dessiné depuis le dernier « Effacer ». */
const estVide = (gestes: Geste[]) => {
  const dernier = gestes.map((g) => g.type).lastIndexOf('effacer');
  return dernier === gestes.length - 1;
};

function tracer(ctx: CanvasRenderingContext2D, g: Extract<Geste, { type: 'trait' }>, points: Point[]) {
  ctx.strokeStyle = g.couleur;
  ctx.fillStyle = g.couleur;
  ctx.lineWidth = g.epaisseur;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const pts of g.miroir ? [points, points.map(enMiroir)] : [points]) {
    ctx.beginPath();
    if (pts.length === 1) {
      ctx.arc(pts[0].x, pts[0].y, g.epaisseur / 2, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.moveTo(pts[0].x, pts[0].y);
      for (const p of pts.slice(1)) ctx.lineTo(p.x, p.y);
      ctx.stroke();
    }
  }
}

function remplir(ctx: CanvasRenderingContext2D, g: Extract<Geste, { type: 'remplir' }>) {
  const image = ctx.getImageData(0, 0, COTE, COTE);
  const rgb = enRGB(g.couleur);
  remplirZone(image.data, COTE, g.point.x, g.point.y, rgb);
  if (g.miroir) {
    const m = enMiroir(g.point);
    remplirZone(image.data, COTE, m.x, m.y, rgb);
  }
  ctx.putImageData(image, 0, 0);
}

const nouveauCanvas = () => {
  const c = document.createElement('canvas');
  c.width = DESSIN_TAILLE;
  c.height = DESSIN_TAILLE;
  return c;
};

/**
 * Effet autocollant : le dessin recadré, entouré d'un contour blanc et d'une
 * ombre légère, pour rester lisible sur n'importe quel fond.
 */
function enAutocollant(source: HTMLCanvasElement, cadre: { x: number; y: number; taille: number }): string {
  const zone = DESSIN_TAILLE - 2 * MARGE;
  const dessin = nouveauCanvas();
  dessin.getContext('2d')?.drawImage(source, cadre.x, cadre.y, cadre.taille, cadre.taille, MARGE, MARGE, zone, zone);

  const silhouette = nouveauCanvas();
  const s = silhouette.getContext('2d');
  const contour = nouveauCanvas();
  const c = contour.getContext('2d');
  const final = nouveauCanvas();
  const f = final.getContext('2d');
  if (!s || !c || !f) return dessin.toDataURL('image/png');

  s.drawImage(dessin, 0, 0);
  s.globalCompositeOperation = 'source-in';
  s.fillStyle = '#ffffff';
  s.fillRect(0, 0, DESSIN_TAILLE, DESSIN_TAILLE);

  for (let k = 0; k < 16; k++) {
    const angle = (k / 16) * Math.PI * 2;
    c.drawImage(silhouette, Math.cos(angle) * CONTOUR, Math.sin(angle) * CONTOUR);
  }
  c.drawImage(silhouette, 0, 0);

  f.shadowColor = 'rgba(26, 26, 46, 0.3)';
  f.shadowBlur = 3;
  f.shadowOffsetY = 1;
  f.drawImage(contour, 0, 0);
  f.shadowColor = 'transparent';
  f.drawImage(dessin, 0, 0);
  return final.toDataURL('image/png');
}

const lireDerniers = (): string[] => {
  try {
    const liste = JSON.parse(localStorage.getItem(CLE_DERNIERS) ?? '[]');
    return Array.isArray(liste) ? liste.filter(estDessinValide).slice(0, DERNIERS_DESSINS_MAX) : [];
  } catch {
    return [];
  }
};

const garderDerniers = (liste: string[]) => {
  try { localStorage.setItem(CLE_DERNIERS, JSON.stringify(liste)); } catch { /* stockage indisponible */ }
};

/** Le raccourci d'annulation ne doit pas voler le Ctrl+Z d'un champ de saisie. */
const estChampDeSaisie = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(el.tagName));

interface PokerDessinProps {
  /** Reçoit le dessin en PNG transparent de 96 px, prêt à diffuser. */
  onSend: (src: string) => void;
}

/**
 * « Mon emoji » : un cadre blanc où l'on dessine au doigt ou à la souris,
 * puis on envoie son dessin, qui s'envole chez tout le monde comme un emoji.
 * Crayon (trois épaisseurs), pot de peinture, symétrie miroir et annulation ;
 * le dessin est recadré, réduit et habillé en autocollant. Les derniers
 * dessins envoyés restent dans le navigateur pour être renvoyés d'un clic.
 */
export const PokerDessin: React.FC<PokerDessinProps> = ({ onSend }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const gestes = useRef<Geste[]>([]);
  const enCours = useRef<Extract<Geste, { type: 'trait' }> | null>(null);
  const [, redessiner] = useState(0);
  const [outil, setOutil] = useState<'crayon' | 'pot'>('crayon');
  const [couleur, setCouleur] = useState(COULEURS[0].valeur);
  const [epaisseur, setEpaisseur] = useState(EPAISSEURS[1].valeur);
  const [miroir, setMiroir] = useState(false);
  const [derniers, setDerniers] = useState<string[]>([]);

  useEffect(() => { setDerniers(lireDerniers()); }, []);

  const vide = estVide(gestes.current);
  const ajouter = (g: Geste) => {
    gestes.current.push(g);
    redessiner((n) => n + 1);
  };

  const rejouer = useCallback(() => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, COTE, COTE);
    for (const g of gestes.current) {
      if (g.type === 'effacer') ctx.clearRect(0, 0, COTE, COTE);
      else if (g.type === 'trait') tracer(ctx, g, g.points);
      else remplir(ctx, g);
    }
  }, []);

  const annuler = useCallback(() => {
    if (enCours.current || gestes.current.length === 0) return;
    gestes.current.pop();
    rejouer();
    redessiner((n) => n + 1);
  }, [rejouer]);

  useEffect(() => {
    const auClavier = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z' && !estChampDeSaisie(e.target)) {
        if (gestes.current.length === 0) return;
        e.preventDefault();
        annuler();
      }
    };
    window.addEventListener('keydown', auClavier);
    return () => window.removeEventListener('keydown', auClavier);
  }, [annuler]);

  const point = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * COTE) / r.width, y: ((e.clientY - r.top) * COTE) / r.height };
  };

  const commencer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return;
    const p = point(e);
    if (outil === 'pot') {
      const g: Geste = { type: 'remplir', couleur, miroir, point: p };
      remplir(ctx, g);
      ajouter(g);
      return;
    }
    // Suivre le trait même s'il sort du cadre ; sans effet si le pointeur est déjà relâché.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* rien à capturer */ }
    const g: Geste = { type: 'trait', couleur, epaisseur, miroir, points: [p] };
    tracer(ctx, g, g.points);
    enCours.current = g;
    ajouter(g);
  };

  const prolonger = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const g = enCours.current;
    const ctx = g && canvas.current?.getContext('2d');
    if (!g || !ctx) return;
    const p = point(e);
    tracer(ctx, g, [g.points[g.points.length - 1], p]);
    g.points.push(p);
  };

  const lever = () => { enCours.current = null; };

  const effacer = () => {
    canvas.current?.getContext('2d')?.clearRect(0, 0, COTE, COTE);
    ajouter({ type: 'effacer' });
  };

  const envoyerImage = (src: string) => {
    onSend(src);
    if (!estDessinValide(src)) return;
    setDerniers((liste) => {
      const suite = ajouterAuxDerniers(liste, src);
      garderDerniers(suite);
      return suite;
    });
  };

  const envoyer = () => {
    const source = canvas.current;
    const ctx = source?.getContext('2d');
    if (!source || !ctx) return;
    const pixels = ctx.getImageData(0, 0, COTE, COTE).data;
    const alpha = new Uint8Array(COTE * COTE);
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
    const cadre = cadreDuDessin(alpha, COTE);
    if (cadre) envoyerImage(enAutocollant(source, cadre));
  };

  const actif = { background: `${POKER_ACCENT}14`, borderColor: POKER_ACCENT, color: POKER_ACCENT };
  const bouton = 'inline-flex h-[30px] w-[30px] items-center justify-center rounded-lg border border-line text-navy transition-colors hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal';

  return (
    <div className="rounded-card border-[1.5px] border-line bg-white p-4">
      <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Mon emoji</div>

      <div className="mb-2 flex items-center justify-between gap-1">
        <div className="flex gap-1" role="radiogroup" aria-label="Outil">
          {([
            { valeur: 'crayon', nom: 'Crayon', Icone: Pencil },
            { valeur: 'pot', nom: 'Pot de peinture : remplir une forme fermée', Icone: PaintBucket },
          ] as const).map(({ valeur, nom, Icone }) => (
            <button
              key={valeur}
              type="button"
              role="radio"
              aria-checked={outil === valeur}
              aria-label={nom}
              title={nom}
              onClick={() => setOutil(valeur)}
              className={bouton}
              style={outil === valeur ? actif : undefined}
            >
              <Icone className="h-4 w-4" aria-hidden />
            </button>
          ))}
        </div>

        <div className="flex gap-1" role="radiogroup" aria-label="Épaisseur du crayon">
          {EPAISSEURS.map((ep) => (
            <button
              key={ep.valeur}
              type="button"
              role="radio"
              aria-checked={epaisseur === ep.valeur}
              aria-label={ep.nom}
              title={ep.nom}
              onClick={() => { setEpaisseur(ep.valeur); setOutil('crayon'); }}
              className={bouton}
              style={outil === 'crayon' && epaisseur === ep.valeur ? actif : undefined}
            >
              <span className="rounded-full" style={{ width: ep.point, height: ep.point, background: couleur }} aria-hidden />
            </button>
          ))}
        </div>

        <button
          type="button"
          aria-pressed={miroir}
          aria-label="Symétrie miroir"
          title="Symétrie miroir : dessinez une moitié, l'autre suit"
          onClick={() => setMiroir((m) => !m)}
          className={bouton}
          style={miroir ? actif : undefined}
        >
          <FlipHorizontal2 className="h-4 w-4" aria-hidden />
        </button>
      </div>

      <div className="relative mx-auto h-[160px] w-[160px]">
        <canvas
          ref={canvas}
          width={COTE}
          height={COTE}
          onPointerDown={commencer}
          onPointerMove={prolonger}
          onPointerUp={lever}
          onPointerCancel={lever}
          aria-label="Cadre de dessin : dessinez votre emoji"
          className={`block h-full w-full touch-none rounded-lg border-[1.5px] border-dashed border-line bg-white ${
            outil === 'pot' ? 'cursor-cell' : 'cursor-crosshair'
          }`}
        />
        {miroir && (
          <span
            aria-hidden
            className="pointer-events-none absolute inset-y-1 left-1/2 border-l border-dashed"
            style={{ borderColor: `${POKER_ACCENT}59` }}
          />
        )}
      </div>

      <div className="mt-2 flex items-center justify-between gap-2" role="radiogroup" aria-label="Couleur">
        {COULEURS.map((c) => (
          <button
            key={c.valeur}
            type="button"
            role="radio"
            aria-checked={couleur === c.valeur}
            title={c.nom}
            onClick={() => setCouleur(c.valeur)}
            className={`relative h-6 w-6 rounded-full border-2 transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal ${
              couleur === c.valeur ? 'scale-110 border-navy' : 'border-white shadow-[0_0_0_1px_#e2e4f0]'
            }`}
            style={{ background: c.valeur }}
          >
            <span className="sr-only">{c.nom}</span>
          </button>
        ))}
      </div>

      <div className="mt-2.5 flex gap-2">
        <button
          type="button"
          onClick={annuler}
          disabled={gestes.current.length === 0}
          aria-label="Annuler"
          title="Annuler (Ctrl+Z)"
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-line text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Undo2 className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={effacer}
          disabled={vide}
          aria-label="Tout effacer"
          title="Tout effacer"
          className="inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg border border-line text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser className="h-4 w-4" aria-hidden />
        </button>
        <button
          type="button"
          onClick={envoyer}
          disabled={vide}
          style={{ background: POKER_ACCENT }}
          className="inline-flex h-[34px] flex-1 items-center justify-center gap-1.5 rounded-lg px-3 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden /> Envoyer
        </button>
      </div>

      {derniers.length > 0 && (
        <div className="mt-3 border-t border-line pt-2.5">
          <div className="mb-1.5 text-[11px] font-semibold text-muted">Renvoyer un de mes dessins</div>
          <div className="flex flex-wrap gap-1" role="group" aria-label="Mes derniers dessins">
            {derniers.map((src, i) => (
              <button
                key={src}
                type="button"
                onClick={() => envoyerImage(src)}
                title="Renvoyer ce dessin"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-surface transition-transform hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal active:scale-95"
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- petite image générée dans le navigateur */}
                <img src={src} alt="" className="h-8 w-8" />
                <span className="sr-only">Renvoyer mon dessin n° {i + 1}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PokerDessin;
