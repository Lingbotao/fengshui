/**
 * 自定义底部 TabBar
 *
 * 审核时由全局 audit_switch 控制：
 * - 审核关闭 → 锁定 Tab 完全隐藏
 * - 审核通过 → Tab 正常显示
 * - 旧用户（App 版本 < minAppVersion）→ 永远正常显示
 *
 * 锁定时通过 wx:if 过滤该 Tab，剩余 Tab 自动等分底部宽度
 */
const { isAuditSwitchOn } = require('../utils/featureFlags.js');

// 全部 Tab 配置（含受控的）
const ALL_TABS = [
  {
    pagePath: '/pages/index/index',
    text: '首页',
    iconPath: '/images/icons/home.png',
    selectedIconPath: '/images/icons/home-active.png',
    controlled: false,  // 首页不受控
  },
  {
    pagePath: '/pages/fortune/fortune',
    text: '势头',
    iconPath: '/images/icons/cycle-arrow.png',
    selectedIconPath: '/images/icons/cycle-arrow-active.png',
    controlled: true,   // 受云端 audit_switch 控制
  },
  {
    pagePath: '/pages/compass/compass',
    text: '罗盘',
    iconPath: '/images/icons/compass-one.png',
    selectedIconPath: '/images/icons/compass-one-active.png',
    controlled: false,
  },
  {
    pagePath: '/pages/settings/settings',
    text: '我的',
    iconPath: '/images/icons/user.png',
    selectedIconPath: '/images/icons/user-active.png',
    controlled: false,
  },
];

/**
 * 判断 Tab 是否显示
 * 注意：此函数可能在 getApp() 不可用时调用（模块顶层求值时），
 * 此时安全地视为全部显示，避免阻塞 app 注册。
 */
function isTabVisible(tab) {
  if (!tab.controlled) return true;  // 不受控的永远显示
  try {
    // 检查 app 是否已注册
    const app = getApp && getApp();
    if (!app) return true;  // app 未就绪，先全部显示
    return isAuditSwitchOn();
  } catch (e) {
    return true;  // 出错时先显示，避免阻塞
  }
}

Component({
  data: {
    selected: 0,
    // 默认全部显示（在 attached 生命周期中再根据云端开关过滤）
    list: ALL_TABS,
  },

  lifetimes: {
    attached: function () {
      this.refreshLockStatus();
      try {
        const app = getApp();
        if (app && app.globalData) {
          app.globalData._refreshTabBar = () => this.refreshLockStatus();
        }
      } catch (e) {}
    },
  },

  methods: {
    refreshLockStatus: function () {
      try {
        const list = ALL_TABS.filter(isTabVisible);
        let selected = this.data.selected;
        if (this.data.selectedPagePath) {
          const idx = list.findIndex(t => t.pagePath === this.data.selectedPagePath);
          if (idx >= 0) selected = idx;
        }
        this.setData({ list, selected });
      } catch (e) {
        console.warn('[TabBar] refreshLockStatus 失败', e);
      }
    },

    setSelected: function (pagePath) {
      const list = this.data.list;
      const idx = list.findIndex(t => t.pagePath === pagePath);
      if (idx >= 0) {
        this.setData({ selected: idx, selectedPagePath: pagePath });
      }
    },

    onTap: function (e) {
      const { index, page } = e.currentTarget.dataset;
      this.setData({ selected: index, selectedPagePath: page });
      wx.switchTab({ url: page });
    },
  },
});