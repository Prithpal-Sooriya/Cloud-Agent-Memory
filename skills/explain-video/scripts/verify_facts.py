#!/usr/bin/env python3
"""Check that every number and date shown or spoken is backed by the facts ledger.

Stdlib only. Reads scenes.json (`display` text), facts.json, and optionally extra
files (segment sources) whose text is scanned the same way. Exit 1 on any error.
See facts.md for the ledger format.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

KINDS = {"verbatim", "decision", "hypothesis", "open", "external", "derived", "quote"}
REQUIRED = ("id", "shown", "kind", "source")

# A number with an optional currency prefix and unit suffix. Letters glued to the
# front (Q1, v2, F1) are identifiers, not figures.
NUMBER = re.compile(
    r"(?<![\w.])[$£€]?\d[\d,]*(?:\.\d+)?"
    r"(?:\s?(?:%|x\b|pp\b|bps\b|bp\b|ms\b|[kKmMbB]n?\b|days?\b|weeks?\b|months?\b|years?\b))?"
)


def norm(text: str) -> str:
    return re.sub(r"[\s,]+", "", text).lower()


def strip_markup(text: str) -> str:
    text = re.sub(r"\$\{[^}]*\}", " ", text)  # template placeholders
    text = re.sub(r"<[^>]+>", " ", text)  # html tags
    text = re.sub(r"(?:style|class|data-[\w-]+)=\"[^\"]*\"", " ", text)
    return text


def numbers_in(text: str) -> list[str]:
    return [m.group(0).strip().rstrip(".,") for m in NUMBER.finditer(text)]


def display_text(scenes_path: Path) -> str:
    data = json.loads(scenes_path.read_text())
    return "\n".join(
        line.get("display", "") for scene in data.get("scenes", []) for line in scene.get("lines", [])
    )


def check(scenes: Path, facts_path: Path, also: list[Path]) -> tuple[list[str], list[str]]:
    errors: list[str] = []
    warnings: list[str] = []
    ledger = json.loads(facts_path.read_text())
    facts = ledger.get("facts", [])
    allow = {norm(str(a)) for a in ledger.get("allow", [])}

    seen_ids: set[str] = set()
    for i, fact in enumerate(facts):
        label = fact.get("id", f"#{i + 1}")
        missing = [k for k in REQUIRED if not fact.get(k)]
        if missing:
            errors.append(f"fact {label}: missing {', '.join(missing)}")
            continue
        if fact["id"] in seen_ids:
            errors.append(f"fact {label}: duplicate id")
        seen_ids.add(fact["id"])
        if fact["kind"] not in KINDS:
            errors.append(f"fact {label}: kind '{fact['kind']}' not one of {sorted(KINDS)}")
        if fact["kind"] == "derived" and not fact.get("derivation"):
            errors.append(f"fact {label}: derived fact needs a derivation")
        if fact["kind"] == "external" and not fact.get("attribution"):
            errors.append(f"fact {label}: external fact needs an attribution")

    for d in ledger.get("discrepancies", []):
        if not str(d.get("resolution", "")).strip():
            errors.append(f"discrepancy '{d.get('topic', '?')}': no resolution (ask the user)")

    shown_norm = [norm(f["shown"]) for f in facts if f.get("shown")]
    texts = [display_text(scenes)] + [strip_markup(p.read_text()) for p in also]
    haystack = "\n".join(texts)
    hay_norm = norm(haystack)

    uncovered: list[str] = []
    for token in numbers_in(haystack):
        n = norm(token)
        if n in allow or any(n in s for s in shown_norm):
            continue
        if token not in uncovered:
            uncovered.append(token)
    for token in uncovered:
        errors.append(f"'{token}' appears in the video text but is not in the facts ledger")

    for fact in facts:
        if fact.get("shown") and norm(fact["shown"]) not in hay_norm:
            warnings.append(f"fact {fact.get('id', '?')} ('{fact['shown']}') never appears in the text checked")
    return errors, warnings


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("scenes", type=Path)
    ap.add_argument("--facts", type=Path, required=True)
    ap.add_argument("--also", type=Path, nargs="*", default=[], help="extra files to scan (segment sources)")
    ap.add_argument("--strict", action="store_true", help="treat warnings as errors")
    args = ap.parse_args()
    errors, warnings = check(args.scenes, args.facts, args.also)
    for w in warnings:
        print(f"WARN  {w}")
    for e in errors:
        print(f"ERROR {e}")
    if errors or (args.strict and warnings):
        print(f"FAILED: {len(errors)} error(s), {len(warnings)} warning(s)")
        return 1
    print(f"OK: every number is sourced ({len(warnings)} warning(s))")
    return 0


if __name__ == "__main__":
    sys.exit(main())
