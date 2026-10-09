#!/usr/bin/env python3
"""Rewrite code-like tokens into a form Kokoro can say.

Stdlib only. The lexicon in pronunciations.md wins over these rules.
Rules cover camelCase, file names, all-caps acronyms, ticket ids, hex,
UUIDs, versions, and paths. Ordinary English is left alone.

Usage:
  python3 pronounce.py "Open SectionHeader when the EVM call for ISS-158 returns"
  python3 pronounce.py --self-test
"""

from __future__ import annotations

import re
import sys
from pathlib import Path

LEXICON_PATH = Path(__file__).with_name("pronunciations.md")

# All-caps tokens that are ordinary words. Do not spell them.
COMMON_WORDS = {
    "a", "about", "after", "again", "all", "also", "am", "an", "and", "are",
    "as", "at", "back", "be", "because", "been", "before", "both", "but",
    "by", "call", "can", "code", "could", "data", "day", "did", "do", "does",
    "done", "each", "even", "file", "fine", "first", "for", "from", "get",
    "give", "go", "good", "had", "has", "have", "he", "her", "here", "him",
    "his", "how", "if", "in", "into", "is", "it", "its", "just", "keep",
    "know", "like", "line", "long", "look", "made", "make", "many", "me",
    "more", "most", "much", "my", "name", "new", "next", "no", "not", "note",
    "now", "of", "ok", "old", "on", "once", "only", "open", "or", "other",
    "our", "out", "over", "path", "put", "read", "same", "say", "see", "she",
    "should", "show", "so", "some", "stop", "such", "take", "test", "text",
    "than", "that", "the", "their", "them", "then", "there", "these", "they",
    "this", "time", "to", "too", "true", "two", "type", "up", "us", "use",
    "used", "very", "view", "was", "way", "we", "well", "were", "what",
    "when", "where", "which", "who", "will", "with", "work", "would", "year",
    "you", "your",
}

FUNCTION_WORDS = {
    "a", "an", "as", "at", "be", "by", "do", "go", "if", "in", "is", "it",
    "me", "my", "no", "of", "on", "or", "so", "to", "up", "we",
}

# Title-case pieces that are still acronyms: XMLHttpRequest -> X M L H T T P request.
ACRONYMS = {
    "abi", "api", "ascii", "cdn", "cli", "cpu", "css", "db", "dns", "evm",
    "gif", "gpu", "gui", "html", "http", "https", "id", "ipfs", "json",
    "jwt", "nft", "ohlcv", "os", "png", "pr", "rpc", "sdk", "sql", "ssh",
    "svg", "tcp", "tls", "ts", "tsx", "ui", "uri", "url", "utf", "ux",
    "vm", "xml", "yaml", "yml",
}

WORD_EXTS = {
    "config", "dev", "gif", "jpeg", "local", "min", "module", "prod",
    "spec", "stories", "story", "test", "yaml",
}
SPOKEN_EXT = {
    "jpeg": "jay peg",
    "jpg": "jay peg",
}
FILE_EXTS = (
    "cjs|cpp|css|csv|gif|go|h|hpp|htm|html|java|jpeg|jpg|js|json|jsx|kt|"
    "lock|md|mjs|mov|mp4|pdf|png|py|rb|rs|sh|sol|svg|swift|toml|ts|tsx|"
    "txt|vue|wasm|wav|webm|yaml|yml"
)

ONES = (
    "zero one two three four five six seven eight nine ten eleven twelve "
    "thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty"
).split()

