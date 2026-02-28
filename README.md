# 💄 Beauty Partners - Provider Registration System

This repository contains the front-end implementation of the 'Beauty Partners' registration system. It is designed to provide a premium, multi-step onboarding experience for beauty service providers and destinations.

## 🚀 Features

- **Multi-step Onboarding**: A 4-step wizard guiding users through basic information, portfolio/contact details, terms review, and identity verification.
- **Premium UI/UX**: Built with modern CSS custom properties, smooth transitions, and subtle animations.
- **Advanced Form Logic**:
  - Custom-styled select components.
  - Interactive role and category selection cards.
  - Live preview for portfolio images and certifications.
- **Accessibility (a11y)**:
  - Full keyboard navigation support (Enter/Space/Exclude).
  - Prominent focus rings for better interface tracking.
  - ARIA attributes for interactive components.
- **Data Safety**: 5MB file size validation (client-side) and `localStorage` draft persistence.

## 📂 Project Structure

- `index.html`: Main application skeleton and form structure.
- `styles.css`: Custom design tokens, layout grids, and visual components.
- `script.js`: Core logic for step navigation, input validation, and file handling.
- `img/`: Assets including SVG icons for step status.

## 🛠️ Technical Stack

- **Front-end**: HTML5, CSS3 (Vanilla), Vanilla JavaScript.
- **Verification**: Tested via Python `http.server` for browser-based accessibility and interaction validation.

## 📝 Compliance & Security

- **Aadhar Verification**: This is currently a front-end demo. Actual verification and secure storage must be handled by the backend following UIDAI guidelines.
- **File Validation**: Enforces a strict 5MB limit on all uploads to maintain system performance.

---
*Maintained by the Code Handler Team*
