# Mysterious Birthday Surprise · 神秘生日惊喜

[English](#english) · [简体中文](#简体中文)

## English

A puppy-themed surprise made for Baibai's 23rd birthday. Built with plain HTML, CSS, JavaScript and local media assets, it includes a birthday entrance, three mini games, a gift wheel, a redemption envelope, a personal letter, and a finale where eight photos come together to form a heart.

### Live demos

- [Cloudflare edition](https://mysterious-birthday-surprise.pages.dev/): saves progress in the current browser. After completing the full experience, returning visitors go straight to the completed page.
- [Netlify edition](https://mysterious-birthday-surprise.netlify.app/): preserves the original experience, starting with the entrance on each visit.

Progress is stored in the current browser using `localStorage`. It is not uploaded to a server or synchronized across devices. The Cloudflare edition has no skip button during the first photo sequence. After completing the experience, readers can skip the floating photos on subsequent readings, go directly to the photo heart, and continue through the return transition.

### Features

- Three mini games unlock three gift draws in order: drag to catch 10 gifts within 15 seconds, match puppy cards, and complete a 12-piece birthday puzzle.
- Eight gift cards gradually flip over. The third draw guarantees the mystery gift; after all draws, gold and gray distinguish the gifts won from the remaining cards.
- A sheet inside the redemption envelope lists the three gifts actually won.
- Scratch to reveal a birthday message, blow out cake candles, and watch a puppy animation.
- Opening the birthday letter switches to the reading BGM. It continues through the photos and transitions; the birthday BGM returns only after the main page is revealed.
- Background music resumes when the video is paused or finished. Browser autoplay restrictions may still require an initial interaction with the page.
- Supports mobile touch controls, screen safe areas, and reduced-motion preferences.
- The Cloudflare edition adds a gift delivery route after the full birthday experience. Its password-protected mobile update page lets Jimao record the current city, next stop, destination and delivery status; Baibai's view refreshes every 30 seconds. These are manually confirmed updates, not automatic carrier tracking or GPS locations.

### Run locally

Requires Python 3 and Node.js 22.13 or later. There are no third-party runtime dependencies, so `npm install` is not required.

```sh
npm run build
npm run preview
```

Open `http://localhost:4173/`. The default build and preview use the Cloudflare edition.

```sh
npm run build:netlify
npm run check
```

`check` builds both editions, checks JavaScript syntax, and verifies mini games, gift cards, video, audio, letter transitions and browser progress persistence. GitHub Actions runs the same checks and does not automatically deploy the website.

For the delivery editor and shared storage, run `npm run preview:delivery` after building. The local server at `http://127.0.0.1:4183/gift-admin` uses SQLite and the same Worker code as production. Its generated test password is stored in the ignored `work/delivery-preview-password.txt`; local test records never reach the live website.

### Project structure

```text
src/                        Original website source (Netlify base edition)
  assets/                   Puppy artwork, eight photos, video and two BGM tracks
scripts/
  build-cloudflare.py       Adds progress persistence and the replay skip option
  cloudflare-progress.js    Browser progress persistence module
  build-netlify.py          Builds the Netlify edition and offline HTML
  check.mjs                 Shared validation entry point
tests/                      Interaction and state regression checks
server/                     Delivery Worker, initial record and city catalog
dist/                       Generated deployment files (not committed)
build/                      Generated Cloudflare JavaScript (not committed)
```

`src/app.js` contains the name, age, birthday message and prize configuration. `src/letter.js` contains the letter text, and `src/memories.js` controls the photos, captions and heart animation. For Cloudflare-specific behavior, also review the patches in `scripts/build-cloudflare.py`. These patches use exact matching and may need adjustment when the base source changes.

### Deployment

Cloudflare: run `npm run build:cloudflare`, then upload `dist/cloudflare.zip` to the Pages project, or use `dist/cloudflare/` as the static publishing directory.

For delivery updates, create a Cloudflare D1 database and bind it to the Pages production environment as `DELIVERY_DB`. Add a production **secret** named `DELIVERY_ADMIN_PASSWORD` with a unique password of at least 16 characters, then deploy the new archive. The Worker initializes its tables and the user-supplied initial tracking record automatically. `/gift-admin` is the mobile editor; `/api/gift-tracking` returns the shared public record. Credentials and session tokens must never be committed. The editor uses expiring HttpOnly cookies, login throttling, origin checks, revision conflicts and explicit confirmation before marking delivery. Changing the secret invalidates existing sessions.

Netlify: run `npm run build:netlify`, then upload `dist/netlify/` to Netlify. `dist/netlify.zip` is the deployment archive; `dist/birthday-offline.html` is an offline version with embedded media.

The two editions have separate build outputs. Committing code does not automatically change the existing Cloudflare or Netlify websites. The repository contains no platform login information, access tokens or deployment credentials.

### Media credits

This is a personal birthday gift project. The photos, letter, puppy illustrations, music and video are project assets; including them with the source does not grant redistribution rights to third-party media. Original illustration credits are preserved. Media rights remain with their respective owners.

Map outlines and city centers are derived from [Alibaba Cloud DataV GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector). Routes are schematic city-to-city connections, not road navigation or a courier's actual travel path. The rider cutout was prepared from the user's supplied puppy illustration.

## 简体中文

为白白的 23 岁生日准备的一份小狗主题惊喜。使用原生 HTML、CSS、JavaScript 和本地媒体素材，包含生日入场、三关小游戏、礼物转盘、兑奖信封、生日信件，以及八张合照汇聚成爱心的收尾动画。

### 在线体验

- [Cloudflare 版本](https://mysterious-birthday-surprise.pages.dev/)：保存当前浏览器的体验进度，完整体验后再次访问直接显示完成页面。
- [Netlify 版本](https://mysterious-birthday-surprise.netlify.app/)：保留原来的每次从入场开始的体验。

进度通过 `localStorage` 保存在当前浏览器中，不上传到服务器、不跨设备同步。Cloudflare 版第一次播放照片动画没有跳过按钮；完成体验后重读信件，可以跳过照片漂浮过程，直接汇聚爱心，再进入原有返回转场。

### 交互内容

- 三关小游戏依次解锁三次抽奖：15 秒内拖动接住 10 份礼物、狗狗翻翻乐、12 块生日拼图。
- 八张礼券逐步翻面，第三次固定获得神秘礼物；结束后以金色和灰色区分抽中与未抽中的心意。
- 兑奖信封中的纸张展示实际抽中的三份礼物。
- 刮开生日祝福，吹灭蛋糕蜡烛，观看狗狗动画。
- 打开生日信件切换到读信 BGM，照片和转场期间继续播放，回到主页面才切回生日 BGM。
- Cloudflare 版在完整生日流程结束后增加送礼路线图。鸡毛通过密码保护的手机更新页填写当前位置、下一站、收货城市和配送状态，白白的页面每 30 秒同步一次。记录由鸡毛确认，不是自动查询快递，也不是快递员的实时定位。
- 暂停或结束视频后恢复背景音乐；浏览器的自动播放限制仍可能要求用户先点击页面。
- 手机触摸交互、屏幕安全区，以及减少动态效果偏好适配。

### 本地运行

需要 Python 3 和 Node.js 22.13 或更新版本。项目没有第三方运行时依赖，不需要 `npm install`。

```sh
npm run build
npm run preview
```

打开 `http://localhost:4173/`。默认构建和预览 Cloudflare 版本。

```sh
npm run build:netlify
npm run check
```

`check` 会分别构建两个版本、检查 JavaScript 语法，并验证小游戏、礼券、视频、音乐、读信转场和浏览器进度保存。GitHub Actions 运行同一套检查，不会自动发布网站。

需要预览手机更新页和共享存储时，先构建，再运行 `npm run preview:delivery`，打开 `http://127.0.0.1:4183/gift-admin`。本地使用 SQLite 和同一份 Worker 代码；自动生成的测试密码保存在不提交的 `work/delivery-preview-password.txt`，测试记录不会写入线上网站。

### 项目结构

```text
src/                        原始网页源码（Netlify 基础版）
  assets/                   小狗素材、八张合照、视频和两首 BGM
scripts/
  build-cloudflare.py       在基础版上应用进度保存和重读跳过逻辑
  cloudflare-progress.js    浏览器进度保存模块
  build-netlify.py           构建 Netlify 版及离线 HTML
  check.mjs                 统一验证入口
tests/                      交互与状态回归检查
server/                     送礼更新服务、初始记录和城市列表
dist/                       生成的发布文件（不提交）
build/                      生成的 Cloudflare JavaScript（不提交）
```

`src/app.js` 包含姓名、年龄、祝福和奖品配置；`src/letter.js` 包含信件文字；`src/memories.js` 控制照片、文案与爱心动画。涉及 Cloudflare 的专属行为时，同时检查 `scripts/build-cloudflare.py` 中的补丁。补丁使用精确匹配，基础源码变动后可能需要同步调整。

### 发布

Cloudflare：运行 `npm run build:cloudflare`，将 `dist/cloudflare.zip` 上传至 Pages 项目，或使用 `dist/cloudflare/` 作为静态发布目录。

启用送礼更新页前，创建 Cloudflare D1 数据库，在 Pages 的生产环境中绑定为 `DELIVERY_DB`；添加名为 `DELIVERY_ADMIN_PASSWORD` 的生产环境 **Secret**，使用至少 16 个字符的独立密码，再发布新版压缩包。服务会自动创建数据表并载入用户提供的初始物流记录。手机入口为 `/gift-admin`，访客页面从 `/api/gift-tracking` 获取共享记录。密码和会话令牌不能提交到仓库。更新页包含登录限流、HttpOnly 过期会话、同源校验、版本冲突检查和送达确认；更换管理密码会使旧会话失效。

Netlify：运行 `npm run build:netlify`，将 `dist/netlify/` 上传至 Netlify。`dist/netlify.zip` 提供打包文件；`dist/birthday-offline.html` 是嵌入媒体的离线版本。

两套构建输出独立。提交代码不会自动更改现有 Cloudflare 或 Netlify 网站。仓库不包含平台登录信息、访问令牌或部署凭据。

### 素材说明

这是一个个人生日礼物项目。照片、信件、小狗插画、音乐和视频是项目使用的素材，并不随源码提供对第三方素材的再分发授权。插画保留原有署名；媒体的相关权利归其各自权利人所有。

地图轮廓和城市中心点来自[阿里云 DataV GeoAtlas](https://datav.aliyun.com/portal/school/atlas/area_selector)。路线为城市之间的示意连线，不用于道路导航，也不代表快递员的实际行驶轨迹。骑摩托的鸡毛素材由用户提供的插画抠图制作。
