# Testing

## Automated suites

- Backend: Vitest integration tests cover auth, booking, inventory, payment, travel order and assistant services.
- Frontend: Vitest covers stores and important presentation utilities.
- Build: Vite production compilation checks module and asset integration.

## Release checks

1. Run backend tests.
2. Run frontend tests.
3. Build the frontend to a clean output directory.
4. Verify direct loads for every public URL through the production rewrite rule.
5. Test keyboard navigation and screen widths at 360, 768, 1024 and 1440 pixels.
6. Test contact creation and status changes from Admin.
7. Confirm canonical domain, Analytics ID and sitemap before release.

## Baseline verified on 2026-08-24

- Backend: 14 test files, 47 tests passed.
- Frontend: 12 tests passed.
- Prisma schema: formatted, generated, validated and applied to the local database.
- Production build: passed; initial JavaScript entry is 74.66 KB gzip against an 80 KB budget.
- Dependency audit: no production vulnerabilities reported for backend or frontend.
- Browser smoke test: all public routes loaded without console errors or horizontal overflow; mobile sticky CTA and custom 404 were verified.
