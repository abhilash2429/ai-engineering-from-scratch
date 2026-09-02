# Toolkit

A personal vault of the reusable artifacts the curriculum ships.

Every lesson has an `outputs/` directory holding something you can actually
plug into your workflow: an agent skill, a prompt, a schema, a script. There
are 343 of them across the curated lesson set, and the repo has no way to
gather them. This does.

```bash
python toolkit/collect.py              # collect artifacts for lessons logged in LEARNING.md
python toolkit/collect.py --available  # list what the curated set offers, not yet collected
python toolkit/collect.py --all-kept   # grab everything in the curated set at once
```

Completed lessons come from the Progress log table in `LEARNING.md`. The
curated set comes from `site/hidden-seed.js`, so a lesson you cut never leaks
an artifact in here.

Collected files land in `toolkit/artifacts/<phase>/<lesson>/` and are indexed
in `toolkit/INDEX.md`, grouped by type with each artifact's own description.

Run it after each study session. The point is that when you finish, the
deliverable is a working toolkit rather than a completion count.
