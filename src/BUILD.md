# Building the app

These are the source files the live site (`index.html`, `sw.js`, `img/`) is built from.

| File | What it holds |
|---|---|
| `plan/data.py` | Start date, week structure, easy weeks, test weeks, plan rules |
| `data3.py` | Every session, exercise, variant per location, setup text, home rep and set adjustments; writes `data3.json` and `ids.json` |
| `app.js` | All app logic: targets, carry-over, sync, rings, measurements, activities |
| `base.css`, `extra.css` | Styling |
| `build3.py` | Builds `site/index.html`, `sw.js` and `img/`, plus the offline `Fitness-Plan-App.html` |
| `myimg/` | Custom photos (the Matrix assisted pull-up machine at The Gym Group) |

## Steps

1. Exercise photos come from [free-exercise-db](https://github.com/yuhonas/free-exercise-db). Clone it (sparse checkout of the exercises used is enough) to `/home/claude/fedb`.
2. Put `plan/data.py` at `/home/claude/plan/data.py` and the rest in a working folder (paths are set in `data3.py` and `build3.py`; the icons are copied from the repo root).
3. Run `python3 data3.py` (it must print no `MISSING` lines), then `python3 build3.py`.
4. Bump the service-worker cache name in `build3.py` (`fitness-vNN`) for every release.
5. Serve `site/` on port 8790 and run `node tests/regression.js`. Every check must pass before publishing.
6. Copy `site/` into the repo root and commit.

## Rules for committing

- Commit as `ai16aau` with the no-reply address `56545748+ai16aau@users.noreply.github.com`.
- Never add Co-Authored-By or any Claude attribution lines. Claude must never appear as a contributor.
- Never commit tokens or personal email addresses.
