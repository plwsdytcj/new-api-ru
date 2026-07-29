package controller

import (
	"crypto"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/json"
	"encoding/pem"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"strconv"
	"strings"
	"time"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/logger"
	"github.com/QuantumNous/new-api/model"
	"github.com/gin-gonic/gin"
	"github.com/shopspring/decimal"
)

const dePaySignatureHeader = "x-signature"

type dePayConfig struct {
	IntegrationID     string
	Receiver          string
	Blockchain        string
	TokenAddress      string
	AmountUSDT        decimal.Decimal
	CreditUSD         int64
	DynamicPrivateKey string
	CallbackPublicKey string
}

type dePayOrderRequest struct {
	Amount int64 `json:"amount"`
}

type dePayCallbackPayload struct {
	Blockchain    string          `json:"blockchain"`
	Transaction   string          `json:"transaction"`
	Receiver      string          `json:"receiver"`
	Token         string          `json:"token"`
	Amount        json.RawMessage `json:"amount"`
	Commitment    string          `json:"commitment"`
	Confirmations int             `json:"confirmations"`
	Payload       json.RawMessage `json:"payload"`
	Status        string          `json:"status"`
}

func getDePayConfig() dePayConfig {
	amount, err := decimal.NewFromString(strings.TrimSpace(os.Getenv("DEPAY_AMOUNT_USDT")))
	if err != nil || amount.LessThanOrEqual(decimal.Zero) {
		amount = decimal.NewFromInt(10)
	}
	credit, err := strconv.ParseInt(strings.TrimSpace(os.Getenv("DEPAY_CREDIT_USD")), 10, 64)
	if err != nil || credit <= 0 {
		credit = 10
	}
	return dePayConfig{
		IntegrationID:     strings.TrimSpace(os.Getenv("DEPAY_INTEGRATION_ID")),
		Receiver:          strings.TrimSpace(os.Getenv("DEPAY_RECEIVER_ADDRESS")),
		Blockchain:        strings.ToLower(strings.TrimSpace(os.Getenv("DEPAY_BLOCKCHAIN"))),
		TokenAddress:      strings.TrimSpace(os.Getenv("DEPAY_TOKEN_ADDRESS")),
		AmountUSDT:        amount,
		CreditUSD:         credit,
		DynamicPrivateKey: strings.TrimSpace(os.Getenv("DEPAY_DYNAMIC_PRIVATE_KEY_FILE")),
		CallbackPublicKey: strings.TrimSpace(os.Getenv("DEPAY_CALLBACK_PUBLIC_KEY_FILE")),
	}
}

func isDePayTopUpEnabled() bool {
	if !isPaymentComplianceConfirmed() {
		return false
	}

	cfg := getDePayConfig()
	if cfg.IntegrationID == "" || cfg.Receiver == "" || cfg.Blockchain == "" || cfg.TokenAddress == "" {
		return false
	}
	if _, err := os.Stat(cfg.DynamicPrivateKey); err != nil {
		return false
	}
	if _, err := os.Stat(cfg.CallbackPublicKey); err != nil {
		return false
	}
	return true
}

func RequestDePay(c *gin.Context) {
	if !isDePayTopUpEnabled() {
		common.ApiErrorMsg(c, "DePay payment is not configured")
		return
	}

	cfg := getDePayConfig()
	var req dePayOrderRequest
	if err := c.ShouldBindJSON(&req); err != nil || req.Amount != cfg.CreditUSD {
		common.ApiErrorMsg(c, fmt.Sprintf("DePay top-up is fixed at %d credits", cfg.CreditUSD))
		return
	}

	userID := c.GetInt("id")
	tradeNo := fmt.Sprintf("DEPAY-%d-%d-%s", userID, time.Now().UnixMilli(), common.GetRandomString(8))
	topUp := &model.TopUp{
		UserId:          userID,
		Amount:          cfg.CreditUSD,
		Money:           cfg.AmountUSDT.InexactFloat64(),
		TradeNo:         tradeNo,
		PaymentMethod:   model.PaymentMethodDePay,
		PaymentProvider: model.PaymentProviderDePay,
		CreateTime:      common.GetTimestamp(),
		Status:          common.TopUpStatusPending,
	}
	if err := topUp.Insert(); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("DePay order creation failed user_id=%d error=%q", userID, err.Error()))
		common.ApiErrorMsg(c, "Failed to create payment order")
		return
	}

	common.ApiSuccess(c, gin.H{
		"integration_id": cfg.IntegrationID,
		"order_id":       tradeNo,
		"amount":         cfg.AmountUSDT.String(),
		"credit":         cfg.CreditUSD,
	})
}

