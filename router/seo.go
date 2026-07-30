package router

import (
	"bytes"
	"encoding/json"
	"fmt"
	"html"
	"net/url"
	"path"
	"strings"
)

type seoPage struct {
	Title       string
	Description string
	Heading     string
	Summary     string
	Details     []seoDetail
}

type seoDetail struct {
	Heading string
	Summary string
}

var publicSEOPages = map[string]seoPage{
	"/": {
		Title:       "GPT API в России — модели США и Китая | RussiaAPI",
		Description: "OpenAI-совместимый GPT API для разработчиков в России. Единый интерфейс для американских и китайских ИИ-моделей, включая GPT, Kimi, DeepSeek и Qwen.",
		Heading:     "GPT API и ведущие ИИ-модели в России",
		Summary:     "Подключайте GPT и OpenAI-совместимые клиенты через российскую точку доступа. RussiaAPI объединяет маршрутизацию, резервирование, ключи и учёт расходов.",
		Details: []seoDetail{
			{
				Heading: "Американские ИИ-модели через единый API",
				Summary: "Используйте единый OpenAI-совместимый формат для GPT и интеграций с моделями американских поставщиков. Доступность конкретной модели и актуальная цена указаны в каталоге тарифов.",
			},
			{
				Heading: "Китайские ИИ-модели: Kimi, DeepSeek и Qwen",
				Summary: "RussiaAPI развивает единый интерфейс для китайских моделей Kimi от Moonshot AI, DeepSeek и Qwen. Текущий список доступных моделей публикуется на странице тарифов.",
			},
		},
	},
	"/pricing": {
		Title:       "Цены на GPT API в России и каталог моделей — RussiaAPI",
		Description: "Актуальные цены GPT API в России и каталог американских и китайских ИИ-моделей. Сравнение стоимости токенов и оплата по фактическому использованию.",
		Heading:     "Цены на модели",
		Summary:     "Сравните стоимость входных и выходных токенов GPT и других доступных моделей. Каталог обновляется по мере подключения американских и китайских поставщиков.",
	},
	"/docs": {
		Title:       "Документация RussiaAPI — подключение OpenAI API, Claude Code и Codex",
		Description: "Русская документация RussiaAPI: получение API-ключа, OpenAI-совместимые запросы, настройка Claude Code, Codex и обработка ошибок.",
		Heading:     "Документация RussiaAPI",
		Summary:     "Инструкции по созданию API-ключа, замене Base URL, отправке первого запроса и подключению Claude Code, Codex и OpenAI SDK.",
	},
	"/about": {
		Title:       "О RussiaAPI — инфраструктура доступа к ИИ-моделям",
		Description: "RussiaAPI объединяет доступ к ведущим ИИ-моделям через совместимый API с маршрутизацией, резервированием и контролем расходов.",
		Heading:     "О RussiaAPI",
		Summary:     "RussiaAPI — инфраструктурный сервис для разработчиков и команд, которым нужен единый интерфейс доступа к нескольким поставщикам ИИ-моделей.",
	},
	"/user-agreement": {
		Title:       "Пользовательское соглашение — RussiaAPI",
		Description: "Условия использования сервиса RussiaAPI, правила доступа к API, обязанности пользователя и ограничения предоставляемых услуг.",
		Heading:     "Пользовательское соглашение",
		Summary:     "Правила использования RussiaAPI, порядок предоставления доступа к сервису и основные права и обязанности пользователей.",
	},
	"/privacy-policy": {
		Title:       "Политика конфиденциальности — RussiaAPI",
		Description: "Информация о сборе, обработке, хранении и защите персональных данных пользователей RussiaAPI.",
		Heading:     "Политика конфиденциальности",
		Summary:     "Порядок обработки и защиты персональных данных, технической информации и данных учётной записи пользователей RussiaAPI.",
	},
	"/refund-policy": {
		Title:       "Правила возврата средств — RussiaAPI",
		Description: "Условия и порядок рассмотрения запросов на возврат неиспользованного баланса и ошибочных платежей в RussiaAPI.",
		Heading:     "Правила возврата средств",
		Summary:     "Условия подачи и рассмотрения запросов на возврат средств, сроки обработки и необходимые сведения о платеже.",
	},
	"/billing-policy": {
		Title:       "Правила тарификации — RussiaAPI",
		Description: "Правила расчёта стоимости запросов, списания баланса и отображения использования моделей в RussiaAPI.",
		Heading:     "Правила тарификации",
		Summary:     "Описание единиц тарификации, расчёта стоимости входных и выходных токенов, списания баланса и учёта запросов.",
	},
	"/receipt-policy": {
		Title:       "Информация о платежах и чеках — RussiaAPI",
		Description: "Информация RussiaAPI о подтверждении платежей, истории операций и документах, связанных с пополнением баланса.",
		Heading:     "Информация о платежах и чеках",
		Summary:     "Порядок подтверждения пополнений, отображения операций и предоставления доступных платёжных документов.",
	},
}