TOKEN_RE = re.compile(
    rf"""
    [0-9a-fA-F]{{8}}-[0-9a-fA-F]{{4}}-[0-9a-fA-F]{{4}}-[0-9a-fA-F]{{4}}-[0-9a-fA-F]{{12}}
    | 0x[0-9a-fA-F]{{4,}}
    | \b[A-Za-z][\w-]*(?:\.[A-Za-z][\w-]*)*\.(?:{FILE_EXTS})\b
    | \b[A-Z][A-Z0-9]{{1,9}}-\d+\b
    | (?:/[A-Za-z0-9][\w.-]*){{2,}}
    | /v\d+(?:\.\d+)*(?:/[A-Za-z0-9][\w.-]*)*
    | \b[A-Za-z][A-Za-z0-9]*(?:_[A-Za-z0-9]+)+\b
    | \b[a-z][a-z0-9]*(?:-[a-z0-9]+)+\b
    | \bv\d+(?:\.\d+)*\b
    | \b[A-Z]{{2,6}}\d+\b
    | \b[A-Z]\d+\b
    | \b[A-Za-z]*[a-z][A-Z][A-Za-z0-9]*\b
    | \b[A-Z][a-z0-9]*[A-Z][A-Za-z0-9]*\b
    | \b[A-Z]{{2,6}}\b
    """,
    re.VERBOSE,
)

PLACEHOLDER_RE = re.compile(r"\u0000(\d+)\u0000")


def num_word(value: int) -> str:
    if 0 <= value < len(ONES):
        return ONES[value]
    return str(value)


def load_lexicon(path: Path = LEXICON_PATH) -> list[tuple[str, str]]:
    rows: list[tuple[str, str]] = []
    if not path.exists():
        return rows
    for line in path.read_text(encoding="utf-8").splitlines():
        if not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 2:
            continue
        written, spoken = cells[0], cells[1]
        if not written or written.lower() == "written" or set(written) <= {"-", ":"}:
            continue
        written = written.strip("`").strip()
        if written and spoken and written != spoken:
            rows.append((written, spoken))
    rows.sort(key=lambda pair: len(pair[0]), reverse=True)
    return rows


def speak_piece(piece: str) -> str:
    lower = piece.lower()
    if lower in FUNCTION_WORDS and not piece.isupper():
        return lower
    if lower in ACRONYMS:
        return " ".join(lower.upper())
    if len(piece) == 2 and lower not in FUNCTION_WORDS and lower not in COMMON_WORDS:
        return " ".join(piece.upper())
    if piece.isupper() and 2 <= len(piece) <= 6 and lower not in COMMON_WORDS:
        return " ".join(piece)
    return lower


def speak_ident(name: str) -> str:
    if re.fullmatch(r"IPv[46]", name):
        return "I P version " + ("four" if name.endswith("4") else "six")
    name = name.replace("_", " ").replace("-", " ")
    parts: list[str] = []
    for chunk in name.split():
        chunk = re.sub(r"(?<=[a-z0-9])(?=[A-Z])", " ", chunk)
        chunk = re.sub(r"(?<=[A-Z])(?=[A-Z][a-z])", " ", chunk)
        chunk = re.sub(r"(?<=[A-Za-z])(?=\d)", " ", chunk)
        chunk = re.sub(r"(?<=\d)(?=[A-Za-z])", " ", chunk)
        parts.extend(chunk.split())
    return " ".join(speak_piece(part) for part in parts if part)


def speak_ext(ext: str) -> str:
    lower = ext.lower()
    if lower in SPOKEN_EXT:
        return SPOKEN_EXT[lower]
    if lower in WORD_EXTS or len(lower) > 4:
        return speak_ident(ext) if re.search(r"[A-Z]", ext[1:]) else lower
    return " ".join(lower.upper())


def speak_filename(token: str) -> str:
    pieces = token.split(".")
    spoken = [speak_ident(pieces[0])]
    spoken.extend(speak_ext(piece) for piece in pieces[1:])
    return " dot ".join(spoken)


def speak_version(token: str) -> str:
    numbers = [num_word(int(part)) for part in token[1:].split(".")]
    if len(numbers) == 1:
        return f"version {numbers[0]}"
    return "version " + " point ".join(numbers)


def speak_path(token: str) -> str:
    parts = [part for part in token.split("/") if part]
    spoken: list[str] = []
    for part in parts:
        if re.fullmatch(r"v\d+(?:\.\d+)*", part):
            spoken.append(speak_version(part))
        else:
            spoken.append(speak_ident(part))
    return " ".join(spoken)


