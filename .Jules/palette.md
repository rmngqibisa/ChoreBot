# Palette's Journal

## 2025-01-04 - Loading States
**Learning:** Adding `aria-busy="true"` to the form container during async submission is a simple, high-impact a11y win that works well with visual loading states.
**Action:** Always pair visual disabled states with programmatic `aria-busy` indicators on the container.
## 2024-05-22 - Toast Notifications
**Learning:** Replacing blocking `alert()` calls with non-blocking toast notifications significantly improves perceived performance and user flow. Using `role="alert"` and `aria-live` ensures these custom notifications remain accessible to screen reader users.
**Action:** Use the `showToast(msg, type)` function in `client.js` for all future feedback messages instead of `alert()`.
