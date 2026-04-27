# PR Thread Triage Playbook for `@codex` Mentions

Use this playbook when `@codex` is tagged in a PR comment and the request is noisy,
ambiguous, attachment-only, or mixes narrative language with engineering asks.

## Decision order

1. **Extract explicit asks first**
   - Pull out imperative requests ("add", "fix", "bind", "verify", "update").
   - Ignore roleplay and style language unless it changes requirements.
2. **Check repository scope**
   - Confirm the requested files or runtime exist in this repository.
   - If the ask targets a missing surface (e.g., Expo app not present), classify as
     blocked-by-context and request the missing path or code.
3. **Classify the comment**
   - `ACTIONABLE`: clear task + in-repo target.
   - `PARTIAL`: clear task, but missing concrete inputs (hash, file path, schema).
   - `NON_ACTIONABLE`: attachment/image/narrative only, no explicit engineering ask.
4. **Reply with a deterministic template**
   - Always use `Observed / Status / Next input needed`.
5. **Escalate on concrete updates**
   - If a follow-up comment provides exact files/specs, convert to `ACTIONABLE` and
     execute immediately.

## Special handling: deep link + verification binding requests

When a comment requests Expo/mobile binding plus deterministic verification (for
example, converting `exp://` sharing and attaching a canonical hash):

1. Confirm whether an Expo project exists in-repo.
2. If present, implement all of the following together:
   - HTTPS share link metadata (for browser-safe sharing)
   - artifact hash constant binding
   - on-load hash verification result (`MATCH` / `MISMATCH`)
   - deterministic runtime params (frequency, waveform, fades)
3. If Expo project is absent, do not fabricate changes in unrelated files. Reply
   with exact missing inputs needed to proceed.

## Reusable response format

### Observed
- What was explicitly requested.
- What repository surfaces were available.

### Status
- `ACTIONABLE`, `PARTIAL`, or `NON_ACTIONABLE`.
- One sentence why.

### Next input needed
- 1–3 concrete inputs needed to execute (file path, payload hash, schema, etc.).

## Example response (PARTIAL)

### Observed
- You asked to replace an `exp://` deep link with an HTTPS share link and bind the
  mobile surface to a canonical artifact hash.
- This repository currently exposes web and verification surfaces, but no Expo app
  source directory was found.

### Status
- `PARTIAL` — request is concrete, but the target mobile project is not present in
  the checked-out code.

### Next input needed
1. Path or branch containing the Expo app (`app.json`/`app.config.*`).
2. Canonical artifact hash to bind (`sha256:...`).
3. Target screen/component where verification status should render.
