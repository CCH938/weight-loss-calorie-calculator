// ===== 体重追踪模块 =====

const WeightTracker = {
  STORAGE_KEY: 'weight_tracker_data',
  chart: null,

  /**
   * 获取所有体重记录
   */
  getRecords() {
    const raw = localStorage.getItem(this.STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  },

  /**
   * 保存记录
   */
  saveRecord(date, weight) {
    const records = this.getRecords();
    // 检查是否同一天已有记录
    const idx = records.findIndex(r => r.date === date);
    if (idx >= 0) {
      records[idx].weight = parseFloat(weight);
    } else {
      records.push({ date, weight: parseFloat(weight) });
    }
    // 按日期排序
    records.sort((a, b) => a.date.localeCompare(b.date));
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    return records;
  },

  /**
   * 删除记录
   */
  deleteRecord(date) {
    let records = this.getRecords();
    records = records.filter(r => r.date !== date);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(records));
    return records;
  },

  /**
   * 获取统计数据
   */
  getStats(goalWeight) {
    const records = this.getRecords();
    if (records.length === 0) return null;

    const first = records[0].weight;
    const last = records[records.length - 1].weight;
    const lost = first - last;
    const remain = goalWeight ? last - goalWeight : 0;

    return {
      startWeight: first,
      currentWeight: last,
      lost: lost,
      remain: remain,
      totalRecords: records.length
    };
  },

  /**
   * 渲染图表
   */
  renderChart(canvasId) {
    const records = this.getRecords();
    const ctx = document.getElementById(canvasId);

    if (!ctx) return;

    if (this.chart) {
      this.chart.destroy();
    }

    if (records.length === 0) return;

    const labels = records.map(r => r.date.slice(5)); // MM-DD
    const data = records.map(r => r.weight);

    this.chart = new Chart(ctx, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: '体重 (kg)',
          data: data,
          borderColor: '#4CAF50',
          backgroundColor: 'rgba(76, 175, 80, 0.1)',
          borderWidth: 2.5,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 7,
          pointBackgroundColor: '#4CAF50',
          pointBorderColor: '#fff',
          pointBorderWidth: 2,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: '#333',
            titleFont: { size: 13 },
            bodyFont: { size: 14 },
            padding: 10,
            cornerRadius: 8,
            callbacks: {
              label: (ctx) => ctx.parsed.y + ' kg'
            }
          }
        },
        scales: {
          x: {
            grid: { display: false },
            ticks: { font: { size: 11 }, color: '#999' }
          },
          y: {
            grid: { color: '#f0f0f0' },
            ticks: {
              font: { size: 11 },
              color: '#999',
              callback: (v) => v + ' kg'
            }
          }
        }
      }
    });
  }
};
