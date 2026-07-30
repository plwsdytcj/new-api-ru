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

func TestRechargeDePayGrantsAffiliateRewardOnceAtCumulativeThreshold(t *testing.T) {
	truncateTables(t)

	originalQuotaPerUnit := common.QuotaPerUnit
	originalInviterQuota := common.QuotaForInviter
	originalThreshold := common.ReferralTopUpThresholdUSD
	common.QuotaPerUnit = 500000
	common.QuotaForInviter = int(common.QuotaPerUnit)
	common.ReferralTopUpThresholdUSD = 10
	t.Cleanup(func() {
		common.QuotaPerUnit = originalQuotaPerUnit
		common.QuotaForInviter = originalInviterQuota
		common.ReferralTopUpThresholdUSD = originalThreshold
	})

	inviter := &User{
		Id:       510,
		Username: "depay_affiliate_inviter",
		AffCode:  "invite510",
		Status:   common.UserStatusEnabled,
	}
	invitee := &User{
		Id:        511,
		Username:  "depay_affiliate_invitee",
		AffCode:   "invite511",
		InviterId: inviter.Id,
		Status:    common.UserStatusEnabled,
	}
	require.NoError(t, DB.Create(inviter).Error)
	require.NoError(t, DB.Create(invitee).Error)

	first := &TopUp{
		UserId:          invitee.Id,
		Amount:          1,
		Money:           1,
		TradeNo:         "depay-affiliate-1",
		PaymentMethod:   PaymentMethodDePay,
		PaymentProvider: PaymentProviderDePay,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, first.Insert())
	require.NoError(t, RechargeDePay(first.TradeNo, "0xaffiliate-1", "127.0.0.1"))

	var refreshedInviter User
	require.NoError(t, DB.First(&refreshedInviter, inviter.Id).Error)
	assert.Zero(t, refreshedInviter.AffQuota)

	second := &TopUp{
		UserId:          invitee.Id,
		Amount:          9,
		Money:           9,
		TradeNo:         "depay-affiliate-2",
		PaymentMethod:   PaymentMethodDePay,
		PaymentProvider: PaymentProviderDePay,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, second.Insert())
	require.NoError(t, RechargeDePay(second.TradeNo, "0xaffiliate-2", "127.0.0.1"))
	require.NoError(t, RechargeDePay(second.TradeNo, "0xaffiliate-2", "127.0.0.1"))

	third := &TopUp{
		UserId:          invitee.Id,
		Amount:          10,
		Money:           10,
		TradeNo:         "depay-affiliate-3",
		PaymentMethod:   PaymentMethodDePay,
		PaymentProvider: PaymentProviderDePay,
		Status:          common.TopUpStatusPending,
		CreateTime:      time.Now().Unix(),
	}
	require.NoError(t, third.Insert())
	require.NoError(t, RechargeDePay(third.TradeNo, "0xaffiliate-3", "127.0.0.1"))

	require.NoError(t, DB.First(&refreshedInviter, inviter.Id).Error)
	assert.Equal(t, int(common.QuotaPerUnit), refreshedInviter.AffQuota)
	assert.Equal(t, int(common.QuotaPerUnit), refreshedInviter.AffHistoryQuota)

	var rewardCount int64
	require.NoError(t, DB.Model(&AffiliateReward{}).Count(&rewardCount).Error)
	assert.EqualValues(t, 1, rewardCount)

	require.NoError(t, refreshedInviter.TransferAffQuotaToQuota(int(common.QuotaPerUnit)))
	require.NoError(t, DB.First(&refreshedInviter, inviter.Id).Error)
	assert.Zero(t, refreshedInviter.AffQuota)
	assert.Equal(t, int(common.QuotaPerUnit), refreshedInviter.Quota)
}

func TestInviteRegistrationOnlyIncrementsCount(t *testing.T) {
	truncateTables(t)

	inviter := &User{
		Id:       520,
		Username: "registration_only_inviter",
		AffCode:  "invite520",
		Status:   common.UserStatusEnabled,
	}
	require.NoError(t, DB.Create(inviter).Error)
	require.NoError(t, inviteUser(inviter.Id))

	require.NoError(t, DB.First(inviter, inviter.Id).Error)
	assert.Equal(t, 1, inviter.AffCount)
	assert.Zero(t, inviter.AffQuota)
	assert.Zero(t, inviter.AffHistoryQuota)
}
