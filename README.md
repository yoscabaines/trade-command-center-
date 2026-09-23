# Trade Command Center

Free-first Cloudflare Worker + KV scanner scaffold implementing the locked command-center architecture.

## Included
- 15 setup detectors
- Bullish/bearish actionable cards
- Priority queue with wait aging
- Alpaca IEX intraday data for regular-session structure
- Background options contract selection using Alpaca indicative snapshots
- Immutable journal snapshots + separate outcome-event namespace
- Black/purple/blue dashboard
- Cloudflare cron/API endpoints

## Important live-data setup
This project intentionally does **not** ship fake market data. Before deployment, configure valid API credentials and a legitimate universe source. The current premarket engine does not fabricate PMH/PML from quotes. A full-market premarket source must be configured before treating PMH/PML as complete.

Secrets:
- `ALPACA_KEY`
- `ALPACA_SECRET`
- `FMP_KEY`

Set the KV namespace ID in `wrangler.toml`.

## Deploy
1. Create a Cloudflare Worker project.
2. Create a KV namespace and replace `REPLACE_WITH_KV_NAMESPACE_ID`.
3. Set secrets with Wrangler or the Cloudflare dashboard.
4. Deploy the Worker.
5. Serve `public/index.html` as the frontend and set `API` to the Worker URL if hosted separately.

## Validation before trading
The detectors are implemented but must be validated against live data. Verify API entitlements, universe ingestion, extended-hours coverage, cron timing/DST, options contract availability, and detector behavior before relying on cards for execution.