def speak_hex(token: str) -> str:
    body = token[2:]
    if len(body) <= 6:
        return "0 x " + " ".join(body.upper())
    return "hex starting with " + " ".join(body[:4].upper())


def speak_ticket(token: str) -> str:
    key, number = token.split("-", 1)
    return " ".join(key) + " " + number


def speak_acronym_number(token: str) -> str:
    match = re.fullmatch(r"([A-Z]+)(\d+)", token)
    if not match:
        return token
    letters, number = match.group(1), match.group(2)
    if len(letters) == 1:
        return f"{letters} {number}"
    return " ".join(letters) + " " + number


def classify(token: str) -> tuple[str, str] | None:
    if re.fullmatch(
        r"[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}",
        token,
    ):
        return "the id", "uuid"
    if token.startswith("0x") and re.fullmatch(r"0x[0-9a-fA-F]{4,}", token):
        return speak_hex(token), "hex"
    if re.search(rf"\.(?:{FILE_EXTS})$", token, re.IGNORECASE) and "." in token:
        return speak_filename(token), "filename"
    if re.fullmatch(r"[A-Z][A-Z0-9]{1,9}-\d+", token):
        return speak_ticket(token), "ticket id"
    if token.startswith("/"):
        return speak_path(token), "path"
    if "_" in token:
        return speak_ident(token), "snake_case"
    if re.fullmatch(r"[a-z][a-z0-9]*(?:-[a-z0-9]+)+", token):
        return speak_ident(token), "kebab-case"
    if re.fullmatch(r"v\d+(?:\.\d+)*", token):
        return speak_version(token), "version"
    if re.fullmatch(r"[A-Z]{1,6}\d+", token):
        spoken = speak_acronym_number(token)
        if spoken == token:
            return None
        return spoken, "initialism"
    if token.isupper() and 2 <= len(token) <= 6:
        if token.lower() in COMMON_WORDS:
            return None
        return " ".join(token), "initialism"
    if re.search(r"[a-z][A-Z]|[A-Z][a-z0-9]*[A-Z]", token):
        spoken = speak_ident(token)
        if spoken == token:
            return None
        return spoken, "camelCase"
    return None


def apply_lexicon(
    text: str, lexicon: list[tuple[str, str]]
) -> tuple[str, list[tuple[str, str, str]], list[str]]:
    occupied = [False] * len(text)
    spans: list[tuple[int, int, str]] = []
    rows: list[tuple[str, str, str]] = []
    lower = text.lower()
    for written, spoken in lexicon:
        needle = written.lower()
        start = 0
        while True:
            index = lower.find(needle, start)
            if index < 0:
                break
            end = index + len(written)
            left_ok = index == 0 or not (text[index - 1].isalnum() or text[index - 1] == "_")
            right_ok = end == len(text) or not (text[end].isalnum() or text[end] == "_")
            if written[:1].isalnum() and not left_ok:
                start = index + 1
                continue
            if written[-1:].isalnum() and not right_ok:
                start = index + 1
                continue
            if any(occupied[index:end]):
                start = index + 1
                continue
            for cursor in range(index, end):
                occupied[cursor] = True
            spans.append((index, end, spoken))
            rows.append((text[index:end], spoken, "lexicon"))
            start = end
    spans.sort()
    pieces: list[str] = []
    placeholders: list[str] = []
    cursor = 0
    for index, end, spoken in spans:
        pieces.append(text[cursor:index])
        pieces.append(f"\u0000{len(placeholders)}\u0000")
        placeholders.append(spoken)
        cursor = end
    pieces.append(text[cursor:])
    return "".join(pieces), rows, placeholders


