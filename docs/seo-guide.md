# SeeForMe SEO 优化实战指南

> 适用版本：Expo (React Native) + FastAPI  
> 目标：让 Google / Bing / 百度等搜索引擎抓取到产品，提升自然流量与品牌曝光。

---

## 一、核心思路

移动 App 本身无法被搜索引擎直接抓取，SEO 的本质是**在 Web 端建立可被爬虫索引的入口**，再通过 App Store / Google Play 的 ASO（应用商店优化）覆盖搜索流量。

两条并行主线：

| 方向 | 效果 | 优先级 |
|------|------|--------|
| 应用商店优化 (ASO) | 应用内搜索 + 商店首页推荐 | ⭐⭐⭐⭐⭐ |
| Web 落地页 SEO | Google 自然搜索排名 | ⭐⭐⭐⭐ |
| Expo Web 路由 SEO | 用户分享链接可被收录 | ⭐⭐⭐ |

---

## 二、应用商店优化（ASO）

### 2.1 标题与副标题

- **App Store（iOS）**  
  - 标题（30 字符限制）：`为你所见 · 盲人视觉助手`  
  - 副标题（30 字符）：`实时志愿者视频陪伴服务`

- **Google Play（Android）**  
  - 标题（50 字符）：`为你所见 SeeForMe - 视障人士视觉助手`  
  - 简介（80 字符）：`连接志愿者，让视障者实时"看见"世界`

> 规则：标题中包含核心关键词，但不可堆砌。

### 2.2 关键词策略

优先布局在**描述前三行（可见区域）**和关键词字段（仅 App Store 有 100 字符关键词字段）：

```
主关键词（高意图）：
- 盲人辅助工具
- 视障助手 App
- 盲人视频通话志愿者

长尾关键词（低竞争）：
- 视觉障碍日常生活帮助
- 公益志愿者帮助盲人
- 实时视频描述场景
```

### 2.3 描述文案（完整描述 4000 字符）

第一段（前三行必须吸引眼球，无需展开就能看到）：

```
当你需要时，有人替你看见。
SeeForMe 连接有需要的视障朋友与热心志愿者，
通过实时视频，志愿者帮你描述周围的世界——无论是读菜单、
看路牌、还是感受草原的辽阔。
```

### 2.4 截图与预览视频

- 截图数量：**iOS 最多 10 张，Android 最多 8 张**
- 前 3 张放最核心功能截图，配上中文说明文字
- 拍摄 **30 秒预览视频**：展示发起求助 → 志愿者接单 → 实时视频描述全流程
- 文件格式：PNG（截图）/ MP4（视频）

### 2.5 评分与评论

- 在用户完成一次成功的志愿服务后弹出评分请求（`expo-store-review`）
- 目标：保持 4.5 星以上
- 及时回复差评，展示团队活跃度

---

## 三、Web 落地页 SEO

> 落地页是搜索引擎抓取的主要入口，建议独立部署（如 Vercel / Cloudflare Pages）或复用 Expo Web 构建。

### 3.1 页面结构（最小可行）

```
/ (首页)       ← 核心关键词着陆页
/about         ← 项目介绍 + 团队
/how-it-works  ← 功能说明（志愿者视角 / 求助者视角）
/volunteer     ← 志愿者招募页（转化页）
/blog          ← SEO 内容输出（长期）
/sitemap.xml   ← 站点地图
/robots.txt    ← 爬虫规则
```

### 3.2 HTML 元数据（每个页面必填）

```html
<!-- 首页示例 -->
<title>SeeForMe 为你所见 — 连接盲人与志愿者的视觉助手</title>
<meta name="description"
  content="SeeForMe 是一款公益 App，通过实时视频让志愿者帮助视障人士感知世界。现已支持 iOS 与 Android。">

<!-- Open Graph（微信 / 微博分享卡片） -->
<meta property="og:title" content="SeeForMe — 当你需要时，有人替你看见">
<meta property="og:description"
  content="连接视障者与志愿者，实时视频描述世界。免费公益 App。">
<meta property="og:image" content="https://seeforme.app/og-cover.png">
<meta property="og:url" content="https://seeforme.app">
<meta property="og:type" content="website">

<!-- Twitter Card -->
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="SeeForMe — 当你需要时，有人替你看见">
<meta name="twitter:description"
  content="连接视障者与志愿者，实时视频描述世界。">
<meta name="twitter:image" content="https://seeforme.app/og-cover.png">

<!-- 规范链接（防重复） -->
<link rel="canonical" href="https://seeforme.app">
```

### 3.3 在 Expo Web 中添加元数据

Expo Router 支持通过 `expo-router/head` 在每个路由文件里设置 `<head>` 内容：

```tsx
// frontend/app/(public)/welcome.tsx （示例片段）
import { Stack } from "expo-router";

export default function WelcomePage() {
  return (
    <>
      <Stack.Screen
        options={{
          title: "SeeForMe — 当你需要时，有人替你看见",
        }}
      />
      {/* 页面内容 */}
    </>
  );
}
```