func DePayDynamicConfig(c *gin.Context) {
	cfg := getDePayConfig()
	if !isDePayTopUpEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "DePay payment is not configured"})
		return
	}

	body, err := readDePayBody(c)
	if err != nil || verifyDePaySignature(body, c.GetHeader(dePaySignatureHeader), cfg.CallbackPublicKey) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	tradeNo, err := extractDePayTradeNo(body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order reference"})
		return
	}
	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil || topUp.PaymentProvider != model.PaymentProviderDePay || topUp.Status != common.TopUpStatusPending ||
		topUp.Amount != cfg.CreditUSD || !decimal.NewFromFloat(topUp.Money).Equal(cfg.AmountUSDT) {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment order not found"})
		return
	}

	response := gin.H{
		"accept": []gin.H{{
			"blockchain": cfg.Blockchain,
			"amount":     cfg.AmountUSDT.String(),
			"token":      cfg.TokenAddress,
			"receiver":   cfg.Receiver,
		}},
		"payload":    gin.H{"trade_no": tradeNo},
		"forward_to": paymentReturnPath("/wallet?show_history=true"),
	}
	responseBody, err := json.Marshal(response)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to build payment configuration"})
		return
	}
	signature, err := signDePayResponse(responseBody, cfg.DynamicPrivateKey)
	if err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("DePay response signing failed trade_no=%s error=%q", tradeNo, err.Error()))
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to sign payment configuration"})
		return
	}

	c.Header(dePaySignatureHeader, signature)
	c.Data(http.StatusOK, "application/json; charset=utf-8", responseBody)
}

func DePayCallback(c *gin.Context) {
	cfg := getDePayConfig()
	if !isDePayTopUpEnabled() {
		c.JSON(http.StatusServiceUnavailable, gin.H{"error": "DePay payment is not configured"})
		return
	}

	body, err := readDePayBody(c)
	if err != nil || verifyDePaySignature(body, c.GetHeader(dePaySignatureHeader), cfg.CallbackPublicKey) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	var callback dePayCallbackPayload
	if err := json.Unmarshal(body, &callback); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid callback"})
		return
	}
	tradeNo, err := extractDePayTradeNo(callback.Payload)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid order reference"})
		return
	}
	if err := validateDePayCallback(callback, cfg); err != nil {
		logger.LogWarn(c.Request.Context(), fmt.Sprintf("DePay callback rejected trade_no=%s reason=%q", tradeNo, err.Error()))
		c.JSON(http.StatusBadRequest, gin.H{"error": "payment details do not match"})
		return
	}

	topUp := model.GetTopUpByTradeNo(tradeNo)
	if topUp == nil || topUp.PaymentProvider != model.PaymentProviderDePay ||
		topUp.Amount != cfg.CreditUSD || !decimal.NewFromFloat(topUp.Money).Equal(cfg.AmountUSDT) {
		c.JSON(http.StatusNotFound, gin.H{"error": "payment order not found"})
		return
	}
	if err := model.RechargeDePay(tradeNo, callback.Transaction, c.ClientIP()); err != nil {
		logger.LogError(c.Request.Context(), fmt.Sprintf("DePay credit failed trade_no=%s transaction=%s error=%q", tradeNo, callback.Transaction, err.Error()))
		c.JSON(http.StatusConflict, gin.H{"error": "payment could not be credited"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"forward_to": paymentReturnPath("/wallet?show_history=true")})
}

func DePayEvents(c *gin.Context) {
	cfg := getDePayConfig()
	body, err := readDePayBody(c)
	if err != nil || cfg.CallbackPublicKey == "" ||
		verifyDePaySignature(body, c.GetHeader(dePaySignatureHeader), cfg.CallbackPublicKey) != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid signature"})
		return
	}

	var event dePayCallbackPayload
	if err := json.Unmarshal(body, &event); err == nil {
		if tradeNo, extractErr := extractDePayTradeNo(event.Payload); extractErr == nil {
			logger.LogInfo(c.Request.Context(), fmt.Sprintf("DePay event trade_no=%s status=%s", tradeNo, event.Status))
		}
	}
	c.JSON(http.StatusOK, gin.H{"received": true})
}

func readDePayBody(c *gin.Context) ([]byte, error) {
	if c.Request.Body == nil {
		return nil, errors.New("empty body")
	}
	body, err := io.ReadAll(io.LimitReader(c.Request.Body, 64*1024))
	if err != nil || len(body) == 0 {
		return nil, errors.New("empty body")
	}
	return body, nil
}

func validateDePayCallback(callback dePayCallbackPayload, cfg dePayConfig) error {
	if callback.Transaction == "" {
		return errors.New("missing transaction")
	}
	if strings.ToLower(strings.TrimSpace(callback.Blockchain)) != cfg.Blockchain {
		return errors.New("blockchain mismatch")
	}
	if !equalDePayIdentifier(callback.Receiver, cfg.Receiver) {
		return errors.New("receiver mismatch")
	}
	if !equalDePayIdentifier(callback.Token, cfg.TokenAddress) {
		return errors.New("token mismatch")
	}
	amount, err := parseDePayAmount(callback.Amount)
	if err != nil || !amount.Equal(cfg.AmountUSDT) {
		return errors.New("amount mismatch")
	}
	commitment := strings.ToLower(strings.TrimSpace(callback.Commitment))
	if commitment != "confirmed" && commitment != "finalized" {
		return errors.New("payment not confirmed")
	}
	return nil
}

