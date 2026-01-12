# Palette's Journal

## 2025-01-04 - Loading States
**Learning:** Adding `aria-busy="true"` to the form container during async submission is a simple, high-impact a11y win that works well with visual loading states.
**Action:** Always pair visual disabled states with programmatic `aria-busy` indicators on the container.

## 2025-01-04 - Toast Notifications
**Learning:** Screen readers handle dynamic content updates differently based on importance. Errors need `aria-live="assertive"` to interrupt, while success messages work best with `aria-live="polite"`.
**Action:** Use the `showToast` utility which handles these roles automatically.
