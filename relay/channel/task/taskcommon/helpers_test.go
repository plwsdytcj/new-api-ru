package taskcommon

import "testing"

func TestIs302AIProxy(t *testing.T) {
	tests := []struct {
		url  string
		want bool
	}{
		{"https://api.302.ai", true},
		{"https://api.302.ai/vidu", true},
		{"https://api.302ai.cn/doubao", true},
		{"https://api.vidu.cn", false},
		{"https://api.302.ai.example.com", false},
		{"://bad", false},
	}
	for _, tt := range tests {
		if got := Is302AIProxy(tt.url); got != tt.want {
			t.Errorf("Is302AIProxy(%q) = %v, want %v", tt.url, got, tt.want)
		}
	}
}
