// pages/bazi/bazi.js
const { paiPan, WU_XING, ZHI_CANGAN } = require('../../utils/bazi-js/index.js');
const { store } = require('../../store/userStore');
const { isAuditSwitchOn, refreshFeatureFlags } = require('../../utils/featureFlags.js');

/**
 * 时辰选项：每 2 小时一时辰
 */
const HOUR_OPTIONS = [
  '23-1 子时', '1-3 丑时', '3-5 寅时', '5-7 卯时',
  '7-9 辰时', '9-11 巳时', '11-13 午时', '13-15 未时',
  '15-17 申时', '17-19 酉时', '19-21 戌时', '21-23 亥时',
];

Page({
  data: {
    statusBarHeight: 20,
    // 生辰
    year: 1995,
    month: 1,
    day: 1,
    hour: 12,
    gender: '男',
    // picker 用
    dateRange: [[], [], []],
    dateIndex: [0, 0, 0],
    hourOptions: HOUR_OPTIONS,
    hourIndex: 6,
    birthDateStr: '1995-01-01',
    birthHourStr: '11-13 午时',
    // 结果
    result: null,
    // 历史记录
    showHistory: false,
    historyList: [],
    historyLoading: false,
    // 占位页
    showRealFeature: true,  // 默认 true，云端拉取后纠正
  },

  onLoad: function () {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
    });

    // 1. 立即用本地缓存判断（防首屏闪烁）
    const enabled = isAuditSwitchOn();
    this.setData({ showRealFeature: enabled });

    // 动态设置导航栏标题（审核时显示中性名）
    wx.setNavigationBarTitle({
      title: enabled ? '生辰八字' : '个人特质报告',
    });

    // 2. 异步重新拉取最新云端开关（保险）
    this.recheckFeatureFlag();

    // 3. 如果开放，初始化数据
    if (enabled) {
      this.initFromStore();
    }
  },

  /**
   * 异步重新拉取云端开关
   * 防止用户进入页面时云端还没拉完
   */
  recheckFeatureFlag: function () {
    refreshFeatureFlags(getApp()).then(() => {
      const enabled = isAuditSwitchOn();
      if (enabled !== this.data.showRealFeature) {
        this.setData({ showRealFeature: enabled });
        // 同步更新导航栏标题
        wx.setNavigationBarTitle({
          title: enabled ? '生辰八字' : '个人特质报告',
        });
        if (enabled && !this.data.result) {
          this.initFromStore();
        }
      }
    });
  },

  onShow: function () {
    if (this.data.showRealFeature && !this.data.result) {
      this.initFromStore();
    }
  },

  // 从 store 初始化
  initFromStore: function () {
    const year = store.birthYear || 1995;
    const month = store.birthMonth || 1;
    const day = store.birthDay || 1;
    const gender = store.gender || '男';
    const hour = 12;
    const hourIndex = 6;

    const dateRange = this.buildDateRange(year);
    const monthIdx = Math.max(0, month - 1);
    const dayIdx = Math.max(0, day - 1);

    this.setData({
      year,
      month,
      day,
      hour,
      gender,
      dateRange,
      dateIndex: [0, monthIdx, dayIdx],
      hourIndex,
      birthDateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
      birthHourStr: HOUR_OPTIONS[hourIndex],
    });
  },

  buildDateRange: function (currentYear) {
    const years = [];
    for (let y = 1900; y <= new Date().getFullYear(); y++) {
      years.push(y);
    }
    const months = Array.from({ length: 12 }, (_, i) => `${i + 1}月`);
    const days = this.getDaysInMonth(currentYear, 1);
    return [years, months, days];
  },

  getDaysInMonth: function (year, month) {
    const days = new Date(year, month, 0).getDate();
    return Array.from({ length: days }, (_, i) => `${i + 1}日`);
  },

  onDateColumnChange: function (e) {
    const col = e.detail.column;
    const val = e.detail.value;
    const { dateRange, dateIndex } = this.data;
    const newIndex = [...dateIndex];
    newIndex[col] = val;

    if (col === 0 || col === 1) {
      const year = dateRange[0][newIndex[0]];
      const month = newIndex[1] + 1;
      dateRange[2] = this.getDaysInMonth(year, month);
      if (newIndex[2] >= dateRange[2].length) {
        newIndex[2] = dateRange[2].length - 1;
      }
    }
    this.setData({ dateRange, dateIndex: newIndex });
  },

  onDateChange: function (e) {
    const idx = e.detail.value;
    const year = this.data.dateRange[0][idx[0]];
    const month = idx[1] + 1;
    const day = idx[2] + 1;

    this.setData({
      year,
      month,
      day,
      dateIndex: idx,
      birthDateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    });
  },

  onHourChange: function (e) {
    const idx = e.detail.value;
    const startHour = idx * 2 + 1;
    this.setData({
      hour: startHour,
      hourIndex: idx,
      birthHourStr: HOUR_OPTIONS[idx],
    });
  },

  onGenderChange: function (e) {
    const val = e.currentTarget.dataset.value;
    this.setData({ gender: val });
  },

  // 开始排盘（同步计算 + 异步保存）
  onPaiPan: function () {
    wx.showLoading({ title: '排盘中...' });

    try {
      const { year, month, day, hour, gender } = this.data;
      const raw = paiPan(year, month, day, hour, gender);
      const result = this.formatResult(raw, year);

      // 标记用于"是否新排盘"判断
      result._isNew = true;

      this.setData({ result });
      wx.hideLoading();

      // 异步保存到云端（不阻塞 UI）
      this.saveToCloud(result);
    } catch (err) {
      wx.hideLoading();
      console.warn('排盘失败', err);
      wx.showToast({
        title: '排盘失败，请检查日期',
        icon: 'none',
      });
    }
  },

  // 保存到云端
  saveToCloud: async function (result) {
    try {
      // 构造云函数需要的数据（不含 _id 等客户端字段）
      const data = {
        birthYear: this.data.year,
        birthMonth: this.data.month,
        birthDay: this.data.day,
        birthHour: this.data.hour,
        gender: this.data.gender,
        pillars: result.pillars,
        pillarShiShen: result.pillarShiShen,
        wuXing: result.wuXing,
        daYun: result.daYun,
        summary: { dayMaster: result.dayMaster, dayMasterWuXing: result.dayMasterWuXing, zodiac: result.zodiac },
      };

      const res = await wx.cloud.callFunction({
        name: 'saveBaziRecord',
        data,
      });

      if (res.result && res.result.success) {
        // 保存成功，更新 result 携带 _id 和保存时间
        this.setData({
          'result._id': res.result.data._id,
          'result.savedAtText': this.formatTime(new Date(res.result.data.createdAt)),
        });
      } else {
        console.warn('保存失败:', res.result);
        wx.showToast({ title: '保存失败：' + (res.result?.error || '未知错误'), icon: 'none', duration: 2000 });
      }
    } catch (err) {
      console.warn('保存到云端失败', err);
      wx.showToast({ title: '网络异常，未保存', icon: 'none', duration: 1500 });
    }
  },

  // 格式化时间
  formatTime: function (date) {
    const pad = (n) => String(n).padStart(2, '0');
    return `${date.getMonth() + 1}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
  },

  /**
   * 把 paiPan 返回值适配为页面数据结构
   */
  formatResult: function (raw, birthYear) {
    const { pillars, pillarShiShen, wuXing, daYun, summary } = raw;

    const enrichPillar = (pillar) => ({
      ...pillar,
      cangGanText: (ZHI_CANGAN[pillar.zhi] || []).join(' '),
    });

    const totalCount = Object.values(wuXing.count).reduce((a, b) => a + b, 0);
    const WX_NAME_MAP = { '木': 'mu', '火': 'huo', '土': 'tu', '金': 'jin', '水': 'shui' };
    const wuXingList = WU_XING.map(name => ({
      name,
      key: WX_NAME_MAP[name] || name,
      count: wuXing.count[name],
      percent: totalCount > 0 ? Math.round((wuXing.count[name] / totalCount) * 100) : 0,
    }));

    const xiYong = this.guessXiYong(wuXing, summary.dayMasterWuXing);

    const daYunList = (daYun.daYunList || []).map((d) => ({
      ...d,
      startYear: birthYear + d.startAge,
      endYear: birthYear + d.startAge + 9,
    }));

    const currentYear = new Date().getFullYear();
    const currentIdx = daYunList.findIndex(d =>
      currentYear >= d.startYear && currentYear <= d.endYear
    );
    const currentDaYun = currentIdx >= 0 ? {
      ...daYunList[currentIdx],
      description: `${daYunList[currentIdx].gan}${daYunList[currentIdx].zhi}大运 · 当前阶段`,
    } : null;

    return {
      pillars: {
        year: enrichPillar(pillars.year),
        month: enrichPillar(pillars.month),
        day: enrichPillar(pillars.day),
        hour: enrichPillar(pillars.hour),
      },
      pillarShiShen,
      pillarShiShenText: {
        year: this.buildShiShenText(pillarShiShen.year),
        month: this.buildShiShenText(pillarShiShen.month),
        day: this.buildShiShenText(pillarShiShen.day),
        hour: this.buildShiShenText(pillarShiShen.hour),
      },
      wuXing: {
        list: wuXingList,
        xiYong,
        strongest: wuXing.strongest,
        weakest: wuXing.weakest,
      },
      daYun: {
        directionText: daYun.direction,
        stepYears: 10,
        list: daYunList,
        current: currentDaYun,
      },
      dayMaster: summary.dayMaster,
      dayMasterWuXing: summary.dayMasterWuXing,
      zodiac: summary.zodiac,
    };
  },

  /**
   * 把十神对象拼成一行可读字符串
   * WXML 直接绑定对象会渲染成 "[object Object]"，
   * 这里去重拼接 "比肩 · 劫财" 这样的文本
   */
  buildShiShenText: function (item) {
    if (!item) return '';
    const set = new Set();
    if (item.ganShiShen) set.add(item.ganShiShen);
    if (item.zhiShiShen) set.add(item.zhiShiShen);
    (item.cangans || []).forEach((c) => {
      if (c && c.shiShen) set.add(c.shiShen);
    });
    return Array.from(set).join(' · ');
  },

  guessXiYong: function (wuXing, dayMasterWuXing) {
    const SHENG = { '金': '土', '木': '水', '水': '金', '火': '木', '土': '火' };
    const KE = { '金': '木', '木': '土', '水': '火', '火': '金', '土': '水' };
    const weakest = wuXing.weakest;
    if (!weakest) return '—';
    if (SHENG[weakest] === dayMasterWuXing) return weakest + '（印星）';
    if (KE[dayMasterWuXing] === weakest) return weakest + '（财星）';
    return weakest;
  },

  onDayunTap: function (e) {
    const idx = e.currentTarget.dataset.index;
    const item = this.data.result.daYun.list[idx];
    wx.showToast({
      title: `${item.startAge}岁起 ${item.gan}${item.zhi}`,
      icon: 'none',
    });
  },

  // ==================== 历史记录 ====================

  // 返回上一页（占位页按钮）
  goBack: function () {
    wx.navigateBack({ delta: 1, fail: () => {
      wx.switchTab({ url: '/pages/index/index' });
    } });
  },

  // 显示历史弹层
  onShowHistory: function () {
    this.setData({ showHistory: true });
    this.loadHistory();
  },

  // 关闭弹层
  onCloseHistory: function () {
    this.setData({ showHistory: false });
  },

  // 加载历史记录
  loadHistory: async function () {
    this.setData({ historyLoading: true });
    try {
      const res = await wx.cloud.callFunction({
        name: 'getBaziRecords',
        data: { limit: 50 },
      });

      if (res.result && res.result.success) {
        const list = (res.result.data || []).map(item => ({
          ...item,
          timeText: this.formatTime(new Date(item.createdAt)),
        }));
        this.setData({
          historyList: list,
          historyLoading: false,
        });
      } else {
        this.setData({ historyLoading: false });
        wx.showToast({ title: '加载失败', icon: 'none' });
      }
    } catch (err) {
      console.warn('加载历史失败', err);
      this.setData({ historyLoading: false });
      wx.showToast({ title: '网络异常', icon: 'none' });
    }
  },

  // 点击历史项：回显到结果区
  onHistoryItemTap: function (e) {
    const idx = e.currentTarget.dataset.index;
    const record = this.data.historyList[idx];
    if (!record) return;

    // 直接用云端数据构建 result（已含 cangGanText 需要补）
    const enrichedPillars = {
      year: { ...record.pillars.year, cangGanText: (ZHI_CANGAN[record.pillars.year.zhi] || []).join(' ') },
      month: { ...record.pillars.month, cangGanText: (ZHI_CANGAN[record.pillars.month.zhi] || []).join(' ') },
      day: { ...record.pillars.day, cangGanText: (ZHI_CANGAN[record.pillars.day.zhi] || []).join(' ') },
      hour: { ...record.pillars.hour, cangGanText: (ZHI_CANGAN[record.pillars.hour.zhi] || []).join(' ') },
    };

    const result = {
      ...record,
      pillars: enrichedPillars,
      // 兼容字段名
      pillarShiShen: record.pillarShiShen || record.shiShen,
      dayMaster: record.summary?.dayMaster || record.pillars?.day?.gan,
      savedAtText: this.formatTime(new Date(record.createdAt)),
    };

    // 历史记录没有 pillarShiShenText，重新拼一份
    const shishenMap = result.pillarShiShen || {};
    result.pillarShiShenText = {
      year: this.buildShiShenText(shishenMap.year),
      month: this.buildShiShenText(shishenMap.month),
      day: this.buildShiShenText(shishenMap.day),
      hour: this.buildShiShenText(shishenMap.hour),
    };

    this.setData({
      result,
      showHistory: false,
      // 同步更新生辰输入区
      year: record.birthYear,
      month: record.birthMonth,
      day: record.birthDay,
      hour: record.birthHour,
      gender: record.gender,
      birthDateStr: `${record.birthYear}-${String(record.birthMonth).padStart(2, '0')}-${String(record.birthDay).padStart(2, '0')}`,
    });

    // 重建 picker 索引
    this.rebuildPickerIndex();
  },

  // 重建 picker 索引
  rebuildPickerIndex: function () {
    const dateRange = this.buildDateRange(this.data.year);
    const monthIdx = Math.max(0, this.data.month - 1);
    const dayIdx = Math.max(0, this.data.day - 1);
    const hourIdx = Math.min(11, Math.floor((this.data.hour - 1) / 2));
    this.setData({
      dateRange,
      dateIndex: [0, monthIdx, dayIdx],
      hourIndex: hourIdx < 0 ? 0 : hourIdx,
      birthHourStr: HOUR_OPTIONS[hourIdx < 0 ? 6 : hourIdx],
    });
  },

  // 删除历史记录
  onHistoryDelete: async function (e) {
    const id = e.currentTarget.dataset.id;
    const idx = e.currentTarget.dataset.index;

    wx.showModal({
      title: '确认删除',
      content: '确定要删除这条排盘记录吗？',
      success: async (res) => {
        if (!res.confirm) return;

        try {
          const result = await wx.cloud.callFunction({
            name: 'deleteBaziRecord',
            data: { recordId: id },
          });

          if (result.result && result.result.success) {
            // 从列表移除
            const newList = [...this.data.historyList];
            newList.splice(idx, 1);
            this.setData({ historyList: newList });
            wx.showToast({ title: '已删除', icon: 'success' });
          } else {
            wx.showToast({ title: '删除失败', icon: 'none' });
          }
        } catch (err) {
          console.warn('删除失败', err);
          wx.showToast({ title: '网络异常', icon: 'none' });
        }
      },
    });
  },
});