对于 Web 专属的 `<meta>` 标签，在 `app/_layout.tsx` 中通过 `expo-router/head` 的 `<Head>` 组件注入：

```tsx
// frontend/app/_layout.tsx （新增 web 专属 head）
import { Head } from "expo-router/head";
import { Platform } from "react-native";

// 在 RootLayout 返回值中加入（只在 web 渲染）：
{Platform.OS === "web" && (
  <Head>
    <meta name="description"
      content="SeeForMe 是一款公益 App，通过实时视频让志愿者帮助视障人士感知世界。" />
    <meta property="og:image" content="https://seeforme.app/og-cover.png" />
    <link rel="canonical" href="https://seeforme.app" />
  </Head>
)}
```

### 3.4 结构化数据（JSON-LD）

在首页 `<head>` 内嵌入，帮助 Google 显示富搜索结果：

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "SeeForMe 为你所见",
  "url": "https://seeforme.app",
  "description": "连接视障者与志愿者的公益实时视频助手 App",
  "operatingSystem": "iOS, Android",
  "applicationCategory": "HealthApplication",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "CNY"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "120"
  }
}
</script>
```

### 3.5 robots.txt

在落地页根目录放置：

```
User-agent: *
Allow: /
Disallow: /api/

Sitemap: https://seeforme.app/sitemap.xml
```

### 3.6 sitemap.xml

```xml
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://seeforme.app/</loc>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://seeforme.app/how-it-works</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://seeforme.app/volunteer</loc>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
</urlset>
```

---

## 四、技术 SEO 检查清单

| 项目 | 要求 | 工具 |
|------|------|------|
| HTTPS | 全站启用 | Cloudflare / 域名服务商 |
| Core Web Vitals | LCP < 2.5s，FID < 100ms，CLS < 0.1 | Google Search Console |
| 移动端友好 | 响应式布局，字体 ≥ 16px | Google Mobile-Friendly Test |
| 图片优化 | WebP 格式，添加 `alt` 属性 | Squoosh |
| 页面加载速度 | 首屏 < 3s | PageSpeed Insights |
| 内部链接 | 各页面互相链接，建立层级 | 手动检查 |
| 404 处理 | 自定义 404 页面，含返回首页链接 | — |

---

## 五、内容 SEO（博客策略）

长期来看，内容是最可持续的 SEO 方式。

### 5.1 内容方向

```
目标人群一：视障人士及其家属
- 《盲人出行必备 5 款 App 推荐（2025）》
- 《视障者如何独立使用手机？实用教程》
- 《SeeForMe 使用教程：如何发起第一次视频求助》

目标人群二：志愿者
- 《成为视障志愿者需要什么？》
- 《一次 SeeForMe 志愿服务是什么体验？》

目标人群三：开发者 / 公益圈
- 《开源公益 App SeeForMe 技术架构分享》
- 《Expo + FastAPI 搭建实时视频公益服务》
```

### 5.2 发布频率

早期：**每月 2 篇**，优先保证质量。

---

## 六、外链与品牌曝光

| 渠道 | 行动 |
|------|------|
| 少数派 / 即刻 | 写产品故事文章，附 App 下载链接 |
| 公益组织合作 | 联系中国盲人协会等挂友情链接 |
| GitHub README | 添加 App Store / Google Play 徽章和链接 |
| Product Hunt | 英文市场发布（发布当天冲榜） |
| V2EX / 掘金 | 技术开源故事，吸引开发者关注 |

---

## 七、执行优先级

```
第一步（立即）：
  ✅ 完善 App Store / Google Play 文案和截图
  ✅ 注册 Google Search Console，提交 sitemap

第二步（2 周内）：
  ✅ 部署独立落地页，添加完整元数据和 JSON-LD
  ✅ 配置 robots.txt 和 sitemap.xml

第三步（1 个月内）：
  ✅ 发布第一批 SEO 博客文章（2-3 篇）
  ✅ 在公益 / 无障碍社区建立外链

第四步（持续）：
  ✅ 每月追踪 Search Console 数据，优化表现差的页面
  ✅ 按关键词排名情况补充新内容
```

---

## 八、监测工具

| 工具 | 用途 | 费用 |
|------|------|------|
| Google Search Console | 收录状态、点击量、关键词排名 | 免费 |
| Google Analytics 4 | 落地页流量与用户行为 | 免费 |
| PageSpeed Insights | Core Web Vitals 检测 | 免费 |
| Ahrefs / Semrush | 竞品分析、关键词研究 | 付费（选用） |
| App Annie / data.ai | ASO 竞品数据 | 免费基础版 |

---

> **总结**：移动 App 的 SEO 核心是"双轮驱动"——应用商店内的 ASO 覆盖有安装意图的用户，独立 Web 落地页覆盖搜索引擎带来的泛需求用户。两者同步推进，才能最大化自然流量。
