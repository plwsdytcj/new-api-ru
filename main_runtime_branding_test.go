package main

import (
	"strings"
	"testing"
)

func TestInjectRuntimeBranding(t *testing.T) {
	originalIndexPage := indexPage
	t.Cleanup(func() { indexPage = originalIndexPage })

	indexPage = []byte(`<!doctype html>
<link rel="canonical" href="__RUNTIME_PUBLIC_URL__/" />
<!--runtime-config-->
<title>__RUNTIME_BROWSER_TITLE__</title>
<meta name="title" content="__RUNTIME_BROWSER_TITLE__" />`)
	t.Setenv("PUBLIC_URL", "https://example.com/")
	t.Setenv("BROWSER_TITLE", `Example <AI>`)

	if err := InjectRuntimeBranding(); err != nil {
		t.Fatalf("InjectRuntimeBranding() error = %v", err)
	}

	rendered := string(indexPage)
	for _, expected := range []string{
		`href="https://example.com/"`,
		`<title>Example &lt;AI&gt;</title>`,
		`window.__RUNTIME_CONFIG__={"browserTitle":"Example \u003cAI\u003e","publicUrl":"https://example.com"}`,
	} {
		if !strings.Contains(rendered, expected) {
			t.Errorf("rendered index does not contain %q:\n%s", expected, rendered)
		}
	}
}

func TestInjectRuntimeBrandingRejectsInvalidPublicURL(t *testing.T) {
	originalIndexPage := indexPage
	t.Cleanup(func() { indexPage = originalIndexPage })

	indexPage = []byte("__RUNTIME_PUBLIC_URL__")
	t.Setenv("PUBLIC_URL", "javascript:alert(1)")

	if err := InjectRuntimeBranding(); err == nil {
		t.Fatal("InjectRuntimeBranding() expected an error")
	}
}
