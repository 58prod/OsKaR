# Changelog - OKaRina 🎯

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

> Note : ce journal n'a pas été tenu entre les versions 1.0.0 et 2.3.0.
> Les changements de cette période sont dans l'historique Git.

## [2.4.4] - 2026-09-10

### 🎨 Modifié
- **Potentiel Produit — nouveaux exemples.** Les trois cas métier laissent place
  à des produits que tout le monde connaît : une application de facturation, un
  covoiturage domicile-travail et une application de recettes. Ils sont calibrés
  pour donner trois résultats différents — besoin fort, besoin à préciser,
  produit sympathique dont personne n'a vraiment besoin — de sorte qu'en les
  parcourant on comprend ce que mesure l'outil.
- **Couleurs de la charte** sur les curseurs (corail, ambre du pilier Finance,
  turquoise OsKaR) et sur la barre de résultat, à la place du rouge et du bleu
  génériques.
- **« Quel est son problème ? » et « Comment fait-elle aujourd'hui ? »** passent
  juste après le prénom et la situation, et ne sont plus repliés en bas de
  carte : on décrit la personne avant de la noter. Le premier champ s'appelait
  « Qu'est-ce qui la bloque ? ».

## [2.4.3] - 2026-09-10

### 🎨 Modifié
- **Potentiel Produit** reprend la mise en page et l'échelle de texte de la
  page Diagnostic : même en-tête avec légende des niveaux, mêmes cartes
  blanches, même panneau de résultat sombre avec une note sur 10. Les textes
  minuscules (9 à 11 px) et les coins arrondis propres à cette page ont disparu.
- **Vocabulaire simplifié** : les libellés « Persona », « Early Adopter »,
  « max(P × U × F) », « traction » ou « smoke test » laissent place à des
  questions posées en toutes lettres — « Ce problème la gêne-t-il beaucoup ? »,
  « Doit-elle le régler tout de suite ? ». Verdicts, conseils et exemples ont
  été réécrits dans la même veine, accents compris.
- Une seule note affichée, sur 10, au lieu d'un indice sur 100 doublé d'une
  note sur 10 qui disaient la même chose.

### 🔧 Corrigé
- La note d'un profil était calculée deux fois, avec un facteur d'écart : une
  carte affichait 0,5/10 quand le résultat annonçait 5/10.
- Erreur d'hydratation React sur le logo du menu, introduite en 2.4.2.
- Suppression de `RecommendationsPanel`, composant jamais utilisé.

## [2.4.2] - 2026-09-10

### ✨ Ajouté
- **Parcours OKR en 3 étapes** sur `/app/okr`, transposition de la maquette
  `okr.html` : objectifs annuels avec cible chiffrée, objectifs et résultats
  clés du trimestre, plan d'actions en kanban. L'étape est portée par l'URL,
  le trimestre choisi est mémorisé. L'espace en huit pages reste accessible
  par ses adresses, et son menu ramène désormais au parcours.

### 🔧 Corrigé
- **Authentification** : atterrissage sur `/app/okr` après connexion, retour
  à la page demandée après une redirection, lien de réinitialisation expiré
  signalé, messages d'erreur Supabase en français, bouton Google masqué tant
  que le fournisseur n'est pas activé, identifiants qui pouvaient passer dans
  l'URL avant chargement du JavaScript.
- **Menu latéral** : « Bilan Organisation » renommé « Diagnostic », une seule
  entrée surlignée à la fois, plus de repli-dépli au changement de page ni au
  chargement, infobulles quand le menu est replié, navigation clavier.

### 🗃️ Données
- La cible chiffrée d'un objectif annuel utilise les colonnes `target_value`
  et `unit` déjà présentes sur `ambitions` : aucune migration Supabase.

## [1.0.0] - 2024-12-26 🚀

### ✨ Ajouté
- **Canvas Guidé Multi-Entités** avec système d'alerte intelligent
  - Support de plusieurs ambitions avec alerte au-delà de 3
  - Plusieurs Key Results par ambition avec alerte au-delà de 3
  - Plusieurs objectifs trimestriels par ambition avec alerte au-delà de 3
  - Création d'actions liées aux objectifs trimestriels

