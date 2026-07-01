# 吉星宝典 · 微信小程序

一站式生活风水工具，覆盖每日宜忌、五行穿衣、运势速览、电子罗盘等高频场景，打造用户每日打开的生活仪式。

## 技术栈

| 层面 | 选型 |
|------|------|
| 框架 | 微信原生开发 |
| UI 组件库 | Vant Weapp ^1.11 |
| 状态管理 | MobX + globalData |
| 后端 | 微信云开发（云函数 Node.js 18 + 云数据库 + 云存储） |
| 定时任务 | 云函数定时触发器（cron 每日 0:00） |

## 项目结构

```
fengshui/
├── miniprogram/                 # 小程序前端
│   ├── pages/                   # 页面目录
│   │   ├── index/               # 首页（每日宜忌）
│   │   ├── wuxing/              # 五行穿衣
│   │   ├── fortune/             # 运势速览
│   │   └── compass/             # 电子罗盘
│   ├── components/              # 公共组件
│   ├── stores/                  # MobX Store
│   ├── utils/                   # 工具函数
│   ├── app.js / app.json / app.wxss
│   └── package.json
├── cloudfunctions/              # 云函数
│   ├── getAlmanac/              # 黄历数据 API
│   ├── saveSettings/            # 用户设置 API
│   └── scheduledGenAlmanac/     # 每日定时生成黄历
└── project.config.json
```

## 功能规划

### P0 — V1.0（M1）

| 功能 | 说明 |
|------|------|
| 每日宜忌 | 自研万年历算法，日历卡片展示黄历 |
| 五行穿衣 | 基于当日干支推荐幸运色 |
| 运势速览 | 基于生肖+性别展示每日运势 |
| 电子罗盘 | 调用手机传感器，实时方位+24山 |

### P1 — V1.1~V1.2（M2）

| 功能 | 说明 |
|------|------|
| 八字排盘 | 纯前端计算，隐私数据不上传 |
| 择日工具 | 事项+时间范围 → 推荐吉日 |
| 分享裂变 | 生成运势卡片分享到微信群 |

详细 PRD 见 `deliverables/product-strategy/`。

## 快速开始

### 环境要求

- [微信开发者工具](https://developers.weixin.qq.com/miniprogram/dev/devtools/download.html) 最新稳定版
- Node.js 18+

### 本地开发

```bash
# 1. 安装前端依赖
cd miniprogram && npm install

# 2. 微信开发者工具 → 工具 → 构建 npm

# 3. 云函数依赖（每个云函数目录下）
cd cloudfunctions/getAlmanac && npm install
```

### 云开发环境

首次使用需在微信开发者工具中开通云开发，获取环境 ID 后在 `miniprogram/app.js` 中配置：

```js
wx.cloud.init({ env: 'your-env-id' })
```

