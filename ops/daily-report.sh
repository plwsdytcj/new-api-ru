#!/usr/bin/env bash

set -Eeuo pipefail

SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)
DEPLOY_DIR=${DEPLOY_DIR:-$(cd -- "$SCRIPT_DIR/.." && pwd)}
ENV_FILE=${ENV_FILE:-$DEPLOY_DIR/.env}
REPORT_TIMEZONE=${REPORT_TIMEZONE:-Europe/Moscow}
REPORT_DATE=${REPORT_DATE:-}
DRY_RUN=false

usage() {
  cat <<'EOF'
Usage: daily-report.sh [--date YYYY-MM-DD|today|yesterday] [--dry-run]

Builds a RussiaAPI daily report from New API's MySQL database and Yandex
Metrica. By default, the report covers yesterday in Europe/Moscow and is sent
to the configured support Telegram chat.
EOF
}

while (($# > 0)); do
  case "$1" in
    --date)
      REPORT_DATE=${2:-}
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown argument: $1" >&2
      usage >&2
      exit 2
      ;;
  esac
done

require_command() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Required command not found: $1" >&2
    exit 1
  }
}

for command_name in curl date docker jq; do
  require_command "$command_name"
done

if [[ ! -f "$ENV_FILE" ]]; then
  echo "Environment file not found: $ENV_FILE" >&2
  exit 1
fi

