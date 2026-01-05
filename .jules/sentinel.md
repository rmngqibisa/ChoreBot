# Sentinel Journal

This journal documents critical security learnings and decisions.

## 2024-05-22 - Predictable ID Generation
**Vulnerability:** User and Chore IDs were generated using `Date.now().toString()`.
**Learning:** This makes IDs predictable, allowing attackers to enumerate users and chores, leading to privacy leaks (location data exposure) and Insecure Direct Object References (IDOR).
**Prevention:** Use `crypto.randomUUID()` for generating unique, unpredictable identifiers.