- **IA Coach Contextuelle** avec Google Gemini AI
  - Profil d'entreprise pour suggestions personnalisées
  - Validation SMART automatique des objectifs
  - Suggestions basées sur secteur et taille d'entreprise
  - Mode fallback gracieux si API indisponible

- **Architecture OKR Moderne**
  - Hiérarchie : Ambitions → KR → Objectifs Trimestriels → KR Trimestriels → Actions
  - Séparation claire entre structure stratégique et opérationnelle
  - Kanban unique pour toutes les actions

- **Interface de Gestion Avancée**
  - Vue hiérarchique avec arborescence expandable
  - Kanban des actions avec drag & drop (@dnd-kit)
  - Filtrage intelligent par ambition, statut, priorité
  - Vue pyramide pour visualisation globale

### 🌐 Déploiement
- **Production** : https://recette-okarina.netlify.app
- **Build automatisé** : Netlify avec export statique
- **Performance** : First Load JS ~114 kB

### 🔧 Technique
- **Stack Moderne** : Next.js 15.5.3, React 19, TypeScript
- **Migration** : react-beautiful-dnd → @dnd-kit (React 19 compatible)
- **Architecture** : Types unifiés target/current au lieu de targetValue/currentValue

## [Non publié] - Roadmap

### 🔄 Version 1.1 (Q1 2025)
- [ ] Authentification réelle avec Auth0/Firebase
- [ ] Mode collaboration en équipe
- [ ] Notifications push et rappels
- [ ] Templates d'objectifs par secteur

### 🎯 Version 1.2 (Q2 2025)
- [ ] Intégration calendrier (Google, Outlook)
- [ ] API REST publique
- [ ] Application mobile (React Native)
- [ ] Intégrations tierces (Slack, Teams)

### 📊 Dashboard et Analytics
- **Métriques en temps réel** : Progression globale et par ambition
- **Graphiques interactifs** : Tendances, répartition, évolution
- **Alertes automatiques** : Échéances, retards, recommandations
- **Vue pyramide** : Visualisation hiérarchique complète

### 📈 Export et Rapports
- **PDF avec graphiques** : Rapports complets haute qualité
- **Excel pour analyse** : Données structurées pour analyse approfondie
- **JSON backup** : Sauvegarde complète de toutes les données
- **Rapports personnalisables** : Par période et critères

### 💾 Persistance et Performance
- **localStorage** : Sauvegarde automatique côté client
- **Export statique** : Performance optimale avec Next.js
- **Bundle optimisé** : First Load JS ~114 kB
- **Build rapide** : ~4 secondes de compilation

### 🎨 Interface et UX
- **Design moderne** : Interface responsive avec Tailwind CSS
- **Animations fluides** : Framer Motion pour les transitions
- **Drag & Drop** : @dnd-kit pour manipulation intuitive
- **Composants réutilisables** : System design cohérent

### 🔧 Architecture Technique
- **Next.js 15.5.3** : Framework React avec export statique
- **React 19** : Dernière version avec nouvelles fonctionnalités
- **TypeScript** : Typage strict pour la robustesse
- **Zustand** : State management avec persistance
- **React Hook Form + Zod** : Validation de formulaires robuste

### 📊 Métriques de la v1.0.0
- 📁 **60+ composants** React réutilisables
- 🎯 **4 étapes** de Canvas guidé multi-entités
- 📊 **8 pages** principales avec navigation fluide
- 🎯 **6 services** métier pour la logique applicative
- 💾 **Stockage local** avec backup automatique
- 🤖 **IA Coach** avec profil d'entreprise contextuel
- 📈 **Export** en 3 formats (PDF, Excel, JSON)
- 🚨 **Système d'alertes** pour éviter la surcharge cognitive

---

## Types de changements
- `Ajouté` pour les nouvelles fonctionnalités
- `Modifié` pour les changements dans les fonctionnalités existantes
- `Déprécié` pour les fonctionnalités qui seront supprimées prochainement
- `Supprimé` pour les fonctionnalités supprimées
- `Corrigé` pour les corrections de bugs
- `Sécurité` pour les vulnérabilités corrigées