func equalDePayIdentifier(actual string, expected string) bool {
	actual = strings.TrimSpace(actual)
	expected = strings.TrimSpace(expected)
	if strings.HasPrefix(actual, "0x") && strings.HasPrefix(expected, "0x") {
		return strings.EqualFold(actual, expected)
	}
	return actual == expected
}

func parseDePayAmount(raw json.RawMessage) (decimal.Decimal, error) {
	var value any
	if err := json.Unmarshal(raw, &value); err != nil {
		return decimal.Zero, err
	}
	switch amount := value.(type) {
	case string:
		return decimal.NewFromString(amount)
	case float64:
		return decimal.NewFromFloat(amount), nil
	default:
		return decimal.Zero, errors.New("invalid amount")
	}
}

func extractDePayTradeNo(raw []byte) (string, error) {
	var value any
	if err := json.Unmarshal(raw, &value); err != nil {
		return "", err
	}
	if tradeNo := findDePayTradeNo(value); tradeNo != "" {
		return tradeNo, nil
	}
	return "", errors.New("trade_no not found")
}

func findDePayTradeNo(value any) string {
	switch current := value.(type) {
	case map[string]any:
		if tradeNo, ok := current["trade_no"].(string); ok {
			return strings.TrimSpace(tradeNo)
		}
		for _, key := range []string{"payload", "injected"} {
			if nested, ok := current[key]; ok {
				if tradeNo := findDePayTradeNo(nested); tradeNo != "" {
					return tradeNo
				}
			}
		}
	}
	return ""
}

func verifyDePaySignature(body []byte, encodedSignature string, publicKeyPath string) error {
	signature, err := decodeDePaySignature(encodedSignature)
	if err != nil {
		return err
	}
	publicKey, err := loadDePayPublicKey(publicKeyPath)
	if err != nil {
		return err
	}
	digest := sha256.Sum256(body)
	return rsa.VerifyPSS(publicKey, crypto.SHA256, digest[:], signature, &rsa.PSSOptions{
		SaltLength: 64,
		Hash:       crypto.SHA256,
	})
}

func signDePayResponse(body []byte, privateKeyPath string) (string, error) {
	privateKey, err := loadDePayPrivateKey(privateKeyPath)
	if err != nil {
		return "", err
	}
	digest := sha256.Sum256(body)
	signature, err := rsa.SignPSS(rand.Reader, privateKey, crypto.SHA256, digest[:], &rsa.PSSOptions{
		SaltLength: 64,
		Hash:       crypto.SHA256,
	})
	if err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(signature), nil
}

func decodeDePaySignature(value string) ([]byte, error) {
	value = strings.TrimSpace(value)
	if value == "" {
		return nil, errors.New("missing signature")
	}
	for _, encoding := range []*base64.Encoding{
		base64.RawURLEncoding,
		base64.URLEncoding,
		base64.RawStdEncoding,
		base64.StdEncoding,
	} {
		if decoded, err := encoding.DecodeString(value); err == nil {
			return decoded, nil
		}
	}
	return nil, errors.New("invalid signature encoding")
}

func loadDePayPrivateKey(path string) (*rsa.PrivateKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("invalid private key PEM")
	}
	if key, err := x509.ParsePKCS1PrivateKey(block.Bytes); err == nil {
		return key, nil
	}
	key, err := x509.ParsePKCS8PrivateKey(block.Bytes)
	if err != nil {
		return nil, err
	}
	rsaKey, ok := key.(*rsa.PrivateKey)
	if !ok {
		return nil, errors.New("private key is not RSA")
	}
	return rsaKey, nil
}

func loadDePayPublicKey(path string) (*rsa.PublicKey, error) {
	data, err := os.ReadFile(path)
	if err != nil {
		return nil, err
	}
	block, _ := pem.Decode(data)
	if block == nil {
		return nil, errors.New("invalid public key PEM")
	}
	if key, err := x509.ParsePKCS1PublicKey(block.Bytes); err == nil {
		return key, nil
	}
	if parsed, err := x509.ParsePKIXPublicKey(block.Bytes); err == nil {
		if key, ok := parsed.(*rsa.PublicKey); ok {
			return key, nil
		}
	}
	if certificate, err := x509.ParseCertificate(block.Bytes); err == nil {
		if key, ok := certificate.PublicKey.(*rsa.PublicKey); ok {
			return key, nil
		}
	}
	return nil, errors.New("public key is not RSA")
}