var knownSPAExactPaths = map[string]struct{}{
	"/401":             {},
	"/403":             {},
	"/404":             {},
	"/500":             {},
	"/503":             {},
	"/forgot-password": {},
	"/oauth":           {},
	"/otp":             {},
	"/register":        {},
	"/reset":           {},
	"/setup":           {},
	"/sign-in":         {},
	"/sign-up":         {},
}

var knownSPAPrefixes = []string{
	"/channels",
	"/chat",
	"/chat2link",
	"/dashboard",
	"/errors",
	"/keys",
	"/models",
	"/oauth",
	"/playground",
	"/pricing",
	"/profile",
	"/rankings",
	"/redemption-codes",
	"/subscriptions",
	"/support",
	"/system-info",
	"/system-settings",
	"/usage-logs",
	"/user",
	"/users",
	"/wallet",
}

func normalizeWebPath(requestPath string) string {
	cleaned := path.Clean("/" + strings.TrimSpace(requestPath))
	if cleaned == "." {
		return "/"
	}
	return cleaned
}

func isKnownSPAPath(requestPath string) bool {
	if _, ok := publicSEOPages[requestPath]; ok {
		return true
	}
	if _, ok := knownSPAExactPaths[requestPath]; ok {
		return true
	}
	for _, prefix := range knownSPAPrefixes {
		if requestPath == prefix || strings.HasPrefix(requestPath, prefix+"/") {
			return true
		}
	}
	return false
}

func canonicalURL(publicURL string, requestPath string) string {
	if requestPath == "/" {
		return strings.TrimRight(publicURL, "/") + "/"
	}
	return strings.TrimRight(publicURL, "/") + requestPath
}

func renderSEOIndex(indexPage []byte, publicURL string, requestPath string, page seoPage, indexable bool) []byte {
	canonical := canonicalURL(publicURL, requestPath)
	robots := "noindex, nofollow"
	if indexable {
		robots = "index, follow, max-image-preview:large"
	}

	rendered := bytes.Clone(indexPage)
	rendered = replaceHTMLTag(rendered, "title", html.EscapeString(page.Title))
	rendered = replaceMetaContent(rendered, "title", page.Title)
	rendered = replaceMetaContent(rendered, "description", page.Description)
	rendered = replaceLinkHref(rendered, "canonical", canonical)
	rendered = bytes.Replace(rendered, []byte("<html lang=\"ru\">"), []byte("<html lang=\"ru\" data-seo-rendered=\"true\">"), 1)

	headMarkup := buildSEOHead(page, canonical, robots, publicURL, requestPath)
	rendered = bytes.Replace(rendered, []byte("<!--seo-head-->"), []byte(headMarkup), 1)

	staticMarkup := ""
	if indexable {
		var builder strings.Builder
		fmt.Fprintf(
			&builder,
			`<main id="seo-static-content"><h1>%s</h1><p>%s</p>`,
			html.EscapeString(page.Heading),
			html.EscapeString(page.Summary),
		)
		for _, detail := range page.Details {
			fmt.Fprintf(
				&builder,
				`<section><h2>%s</h2><p>%s</p></section>`,
				html.EscapeString(detail.Heading),
				html.EscapeString(detail.Summary),
			)
		}
		builder.WriteString(`</main>`)
		staticMarkup = builder.String()
	}
	rendered = bytes.Replace(rendered, []byte("<!--seo-static-content-->"), []byte(staticMarkup), 1)
	return rendered
}

