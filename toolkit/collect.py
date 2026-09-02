#!/usr/bin/env python3
"""Collect lesson artifacts into a personal, reusable toolkit.

Every lesson ships a reusable artifact under `outputs/` — a skill, a prompt,
an agent, a schema, a script. 439 of the 503 lessons have one, and nothing in
the repo gathers them. This does.

    python toolkit/collect.py                # collect artifacts for logged lessons
    python toolkit/collect.py --available    # what the curated set offers, uncollected
    python toolkit/collect.py --all-kept     # collect everything in the curated set

Completed lessons come from the Progress log table in LEARNING.md. The curated
set comes from site/hidden-seed.js, so the toolkit never pulls in an artifact
from a lesson you cut.

Stdlib only, per the repo's dependency rules.
"""

from __future__ import annotations

import argparse
import re
import shutil
import sys
from pathlib import Path

REPO = Path(__file__).resolve().parent.parent
PHASES = REPO / "phases"
VAULT = REPO / "toolkit" / "artifacts"
INDEX = REPO / "toolkit" / "INDEX.md"
LEARNING = REPO / "LEARNING.md"
SEED = REPO / "site" / "hidden-seed.js"

SKIP_NAMES = {".gitkeep"}


def read_seed() -> tuple[set[str], set[str]]:
    """Return (hidden phase slugs, hidden lesson paths) from the site seed."""
    if not SEED.exists():
        return set(), set()
    text = SEED.read_text(encoding="utf-8")

    def array(field: str) -> list[str]:
        m = re.search(field + r"\s*:\s*\[(.*?)\]", text, re.S)
        return re.findall(r"'([^']+)'", m.group(1)) if m else []

    return set(array("phases")), set(array("lessons"))


def kept_lessons() -> list[Path]:
    """Every lesson directory still in the curated set."""
    hidden_phases, hidden_lessons = read_seed()
    out = []
    for phase in sorted(PHASES.iterdir()):
        if not phase.is_dir() or phase.name in hidden_phases:
            continue
        for lesson in sorted(phase.iterdir()):
            if not lesson.is_dir():
                continue
            if f"phases/{phase.name}/{lesson.name}" in hidden_lessons:
                continue
            out.append(lesson)
    return out


def logged_lessons() -> list[Path]:
    """Lessons recorded in the LEARNING.md Progress log."""
    if not LEARNING.exists():
        return []
    text = LEARNING.read_text(encoding="utf-8")
    block = text.split("## Progress log", 1)
    if len(block) < 2:
        return []
    rows = block[1].split("##", 1)[0]
    found = []
    for line in rows.splitlines():
        cells = [c.strip() for c in line.strip().strip("|").split("|")]
        if len(cells) < 2 or cells[1] in ("Lesson", "------"):
            continue
        slug = cells[1].strip("`")
        path = PHASES / slug
        if path.is_dir():
            found.append(path)
    return found


def artifacts_of(lesson: Path) -> list[Path]:
    outputs = lesson / "outputs"
    if not outputs.is_dir():
        return []
    return sorted(f for f in outputs.iterdir() if f.is_file() and f.name not in SKIP_NAMES)


def classify(name: str) -> str:
    if name.startswith("skill-"):
        return "skill"
    if name.startswith("prompt-"):
        return "prompt"
    if name.startswith("agent-"):
        return "agent"
    return "other"


def describe(path: Path) -> str:
    """Pull `description:` out of the artifact's frontmatter, if it has one."""
    if path.suffix != ".md":
        return ""
    try:
        head = path.read_text(encoding="utf-8", errors="replace")[:1200]
    except OSError:
        return ""
    if not head.startswith("---"):
        return ""
    m = re.search(r"^description:\s*(.+)$", head, re.M)
    return m.group(1).strip() if m else ""


def collect(lessons: list[Path]) -> list[tuple[Path, Path]]:
    copied = []
    for lesson in lessons:
        for art in artifacts_of(lesson):
            dest = VAULT / lesson.parent.name / lesson.name / art.name
            dest.parent.mkdir(parents=True, exist_ok=True)
            if not dest.exists() or dest.read_bytes() != art.read_bytes():
                shutil.copy2(art, dest)
            copied.append((lesson, dest))
    return copied


def write_index(entries: list[tuple[Path, Path]]) -> None:
    groups: dict[str, list[tuple[Path, Path]]] = {}
    for lesson, dest in entries:
        groups.setdefault(classify(dest.name), []).append((lesson, dest))

    lines = [
        "# Toolkit",
        "",
        "Reusable artifacts collected from completed lessons by "
        "`toolkit/collect.py`. Regenerate with `python toolkit/collect.py`.",
        "",
        f"**{len(entries)} artifacts** from "
        f"{len({l for l, _ in entries})} lessons.",
        "",
    ]
    for kind in ("skill", "prompt", "agent", "other"):
        rows = groups.get(kind)
        if not rows:
            continue
        lines += [f"## {kind.title()}s ({len(rows)})", "", "| Artifact | From | What it does |", "|---|---|---|"]
        for lesson, dest in sorted(rows, key=lambda r: r[1].name):
            # INDEX.md sits in toolkit/, so links are relative to that, not the repo root
            rel = dest.relative_to(INDEX.parent).as_posix()
            src = f"{lesson.parent.name}/{lesson.name}"
            lines.append(f"| [`{dest.name}`]({rel}) | `{src}` | {describe(dest) or '—'} |")
        lines.append("")
    INDEX.write_text("\n".join(lines), encoding="utf-8")


def main(argv: list[str]) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--available", action="store_true",
                    help="list artifacts the curated set offers that are not collected yet")
    ap.add_argument("--all-kept", action="store_true",
                    help="collect from every kept lesson, not just logged ones")
    args = ap.parse_args(argv)

    if args.available:
        have = {p.name for p in VAULT.rglob("*") if p.is_file()}
        total = 0
        for lesson in kept_lessons():
            arts = [a for a in artifacts_of(lesson) if a.name not in have]
            if arts:
                total += len(arts)
                print(f"{lesson.parent.name}/{lesson.name}: {', '.join(a.name for a in arts)}")
        print(f"\n{total} artifacts available across the curated set.")
        return 0

    lessons = kept_lessons() if args.all_kept else logged_lessons()
    if not lessons:
        print("No lessons to collect from. Log some in LEARNING.md's Progress "
              "log, or pass --all-kept to grab the whole curated set.")
        return 0

    entries = collect(lessons)
    write_index(entries)
    print(f"Collected {len(entries)} artifacts from {len(lessons)} lessons "
          f"into {VAULT.relative_to(REPO).as_posix()}/")
    print(f"Index written to {INDEX.relative_to(REPO).as_posix()}")
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
