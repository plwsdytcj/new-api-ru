package model

import (
	"testing"

	"github.com/QuantumNous/new-api/common"
	"github.com/glebarez/sqlite"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/gorm"
)

func useSupportTicketTestDB(t *testing.T) *gorm.DB {
	t.Helper()
	previousDB := DB
	previousType := common.MainDatabaseType()
	db, err := gorm.Open(sqlite.Open(":memory:"), &gorm.Config{})
	require.NoError(t, err)
	require.NoError(t, db.AutoMigrate(&User{}, &TopUp{}, &SupportTicket{}))
	DB = db
	common.SetMainDatabaseType(common.DatabaseTypeSQLite)
	t.Cleanup(func() {
		DB = previousDB
		common.SetMainDatabaseType(previousType)
	})
	return db
}

func TestValidateSupportTicketOrderChecksOwnershipAndStatus(t *testing.T) {
	db := useSupportTicketTestDB(t)
	require.NoError(t, db.Create(&TopUp{
		UserId:  7,
		TradeNo: "paid-order",
		Status:  common.TopUpStatusSuccess,
	}).Error)
	require.NoError(t, db.Create(&TopUp{
		UserId:  7,
		TradeNo: "pending-order",
		Status:  common.TopUpStatusPending,
	}).Error)

	topUp, err := ValidateSupportTicketOrder(7, SupportTicketTypeRefund, "paid-order")
	require.NoError(t, err)
	assert.Equal(t, "paid-order", topUp.TradeNo)

	_, err = ValidateSupportTicketOrder(8, SupportTicketTypePaymentAppeal, "paid-order")
	assert.Error(t, err)

	_, err = ValidateSupportTicketOrder(7, SupportTicketTypeRefund, "pending-order")
	assert.Error(t, err)
}

func TestHasActiveRefundTicketOnlyCountsActiveRequests(t *testing.T) {
	db := useSupportTicketTestDB(t)
	require.NoError(t, db.Create(&SupportTicket{
		UserId:      7,
		Type:        SupportTicketTypeRefund,
		OrderNo:     "order-1",
		Status:      SupportTicketStatusOpen,
		Subject:     "Refund",
		Description: "Refund description",
	}).Error)

	exists, err := HasActiveRefundTicket(7, "order-1")
	require.NoError(t, err)
	assert.True(t, exists)

	require.NoError(t, db.Model(&SupportTicket{}).
		Where("order_no = ?", "order-1").
		Update("status", SupportTicketStatusResolved).Error)
	exists, err = HasActiveRefundTicket(7, "order-1")
	require.NoError(t, err)
	assert.False(t, exists)
}

func TestUpdateSupportTicketByAdminRequiresRefundTransaction(t *testing.T) {
	db := useSupportTicketTestDB(t)
	ticket := &SupportTicket{
		UserId:      7,
		Type:        SupportTicketTypeRefund,
		OrderNo:     "order-1",
		Status:      SupportTicketStatusOpen,
		Subject:     "Refund",
		Description: "Refund description",
	}
	require.NoError(t, db.Create(ticket).Error)

	_, err := UpdateSupportTicketByAdmin(
		ticket.Id,
		1,
		SupportTicketStatusRefunded,
		"Approved",
		10,
		"",
	)
	assert.Error(t, err)

	updated, err := UpdateSupportTicketByAdmin(
		ticket.Id,
		1,
		SupportTicketStatusRefunded,
		"Approved",
		10,
		"0xrefund",
	)
	require.NoError(t, err)
	assert.Equal(t, SupportTicketStatusRefunded, updated.Status)
	assert.Equal(t, "0xrefund", updated.RefundTransaction)
	assert.Equal(t, 1, updated.AdminId)
}