func replaceHTMLTag(document []byte, tag string, escapedContent string) []byte {
	open := []byte("<" + tag + ">")
	close := []byte("</" + tag + ">")
	start := bytes.Index(document, open)
	if start < 0 {
		return document
	}
	endOffset := bytes.Index(document[start+len(open):], close)
	if endOffset < 0 {
		return document
	}
	end := start + len(open) + endOffset + len(close)
	replacement := []byte("<" + tag + ">" + escapedContent + "</" + tag + ">")
	return append(append(bytes.Clone(document[:start]), replacement...), document[end:]...)
}

func replaceMetaContent(document []byte, name string, content string) []byte {
	marker := []byte(`name="` + name + `"`)
	markerIndex := bytes.Index(document, marker)
	if markerIndex < 0 {
		return document
	}
	tagStart := bytes.LastIndex(document[:markerIndex], []byte("<meta"))
	tagEndOffset := bytes.Index(document[markerIndex:], []byte(">"))
	if tagStart < 0 || tagEndOffset < 0 {
		return document
	}
	tagEnd := markerIndex + tagEndOffset + 1
	replacement := []byte(fmt.Sprintf(
		`<meta name="%s" content="%s" />`,
		html.EscapeString(name),
		html.EscapeString(content),
	))
	return append(append(bytes.Clone(document[:tagStart]), replacement...), document[tagEnd:]...)
}

func replaceLinkHref(document []byte, rel string, href string) []byte {
	marker := []byte(`rel="` + rel + `"`)
	markerIndex := bytes.Index(document, marker)
	if markerIndex < 0 {
		return document
	}
	tagStart := bytes.LastIndex(document[:markerIndex], []byte("<link"))
	tagEndOffset := bytes.Index(document[markerIndex:], []byte(">"))
	if tagStart < 0 || tagEndOffset < 0 {
		return document
	}
	tagEnd := markerIndex + tagEndOffset + 1
	replacement := []byte(fmt.Sprintf(
		`<link rel="%s" href="%s" />`,
		html.EscapeString(rel),
		html.EscapeString(href),
	))
	return append(append(bytes.Clone(document[:tagStart]), replacement...), document[tagEnd:]...)
}

func buildSEOHead(page seoPage, canonical string, robots string, publicURL string, requestPath string) string {
	var builder strings.Builder
	fmt.Fprintf(&builder, `<meta name="robots" content="%s" />`, html.EscapeString(robots))
	fmt.Fprintf(&builder, `<meta property="og:locale" content="ru_RU" />`)
	fmt.Fprintf(&builder, `<meta property="og:type" content="website" />`)
	fmt.Fprintf(&builder, `<meta property="og:site_name" content="RussiaAPI" />`)
	fmt.Fprintf(&builder, `<meta property="og:title" content="%s" />`, html.EscapeString(page.Title))
	fmt.Fprintf(&builder, `<meta property="og:description" content="%s" />`, html.EscapeString(page.Description))
	fmt.Fprintf(&builder, `<meta property="og:url" content="%s" />`, html.EscapeString(canonical))
	fmt.Fprintf(&builder, `<meta property="og:image" content="%s/android-chrome-512x512.png" />`, html.EscapeString(strings.TrimRight(publicURL, "/")))
	fmt.Fprintf(&builder, `<meta name="twitter:card" content="summary" />`)
	fmt.Fprintf(&builder, `<meta name="twitter:title" content="%s" />`, html.EscapeString(page.Title))
	fmt.Fprintf(&builder, `<meta name="twitter:description" content="%s" />`, html.EscapeString(page.Description))

	schema := buildStructuredData(page, canonical, publicURL, requestPath)
	if encoded, err := json.Marshal(schema); err == nil {
		fmt.Fprintf(&builder, `<script type="application/ld+json">%s</script>`, encoded)
	}
	return builder.String()
}

