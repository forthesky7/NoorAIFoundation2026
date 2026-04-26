import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, dirname } from "path";

const SETTINGS_FILE = join(process.cwd(), "data", "settings.json");

export type PlatformSettings = {
  LEMONSQUEEZY_API_KEY: string;
  LEMONSQUEEZY_STORE_ID: string;
  LEMONSQUEEZY_VARIANT_ID: string;
  LEMONSQUEEZY_WEBHOOK_SECRET: string;
  NOWPAYMENTS_WALLET_TRC20: string;
  NOWPAYMENTS_WALLET_POLYGON: string;
  TELEGRAM_LINK: string;
};

// Hard-coded production credentials — always present regardless of admin panel state
const HARDCODED_DEFAULTS: PlatformSettings = {
  LEMONSQUEEZY_API_KEY: "",
  LEMONSQUEEZY_STORE_ID: "",
  LEMONSQUEEZY_VARIANT_ID: "",
  LEMONSQUEEZY_WEBHOOK_SECRET: "",
  NOWPAYMENTS_WALLET_TRC20: "TAWSkYiiQXbQiYJ3FfCZU7ruyF1y3qvnQP",
  NOWPAYMENTS_WALLET_POLYGON: "0x4ebf5d641dce303fb1d94d399bc5c6935b92b182",
  TELEGRAM_LINK: "https://t.me/NoorAi_Education",
};

let _settings: PlatformSettings = { ...HARDCODED_DEFAULTS };

export function loadSettings(): PlatformSettings {
  // Start from hardcoded defaults, then overlay env vars, then overlay saved file
  _settings = { ...HARDCODED_DEFAULTS };

  // Env vars can override (except wallets — hardcoded addresses are canonical)
  if (process.env.LEMONSQUEEZY_API_KEY) _settings.LEMONSQUEEZY_API_KEY = process.env.LEMONSQUEEZY_API_KEY;
  if (process.env.LEMONSQUEEZY_STORE_ID) _settings.LEMONSQUEEZY_STORE_ID = process.env.LEMONSQUEEZY_STORE_ID;
  if (process.env.LEMONSQUEEZY_VARIANT_ID) _settings.LEMONSQUEEZY_VARIANT_ID = process.env.LEMONSQUEEZY_VARIANT_ID;
  if (process.env.LEMONSQUEEZY_WEBHOOK_SECRET) _settings.LEMONSQUEEZY_WEBHOOK_SECRET = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;

  if (existsSync(SETTINGS_FILE)) {
    try {
      const fromFile = JSON.parse(readFileSync(SETTINGS_FILE, "utf-8"));
      // Only overlay Lemon Squeezy keys from file — wallet addresses are hardcoded
      for (const key of ["LEMONSQUEEZY_API_KEY", "LEMONSQUEEZY_STORE_ID", "LEMONSQUEEZY_VARIANT_ID", "LEMONSQUEEZY_WEBHOOK_SECRET"] as (keyof PlatformSettings)[]) {
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
