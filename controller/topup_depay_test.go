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
	"os"
	"path/filepath"
	"testing"

	"github.com/shopspring/decimal"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func writeDePayTestKeys(t *testing.T) (string, string) {
	t.Helper()
	key, err := rsa.GenerateKey(rand.Reader, 2048)
	require.NoError(t, err)

	dir := t.TempDir()
	privatePath := filepath.Join(dir, "private.pem")
	publicPath := filepath.Join(dir, "public.pem")

	privatePEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PRIVATE KEY",
		Bytes: mustMarshalPKCS8(t, key),
	})
	publicPEM := pem.EncodeToMemory(&pem.Block{
		Type:  "PUBLIC KEY",
		Bytes: mustMarshalPKIX(t, &key.PublicKey),
	})
	require.NoError(t, os.WriteFile(privatePath, privatePEM, 0o600))
	require.NoError(t, os.WriteFile(publicPath, publicPEM, 0o600))
	return privatePath, publicPath
}

func mustMarshalPKCS8(t *testing.T, key *rsa.PrivateKey) []byte {
	t.Helper()
	value, err := x509.MarshalPKCS8PrivateKey(key)
	require.NoError(t, err)
	return value
}

func mustMarshalPKIX(t *testing.T, key *rsa.PublicKey) []byte {
	t.Helper()
	value, err := x509.MarshalPKIXPublicKey(key)
	require.NoError(t, err)
	return value
}

func TestDePayResponseSignatureRoundTrip(t *testing.T) {
	privatePath, publicPath := writeDePayTestKeys(t)
	body := []byte(`{"accept":[{"amount":"10"}]}`)

	signature, err := signDePayResponse(body, privatePath)
	require.NoError(t, err)
	require.NoError(t, verifyDePaySignature(body, signature, publicPath))
	assert.Error(t, verifyDePaySignature([]byte(`{"amount":"1"}`), signature, publicPath))
}

func TestVerifyDePaySignatureAcceptsStandardBase64(t *testing.T) {
	privatePath, publicPath := writeDePayTestKeys(t)
	body := []byte(`{"trade_no":"DEPAY-1"}`)
	privateKey, err := loadDePayPrivateKey(privatePath)
	require.NoError(t, err)

	digest := sha256.Sum256(body)
	signature, err := rsa.SignPSS(rand.Reader, privateKey, crypto.SHA256, digest[:], &rsa.PSSOptions{
		SaltLength: 64,
		Hash:       crypto.SHA256,
	})
	require.NoError(t, err)
	require.NoError(t, verifyDePaySignature(body, base64.StdEncoding.EncodeToString(signature), publicPath))
}

func TestExtractDePayTradeNoFromNestedPayload(t *testing.T) {
	tradeNo, err := extractDePayTradeNo([]byte(`{"payload":{"injected":{"trade_no":"DEPAY-42"}}}`))
	require.NoError(t, err)
	assert.Equal(t, "DEPAY-42", tradeNo)
}

func TestValidateDePayCallback(t *testing.T) {
	amount, err := json.Marshal("10")
	require.NoError(t, err)

	cfg := dePayConfig{
		Receiver:     "0xReceiver",
		Blockchain:   "ethereum",
		TokenAddress: "0xToken",
		AmountUSDT:   decimal.NewFromInt(10),
	}
	callback := dePayCallbackPayload{
		Blockchain:  "ethereum",
		Transaction: "0xTransaction",
		Receiver:    "0xreceiver",
		Token:       "0xtoken",
		Amount:      amount,
		Commitment:  "confirmed",
	}
	require.NoError(t, validateDePayCallback(callback, cfg))

	callback.Amount = json.RawMessage(`"9.99"`)
	assert.Error(t, validateDePayCallback(callback, cfg))
}

func TestEqualDePayIdentifierPreservesNonEVMCase(t *testing.T) {
	assert.True(t, equalDePayIdentifier("0xABC", "0xabc"))
	assert.False(t, equalDePayIdentifier("SolanaAddressA", "solanaaddressa"))
}