func buildStructuredData(page seoPage, canonical string, publicURL string, requestPath string) map[string]any {
	baseURL := strings.TrimRight(publicURL, "/")
	graph := []any{
		map[string]any{
			"@type": "Organization",
			"@id":   baseURL + "/#organization",
			"name":  "RussiaAPI",
			"url":   baseURL + "/",
			"logo":  baseURL + "/apple-touch-icon.png",
		},
		map[string]any{
			"@type":       "WebSite",
			"@id":         baseURL + "/#website",
			"url":         baseURL + "/",
			"name":        "RussiaAPI",
			"inLanguage":  "ru-RU",
			"publisher":   map[string]string{"@id": baseURL + "/#organization"},
			"description": publicSEOPages["/"].Description,
		},
		map[string]any{
			"@type":       "WebPage",
			"@id":         canonical + "#webpage",
			"url":         canonical,
			"name":        page.Title,
			"description": page.Description,
			"inLanguage":  "ru-RU",
			"isPartOf":    map[string]string{"@id": baseURL + "/#website"},
			"about":       map[string]string{"@id": baseURL + "/#organization"},
		},
	}

	if requestPath == "/" {
		graph = append(graph, map[string]any{
			"@type":               "SoftwareApplication",
			"name":                "RussiaAPI",
			"url":                 baseURL + "/",
			"applicationCategory": "DeveloperApplication",
			"operatingSystem":     "Web",
			"description":         page.Description,
		})
	} else {
		graph = append(graph, map[string]any{
			"@type": "BreadcrumbList",
			"itemListElement": []any{
				map[string]any{
					"@type":    "ListItem",
					"position": 1,
					"name":     "Главная",
					"item":     baseURL + "/",
				},
				map[string]any{
					"@type":    "ListItem",
					"position": 2,
					"name":     page.Heading,
					"item":     canonical,
				},
			},
		})
	}

	return map[string]any{
		"@context": "https://schema.org",
		"@graph":   graph,
	}
}

func buildRobotsTXT(publicURL string) string {
	baseURL := strings.TrimRight(publicURL, "/")
	return strings.Join([]string{
		"User-agent: *",
		"Allow: /",
		"Disallow: /api/",
		"Disallow: /v1/",
		"Disallow: /dashboard",
		"Disallow: /system-settings",
		"Disallow: /oauth",
		"",
		"Sitemap: " + baseURL + "/sitemap.xml",
		"",
	}, "\n")
}

func buildSitemapXML(publicURL string) string {
	baseURL := strings.TrimRight(publicURL, "/")
	orderedPaths := []string{
		"/",
		"/pricing",
		"/docs",
		"/about",
		"/user-agreement",
		"/privacy-policy",
		"/refund-policy",
		"/billing-policy",
		"/receipt-policy",
	}

	var builder strings.Builder
	builder.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
	builder.WriteString("\n")
	builder.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`)
	builder.WriteString("\n")
	for _, pagePath := range orderedPaths {
		location := canonicalURL(baseURL, pagePath)
		fmt.Fprintf(&builder, "  <url><loc>%s</loc></url>\n", html.EscapeString(location))
	}
	builder.WriteString("</urlset>\n")
	return builder.String()
}

func validPublicURL(rawURL string) bool {
	parsed, err := url.Parse(rawURL)
	return err == nil &&
		(parsed.Scheme == "http" || parsed.Scheme == "https") &&
		parsed.Host != "" &&
		parsed.User == nil &&
		(parsed.Path == "" || parsed.Path == "/") &&
		parsed.RawQuery == "" &&
		parsed.Fragment == ""
}
