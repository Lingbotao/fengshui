// app.js
try {
  const { createStoreBindings } = require('mobx-miniprogram-bindings');
  const { store } = require('./store/userStore');
  const { env } = require('./env');
  const { isFeatureUnlocked, listAllFeatures, FEATURE_UNLOCKS } = require('./utils/featureUnlocks.js');
  const { loadFeatureFlags } = require('./utils/featureFlags.js');

  // 当前小程序版本号（与微信开发者工具中保持一致）
  // 提审时改这个，对应的云端开关才生效
  const APP_VERSION = '1.0.0';

  App({
    globalData: {
      // 当前版本号（用于云端开关的 minAppVersion 判断）
      appVersion: APP_VERSION,
      // 系统信息
      systemInfo: null,
      statusBarHeight: 0,
      // 功能解锁状态（启动时初始化一次）
      featureUnlocks: {
        config: { ...FEATURE_UNLOCKS },
        features: {},   // { bazi: { unlocked: true, msLeft: -1 } }
        list: [],
      },
      // 云端审核开关（启动时异步拉取）
      auditSwitch: {},
    },

    onLaunch: function () {
      // 初始化云开发（容错处理）
      try {
        if (!wx.cloud) {
          console.warn('[App] 请使用 2.2.3 或以上的基础库以使用云能力');
        } else {
          wx.cloud.init({
            env: env,
            traceUser: true,
          });
        }
      } catch (e) {
        console.warn('[App] 云开发初始化失败（不影响基础功能）', e);
      }

      // 获取系统信息
      this.initSystemInfo();

      // 初始化功能解锁状态
      this.initFeatureUnlocks();

      // 异步拉取云端功能开关（审核防御）
      this.loadFeatureFlagsAsync();

      // 绑定 MobX Store
      try {
        this.storeBindings = createStoreBindings(this, store, [
          'zodiac',
          'gender',
          'birthYear',
          'birthMonth',
          'birthDay',
        ]);
      } catch (e) {
        console.warn('[App] MobX 绑定失败', e);
      }
    },

    /**
     * 异步拉取云端功能开关
     * 不阻塞启动流程（云端失败时安全侧为 false）
     */
    loadFeatureFlagsAsync: function () {
      try {
        loadFeatureFlags(this).then(() => {
          this.refreshTabBar();
        }).catch(e => {
          console.warn('[App] 拉取云端开关失败', e);
        });
      } catch (e) {
        console.warn('[App] loadFeatureFlags 调用失败', e);
      }
    },

    /**
     * 全局方法：刷新自定义 TabBar 锁定状态
     */
    refreshTabBar: function () {
      if (this.globalData && this.globalData._refreshTabBar) {
        this.globalData._refreshTabBar();
      }
    },

    /**
     * 初始化全局功能解锁状态
     */
    initFeatureUnlocks: function () {
      try {
        const list = listAllFeatures();
        const features = {};
        list.forEach(f => {
          features[f.key] = {
            unlocked: f.unlocked,
            msLeft: f.msLeft,
            unlockDate: f.unlockDate,
          };
        });
        this.globalData.featureUnlocks.list = list;
        this.globalData.featureUnlocks.features = features;
        console.log('[FeatureUnlocks] 初始化完成:', features);
      } catch (e) {
        console.warn('[App] 初始化功能解锁失败', e);
      }
    },

    initSystemInfo: function () {
      try {
        // 用新版 API 替换已废弃的 wx.getSystemInfoSync
        let statusBarHeight = 20;
        try {
          const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : null;
          if (windowInfo && windowInfo.statusBarHeight) {
            statusBarHeight = windowInfo.statusBarHeight;
          } else {
            // 旧基础库降级
            const systemInfo = wx.getSystemInfoSync();
            statusBarHeight = systemInfo.statusBarHeight || 20;
          }
        } catch (e) {
          statusBarHeight = 20;
        }
        this.globalData.statusBarHeight = statusBarHeight;
      } catch (e) {
        this.globalData.statusBarHeight = 20;
      }
    },

    onUnload: function () {
      try {
        this.storeBindings && this.storeBindings.destroyStoreBindings();
      } catch (e) {}
    },
  });
} catch (e) {
  // app.js 顶层异常：使用最简化的 app 配置
  console.error('[App] 顶层初始化失败，使用降级配置:', e);
  App({
    globalData: {
      appVersion: '1.0.0',
      statusBarHeight: 20,
      auditSwitch: {},
    },
    onLaunch: function () {
      console.log('[App] 降级模式启动');
    },
  });
}