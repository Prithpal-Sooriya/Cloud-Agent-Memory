# Style: concision rules for playbook bullets

Goal: every bullet that lands in `Memory.md` or `MetaMask/*.md` reads
**tight**. Playbook bullets are the compressed lessons learned from a
session — they should feel like field notes, not incident reports.

Inspired by the [caveman](https://github.com/JuliusBrussee/caveman)
Claude Code skill: *why use many token when few token do trick*.
Adapted for a shared reference file — clarity wins over pure
compression, and technical substance is never re-worded.

## When this applies

Read this file at the top of the Apply phase (see [apply.md](apply.md)
§4.4). Every applied bullet — whether an ADD or an UPDATE — is passed
through these rules **before** it is written to the target file.

If a proposal already reads tight, the pass is a no-op. Do not compress
for the sake of compressing.

## Verbatim-preserve list

**Never touch** any of the following. These are what agents grep for;
byte-shifting them silently breaks future search:

- Fenced code blocks (```` ``` ````), inline code (`` ` ``), and any
  identifier inside them.
- Command lines, flags, and env-var names (`nvm install`, `--coverage=false`,
  `COREPACK_ENABLE_DOWNLOAD_PROMPT`).
- File paths, module paths, and URLs.
- Contract addresses, chain IDs, CAIP-19 asset IDs, hex constants.
- Error strings quoted from real output (`"current Node version X does not
  satisfy the required version"`).
- Playbook IDs (`[shr-002]`, `[code-004]`, `[ts-005]`).
- Version numbers, decimals, sizes (`~2.5 min`, `18 decimals`, `Node 22`).
- Ticket references (`ASSETS-3900`).

If a rewrite would shift a single character inside any of these, revert
that specific edit.

## Cuts (safe)

Compress prose only. Concretely:

- **Drop pleasantries and hedging.** No "please", "you should", "it is
  worth noting that", "in general", "typically", "essentially",
  "basically", "just", "really", "simply", "actually".
- **Drop narrator connectives that don't carry meaning.** "which is why",
  "so that", "in the same command chain as", "any of it", "the fact
  that", "note that", "one thing to keep in mind is".
- **Drop redundant articles.** `the / a / an` where the meaning survives
  ("The read-only cloud `gh`" → "Read-only cloud `gh`"). **Keep them**
  when removal changes meaning or reads jarringly.
- **Merge two sentences into one with `;` or ` — `** when the second is a
  direct consequence or clarification of the first.
- **Prefer imperative for instructions.** "Always export X" → "Always
  `export X`" already; but "It is recommended that you run" → "Run".
- **Fragments are fine** for enumerations. "Piping stdout hides the prompt
  — looks like a slow fetch." beats "If you pipe stdout, the prompt is
  hidden, and it will look like a slow fetch."
- **Split buried enumerations into sub-bullets.** If the prose contains
  "(1) …, (2) …, (3) …", promote each clause to an indented sub-bullet.
  This costs a few chars but reads dramatically faster.

## Cuts (unsafe — do NOT)

Caveman doesn't shorten these, and neither do we:

- **Never drop `not / never / no / only / except / must / MUST`.** Any of
  them changes meaning more than any token saved.
- **Never invent abbreviations** (`cfg`, `impl`, `req`, `res`, `fn`,
  `auth`). Standard tech acronyms are fine (`API`, `HTTP`, `DB`, `PR`,
  `CI`, `IIFE`), but do not coin new ones — the tokenizer splits them
  the same as the full word, so you save nothing and cost the reader.
- **Never use decorative arrows** (`→`) as sentence connectors. They are
  their own token, so `A → B` and `A means B` cost the same; use words
  where words are clearer. Arrows are fine inside a bullet as
  enumeration markup (e.g. `Jira REST → 403`) where they replace ` →
  returns ` and read as data flow — that is a substantive shorthand,
  not filler.
- **Never ADD a word to sound terse.** "when not" is one token shorter
  than "when it is not" — good. But do not fake broken grammar with
  extra pronouns or copulas that don't shorten. Compression that reads
  worse and isn't shorter is pure loss.
- **Never re-word an error message or command.** Even a capital-letter
  change breaks a future grep.

## Rewrite pattern

Standard shape for a bullet:

```
- **[<id>] <short-title>**: <one-sentence lede naming the failure or
  invariant>. <one or two sentences of mechanism, verbatim on the
  code / paths / errors>. <one-sentence action or reference>.
  _Reference:_ <path when applicable>.
```

When the bullet has more than three logical clauses, split them into
sub-bullets under the same top-level bullet (indent 4 spaces to match
existing style — see the file's convention before committing).

## Worked examples

Before (from #92, verbose):

```
- **[ts-006] Use `gh api search/issues`, not `gh issue list --search`, on
  cloud VMs**: The read-only `gh` token in Cursor cloud agents makes
  `gh issue list --repo <owner>/<repo> --search "..." --json
  number,title,url` exit 0 while returning placeholder rows
  (`[{"number":0,"title":"","url":""}]`), which looks like blank results
  rather than a failure. …
```

After (compressed):

```
- **[ts-006] Use `gh api search/issues`, not `gh issue list --search`, on
  cloud VMs**: Read-only cloud `gh` makes `gh issue list --search "..."
  --json number,title,url` exit 0 with placeholder rows
  (`[{"number":0,"title":"","url":""}]`) — silent, not a failure. …
```

Kept verbatim: `gh issue list --search`, all JSON, `gh api …`, the flag
list, and the ID `[ts-006]`. Cut: `The read-only …`, `in Cursor cloud
agents`, `while returning`, `which looks like … rather than`.

## Verification (during Apply)

For each bullet after compression, run this checklist mentally:

1. **Substance preserved?** Every command, path, address, error string,
   URL, ID and code fence from the proposal appears in the output.
2. **Negations preserved?** Every `not / never / no / only / must` in
   the proposal is present in the output.
3. **Sub-bullet promotion?** If the proposal had "(1) … (2) … (3) …",
   the output has an indented sub-bullet per clause.
4. **Length trend right?** Compressed length is `<=` proposal length.
   (Equality is fine — some proposals arrive tight already.)

If (1) or (2) fail, revert the last edit and try again. If (4) fails,
you added a word — undo it. If (3) fails on a genuinely enumerated
proposal, split before commit.

## Non-goals

- **This is not caveman-full.** Playbook bullets are read by humans and
  by agents *reasoning*, not by agents parsing. Fragments and dropped
  articles are welcome; broken grammar is not.
- **This is not a summariser.** Do not drop a clause because it "feels
  extra". Every clause in the proposal encodes a lesson from the
  session that produced it. Cut *only* what the reader can restore for
  themselves ("in general", "note that"), never *what* the reader would
  need to know.
