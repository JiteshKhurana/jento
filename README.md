# Jento — AI Trip Planner

An AI-powered travel planning app like Mindtrip.ai. Chat with Gemini to build personalized, day-by-day itineraries with maps, place photos, reviews, and booking links.

## Stack

- **Next.js 16** (App Router)
- **Clerk** — authentication
- **Prisma + Neon** — PostgreSQL database
- **Gemini** (via Vercel AI SDK) — conversational AI
- **Google Places & Maps** — place enrichment and interactive maps

## Getting started

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in your keys:

```bash
cp .env.example .env.local
```

| Variable | Where to get it |
|----------|-----------------|
| `DATABASE_URL` | [Neon](https://neon.tech) — create a Postgres project |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY` | [Clerk Dashboard](https://dashboard.clerk.com) |
| `CLERK_WEBHOOK_SECRET` | Clerk → Webhooks → add endpoint `/api/webhooks/clerk` |
| `GEMINI_API_KEY` | [Google AI Studio](https://aistudio.google.com/apikey) |
| `GOOGLE_PLACES_API_KEY` | Google Cloud — enable Places API (New) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Google Cloud — enable Maps JavaScript API |

### 3. Set up the database

Create a Neon project and set both connection strings in `.env.local`:

- `DATABASE_URL` — pooled connection (hostname with `-pooler`) for the app
- `DIRECT_URL` — direct connection for Prisma CLI migrations

```bash
npx prisma migrate dev
npx prisma generate
```

### 4. Configure Clerk webhook (local dev)

Use [ngrok](https://ngrok.com) to expose your local server:

```bash
ngrok http 3000
```

Add the ngrok URL + `/api/webhooks/clerk` as a webhook endpoint in Clerk, subscribing to `user.created`, `user.updated`, and `user.deleted`.

### 5. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Usage

1. Sign up / sign in
2. Create a new trip with destination and dates
3. Chat with the AI: *"4-day trip to Barcelona focusing on art but avoiding tourist traps"*
4. The AI builds a structured itinerary with real places, photos, and reviews
5. Edit, reorder, or delete items; view everything on the interactive map
6. Click "Search & book" for external booking links

## Project structure

```
app/
  api/          # Chat, trips, places, webhooks
  trips/        # Dashboard and planner pages
components/
  chat/         # Chat panel and suggested prompts
  itinerary/    # Day timeline, item editor
  map/          # Google Maps integration
  places/       # Place cards with photos/reviews
lib/
  ai/           # Prompts, schemas, tools
  places/       # Google Places API client
  booking/      # Deep link builders
prisma/         # Database schema
```

## Production checklist

Before deploying to Vercel (or similar):

1. **Google Cloud** — enable these APIs on the same project as your keys:
   - Maps JavaScript API (fixes `ApiNotActivatedMapError`)
   - Places API (New)
   - Restrict keys: server key by IP/referrer, client key by your domain
2. **Clerk** — switch to production keys; configure webhook to your deployed `/api/webhooks/clerk`
3. **Neon** — use pooled `DATABASE_URL` for runtime, direct `DIRECT_URL` for migrations
4. **Health check** — monitor `GET /api/health` for DB and service connectivity
5. **Env vars** — set all variables from `.env.example` in your hosting dashboard

### Recommended next features

| Priority | Feature | Why |
| -------- | ------- | --- |
| High | Trip sharing (read-only link) | Core Mindtrip social loop |
| High | Rate limiting on `/api/chat` | Prevent Gemini cost spikes |
| Medium | Export itinerary (PDF / Google Calendar) | User retention |
| Medium | Manual place search when editing items | Better edit UX |
| Medium | Sentry / error monitoring | Production debugging |
| Low | Affiliate IDs on booking links | Monetization |
| Low | Advanced map markers | Google deprecated `Marker` in favor of `AdvancedMarkerElement` |


| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run lint` | Run ESLint |
| `npx prisma studio` | Open database GUI |
