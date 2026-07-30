package router

import (
	"embed"
	"net/http"
	"strings"

	"github.com/QuantumNous/new-api/common"
	"github.com/QuantumNous/new-api/controller"
	"github.com/QuantumNous/new-api/middleware"
	"github.com/gin-contrib/gzip"
	"github.com/gin-contrib/static"
	"github.com/gin-gonic/gin"
)

// WebAssets holds the embedded dashboard frontend assets.
type WebAssets struct {
	BuildFS   embed.FS
	IndexPage []byte
	PublicURL string
}

func SetWebRouter(router *gin.Engine, assets WebAssets) {
	if !validPublicURL(assets.PublicURL) {
		assets.PublicURL = "https://russiaapi.com"
	}
	frontendFS := common.EmbedFolder(assets.BuildFS, "web/dist")

	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.Use(middleware.GlobalWebRateLimit())
	router.Use(middleware.Cache())
	router.GET("/robots.txt", func(c *gin.Context) {
		c.Header("Cache-Control", "public, max-age=3600")
		c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte(buildRobotsTXT(assets.PublicURL)))
	})
	router.GET("/sitemap.xml", func(c *gin.Context) {
		c.Header("Cache-Control", "public, max-age=3600")
		c.Data(http.StatusOK, "application/xml; charset=utf-8", []byte(buildSitemapXML(assets.PublicURL)))
	})
	router.GET("/index.html", func(c *gin.Context) {
		c.Redirect(http.StatusMovedPermanently, "/")
	})
	router.Use(static.Serve("/", frontendFS))
	router.NoRoute(func(c *gin.Context) {
		c.Set(middleware.RouteTagKey, "web")
		if strings.HasPrefix(c.Request.RequestURI, "/v1") || strings.HasPrefix(c.Request.RequestURI, "/api") || strings.HasPrefix(c.Request.RequestURI, "/assets") {
			controller.RelayNotFound(c)
			return
		}

		requestPath := normalizeWebPath(c.Request.URL.Path)
		c.Header("Cache-Control", "no-cache")
		if page, ok := publicSEOPages[requestPath]; ok {
			c.Data(
				http.StatusOK,
				"text/html; charset=utf-8",
				renderSEOIndex(assets.IndexPage, assets.PublicURL, requestPath, page, true),
			)
			return
		}

		fallbackPage := seoPage{
			Title:       "RussiaAPI",
			Description: "Единый API для доступа к ведущим ИИ-моделям.",
		}
		status := http.StatusOK
		if !isKnownSPAPath(requestPath) {
			status = http.StatusNotFound
			fallbackPage = seoPage{
				Title:       "Страница не найдена — RussiaAPI",
				Description: "Запрошенная страница не существует или была перемещена.",
			}
		}
		c.Header("X-Robots-Tag", "noindex, nofollow")
		c.Data(
			status,
			"text/html; charset=utf-8",
			renderSEOIndex(assets.IndexPage, assets.PublicURL, requestPath, fallbackPage, false),
		)
	})
}
