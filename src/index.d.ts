// src/index.d.ts

declare module 'whouser' {
  export interface FingerprintOptions {
    accuracy?: 'fast' | 'balanced' | 'high';
    threshold?: number;
    weights?: {
      hardware?: number;
      software?: number;
      visual?: number;
    };
  }

  export interface RawSignals {
    hardware: Record<string, any>;
    software: Record<string, any>;
    visual: Record<string, any>;
  }

  export interface FingerprintResult {
    hash1: string;
    hash2: string;
    hash3: string;
    fullHash: string;
    raw: RawSignals;
    timestamp: number;
  }

  export interface ComparisonResult {
    score: number;
    match: boolean;
    details: {
      hardwareSimilarity: number;
      softwareSimilarity: number;
      visualSimilarity: number;
      threshold: number;
      weights: {
        hardware: number;
        software: number;
        visual: number;
      };
      method: 'fuzzy-weighted' | 'fallback-exact-hash';
    };
  }

  export class Fingerprint {
    constructor(options?: FingerprintOptions);
    generate(): Promise<FingerprintResult>;
    compare(fp1: FingerprintResult, fp2: FingerprintResult, options?: Partial<FingerprintOptions>): ComparisonResult;
    setAccuracy(level: 'fast' | 'balanced' | 'high'): this;
    accuracy: string;
    threshold: number;
    weights: { hardware: number; software: number; visual: number };
  }

  export default class Whouser {
    constructor(options?: FingerprintOptions);
    getFingerprint(): Promise<FingerprintResult>;
    compare(fp1: FingerprintResult, fp2: FingerprintResult, options?: Partial<FingerprintOptions>): ComparisonResult;
    setAccuracy(level: 'fast' | 'balanced' | 'high'): this;
    getConfig(): {
      accuracy: string;
      threshold: number;
      weights: { hardware: number; software: number; visual: number };
    };
  }
}
