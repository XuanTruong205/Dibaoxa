# Security

- JWT authentication is required for customer and Admin data.
- Role authorization separates customer, receptionist and administrator actions.
- Zod schemas reject unexpected input with strict objects.
- Contact and login endpoints use rate limits.
- Express body size is limited and Helmet security headers are enabled.
- Passwords are hashed with bcrypt and never returned by APIs.
- Payment status is controlled server-side and webhook events are stored for idempotency.
- Private frontend routes emit `noindex, nofollow` metadata and are excluded from robots crawling.

Production must use HTTPS, restricted CORS origins, rotated secrets, protected database backups and provider webhook signature verification.

