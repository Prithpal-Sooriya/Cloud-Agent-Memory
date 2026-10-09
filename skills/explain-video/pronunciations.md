# Pronunciations

The voice uses the spoken form. Labels and captions keep the written form.

Run [pronounce.py](pronounce.py) on every spoken line and give that text to Kokoro. Do not ask the user how to say a token the script already rewrites. Show its table in the approval plan. If they correct a row, update this file. If they leave a row alone, do not add it here.

```bash
python3 pronounce.py "Open SectionHeader when the EVM call for ISS-158 returns"
```

Run the script that sits next to this file.

## What the script says on its own

- **camelCase and PascalCase.** `SectionHeader` → section header. `onAfterChange` → on after change. `titleProps` → title props. A two-letter piece that is not a word is spelled: `HeadingMd` → heading M D, `userId` → user I D. An acronym inside a name is spelled: `XMLHttpRequest` → X M L H T T P request.
- **File names.** Speak the stem, then "dot" before each extension. Short extensions are spelled. `SecurityTab.tsx` → security tab dot T S X. `SecurityTab.test.tsx` → security tab dot test dot T S X.
- **All-caps acronyms.** Two to six letters that are not an ordinary word are spelled. `EVM` → E V M. `API` → A P I. Ordinary words in caps (`THE`, `THIS`) stay words.
- **Ticket ids.** The letters are spelled and the number is left as digits. `ISS-158` → I S S 158.
- **Hex and UUIDs.** A long `0x` value becomes "hex starting with" plus the first four characters spelled. A UUID becomes "the id". Do not read the whole value.
- **Versions and short paths.** `v2` → version two. `/v2/assets` → version two assets.
- **snake_case and kebab-case.** Underscores and hyphens become spaces. `use_EVM_address` → use E V M address.

Person names are not covered. Ask about a person's name in the one question round. Do not ask about camelCase, file names, acronyms, ticket ids, hex, or paths.

## Lexicon

A row here overrides the script. Match is case-insensitive, and the longer row wins. Add a row only when a person corrects the script, or for a name the rules get wrong (a ticker, a brand, a slurred closed compound). Do not add a row the script already speaks.

| Written | Spoken |
| --- | --- |
| PEPE | ˈpɛpeɪ |
| TanStack | tan-stack |
| OHLCV | O-H-L-C-V |
| launchpad | launch-pad |
| memecoin | meme-coin |
| `/v2/assets` | version two assets |
| prefetch | pre-fetch |
| `SecurityTab.tsx` | security tab dot T S X |
| `SecurityTab.test.tsx` | security tab dot test dot T S X |
| `SectionHeader` | section header |
| `SectionHeading` | section heading |
| `HeadingMd` | heading M D |
| `titleProps` | title props |
| EVM | E V M |
