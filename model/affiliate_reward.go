package model

import (
	"errors"

	"github.com/QuantumNous/new-api/common"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

const AffiliateRewardTypeFirstTopUp = "first_topup"

type AffiliateReward struct {
	Id         int64  `json:"id" gorm:"primaryKey"`
	InviterId  int    `json:"inviter_id" gorm:"not null;index"`
	InviteeId  int    `json:"invitee_id" gorm:"not null;uniqueIndex:idx_affiliate_reward_once,priority:1"`
	RewardType string `json:"reward_type" gorm:"type:varchar(32);not null;uniqueIndex:idx_affiliate_reward_once,priority:2"`
	TopUpId    int    `json:"topup_id" gorm:"not null;uniqueIndex"`
	Quota      int    `json:"quota" gorm:"not null"`
	CreatedAt  int64  `json:"created_at" gorm:"autoCreateTime"`
}

func grantFirstTopUpAffiliateReward(tx *gorm.DB, topUp *TopUp) (*AffiliateReward, error) {
	if tx == nil || topUp == nil || topUp.Id == 0 || topUp.UserId == 0 {
		return nil, errors.New("invalid affiliate reward input")
	}
	if common.QuotaForInviter <= 0 || common.ReferralTopUpThresholdUSD <= 0 {
		return nil, nil
	}

	var invitee User
	if err := tx.Select("id", "inviter_id").First(&invitee, topUp.UserId).Error; err != nil {
		return nil, err
	}
	if invitee.InviterId <= 0 || invitee.InviterId == invitee.Id {
		return nil, nil
	}

	var successfulTotal float64
	if err := tx.Model(&TopUp{}).
		Where("user_id = ? AND status = ?", invitee.Id, common.TopUpStatusSuccess).
		Select("COALESCE(SUM(money), 0)").
		Scan(&successfulTotal).Error; err != nil {
		return nil, err
	}
	if decimal.NewFromFloat(successfulTotal).
		LessThan(decimal.NewFromInt(int64(common.ReferralTopUpThresholdUSD))) {
		return nil, nil
	}

	reward := &AffiliateReward{
		InviterId:  invitee.InviterId,
		InviteeId:  invitee.Id,
		RewardType: AffiliateRewardTypeFirstTopUp,
		TopUpId:    topUp.Id,
		Quota:      common.QuotaForInviter,
		CreatedAt:  common.GetTimestamp(),
	}
	result := tx.Clauses(clause.OnConflict{DoNothing: true}).Create(reward)
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected == 0 {
		return nil, nil
	}

	result = tx.Model(&User{}).
		Where("id = ?", invitee.InviterId).
		Updates(map[string]any{
			"aff_quota":   gorm.Expr("aff_quota + ?", reward.Quota),
			"aff_history": gorm.Expr("aff_history + ?", reward.Quota),
		})
	if result.Error != nil {
		return nil, result.Error
	}
	if result.RowsAffected != 1 {
		return nil, errors.New("affiliate inviter not found")
	}
	return reward, nil
}
