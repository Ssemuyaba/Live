import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import "../App.css";
import Hls from "hls.js";
import { Helmet } from "react-helmet";
import { Link } from "react-router-dom";



// ------------------------------
// HLS Player
// ------------------------------
function HLSPlayer({ url }) {
  const videoRef = useRef(null);

  useEffect(() => {
    if (!url) return;
    const video = videoRef.current;

    if (Hls.isSupported()) {
      const hls = new Hls();
      hls.loadSource(url);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => video.play().catch(() => {}));

      return () => {
        hls.destroy();
        if (video) {
          video.pause();
          video.removeAttribute("src");
          video.load();
        }
      };
    } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
      video.src = url;
      video.play().catch(() => {});
    }
  }, [url]);

  return (
    <video
      ref={videoRef}
      controls
      muted
      playsInline
      style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%" }}
    />
  );
}

// ------------------------------
// Sport Selector
// ------------------------------
function SportSelector({ sports, selectedSport, onSelect }) {
  return (
    <div style={{ marginBottom: "15px" }}>
      {sports.map((sport) => (
        <button
          key={sport.id}
          onClick={() => onSelect(sport.id)}
          className={selectedSport === sport.id ? "active-sport-btn" : ""}
        >
          {sport.name}
        </button>
      ))}
    </div>
  );
}

// ------------------------------
// Match Card
// ------------------------------
function MatchCard({ match, matchType, fetchStream }) {
  const isFinished = matchType === "finished";

  const slug = `${match.home_team?.name}-vs-${match.away_team?.name}`
    .toLowerCase()
    .replace(/\s+/g, "-");

  const getStatusText = () => {
    if (isFinished) {
      return new Date(match.timestamp).toLocaleString([], {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      });
    }
    if (matchType === "live" && match.runningMinute !== undefined) {
      return `${match.runningMinute}’ ${match.status_detail || match.status}`;
    }
    return match.scheduledTime || match.status_detail || match.status;
  };

  return (
  <div className="match-card">

    {/* LEFT SIDE */}
    <div className="match-left">

      <div className="league">
        {match.match_info?.league?.name || "Unknown League"}
      </div>

      <div className="teams">

        <div className="team">
          <img src={match.home_team?.badge} alt="" />
          <span>{match.home_team?.name}</span>
        </div>

        <div className="team">
          <img src={match.away_team?.badge} alt="" />
          <span>{match.away_team?.name}</span>
        </div>

      </div>

    </div>

    {/* RIGHT SIDE */}
    <div className="match-right">

      <div className={`score ${match.scoreUpdated ? "update" : ""}`}>
        {match.score || "N/A"}
      </div>

      <div className="status">
        {matchType === "live" && <span className="live-badge">LIVE</span>}
        {getStatusText()}
      </div>

      {/* ACTION BUTTONS */}
      <div style={{ display: "flex", gap: "6px", marginTop: "6px" }}>

        {!isFinished && matchType === "live" && (
          <button onClick={() => fetchStream(match.match_id)}>
            Watch
          </button>
        )}

        {!isFinished && (
          <Link to={`/match/${slug}`}>
            <button>Details</button>
          </Link>
        )}

      </div>

    </div>



      {matchType === "live" && <div className="match-refresh-circle"></div>}

      <p className="status" style={{ color: isFinished ? "#ccc" : "#fff" }}>
        {getStatusText()}
      </p>
    </div>
  );
}

