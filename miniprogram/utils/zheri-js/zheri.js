"use strict";
/**
 * 择日工具 · 统一入口
 * tsc 编译自 zheri.ts（module: commonjs）
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMonthJianChu = exports.findGoodDays = exports.evaluateDayForMatter = void 0;
const constants_1 = require("./constants");
const jianChu_1 = require("./jianChu");
const JIAN_CHU_BASE_SCORE = {
  建: 50,
  除: 65,
  满: 45,
  平: 50,
  定: 75,
  执: 60,
  破: 15,
  危: 40,
  成: 80,
  收: 60,
  开: 85,
  闭: 20,
};
const DAO_BONUS = 15;
const DAO_PENALTY = -10;
const PREFERRED_BONUS = 20;
const FORBIDDEN_PENALTY = -50;
/** 通用宜忌中该事项被列为"忌"的减分 */
const GENERAL_JI_PENALTY = -30;
/** 通用宜忌中该事项被列为"宜"的加分 */
const GENERAL_YI_BONUS = 10;

/** 判断事项是否匹配 JIAN_CHU_INFO 中的某个关键词 */
function matchMatterToKeyword(matter, keyword) {
  var keywords = constants_1.MATTER_TO_YIJI_KEYWORD[matter];
  if (!keywords) return false;
  return keywords.indexOf(keyword) >= 0;
}

function scoreDay(jianChu, level, daoType, matter) {
  var score = JIAN_CHU_BASE_SCORE[jianChu];
  if (daoType === '黄道') score += DAO_BONUS;
  else score += DAO_PENALTY;
  if (constants_1.MATTER_PREFERRED[matter].indexOf(jianChu) >= 0) {
    score += PREFERRED_BONUS;
  }
  if (constants_1.MATTER_FORBIDDEN[matter].indexOf(jianChu) >= 0) {
    score += FORBIDDEN_PENALTY;
  }

  // ==== 新增：参考 JIAN_CHU_INFO 通用宜忌，与首页 getDailyYiJi 同源 ====
  var jianChuInfo = constants_1.JIAN_CHU_INFO[jianChu];
  for (var yiIdx = 0; yiIdx < jianChuInfo.yi.length; yiIdx++) {
    if (matchMatterToKeyword(matter, jianChuInfo.yi[yiIdx])) {
      score += GENERAL_YI_BONUS;
      break;
    }
  }
  for (var jiIdx = 0; jiIdx < jianChuInfo.ji.length; jiIdx++) {
    if (matchMatterToKeyword(matter, jianChuInfo.ji[jiIdx])) {
      score += GENERAL_JI_PENALTY;
      break;
    }
  }

  return Math.max(0, Math.min(120, score));
}

function buildYiJiList(jianChu, matter) {
  var yi = [];
  var ji = [];

  // 来源1：事项专属偏好（优先级最高，避免与通用宜忌矛盾）
  // 例：开业 PREFERRED=[成,开,定,满] → 当日=满 时优先判"宜开业"
  // 通用"开市"虽然也在"满.ji"里，但应被事项偏好覆盖，否则会出现"宜开业+忌开业"自相矛盾
  var isPreferred = constants_1.MATTER_PREFERRED[matter].indexOf(jianChu) >= 0;
  var isForbidden = constants_1.MATTER_FORBIDDEN[matter].indexOf(jianChu) >= 0;

  if (isPreferred) {
    yi.push(matter);
  }
  if (isForbidden) {
    ji.push(matter);
  }

  // 来源2：JIAN_CHU_INFO 通用宜忌（与首页 getDailyYiJi 同源）
  // 只有在"事项专属"未判定时才补充，避免两者冲突
  if (!isPreferred && !isForbidden) {
    var jianChuInfo = constants_1.JIAN_CHU_INFO[jianChu];
    for (var yiIdx = 0; yiIdx < jianChuInfo.yi.length; yiIdx++) {
      if (matchMatterToKeyword(matter, jianChuInfo.yi[yiIdx])) {
        yi.push(matter);
        break;
      }
    }
    for (var jiIdx = 0; jiIdx < jianChuInfo.ji.length; jiIdx++) {
      if (matchMatterToKeyword(matter, jianChuInfo.ji[jiIdx])) {
        ji.push(matter);
        break;
      }
    }
  }

  // 去重
  return {
    yi: yi.filter(function(v, i, a) { return a.indexOf(v) === i; }),
    ji: ji.filter(function(v, i, a) { return a.indexOf(v) === i; }),
  };
}
function evaluateDayForMatter(year, month, day, matter) {
  const base = jianChu_1.evaluateDay(year, month, day);
  const score = scoreDay(base.jianChu, base.level, base.daoType, matter);
  const yiji = buildYiJiList(base.jianChu, matter);
  return {
    date: jianChu_1.formatDate(year, month, day),
    dayGanZhi: base.dayGanZhi,
    jianChu: base.jianChu,
    daoType: base.daoType,
    level: base.level,
    score,
    yi: yiji.yi,
    ji: yiji.ji,
    desc: base.desc,
  };
}
exports.evaluateDayForMatter = evaluateDayForMatter;
function listDates(startYear, startMonth, startDay, endYear, endMonth, endDay) {
  const dates = [];
  const start = new Date(startYear, startMonth - 1, startDay);
  const end = new Date(endYear, endMonth - 1, endDay);
  if (start > end) return dates;
  const current = new Date(start);
  while (current <= end) {
    dates.push({
      y: current.getFullYear(),
      m: current.getMonth() + 1,
      d: current.getDate(),
    });
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
function findGoodDays(matter, startYear, startMonth, startDay, endYear, endMonth, endDay, minScore, maxResults) {
  if (minScore === undefined) minScore = 70;
  if (maxResults === undefined) maxResults = 5;
  const dates = listDates(startYear, startMonth, startDay, endYear, endMonth, endDay);
  const allEvaluations = [];
  for (let i = 0; i < dates.length; i++) {
    const d = dates[i];
    allEvaluations.push(evaluateDayForMatter(d.y, d.m, d.d, matter));
  }
  // 过滤
  const filtered = [];
  for (let i = 0; i < allEvaluations.length; i++) {
    if (allEvaluations[i].score >= minScore) {
      filtered.push(allEvaluations[i]);
    }
  }
  // 排序（按分数倒序）
  filtered.sort(function (a, b) { return b.score - a.score; });
  // 取前 N 个
  const goodDays = filtered.slice(0, maxResults);
  return {
    startDate: jianChu_1.formatDate(startYear, startMonth, startDay),
    endDate: jianChu_1.formatDate(endYear, endMonth, endDay),
    matter: matter,
    goodDays: goodDays,
    totalDays: allEvaluations.length,
  };
}
exports.findGoodDays = findGoodDays;
function listMonthJianChu(year, month, matter = '出行') {
  const lastDay = new Date(year, month, 0).getDate();
  const dates = [];
  for (let d = 1; d <= lastDay; d++) {
    dates.push({ y: year, m: month, d });
  }
  return dates.map(({ y, m, d }) => evaluateDayForMatter(y, m, d, matter));
}
exports.listMonthJianChu = listMonthJianChu;
