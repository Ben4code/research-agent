# Deploying to Coolify (independent resources)

Production deploys use **one Coolify resource per app**, built from its own
Dockerfile — not a single Docker Compose stack. All resources live in the
same Coolify project + environment and on the same server, so they can talk
to each other over Coolify's shared Docker network.

## Resource inventory

| Resource      | Type                     | Source / Build                              | Public domain                    |
| ------------- | ------------------------ | ------------------------------------------- | -------------------------------- |
| `db`          | Database → PostgreSQL 17 | one-click                                   | — (internal only)                |
| `temporal`    | Docker Compose           | this repo, `/docker-compose.temporal.yml`   | temporal-ui → `https://temporal.celeboty.com:8080` |
| `api`         | Dockerfile               | `/apps/api/Dockerfile`, base dir `/`        | `https://api.celeboty.com` (port 3001) |
| `worker`      | Dockerfile               | `/apps/worker/Dockerfile`, base dir `/`     | — (no port, no domain)           |
| `web`         | Dockerfile               | `/apps/web/Dockerfile`, base dir `/`        | `https://ui.celeboty.com` (port 3000)  |

> **Base Directory stays `/`** for all three apps: the Dockerfiles expect the
> repo root as build context (pnpm lockfile + workspace packages). Only the
> **Dockerfile Location** differs per app.

## 1. Create the database

1. New Resource → **Database → PostgreSQL** (17).
2. Set **PostgreSQL Database** (init db) to `research_agent`.
3. Deploy, then copy the **Internal URL** from the database page
   (`postgresql://user:pass@<container>:5432/research_agent`). Append
   `?schema=public` — this is the `DATABASE_URL` for api and worker.

## 2. Create the Temporal stack

1. New Resource → **Docker Compose** from this repo:
   - Base Directory: `/`
   - Docker Compose Location: `/docker-compose.temporal.yml`
2. Deploy it once, then on the stack's **Service Stack** page enable
   **Connect to Predefined Network** (required so api/worker can reach
   Temporal from their own resources) and redeploy.
3. Set the domain on the `temporal-ui` service:
   `https://temporal.celeboty.com:8080`.
4. Note the stack's **resource UUID** (in its Coolify URL). Cross-resource
   DNS uses the full container name, so the Temporal address for api/worker is:

   ```
   TEMPORAL_ADDRESS=temporal-<stack-uuid>:7233
   ```

   (`docker ps` on the server shows the exact container names if unsure.)

## 3. Create the apps

For each of `api`, `worker`, `web`: New Resource → this repo → Build Pack
**Dockerfile**, Base Directory `/`, Dockerfile Location per the table above.

> Ensure **Connect to Predefined Network** stays enabled (it is by default)
> on `api` and `worker` — without it they cannot reach the database or
> Temporal containers from their own network.

### api

- **Port:** `3001`, **Domain:** `https://api.celeboty.com`
- Environment variables:

  | Key                 | Value                                              |
  | ------------------- | -------------------------------------------------- |
  | `PORT`              | `3001`                                             |
  | `DATABASE_URL`      | internal DB URL from step 1 + `?schema=public`     |
  | `CORS_ORIGIN`       | `https://ui.celeboty.com`                          |
  | `TEMPORAL_ADDRESS`  | `temporal-<stack-uuid>:7233`                       |
  | `TEMPORAL_NAMESPACE`| `default`                                          |
  | `TEMPORAL_TASK_QUEUE`| `research-agent`                                  |

  Prisma migrations run automatically on container start
  (`prisma migrate deploy` in the image's `CMD`).

### worker

- No domain, no port.
- Environment variables: `DATABASE_URL`, `TEMPORAL_ADDRESS`,
  `TEMPORAL_NAMESPACE=default`, `TEMPORAL_TASK_QUEUE=research-agent`,
  plus the required secrets `OPENCODE_API_KEY` and `TAVILY_API_KEY`.

### web

- **Port:** `3000`, **Domain:** `https://ui.celeboty.com`
- Environment variables:

  | Key                   | Value                        |
  | --------------------- | ---------------------------- |
  | `NEXT_PUBLIC_API_URL` | `https://api.celeboty.com`   |

  `NEXT_PUBLIC_API_URL` is baked into the client bundle at **build time**.
  Coolify injects env vars as Dockerfile build args by default (Configuration
  → Advanced → "Inject Build Args to Dockerfile"), so just set it before the
  first deploy — and **redeploy web** whenever it changes.

## 4. Deploy order

1. `db` (database)
2. `temporal` stack
3. `api` and `worker`
4. `web`

## Optional: watch paths

All five resources point at the same repo, so a push would otherwise rebuild
everything. Set **Watch Paths** (Configuration → Advanced) on each resource:

- `api`: `apps/api/**, packages/shared/**`
- `worker`: `apps/worker/**, packages/shared/**, apps/api/prisma/**`
- `web`: `apps/web/**, packages/shared/**`
- `temporal` stack: `docker-compose.temporal.yml, temporal/**`

## Gotchas

- **Never define `networks:` or `container_name:`** in compose files deployed
  by Coolify — Coolify manages both, and custom networks cause intermittent
  504s from the proxy.
- Cross-resource DNS needs the **full container name**
  (`temporal-<uuid>`, the DB's internal hostname) — plain service names only
  resolve *within* a stack.
- If a domain shows "No Available Server", check `docker ps` on the server —
  the container is unhealthy or still starting (the api image runs
  `prisma migrate deploy` before listening, so give it ~30s).
