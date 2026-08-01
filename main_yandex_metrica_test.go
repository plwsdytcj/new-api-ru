package main

import (
	"os"
	"strings"
	"testing"
)

func TestInjectYandexMetricaAnalytics(t *testing.T) {
	originalIndexPage := indexPage
	originalCounterID, hadCounterID := os.LookupEnv("YANDEX_METRICA_ID")
	t.Cleanup(func() {
		indexPage = originalIndexPage
		if hadCounterID {
			_ = os.Setenv("YANDEX_METRICA_ID", originalCounterID)
		} else {
			_ = os.Unsetenv("YANDEX_METRICA_ID")
		}
	})

	indexPage = []byte("<head><!--Yandex Metrica-->\n</head><body><!--Yandex Metrica noscript-->\n</body>")
	_ = os.Setenv("YANDEX_METRICA_ID", "111210946")

	if err := InjectYandexMetricaAnalytics(); err != nil {
		t.Fatalf("InjectYandexMetricaAnalytics() error = %v", err)
	}
	rendered := string(indexPage)
	for _, expected := range []string{
		"tag.js?id=111210946",
		"ym(111210946,'init'",
		"mc.yandex.ru/watch/111210946",
	} {
		if !strings.Contains(rendered, expected) {
			t.Fatalf("rendered page does not contain %q", expected)
		}
	}
}

func TestInjectYandexMetricaAnalyticsRejectsInvalidID(t *testing.T) {
	originalIndexPage := indexPage
	originalCounterID, hadCounterID := os.LookupEnv("YANDEX_METRICA_ID")
	t.Cleanup(func() {
		indexPage = originalIndexPage
		if hadCounterID {
			_ = os.Setenv("YANDEX_METRICA_ID", originalCounterID)
		} else {
			_ = os.Unsetenv("YANDEX_METRICA_ID")
		}
	})

	indexPage = []byte("<!--Yandex Metrica-->\n<!--Yandex Metrica noscript-->\n")
	_ = os.Setenv("YANDEX_METRICA_ID", "bad-id")

	if err := InjectYandexMetricaAnalytics(); err == nil {
		t.Fatal("InjectYandexMetricaAnalytics() error = nil, want validation error")
	}
}
