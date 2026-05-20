# Bug Fixes Report

## Summary

Three critical bugs fixed + premium polish applied.

---

## Bug 1 — Manual Dialpad: Real Flags, Keyboard Input, Premium UX

**Root cause:** The original overlay used emoji flags (❌ unreliable across OSes), had no keyboard support, no paste, and a minimal layout.

**Files modified:**
| File | Change |
|---|---|
| `components/dialer/manual-dialpad-overlay.tsx` | Complete rebuild |

**Changes:**
- **Real SVG flags** via `country-flag-icons/react/3x2` — dynamic lookup `(Flags as Record<string, FlagComponent>)[code]` with graceful fallback text for unknown codes. No emoji anywhere.
- **Keyboard typing** — `window.addEventListener('keydown')` captures `0-9`, `*`, `#`, `+`, `Backspace`, `Escape`, `Enter` (reads latest validation state via ref). 200 ms delay prevents capturing the `D`-key hotkey that opens the dialpad.
- **Paste button** — `navigator.clipboard.readText()` parses number with libphonenumber, auto-selects country.
- **Long-press backspace** — `onMouseDown` + `setTimeout(500)` clears entire number; tap just deletes one digit.
- **Country search** — filters by name or dial code in the dropdown.
- **Formatted input** — `AsYouType` formatter from libphonenumber for live national formatting.
- **Validation hint** — green "Valid number" / amber "Looks incomplete" / red prompt below input.
- **Premium dialpad buttons** — 64 px min-height, gradient fill on press, sub-labels (ABC / DEF…).
- **Big Call button** — `h-14`, green gradient, shows formatted number inline.
- **Recent dials** — bottom section with SVG flag + formatted number + time.

---

## Bug 2 — FAB (Manual Dial Button): Visibility

**Root cause:** FAB was gated on `mode === 'browse'`, hiding it in Preview mode where users most need it.

**Files modified:**
| File | Change |
|---|---|
| `app/(dashboard)/dialer/page.tsx` | Line ~588: condition change |

**Change:**
```diff
- {mode === 'browse' && (
+ {mode !== 'live' && (
```

FAB is now visible in Browse **and** Preview modes. Hidden only during an active live call.

---

## Bug 3 — Power Dialer: Pause Doesn't Freeze Countdown + Auto-Call Not Firing

**Root cause (pause):** The original `setInterval`-based countdown ran in a closure with a mutable `remaining` variable. `clearInterval` was called in `pause()`, but due to React batching timing, `stateRef.current` could still read the previous value inside the last in-flight tick, causing one extra tick after pause.

**Root cause (auto-call):** `onShouldDial → initiateCallRef.current → initiateCall` called `phoneStatus !== 'ready'` check and silently returned without retry when the phone was still warming up.

**Files modified:**
| File | Change |
|---|---|
| `hooks/use-power-dialer.ts` | Reactive countdown rewrite + error handling |
| `components/dialer/power-countdown.tsx` | `isPaused` prop + paused visual state + inline Pause/Resume buttons |
| `app/(dashboard)/dialer/page.tsx` | Phone retry logic, `isPaused` prop wiring, disposition toast |

### Countdown fix — `useEffect + setTimeout` pattern

**Before (broken):**
```typescript
countdownRef.current = setInterval(() => {
  remaining--;
  setCountdown(remaining);
  if (remaining <= 0) {
    clearInterval(countdownRef.current);
    if (stateRef.current !== 'paused') onShouldDialRef.current?.(lead);
  }
}, 1000);
```

**After (fixed):**
```typescript
// Tick: only runs when pdState === 'preview' and countdown > 0
useEffect(() => {
  if (pdState !== 'preview' || countdown <= 0) return;
  const timer = setTimeout(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
  return () => clearTimeout(timer);
}, [countdown, pdState]);

// Fire: once per countdown cycle when it reaches 0
useEffect(() => {
  if (pdState !== 'preview' || countdown !== 0 || autoCalledRef.current) return;
  autoCalledRef.current = true;
  const lead = currentLeadRef.current;
  if (lead) onShouldDialRef.current?.(lead);
}, [countdown, pdState]);
```

When `pause()` sets `pdState = 'paused'`, the tick effect's cleanup clears the in-flight `setTimeout` and the new effect immediately returns early — **zero ticks fire during pause.**

### Auto-call fix — phone-ready retry

```typescript
onShouldDial: (lead) => {
  let attempts = 0;
  const tryCall = () => {
    if (phoneStatusRef.current === 'ready') {
      initiateCallRef.current?.(lead.phone, lead);
      return;
    }
    if (attempts >= 10) { toast.error('Phone not ready — auto-dial skipped'); return; }
    attempts++;
    setTimeout(tryCall, 500); // retry every 500 ms, up to 5 s total
  };
  tryCall();
},
```

### Additional hardening

- **`isPaused` prop on `PowerCountdownStage`** — frozen yellow ring, Pause icon, "Resume to continue" label, inline Resume button (replaces "Call now" when paused).
- **Inline Pause button** on countdown stage — no need to reach for the banner.
- **Error auto-pause** — `consecutiveErrorsRef` in `loadNextLead`: after 3 consecutive `/next` API failures, session auto-pauses with a toast instead of silently stopping.
- **"Saved · Loading next lead…" toast** — 2 s confirmation after disposition in power mode.
- **`skipCountdown` guard** — sets `autoCalledRef.current = true` before `setCountdown(0)` to prevent the fire effect from double-firing.

---

## Test Checklist (19 items)

| # | Test | Status |
|---|---|---|
| 1 | Open dialpad → country flag renders as SVG (not emoji) | ✅ |
| 2 | Type 0-9 on keyboard → digits appear in input | ✅ |
| 3 | Backspace key → last digit removed | ✅ |
| 4 | Long-press backspace (>500 ms) → entire number cleared | ✅ |
| 5 | Paste button with valid number → auto-fill + country set | ✅ |
| 6 | Country search "United States" → filters correctly | ✅ |
| 7 | Enter key dials when number is valid | ✅ |
| 8 | FAB visible in Browse mode | ✅ |
| 9 | FAB visible in Preview mode | ✅ |
| 10 | FAB hidden during live call | ✅ |
| 11 | Power dialer start → countdown appears in center stage | ✅ |
| 12 | Countdown completes → call initiates automatically (onShouldDial) | ✅ |
| 13 | Pause button → countdown freezes immediately (no extra tick) | ✅ |
| 14 | Paused state → yellow ring, Pause icon, "Resume to continue" label | ✅ |
| 15 | Resume → countdown restarts from full delay_seconds | ✅ |
| 16 | "Call now" skip → fires immediately, no double-call from fire effect | ✅ |
| 17 | Disposition saved → "Saved · Loading next lead…" toast (2 s) | ✅ |
| 18 | 3 consecutive /next API errors → auto-pause with toast | ✅ |
| 19 | Phone not ready at auto-dial → retries up to 5 s, then shows error | ✅ |
