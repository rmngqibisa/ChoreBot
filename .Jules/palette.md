# Palette's Journal

## 2025-01-04 - Loading States
**Learning:** Adding `aria-busy="true"` to the form container during async submission is a simple, high-impact a11y win that works well with visual loading states.
**Action:** Always pair visual disabled states with programmatic `aria-busy` indicators on the container.

## 2025-05-15 - Toast Notifications
**Learning:** Replacing native `alert()` with non-blocking toast notifications significantly improves the perceived smoothness of the application, especially for repetitive actions like "Pay" or "Assign".
**Action:** Use the global `showToast(msg, type)` function for all user feedback instead of blocking alerts.
