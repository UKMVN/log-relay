# LogRelay

LogRelay is a lightweight log intake server that lets other programs push logs in real time and store them for later review. A web dashboard provides live monitoring and historical browsing. The roadmap includes configurable notifications so users can follow important events from anywhere.

## Features

- Accept logs from external apps over HTTP
- Real‑time streaming to the web dashboard via WebSocket
- Persistent log storage for later search and review
- Simple UI for live monitoring
- Planned: configurable notifications (email/chat/etc.)

## Tech Stack

- Node.js + Express
- MongoDB (Mongoose)
- WebSocket (ws)
- Vite + React + Tailwind CSS

## Project Structure

```
.
├─ client/           # React web dashboard
├─ src/              # Server source (routes, controllers, services)
├─ public/           # Static assets
├─ server.js         # Server entry
└─ package.json
```

## Getting Started

### 1) Install dependencies

```
npm install
cd client
npm install
```

### 2) Configure environment

Create a `.env` file at the project root:

```
MONGO_URI=mongodb://localhost:27017/logs
PORT=3000
```

### 3) Run the server

```
npm start
```

### 4) Run the web dashboard

```
cd client
npm run dev
```

Open the dashboard at `http://localhost:5173`.

## Usage

### Send logs from another app (HTTP)

```
POST /api/logs
Content-Type: application/json

{
  "logId": "project-abc",
  "level": "info",
  "service": "auth-service",
  "message": "User login success",
  "meta": { "userId": "123" }
}
```

### View logs (Web)

Navigate to `/logs` after login, then switch between `Table` and `Terminal` view for realtime monitoring.

## Roadmap

- Notification channels (email/Slack/Discord)
- Rule‑based alerts (level, service, keywords)
- Log search + filters
- Retention policy and archive

## License

MIT