env_value() {
  local key=$1 line value
  line=$(grep -m1 -E "^${key}=" "$ENV_FILE" || true)
  value=${line#*=}
  value=${value%$'\r'}
  if [[ ${#value} -ge 2 ]]; then
    if [[ ${value:0:1} == '"' && ${value: -1} == '"' ]] ||
       [[ ${value:0:1} == "'" && ${value: -1} == "'" ]]; then
      value=${value:1:${#value}-2}
    fi
  fi
  printf '%s' "$value"
}

MYSQL_DATABASE=$(env_value MYSQL_DATABASE)
MYSQL_ROOT_PASSWORD=$(env_value MYSQL_ROOT_PASSWORD)
YANDEX_METRICA_ID=$(env_value YANDEX_METRICA_ID)
YANDEX_METRICA_TOKEN=$(env_value YANDEX_METRICA_TOKEN)
TELEGRAM_BOT_TOKEN=$(env_value SUPPORT_TELEGRAM_BOT_TOKEN)
TELEGRAM_CHAT_ID=$(env_value SUPPORT_TELEGRAM_CHAT_ID)
RESEND_API_KEY=$(env_value OPS_RESEND_API_KEY)
REPORT_EMAIL_FROM=$(env_value OPS_ALERT_EMAIL_FROM)
REPORT_EMAIL_TO=$(env_value OPS_ALERT_EMAIL_TO)

for required_name in MYSQL_DATABASE MYSQL_ROOT_PASSWORD YANDEX_METRICA_ID YANDEX_METRICA_TOKEN; do
  if [[ -z ${!required_name} ]]; then
    echo "Missing required setting: $required_name" >&2
    exit 1
  fi
done

if [[ -z "$REPORT_DATE" || "$REPORT_DATE" == yesterday ]]; then
  REPORT_DATE=$(TZ="$REPORT_TIMEZONE" date -d yesterday +%F)
elif [[ "$REPORT_DATE" == today ]]; then
  REPORT_DATE=$(TZ="$REPORT_TIMEZONE" date +%F)
fi

if [[ ! "$REPORT_DATE" =~ ^[0-9]{4}-[0-9]{2}-[0-9]{2}$ ]] ||
   ! TZ="$REPORT_TIMEZONE" date -d "$REPORT_DATE" +%F >/dev/null 2>&1; then
  echo "Invalid report date: $REPORT_DATE" >&2
  exit 2
fi

START_TS=$(TZ="$REPORT_TIMEZONE" date -d "$REPORT_DATE 00:00:00" +%s)
END_TS=$(TZ="$REPORT_TIMEZONE" date -d "$REPORT_DATE +1 day 00:00:00" +%s)

mysql_query() {
  local query=$1
  (
    cd "$DEPLOY_DIR"
    docker compose exec -T -e MYSQL_PWD="$MYSQL_ROOT_PASSWORD" mysql \
      mysql --batch --skip-column-names -uroot "$MYSQL_DATABASE" -e "$query" 2>/dev/null
  )
}

declare -A metrics
while IFS=$'\t' read -r key value; do
  metrics["$key"]=$value
done < <(mysql_query "
SELECT 'users_total', COUNT(*) FROM users WHERE deleted_at IS NULL
UNION ALL SELECT 'users_new', COUNT(*) FROM users WHERE deleted_at IS NULL AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'active_api_users', COUNT(DISTINCT user_id) FROM logs WHERE type = 2 AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'api_success', COUNT(*) FROM logs WHERE type = 2 AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'api_errors', COUNT(*) FROM logs WHERE type = 5 AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'api_429', COUNT(*) FROM logs WHERE type = 5 AND created_at >= $START_TS AND created_at < $END_TS AND (content LIKE '%429%' OR other LIKE '%429%')
UNION ALL SELECT 'prompt_tokens', COALESCE(SUM(prompt_tokens), 0) FROM logs WHERE type = 2 AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'completion_tokens', COALESCE(SUM(completion_tokens), 0) FROM logs WHERE type = 2 AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'quota_used', COALESCE(SUM(quota), 0) FROM logs WHERE type = 2 AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'avg_latency', COALESCE(AVG(use_time), 0) FROM logs WHERE type = 2 AND created_at >= $START_TS AND created_at < $END_TS
UNION ALL SELECT 'topup_count', COUNT(*) FROM top_ups WHERE status = 'success' AND complete_time >= $START_TS AND complete_time < $END_TS
UNION ALL SELECT 'topup_amount', COALESCE(SUM(money), 0) FROM top_ups WHERE status = 'success' AND complete_time >= $START_TS AND complete_time < $END_TS
UNION ALL SELECT 'pending_topups', COUNT(*) FROM top_ups WHERE status = 'pending'
UNION ALL SELECT 'open_tickets', COUNT(*) FROM support_tickets WHERE status IN ('open', 'in_progress')
UNION ALL SELECT 'enabled_channels', COUNT(*) FROM channels WHERE status = 1
UNION ALL SELECT 'disabled_channels', COUNT(*) FROM channels WHERE status <> 1;")

QUOTA_PER_UNIT=$(mysql_query "SELECT value FROM options WHERE \`key\` = 'QuotaPerUnit' LIMIT 1;" | head -n1)
QUOTA_PER_UNIT=${QUOTA_PER_UNIT:-500000}
CONSUMPTION_USD=$(awk -v quota="${metrics[quota_used]:-0}" -v unit="$QUOTA_PER_UNIT" 'BEGIN { if (unit > 0) printf "%.4f", quota / unit; else print "0.0000" }')
AVG_LATENCY=$(awk -v value="${metrics[avg_latency]:-0}" 'BEGIN { printf "%.1f", value }')
TOPUP_AMOUNT=$(awk -v value="${metrics[topup_amount]:-0}" 'BEGIN { printf "%.2f", value }')

mapfile -t top_models < <(mysql_query "
SELECT COALESCE(NULLIF(model_name, ''), '(unknown)'), COUNT(*), COALESCE(SUM(quota), 0)
FROM logs
WHERE type = 2 AND created_at >= $START_TS AND created_at < $END_TS
GROUP BY model_name
ORDER BY COUNT(*) DESC, SUM(quota) DESC
LIMIT 5;")

metrica_request() {
  curl -fsS -G \
    -H "Authorization: OAuth $YANDEX_METRICA_TOKEN" \
    'https://api-metrika.yandex.net/stat/v1/data' \
    --data-urlencode "ids=$YANDEX_METRICA_ID" \
    --data-urlencode "date1=$REPORT_DATE" \
    --data-urlencode "date2=$REPORT_DATE" \
    --data-urlencode 'accuracy=full' \
    "$@"
}

metrica_totals=$(metrica_request \
  --data-urlencode 'metrics=ym:s:visits,ym:s:users,ym:s:pageviews,ym:s:bounceRate,ym:s:avgVisitDurationSeconds')

if [[ $(jq -r '(.errors // []) | length' <<<"$metrica_totals") != 0 ]]; then
  echo "Yandex Metrica returned an error" >&2
  jq -c '.errors' <<<"$metrica_totals" >&2
  exit 1
fi

read -r visits web_users pageviews bounce_rate avg_duration < <(
  jq -r '(.totals // [0,0,0,0,0]) | @tsv' <<<"$metrica_totals"
)
visits=${visits%.*}
web_users=${web_users%.*}
pageviews=${pageviews%.*}
bounce_rate=$(awk -v value="${bounce_rate:-0}" 'BEGIN { printf "%.1f", value }')
avg_duration=$(awk -v value="${avg_duration:-0}" 'BEGIN { printf "%.0f", value }')

metrica_sources=$(metrica_request \
  --data-urlencode 'metrics=ym:s:visits' \
  --data-urlencode 'dimensions=ym:s:lastTrafficSource' \
  --data-urlencode 'sort=-ym:s:visits' \
  --data-urlencode 'limit=3')

metrica_pages=$(metrica_request \
  --data-urlencode 'metrics=ym:pv:pageviews' \
  --data-urlencode 'dimensions=ym:pv:URLPath' \
  --data-urlencode 'sort=-ym:pv:pageviews' \
  --data-urlencode 'limit=3')

mapfile -t traffic_sources < <(jq -r '.data[]? | "\(.dimensions[0].name)\t\(.metrics[0] | floor)"' <<<"$metrica_sources")
mapfile -t popular_pages < <(jq -r '.data[]? | "\(.dimensions[0].name)\t\(.metrics[0] | floor)"' <<<"$metrica_pages")

format_ranked_lines() {
  local -n rows=$1
  local empty_text=$2 row_type=${3:-plain} index=1 row name value result=""
  if ((${#rows[@]} == 0)); then
    printf '  %s\n' "$empty_text"
    return
  fi
  for row in "${rows[@]}"; do
    IFS=$'\t' read -r name value _ <<<"$row"
    if [[ "$row_type" == source ]]; then
      case "$name" in
        'Direct traffic') name='直接访问' ;;
        'Search engine traffic') name='搜索引擎' ;;
        'Link traffic') name='外部链接' ;;
        'Social network traffic') name='社交网络' ;;
        'Ad traffic') name='广告流量' ;;
        'Internal traffic') name='站内访问' ;;
        'Messenger traffic') name='即时通讯' ;;
      esac
    fi
    result+="  ${index}. ${name} — ${value}"$'\n'
    ((index++))
  done
  printf '%s' "$result"
}

model_lines=""
if ((${#top_models[@]} == 0)); then
  model_lines="  暂无调用"
else
  rank=1
  for row in "${top_models[@]}"; do
    IFS=$'\t' read -r model_name model_requests model_quota <<<"$row"
    model_cost=$(awk -v quota="$model_quota" -v unit="$QUOTA_PER_UNIT" 'BEGIN { if (unit > 0) printf "%.4f", quota / unit; else print "0.0000" }')
    model_lines+="  ${rank}. ${model_name} — ${model_requests} 次 / \$${model_cost}"$'\n'
    ((rank++))
  done
  model_lines=${model_lines%$'\n'}
fi

source_lines=$(format_ranked_lines traffic_sources '暂无数据' source)
page_lines=$(format_ranked_lines popular_pages '暂无数据')
total_tokens=$(( ${metrics[prompt_tokens]:-0} + ${metrics[completion_tokens]:-0} ))

REPORT=$(cat <<EOF
📊 RussiaAPI 每日运营报告
日期：$REPORT_DATE（莫斯科时间）

🌐 网站 / Yandex Metrica
  访问次数：${visits:-0}
  访客人数：${web_users:-0}
  页面浏览：${pageviews:-0}
  跳出率：${bounce_rate}%
  平均停留：${avg_duration} 秒

流量来源
$source_lines
热门页面
$page_lines
⚙️ New API
  新增用户：${metrics[users_new]:-0}（累计 ${metrics[users_total]:-0}）
  API 活跃用户：${metrics[active_api_users]:-0}
  成功调用：${metrics[api_success]:-0}
  错误调用：${metrics[api_errors]:-0}（429：${metrics[api_429]:-0}）
  Token：$total_tokens（输入 ${metrics[prompt_tokens]:-0} / 输出 ${metrics[completion_tokens]:-0}）
  用户消费：\$$CONSUMPTION_USD
  平均延迟：${AVG_LATENCY} 秒

热门模型
$model_lines

💳 支付与运营
  成功充值：${metrics[topup_count]:-0} 笔 / \$$TOPUP_AMOUNT
  待支付订单：${metrics[pending_topups]:-0}
  待处理工单：${metrics[open_tickets]:-0}
  上游渠道：${metrics[enabled_channels]:-0} 正常 / ${metrics[disabled_channels]:-0} 停用
EOF
)

if $DRY_RUN; then
  printf '%s\n' "$REPORT"
  exit 0
fi

send_telegram() {
  [[ -n "$TELEGRAM_BOT_TOKEN" && -n "$TELEGRAM_CHAT_ID" ]] || return 1
  local response
  response=$(curl --connect-timeout 5 --max-time 15 -sS \
    -X POST "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
    -H 'Content-Type: application/json' \
    --data "$(jq -n --arg chat_id "$TELEGRAM_CHAT_ID" --arg text "$REPORT" '{chat_id:$chat_id,text:$text,disable_web_page_preview:true}')") || return 1
  [[ $(jq -r '.ok // false' <<<"$response") == true ]]
}

send_email() {
  [[ -n "$RESEND_API_KEY" && -n "$REPORT_EMAIL_FROM" && -n "$REPORT_EMAIL_TO" ]] || return 1
  local response
  response=$(curl --connect-timeout 5 --max-time 20 -fsS \
    -X POST 'https://api.resend.com/emails' \
    -H "Authorization: Bearer $RESEND_API_KEY" \
    -H 'Content-Type: application/json' \
    --data "$(jq -n \
      --arg from "$REPORT_EMAIL_FROM" \
      --arg to "$REPORT_EMAIL_TO" \
      --arg subject "RussiaAPI 每日运营报告 · $REPORT_DATE" \
      --arg text "$REPORT" \
      '{from:$from,to:($to|split(",")|map(gsub("^\\s+|\\s+$";""))),subject:$subject,text:$text}')") || return 1
  [[ -n $(jq -r '.id // empty' <<<"$response") ]]
}

if send_telegram; then
  echo "Daily report sent to Telegram for $REPORT_DATE"
elif send_email; then
  echo "Telegram unavailable; daily report sent by email for $REPORT_DATE"
else
  echo "All daily report delivery methods failed" >&2
  exit 1
fi
