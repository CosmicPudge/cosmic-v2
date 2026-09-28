# Cosmic development workflow

- Development branch: `dev`
- Development URL: <https://dev.cosmicpudge.shop>
- Stable branch: `main`
- Stable URL: <https://cosmicpudge.shop>

Develop and test fixes on `dev` first. After the user approves a tested
checkpoint, promote that exact commit to `main` with a safe fast-forward when
possible. If the branches diverge, reconcile them normally; never force-push.

The `dev` and `main` deployments share the persistent hosted Supabase
database. Do not use destructive database tests against either environment.
Schema changes require reviewed forward migrations; do not use `db:push`.
