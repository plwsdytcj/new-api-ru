package model

import (
	"testing"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestRechargeDePayIsIdempotentAndRejectsTransactionReuse(t *testing.T) {
	truncateTables(t)

	originalQuotaPerUnit := common.QuotaPerUnit
	common.QuotaPerUnit = 500000
	t.Cleanup(func() { common.QuotaPerUnit = originalQuotaPerUnit })

	insertUserForPaymentGuardTest(t, 501, 0)
	require.NoError(t, DB.Create(&User{
		Id:       502,
		Username: "depay_payment_guard_user_502",
		AffCode:  "depay502",
		Status:   common.UserStatusEnabled,
		Quota:    0,
	}).Error)

	first := &TopUp{
		UserId:          501,
		Amount:          10,
		Money:           10,
		TradeNo:         "depay-order-1",
		PaymentMethod:   PaymentMethodDePay,
		PaymentProvider: PaymentProviderDePay,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, first.Insert())

	require.NoError(t, RechargeDePay(first.TradeNo, "0xtransaction-1", "127.0.0.1"))
	assert.Equal(t, 10*int(common.QuotaPerUnit), getUserQuotaForPaymentGuardTest(t, 501))

	require.NoError(t, RechargeDePay(first.TradeNo, "0xtransaction-1", "127.0.0.1"))
	assert.Equal(t, 10*int(common.QuotaPerUnit), getUserQuotaForPaymentGuardTest(t, 501))

	second := &TopUp{
		UserId:          502,
		Amount:          10,
		Money:           10,
		TradeNo:         "depay-order-2",
		PaymentMethod:   PaymentMethodDePay,
		PaymentProvider: PaymentProviderDePay,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, second.Insert())

	require.Error(t, RechargeDePay(second.TradeNo, "0xtransaction-1", "127.0.0.1"))
	assert.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 502))
	assert.Equal(t, common.TopUpStatusPending, getTopUpStatusForPaymentGuardTest(t, second.TradeNo))
}

func TestRechargeDePayRejectsWrongProvider(t *testing.T) {
	truncateTables(t)

	insertUserForPaymentGuardTest(t, 503, 0)
	insertTopUpForPaymentGuardTest(t, "depay-provider-guard", 503, PaymentProviderStripe)

	err := RechargeDePay("depay-provider-guard", "0xtransaction-guard", "127.0.0.1")
	require.ErrorIs(t, err, ErrPaymentMethodMismatch)
	assert.Equal(t, 0, getUserQuotaForPaymentGuardTest(t, 503))
}
