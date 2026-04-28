This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

## Real-Time Ambulance Data (MongoDB)

The dashboard now supports live ambulance markers from MongoDB.

### What Is Used

- `MongoDB` collection: `ambulances_live`
- API endpoints:
	- `GET /api/ambulances/live?lat=<lat>&lng=<lng>&radiusKm=<km>`
	- `POST /api/ambulances/live` (upsert one or many ambulances)
	- `POST /api/ambulances/live/seed` (generate local demo ambulances)
- Dashboard polling:
	- `src/app/dashboard/page.tsx` polls every 5 seconds.

### How It Works

1. Dashboard detects your current location.
2. It requests nearby ambulances from MongoDB.
3. If none exist yet, it auto-seeds a local batch once near your location.
4. It continues polling every 5 seconds to stay updated.

### Update Live Ambulance Coordinates

Example: upsert one ambulance

```bash
curl -X POST http://localhost:3000/api/ambulances/live \
	-H "Content-Type: application/json" \
	-d '{
		"ambulanceId": "AMB-01",
		"callSign": "LOC-01",
		"type": "ALS",
		"status": "en_route",
		"location": { "lat": 12.9716, "lng": 77.5946 },
		"speed": 42,
		"fuelLevel": 76,
		"equipment": ["Defibrillator", "Oxygen Supply"],
		"crew": ["Paramedic A", "Driver B"]
	}'
```

Example: bulk upsert

```bash
curl -X POST http://localhost:3000/api/ambulances/live \
	-H "Content-Type: application/json" \
	-d '{
		"ambulances": [
			{
				"ambulanceId": "AMB-01",
				"callSign": "LOC-01",
				"type": "ALS",
				"status": "available",
				"location": { "lat": 12.9716, "lng": 77.5946 },
				"speed": 0,
				"fuelLevel": 84
			},
			{
				"ambulanceId": "AMB-02",
				"callSign": "LOC-02",
				"type": "BLS",
				"status": "dispatched",
				"location": { "lat": 12.9820, "lng": 77.6010 },
				"speed": 38,
				"fuelLevel": 68
			}
		]
	}'
```

### Seed Nearby Ambulances Manually

```bash
curl -X POST http://localhost:3000/api/ambulances/live/seed \
	-H "Content-Type: application/json" \
	-d '{"lat": 12.9716, "lng": 77.5946, "count": 12}'
```

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
## Contribution by Piyush
- Setup local environment
- Learning Git workflow