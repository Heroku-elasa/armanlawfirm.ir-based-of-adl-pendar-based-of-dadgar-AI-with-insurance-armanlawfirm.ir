export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}

export function login() {
  window.location.href = "/api/login";
}

export function logout() {
  window.location.href = "/api/logout";
}
