// pages/zheri/zheri.js
const {
  listMonthJianChu,
  findGoodDays,
  evaluateDayForMatter,
  evaluateDay,
  JIAN_CHU_INFO,
} = require('../../utils/zheri-js/index.js');
const { isAuditSwitchOn, refreshFeatureFlags } = require('../../utils/featureFlags.js');
const { isFeatureUnlocked } = require('../../utils/featureUnlocks.js');

/**
 * 8 类事项 + 图标
 * 与 MATTER_TYPES 顺序保持一致
 */
const MATTERS = [
  { key: '婚嫁', label: '婚嫁', icon: '💒' },
  { key: '搬家', label: '搬家', icon: '🏠' },
  { key: '开业', label: '开业', icon: '🎉' },
  { key: '签约', label: '签约', icon: '📝' },
  { key: '出行', label: '出行', icon: '✈️' },
  { key: '动土', label: '动土', icon: '🏗️' },
  { key: '入宅', label: '入宅', icon: '🏡' },
  { key: '祭祀', label: '祭祀', icon: '🙏' },
];

const WEEKDAYS = ['日', '一', '二', '三', '四', '五', '六'];

/**
 * 吉凶等级/黄黑道 → 拼音类名后缀
 * 避免 WXSS 类名使用中文（部分编译器报错）
 */
const LEVEL_KEY = {
  '大吉': 'daji',
  '吉': 'ji',
  '中': 'zhong',
  '凶': 'xiong',
  '大凶': 'daxiong',
};
const DAO_KEY = {
  '黄道': 'huangdao',
  '黑道': 'heidao',
};

function levelClsOf(level) {
  return LEVEL_KEY[level] ? `day-level-${LEVEL_KEY[level]}` : '';
}
function detailLevelClsOf(level) {
  return LEVEL_KEY[level] ? `detail-level-${LEVEL_KEY[level]}` : '';
}
function recommendLevelClsOf(level) {
  return LEVEL_KEY[level] ? `recommend-level-${LEVEL_KEY[level]}` : '';
}
function daoClsOf(daoType, prefix = 'day') {
  return DAO_KEY[daoType] ? `${prefix}-dao-${DAO_KEY[daoType]}` : '';
}

