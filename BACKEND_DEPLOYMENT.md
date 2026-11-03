# RideNow FastAPI Backend - Render Free Deployment Guide

This guide provides step-by-step instructions to deploy the **RideNow FastAPI Driver Verification & Compliance Microservice** to **Render** on the **Free Tier**.

---

## 1. Service Specification & Settings

Log in to your [Render Dashboard](https://dashboard.render.com/) and click **New +** -> **Web Service**. Connect your GitHub repository (`ashsihgangawat/ridenow`).

Fill in the settings as follows:

| Field | Configuration Value |
|---|---|
| **Name** | `ridenow-verification-api` (or your choice) |
| **Region** | `Singapore` (Recommended for lowest latency in India) or `Frankfurt` |
| **Branch** | `main` |
| **Root Directory** | `backend/fastapi_service` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install --upgrade pip && pip install -r requirements.txt` |
| **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |
| **Instance Type** | `Free` (0.1 CPU, 512 MB RAM) |

---

## 2. Environment Variables Configuration

Under the **Environment Variables** section in the Render service creation screen (or under **Environment** tab after creation), add the following keys:

| Key | Value | Description |
|---|---|---|
| `PYTHON_VERSION` | `3.11.9` | Ensures modern Python 3.11 runtime on Render |
| `ENVIRONMENT` | `production` | Enables production logging and disables dev auto-reload |
| `CORS_ORIGINS` | `https://*.amplifyapp.com,https://ridenow.in` | Comma-separated list of allowed frontend domains |
| `JWT_SECRET` | *(Generate a random 32+ char string)* | Secret key used for cryptographic session verification |
| `FIREBASE_SERVICE_ACCOUNT_JSON` | *(Optional - paste raw JSON)* | Firebase Admin credentials string (if using live Firebase) |
| `DATABASE_PATH` | *(Optional)* | Custom path if using a mounted persistent volume |

> [!IMPORTANT]
> **Never commit your `.env` or service account JSON into Git!** Paste sensitive credentials directly into Render's secure **Environment Variables** dashboard.

---

## 3. Health Check Configuration

In your Render Service Settings:
- Expand **Advanced Settings**.
- Set **Health Check Path** to: `/health`

Render will query this endpoint during deployments and zero-downtime restarts. Once it returns HTTP 200, Render marks the service as **Live**.

---

## 4. Endpoints Deployed

Once live at `https://<your-service-name>.onrender.com`:

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Live service health status & environment check |
| `GET` | `/docs` | Interactive Swagger API documentation |
| `GET` | `/redoc` | ReDoc API specifications |
| `POST` | `/driver/register` | Driver onboarding (Bike, Car, Auto) |
| `POST` | `/driver/documents/upload` | Upload & validate DL, RC, Insurance, PUC, Selfie, etc. |
| `GET` | `/driver/verification-status` | Driver compliance & document review progress |
| `GET` | `/driver/profile` | Driver profile & vehicle info |
| `PUT` | `/driver/profile` | Update driver personal & contact details |
| `GET` | `/admin/drivers/pending` | Admin list of drivers awaiting document verification |
| `GET` | `/admin/driver/{id}` | Detailed driver audit trail & submitted documents |
| `POST` | `/admin/document/{id}/approve` | Admin individual document approval |
| `POST` | `/admin/document/{id}/reject` | Admin document rejection with correction reason |
| `POST` | `/admin/driver/{id}/approve` | Admin full driver authorization |
| `POST` | `/admin/driver/{id}/reject` | Admin driver registration rejection |

---

## 5. Connecting with AWS Amplify Frontend

1. Once your frontend is deployed to **AWS Amplify** (e.g. `https://main.dXXXXXXXXX.amplifyapp.com`), copy your Amplify domain.
2. In your Render Dashboard -> **Environment Variables**:
   - Update `CORS_ORIGINS` to include your exact Amplify domain:
     ```
     https://main.dXXXXXXXXX.amplifyapp.com,https://ridenow.in
     ```
3. In your Amplify frontend configuration (or `.env.production`):
   - Set the API URL to:
     ```
     VITE_API_BASE_URL=https://<your-service-name>.onrender.com
     ```

---

## 6. Render Free Tier Considerations

- **Spin-down / Inactivity**: Free Web Services sleep after 15 minutes without inbound traffic. The first request after sleep may take ~30-50 seconds to wake up (cold start).
- **Keep-Alive (Optional)**: You can use an uptime monitor (e.g., UptimeRobot, Cron-job.org) hitting `https://<your-service-name>.onrender.com/health` every 10-14 minutes to prevent cold starts during testing.
- **Ephemeral Storage**: Files written to disk on the Free tier reset on server restart. For permanent driver records in production, link to a managed database (e.g., Render Free PostgreSQL or Supabase).

