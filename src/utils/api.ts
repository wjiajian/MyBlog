const configuredApiBase = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim();

export const API_BASE_HINT = configuredApiBase || '/api';