Page({
  data: {
    statusBarHeight: 20,

    // 事项
    matters: MATTERS,
    currentMatter: '婚嫁',
    currentMatterLabel: '婚嫁',

    // 当前查看的月份
    year: 0,
    month: 0,

    // 今日
    todayYear: 0,
    todayMonth: 0,
    todayDay: 0,

    // 月历
    weekdays: WEEKDAYS,
    calendarDays: [], // {date, day, empty, jianChu, daoType, level, isToday, isGood}

    // 选中日期详情
    selectedDay: null,

    // 顶部月份副标题（节气信息）
    monthSubtitle: '',

    // 占位页
    showRealFeature: true,

    // 推荐弹层
    showRecommend: false,
    recommendList: [],
    recommendLoading: false,
  },

  onLoad: function () {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
    });

    // 1. 功能解锁检查（featureUnlocks 日期戳）
    const unlocked = isFeatureUnlocked('zheri');
    // 2. 审核开关（云端开关）
    const enabled = isAuditSwitchOn();

    const showRealFeature = unlocked && enabled;
    this.setData({ showRealFeature });

    // 动态设置导航栏标题（审核/锁定时显示中性名）
    wx.setNavigationBarTitle({
      title: showRealFeature ? '择日参考' : '重要日子参考',
    });

    // 异步重新拉取云端开关
    this.recheckFeatureFlag();

    if (showRealFeature) {
      this.initCalendar();
    }
  },

  recheckFeatureFlag: function () {
    refreshFeatureFlags(getApp()).then(() => {
      const unlocked = isFeatureUnlocked('zheri');
      const enabled = isAuditSwitchOn();
      const showRealFeature = unlocked && enabled;
      if (showRealFeature !== this.data.showRealFeature) {
        this.setData({ showRealFeature });
        wx.setNavigationBarTitle({
          title: showRealFeature ? '择日参考' : '重要日子参考',
        });
        if (showRealFeature && this.data.calendarDays.length === 0) {
          this.initCalendar();
        }
      }
    });
  },

  // 返回上一页（占位页按钮）
  goBack: function () {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.switchTab({ url: '/pages/index/index' });
      },
    });
  },

  // ==================== 日历初始化 ====================

  initCalendar: function () {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    const todayDay = now.getDate();

    this.setData({
      year,
      month,
      todayYear: year,
      todayMonth: month,
      todayDay,
    });

    this.buildCalendar(year, month);
  },

  // 重建月历
  buildCalendar: function (year, month) {
    // 配对保护：先确保上一个 loading 已关闭
    try { wx.hideLoading(); } catch (e) {}
    wx.showLoading({ title: '加载中...', mask: true });

    try {
      // 1. 用算法算出当月每天的建除值
      const monthData = listMonthJianChu(year, month, this.data.currentMatter);

      // 2. 计算当月 1 号是星期几（决定前置空格）
      const firstDay = new Date(year, month - 1, 1).getDay();

      // 3. 把数据组装成日历网格
      const calendarDays = [];

      // 前置空格
      for (let i = 0; i < firstDay; i++) {
        calendarDays.push({ empty: true });
      }

      // 实际日期
      monthData.forEach((d) => {
        const day = parseInt(d.date.split('-')[2], 10);
        const isToday = d.date === `${this.data.todayYear}-${String(this.data.todayMonth).padStart(2, '0')}-${String(this.data.todayDay).padStart(2, '0')}`;
        const isGood = d.score >= 80; // 80 分以上为推荐吉日

        calendarDays.push({
          date: d.date,
          day,
          empty: false,
          jianChu: d.jianChu,
          daoType: d.daoType,
          level: d.level,
          levelCls: levelClsOf(d.level),
          daoCls: daoClsOf(d.daoType, 'day'),
          score: d.score,
          isToday,
          isGood,
        });
      });

      // 计算月份副标题（基于 1 号的建除 + 月支）
      const monthSubtitle = this.buildMonthSubtitle(year, month, monthData);

      this.setData({
        calendarDays,
        monthSubtitle,
        selectedDay: null, // 切月时清空选中
      });
    } catch (err) {
      console.warn('加载日历失败', err);
      wx.showToast({ title: '加载失败', icon: 'none' });
    } finally {
      wx.hideLoading();
    }
  },

  /**
   * 月份副标题：显示当月节气月份（如「寅月」）
   */
  buildMonthSubtitle: function (year, month, monthData) {
    const monthNames = ['', '正月', '二月', '三月', '四月', '五月', '六月',
                       '七月', '八月', '九月', '十月', '冬月', '腊月'];
    if (!monthData || monthData.length === 0) return monthNames[month] || '';
    // 用当月第一天的建除月支（节气的月）
    try {
      const firstDay = evaluateDay(year, month, 1);
      const zhiMap = { '寅': '正月', '卯': '二月', '辰': '三月', '巳': '四月',
                       '午': '五月', '未': '六月', '申': '七月', '酉': '八月',
                       '戌': '九月', '亥': '十月', '子': '冬月', '丑': '腊月' };
      const zhiName = zhiMap[firstDay.monthZhi] || '';
      return zhiName || monthNames[month];
    } catch (e) {
      return monthNames[month];
    }
  },

  // ==================== 月份切换 ====================

  onPrevMonth: function () {
    let { year, month } = this.data;
    month -= 1;
    if (month < 1) {
      month = 12;
      year -= 1;
    }
    this.setData({ year, month });
    this.buildCalendar(year, month);
  },

  onNextMonth: function () {
    let { year, month } = this.data;
    month += 1;
    if (month > 12) {
      month = 1;
      year += 1;
    }
    this.setData({ year, month });
    this.buildCalendar(year, month);
  },

  onTodayTap: function () {
    const { todayYear, todayMonth } = this.data;
    this.setData({ year: todayYear, month: todayMonth });
    this.buildCalendar(todayYear, todayMonth);
    // 同时选中今天
    const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(this.data.todayDay).padStart(2, '0')}`;
    const idx = this.data.calendarDays.findIndex(d => d.date === todayStr);
    if (idx >= 0) {
      this.selectDay(todayStr, idx);
    }
  },

  // ==================== 事项切换 ====================

  onMatterChange: function (e) {
    const key = e.currentTarget.dataset.key;
    const matter = this.data.matters.find(m => m.key === key);
    if (!matter) return;
    this.setData({
      currentMatter: key,
      currentMatterLabel: matter.label,
      selectedDay: null, // 切事项后清空选中
    });
    // 重建当月日历（新事项的评分体系）
    this.buildCalendar(this.data.year, this.data.month);
  },

  // ==================== 点击日期 ====================

  onDayTap: function (e) {
    const date = e.currentTarget.dataset.date;
    const idx = e.currentTarget.dataset.index;
    if (!date) return;

    this.selectDay(date, idx);
  },

  selectDay: function (date, idx) {
    try {
      const [y, m, d] = date.split('-').map(Number);
      const ev = evaluateDayForMatter(y, m, d, this.data.currentMatter);

      // 选中样式更新
      const calendarDays = this.data.calendarDays.map((c, i) => ({
        ...c,
        selected: i === idx,
      }));

      const weekday = WEEKDAYS[new Date(y, m - 1, d).getDay()];

      this.setData({
        calendarDays,
        selectedDay: {
          date,
          dayNum: d,
          monthMonth: m,
          weekday,
          dayGanZhi: ev.dayGanZhi,
          jianChu: ev.jianChu,
          daoType: ev.daoType,
          level: ev.level,
          levelCls: detailLevelClsOf(ev.level),
          daoCls: daoClsOf(ev.daoType, 'detail'),
          score: ev.score,
          yi: ev.yi,
          ji: ev.ji,
          desc: ev.desc,
          isGood: ev.score >= 80,
        },
      });
    } catch (err) {
      console.warn('选择日期失败', err);
      wx.showToast({ title: '查询失败', icon: 'none' });
    }
  },

  // ==================== 推荐吉日 ====================

  onFindGoodDays: function () {
    this.setData({ showRecommend: true, recommendList: [], recommendLoading: true });

    // 用 setTimeout 把 loading 状态先渲染出来
    setTimeout(() => {
      try {
        const { year, month, currentMatter } = this.data;
        // 从当月开始，找未来 90 天内的吉日
        const startY = year;
        const startM = month;
        const startD = 1;
        const endDate = new Date(year, month - 1, 1);
        endDate.setDate(endDate.getDate() + 90);
        const endY = endDate.getFullYear();
        const endM = endDate.getMonth() + 1;
        const endD = endDate.getDate();

        const result = findGoodDays(currentMatter, startY, startM, startD, endY, endM, endD, 60, 10);

        // 适配 UI 数据
        const recommendList = result.goodDays.map(d => {
          const [y, m, day] = d.date.split('-').map(Number);
          const date = new Date(y, m - 1, day);
          return {
            ...d,
            dayNum: day,
            monthLabel: `${m}月`,
            weekday: `周${WEEKDAYS[date.getDay()]}`,
            levelCls: recommendLevelClsOf(d.level),
            daoCls: daoClsOf(d.daoType, 'recommend'),
          };
        });

        this.setData({
          recommendList,
          recommendLoading: false,
        });
      } catch (err) {
        console.warn('查找吉日失败', err);
        this.setData({ recommendLoading: false });
        wx.showToast({ title: '查找失败', icon: 'none' });
      }
    }, 100);
  },

  onCloseRecommend: function () {
    this.setData({ showRecommend: false });
  },

  onRecommendItemTap: function (e) {
    const date = e.currentTarget.dataset.date;
    if (!date) return;

    // 1. 关闭弹层
    this.setData({ showRecommend: false });

    // 2. 切换到该日期所在月份
    const [y, m, d] = date.split('-').map(Number);
    if (y !== this.data.year || m !== this.data.month) {
      this.setData({ year: y, month: m });
      // 等月历重建完再选中
      setTimeout(() => {
        this.buildCalendar(y, m);
        setTimeout(() => {
          const idx = this.data.calendarDays.findIndex(c => c.date === date);
          if (idx >= 0) this.selectDay(date, idx);
        }, 50);
      }, 50);
    } else {
      // 3. 直接选中
      const idx = this.data.calendarDays.findIndex(c => c.date === date);
      if (idx >= 0) this.selectDay(date, idx);
    }
  },
});
