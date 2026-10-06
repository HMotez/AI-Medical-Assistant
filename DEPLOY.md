# Deploying for free (Render + Neon)

The app runs on free plans, with HTTPS included:

| Part | Service | Free plan |
|---|---|---|
| Website (React) | Render static site | Always on |
| API (FastAPI + ML model) | Render web service (Docker) | Sleeps after 15 min without visits; the next request wakes it in about 50 s |
| Database (PostgreSQL) | Neon | 0.5 GB, does not expire |

Uploaded photos and doctor documents are stored in the database, so nothing is lost
when Render restarts or redeploys the API.

Your site will be at `https://medai-hmotez.onrender.com` and the API at
`https://medai-api-hmotez.onrender.com` (names set in [`render.yaml`](render.yaml)).

---

## 1. Create the database (Neon), about 3 minutes

1. Go to <https://neon.tech> and sign up with GitHub.
2. Create a project: name `medai`, PostgreSQL 16, region **Europe (Frankfurt)**.
3. On the project dashboard, click **Connect** and copy the connection string. It looks like
   `postgresql://neondb_owner:••••@ep-xxxx.eu-central-1.aws.neon.tech/neondb?sslmode=require`.
   Keep it for step 2.

## 2. Create the API and the website (Render), about 10 minutes

1. Go to <https://render.com> and sign up with GitHub. Allow access to the `AI-Medical-Assistant` repository.
2. Click **New → Blueprint**, choose the repository, then **Connect**. Render reads `render.yaml`.
3. Fill in the values it asks for:

   | Variable | What to enter |
   |---|---|
   | `DATABASE_URL` | the Neon connection string from step 1 |
   | `ADMIN_EMAIL` | the email you will use to sign in as administrator |
   | `ADMIN_PASSWORD` | a strong password, 12 characters or more (keep it private) |
   | `ANTHROPIC_API_KEY` | leave empty: the chat then uses its offline answers |

4. Click **Apply**. The first build takes 5–10 minutes. On the first start, the API creates
   the tables, your administrator account and the demo patient.
5. Open `https://medai-hmotez.onrender.com` and sign in with your administrator email.

### If Render gives a different address

Service names are unique across Render. If a name was taken, Render adds a suffix
(e.g. `medai-api-hmotez-x1y2.onrender.com`). Then:

- on the **website** service → *Environment*: set `REACT_APP_API_URL` to the real API address, then *Manual Deploy*;
- on the **API** service → *Environment*: set `ALLOWED_ORIGINS` to `["https://<real website address>"]`.

## 3. Check

- `https://medai-api-hmotez.onrender.com/api/health` answers `{"status":"ok", ...}`.
- The website loads, you can sign in as administrator, and the *Verifications* page opens.
- Sign in as the demo patient (`patient@medai.com` / `Patient@1234`) and run an analysis.

## Updating

Every push to `main` redeploys both services automatically. Database changes are applied
at start-up (`alembic upgrade head`).

## Good to know

- **Production safety.** With `ENVIRONMENT=production` the API refuses to start without a
  real secret key, turns debug off, never creates the demo doctor (it could read real patients'
  analyses), and protects the shared demo patient (its password, photo and the account itself
  cannot be changed).
- **Cold starts.** To avoid the 50-second wake-up, you can ping
  `https://medai-api-hmotez.onrender.com/api/health` every 10 minutes with a free monitor
  such as <https://cron-job.org> or UptimeRobot. One always-on service fits in Render's 750 free hours per month.
- **Retraining.** The trained model ships inside the image. The admin *Retrain* button needs the
  dataset, which is not deployed: retrain locally (`python -m ml.src.trainer`), commit the files in
  `ml/models/saved/`, and push.
- **Own domain.** Later you can add a domain (about 10 €/year) in Render → *Settings → Custom Domains*;
  HTTPS stays free.

## Alternative: one server with Docker

On any Linux server with Docker:

```bash
git clone https://github.com/HMotez/AI-Medical-Assistant.git && cd AI-Medical-Assistant
echo "POSTGRES_PASSWORD=$(openssl rand -hex 16)" > .env
cp .env.example backend/.env      # set ENVIRONMENT=production, SECRET_KEY, ADMIN_EMAIL, ADMIN_PASSWORD
docker compose up -d --build
```

Put a reverse proxy with HTTPS (for example Caddy) in front of port 3000.
