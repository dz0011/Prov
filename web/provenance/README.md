# Provenance (static web app)

I added a static single-file app under `web/provenance` that provides a simple painting journal UI backed by Supabase.

Files added:
- web/provenance/index.html  — the full single-file app (HTML/CSS/JS)
- web/provenance/.env.example — example env vars and quick run notes
- web/provenance/schema.sql  — SQL to create the `journals` table in Supabase

Next steps you can take:
- Run the SQL in `web/provenance/schema.sql` in your Supabase project.
- Set `SUPABASE_URL` and `SUPABASE_ANON_KEY` in your hosting environment; for local testing you can paste the anon key into the top of `index.html` (not recommended for public repos).
- Open a PR from `feature/add-provenance-ui` to your default branch when ready to review.

If you'd like, I can also:
- Create a draft pull request summarizing the change.
- Replace the inline config in `index.html` with an environment-loader that suit your hosting platform.
