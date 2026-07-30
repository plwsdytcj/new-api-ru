package service

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
)

func SupportTelegramURL() string {
	return strings.TrimSpace(os.Getenv("SUPPORT_TELEGRAM_URL"))
}

func SupportTelegramName() string {
	return strings.TrimSpace(os.Getenv("SUPPORT_TELEGRAM_NAME"))
}

func NotifySupportTicket(ticket *model.SupportTicket) {
	token := strings.TrimSpace(os.Getenv("SUPPORT_TELEGRAM_BOT_TOKEN"))
	chatID := strings.TrimSpace(os.Getenv("SUPPORT_TELEGRAM_CHAT_ID"))
	if token == "" || chatID == "" {
		return
	}

	message := fmt.Sprintf(
		"RussiaAPI: новое обращение #%d\nТип: %s\nПользователь: %d\nЗаказ: %s\nТема: %s",
		ticket.Id,
		ticket.Type,
		ticket.UserId,
		ticket.OrderNo,
		ticket.Subject,
	)
	form := url.Values{
		"chat_id": {chatID},
		"text":    {message},
	}
	ctx, cancel := context.WithTimeout(context.Background(), 8*time.Second)
	defer cancel()

	endpoint := "https://api.telegram.org/bot" + token + "/sendMessage"
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, endpoint, strings.NewReader(form.Encode()))
	if err != nil {
		return
	}
	request.Header.Set("Content-Type", "application/x-www-form-urlencoded")

	response, err := http.DefaultClient.Do(request)
	if err != nil {
		logger.LogError(ctx, "support Telegram notification failed: "+err.Error())
		return
	}
	defer response.Body.Close()
	if response.StatusCode < http.StatusOK || response.StatusCode >= http.StatusMultipleChoices {
		logger.LogError(ctx, fmt.Sprintf("support Telegram notification failed with status %d", response.StatusCode))
	}
}