def rewrite(
    text: str, lexicon: list[tuple[str, str]] | None = None
) -> tuple[str, list[tuple[str, str, str]]]:
    if lexicon is None:
        lexicon = load_lexicon()
    masked, rows, placeholders = apply_lexicon(text, lexicon)
    parts: list[str] = []
    cursor = 0
    for match in TOKEN_RE.finditer(masked):
        if PLACEHOLDER_RE.fullmatch(match.group(0)):
            continue
        if "\u0000" in match.group(0):
            continue
        spoken = classify(match.group(0))
        if spoken is None:
            continue
        said, how = spoken
        if said == match.group(0):
            continue
        parts.append(masked[cursor:match.start()])
        parts.append(said)
        rows.append((match.group(0), said, how))
        cursor = match.end()
    parts.append(masked[cursor:])
    rewritten = "".join(parts)
    rewritten = PLACEHOLDER_RE.sub(lambda match: placeholders[int(match.group(1))], rewritten)

    def position(row: tuple[str, str, str]) -> int:
        found = text.lower().find(row[0].lower())
        return found if found >= 0 else len(text)

    rows.sort(key=position)
    return rewritten, rows


def format_report(rewritten: str, rows: list[tuple[str, str, str]]) -> str:
    lines = [rewritten]
    if not rows:
        return rewritten
    lines.extend(["", "| Written | Spoken | How |", "| --- | --- | --- |"])
    seen: set[str] = set()
    for written, spoken, how in rows:
        if written in seen:
            continue
        seen.add(written)
        lines.append(f"| {written} | {spoken} | {how} |")
    return "\n".join(lines)


def self_test() -> None:
    lexicon = [
        ("PEPE", "ˈpɛpeɪ"),
        ("TanStack", "tan-stack"),
        ("OHLCV", "O-H-L-C-V"),
        ("launchpad", "launch-pad"),
        ("memecoin", "meme-coin"),
        ("/v2/assets", "version two assets"),
        ("prefetch", "pre-fetch"),
        ("SecurityTab.tsx", "security tab dot T S X"),
        ("SecurityTab.test.tsx", "security tab dot test dot T S X"),
        ("SectionHeader", "section header"),
        ("SectionHeading", "section heading"),
        ("HeadingMd", "heading M D"),
        ("titleProps", "title props"),
        ("EVM", "E V M"),
    ]
    cases = {
        "SecurityTab.tsx": "security tab dot T S X",
        "SecurityTab.test.tsx": "security tab dot test dot T S X",
        "SectionHeader": "section header",
        "SectionHeading": "section heading",
        "HeadingMd": "heading M D",
        "titleProps": "title props",
        "EVM": "E V M",
        "OHLCV": "O-H-L-C-V",
        "PEPE": "ˈpɛpeɪ",
        "TanStack": "tan-stack",
        "launchpad": "launch-pad",
        "prefetch": "pre-fetch",
        "camelCase": "camel case",
        "onAfterChange": "on after change",
        "ISS-158": "I S S 158",
        "/v2/assets": "version two assets",
        "v2": "version two",
        "XMLHttpRequest": "X M L H T T P request",
        "userId": "user I D",
        "HTTPSConnection": "H T T P S connection",
        "use_EVM_address": "use E V M address",
        "0xabc123def4567890": "hex starting with A B C 1",
        "123e4567-e89b-12d3-a456-426614174000": "the id",
        "STE100": "S T E 100",
        "The quick brown fox.": "The quick brown fox.",
    }
    failed = False
    for written, expected in cases.items():
        got, _rows = rewrite(written, lexicon)
        if got != expected:
            failed = True
            print(f"FAIL {written!r}\n  got {got!r}\n  exp {expected!r}")
    sentence = (
        "Open SectionHeader in SecurityTab.tsx when the EVM call for ISS-158 hits /v2/assets on TanStack."
    )
    expected_sentence = (
        "Open section header in security tab dot T S X when the E V M call for "
        "I S S 158 hits version two assets on tan-stack."
    )
    got, _rows = rewrite(sentence, lexicon)
    if got != expected_sentence:
        failed = True
        print(f"FAIL sentence\n  got {got!r}\n  exp {expected_sentence!r}")
    if failed:
        raise SystemExit(1)
    print("self-test ok")


def main(argv: list[str]) -> int:
    if "--self-test" in argv:
        self_test()
        return 0
    args = [arg for arg in argv if arg != "--"]
    if not args:
        text = sys.stdin.read()
        lines = text.splitlines() or [text]
    else:
        lines = args
    for line in lines:
        print(format_report(*rewrite(line)))
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
