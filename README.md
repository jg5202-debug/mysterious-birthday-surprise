# Mysterious Birthday Surprise · 神秘生日惊喜

为白白的 23 岁生日准备的一份小狗主题惊喜。使用原生 HTML、CSS、JavaScript 和本地媒体素材，包含生日入场、三关小游戏、礼物转盘、兑奖信封、生日信件，以及八张合照汇聚成爱心的收尾动画。

## 在线体验

- [Cloudflare 版本](https://mysterious-birthday-surprise.pages.dev/)：保存当前浏览器的体验进度，完整体验后再次访问直接显示完成页面。
- [Netlify 版本](https://mysterious-birthday-surprise.netlify.app/)：保留原来的每次从入场开始的体验。

进度通过 `localStorage` 保存在当前浏览器中，不上传到服务器、不跨设备同步。Cloudflare 版第一次播放照片动画没有跳过按钮；完成体验后重读信件，可以跳过照片漂浮过程，直接汇聚爱心，再进入原有返回转场。

## 交互内容

- 三关小游戏依次解锁三次抽奖：15 秒内拖动接住 10 份礼物、狗狗翻翻乐、12 块生日拼图。
- 八张礼券逐步翻面，第三次固定获得神秘礼物；结束后以金色和灰色区分抽中与未抽中的心意。
- 兑奖信封中的纸张展示实际抽中的三份礼物。
- 刮开生日祝福，吹灭蛋糕蜡烛，观看狗狗动画。
- 打开生日信件切换到读信 BGM，照片和转场期间继续播放，回到主页面才切回生日 BGM。
- 暂停或结束视频后恢复背景音乐；浏览器的自动播放限制仍可能要求用户先点击页面。
- 手机触摸交互、屏幕安全区，以及减少动态效果偏好适配。

## 本地运行

需要 Python 3 和 Node.js 20 或更新版本。项目没有第三方运行时依赖，不需要 `npm install`。

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

## 项目结构

```text
src/                        原始网页源码（Netlify 基础版）
  assets/                   小狗素材、八张合照、视频和两首 BGM
scripts/
  build-cloudflare.py       在基础版上应用进度保存和重读跳过逻辑
  cloudflare-progress.js    浏览器进度保存模块
  build-netlify.py           构建 Netlify 版及离线 HTML
  check.mjs                 统一验证入口
tests/                      交互与状态回归检查
dist/                       生成的发布文件（不提交）
build/                      生成的 Cloudflare JavaScript（不提交）
```

`src/app.js` 包含姓名、年龄、祝福和奖品配置；`src/letter.js` 包含信件文字；`src/memories.js` 控制照片、文案与爱心动画。涉及 Cloudflare 的专属行为时，同时检查 `scripts/build-cloudflare.py` 中的补丁。补丁使用精确匹配，基础源码变动后可能需要同步调整。

## 发布

Cloudflare：运行 `npm run build:cloudflare`，将 `dist/cloudflare.zip` 上传至 Pages 项目，或使用 `dist/cloudflare/` 作为静态发布目录。

Netlify：运行 `npm run build:netlify`，将 `dist/netlify/` 上传至 Netlify。`dist/netlify.zip` 提供打包文件；`dist/birthday-offline.html` 是嵌入媒体的离线版本。

两套构建输出独立。提交代码不会自动更改现有 Cloudflare 或 Netlify 网站。仓库不包含平台登录信息、访问令牌或部署凭据。

## 素材说明

这是一个个人生日礼物项目。照片、信件、小狗插画、音乐和视频是项目使用的素材，并不随源码提供对第三方素材的再分发授权。插画保留原有署名；媒体的相关权利归其各自权利人所有。
