# Verity + Sellbird: what's left

Do these on a computer (a parent's, a friend's or a school one), with a parent or guardian present for the Google steps.

## Already decided
- Company: Verity. Sender: Ishq Patani, Verityweb26@gmail.com
- Product: websites under £400, ready in under 3 days, annual management and free updates
- Target: owner-run businesses in Harrow (hair salons, barbers, beauty salons, takeaways, cafes, florists), 5 km radius
- Entry offer: free consultation
- Postal address: in your private `sellbird.local.yaml` (not in this file)

## On the computer
1. Install Python 3.11+ and the Claude Code CLI, then run `claude login`.
2. `git clone https://github.com/ethanplusai/sellbird.git && cd sellbird`
3. Copy your private `sellbird.local.yaml` into that folder (send it to yourself privately, never post it).
4. `python3 -m venv .venv && source .venv/bin/activate && pip install -e .`
5. `cp .env.example .env`
6. Google (with a parent or guardian): console.cloud.google.com → new project → enable Gmail API → consent screen (External, add Verityweb26@gmail.com as test user) → Credentials → OAuth client ID → Desktop app.
7. Paste GMAIL_CLIENT_ID and GMAIL_CLIENT_SECRET into `.env` only (never into a chat).
8. `sellbird gmail auth`, then `sellbird gmail test`.
9. Free email-check key at reoon.com, into `.env` as REOON_API_KEY.
10. `sellbird signals --confirm free`
11. `sellbird discover` (free), then `sellbird dashboard`.
12. Keep `max_daily_sends` at 5-10 at first and approve every email by hand in the Outbox.
13. Start mailbox warmup (TrulyInbox or another service) before sending at volume.

## Or skip all of it
The hosted version is at https://sellbird.ai (early access).
