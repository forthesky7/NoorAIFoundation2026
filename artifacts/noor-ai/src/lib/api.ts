const BASE_URL = import.meta.env.BASE_URL?.replace(/\/$/, "") || "";
const API_PATH = `${BASE_URL}/api`;

function getToken(): string | null {
  return localStorage.getItem("noor_token");
}

function headers(extra?: Record<string, string>): Headers {
  const h = new Headers({ "Content-Type": "application/json", ...extra });
  const token = getToken();
  if (token) h.set("Authorization", `Bearer ${token}`);
  return h;
}

export const apiClient = {
  get: (path: string) =>
    fetch(`${API_PATH}${path}`, { headers: headers() }),

  post: (path: string, body: unknown) =>
    fetch(`${API_PATH}${path}`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify(body),
    }),

  patch: (path: string, body: unknown) =>
    fetch(`${API_PATH}${path}`, {
      method: "PATCH",
      headers: headers(),
      body: JSON.stringify(body),
    }),

  delete: (path: string) =>
    fetch(`${API_PATH}${path}`, { method: "DELETE", headers: headers() }),
};