// ------------------------------
// Main Component
// ------------------------------
export default function MultiSportLive() {
  const [sports, setSports] = useState([]);
  const [selectedSport, setSelectedSport] = useState("");
  const [matches, setMatches] = useState([]);
  //const [, setPrevScores] = useState({});
  const [matchType, setMatchType] = useState("live");
  const [streamMatchId, setStreamMatchId] = useState(null);
  const [, setStreams] = useState([]);
  const [streamUrl, setStreamUrl] = useState("");
  const [adStreams, setAdStreams] = useState([]);
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  const [loadingMatches, setLoadingMatches] = useState(false);
  const [loadingStream, setLoadingStream] = useState(false);
  const [error, setError] = useState("");
  const globalPlayerRef = useRef(null);
  //const matchesCache = useRef({});
  //const cacheTimer = useRef(null);
  const carouselRef = useRef(null);
  const [selectedCarouselId, setSelectedCarouselId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedLeague, setSelectedLeague] = useState("all");
  const [matchCounts, setMatchCounts] = useState({
    live: 0,
    upcoming: 0,
    finished: 0,
  });

  // -------------------
  // New: View More logic
  // -------------------
  const [visibleCount, setVisibleCount] = useState(12);
  const [showFooter, setShowFooter] = useState(false);
  const viewMoreButtonRef = useRef(null);
  
  const leagues = [...new Set(matches.map(m => m.league_name))];
const handleViewMore = () => {
  setVisibleCount((prev) => prev + 12);
};
useEffect(() => {
  setVisibleCount(12);
}, [matchType, selectedSport]);

useEffect(() => {
  const handleScroll = () => {
    const pageHeight = document.documentElement.scrollHeight;
    const scrollPosition = window.innerHeight + window.scrollY;

    // show footer when user reaches near bottom
    setShowFooter(scrollPosition >= pageHeight - 200);
  };

  window.addEventListener("scroll", handleScroll);
  handleScroll();

  return () => window.removeEventListener("scroll", handleScroll);
}, []);

  // Mini-player scroll
  useEffect(() => {
    const handleScroll = () => {
      if (!globalPlayerRef.current) return;
      const scrollY = window.scrollY || window.pageYOffset;
      const playerOffsetTop = globalPlayerRef.current.offsetTop;
      setIsMiniPlayer(scrollY > playerOffsetTop + 100);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch sports
  useEffect(() => {
    const fetchSports = async () => {
      try {
        const res = await axios.get(`https://swiftball-g958.onrender.com/api/sports`);
        if (res.data.success && Array.isArray(res.data.data)) {
          setSports(res.data.data);
          setSelectedSport(res.data.data[0]?.id || "");
        }
      } catch (err) {
        console.error(err);
        setError("Failed to fetch sports.");
      }
    };
    fetchSports();
  }, []);

  useEffect(() => {
    if (window.adsbygoogle) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      } catch (e) {}
    }
  }, [visibleCount]);
  // Fetch matches
  useEffect(() => {
    if (!selectedSport) return;

    const fetchMatches = async () => {
      setLoadingMatches(true);
      setError("");

      try {
        const [liveRes, upcomingRes, finishedRes] = await Promise.all([
          axios.get(`https://swiftball-g958.onrender.com/api/live-matches?sport=${selectedSport}`),
          axios.get(`https://swiftball-g958.onrender.com/api/matches?sport=${selectedSport}&type=upcoming`),
          axios.get(`https://swiftball-g958.onrender.com/api/matches?sport=${selectedSport}&type=finished`),
        ]);

        const normalize = (matches) =>
          matches.map((match) => {
            const league = match.match_info?.league;
            return {
              ...match,
              league_name: league?.name || "Unknown League",
              league_logo: league?.logo || "",
            };
          });

        const liveMatches = normalize(liveRes.data.matches || []);
        const upcomingMatches = normalize(upcomingRes.data.matches || []);
        const finishedMatches = normalize(finishedRes.data.matches || []).sort(
          (a, b) => b.timestamp - a.timestamp
        );

        setMatchCounts({
          live: liveMatches.length,
          upcoming: upcomingMatches.length,
          finished: finishedMatches.length,
        });

        switch (matchType) {
          case "live":
            setMatches(liveMatches);
            break;
          case "upcoming":
            setMatches(upcomingMatches);
            break;
          case "finished":
            setMatches(finishedMatches);
            break;
          default:
            setMatches([]);
        }

      } catch (err) {
        console.error(err);
        setError("Failed to fetch matches.");
      } finally {
        setLoadingMatches(false);
      }
    };

    fetchMatches();
    const interval = matchType === "live" ? setInterval(fetchMatches, 15000) : null;
    return () => clearInterval(interval);
  }, [selectedSport, matchType]);

  // Fetch stream
  const fetchStream = async (match_id) => {
    setLoadingStream(true);
    setError("");
    try {
      setStreamUrl("");
      setStreams([]);
      setAdStreams([]);
      const res = await axios.get(`https://swiftball-g958.onrender.com/api/match/${match_id}`);
      if (res.data.streams && res.data.streams.length > 0) {
        const allStreams = res.data.streams;
        const mainStreams = allStreams.filter(
          (s) => !(s.name || "").toLowerCase().includes("ad") && !(s.url || "").toLowerCase().includes("ad")
        );
        const ads = allStreams.filter(
          (s) => (s.name || "").toLowerCase().includes("ad") || (s.url || "").toLowerCase().includes("ad")
        );
        if (!mainStreams.length) return setError("No live stream available.");
        setStreams(mainStreams);
        setStreamUrl(mainStreams[0].url);
        setAdStreams(ads);
        setStreamMatchId(match_id);
      } else setError("No live stream available.");
    } catch (err) {
      console.error(err);
      setError("Failed to fetch stream.");
    } finally {
      setLoadingStream(false);
    }
  };

  // Carousel click
  const handleCarouselClick = (matchId) => {
    setSelectedCarouselId(matchId);
    const carousel = carouselRef.current;
    const card = carousel.querySelector(`[data-matchid='${matchId}']`);
    if (card) card.scrollIntoView({ behavior: "smooth", inline: "center" });
  };

  const filteredMatches = matches.filter(match => {

    const teamSearch =
      match.home_team?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      match.away_team?.name?.toLowerCase().includes(searchTerm.toLowerCase());
  
    const leagueFilter =
      selectedLeague === "all" || match.league_name === selectedLeague;
  
    return teamSearch && leagueFilter;
  
  });
  const activeMatch = matches.find(m => m.match_id === streamMatchId);

  return (
    <div style={{ padding: "20px", paddingBottom: "120px" }}>
      {error && <p style={{ color: "red" }}>{error}</p>}
       
      <Helmet>
      <title>
        {activeMatch
          ? `${activeMatch.home_team?.name} vs ${activeMatch.away_team?.name} Live Stream | SwiftBall`
          : "SwiftBall Live - Watch Football & Sports Streams"}
      </title>
      <meta
              name="keywords"
               content="live football stream, watch football live, soccer streams, sports streaming, live match streaming"
         />

      <meta property="og:title" content="SwiftBall Live Streams" />
       <meta property="og:description" content="Watch live football matches and sports streams on SwiftBall." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://swiftball.live" />

      <meta
        name="description"
        content={
          activeMatch
            ? `Watch ${activeMatch.home_team?.name} vs ${activeMatch.away_team?.name} live stream, scores and match updates on SwiftBall.`
            : "Watch live football matches, upcoming games and sports streams on SwiftBall."
        }
      />
    </Helmet> 

      {loadingStream && <p style={{ color: "#00ff00" }}>Loading stream...</p>}
      {streamUrl && (
        <div ref={globalPlayerRef} className={`global-player ${isMiniPlayer ? "mini-player" : ""}`}>
          {!isMiniPlayer && (
            <button
              onClick={() => {
                setStreamUrl("");
                setStreams([]);
                setAdStreams([]);
                setStreamMatchId(null);
              }}
              style={{
                position: "absolute",
                top: "10px",
                left: "10px",
                zIndex: 20,
                backgroundColor: "#ff0000",
                color: "#fff",
                border: "none",
                borderRadius: "4px",
                padding: "4px 8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              ✕ Close
            </button>
          )}

          {streamUrl.includes(".m3u8") ? <HLSPlayer url={streamUrl} /> : (
            <iframe
              src={streamUrl}
              frameBorder="0"
              allow="autoplay; fullscreen"
              title="Live Stream"
              style={{ width: "100%", height: "100%" }}
            />
          )}

          {adStreams.length > 0 && (
            <div className="corner-ad">
              {adStreams.map((ad, i) => (
                <iframe
                  key={i}
                  src={ad.url}
                  title={`Ad ${i + 1}`}
                  frameBorder="0"
                  allow="autoplay; fullscreen"
                  style={{ width: 150, height: 100 }}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Match Type Heading */}
      <h2 style={{ color: "#00ff00" }}>
        {matchType === "live" ? <><span className="live-dot"></span>Live Matches</> :
          matchType === "upcoming" ? "Upcoming Matches" : "Finished Matches"}
      </h2>

      {/* Carousel */}
      <div className="top-header-carousel">
        <div className="carousel-container" ref={carouselRef}>
          {matches.filter(match => match.timestamp > Date.now()).slice(0, 10).map(match => (
            <div key={match.match_id} data-matchid={match.match_id} className={`carousel-card ${selectedCarouselId === match.match_id ? "active" : ""}`} onClick={() => handleCarouselClick(match.match_id)}>
              {match.league_logo && <img src={match.league_logo} alt="league" className="league-logo" />}
              <div className="carousel-league-name">{match.league_name}</div>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center" }}>
                <img src={match.home_team?.badge} alt="home" className="team-logo" />
                <span style={{ color: "#00ff00", fontWeight: "bold" }}>vs</span>
                <img src={match.away_team?.badge} alt="away" className="team-logo" />
              </div>
              <div className="match-time">{match.scheduledTime || new Date(match.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</div>
            </div>
          ))}
        </div>
      </div>

      <SportSelector sports={sports} selectedSport={selectedSport} onSelect={setSelectedSport} />

      {/* Match Type Toggle */}
      <div style={{ display: "flex", width: "100%", marginBottom: 20 }}>
        {["live", "upcoming", "finished"].map((type) => (
          <button
            key={type}
            onClick={() => setMatchType(type)}
            style={{
              flex: 1,
              backgroundColor: matchType === type ? "#00ff00" : "#333",
              color: matchType === type ? "#000" : "#fff",
              padding: "10px 0",
              border: "none",
              cursor: "pointer",
              fontWeight: "bold",
              transition: "all 0.3s ease",
            }}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)} ({matchCounts[type] || 0})
          </button>
        ))}
      </div>

      {loadingMatches && <p style={{ color: "#00ff00" }}>Loading matches...</p>}
      {!loadingMatches && matches.length === 0 && <p style={{ color: "#ccc" }}>No {matchType} matches for {selectedSport}</p>}
      <div
  style={{
    display: "flex",
    gap: "10px",
    marginBottom: "20px",
    flexWrap: "wrap"
  }}
>

  {/* Search */}
  <input
    type="text"
    placeholder="Search team..."
    value={searchTerm}
    onChange={(e) => setSearchTerm(e.target.value)}
    style={{
      flex: "1",
      padding: "8px",
      borderRadius: "5px",
      border: "1px solid #444",
      background: "#111",
      color: "#fff"
    }}
  />

  {/* League Filter */}
  <select
    value={selectedLeague}
    onChange={(e) => setSelectedLeague(e.target.value)}
    style={{
      padding: "8px",
      borderRadius: "5px",
      border: "1px solid #444",
      background: "#111",
      color: "#fff"
    }}
  >
    <option value="all">All Leagues</option>

    {leagues.map((league, i) => (
      <option key={i} value={league}>
        {league}
      </option>
    ))}

  </select>

</div>
      {/* Matches Grid */}
     <div className="matches-grid">
  {filteredMatches.slice(0, visibleCount).map((match, index) => (
    <React.Fragment key={match.match_id}>

      <MatchCard
        match={match}
        matchType={matchType}
        fetchStream={fetchStream}
      />

      {(index + 1) % 6 === 0 && (
        <div
          style={{
            gridColumn: "1 / -1",
            display: "flex",
            justifyContent: "center",
            margin: "15px 0"
          }}
        >
          <ins
            className="adsbygoogle"
            style={{ display: "block", width: "100%", maxWidth: 728, height: 90 }}
            data-ad-client="ca-pub-XXXX"
            data-ad-slot="YYYY"
          ></ins>
        </div>
      )}

    </React.Fragment>
  ))}
</div>

      {/* View More Button */}
      {/* View More Button */}
      <div>
      {filteredMatches.length > visibleCount && (
  <div style={{ textAlign: "center", margin: "20px 0" }} ref={viewMoreButtonRef}>
    <button
      onClick={handleViewMore}
      style={{
        backgroundColor: "#00ff00",
        color: "#000",
        padding: "10px 20px",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
        fontWeight: "bold",
      }}
    >
      View More
    </button>
  </div>
)}
</div>
{/* Footer */}
{showFooter && (
 <div className="fixed-footer-ad">

 <div className="info-container">
   Developed by <a href="https://www.swiftdevelopers.dev"><strong>Swift Developers</strong></a><br/>
   All trademarks, logos, and brand names are the property of their respective owners.<br/>
   © {new Date().getFullYear()} Swift Live
 </div>

</div>
)}
    </div>
  );
}
