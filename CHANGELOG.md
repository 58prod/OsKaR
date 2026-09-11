# Changelog - OKaRina 🎯

Toutes les modifications notables de ce projet seront documentées dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/fr/1.0.0/),
et ce projet adhère au [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

> Note : ce journal n'a pas été tenu entre les versions 1.0.0 et 2.3.0.
> Les changements de cette période sont dans l'historique Git.

## [2.20.0] - 2026-09-11

### ✨ Ajouté — Administration (d'après `plateforme/admin.html`)
- **Section « Administration »** dans le menu, visible des seuls
  administrateurs (table `admins` : Christophe et Eric), avec le nombre de
  candidatures coachs en attente.
- **`/admin` — tableau de bord** : comptes, bilans, ateliers commencés,
  formules payantes ; nouveaux comptes par semaine ; ateliers par pilier ;
  parcours du bilan à la formule payante sur 30 jours ; ce qui attend une
  réponse ; derniers comptes créés.
- **`/admin/comptes`** : recherche, filtres par formule, pastilles des
  ateliers. La fiche (volet latéral) montre les étapes remplies de chaque
  atelier et les bilans, et permet d'**offrir la formule payante jusqu'à une
  date**, avec un motif (membre fondateur, coach partenaire…), de la
  prolonger ou de la retirer — sans Stripe.
- **`/admin/candidatures`** : statut (nouvelle, contactée, validée, refusée),
  notes internes, lien pour écrire au coach.
- **`/admin/contacts`** : les personnes qui ont fait un bilan sans compte,
  filtrées par défaut sur celles qui acceptent d'être recontactées ; export
  CSV (pour Excel) de ces seules personnes.
- **Email à chaque nouvelle candidature coach** (`/api/notifier-candidature`),
  envoyé à contact@oskar-coach.fr ; « Répondre » écrit au candidat.
- **Case « J'accepte qu'Oskar me recontacte »** (décochée par défaut) dans la
  fenêtre d'email du Diagnostic et du Potentiel Produit.

### 🔧 Modifié
- Une formule s'arrête à sa date de fin (`expires_at`) : passée cette date,
  le compte est traité comme gratuit.

### 🗄️ Base de données — `20260911_administration.sql` (à exécuter)
- Purement additive : table `admins`, fonctions `est_admin` et `admin_*`
  (lecture et écriture réservées aux administrateurs, aucune policy ajoutée
  aux tables existantes), statut « contactee » et colonnes `notes`,
  `traitee_le` sur `candidatures_coachs`, colonne `accepte_recontact` sur
  `diagnostics`.

## [2.19.2] - 2026-09-11

### 🔧 Modifié — adresse du site dans les maquettes archivées
- `docs/inspiration` (maquettes de référence) : `hasenso.fr/oskar` devient
  `oskar-coach.fr`, comme dans l'application.

## [2.19.1] - 2026-09-11

### 🔧 Modifié — adresse du site : oskar-coach.fr
- Documents du kit coach (one-pager, fiche « les 5 piliers », deck,
  proposition) et PDF du diagnostic Market Fit : `hasenso.fr/oskar` devient
  `oskar-coach.fr`.
- Pages légales (CGU, confidentialité, cookies) : domaine du service et
  adresses email passent de `okarina.com` à `oskar-coach.fr` (contact@,
  privacy@, legal@ — boîtes à créer).
- README : lien de démonstration.

## [2.19.0] - 2026-09-11

### ✨ Ajouté — Deck et fiche « les 5 piliers » (kit coach)
- **`/coachs/kit/deck`** : 8 diapositives 16:9 (le constat, la méthode, les
  5 piliers, ce que ça change, un exemple de radar, le déroulé, la suite),
  personnalisées avec le nom du client et du coach. Bouton « Présenter » :
  plein écran, flèches / espace / clic pour avancer, Échap pour sortir.
  Impression : une diapositive par page.
- **Argumentaire express intégré au deck**, en annexe réservée au coach
  (pitch en 30 secondes, cinq accroches par profil de dirigeant, six
  objections) : exclu de la projection, imprimé seulement sur demande.
- **`/coachs/kit/fiche-5-piliers`** : A4 recto-verso à laisser au client,
  un bloc par pilier (à quoi il sert, ce qu'il produit, durée, étapes)
  d'après les pages de pilier de l'app ; rythme de l'année et bloc « Votre
  coach » modifiable au verso.
- Données des piliers partagées dans `src/lib/coachs/piliers.ts`.

### 🗑️ Retiré
- Carte « Argumentaire express » du kit (son contenu est dans le deck) et
  mention « Bientôt disponible » : les 6 documents du kit sont en ligne.

## [2.18.0] - 2026-09-11

### ✨ Ajouté — Calendrier des ateliers (kit coach)
- **`/coachs/kit/calendrier`**, reprise de `timeline.html` au format des
  documents du kit (A4 paysage, accent corail) : on choisit l'organisation,
  le mois de lancement et l'année ; ateliers, suivis et rituels d'équipe se
  placent sur les douze mois.
- **Contenu mis à jour sur l'app** : durées des pages de pilier (Vision,
  Market Fit, Finance ~1h ; OKR ~45 min), étapes actuelles des ateliers,
  « Market Fit », rétro de la boîte à outils. Suivis ramenés à 1h.
- **Règle corrigée** : plus de suivi OKR le mois du lancement, avant
  l'atelier OKR.
- Le détail des cases, au survol dans l'original, passe en légende sous le
  tableau (lisible sur tablette et à l'impression). Lancement proposé par
  défaut : le mois prochain.
- Carte « Calendrier des ateliers » dans le kit et lien depuis l'étape 3 du
  parcours (« Vous bâtissez le plan d'actions »).
- La partie « Réunir pour Réussir » (niveaux et tarifs du partenaire) n'est
  pas reprise, faute de place dans une page publique.

## [2.17.0] - 2026-09-11

### ✨ Ajouté — Espace coachs
- **Page `/coachs`**, d'après la maquette `coachs.html`, libre et sans compte :
  bannière, raisons d'intégrer Oskar, parcours client en 4 temps, tableau
  « qui fait quoi » par pilier, kit de conviction, annuaire (fiches
  d'illustration), formulaire de candidature, questions fréquentes. Accent
  corail propre à l'espace.
- **Entrée « Espace coachs »** dans le menu (rubrique Ressources), icône corail.
- **Candidature à l'annuaire enregistrée** dans la nouvelle table
  `candidatures_coachs` (migration `20260911_create_candidatures_coachs.sql`,
  à exécuter dans Supabase). Dépôt ouvert à tous, aucune lecture depuis l'app.
- **Kit de conviction**, trois documents A4 imprimables (s'ouvrent dans un
  nouvel onglet) : one-pager (bloc « Votre coach » modifiable dans la page),
  grille de restitution du diagnostic (2 pages), générateur de proposition
  (3 formats préchargés, document composé en direct).
- Deck, fiche « 5 piliers » et argumentaire : cartes affichées « Bientôt
  disponible », les PDF n'existent pas encore.

## [2.16.2] - 2026-09-11

### 🎨 Modifié — pages de présentation des piliers
- **Team au même format que les autres piliers** : plus de liseré rose au-dessus
  des cartes, dégradé et pastilles de l'appel à l'action identiques, icônes dans
  la teinte foncée du pilier.
- **Contenu de Team** : l'atelier en 6 étapes de la maquette est abandonné. La
  page annonce désormais des conseils au dirigeant (13 conseils en 5 familles,
  10 documents prêts à l'emploi), toujours « Bientôt disponible ». Le bouton
  s'intitule « Voir les conseils » (nouvelle option `ctaLibelle` de
  `ModuleLanding`).
- **Durées revues d'après le contenu réel des ateliers** : Vision ~1h30 → ~1h,
  Market Fit ~2h → ~1h, Finance ~90 min → ~1h (plus rapide chiffres en main).
- **Vision** : 7 étapes au lieu de 8, comme la barre de l'atelier (le
  récapitulatif n'est pas une étape, pas plus que la synthèse de Finance).
- **Market Fit** : « diagnostic FIT » devient « diagnostic Market Fit ».

## [2.16.1] - 2026-09-10

### 🐛 Corrigé — favicon et logo de la fenêtre de connexion
- **Favicon déformé** : il pointait vers `logo-oskar2.png`, une image de
  1976 × 1528 px que le navigateur écrasait en carré. Remplacé par des icônes
  carrées tirées du cercle du logo, fond transparent : `favicon.ico` (16, 32,
  48 px), `favicon-16x16.png`, `favicon-32x32.png`, `apple-touch-icon.png`
  (180 px, fond blanc) et `icon-192x192.png` / `icon-512x512.png` pour le
  manifeste. L'ancien favicon (logo « OSKAR » réduit à 48 px) et les icônes
  violettes d'OKaRina sont supprimés ; le manifeste s'appelle « Oskar ».
- **Logo en rectangle blanc** dans la fenêtre de connexion : le filtre
  `brightness-0 invert` blanchissait aussi le fond blanc opaque du PNG.
  Nouveau fichier `logo-oskar-blanc.png` (logo blanc, point teal conservé,
  fond transparent), affiché sans filtre.

## [2.16.0] - 2026-09-10

### ✨ Ajouté — compte de démonstration
- **Script `supabase/demo/compte_demo.sql`** : crée le compte « oskar » / mot
  de passe « oskar2026 », formule illimitée active, et le remplit de données
  crédibles (Menuiserie Durand, 12 personnes : ateliers Vision, Market Fit et
  Finance, OKR 2026 avec le 3e trimestre, résultats clés, actions, bilan de
  maturité et bilan Potentiel Produit calculés avec les algorithmes de l'app).
  Relançable : il supprime puis recrée le compte, ce qui remet la démo à zéro.
- **Connexion par identifiant** : le champ de connexion (page et fenêtre)
  accepte un simple identifiant ; sans « @ », il est complété en
  `<identifiant>@demo.oskar`.

### 🎨 Modifié
- **Page d'accueil** : statuts et liens des piliers à jour — Vision, Market
  Fit, Finance et OKR « Disponible » vers leurs pages de présentation, Team
  « Bientôt ».

## [2.15.1] - 2026-09-10

### 🎨 Modifié — écriture du nom et profil des pages de pilier
- **Une seule graphie** : « Oskar » dans le texte (phrases, titres d'onglet,
  pied de page, emails), « OSKAR » suivi du pilier pour les piliers. Les
  anciennes graphies « OsKaR » et « OKaRina » disparaissent de l'application.
  Restent en majuscules, comme dans les maquettes : « Bienvenue sur OSKAR »,
  le fil d'Ariane et les en-têtes de PDF.
- **« OSKAR Fit » devient « OSKAR Market Fit »** : menu, pages, conseils,
  diagnostic de maturité et PDF de l'atelier.
- **Pages de pilier** : le menu « Votre rôle principal » est retiré, seul le
  secteur d'activité est demandé.

## [2.15.0] - 2026-09-10

### ✨ Ajouté — atelier Finance, d'après la maquette
Transposition de `plateforme/finance-atelier.html`, maquette servie et styles
calculés comparés à l'application.

- **Atelier `/app/finance`** : cinq étapes dans la barre (revenus, coûts &
  marge, rentabilité, décisions, synthèse). Tableaux éditables avec calcul en
  direct (part de chaque ligne, CA total, part récurrente, marge brute), point
  mort, marge de sécurité, runway, jauge et objectif de CA au curseur, trois
  décisions à 90 jours, écran de fin vers le pilier OKR. Calculs repris à
  l'identique de la maquette, les totaux de coûts sont recopiés dans l'étape
  « Rentabilité » comme dans la maquette.
- **Colonne « Conseils Coach »** : pictogramme et numéro d'étape dans
  l'en-tête, repères chiffrés (seuils, marges par secteur) de la maquette.
- **Exemples par métier** : sources de revenus, coûts, ordres de grandeur et
  décisions adaptés aux 14 familles de métiers (`src/lib/exemplesFinance.ts`).
- **Accès** : première étape avec un compte gratuit, la suite dans les formules.
- **Page `/finance`** : le bouton « Démarrer l'atelier » est actif.
- **Données** : table `ateliers` déjà créée pour Fit (pilier « finance »),
  aucune migration.

### 🔧 Technique
- Briques de saisie et barre d'étapes communes aux ateliers Fit et Finance,
  déplacées dans `src/components/atelier/`.

## [2.14.1] - 2026-09-10

### 🎨 Modifié — pages de présentation des 5 piliers alignées sur les maquettes
Comparaison chiffre à chiffre avec `vision.html`, `fit.html`, `finance.html`
et `team.html` servies (OKR n'a pas de maquette de présentation, il suit le
même gabarit).

- **Cadre** : le contenu n'est plus centré dans une colonne de 1 024 px ; il
  démarre à 42,5 px du menu et occupe toute la largeur, comme les ateliers.
- **Bannière** : les deux halos décoratifs de la maquette, sans ombre, texte
  borné à 680 px, marges de 14 px.
- **Espacements** : 28 px entre bannière, repères et bloc final ; repères
  espacés de 18,5 px ; icônes au trait 1,8 et pictogrammes de la maquette.
- **Couleurs** : valeur des repères en vert foncé pour Fit, liseré rose et
  icônes #be185d pour Team.
- **Profil** : deux menus côte à côte (secteur et rôle principal), intitulés en
  majuscules, menus de 48 px ; le bloc n'est plus étiré à la hauteur de
  l'appel à l'action. Le rôle reste mémorisé dans le navigateur.
- **Appel à l'action** : bouton à droite du texte ; quand l'atelier n'existe
  pas encore (Finance, Team), bouton grisé et badge « Bientôt disponible » de
  `team.html`.
- **Finance** : encart « Ce module s'appuie sur OsKaR Vision et OsKaR Fit » au
  format de la maquette, lien « Voir Fit → ».
- **Barre du haut** : « Bienvenue sur OSKAR — productivité max », boutons
  Connexion et Commencer gratuitement aux styles de la maquette.

## [2.14.0] - 2026-09-10

### ✨ Ajouté — atelier Fit, d'après la maquette
Transposition de `plateforme/fit.html` et `plateforme/fit-atelier.html`, avec
la même méthode que Vision : maquettes servies, styles calculés relevés puis
comparés à l'application.

- **Atelier `/app/fit`** : cinq étapes dans la barre (offre, différenciation,
  concurrence, signaux, diagnostic), colonne de conseils à droite (340 px,
  accents teal sur voile vert Fit), tableau des concurrents, questions à trois
  choix en cartouches. Le diagnostic reprend à l'identique le barème de la
  maquette (score sur 17, seuils 13 / 8 / 4) et son export PDF.
- **Exemples par métier** : tous les exemples de l'atelier (champs et encart
  « Exemple » des conseils) s'adaptent aux 14 familles de métiers, exemples de
  la maquette par défaut (`src/lib/exemplesFit.ts`).
- **Accès** : première étape avec un compte gratuit, la suite dans les formules,
  comme les autres ateliers.
- **Page `/fit`** : refaite d'après `fit.html` (bandeau, repères, encart
  « Ce module complète OsKaR Vision », profil et appel à l'action). L'ancienne
  page renvoyait vers le Potentiel Produit, toujours accessible depuis le menu.
- **Données** : table `ateliers` (une ligne par personne et par pilier, pour
  Fit, puis Finance et Team). Migration `20260910_create_ateliers.sql`, à
  exécuter dans Supabase.

### 🎨 Modifié
- Pastilles d'étapes des pages de pilier : point de 6 px à la couleur du
  pilier et écart de 10,5 px, comme `.cta-step-pill` dans `oskar.css`.

## [2.13.0] - 2026-09-10

### 🎨 Modifié — largeurs et couleurs relevées sur la maquette servie
Deux écarts signalés sur l'atelier Vision, corrigés en comparant les styles
calculés de `plateforme/vision-atelier.html` avec ceux de l'application.

- **Blocs de saisie sur toute la largeur** : les cartes blanches étaient bridées
  à `max-w-3xl` et s'arrêtaient avant la colonne bleue. Elles occupent
  maintenant toute la colonne de gauche, comme les 888 px de la maquette.
- **Barre d'étapes dans la colonne de gauche** : elle s'étendait sous le
  panneau de conseils. Dans la maquette elle appartient à `.atelier-main`, elle
  s'arrête donc à la même largeur que les cartes.
- **Conteneur de page** : padding de 42,5 px et largeur maximale de 1400 px,
  les valeurs de `.page-content` dans `oskar.css` (18,5 px sous 600 px). Le
  cadre valait jusqu'ici 32 px et 1200 px, sur toutes les pages.
- **Marges intérieures** : en-tête d'étape à 24 px du premier bloc, navigation
  « Retour / Suivant » à 10 px sous le dernier.

### 🎨 Modifié — le menu prend la couleur du pilier
`oskar.css` donne une couleur d'accent à chaque pilier pour l'entrée active du
menu. L'application n'en avait qu'une, le turquoise de la marque.

- Vision bleu, Fit vert, Finance orange, OKR indigo, Team rose : fond à 12 %,
  libellé et liseré gauche de 3 px dans la couleur du pilier.
- L'atelier d'un pilier allume l'entrée du pilier : `/app/vision` allume
  « OsKaR Vision », `/app/okr` allume « OsKaR OKR ».
- Le liseré reprend le rayon de la maquette, 2 px du côté droit.

---

## [2.12.0] - 2026-09-10

### 🎨 Modifié — l'atelier Vision repris sur la maquette servie
La première transposition avait été faite en lisant le HTML, sans regarder le
rendu. En servant `plateforme/` et en relevant les styles calculés, plusieurs
écarts sont apparus. L'atelier suit maintenant la maquette :

- **Barre d'étapes** : sept onglets avec un point au-dessus du libellé en
  majuscules, soulignement navy sous l'étape courante. Le récapitulatif n'y
  figure pas, on y arrive par « Suivant ».
- **En-tête de page** : surtitre « Module 01 — OsKaR Vision », titre « Atelier
  Vision », lien « Retour à l'accueil ».
- **Barre du haut** : fil d'Ariane « OSKAR › Vision › Atelier », boutons
  « Exporter PDF » et « Sauvegarder → ».
- **Titres d'étape** : 27,5 px en bleu Vision, promesse en majuscules turquoise.
- **Cartes** : padding 27,5 px, pastilles Pourquoi (navy), Comment (turquoise),
  Quoi (bleu pâle), note en italique.
- **Colonne de conseils** : entièrement en navy, en-tête sur un voile bleu,
  « Points clés » avec des flèches, encart d'exemple en italique sur blanc 5 %.

## [2.11.0] - 2026-09-10

### 🔧 Corrigé — fidélité aux maquettes
- **La colonne « Conseils pour cette étape » manquait** dans l'atelier Vision.
  C'est le bloc bleu de droite de `vision-atelier.html` : intro, quatre repères
  de méthode et un encart « Exemple », pour chacune des huit étapes. Le
  formulaire passe à gauche, la colonne à droite, comme dans la maquette.
- **Le bloc « Avant de commencer — votre profil »** des pages de pilier
  contenait dans la maquette la liste des secteurs, pas un lien vers un autre
  écran. La liste y est désormais, sur les cinq pages de pilier.

### ✨ Ajouté
- **Le secteur se choisit sans compte.** Depuis la page d'un pilier, le choix
  est gardé dans le navigateur et suffit à adapter les exemples ; avec un
  compte, il rejoint le profil d'entreprise.
- **Les exemples des conseils suivent le métier** : ils sont calculés à partir
  du jeu d'exemples de la famille, pas écrits en dur. Un plombier lit des
  chantiers et des devis jusque dans la colonne de droite.

## [2.10.0] - 2026-09-10

### ✨ Ajouté — l'atelier Vision
Transposition de `Oskar/plateforme/vision-atelier.html` sur `/app/vision` :
sept étapes puis une synthèse.

1. **Le sens** — pourquoi l'entreprise existe, comment elle agit, ce qu'elle fait
2. **Cibles & acteurs** — deux listes qualifiées (type, segment, priorité ;
   rôle, pouvoir, intérêt)
3. **Le problème** que vous résolvez
4. **Vision à 1 an** — quatre repères d'entreprise, quatre personnels
5. **Valeurs** — trois au plus, avec leur traduction concrète
6. **Votre vision** — assemblée depuis l'étape 1, réécrivable
7. **Objectifs** — trois au plus, chacun d'entreprise ou personnel
8. **Synthèse** — « Votre cap à 1 an », imprimable, avec le passage vers les OKR

- L'étape courante vit dans l'URL, la saisie est enregistrée sans bouton dédié.
- Mêmes règles d'accès que l'OKR : première étape offerte, la suite dans les
  formules.
- Les exemples suivent le métier déclaré : le bloc `vision` a été ajouté aux
  14 familles.
- La page de présentation `/vision` mène maintenant à l'atelier.

### 🗃️ Base de données
- **Migration `20260910_create_vision_ateliers.sql` à appliquer** : une table
  `vision_ateliers`, une ligne par personne, contenu en JSONB, avec ses règles
  d'accès. Purement additive.

## [2.9.0] - 2026-09-10

### ✨ Ajouté — les exemples parlent le métier de la personne
- **Un jeu d'exemples par famille de métier** (`src/lib/exemples.ts`) : objectifs
  annuels avec cible chiffrée, amorces de saisie, objectif de trimestre, résultat
  clé, action de la semaine et repères pour le Potentiel Produit. Les 14 familles
  de la liste des secteurs sont couvertes, un test le vérifie.
- **Branché** sur les trois étapes du parcours OKR et sur le Potentiel Produit :
  un plombier se voit proposer « Augmenter le nombre de chantiers signés » et
  « Envoyer 40 devis » là où un éditeur de logiciel lit « Installer un revenu
  mensuel récurrent ».
- **Repli systématique** : tant qu'aucun domaine d'activité n'est choisi, les
  exemples génériques d'origine s'affichent. Jamais de champ vide.

Les exemples sont définis par famille (14) et non par activité (95) : un
plombier, un menuisier et un couvreur partagent les mêmes repères, et 95 jeux
seraient impossibles à tenir à jour.

**Pour les pages à venir** : appeler `useExemples()` plutôt que d'écrire des
phrases d'exemple en dur.

## [2.8.1] - 2026-09-10

### 🔧 Corrigé
- **Erreur d'hydratation sur le pied de page en développement.** Le numéro de
  version est lu dans `package.json` à la compilation ; comme il change à chaque
  commit et que Turbopack ne recharge pas ce fichier, le serveur affichait
  l'ancienne version et le navigateur la nouvelle. React signalait l'écart à
  chaque montée de version. Le paragraphe porte désormais
  `suppressHydrationWarning` — l'année, qui a le même défaut la nuit du
  31 décembre, est couverte au passage.

## [2.8.0] - 2026-09-10

### ✨ Ajouté — le domaine d'activité, tout de suite
- **Première étape de l'onboarding : « Quel est votre domaine d'activité ? »**
  Une seule question, la grande liste des maquettes, et un lien « Plus tard ».
- **La liste des secteurs des maquettes** (`src/lib/secteurs.ts`) : 14 familles,
  95 activités, extraites de `vision.html` plutôt que recopiées. Le profil
  d'entreprise l'utilise aussi, à la place de son champ de texte libre : le
  secteur choisi veut désormais dire la même chose partout. Cinq tests la
  comparent à la maquette.

### 🔧 Modifié
- **L'onboarding devient facultatif.** Le profil d'entreprise n'est plus exigé
  pour entrer dans l'espace OKR ni ailleurs : quelqu'un qui crée un compte pour
  conserver un bilan n'a plus de questionnaire sur son chemin. Il se complète
  quand la personne le décide, depuis son écran.

## [2.7.1] - 2026-09-10

### 🔧 Corrigé — cohérence du parcours d'inscription
- **Même atterrissage partout après inscription.** La page `/auth/register`
  menait à l'onboarding, la modale à l'espace OKR. Les deux suivent désormais la
  même règle que la connexion : la page demandée, sinon l'espace OKR.
- **Les pages d'inscription et de mot de passe oublié** renvoyaient un
  formulaire à quelqu'un déjà connecté ; elles redirigent maintenant.
- **L'étape demandée n'est plus perdue** : créer son compte depuis une étape
  verrouillée y ramène, au lieu de revenir au début du parcours.
- **Message du verrou** : il affirmait « Vous avez terminé l'étape offerte »,
  y compris à quelqu'un qui venait de s'inscrire sans rien remplir.
- **Un seul libellé d'entrée** — « Commencer gratuitement » — là où trois
  formulations coexistaient.

### ✨ Ajouté
- **Rattachement des bilans faits sans compte** : la fonction SQL
  `rattacher_bilans_par_email` (migration `20260910`) rattache au compte les
  bilans portant son adresse. Sans elle, un bilan de visiteur restait invisible
  après inscription — la policy de lecture est `user_id = auth.uid()`, jamais
  vraie pour une ligne à NULL. **Migration à appliquer dans Supabase** ; tant
  qu'elle ne l'est pas, l'appel échoue sans bruit et la liste s'affiche sans ces
  bilans.

## [2.7.0] - 2026-09-10

### ✨ Ajouté — « Mes bilans »
- **Écran `/mes-bilans`** : un compte y retrouve ses bilans de maturité et ses
  analyses de potentiel produit, du plus récent au plus ancien, avec la note et
  le verdict. Chaque bilan se rouvre dans l'outil qui l'a produit
  (`?bilan=<id>`) ou se supprime. Accessible depuis le menu utilisateur.
- **Le Potentiel Produit s'enregistre** : bouton « Enregistrer dans mon compte »
  quand on est connecté, et enregistrement automatique lors de l'envoi par
  email — rattaché à l'adresse, comme le fait déjà le Diagnostic, de sorte
  qu'un compte créé ensuite retrouve le bilan.

### 🔧 Technique
- Les deux bilans cohabitent dans la table `diagnostics`, distingués par une
  clé `__bilan` posée dans le JSON `responses` : aucune migration, donc aucune
  coordination nécessaire avec l'application d'Eric sur la base partagée. Les
  enregistrements antérieurs, sans la clé, sont lus comme des bilans
  d'organisation — ce qu'ils sont.
- La restauration d'un bilan par email écarte désormais un bilan produit, dont
  la structure n'a rien à voir avec celle du questionnaire de maturité.

## [2.6.0] - 2026-09-10

### ✨ Ajouté — règles d'accès de la plateforme
- **Une seule source de vérité** (`src/lib/acces.ts`) décide qui accède à quoi :
  visiteur, compte gratuit ou formule payante. Les ateliers à venir n'auront
  qu'à l'appeler. Neuf tests verrouillent ces règles.
- **Page de présentation du pilier OKR** (`/okr`), libre d'accès comme celles
  des quatre autres piliers. L'atelier reste sur `/app/okr` ; le menu latéral
  mène désormais à la présentation.
- **Première étape de l'atelier OKR offerte** à tout compte gratuit. Les étapes
  « Mon trimestre » et « Mes actions » affichent un écran qui montre ce qu'elles
  contiennent et renvoie vers les formules.
- **Export du bilan Potentiel Produit par email**, sans compte, sur le modèle du
  Diagnostic : un PDF en pièce jointe et un résumé dans le message
  (`/api/send-product-fit`, `lib/productFit/pdf.ts`).

Règles posées par Christophe : l'accueil, les présentations de piliers, le
Diagnostic, le Potentiel Produit et les outils restent libres ; un compte
gratuit sert à conserver ses résultats et à goûter à la première étape de
chaque atelier ; la suite relève des formules payantes.

## [2.5.0] - 2026-09-10

### ✨ Modifié — calcul du Potentiel Produit
- **La note est désormais la moyenne géométrique** des trois réponses, c'est-à-
  dire la racine cubique de leur produit, au lieu du produit brut divisé par
  cent. La logique multiplicative de la méthode est conservée — un facteur
  faible fait chuter le résultat — mais la note reste sur l'échelle des
  réponses : trois réponses à 5 donnent 5/10 au lieu de 1,2/10, et 10-10-1
  donne 4,6/10 là où une moyenne ordinaire dirait 7.
- **Paliers corrigés et nommés** (`SEUIL_FAIBLE`, `SEUIL_REEL`, `SEUIL_FORT`
  dans `scoring.ts`) : besoin fort à partir de 7/10, besoin réel à partir de 5,
  pas indispensable à partir de 3. La légende affichée lit ces constantes, elle
  ne peut donc plus contredire le verdict — elle annonçait « 7–10 besoin fort »
  quand le calcul basculait à 6,5.
- **Exemples recalibrés** pour continuer d'illustrer trois verdicts distincts :
  Facturation 9/10, Covoiturage 6,6/10, Recettes 4,5/10.

Avant ce changement, 70 % des réponses possibles étaient classées « le besoin
reste à trouver » et la note médiane était de 1/10 : l'outil décourageait
presque tout le monde, quelles que soient les réponses.

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
