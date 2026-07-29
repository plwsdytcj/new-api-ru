package system_setting

import "github.com/QuantumNous/new-api/setting/config"

type LegalSettings struct {
	UserAgreement  string `json:"user_agreement"`
	PrivacyPolicy  string `json:"privacy_policy"`
	RefundPolicy   string `json:"refund_policy"`
	BillingPolicy  string `json:"billing_policy"`
	CompanyDetails string `json:"company_details"`
	ReceiptPolicy  string `json:"receipt_policy"`
}

var defaultLegalSettings = LegalSettings{
	UserAgreement:  "",
	PrivacyPolicy:  "",
	RefundPolicy:   "",
	BillingPolicy:  "",
	CompanyDetails: "",
	ReceiptPolicy:  "",
}

func init() {
	config.GlobalConfig.Register("legal", &defaultLegalSettings)
}

func GetLegalSettings() *LegalSettings {
	return &defaultLegalSettings
}
