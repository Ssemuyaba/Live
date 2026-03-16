// src/App.js
import React from "react";
import "./App.css";
import MultiSportLive from "./components/MultiSportLive";
import MatchPage from "./components/MatchPage";
import { Helmet } from "react-helmet";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <div className="App">

        {/* SEO & Meta Tags */}
        <Helmet>
          <title>Swift Live - Live Sports Scores & Streams</title>

          <meta
            name="description"
            content="Swift Live provides real-time live sports scores, match updates, and streams for football, basketball, and more."
          />

          <meta
            name="keywords"
            content="live sports, football live stream, soccer streams, basketball live, match scores, Swift Live"
          />

          <meta name="author" content="Swift Live" />

          {/* Open Graph */}
          <meta property="og:title" content="Swift Live - Live Sports Scores & Streams" />
          <meta
            property="og:description"
            content="Watch live sports streams, scores and match updates on Swift Live."
          />
          <meta property="og:type" content="website" />
          <meta property="og:image" content="/logo192.png" />
          <meta property="og:url" content="https://swiftball.live" />

          {/* Canonical */}
          <link rel="canonical" href="https://swiftball.live" />
        </Helmet>

        {/* Header */}
        <header className="App-header">
          <img src="logo.ico" alt="Swift Live Logo" className="app-logo" />
          <h1>Swift Live</h1>

          {/* AdSense */}
          <div className="header-ad">
            <ins
              className="adsbygoogle"
              style={{ display: "block", width: 160, height: 90 }}
              data-ad-client="ca-pub-XXXX"
              data-ad-slot="YYYY"
            ></ins>
          </div>
        </header>

        {/* Main Content */}
        <main style={{ padding: "20px" }}>
          <Routes>

            {/* Homepage */}
            <Route path="/" element={<MultiSportLive />} />

            {/* SEO Match Pages */}
            <Route path="/match/:slug" element={<MatchPage />} />

          </Routes>
        </main>

      </div>
    </Router>
  );
}

export default App;