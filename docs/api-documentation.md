# API Documentation

All responses use `{ success, data }`. Validation errors use HTTP 400 with `code: VALIDATION_ERROR`.

## Public additions

### POST `/api/v1/contact-inquiries`

Body fields: `name`, `email`, `phone`, `service`, `message`. `service` is one of `cruise`, `hotel`, `flight`, `corporate`, `other`. The endpoint is rate-limited and returns an inquiry reference ID.

### GET `/api/v1/hotels/featured-reviews?limit=9`

Returns recent high-rating reviews with public customer name and hotel summary. Empty or short comments are excluded.

### GET `/api/v1/team`

Returns active staff profiles that an administrator explicitly opted into public display and that have a consented photo. Email, phone, internal status and publishing flags are never returned.

## Admin additions

### GET `/api/v1/admin/contact-inquiries`

Requires `admin` or `receptionist`. Supports `page`, `limit` and optional `status`.

### PATCH `/api/v1/admin/contact-inquiries/:id/status`

Requires `admin` or `receptionist`. Body: `{ "status": "new|in_progress|resolved" }`.

### Admin staff publishing fields

`POST /api/v1/admin/staff` and `PUT /api/v1/admin/staff/:id` accept `photo_url`, `bio`, `is_public` and `display_order`. Only administrators can create or edit these records.
