```markdown
# Whouser

**Advanced Browser Fingerprinting with 3-Part Weighted Hashing & Fuzzy Matching**

[![npm version](https://badge.fury.io/js/whouser.svg)](https://www.npmjs.com/package/whouser)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Whouser is a modern, modular browser fingerprinting library that generates unique device identifiers using a **3-part weighted hashing** system (Hardware / Software / Visual) with **fuzzy matching** capabilities. Unlike traditional fingerprinting libraries, Whouser can identify returning users even when their browser environment changes partially.

---

## Features

- **3-Part Fingerprint** – Separates hardware, software, and visual signals for better stability
- **Weighted Hashing** – Each part contributes to the final identifier with configurable weights
- **Fuzzy Matching** – Compares two fingerprints using Jaccard similarity and Levenshtein distance
- **Modular Architecture** – Each signal collector is independent and can be extended
- **Privacy-Aware** – No cookies, localStorage, or IP addresses used
- **Cross-Browser** – Works on Chrome, Firefox, Safari, Edge, and Opera
- **Lightweight** – ~10KB gzipped, zero dependencies
- **TypeScript Ready** – Full type definitions included

---

## Installation

### Via npm
```bash
npm install whouser
```

### Via CDN (UMD)
```html
<script src="https://cdn.jsdelivr.net/npm/whouser/dist/whouser.min.js"></script>
<script>
  const whouser = new Whouser();
  whouser.getFingerprint().then(console.log);
</script>
```

### Via ES Module
```javascript
import Whouser from 'whouser';
// or
import { Whouser } from 'whouser';
```

---

## Basic Usage

```javascript
import Whouser from 'whouser';

// Create instance with default options
const whouser = new Whouser();

// Get fingerprint (async)
const fingerprint = await whouser.getFingerprint();

console.log(fingerprint);
/*
{
  hash1: "a3f5c2d1",  // Hardware part
  hash2: "b8e4f7a2",  // Software part
  hash3: "c1d9e3f5",  // Visual part
  raw: { hardware: {...}, software: {...}, visual: {...} },
  timestamp: 1234567890
}
*/
```

### Comparing Two Fingerprints (Fuzzy Match)

```javascript
const fp1 = await whouser.getFingerprint();
// ... later, in a different session
const fp2 = await whouser.getFingerprint();

const result = whouser.compare(fp1, fp2, {
  weights: [0.4, 0.3, 0.3], // Hardware 40%, Software 30%, Visual 30%
  threshold: 0.7            // Minimum similarity to consider a match
});

console.log(result);
/*
{
  score: 0.85,
  match: true,
  details: {
    parts: {
      hardware: { score: 0.9, weight: 0.4 },
      software: { score: 0.8, weight: 0.3 },
      visual: { score: 0.85, weight: 0.3 }
    },
    totalScore: 0.85
  }
}
*/
```

### Getting Raw Signals (for Custom Processing)

```javascript
const raw = await whouser.getRawSignals();
console.log(raw.hardware.screen); // Screen dimensions, color depth, etc.
console.log(raw.software.fonts);  // Installed fonts list
console.log(raw.visual.canvas);   // Canvas fingerprint hash
```

---

## Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `timeout` | `number` | `3000` | Maximum time (ms) to wait for each signal |
| `includeTiming` | `boolean` | `true` | Include performance timing in fingerprint |

---

## API Reference

### `new Whouser(options)`
Creates a new instance with optional configuration.

### `async getFingerprint()`
Collects all signals and returns a 3-part hash fingerprint.

**Returns:** `Promise<Object>`
- `hash1` – Hardware hash (string)
- `hash2` – Software hash (string)
- `hash3` – Visual hash (string)
- `raw` – Raw signals object
- `timestamp` – Unix timestamp (milliseconds)

### `async getRawSignals()`
Returns raw signals without hashing.

**Returns:** `Promise<Object>` with `hardware`, `software`, `visual` keys.

### `compare(fp1, fp2, options)`
Performs fuzzy matching between two fingerprints.

**Parameters:**
- `fp1` – First fingerprint object (from `getFingerprint()`)
- `fp2` – Second fingerprint object
- `options.weights` – `[hw, sw, vis]` (default: `[0.4, 0.3, 0.3]`)
- `options.threshold` – Minimum score for match (default: `0.7`)

**Returns:** `Object` with `score`, `match` (boolean), and `details`.

### `clearCache()`
Clears the cached fingerprint to force re-collection on next call.

---

## How It Works

### 1. Signal Collection
Whouser collects over 50 signals across three categories:

- **Hardware**: Screen, CPU cores, memory, GPU, battery, storage, touch support, timezone
- **Software**: Fonts, plugins, MIME types, language, vendor, browser features, Do Not Track
- **Visual**: Canvas fingerprint, WebGL, audio fingerprint, screen dimensions, color gamut

### 2. Hashing
Each category is normalized and hashed using a 32-bit MurmurHash3 variant to produce a consistent hex string.

### 3. Fuzzy Matching
When comparing two fingerprints, Whouser uses:
- **Levenshtein distance** for string similarity
- **Jaccard similarity** for set/object comparison
- **Weighted scoring** for each part

This allows detection even when some signals change (e.g., browser update, new font installed).

---

## Privacy & Legal

Whouser generates device identifiers **without using cookies, localStorage, or IP addresses**. However, fingerprinting may still be subject to privacy regulations like GDPR and CCPA.

**Best Practices:**
- Always inform users about fingerprinting
- Provide an opt-out mechanism
- Store user consent if required by law

---

## Performance

Typical fingerprint generation takes **200–800ms** on modern devices. The library uses parallel signal collection (`Promise.all`) and lazy loading to minimize impact.

**Benchmarks (Chrome 120, MacBook Pro M1):**
- Full fingerprint: ~350ms
- Raw signals only: ~250ms
- Fuzzy comparison: < 5ms

---

## Browser Support

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 60+ | ✅ Full |
| Firefox | 55+ | ✅ Full |
| Safari | 12+ | ✅ Full (limited AudioContext) |
| Edge | 79+ | ✅ Full |
| Opera | 47+ | ✅ Full |
| Mobile Safari | 12+ | ⚠️ Limited (WebGL/audio restrictions) |
| Android Chrome | 60+ | ✅ Full |

---

## Limitations

- **Audio Fingerprinting**: May fail in Safari due to restrictions
- **Font Detection**: Only tests a predefined list (~40 fonts)
- **WebGL Performance**: Heavy benchmark is optional and may be disabled
- **Mobile Devices**: Some signals (like battery/storage) may be less stable

---

## Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Testing

```bash
npm test            # Run unit tests with Vitest
npm run lint        # Run ESLint
npm run build       # Build production bundles
```

---

## License

MIT © [Parham PA](https://github.com/parhampa)

---

## Credits

Inspired by FingerprintJS, but rebuilt from scratch with a focus on:
- Modular signal collection
- Weighted hashing for stability
- True fuzzy matching (not just exact equality)

---

## Support

- GitHub Issues: [https://github.com/parhampa/whouser/issues](https://github.com/parhampa/whouser/issues)
- npm: [https://www.npmjs.com/package/whouser](https://www.npmjs.com/package/whouser)
```

---
