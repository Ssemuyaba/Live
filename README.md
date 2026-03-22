
````markdown
# SwiftBall Live ⚽

[![Live Matches](https://img.shields.io/endpoint?url=https://swiftball-g958.onrender.com/api/status-badge/live)](https://swiftball-g958.onrender.com) 
[![Upcoming Matches](https://img.shields.io/endpoint?url=https://swiftball-g958.onrender.com/api/status-badge/upcoming)](https://swiftball-g958.onrender.com) 
[![Finished Matches](https://img.shields.io/endpoint?url=https://swiftball-g958.onrender.com/api/status-badge/finished)](https://swiftball-g958.onrender.com) 
[![API Status](https://img.shields.io/endpoint?url=https://swiftball-g958.onrender.com/api/status-badge/status)](https://swiftball-g958.onrender.com)

---

## Project Overview

**SwiftBall** is a real-time sports streaming web app that allows users to:

- Watch live football matches and other sports.
- Browse upcoming and finished matches.
- View live scores and match details.
- Search by team or league.
- Watch matches via an integrated HLS player or iframe streams.

---

## Features

- **Multi-sport support:** Choose from multiple sports via the sport selector.
- **Live, upcoming, and finished match tracking:** Always stay updated.
- **Mini-player:** Keep watching a match while browsing other content.
- **Carousel & Grid Views:** Easy navigation of top matches.
- **Search & Filters:** Filter matches by teams or leagues.
- **Dynamic badges:** Display live match stats directly in README.
- **Ads handling:** Seamless integration of in-stream and footer ads.

---

## Tech Stack

- **Frontend:** React, Axios, React Helmet
- **Video Player:** HLS.js for streaming `.m3u8` links
- **Backend:** Flask (Python) hosted on Render
- **Database:** MySQL / Supabase (for match data)
- **Deployment:** Render for backend, Vercel/Netlify for frontend

---

## Getting Started

### Prerequisites

- Node.js >= 18
- Python >= 3.10
- npm / yarn

### Installation

```bash
# Clone the repo
git clone https://github.com/yourusername/swiftball-live.git
cd swiftball-live

# Install frontend dependencies
npm install

# Run frontend
npm start
````

### Backend Setup

```bash
# Navigate to backend folder
cd backend

# Install dependencies
pip install -r requirements.txt

# Run server
python app.py
```

---

## Usage

1. Open the frontend URL in your browser.
2. Select a sport from the sport selector.
3. Browse live, upcoming, or finished matches.
4. Click “Watch” on live matches to play the stream.
5. Use search and league filters to narrow down matches.

---

## API Endpoints

* `GET /api/sports` – List of sports.
* `GET /api/live-matches?sport={id}` – Live matches for a sport.
* `GET /api/matches?sport={id}&type=upcoming` – Upcoming matches.
* `GET /api/matches?sport={id}&type=finished` – Finished matches.
* `GET /api/match/{match_id}` – Fetch streams and details for a match.
* `GET /api/status` – Returns match counts and API health.
* `GET /api/status-badge/{badge_type}` – Returns Shields.io JSON badge for live, upcoming, finished, or status.

---

## Contributing

1. Fork the repo
2. Create a new branch (`git checkout -b feature/xyz`)
3. Make your changes
4. Commit (`git commit -m "Add feature xyz"`)
5. Push (`git push origin feature/xyz`)
6. Open a Pull Request

---

## License

MIT © [Swift Developers](https://www.swiftdevelopers.dev)

*All trademarks, logos, and brand names are the property of their respective owners.*

