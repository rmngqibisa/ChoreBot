# Sentinel Journal

This journal documents critical security learnings and decisions.

## 2024-05-22 - Predictable ID Generation
**Vulnerability:** User and Chore IDs were generated using `Date.now().toString()`.
**Learning:** This makes IDs predictable, allowing attackers to enumerate users and chores, leading to privacy leaks (location data exposure) and Insecure Direct Object References (IDOR).
**Prevention:** Use `crypto.randomUUID()` for generating unique, unpredictable identifiers.

## 2024-05-23 - Broken Authentication and IDOR
**Vulnerability:** The API lacked authentication checks and trusted user input for sensitive operations (e.g., creating chores for other users by spoofing `userId`).
**Learning:** Relying on client-side state for identity is insecure. Always validate identity on the server using a secure session or token mechanism.
**Prevention:** Implemented a session-based authentication system. All sensitive endpoints now verify a Bearer token and derive the user identity from the server-side session store, ignoring any user-provided IDs in the request body.

## 2024-05-24 - Rate Limiting Missing on Auth Endpoints
**Vulnerability:** No rate limiting on `/api/login` and `/api/register` allowed brute-force password attacks.
**Learning:** Even with secure hashing, unlimited attempts allow attackers to guess weak passwords or spam the registration endpoint to cause DoS/resource exhaustion.
**Prevention:** Implemented a custom in-memory `RateLimiter` class (Fixed Window Counter) to limit requests per IP address on sensitive endpoints.
