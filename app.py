How thsi now,from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from datetime import datetime, timedelta
import logging
import time
import re
from bs4 import BeautifulSoup
import os
SPORTSRC_KEY = os.getenv("SPORTSRC_KEY")
BASE_URL_V2 =os.getenv("BASE_URL_V2")


app = Flask(__name__)
CORS(app)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


HEADERS = {"X-API-KEY": SPORTSRC_KEY}

# -----------------------------
# Cache setup
# -----------------------------
CACHE_TTL_SECONDS = 30  # Live matches cache interval
cache = {
    "sports": {"timestamp": None, "data": None},
    "live_matches": {},
    "matches": {}
}

# -----------------------------
# Helper functions
# -----------------------------
def is_ad_url(url_or_name):
    """Detect if a stream is an ad based on keywords."""
    ad_keywords = ["ad", "promo", "sponsor", "trailer", "banner", "track"]
    text = url_or_name.lower() if url_or_name else ""
    return any(k in text for k in ad_keywords)

def extract_hls_links(html):
    """Extract all .m3u8 links from HTML."""
    pattern = r'https?://[^\s"\']+\.m3u8'
    return list(set(re.findall(pattern, html)))

def filter_hls_playlist(hls_url):
    """Filter ad segments from an HLS playlist."""
    try:
        r = requests.get(hls_url, timeout=10)
        lines = r.text.splitlines()
        clean_lines = []
        skip_segment = False

        for line in lines:
            if line.startswith("#") and any(k in line.lower() for k in ["ad", "promo", "sponsor"]):
                skip_segment = True
                continue
            if any(k in line.lower() for k in ["ad", "promo", "sponsor"]):
                skip_segment = True
                continue
            if skip_segment:
                skip_segment = False
                continue
            clean_lines.append(line)
        return "\n".join(clean_lines)
    except Exception as e:
        print(f"HLS filter error: {e}")
        return hls_url

def scrape_embed_streams(url):
    """Scrape iframe and HLS streams from a webpage."""
    streams = []
    try:
        r = requests.get(url, timeout=10)
        soup = BeautifulSoup(r.text, "html.parser")

        # iframe streams
        for iframe in soup.find_all("iframe"):
            src = iframe.get("src")
            if src and not is_ad_url(src):
                streams.append({"name": "Embed Stream", "url": src})

        # HLS streams
        hls_links = extract_hls_links(r.text)
        for link in hls_links:
            if not is_ad_url(link):
                link = filter_hls_playlist(link)
                streams.append({"name": "HLS Stream", "url": link})

    except Exception as e:
        print(f"Scraper error: {e}")
    return streams

def collect_streams(detail):
    """Collect all streams from match detail, filtering ads."""
    streams = []

    # API streams
    api_streams = detail.get("streams", [])
    if isinstance(api_streams, list):
        for s in api_streams:
            for key in ["url", "embed", "file", "src", "link"]:
                url = s.get(key)
                if url and not is_ad_url(url) and not is_ad_url(s.get("name")):
                    if url.endswith(".m3u8"):
                        url = filter_hls_playlist(url)
                    streams.append({"name": s.get("name", "SportSrc"), "url": url})
                    break

    # Direct stream keys
    for key in ["stream_url", "stream", "streaming", "embed"]:
        url = detail.get(key)
        if url and not is_ad_url(url):
            if url.endswith(".m3u8"):
                url = filter_hls_playlist(url)
            streams.append({"name": "Main Stream", "url": url})

    # YouTube live search
    if detail.get("home_team") and detail.get("away_team"):
        home = detail["home_team"].get("name", "")
        away = detail["away_team"].get("name", "")
        query = f"{home} vs {away} live"
        streams.append({
            "name": "YouTube Live",
            "url": f"https://www.youtube.com/results?search_query={query}"
        })

    return streams

# -----------------------------
# API call function
# -----------------------------
def call_v2(params):
    try:
        response = requests.get(BASE_URL_V2, headers=HEADERS, params=params, timeout=10)
        data = response.json()
        logger.info(f"API Request Params: {params}")
        logger.info(f"API Response Status: {response.status_code}")
        return data
    except Exception as e:
        logger.error(f"Error calling API: {e}")
        return {"success": False, "error": str(e)}

