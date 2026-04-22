import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const SETTINGS_FILE = join(process.cwd(), "data", "settings.json");

export type PlatformSettings = {
  LEMONSQUEEZY_API_KEY: string;
  LEMONSQUEEZY_STORE_ID: string;
  LEMONSQUEEZY_VARIANT_ID: string;
  LEMONSQUEEZY_WEBHOOK_SECRET: string;
  NOWPAYMENTS_WALLET_TRC20: string;
};

let _settings: PlatformSettings = {
  LEMONSQUEEZY_API_KEY: "",
  LEMONSQUEEZY_STORE_ID: "",
  LEMONSQUEEZY_VARIANT_ID: "",
  LEMONSQUEEZY_WEBHOOK_SECRET: "",
  NOWPAYMENTS_WALLET_TRC20: "",
};

export function loadSettings(): PlatformSettings {
  _settings = {
    LEMONSQUEEZY_API_KEY: process.env.LEMONSQUEEZY_API_KEY || "",
    LEMONSQUEEZY_STORE_ID: process.env.LEMONSQUEEZY_STORE_ID || "",
    LEMONSQUEEZY_VARIANT_ID: process.env.LEMONSQUEEZY_VARIANT_ID || "",
    LEMONSQUEEZY_WEBHOOK_SECRET: process.env.LEMONSQUEEZY_WEBHOOK_SECRET || "",
    NOWPAYMENTS_WALLET_TRC20: process.env.NOWPAYMENTS_WALLET_TRC20 || process.env.NOWPAYMENTS_WALLET || "",
  };

  if (existsSync(SETTINGS_FILE)) {
    try {
      const fromFile = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
      for (const key of Object.keys(fromFile) as (keyof PlatformSettings)[]) {
        if (fromFile[key]) _settings[key] = fromFile[key];
      }
    } catch { /* ignore */ }
  }

  return _settings;
}

export function getSettings(): PlatformSettings {
  return _settings;
}

export function updateSettings(updates: Partial<PlatformSettings>): PlatformSettings {
  for (const key of Object.keys(updates) as (keyof PlatformSettings)[]) {
    if (updates[key] !== undefined) _settings[key] = updates[key]!;
  }
  try {
    mkdirSync(dirname(SETTINGS_FILE), { recursive: true });
    writeFileSync(SETTINGS_FILE, JSON.stringify(_settings, null, 2));
  } catch (e) {
    console.error("Failed to persist settings:", e);
  }
  return _settings;
}
