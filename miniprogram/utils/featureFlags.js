/**
 * 云端审核开关（Audit Switch）
 *
 * 解决审核问题：微信审核员可以绕过 UI 入口直接进入任何已注册页面
 * 提审时设 enabled=false → 审核员看到占位页
 * 审核通过后设 enabled=true → 用户正常访问
 *
 * 多版本兼容：
 * - 当前 App 版本 >= minAppVersion → 走 enabled 判断
 * - 当前 App 版本 < minAppVersion → 视为开启（不影响旧用户）
 *
 * 文档：fengshui/docs/feature-flags.md
 *
 * 使用：
 * 1. 云开发控制台创建集合 `app_config`
 * 2. 添加 {_id: "audit_switch", enabled: false, minAppVersion: "2.0.0"}
 * 3. 任意页面 isAuditSwitchOn() 判断
 */

const CLOUD_KEY = 'audit_switch';

/**
 * 拉取云端开关，存入 globalData
 * @param {Object} app
 */
async function loadFeatureFlags(app) {
  if (!wx.cloud) {
    console.warn('[AuditSwitch] 无云能力，跳过拉取');
    return;
  }
  try {
    const db = wx.cloud.database();
    const res = await db.collection('app_config').doc(CLOUD_KEY).get();
    app.globalData.auditSwitch = res.data || {};
    console.log('[AuditSwitch] 拉取成功:', app.globalData.auditSwitch);
  } catch (err) {
    if (err && (err.errCode === -1 || /not exist|DATA_NOT_EXIST|404/i.test(err.errMsg || ''))) {
      console.warn('[AuditSwitch] 集合/记录不存在，使用默认（开启）');
    } else {
      console.error('[AuditSwitch] 拉取失败:', err);
    }
    // 拉取失败 → 默认开启（不误杀用户）
    app.globalData.auditSwitch = { enabled: true, _fetchFailed: true };
  }
}

/**
 * 重新拉取
 */
async function refreshFeatureFlags(app) {
  return loadFeatureFlags(app);
}

/**
 * 语义化版本号比较
 * 支持 '1.0.0'、'2.10.3'、'1.0.0-beta'、'1.0.0-rc.1' 等
 * pre-release < release: 1.0.0-beta < 1.0.0
 *
 * @returns {number} 1: v1>v2, -1: v1<v2, 0: 相等
 */
function compareVersion(v1, v2) {
  if (!v1 || !v2) return 0;
  const parse = v => {
    const s = String(v);
    const dashIdx = s.indexOf('-');
    const main = dashIdx >= 0 ? s.slice(0, dashIdx) : s;
    const pre = dashIdx >= 0 ? s.slice(dashIdx + 1) : null;
    return { main: main.split('.').map(p => parseInt(p, 10) || 0), pre };
  };
  const a = parse(v1);
  const b = parse(v2);
  const len = Math.max(a.main.length, b.main.length);
  for (let i = 0; i < len; i++) {
    const x = a.main[i] !== undefined ? a.main[i] : 0;
    const y = b.main[i] !== undefined ? b.main[i] : 0;
    if (x > y) return 1;
    if (x < y) return -1;
  }
  if (a.pre && !b.pre) return -1;
  if (!a.pre && b.pre) return 1;
  if (a.pre && b.pre) {
    if (a.pre < b.pre) return -1;
    if (a.pre > b.pre) return 1;
  }
  return 0;
}

/**
 * 判断"审核开关"是否开启
 *
 * 决策树：
 * 1. 云端无数据或拉取失败 → true（开启，不误杀）
 * 2. 当前 App 版本 < minAppVersion → true（旧用户不受影响）
 * 3. 当前 App 版本 >= minAppVersion
 *    a. enabled === true → true
 *    b. enabled !== true → false
 *
 * @returns {boolean} true=正常开放, false=审核拦截
 */
function isAuditSwitchOn() {
  try {
    const app = getApp && getApp();
    const data = (app && app.globalData && app.globalData.auditSwitch) || {};
    const currentVersion = (app && app.globalData && app.globalData.appVersion) || '0.0.0';

    // app 未就绪 → 开启（安全侧）
    if (!app) return true;

    // 拉取失败 → 开启
    if (data._fetchFailed) return true;

    // 无配置 → 开启
    if (!data || Object.keys(data).length === 0) return true;

    // 旧版本用户不受影响
    if (data.minAppVersion && compareVersion(currentVersion, data.minAppVersion) < 0) {
      return true;
    }

    // 当前版本适配 → 走 enabled
    return data.enabled === true;
  } catch (e) {
    return true;  // 异常时安全侧
  }
}

module.exports = {
  loadFeatureFlags,
  refreshFeatureFlags,
  isAuditSwitchOn,
  compareVersion,
  CLOUD_KEY,
};