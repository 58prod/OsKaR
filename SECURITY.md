# 🔒 Guide de Sécurité - OsKaR

## Variables d'Environnement

### ⚠️ Règles importantes

1. **Aucun secret dans le code source ni côté navigateur**
   - Utiliser des variables d'environnement pour tous les secrets.
   - Réserver `NEXT_PUBLIC_*` aux valeurs explicitement non sensibles.
   - Les clés Gemini doivent rester **strictement côté serveur**.

2. **Fichiers à ne jamais commiter**
   - `.env`
   - `.env.local`
   - `.env.production.local`
   - tout export ou artefact contenant des valeurs injectées

3. **Fichiers à commiter**
   - `.env.example`
   - `.gitignore`

### Configuration actuelle

```bash
# ✅ Correct - variables privées côté serveur
GEMINI_API_KEY=votre_vraie_cle_ici
GEMINI_MODEL=gemini-2.0-flash-exp

# ✅ Correct - variables publiques non sensibles
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

### Utilisation dans le code

```typescript
// ✅ Correct - uniquement dans src/pages/api/gemini.ts
const apiKey = process.env.GEMINI_API_KEY;

// ❌ Interdit - secret en dur
const apiKey = 'your-secret-key';
```

## Clés API utilisées

### Google Gemini AI
- **Variables** : `GEMINI_API_KEY`, `GEMINI_MODEL`
- **Usage** : appel serveur via `POST /api/gemini`
- **Exposition navigateur** : interdite
- **Optionnel** : oui, avec fallback applicatif

## Checklist sécurité

Avant chaque commit :

- [ ] aucun secret dans le code source
- [ ] aucun secret dans les variables `NEXT_PUBLIC_*`
- [ ] `.env.local` ignoré par Git
- [ ] `.env.example` à jour
- [ ] aucune route de test exposée en production
- [ ] documentation alignée avec l'architecture serveur

## En cas d'exposition accidentelle

1. **Révoquer / rotater immédiatement** la clé exposée
2. **Mettre à jour** les variables locales et Netlify
3. **Purger** les artefacts générés localement (`out/`, `.netlify/`, etc.)
4. **Vérifier** qu'aucune variable publique sensible ne subsiste
5. **Documenter** l'incident et la remédiation

## Déploiement

### Netlify
Configurer dans Netlify :

```bash
GEMINI_API_KEY=votre_cle_production
GEMINI_MODEL=gemini-2.0-flash-exp
NEXT_PUBLIC_SUPABASE_URL=https://votre-projet.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

## Contact

En cas de problème de sécurité, traiter en priorité la rotation des secrets puis la purge des artefacts concernés.
