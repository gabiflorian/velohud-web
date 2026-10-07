# VeloHUD web

This is the rider site. Create an account with an email address or a username, save a profile, generate a week of sessions, and edit a session. On Bike, type the short code the TV is showing. That attaches the Pi to this profile.

Ride shows the live heart rate, cadence, and power. Workouts lists the rides newest first, ten to a page, each with the date and start time and a chart. Heart rate, cadence, and power are separate lines. One hundred percent is that step's target, and the axis grows when a reading goes past the target.

The API is a separate process on `http://127.0.0.1:8000`. This site runs on `http://127.0.0.1:5173`.

## Run it

```bash
npm install
npm run dev
```

Open `http://127.0.0.1:5173`. Use that host, not `localhost`. The session cookie is tied to `127.0.0.1`.
