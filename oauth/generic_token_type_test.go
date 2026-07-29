package oauth

import (
	"testing"

	"github.com/QuantumNous/new-api/model"
	"github.com/stretchr/testify/require"
)

func TestGenericOAuthAuthorizationTokenType(t *testing.T) {
	tests := []struct {
		name      string
		icon      string
		endpoint  string
		tokenType string
		want      string
	}{
		{
			name:      "yandex icon uses OAuth scheme",
			icon:      "yandex",
			endpoint:  "https://login.yandex.ru/info?format=json",
			tokenType: "bearer",
			want:      "OAuth",
		},
		{
			name:      "yandex endpoint uses OAuth scheme",
			endpoint:  "https://login.yandex.com/info?format=json",
			tokenType: "Bearer",
			want:      "OAuth",
		},
		{
			name:      "standard provider keeps bearer scheme",
			icon:      "google",
			endpoint:  "https://openidconnect.googleapis.com/v1/userinfo",
			tokenType: "bearer",
			want:      "bearer",
		},
		{
			name:     "empty token type defaults to Bearer",
			endpoint: "https://example.com/userinfo",
			want:     "Bearer",
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			provider := NewGenericOAuthProvider(&model.CustomOAuthProvider{
				Icon:             test.icon,
				UserInfoEndpoint: test.endpoint,
			})
			require.Equal(
				t,
				test.want,
				provider.authorizationTokenType(test.tokenType),
			)
		})
	}
}
