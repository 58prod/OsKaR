import { Html, Head, Main, NextScript } from 'next/document';

export default function Document() {
  return (
    <Html lang="fr">
      <Head>
        <meta charSet="utf-8" />

        {/* App Meta Tags */}
        <meta name="application-name" content="OsKaR" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="OsKaR" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#1e2d7d" />

        {/* Police Outfit (design system OsKaR) */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />

        {/* Favicons */}
        <link rel="icon" type="image/png" href="/images/oskar/logo-oskar2.png" />
        <link rel="apple-touch-icon" href="/images/oskar/logo-oskar2.png" />

        {/* PWA Manifest */}
        <link rel="manifest" href="/manifest.json" />

        {/*
          Etat du menu lateral applique avant le premier affichage : sans cela,
          le menu s'affiche deplie puis se replie (ou l'inverse) une fois React
          monte. Meme cle que le hook useSidebarCollapsed.
        */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{var v=localStorage.getItem('oskar.sidebar.collapsed');" +
              "var w=window.innerWidth||document.documentElement.clientWidth||0;" +
              "var c=v===null?(w>0&&w<=900):v==='1';" +
              "var r=document.documentElement;" +
              "r.setAttribute('data-sidebar',c?'collapsed':'expanded');" +
              "r.style.setProperty('--oskar-sidebar',c?'4rem':'15rem')}catch(e){}})()",
          }}
        />
      </Head>
      <body className="antialiased">
        <Main />
        <NextScript />
      </body>
    </Html>
  );
}
