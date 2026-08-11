# 日知通 · 微信小程序

一站式生活风水工具，覆盖每日宜忌、五行穿衣、运势速览、电子罗盘等高频场景，打造用户每日打开的生活仪式。

> **定位（PRD v1.1）**：差异化叙事从「户型独家」转向「**一站式生活风水广度壁垒**」——竞品碎片化（用户需装 3-4 个 App），本产品一站解决。
>
> **M1（已实现）**：6 项 P0 功能——每日宜忌、五行穿衣、运势速览、电子罗盘、Banner 广告、用户设置。
> **M2（开发中）**：八字排盘、择日、激励视频、分享卡片、每日推送、插屏广告。

## 技术栈

| 层面 | 选型 |
|------|------|
| 框架 | 微信原生开发 |
| UI 组件库 | @vant/weapp ^1.11.7 |
| 状态管理 | mobx-miniprogram ^6.12 + globalData |
| 后端 | 微信云开发（云函数 Node.js 18 + 云数据库 + 云存储） |
| 黄历算法 | 自研万年历（cnlunar 兜底） |
| 八字 / 择日 | TypeScript 算法库 + 纯前端计算 |
| 定时任务 | 云函数定时触发器（cron 每日 0:00） |

## 项目结构

```
fengshui/
├── miniprogram/                 # 小程序前端
│   ├── pages/                   # 页面目录
│   │   ├── index/               # 首页（每日宜忌）
│   │   ├── fortune/             # 运势速览
│   │   ├── compass/             # 电子罗盘
│   │   ├── settings/            # 用户设置（生肖/性别/出生年份）
│   │   ├── bazi/                # 八字排盘（M2）
│   │   ├── zheri/               # 择日工具（M2）
│   │   └── example/             # 云开发示例页
│   ├── components/              # 公共组件
│   │   └── cloudTipModal/       # 云开发提示弹窗
│   ├── utils/                   # 工具函数
│   │   ├── featureFlags.js      # 功能可见性控制（审核前后差异）
│   │   ├── featureUnlocks.js    # 功能解锁开关
│   │   ├── bazi/                # 八字算法 TS 源码
│   │   ├── bazi-js/             # 八字算法编译产物
│   │   ├── zheri/               # 择日算法 TS 源码
│   │   └── zheri-js/            # 择日算法编译产物
│   ├── app.js / app.json / app.wxss
│   └── package.json
├── cloudfunctions/              # 云函数
│   ├── getDailyAlmanac/         # 每日黄历数据 API
│   ├── getUserSettings/         # 读取用户设置
│   ├── saveUserSettings/        # 保存用户设置
│   ├── getFortune/              # 运势速览 API
│   ├── getBaziRecords/          # 八字记录列表
│   ├── saveBaziRecord/          # 保存八字记录
│   ├── deleteBaziRecord/        # 删除八字记录
│   └── quickstartFunctions/     # 云开发快速入门示例
├── docs/
│   └── feature-flags.md         # 功能开关机制说明
├── tests/                       # 测试
└── project.config.json
```

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新稳定版
- Node.js 18+

### 本地开发

```bash
# 1. 安装前端依赖
cd miniprogram && npm install

# 2. 微信开发者工具 → 工具 → 构建 npm

# 3. 编译八字 / 择日 TS 算法库（按需）
npm run build          # 编译 bazi + zheri
npm run build:bazi     # 仅八字
npm run build:zheri    # 仅择日

# 4. 云函数依赖（每个云函数目录下）
cd cloudfunctions/getDailyAlmanac && npm install
```

### 云开发环境

首次使用需在微信开发者工具中开通云开发，获取环境 ID 后在 `miniprogram/app.js` 中配置：

```js
wx.cloud.init({ env: 'your-env-id' })
```

### 功能开关（审核前/上线后）

通过 `miniprogram/utils/featureFlags.js` 控制功能可见性，无需改代码、无需重新提审。详见 [docs/feature-flags.md](docs/feature-flags.md)。

## 部署脚本

```bash
# 上传所有云函数到云开发环境
./uploadCloudFunction.sh
```