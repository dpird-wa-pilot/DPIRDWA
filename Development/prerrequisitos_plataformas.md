# Platform Prerequisites and Configuration Guide — DPIRD WA Tool Pilot

**Document:** Platform Requirements and Environment Configuration for Client Handover  
**Project:** DPIRD WA Digital Tool — Pilot Phase  
**Client:** Department of Primary Industries and Regional Development (DPIRD WA) / Eleven June Consulting  
**Date:** August 2026  

---

## 1. Executive Summary of Required Platforms

For the deployment, operation, and ongoing maintenance of the solution during its **pilot phase ($0.00 USD/month infrastructure cost)**, the client or system administrator team must set up and maintain access to the following 4 core platforms:

| Platform | Role in the Solution | Recommended Plan | Estimated Monthly Cost |
|---|---|---|---|
| **Vercel** | React Frontend Hosting + Serverless Functions (Backend API) | Free Tier (Hobby) / Pro | **$0.00 USD** |
| **Supabase** | PostgreSQL Database, Authentication & Row Level Security (RLS) | Free Tier | **$0.00 USD** |
| **Google Cloud Console** | Identity Authentication Provider (Google OAuth 2.0) | Included / Free | **$0.00 USD** |
| **Google AI Studio** | Generative AI Provider for Chatbot (Gemini Flash API) | Free Tier | **$0.00 USD** |

---

## 2. Platform Details & Step-by-Step Configuration

### 2.1 Google Cloud Console (Identity Provider for OAuth 2.0)

Required to enable authorized users to log in using their organizational/Google accounts.

#### Configuration Steps:
1. Create a dedicated project in [Google Cloud Console](https://console.cloud.google.com/) named `dpird-wa-pilot-auth`.
2. Navigate to **APIs & Services > OAuth consent screen**:
   - Configure user type as **Internal** (or External in Testing mode).
   - Provide application name (`DPIRD WA Tool`) and support email.
3. Navigate to **Credentials > Create Credentials > OAuth client ID**:
   - **Application type**: `Web application`.
   - **Name**: `DPIRD Pilot Auth Client`.
   - **Authorized JavaScript origins**: Vercel deployment URL (e.g., `https://dpird-wa-tool.vercel.app`).
   - **Authorized redirect URIs**: Supabase Auth callback URL:
     `https://<YOUR-SUPABASE-PROJECT-REF>.supabase.co/auth/v1/callback`
4. **Credentials to record/handover**:
   - `GOOGLE_OAUTH_CLIENT_ID`
   - `GOOGLE_OAUTH_CLIENT_SECRET`

---

### 2.2 Supabase (Database & Authentication)

Manages relational database storage, user authentication, and data security policies via Row Level Security (RLS).

#### Configuration Steps:
1. Sign up or log in to [Supabase.com](https://supabase.com/).
2. Create a new project named `dpird-wa-pilot-db` in the preferred region (e.g., `ap-southeast-1` Singapore).
3. **Configure Authentication (Google OAuth)**:
   - Go to **Authentication > Providers > Google**.
   - Enable the provider and enter the `Client ID` and `Client Secret` obtained from Google Cloud Console.
4. **Run SQL Migration Scripts (Tables & RLS)**:
   - Execute the SQL migration script (provided in the handover package) which creates:
     - `allowed_users` table (Whitelist of authorized user email addresses, 1–5 users).
     - Business tables: `grants`, `resources`, `diagnostics`.
     - **Row Level Security (RLS)** policies on each table restricting read/write permissions exclusively to emails present in `allowed_users`.
5. **Credentials to record/handover**:
   - `SUPABASE_URL` (e.g., `https://xyzcompany.supabase.co`)
   - `SUPABASE_ANON_KEY` (Public client key for the frontend)
   - `SUPABASE_SERVICE_ROLE_KEY` (Private administrative key for serverless functions)

---

### 2.3 Google AI Studio (API Provider for Gemini Flash Chatbot)

Provides access to the generative AI model API powering the interactive AI chatbot.

#### Configuration Steps:
1. Log in to [Google AI Studio](https://aistudio.google.com/) using the project administrator account.
2. Select the dedicated Google Cloud project (`dpird-wa-pilot-auth`).
3. Click **Get API key > Create API key in existing project**.
4. Copy the generated API key and ensure it is kept secret (never committed to public repositories).
5. **Credential to record/handover**:
   - `GEMINI_API_KEY`

---

### 2.4 Vercel (Hosting & Serverless Engine)

Hosts the single-page web application and executes serverless API endpoints communicating with Gemini API.

#### Configuration Steps:
1. Log in to [Vercel.com](https://vercel.com/) and connect your organization's Git repository.
2. Click **Add New > Project** and select the repository `DPIRDWA/Initial Prototype`.
3. Set the **Root Directory** to: `Development/Tool`.
4. **Configure Environment Variables**:

| Variable Name | Description | Visibility / Scope |
|---|---|---|
| `VITE_SUPABASE_URL` | Base URL of your Supabase project | Production, Preview, Development |
| `VITE_SUPABASE_ANON_KEY` | Public anonymous API key for Supabase | Production, Preview, Development |
| `GEMINI_API_KEY` | Secret API key for Gemini Flash AI model | Serverless Functions ONLY |
| `SUPABASE_SERVICE_ROLE_KEY` | Administrative service key (optional) | Serverless Functions ONLY |

5. Click **Deploy**.

---

## 3. Environment Variables Matrix (`.env.example`)

Below is the template for the `.env` file required for local testing and Vercel environment variable setup:

```env
# ===============================================
# FRONTEND CONFIGURATION (VITE + SUPABASE)
# ===============================================
VITE_SUPABASE_URL=https://<YOUR-PROJECT-REF>.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# ===============================================
# BACKEND CONFIGURATION (VERCEL SERVERLESS)
# ===============================================
GEMINI_API_KEY=AIzaSy...
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## 4. Handover Checklist

Confirm that each task has been completed prior to delivering access and credentials to the client:

- [ ] Google Cloud project created with OAuth Consent Screen configured.
- [ ] Google OAuth Client ID and Client Secret generated and linked to Supabase Auth.
- [ ] Supabase project active and database tables initialized using the SQL migration script.
- [ ] `allowed_users` table populated with the email addresses of the 1–5 authorized pilot users.
- [ ] RLS policies enabled and verified in Supabase (access denied to unauthorized emails).
- [ ] `GEMINI_API_KEY` generated via Google AI Studio.
- [ ] Repository imported to Vercel with Root Directory set to `Development/Tool`.
- [ ] Environment variables loaded into the Vercel project panel.
- [ ] Test deployment completed successfully and preview URL verified with the team.
