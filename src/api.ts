export const API = "http://127.0.0.1:8000";

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (init.body && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");
  const response = await fetch(`${API}${path}`, { ...init, headers, credentials: "include" });
  if (response.status === 204) return undefined as T;
  const text = await response.text();
  const body = text ? JSON.parse(text) : null;
  if (!response.ok) {
    const detail = body && typeof body.detail === "string" ? body.detail : response.statusText;
    throw new ApiError(response.status, detail);
  }
  return body as T;
}

export type User = { id: number; email: string; name: string };

export type Profile = {
  birth_date: string | null;
  sex: "female" | "male" | "unspecified";
  weight_kg: number | null;
  resting_hr: number | null;
  max_hr: number | null;
  threshold_power: number | null;
  days_per_week: number | null;
  experience: "beginner" | "regular" | "experienced";
};

export type Step = {
  duration_s: number;
  target_hr: number | null;
  target_cadence: number | null;
  target_power: number | null;
};

export type Program = {
  id: number;
  name: string;
  template_key: string | null;
  is_current: boolean;
  steps: Step[];
};

export type Bike = { id: number; name: string; token?: string };
