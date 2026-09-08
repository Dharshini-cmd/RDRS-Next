# RDRS local authentication

This version replaces Manus OAuth for normal RDRS users with email/password authentication backed by MySQL. Existing RDRS telemetry, incidents, reports, profiles and response tables are preserved.

## Setup

1. Create a MySQL database, for example `rdrs`.
2. Copy `.env.example` to `.env`.
3. Set `DATABASE_URL` to your MySQL connection string.
4. Set `JWT_SECRET` to a long random secret.
5. Run `pnpm install`.
6. Run `pnpm db:push`.
7. Run `pnpm dev`.
8. Open the printed localhost URL and create an account.

Do not commit `.env`. Passwords are stored as scrypt-derived hashes and sessions use an HTTP-only cookie.

If port 3000 is already occupied, stop the other process or set `PORT=3001`; the server's automatic fallback can also select another free port.
