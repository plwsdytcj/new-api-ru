package model

import (
	"errors"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"gorm.io/gorm"
)

const (
	SupportTicketTypeGeneral       = "general"
	SupportTicketTypePaymentAppeal = "payment_appeal"
	SupportTicketTypeRefund        = "refund"

	SupportTicketStatusOpen       = "open"
	SupportTicketStatusInProgress = "in_progress"
	SupportTicketStatusResolved   = "resolved"
	SupportTicketStatusRejected   = "rejected"
	SupportTicketStatusRefunded   = "refunded"
)

type SupportTicket struct {
	Id                int     `json:"id"`
	UserId            int     `json:"user_id" gorm:"index"`
	Username          string  `json:"username,omitempty" gorm:"-"`
	Type              string  `json:"type" gorm:"type:varchar(32);index"`
	Subject           string  `json:"subject" gorm:"type:varchar(160)"`
	Description       string  `json:"description" gorm:"type:text"`
	OrderNo           string  `json:"order_no" gorm:"type:varchar(255);index"`
	TelegramUsername  string  `json:"telegram_username" gorm:"type:varchar(64)"`
	Status            string  `json:"status" gorm:"type:varchar(32);index"`
	Resolution        string  `json:"resolution" gorm:"type:text"`
	RefundAmount      float64 `json:"refund_amount"`
	RefundTransaction string  `json:"refund_transaction" gorm:"type:varchar(255)"`
	AdminId           int     `json:"admin_id"`
	CreateTime        int64   `json:"create_time" gorm:"index"`
	UpdateTime        int64   `json:"update_time"`
}

func IsSupportTicketType(value string) bool {
	switch value {
	case SupportTicketTypeGeneral, SupportTicketTypePaymentAppeal, SupportTicketTypeRefund:
		return true
	default:
		return false
	}
}

func IsSupportTicketStatus(value string) bool {
	switch value {
	case SupportTicketStatusOpen,
		SupportTicketStatusInProgress,
		SupportTicketStatusResolved,
		SupportTicketStatusRejected,
		SupportTicketStatusRefunded:
		return true
	default:
		return false
	}
}

func IsClosedSupportTicketStatus(value string) bool {
	return value == SupportTicketStatusResolved ||
		value == SupportTicketStatusRejected ||
		value == SupportTicketStatusRefunded
}

func ValidateSupportTicketOrder(userID int, ticketType string, orderNo string) (*TopUp, error) {
	orderNo = strings.TrimSpace(orderNo)
	if ticketType == SupportTicketTypeGeneral {
		if orderNo != "" {
			return nil, errors.New("для общего обращения номер заказа указывать не нужно")
		}
		return nil, nil
	}
	if orderNo == "" {
		return nil, errors.New("укажите номер заказа")
	}

	topUp := &TopUp{}
	if err := DB.Where("trade_no = ? AND user_id = ?", orderNo, userID).First(topUp).Error; err != nil {
		return nil, errors.New("заказ не найден")
	}
	if ticketType == SupportTicketTypeRefund && topUp.Status != common.TopUpStatusSuccess {
		return nil, errors.New("возврат доступен только для завершенного заказа")
	}
	return topUp, nil
}

func HasActiveRefundTicket(userID int, orderNo string) (bool, error) {
	var count int64
	err := DB.Model(&SupportTicket{}).
		Where("user_id = ? AND order_no = ? AND type = ? AND status IN ?",
			userID,
			orderNo,
			SupportTicketTypeRefund,
			[]string{SupportTicketStatusOpen, SupportTicketStatusInProgress},
		).
		Count(&count).Error
	return count > 0, err
}

func CreateSupportTicket(ticket *SupportTicket) error {
	return DB.Create(ticket).Error
}

func ListSupportTickets(userID int, admin bool, status string, ticketType string, pageInfo *common.PageInfo) ([]*SupportTicket, int64, error) {
	query := DB.Model(&SupportTicket{})
	if !admin {
		query = query.Where("user_id = ?", userID)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if ticketType != "" {
		query = query.Where("type = ?", ticketType)
	}

	var total int64
	if err := query.Count(&total).Error; err != nil {
		return nil, 0, err
	}

	var tickets []*SupportTicket
	if err := query.Order("id desc").
		Limit(pageInfo.GetPageSize()).
		Offset(pageInfo.GetStartIdx()).
		Find(&tickets).Error; err != nil {
		return nil, 0, err
	}

	if admin && len(tickets) > 0 {
		userIDs := make([]int, 0, len(tickets))
		for _, ticket := range tickets {
			userIDs = append(userIDs, ticket.UserId)
		}
		var users []User
		if err := DB.Select("id", "username").Where("id IN ?", userIDs).Find(&users).Error; err != nil {
			return nil, 0, err
		}
		usernames := make(map[int]string, len(users))
		for _, user := range users {
			usernames[user.Id] = user.Username
		}
		for _, ticket := range tickets {
			ticket.Username = usernames[ticket.UserId]
		}
	}

	return tickets, total, nil
}

func GetSupportTicket(id int, userID int, admin bool) (*SupportTicket, error) {
	ticket := &SupportTicket{}
	query := DB.Where("id = ?", id)
	if !admin {
		query = query.Where("user_id = ?", userID)
	}
	if err := query.First(ticket).Error; err != nil {
		return nil, err
	}
	return ticket, nil
}

func UpdateSupportTicketByAdmin(ticketID int, adminID int, status string, resolution string, refundAmount float64, refundTransaction string) (*SupportTicket, error) {
	var result SupportTicket
	err := DB.Transaction(func(tx *gorm.DB) error {
		if err := lockForUpdate(tx).Where("id = ?", ticketID).First(&result).Error; err != nil {
			return err
		}
		if result.Type != SupportTicketTypeRefund && status == SupportTicketStatusRefunded {
			return errors.New("статус возврата доступен только для запросов на возврат")
		}
		if status == SupportTicketStatusRefunded && strings.TrimSpace(refundTransaction) == "" {
			return errors.New("укажите транзакцию возврата")
		}
		if refundAmount < 0 {
			return errors.New("сумма возврата не может быть отрицательной")
		}

		result.Status = status
		result.Resolution = strings.TrimSpace(resolution)
		result.RefundAmount = refundAmount
		result.RefundTransaction = strings.TrimSpace(refundTransaction)
		result.AdminId = adminID
		result.UpdateTime = common.GetTimestamp()
		return tx.Save(&result).Error
	})
	if err != nil {
		return nil, err
	}
	return &result, nil
}
