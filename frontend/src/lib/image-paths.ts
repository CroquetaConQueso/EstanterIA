type ImportMetaWithEnv = ImportMeta & {
  env?: {
    VITE_API_BASE_URL?: string;
  };
};

const DEFAULT_API_BASE_URL = "http://localhost:8080";
const CAPTURES_PREFIX = "/captures/";
const PRODUCTS_PREFIX = "/products/";

export function getApiBaseUrl(): string {
  const configured = (import.meta as ImportMetaWithEnv).env?.VITE_API_BASE_URL?.trim();
  return (configured || DEFAULT_API_BASE_URL).replace(/\/+$/, "");
}

function buildBackendUrl(path: string): string {
  return `${getApiBaseUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}

export function normalizeImageUrl(path: string | null | undefined): string | null {
  if (!path) return null;

  let normalized = path.trim();
  if (!normalized) return null;

  if (/^https?:\/\//i.test(normalized)) {
    return normalized;
  }

  normalized = normalized.replace(/\\/g, "/");

  while (normalized.startsWith("./")) {
    normalized = normalized.slice(2);
  }

  if (normalized.startsWith("captures/")) {
    normalized = `/${normalized}`;
  }

  if (normalized.startsWith("products/")) {
    normalized = `${PRODUCTS_PREFIX}${normalized.slice("products/".length)}`;
  }

  if (!normalized.startsWith("/")) {
    normalized = `${CAPTURES_PREFIX}${normalized.replace(/^\/+/, "")}`;
  }

  return buildBackendUrl(normalized);
}

export function imageFallbackText(path: string | null | undefined): string {
  const trimmed = path?.trim();
  return trimmed ? `Ruta: ${trimmed}` : "Sin imagen asociada";
}