def extract_hls_links(html):
    pattern = r'https?://[^\s"\']+\.m3u8'
    matches = re.findall(pattern, html)
    return list(set(matches))

def scrape_embed_streams(url):
    streams = []

    try:
        r = requests.get(url, timeout=10)
        soup = BeautifulSoup(r.text, "html.parser")

        # find iframe players
        for iframe in soup.find_all("iframe"):
            src = iframe.get("src")
            if src:
                streams.append({
                    "name": "Embed Stream",
                    "url": src
                })

        # find HLS links
        hls_links = extract_hls_links(r.text)

        for link in hls_links:
            streams.append({
                "name": "HLS Stream",
                "url": link
            })

    except Exception as e:
        logger.error(f"Scraper error: {e}")

    return streams

def collect_streams(detail):
    streams = []

    # 1. Streams from API
    api_streams = detail.get("streams", [])
    if isinstance(api_streams, list):
        for s in api_streams:
            for key in ["url", "embed", "file", "src", "link"]:
                if s.get(key):
                    streams.append({"name": s.get("name", "SportSrc"), "url": s[key]})
                    break

    # 2. Direct keys in match detail
    for key in ["stream_url", "stream", "streaming", "embed"]:
        if detail.get(key):
            streams.append({"name": "Main Stream", "url": detail[key]})

    # 3. Optional: YouTube live search placeholder
    if detail.get("home_team") and detail.get("away_team"):
        home = detail["home_team"].get("name", "")
        away = detail["away_team"].get("name", "")
        query = f"{home} vs {away} live"
        streams.append({
            "name": "YouTube Live",
            "url": f"https://www.youtube.com/results?search_query={query}"
        })

    return streams
# -----------------------------
# 1️⃣ Get available sports
# -----------------------------
@app.route("/api/sports")
def sports():
    now = datetime.now()
    if cache["sports"]["timestamp"] and (now - cache["sports"]["timestamp"]).total_seconds() < 3600:
        return jsonify(cache["sports"]["data"])

    data = call_v2({"type": "sports"})
    cache["sports"] = {"timestamp": now, "data": data}
    return jsonify(data)

# -----------------------------
# 2️⃣ Get live matches (with caching)
# -----------------------------
# -----------------------------
# 2️⃣ Get live matches (with caching) - fixed append
# -----------------------------
# -----------------------------
# 2️⃣ Get live matches (with caching) - fixed append + filter persistent match
# -----------------------------
@app.route("/api/live-matches")
def live_matches():
    sport = request.args.get("sport", "football")
    now = datetime.now()

    # Use cache if available
    cached = cache["live_matches"].get(sport)
    if cached and (now - cached["timestamp"]).total_seconds() < CACHE_TTL_SECONDS:
        return jsonify(cached["data"])

    # Call API for live matches
    data = call_v2({"type": "matches", "sport": sport, "status": "inprogress"})
    normalized = []

    for league in data.get("data", []):
        for match in league.get("matches", []):
            home_team = match.get("teams", {}).get("home")
            away_team = match.get("teams", {}).get("away")

            if not home_team or not away_team:
                continue

            normalized.append({
                "match_id": match.get("id"),
                "match_info": {
                    "league": {
                        "name": league.get("league", {}).get("name", "Unknown League"),
                        "logo": league.get("league", {}).get("logo", "")
                    }
                },
                "home_team": home_team,
                "away_team": away_team,
                "score": match.get("score", {}).get("display"),
                "status": match.get("status"),
                "status_detail": match.get("status_detail"),
                "timestamp": match.get("timestamp")
            })

    # -----------------------------
    # NEW: Filter out the persistent first match
    # -----------------------------
    persistent_match_id = "estudiantes-de-rio-cuarto-san-lorenzo-15270128"
    filtered_matches = [
        match for match in normalized
        if match["match_id"] != persistent_match_id
    ]

    response = {"success": True, "matches": filtered_matches}
    cache["live_matches"][sport] = {"timestamp": now, "data": response}

    return jsonify(response)
