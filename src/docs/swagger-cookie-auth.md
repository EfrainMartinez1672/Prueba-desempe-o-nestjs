# Swagger Cookie Authentication

## Login flow

1. Open Swagger UI at `/<API_PREFIX>/docs` (for example, `/api/docs`).
2. Execute `POST /auth/login` with an existing account's email and password.
3. On success, the API responds with the user profile (not the tokens) and sets two `HttpOnly`, `SameSite=Strict` cookies: `accessToken` and `refreshToken`.
4. Swagger UI runs on the same origin and sends cookies automatically (`withCredentials` is enabled). Execute protected endpoints, including the administrator-only `/users` CRUD, without opening Authorize or copying a token.
5. Execute `POST /auth/refresh-token` with no body to rotate both cookies. The browser supplies the refresh cookie.
6. Execute `POST /auth/logout` to revoke the session and clear both cookies.

## Cookie scope and transport

- `accessToken` is scoped to the configured API prefix so it reaches authenticated routes.
- `refreshToken` is scoped to the Auth routes.
- `COOKIE_SECURE` controls the `Secure` attribute. Set it to `false` for local HTTP Swagger testing and to `true` for HTTPS production deployments. Browsers do not send Secure cookies over ordinary non-local HTTP.
- Cookie authentication is intended for same-origin Swagger UI and clients. The access token is never returned in JSON or exposed to JavaScript.

## Troubleshooting

- If Swagger has been open before login, reload it after signing in if the browser did not retain the cookies.
- Ensure the browser is accessing Swagger and the API through the same host, scheme, and port.
- If running over HTTPS, use HTTPS for Swagger as well.
- `401` means the access cookie is missing, expired, invalid, or the session was revoked. Log in again.
- `403` from `/users` means the signed-in account is not an administrator.

## OpenAPI behavior

Swagger intentionally has no Bearer or cookie security scheme, so it displays no token authorization prompt. It uses credentialed browser requests instead; authentication cookies remain `HttpOnly` and cannot be manually entered into Swagger. The login response does not return token values in JSON.
