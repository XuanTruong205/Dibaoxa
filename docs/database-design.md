# Database Design

## Core domains

- Identity: `User`.
- Hotel commerce: `Hotel`, `Room`, `Booking`, `Service`, `BookingService`, `Review`, `Payment`.
- Cruise commerce: `Cruise`, `CruiseDeparture`.
- Flight and cruise checkout: `TravelOrder`, `TravelOrderPayment`, `BankWebhookEvent`.
- Content and operations: `TravelPackage`, `StaffDirectory`, `ContactInquiry`.

## ContactInquiry

`ContactInquiry` stores public consultation requests with `new`, `in_progress` and `resolved` states. It is indexed by status and creation time for the Admin inbox. Only a minimal acknowledgement is returned to the public client.

## Integrity rules

- Monetary values are integer VND.
- Travel and booking status changes are performed by services, not the browser.
- Reviews shown publicly originate from the `Review` table.
- Public team profiles are opt-in through `StaffDirectory.is_public`. The public endpoint selects only name, role, location, biography and the consented photo.
- Payment transaction references are unique.
- Linked historical accounts and orders are not hard-deleted when that would break audit history.
