# Operations

## Daily report

`daily-report.sh` combines the previous day's New API operational data with
Yandex Metrica traffic data and sends one report to the support Telegram chat.
The default reporting timezone is `Europe/Moscow`.

The SEO section currently includes organic visits, visitors, pageviews,
bounce rate, search-engine distribution, and organic landing pages from
Yandex Metrica. Search queries, impressions, average position, indexing, and
crawl errors require separate read-only access to Yandex Webmaster and Google
Search Console.

Required settings in the deployment `.env`:

```dotenv
YANDEX_METRICA_ID=111210946
YANDEX_METRICA_TOKEN=
YANDEX_WEBMASTER_TOKEN=
SUPPORT_TELEGRAM_BOT_TOKEN=
SUPPORT_TELEGRAM_CHAT_ID=
OPS_RESEND_API_KEY=
OPS_ALERT_EMAIL_FROM=
OPS_ALERT_EMAIL_TO=
# Reserved for Google search performance:
GOOGLE_SEARCH_CONSOLE_CREDENTIALS_FILE=
```

The report attempts Telegram first. If Telegram is unreachable from the server,
it falls back to the configured Resend operations email.

Preview without sending:

```bash
DEPLOY_DIR=/path/to/deployment ./ops/daily-report.sh --date today --dry-run
```

Install the systemd timer to send at 09:00 Moscow time, including after a
server restart:

```bash
sudo cp ops/systemd/russiaapi-daily-report.* /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now russiaapi-daily-report.timer
```
