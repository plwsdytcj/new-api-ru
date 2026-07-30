package controller

import (
	"net/http"
	"regexp"
	"strconv"
	"strings"
	"unicode/utf8"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/model"
	"github.com/QuantumNous/new-api/service"
	"github.com/gin-gonic/gin"
)

type createSupportTicketRequest struct {
	Type             string `json:"type"`
	Subject          string `json:"subject"`
	Description      string `json:"description"`
	OrderNo          string `json:"order_no"`
	TelegramUsername string `json:"telegram_username"`
}

type updateSupportTicketRequest struct {
	Status            string  `json:"status"`
	Resolution        string  `json:"resolution"`
	RefundAmount      float64 `json:"refund_amount"`
	RefundTransaction string  `json:"refund_transaction"`
}

var telegramUsernamePattern = regexp.MustCompile(`^[A-Za-z0-9_]{5,32}$`)

func CreateSupportTicket(c *gin.Context) {
	var request createSupportTicketRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		common.ApiErrorMsg(c, "Некорректный запрос")
		return
	}

	request.Type = strings.TrimSpace(request.Type)
	request.Subject = strings.TrimSpace(request.Subject)
	request.Description = strings.TrimSpace(request.Description)
	request.OrderNo = strings.TrimSpace(request.OrderNo)
	request.TelegramUsername = strings.TrimPrefix(strings.TrimSpace(request.TelegramUsername), "@")

	if !model.IsSupportTicketType(request.Type) {
		common.ApiErrorMsg(c, "Некорректный тип обращения")
		return
	}
	if utf8.RuneCountInString(request.Subject) < 3 || utf8.RuneCountInString(request.Subject) > 160 {
		common.ApiErrorMsg(c, "Тема должна содержать от 3 до 160 символов")
		return
	}
	if utf8.RuneCountInString(request.Description) < 10 || utf8.RuneCountInString(request.Description) > 5000 {
		common.ApiErrorMsg(c, "Описание должно содержать от 10 до 5000 символов")
		return
	}
	if request.TelegramUsername != "" && !telegramUsernamePattern.MatchString(request.TelegramUsername) {
		common.ApiErrorMsg(c, "Некорректное имя пользователя Telegram")
		return
	}

	userID := c.GetInt("id")
	if _, err := model.ValidateSupportTicketOrder(userID, request.Type, request.OrderNo); err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	if request.Type == model.SupportTicketTypeRefund {
		exists, err := model.HasActiveRefundTicket(userID, request.OrderNo)
		if err != nil {
			common.ApiError(c, err)
			return
		}
		if exists {
			common.ApiErrorMsg(c, "Для этого заказа уже создан активный запрос на возврат")
			return
		}
	}

	now := common.GetTimestamp()
	ticket := &model.SupportTicket{
		UserId:           userID,
		Type:             request.Type,
		Subject:          request.Subject,
		Description:      request.Description,
		OrderNo:          request.OrderNo,
		TelegramUsername: request.TelegramUsername,
		Status:           model.SupportTicketStatusOpen,
		CreateTime:       now,
		UpdateTime:       now,
	}
	if err := model.CreateSupportTicket(ticket); err != nil {
		common.ApiError(c, err)
		return
	}
	go service.NotifySupportTicket(ticket)
	common.ApiSuccess(c, ticket)
}

func ListMySupportTickets(c *gin.Context) {
	listSupportTickets(c, false)
}

func ListAllSupportTickets(c *gin.Context) {
	listSupportTickets(c, true)
}

func listSupportTickets(c *gin.Context, admin bool) {
	status := strings.TrimSpace(c.Query("status"))
	ticketType := strings.TrimSpace(c.Query("type"))
	if status != "" && !model.IsSupportTicketStatus(status) {
		common.ApiErrorMsg(c, "Некорректный статус обращения")
		return
	}
	if ticketType != "" && !model.IsSupportTicketType(ticketType) {
		common.ApiErrorMsg(c, "Некорректный тип обращения")
		return
	}

	pageInfo := common.GetPageQuery(c)
	tickets, total, err := model.ListSupportTickets(c.GetInt("id"), admin, status, ticketType, pageInfo)
	if err != nil {
		common.ApiError(c, err)
		return
	}
	pageInfo.SetTotal(int(total))
	pageInfo.SetItems(tickets)
	common.ApiSuccess(c, pageInfo)
}

func GetSupportTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	admin := c.GetInt("role") >= common.RoleAdminUser
	ticket, err := model.GetSupportTicket(id, c.GetInt("id"), admin)
	if err != nil {
		c.JSON(http.StatusNotFound, gin.H{"success": false, "message": "Обращение не найдено"})
		return
	}
	common.ApiSuccess(c, ticket)
}

func UpdateSupportTicket(c *gin.Context) {
	id, err := strconv.Atoi(c.Param("id"))
	if err != nil {
		common.ApiError(c, err)
		return
	}
	var request updateSupportTicketRequest
	if err := c.ShouldBindJSON(&request); err != nil {
		common.ApiErrorMsg(c, "Некорректный запрос")
		return
	}
	request.Status = strings.TrimSpace(request.Status)
	if !model.IsSupportTicketStatus(request.Status) {
		common.ApiErrorMsg(c, "Некорректный статус обращения")
		return
	}
	if utf8.RuneCountInString(request.Resolution) > 5000 {
		common.ApiErrorMsg(c, "Текст решения слишком длинный")
		return
	}

	ticket, err := model.UpdateSupportTicketByAdmin(
		id,
		c.GetInt("id"),
		request.Status,
		request.Resolution,
		request.RefundAmount,
		request.RefundTransaction,
	)
	if err != nil {
		common.ApiErrorMsg(c, err.Error())
		return
	}
	common.ApiSuccess(c, ticket)
}
