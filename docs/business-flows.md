# Business Flows

## Consultation

1. Guest enters contact details and a request.
2. Client validates basic completeness.
3. API validates again, rate-limits and persists the request.
4. Guest receives a thank-you page and reference code.
5. Admin or receptionist changes the request from new to in progress, then resolved.

## Hotel booking

1. Customer searches dates and destination.
2. Server calculates real-time room availability.
3. Customer selects room and quantity.
4. Server creates booking and payment state.
5. Payment confirmation advances the order.
6. Customer tracks the booking in the account area.

## Cruise and flight order

1. Customer chooses a departure or flight offer.
2. Server validates inventory and price.
3. Order enters pending payment with an expiry.
4. Payment webhook or authorized Admin action confirms it.
5. Customer sees the final status in their travel orders.

