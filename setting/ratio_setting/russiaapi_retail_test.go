package ratio_setting

import (
	"math"
	"testing"
)

func TestRussiaAPIRetailTokenPrices(t *testing.T) {
	InitRatioSettings()

	tests := []struct {
		model          string
		inputPerM      float64
		outputPerM     float64
		completionRate float64
	}{
		{"gpt-5.4", 0.26, 1.56, 6},
		{"gpt-5.4-mini", 0.18, 1.08, 6},
		{"gpt-5.5", 0.35, 2.80, 8},
		{"gpt-5.5-openai-compact", 0.35, 2.80, 8},
		{"gpt-5.6-luna", 0.18, 1.44, 8},
		{"gpt-5.6-sol", 0.52, 4.16, 8},
		{"gpt-5.6-terra", 0.26, 2.08, 8},
	}

	for _, tt := range tests {
		t.Run(tt.model, func(t *testing.T) {
			ratio, ok, _ := GetModelRatio(tt.model)
			if !ok {
				t.Fatalf("model ratio is not configured")
			}
			if got := ratio * 2; math.Abs(got-tt.inputPerM) > 1e-9 {
				t.Fatalf("input price = %v, want %v", got, tt.inputPerM)
			}
			if got := GetCompletionRatio(tt.model); math.Abs(got-tt.completionRate) > 1e-9 {
				t.Fatalf("completion ratio = %v, want %v", got, tt.completionRate)
			}
			if got := ratio * 2 * GetCompletionRatio(tt.model); math.Abs(got-tt.outputPerM) > 1e-9 {
				t.Fatalf("output price = %v, want %v", got, tt.outputPerM)
			}
		})
	}
}

func TestRussiaAPIRetailImagePrices(t *testing.T) {
	InitRatioSettings()

	tests := map[string]float64{
		"gpt-image-2":         0.11,
		"gpt-image-2-firefly": 0.14,
	}

	for model, want := range tests {
		got, ok := GetModelPrice(model, false)
		if !ok {
			t.Fatalf("%s fixed price is not configured", model)
		}
		if math.Abs(got-want) > 1e-9 {
			t.Fatalf("%s fixed price = %v, want %v", model, got, want)
		}
	}
}
