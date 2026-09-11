import React, { useRef, useState } from 'react';
import { Eraser, Send } from 'lucide-react';
import { DESSIN_TAILLE, POKER_ACCENT, cadreDuDessin } from './pokerLogic';

/** Résolution interne du cadre de dessin (px), affiché à la largeur du panneau. */
const COTE = 256;
const TRAIT = 6;
const COULEURS = [
  { valeur: '#1a1a2e', nom: 'Noir' },
  { valeur: '#1e2d7d', nom: 'Bleu nuit' },
  { valeur: '#00d4b4', nom: 'Turquoise' },
  { valeur: '#ec4899', nom: 'Rose' },
  { valeur: '#f59e0b', nom: 'Jaune' },
  { valeur: '#ef4444', nom: 'Rouge' },
];

interface PokerDessinProps {
  /** Reçoit le dessin en PNG transparent de 96 px, prêt à diffuser. */
  onSend: (src: string) => void;
}

/**
 * « Mon emoji » : un cadre blanc où l'on dessine au doigt ou à la souris,
 * puis on envoie son dessin, qui s'envole chez tout le monde comme un emoji.
 * Le dessin est recadré sur ce qui a été tracé et réduit en petite image.
 */
export const PokerDessin: React.FC<PokerDessinProps> = ({ onSend }) => {
  const canvas = useRef<HTMLCanvasElement>(null);
  const trace = useRef<{ x: number; y: number } | null>(null);
  const [couleur, setCouleur] = useState(COULEURS[0].valeur);
  const [vide, setVide] = useState(true);

  const contexte = () => {
    const ctx = canvas.current?.getContext('2d');
    if (!ctx) return null;
    ctx.strokeStyle = couleur;
    ctx.fillStyle = couleur;
    ctx.lineWidth = TRAIT;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    return ctx;
  };

  const point = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    return { x: ((e.clientX - r.left) * COTE) / r.width, y: ((e.clientY - r.top) * COTE) / r.height };
  };

  const commencer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const ctx = contexte();
    if (!ctx) return;
    // Suivre le trait même s'il sort du cadre ; sans effet si le pointeur est déjà relâché.
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* rien à capturer */ }
    const p = point(e);
    ctx.beginPath();
    ctx.arc(p.x, p.y, TRAIT / 2, 0, Math.PI * 2);
    ctx.fill();
    trace.current = p;
    setVide(false);
  };

  const tracer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const depuis = trace.current;
    const ctx = depuis && contexte();
    if (!depuis || !ctx) return;
    const p = point(e);
    ctx.beginPath();
    ctx.moveTo(depuis.x, depuis.y);
    ctx.lineTo(p.x, p.y);
    ctx.stroke();
    trace.current = p;
  };

  const lever = () => { trace.current = null; };

  const effacer = () => {
    canvas.current?.getContext('2d')?.clearRect(0, 0, COTE, COTE);
    setVide(true);
  };

  const envoyer = () => {
    const source = canvas.current;
    const ctx = source?.getContext('2d');
    if (!source || !ctx) return;
    const pixels = ctx.getImageData(0, 0, COTE, COTE).data;
    const alpha = new Uint8Array(COTE * COTE);
    for (let i = 0; i < alpha.length; i++) alpha[i] = pixels[i * 4 + 3];
    const cadre = cadreDuDessin(alpha, COTE);
    if (!cadre) return;

    const petit = document.createElement('canvas');
    petit.width = DESSIN_TAILLE;
    petit.height = DESSIN_TAILLE;
    petit.getContext('2d')?.drawImage(source, cadre.x, cadre.y, cadre.taille, cadre.taille, 0, 0, DESSIN_TAILLE, DESSIN_TAILLE);
    onSend(petit.toDataURL('image/png'));
  };

  return (
    <div className="rounded-card border-[1.5px] border-line bg-white p-4">
      <div className="mb-2.5 text-xs font-bold uppercase tracking-wide text-muted">Mon emoji</div>

      <canvas
        ref={canvas}
        width={COTE}
        height={COTE}
        onPointerDown={commencer}
        onPointerMove={tracer}
        onPointerUp={lever}
        onPointerCancel={lever}
        aria-label="Cadre de dessin : dessinez votre emoji"
        className="mx-auto block h-[160px] w-[160px] cursor-crosshair touch-none rounded-lg border-[1.5px] border-dashed border-line bg-white"
      />

      <div className="mt-2 flex items-center justify-between gap-2" role="radiogroup" aria-label="Couleur du crayon">
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
          onClick={effacer}
          disabled={vide}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line px-3 py-1.5 text-sm font-semibold text-navy transition-colors hover:bg-surface disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Eraser className="h-4 w-4" aria-hidden /> Effacer
        </button>
        <button
          type="button"
          onClick={envoyer}
          disabled={vide}
          style={{ background: POKER_ACCENT }}
          className="inline-flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          <Send className="h-4 w-4" aria-hidden /> Envoyer
        </button>
      </div>
    </div>
  );
};

export default PokerDessin;
