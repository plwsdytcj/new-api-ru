package router

import (
	"strings"
	"testing"
)

const seoTestIndex = `<!doctype html>
<html lang="ru">
<head>
<link rel="canonical" href="https://example.com/" />
<title>Default</title>
<meta name="title" content="Default" />
<meta name="description" content="Default description" />
<!--seo-head-->
</head>
<body><div id="root"></div><!--seo-static-content--></body>
</html>`

func TestRenderSEOIndexForPublicPage(t *testing.T) {
	page := publicSEOPages["/pricing"]
	rendered := string(renderSEOIndex(
		[]byte(seoTestIndex),
		"https://example.com",
		"/pricing",
		page,
		true,
	))

	for _, expected := range []string{
		`<html lang="ru" data-seo-rendered="true">`,
		`<title>Цены на API GPT, Claude, Gemini и DeepSeek — RussiaAPI</title>`,
		`<link rel="canonical" href="https://example.com/pricing" />`,
		`<meta name="robots" content="index, follow, max-image-preview:large" />`,
		`<main id="seo-static-content">`,
		`application/ld+json`,
		`BreadcrumbList`,
	} {
		if !strings.Contains(rendered, expected) {
			t.Errorf("rendered page does not contain %q:\n%s", expected, rendered)
		}
	}
}

func TestRenderSEOIndexForPrivatePage(t *testing.T) {
	rendered := string(renderSEOIndex(
		[]byte(seoTestIndex),
		"https://example.com",
		"/dashboard",
		seoPage{
			Title:       "RussiaAPI",
			Description: "Private",
		},
		false,
	))

	if !strings.Contains(rendered, `<meta name="robots" content="noindex, nofollow" />`) {
		t.Fatalf("private page is missing noindex:\n%s", rendered)
	}
	if strings.Contains(rendered, `id="seo-static-content"`) {
		t.Fatalf("private page must not expose static SEO content:\n%s", rendered)
	}
}

func TestKnownSPAPaths(t *testing.T) {
	tests := map[string]bool{
		"/":                     true,
		"/pricing":              true,
		"/pricing/gpt-5":        true,
		"/dashboard":            true,
		"/system-settings/site": true,
		"/not-a-real-route":     false,
	}
	for requestPath, expected := range tests {
		if actual := isKnownSPAPath(requestPath); actual != expected {
			t.Errorf("isKnownSPAPath(%q) = %v, want %v", requestPath, actual, expected)
		}
	}
}

func TestBuildRobotsAndSitemap(t *testing.T) {
	robots := buildRobotsTXT("https://example.com")
	for _, expected := range []string{
		"Disallow: /dashboard",
		"Disallow: /system-settings",
		"Sitemap: https://example.com/sitemap.xml",
	} {
		if !strings.Contains(robots, expected) {
			t.Fatalf("robots.txt does not contain %q:\n%s", expected, robots)
		}
	}

	sitemap := buildSitemapXML("https://example.com")
	for _, expected := range []string{
		`<?xml version="1.0" encoding="UTF-8"?>`,
		`<loc>https://example.com/</loc>`,
		`<loc>https://example.com/pricing</loc>`,
		`<loc>https://example.com/docs</loc>`,
	} {
		if !strings.Contains(sitemap, expected) {
			t.Errorf("sitemap does not contain %q:\n%s", expected, sitemap)
		}
	}
}

func TestValidPublicURL(t *testing.T) {
	for _, value := range []string{
		"",
		"javascript:alert(1)",
		"https://user@example.com",
		"https://example.com/path",
	} {
		if validPublicURL(value) {
			t.Errorf("validPublicURL(%q) = true, want false", value)
		}
	}
	if !validPublicURL("https://example.com") {
		t.Fatal("validPublicURL rejected an absolute HTTPS origin")
	}
}
