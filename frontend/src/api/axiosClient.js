import axios from "axios";

const axiosClient = axios.create({
  // "" = same site (served behind nginx); unset = local development API
  baseURL: process.env.REACT_APP_API_URL ?? "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// 401s the caller handles itself: a wrong password (login form shows the
// message) and the session check on startup (AuthContext just signs out)
const HANDLED_401 = ["/api/auth/", "/api/users/me"];
const PUBLIC_PATHS = ["/", "/login", "/register"];

/** Session expired: drop the token; leave public pages, otherwise go to login. */
function sessionExpired() {
  localStorage.removeItem("token");
  if (!PUBLIC_PATHS.includes(window.location.pathname)) window.location.href = "/login";
}

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    if (error.response?.status === 401 && !HANDLED_401.some(p => url.startsWith(p))) sessionExpired();
    return Promise.reject(error);
  }
);

/**
 * POST that reads a newline-delimited JSON stream (axios can't stream in the
 * browser). Calls onEvent(event) for each line as it arrives.
 */
export async function streamPost(path, body, onEvent) {
  const token = localStorage.getItem("token");
  const res = await fetch(axiosClient.defaults.baseURL + path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  if (res.status === 401) { sessionExpired(); return; }
  if (!res.ok || !res.body) throw new Error(`Request failed: ${res.status}`);

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { value, done } = await reader.read();
    buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
    const lines = buffer.split("\n");
    buffer = lines.pop();
    for (const line of lines) if (line.trim()) onEvent(JSON.parse(line));
    if (done) break;
  }
  if (buffer.trim()) onEvent(JSON.parse(buffer));
}

export default axiosClient;
