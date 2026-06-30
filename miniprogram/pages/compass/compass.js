// pages/compass/compass.js
Page({
  data: {
    statusBarHeight: 20,
    // 罗盘数据
    directionMain: '坐北朝南',
    directionSub: '子山午向',
    directionAngle: '0.0°',
    // 状态
    showPermissionGuide: false,
    showCalibrateTip: false,
    manualMode: false,
    // 传感器
    hasCompass: false,
    currentAzimuth: 0,
    lastAzimuth: 0,
  },

  onLoad: function () {
    const app = getApp();
    this.setData({
      statusBarHeight: app.globalData.statusBarHeight || 20,
    });
  },

  onReady: function () {
    this.initCompass();
    // 初始绘制（延迟确保Canvas就绪）
    setTimeout(() => {
      this.drawCompass(0);
    }, 500);
  },

  onUnload: function () {
    this.stopCompass();
  },

  // 初始化罗盘
  initCompass: function () {
    const that = this;

    wx.startCompass({
      success: function () {
        that.setData({ hasCompass: true });
        that.startCompassListener();
      },
      fail: function () {
        // 降级到手动模式
        that.setData({
          manualMode: true,
          hasCompass: false,
        });
      },
    });
  },

  // 开始罗盘监听
  startCompassListener: function () {
    const that = this;
    let lastDrawTime = 0;

    wx.onCompassChange(function (res) {
      const azimuth = res.direction;
      // 过滤微小抖动
      if (Math.abs(azimuth - that.data.lastAzimuth) > 1) {
        that.setData({
          currentAzimuth: azimuth,
          lastAzimuth: azimuth,
        });
        that.updateDirection(azimuth);

        // 节流：每16ms最多绘制一次
        const now = Date.now();
        if (now - lastDrawTime > 16) {
          lastDrawTime = now;
          that.drawCompass(azimuth);
        }
      }
    });
  },

  // 停止罗盘监听
  stopCompass: function () {
    wx.stopCompass && wx.stopCompass();
  },

  // 更新方位信息
  updateDirection: function (azimuth) {
    // 24山映射
    const directions = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
    const idx = Math.round(azimuth / 45) % 8;
    const mainDir = directions[idx];

    // 24山详细
    const mountains24 = ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];
    const mountainIdx = Math.round(azimuth / 15) % 24;
    const mountain = mountains24[mountainIdx];

    // 坐向计算
    const oppositeIdx = (mountainIdx + 12) % 24;
    const opposite = mountains24[oppositeIdx];

    this.setData({
      directionMain: `坐${this.getOppositeDirection(mainDir)}朝${mainDir}`,
      directionSub: `${mountain}山${opposite}向`,
      directionAngle: `${azimuth.toFixed(1)}°`,
    });
  },

  // 获取相对方向
  getOppositeDirection: function (dir) {
    const map = { '北': '南', '南': '北', '东': '西', '西': '东', '东北': '西南', '东南': '西北', '西南': '东北', '西北': '东南' };
    return map[dir] || dir;
  },

  // 绘制罗盘
  drawCompass: function (azimuth) {
    const that = this;
    const query = wx.createSelectorQuery();
    query.select('#compassCanvas').fields({ node: true, size: true }).exec(function (res) {
      if (!res[0] || !res[0].node) return;

      try {
        const canvas = res[0].node;
        const ctx = canvas.getContext('2d');
        const dpr = wx.getSystemInfoSync().pixelRatio;
        const width = res[0].width;
        const height = res[0].height;

        // 设置画布尺寸
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);

        // 清空画布
        ctx.clearRect(0, 0, width, height);

        // 绘制罗盘
        that.drawCompassBase(ctx, width, height, azimuth);
      } catch (e) {
        // 忽略绘制错误
      }
    });
  },

  // 绘制罗盘基础
  drawCompassBase: function (ctx, width, height, azimuth) {
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 2 - 20;

    ctx.save();
    ctx.translate(centerX, centerY);

    // 旋转罗盘（罗盘逆时针旋转，方位针保持指向北）
    ctx.rotate((-azimuth * Math.PI) / 180);

    // 外圈 - 地盘
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FBF8F3';
    ctx.fill();
    ctx.strokeStyle = '#F0EBE3';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 24山文字
    const mountains24 = ['子', '癸', '丑', '艮', '寅', '甲', '卯', '乙', '辰', '巽', '巳', '丙', '午', '丁', '未', '坤', '申', '庚', '酉', '辛', '戌', '乾', '亥', '壬'];
    ctx.font = '12px PingFang SC';
    ctx.fillStyle = '#3D3229';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    for (let i = 0; i < 24; i++) {
      const angle = (i * 15 - 90) * Math.PI / 180;
      const x = Math.cos(angle) * (radius - 20);
      const y = Math.sin(angle) * (radius - 20);

      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(angle + Math.PI / 2);
      // 四正方位加粗
      if (i % 6 === 0) {
        ctx.font = 'bold 12px PingFang SC';
      }
      ctx.fillText(mountains24[i], 0, 0);
      ctx.restore();
    }

    // 中层人盘 - 刻度线
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, 2 * Math.PI);
    ctx.strokeStyle = '#BFB3A6';
    ctx.lineWidth = 1;
    ctx.stroke();

    // 天池（中心圆）
    ctx.beginPath();
    ctx.arc(0, 0, 20, 0, 2 * Math.PI);
    ctx.fillStyle = '#FFFFFF';
    ctx.fill();
    ctx.strokeStyle = '#F0EBE3';
    ctx.lineWidth = 2;
    ctx.stroke();

    // 恢复旋转
    ctx.rotate((azimuth * Math.PI) / 180);

    // 绘制指针（指向北方）
    ctx.beginPath();
    ctx.moveTo(0, -30);
    ctx.lineTo(-5, 0);
    ctx.lineTo(0, 20);
    ctx.lineTo(5, 0);
    ctx.closePath();
    ctx.fillStyle = '#C46B5C';
    ctx.fill();

    // 北方标记
    ctx.beginPath();
    ctx.moveTo(0, 30);
    ctx.lineTo(-4, 40);
    ctx.lineTo(4, 40);
    ctx.closePath();
    ctx.fillStyle = '#8C7B6B';
    ctx.fill();

    ctx.restore();
  },

  // 请求权限
  requestPermission: function () {
    this.setData({ showPermissionGuide: false });
    this.initCompass();
  },

  // 跳过权限
  skipPermission: function () {
    this.setData({
      showPermissionGuide: false,
      manualMode: true,
    });
  },
});