# -----------------------------
# 3️⃣ Get matches by type (fixed date & append)
# -----------------------------
@app.route("/api/matches")
def matches():
    sport = request.args.get("sport", "football")
    match_type = request.args.get("type", "live").lower()
    now = datetime.now()

    # Cache key
    key = f"{sport}_{match_type}"
    cached = cache["matches"].get(key)
    if cached and (now - cached["timestamp"]).total_seconds() < 300:  # 5 min cache
        return jsonify(cached["data"])

    # Status mapping
    status_map = {
        "live": ["inprogress"],
        "upcoming": ["notstarted"],
        "finished": ["finished"],
        "all": ["inprogress", "notstarted", "finished"]
    }

    statuses = status_map.get(match_type, ["inprogress"])
    normalized = []

    # Call API for each status (if multiple)
    for status in statuses:
        params = {"type": "matches", "sport": sport, "status": status}
        if status == "notstarted":
            params["date"] = now.strftime("%Y-%m-%d")  # only upcoming filtered by today

        data = call_v2(params)

        for league in data.get("data", []):
            for match in league.get("matches", []):
                home_team = match.get("teams", {}).get("home")
                away_team = match.get("teams", {}).get("away")

                if not home_team or not away_team:
                    continue

                normalized.append({
                    "match_id": match.get("id"),
                    "match_info": {
                        "league": {
                            "name": league.get("league", {}).get("name", "Unknown League"),
                            "logo": league.get("league", {}).get("logo", "")
                        }
                    },
                    "home_team": home_team,
                    "away_team": away_team,
                    "score": match.get("score", {}).get("display"),
                    "status": match.get("status"),
                    "status_detail": match.get("status_detail"),
                    "timestamp": match.get("timestamp")
                })

    response = {"success": True, "matches": normalized}
    cache["matches"][key] = {"timestamp": now, "data": response}

    return jsonify(response)
# -----------------------------
# 4️⃣ Match detail / streaming (on-demand)
# -----------------------------
@app.route("/api/match/<match_id>")
def match_detail(match_id):
    data = call_v2({"type": "detail", "id": match_id})
    streams = []

    if data.get("success") and isinstance(data.get("data"), dict):
        detail = data["data"]

        # -----------------------------
        # 1️⃣ Collect streams from sources, filtering ads
        # -----------------------------
        sources = detail.get("sources", [])
        if isinstance(sources, list):
            for s in sources:
                url = s.get("embedUrl")
                source_name = (s.get("source") or "").lower()

                if not url:
                    continue

                # Skip ads/promo/sponsor
                if any(k in source_name for k in ["ad", "sponsor", "promo"]):
                    continue

                # Filter HLS playlists if it's a .m3u8
                if url.endswith(".m3u8"):
                    url = filter_hls_playlist(url)

                streams.append({
                    "name": f"{s.get('source','Stream')} {s.get('streamNo','')}",
                    "url": url,
                    "type": "stream"
                })

        # -----------------------------
        # 2️⃣ Collect direct streams from match detail
        # -----------------------------
        for key in ["stream_url", "stream", "streaming", "embed", "embed_url"]:
            url = detail.get(key)
            if url and not is_ad_url(url):
                if url.endswith(".m3u8"):
                    url = filter_hls_playlist(url)
                streams.append({"name": "Main Stream", "url": url, "type": "stream"})

        # -----------------------------
        # 3️⃣ Scrape iframe/HLS embed streams if embed_url exists
        # -----------------------------
        if detail.get("embed_url"):
            streams.extend(scrape_embed_streams(detail["embed_url"]))

        # -----------------------------
        # 4️⃣ Optional: Add YouTube Live search
        # -----------------------------
        if detail.get("home_team") and detail.get("away_team"):
            home = detail["home_team"].get("name", "")
            away = detail["away_team"].get("name", "")
            query = f"{home} vs {away} live"
            streams.append({
                "name": "YouTube Live",
                "url": f"https://www.youtube.com/results?search_query={query}",
                "type": "stream"
            })

    return jsonify({
        "success": len(streams) > 0,
        "streams": streams
    })
# -----------------------------
if __name__ == "__main__":
    app.run(debug=True)
