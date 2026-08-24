# Dibaoxa System Blueprint

## Product goal

Dibaoxa is a Vietnamese travel marketplace for hotels, cruises, domestic flights and corporate travel requests. The product must make discovery, booking, payment and post-booking support understandable from one account.

## User groups

- Guest: discovers products, reads policies and sends contact requests.
- Customer: manages profile, bookings, travel orders and payment status.
- Receptionist: handles assigned hotel operations, bookings, check-in and customer contact requests.
- Administrator: manages all inventory, orders, payments, users, staff, reporting and website inquiries.

## Main journeys

1. Discover service, open a detail page, choose inventory, authenticate, book, pay and follow order status.
2. Submit a consultation request, receive a reference code, then let staff process it from Admin.
3. Review a completed stay. Public stories only render reviews stored in the database.

## Public trust and SEO checklist

| Requirement | Implementation |
| --- | --- |
| Custom 404 | `/not-found` state for unknown browser paths |
| CTA above the fold | Existing home search and service CTA |
| Internal links | Crawlable URLs in header and footer |
| Thank you page | `/cam-on`, linked to a persisted contact request |
| Breadcrumbs | Detail pages plus policy and story pages |
| Case studies | `/cau-chuyen-khach-hang`, sourced from database reviews |
| Five FAQs | Five product FAQs on home |
| Response promise | Target response time shown on contact and thank-you pages |
| Sticky mobile CTA | Call and consultation bar below 640px |
| robots.txt | Public allow list and private route exclusions |
| Unique titles | Runtime route metadata manager |
| Meta descriptions | Runtime route descriptions |
| Social image | Open Graph and Twitter image metadata |
| Maps and directions | Google Maps directions link on contact/footer |
| Real reviews | Public review endpoint, no fabricated testimonials |
| Image alt text | Existing public images audited and meaningful alt kept |
| Local schema | TravelAgency and LocalBusiness JSON-LD |
| Privacy page | `/chinh-sach-bao-mat` |
| Google Analytics | Optional `VITE_GA_MEASUREMENT_ID` integration |
| Team photo | Admin-managed opt-in profiles via `/api/v1/team`; only consented profiles with a real photo are published |

## External production inputs

- Confirmed public domain for canonical URLs and sitemap.
- Google Analytics measurement ID.
- Real staff photographs with publishing consent, entered through Admin before public display.
- Confirmed social profile URLs before adding social links.
