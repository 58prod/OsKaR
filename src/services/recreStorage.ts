import { supabase, isSupabaseConfigured } from '@/lib/supabaseClient';

/** Bucket public hébergeant les photos de l'outil « En mode récré ! ». */
export const RECRE_BUCKET = 'recre-photos';

function readAsDataURL(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Image illisible'));
    img.src = src;
  });
}

/**
 * Redimensionne une image côté client (canvas) pour alléger le stockage et
 * l'affichage, puis renvoie un blob JPEG. Conserve les proportions.
 */
export async function downscaleImage(file: File, maxDim = 1000, quality = 0.72): Promise<Blob> {
  const dataUrl = await readAsDataURL(file);
  const img = await loadImage(dataUrl);
  const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
  const w = Math.max(1, Math.round(img.width * scale));
  const h = Math.max(1, Math.round(img.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas non disponible');
  ctx.drawImage(img, 0, 0, w, h);

  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Conversion image échouée'))),
      'image/jpeg',
      quality,
    );
  });
}

/**
 * Téléverse une photo et renvoie une URL affichable.
 * - Supabase configuré : upload vers Storage (bucket public) → URL publique,
 *   pour garder l'état Realtime léger (seule l'URL est diffusée).
 * - Sinon (mode dégradé local) ou en cas d'échec : data URL base64 en repli.
 */
export async function uploadRecrePhoto(code: string, photoId: string, file: File): Promise<string> {
  const blob = await downscaleImage(file);

  if (!isSupabaseConfigured()) {
    return readAsDataURL(blob);
  }

  const path = `${code.trim().toUpperCase()}/${photoId}.jpg`;
  const { error } = await supabase.storage.from(RECRE_BUCKET).upload(path, blob, {
    contentType: 'image/jpeg',
    // Pas d'écrasement : chaque photo a un identifiant unique, et `upsert`
    // exige en plus une policy SELECT sur storage.objects, volontairement
    // absente (elle permettrait de lister tout le bucket). Avec upsert, Supabase
    // refuse l'envoi (« new row violates row-level security policy »).
    upsert: false,
  });

  if (error) {
    console.error('❌ Upload photo « récré » échoué, repli base64 :', error.message);
    // La photo voyage alors dans le message temps réel, dont la taille est
    // limitée : on la réduit franchement pour qu'elle arrive chez tout le monde.
    return readAsDataURL(await downscaleImage(file, 640, 0.6));
  }

  const { data } = supabase.storage.from(RECRE_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Supprime une photo précédemment téléversée du bucket Storage. En mode
 * dégradé (repli base64, pas de Supabase configuré), il n'existe aucun
 * fichier distant à nettoyer : l'appel est un no-op.
 */
export async function deleteRecrePhoto(code: string, photoId: string): Promise<void> {
  if (!isSupabaseConfigured()) return;

  const path = `${code.trim().toUpperCase()}/${photoId}.jpg`;
  const { error } = await supabase.storage.from(RECRE_BUCKET).remove([path]);

  if (error) {
    console.error('❌ Suppression photo « récré » échouée :', error.message);
  }
}
