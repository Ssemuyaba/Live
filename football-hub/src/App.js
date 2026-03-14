// src/App.js
import React from "react";
import "./App.css";
import MultiSportLive from "./components/MultiSportLive"; // Live dashboard
import { Helmet } from "react-helmet";

function App() {
  return (
    <div className="App">
      {/* SEO & Meta Tags */}
      <Helmet>
        <title>Swift Live - Live Sports Scores & Streams</title>
        <meta
          name="description"
          content="Swift Live provides real-time live sports scores, match updates, and streams for football, basketball, and more. Stay updated with upcoming and finished matches!"
        />
        <meta name="keywords" content="live sports, football, basketball, match scores, streams, Swift Live" />
        <meta name="author" content="Swift Live" />
        <meta property="og:title" content="Swift Live - Live Sports Scores & Streams" />
        <meta property="og:description" content="Get real-time live sports scores, streams, and updates. Swift Live covers football, basketball, and more." />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="%PUBLIC_URL%/logo192.png" />
        <meta property="og:url" content="https://yourdomain.com" />
        <link rel="canonical" href="https://yourdomain.com" />
      </Helmet>

      {/* Header */}
      <header className="App-header">
        <img src="logo.png" alt="Swift Live Logo" className="app-logo" />
        <h1>Swift Live</h1>

        {/* AdSense */}
        <div className="header-ad">
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: 160, height: 90 }}
            data-ad-client="ca-pub-XXXX" // replace with your AdSense client ID
            data-ad-slot="YYYY"
          ></ins>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ padding: "20px" }}>
        <MultiSportLive />
      </main>
    </div>
  );
}

export default App;
