// ===== 主应用逻辑 =====

const App = {
  selectedFood: null,
  selectedExercise: null,
  todayMeals: [],
  todayExercises: [],
  currentDiaryDate: new Date().toISOString().slice(0, 10),
  currentMealType: 'breakfast',

  init() {
    this.initDefaultKey();
    this.setupTheme();
    this.setupTabs();
    this.setupCalculator();
    this.setupDiary();
    this.setupExercise();
    this.setupTracker();
    this.setupSettings();
    this.loadTodayMeals();
    this.loadTodayExercises();
    this.updateDiaryDisplay();
    this.updateTrackerDisplay();
    this.setupDateNav();
    this.setupHistory();
    CameraApp.init();
    AIAgent.init();
    this.checkAchievement();
  },
  initDefaultKey() {
    const oldEndpoint = localStorage.getItem('openai_endpoint');
    if (!oldEndpoint || oldEndpoint.includes('deepseek') || oldEndpoint.includes('siliconflow')) {
      localStorage.setItem('openai_endpoint', 'https://open.bigmodel.cn/api/paas/v4');
    }
    const oldModel = localStorage.getItem('openai_model');
    if (!oldModel || oldModel === 'deepseek-chat' || oldModel.includes('Qwen')) {
      localStorage.setItem('openai_model', 'glm-4v-flash');
    }
    if (!localStorage.getItem('openai_api_key')) {
      localStorage.setItem('openai_api_key', '6b15231aa9bb4535b0063bc011b0268d.dvvm4ns0oxzru1MG');
    }
  },

  setupTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.body.classList.add('dark');
      document.getElementById('themeToggle').textContent = '\u2600\ufe0f';
    }
    document.getElementById('themeToggle').addEventListener('click', () => {
      const isDark = document.body.classList.toggle('dark');
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      document.getElementById('themeToggle').textContent = isDark ? '\u2600\ufe0f' : '\ud83c\udf19';
    });
  },

  setupTabs() {
    document.querySelectorAll('.tab-bar .tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-bar .tab').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById('tab-' + btn.dataset.tab).classList.add('active');
        if (btn.dataset.tab === 'agent') {
          AIAgent.initSystemPrompt();
        }
        if (btn.dataset.tab === 'tracker') {
          setTimeout(() => WeightTracker.renderChart('weightChart'), 100);
        }
      });
    });
  },

  setupCalculator() {
    ['age','height','weight','goalWeight','activity','goal'].forEach(id => {
      const el = document.getElementById(id);
      if (el) { el.addEventListener('input', () => this.updateResults()); el.addEventListener('change', () => this.updateResults()); }
    });
    document.querySelectorAll('input[name="gender"]').forEach(radio => radio.addEventListener('change', () => this.updateResults()));
    this.updateResults();
  },

  updateResults() {
    const gender = document.querySelector('input[name="gender"]:checked').value;
    const age = parseInt(document.getElementById('age').value) || 30;
    const height = parseInt(document.getElementById('height').value) || 170;
    const weight = parseFloat(document.getElementById('weight').value) || 70;
    const goalWeight = parseFloat(document.getElementById('goalWeight').value) || 65;
    const activity = document.getElementById('activity').value;
    const deficit = document.getElementById('goal').value;
    const bmr = Calculator.calcBMR(gender, weight, height, age);
    const tdee = Calculator.calcTDEE(bmr, activity);
    const target = Calculator.calcTarget(tdee, deficit);
    const estDays = Calculator.calcEstDays(weight, goalWeight, deficit);
    const macros = Calculator.calcMacros(weight, target);
    document.getElementById('bmrValue').textContent = Math.round(bmr);
    document.getElementById('tdeeValue').textContent = tdee;
    document.getElementById('targetValue').textContent = target;
    document.getElementById('estDays').textContent = estDays;
    document.getElementById('proteinGram').textContent = macros.protein.gram;
    document.getElementById('carbsGram').textContent = macros.carbs.gram;
    document.getElementById('fatGram').textContent = macros.fat.gram;
    document.getElementById('proteinBar').style.width = macros.protein.pct + '%';
    document.getElementById('carbsBar').style.width = macros.carbs.pct + '%';
    document.getElementById('fatBar').style.width = macros.fat.pct + '%';
    document.getElementById('resultCard').style.display = 'block';
    localStorage.setItem('user_profile', JSON.stringify({gender,age,height,weight,goalWeight,activity,deficit,bmr:Math.round(bmr),tdee,target}));
    this.updateDiaryDisplay();
  },

  setupDiary() {
    const searchInput = document.getElementById('foodSearch');
    const suggestions = document.getElementById('foodSuggestions');
    const addBtn = document.getElementById('addFoodBtn');

    document.querySelectorAll('.meal-type-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('.meal-type-chip').forEach(c => c.classList.remove('selected'));
        chip.classList.add('selected');
        this.currentMealType = chip.dataset.meal;
      });
    });

    searchInput.addEventListener('input', () => {
      const results = searchFood(searchInput.value);
      if (results.length > 0) {
        suggestions.innerHTML = results.map(f => '<div class="food-suggestion-item" data-name="' + f.name + '" data-cal="' + f.cal + '"><span>' + f.name + ' <small style="color:#999;">' + f.category + '</small></span><span class="sug-cal">' + f.cal + ' kcal/100g</span></div>').join('');
        suggestions.classList.add('show');
      } else { suggestions.classList.remove('show'); }
    });

    suggestions.addEventListener('click', (e) => {
      const item = e.target.closest('.food-suggestion-item');
      if (item) {
        searchInput.value = item.dataset.name;
        this.selectedFood = { name: item.dataset.name, cal: parseInt(item.dataset.cal) };
        suggestions.classList.remove('show');
        const food = findFood(item.dataset.name);
        if (food) { this.selectedFood.protein = food.protein; this.selectedFood.carbs = food.carbs; this.selectedFood.fat = food.fat; }
      }
    });

    addBtn.addEventListener('click', () => this.addFoodToDiary());
    searchInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') { suggestions.classList.remove('show'); this.addFoodToDiary(); } });
    document.addEventListener('click', (e) => { if (!e.target.closest('#foodSuggestions') && !e.target.closest('#foodSearch')) suggestions.classList.remove('show'); });
    this.renderFrequentFoods();
  },

  renderFrequentFoods() {
    const container = document.getElementById('frequentFoods');
    const freqData = JSON.parse(localStorage.getItem('food_frequency') || '{}');
    const sorted = Object.entries(freqData).sort((a, b) => b[1] - a[1]).slice(0, 5);
    if (sorted.length === 0) { container.style.display = 'none'; return; }
    container.style.display = 'flex';
    container.innerHTML = sorted.map(([name, count]) => {
      const food = findFood(name);
      return '<div class="frequent-chip" data-name="' + name + '" data-cal="' + (food ? food.cal : 0) + '">' + name + ' <span class="freq-count">' + count + '\u6b21</span></div>';
    }).join('');
    container.querySelectorAll('.frequent-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.getElementById('foodSearch').value = chip.dataset.name;
        this.selectedFood = { name: chip.dataset.name, cal: parseInt(chip.dataset.cal) };
        const food = findFood(chip.dataset.name);
        if (food) { this.selectedFood.protein = food.protein; this.selectedFood.carbs = food.carbs; this.selectedFood.fat = food.fat; }
        document.getElementById('foodAmount').focus();
      });
    });
  },

  trackFoodFrequency(name) {
    const freqData = JSON.parse(localStorage.getItem('food_frequency') || '{}');
    freqData[name] = (freqData[name] || 0) + 1;
    localStorage.setItem('food_frequency', JSON.stringify(freqData));
  },

  addFoodToDiary() {
    const searchInput = document.getElementById('foodSearch');
    const name = searchInput.value.trim();
    const amount = parseFloat(document.getElementById('foodAmount').value) || 100;
    if (!name) { this.showToast('\u8bf7\u5148\u641c\u7d22\u9009\u62e9\u98df\u7269'); return; }
    const food = findFood(name);
    if (!food) { this.showToast('\u672a\u627e\u5230\u8be5\u98df\u7269\uff0c\u8bf7\u4ece\u5217\u8868\u4e2d\u9009\u62e9'); return; }
    const totalCal = Math.round(food.cal * amount / 100);
    const date = this.currentDiaryDate;
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    this.todayMeals.push({
      name: food.name, amount: amount, calPer100: food.cal, totalCal: totalCal,
      protein: food.protein ? Math.round(food.protein * amount / 100 * 10) / 10 : 0,
      carbs: food.carbs ? Math.round(food.carbs * amount / 100 * 10) / 10 : 0,
      fat: food.fat ? Math.round(food.fat * amount / 100 * 10) / 10 : 0,
      time: time, date: date, mealType: this.currentMealType
    });
    this.trackFoodFrequency(food.name);
    this.saveTodayMeals();
    this.updateDiaryDisplay();
    this.renderFrequentFoods();
    searchInput.value = '';
    document.getElementById('foodAmount').value = 100;
    this.selectedFood = null;
    this.showToast('\u2705 ' + food.name + ' ' + totalCal + ' kcal');
  },

  setupExercise() {
    const searchInput = document.getElementById('exerciseSearch');
    const suggestions = document.getElementById('exerciseSuggestions');
    const addBtn = document.getElementById('addExerciseBtn');
    document.getElementById('exerciseToggle').addEventListener('click', function() {
      this.classList.toggle('open');
      document.getElementById('exerciseBody').classList.toggle('open');
    });
    searchInput.addEventListener('input', () => {
      const results = searchExercise(searchInput.value);
      if (results.length > 0) {
        suggestions.innerHTML = results.map(e => '<div class="exercise-suggestion-item" data-name="' + e.name + '" data-cal="' + e.calPerKgH + '">' + e.icon + ' ' + e.name + ' <small style="color:#999;">' + e.calPerKgH + ' kcal/kg/h</small></div>').join('');
        suggestions.classList.add('show');
      } else { suggestions.classList.remove('show'); }
    });
    suggestions.addEventListener('click', (e) => {
      const item = e.target.closest('.exercise-suggestion-item');
      if (item) { searchInput.value = item.dataset.name; this.selectedExercise = { name: item.dataset.name, calPerKgH: parseFloat(item.dataset.cal) }; suggestions.classList.remove('show'); }
    });
    document.addEventListener('click', (e) => { if (!e.target.closest('#exerciseSuggestions') && !e.target.closest('#exerciseSearch')) suggestions.classList.remove('show'); });
    addBtn.addEventListener('click', () => this.addExercise());
  },

  addExercise() {
    const searchInput = document.getElementById('exerciseSearch');
    const name = searchInput.value.trim();
    const duration = parseInt(document.getElementById('exerciseDuration').value) || 30;
    if (!name || !this.selectedExercise) { this.showToast('\u8bf7\u5148\u641c\u7d22\u9009\u62e9\u8fd0\u52a8\u7c7b\u578b'); return; }
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const weight = profile.weight || 70;
    const calBurned = Math.round(this.selectedExercise.calPerKgH * weight * duration / 60);
    const date = this.currentDiaryDate;
    this.todayExercises.push({ name: name, duration: duration, calBurned: calBurned, date: date });
    this.saveTodayExercises();
    this.updateDiaryDisplay();
    searchInput.value = '';
    document.getElementById('exerciseDuration').value = 30;
    this.selectedExercise = null;
    this.showToast('\ud83d\udd25 \u6d88\u8017 ' + calBurned + ' kcal');
  },

  loadTodayExercises() { const date = this.currentDiaryDate; const raw = localStorage.getItem('exercise_' + date); this.todayExercises = raw ? JSON.parse(raw) : []; },
  saveTodayExercises() { const date = this.currentDiaryDate; localStorage.setItem('exercise_' + date, JSON.stringify(this.todayExercises)); },

  loadTodayMeals() {
    const date = this.currentDiaryDate;
    const raw = localStorage.getItem('meals_' + date);
    this.todayMeals = raw ? JSON.parse(raw) : [];
    this.todayMeals = this.todayMeals.map(m => ({ mealType: m.mealType || 'lunch', protein: m.protein || 0, carbs: m.carbs || 0, fat: m.fat || 0, ...m }));
  },

  saveTodayMeals() { const date = this.currentDiaryDate; localStorage.setItem('meals_' + date, JSON.stringify(this.todayMeals)); },

  setupDateNav() {
    document.getElementById('datePrev').addEventListener('click', () => this.changeDate(-1));
    document.getElementById('dateNext').addEventListener('click', () => this.changeDate(1));
    this.updateDateTitle();
  },

  changeDate(delta) {
    const d = new Date(this.currentDiaryDate + 'T00:00:00'); d.setDate(d.getDate() + delta);
    this.currentDiaryDate = d.toISOString().slice(0, 10);
    this.updateDateTitle(); this.loadTodayMeals(); this.loadTodayExercises(); this.updateDiaryDisplay();
  },

  updateDateTitle() {
    const realToday = new Date().toISOString().slice(0, 10);
    const d = new Date(this.currentDiaryDate + 'T00:00:00');
    const weekdays = ['\u5468\u65e5','\u5468\u4e00','\u5468\u4e8c','\u5468\u4e09','\u5468\u56db','\u5468\u4e94','\u5468\u516d'];
    const title = this.currentDiaryDate === realToday ? '\ud83d\udcc5 \u4eca\u65e5\u996e\u98df' : '\ud83d\udcc5 ' + this.currentDiaryDate.slice(5) + ' ' + weekdays[d.getDay()];
    document.getElementById('diaryDateTitle').textContent = title;
    document.getElementById('foodListTitle').textContent = this.currentDiaryDate === realToday ? '\ud83d\udccb \u4eca\u65e5\u98df\u7269\u5217\u8868' : '\ud83d\udccb ' + this.currentDiaryDate.slice(5) + ' \u98df\u7269\u5217\u8868';
    const tomorrow = new Date(realToday + 'T00:00:00'); tomorrow.setDate(tomorrow.getDate() + 1);
    document.getElementById('dateNext').disabled = this.currentDiaryDate >= tomorrow.toISOString().slice(0, 10);
  },

  updateDiaryDisplay() {
    const total = this.todayMeals.reduce((sum, m) => sum + m.totalCal, 0);
    const exerciseTotal = this.todayExercises.reduce((sum, e) => sum + e.calBurned, 0);
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const target = profile.target || 2000;
    const remaining = target - total;

    document.getElementById('todayCalories').textContent = total;
    document.getElementById('todayRemaining').textContent = remaining > 0 ? remaining : 0;
    document.getElementById('todayRemaining').style.color = remaining < 0 ? '#F44336' : '';

    // Progress ring
    const percent = Math.min(Math.round(total / target * 100), 100);
    const circumference = 238.76;
    const offset = circumference - (percent / 100) * circumference;
    const ring = document.getElementById('progressRing');
    ring.style.strokeDashoffset = offset;
    ring.classList.toggle('over', percent > 100);
    document.getElementById('ringPercent').textContent = percent + '%';
    document.getElementById('ringLabel').textContent = percent > 100 ? '\u8d85\u6807!' : '\u5df2\u6444\u5165';

    // Net calories
    const netCalDisplay = document.getElementById('netCalDisplay');
    if (exerciseTotal > 0) {
      const netRemaining = target - (total - exerciseTotal);
      netCalDisplay.style.display = 'block';
      netCalDisplay.textContent = '\ud83d\udd25 \u8fd0\u52a8\u6d88\u8017 ' + exerciseTotal + ' kcal | \u51c0\u6444\u5165 ' + (total - exerciseTotal) + ' kcal | \u51c0\u5269\u4f59 ' + netRemaining + ' kcal';
      netCalDisplay.className = 'net-cal ' + (netRemaining >= 0 ? 'good' : 'warn');
    } else { netCalDisplay.style.display = 'none'; }

    // Actual macros
    const actProtein = this.todayMeals.reduce((s, m) => s + (m.protein || 0), 0);
    const actCarbs = this.todayMeals.reduce((s, m) => s + (m.carbs || 0), 0);
    const actFat = this.todayMeals.reduce((s, m) => s + (m.fat || 0), 0);
    document.getElementById('actProtein').textContent = Math.round(actProtein);
    document.getElementById('actCarbs').textContent = Math.round(actCarbs);
    document.getElementById('actFat').textContent = Math.round(actFat);
    const macros = profile.weight ? Calculator.calcMacros(profile.weight, target) : null;
    if (macros) {
      document.getElementById('targetProtein').textContent = '/ ' + macros.protein.gram;
      document.getElementById('targetCarbs').textContent = '/ ' + macros.carbs.gram;
      document.getElementById('targetFat').textContent = '/ ' + macros.fat.gram;
    }

    // Food list
    const list = document.getElementById('foodList');
    const mealLabels = { breakfast: '\ud83c\udf05\u65e9\u9910', lunch: '\u2600\ufe0f\u5348\u9910', dinner: '\ud83c\udf19\u665a\u9910', snack: '\ud83c\udf6a\u52a0\u9910' };
    if (this.todayMeals.length === 0) {
      list.innerHTML = '<li class="food-empty">\u8fd8\u6ca1\u6709\u8bb0\u5f55\u98df\u7269\uff0c\u5f00\u59cb\u6dfb\u52a0\u5427\uff01</li>';
    } else {
      list.innerHTML = this.todayMeals.map((m, i) => {
        return '<li><div class="food-item-info"><span class="food-item-name"><span class="meal-badge meal-' + (m.mealType || 'lunch') + '">' + (mealLabels[m.mealType] || '\u2600\ufe0f\u5348\u9910') + '</span>' + (m.fromAI ? '\ud83e\udd16 ' : '') + m.name + '</span><span class="food-item-detail">' + m.amount + 'g \u00b7 ' + m.time + '</span></div><span class="food-item-cal">' + m.totalCal + ' kcal</span><button class="food-item-del" data-idx="' + i + '">\u2715</button></li>';
      }).join('');
      list.querySelectorAll('.food-item-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          this.todayMeals.splice(idx, 1);
          this.saveTodayMeals();
          this.updateDiaryDisplay();
        });
      });
    }

    // Exercise list
    const exerciseList = document.getElementById('exerciseList');
    if (this.todayExercises.length === 0) {
      exerciseList.innerHTML = '<li style="color:#999;font-size:13px;text-align:center;padding:8px;">\u6682\u65e0\u8fd0\u52a8\u8bb0\u5f55</li>';
    } else {
      exerciseList.innerHTML = this.todayExercises.map((e, i) => {
        return '<li><span>' + e.name + ' \u00b7 ' + e.duration + '\u5206\u949f</span><div><span class="exercise-cal">-' + e.calBurned + ' kcal</span><button class="exercise-del" data-idx="' + i + '">\u2715</button></div></li>';
      }).join('');
      exerciseList.querySelectorAll('.exercise-del').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const idx = parseInt(e.target.dataset.idx);
          this.todayExercises.splice(idx, 1);
          this.saveTodayExercises();
          this.updateDiaryDisplay();
        });
      });
    }
  },

  setupHistory() {
    document.getElementById('historyToggleBtn').addEventListener('click', () => {
      const card = document.getElementById('historyCard');
      const isVisible = card.style.display !== 'none';
      card.style.display = isVisible ? 'none' : 'block';
      document.getElementById('historyToggleBtn').textContent = isVisible ? '\ud83d\udcc5 \u5386\u53f2' : '\u2715 \u5173\u95ed';
      if (!isVisible) this.renderHistory();
    });
  },

  renderHistory() {
    const summaryDiv = document.getElementById('historySummary');
    const listDiv = document.getElementById('historyList');
    const realToday = new Date().toISOString().slice(0, 10);
    const d7 = new Date(); d7.setDate(d7.getDate() - 6);
    let weekTotal = 0, weekDays = 0, monthTotal = 0, monthDays = 0;
    const allDates = [];
    for (let i = 29; i >= 0; i--) { const d = new Date(); d.setDate(d.getDate() - i); allDates.push(d.toISOString().slice(0, 10)); }
    const dateData = allDates.map(date => {
      const raw = localStorage.getItem('meals_' + date);
      const meals = raw ? JSON.parse(raw) : [];
      const total = meals.reduce((s, m) => s + (m.totalCal || 0), 0);
      return { date, meals, total };
    });
    dateData.forEach(d => {
      if (d.meals.length > 0) { monthTotal += d.total; monthDays++; if (d.date >= d7.toISOString().slice(0, 10)) { weekTotal += d.total; weekDays++; } }
    });
    const weekAvg = weekDays > 0 ? Math.round(weekTotal / weekDays) : 0;
    const monthAvg = monthDays > 0 ? Math.round(monthTotal / monthDays) : 0;
    summaryDiv.innerHTML = '<div class="history-summary-stat"><span class="hs-num">' + weekAvg + '</span><span class="hs-label">\u8fd17\u5929\u65e5\u5747 (kcal)</span></div><div class="history-summary-stat"><span class="hs-num">' + monthAvg + '</span><span class="hs-label">\u8fd130\u5929\u65e5\u5747 (kcal)</span></div><div class="history-summary-stat"><span class="hs-num">' + monthDays + '</span><span class="hs-label">\u6709\u8bb0\u5f55\u5929\u6570</span></div>';
    this.renderCalorieTrend(dateData);
    const weekdays = ['\u5468\u65e5','\u5468\u4e00','\u5468\u4e8c','\u5468\u4e09','\u5468\u56db','\u5468\u4e94','\u5468\u516d'];
    listDiv.innerHTML = dateData.filter(d => d.meals.length > 0).slice(0, 30).map(d => {
      const dd = new Date(d.date + 'T00:00:00');
      const items = d.meals.map(m => m.name).join('\u3001');
      const isToday = d.date === realToday;
      return '<li class="' + (isToday ? 'today-row' : '') + '" data-date="' + d.date + '"><div><span class="history-date">' + d.date.slice(5) + '<span class="weekday">' + weekdays[dd.getDay()] + '</span></span><span class="history-items">' + (items.length > 25 ? items.slice(0, 25) + '...' : items) + '</span></div><span class="history-cal">' + d.total + ' kcal</span></li>';
    }).join('');
    listDiv.querySelectorAll('li').forEach(li => {
      li.addEventListener('click', () => {
        this.currentDiaryDate = li.dataset.date;
        this.updateDateTitle(); this.loadTodayMeals(); this.loadTodayExercises(); this.updateDiaryDisplay();
        document.getElementById('historyCard').style.display = 'none';
        document.getElementById('historyToggleBtn').textContent = '\ud83d\udcc5 \u5386\u53f2';
        document.getElementById('tab-diary').scrollIntoView({ behavior: 'smooth' });
      });
    });
  },

  renderCalorieTrend(dateData) {
    const ctx = document.getElementById('calorieTrendChart');
    if (!ctx) return;
    const canvas = ctx.getContext('2d');
    if (this.calorieChart) this.calorieChart.destroy();
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const target = profile.target || 2000;
    const recent30 = dateData.filter(d => d.total > 0 || d.date <= new Date().toISOString().slice(0, 10));
    ctx.parentElement.style.height = '200px';
    this.calorieChart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: recent30.map(d => d.date.slice(5)),
        datasets: [{
          label: '\u6444\u5165 (kcal)', data: recent30.map(d => d.total),
          backgroundColor: recent30.map(d => d.total > target ? 'rgba(244,67,54,0.6)' : 'rgba(76,175,80,0.6)'), borderRadius: 4,
        }, {
          label: '\u76ee\u6807', data: Array(recent30.length).fill(target), type: 'line',
          borderColor: 'rgba(255,152,0,0.8)', borderWidth: 2, borderDash: [5, 5], pointRadius: 0, fill: false,
        }]
      },
      options: {
        responsive: true, maintainAspectRatio: false,
        plugins: { legend: { labels: { boxWidth: 12, padding: 12, font: { size: 11 }, color: '#999' } } },
        scales: {
          x: { ticks: { font: { size: 10 }, maxTicksLimit: 14, maxRotation: 45, color: '#999' }, grid: { display: false } },
          y: { ticks: { font: { size: 10 }, color: '#999' }, grid: { color: '#f0f0f0' } }
        }
      }
    });
  },

  checkAchievement() {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const target = profile.target || 2000;
    const today = new Date().toISOString().slice(0, 10);
    const raw = localStorage.getItem('meals_' + today);
    const meals = raw ? JSON.parse(raw) : [];
    const total = meals.reduce((s, m) => s + (m.totalCal || 0), 0);
    const achievements = JSON.parse(localStorage.getItem('achievements_shown') || '{}');
    let achievement = null;
    let streak = 0;
    for (let i = 0; i < 30; i++) {
      const d = new Date(); d.setDate(d.getDate() - i);
      if (localStorage.getItem('meals_' + d.toISOString().slice(0, 10))) streak++; else break;
    }
    if (streak >= 7 && !achievements['streak7']) {
      achievement = { id: 'streak7', icon: '\ud83d\udd25', title: '\u575a\u6301\u5c31\u662f\u80dc\u5229\uff01', desc: '\u8fde\u7eed ' + streak + ' \u5929\u8bb0\u5f55\u996e\u98df\uff0c\u592a\u68d2\u4e86\uff01' };
    } else if (streak >= 3 && !achievements['streak3']) {
      achievement = { id: 'streak3', icon: '\ud83c\udf1f', title: '\u597d\u7684\u5f00\u59cb\uff01', desc: '\u5df2\u8fde\u7eed ' + streak + ' \u5929\u8bb0\u5f55\u996e\u98df\uff0c\u7ee7\u7eed\u4fdd\u6301\uff01' };
    }
    if (total > 0 && total <= target && total >= target * 0.8 && !achievements['onTrack_' + today]) {
      achievement = { id: 'onTrack_' + today, icon: '\u2705', title: '\u5b8c\u7f8e\u8fbe\u6807\uff01', desc: '\u4eca\u65e5\u6444\u5165 ' + total + ' kcal\uff0c\u5b8c\u7f8e\u63a7\u5236\u5728\u76ee\u6807\u8303\u56f4\u5185\uff01' };
    }
    if (achievement) {
      this.showAchievement(achievement);
      achievements[achievement.id] = true;
      localStorage.setItem('achievements_shown', JSON.stringify(achievements));
    }
  },

  showAchievement(a) {
    const overlay = document.createElement('div');
    overlay.className = 'achievement-overlay';
    overlay.innerHTML = '<div class="achievement-popup"><span class="achievement-icon">' + a.icon + '</span><p class="achievement-title">' + a.title + '</p><p class="achievement-desc">' + a.desc + '</p><button class="achievement-close">\ud83c\udf89 \u592a\u68d2\u4e86</button></div>';
    document.body.appendChild(overlay);
    overlay.querySelector('.achievement-close').addEventListener('click', () => overlay.remove());
    overlay.addEventListener('click', (e) => { if (e.target === overlay) overlay.remove(); });
  },

  setupTracker() {
    document.getElementById('logDate').value = new Date().toISOString().slice(0, 10);
    document.getElementById('logWeightBtn').addEventListener('click', () => {
      const weight = parseFloat(document.getElementById('logWeight').value);
      const date = document.getElementById('logDate').value;
      if (!weight || weight < 30 || weight > 300) { this.showToast('\u8bf7\u8f93\u5165\u6709\u6548\u7684\u4f53\u91cd\uff0830-300 kg\uff09'); return; }
      WeightTracker.saveRecord(date, weight);
      document.getElementById('logWeight').value = '';
      this.showToast('\u4f53\u91cd\u5df2\u8bb0\u5f55\uff01');
      this.updateTrackerDisplay();
      WeightTracker.renderChart('weightChart');
    });
  },

  updateTrackerDisplay() {
    const records = WeightTracker.getRecords();
    const stats = WeightTracker.getStats();
    const historyList = document.getElementById('weightHistory');
    if (records.length === 0) { historyList.innerHTML = '<li class="food-empty">\u8fd8\u6ca1\u6709\u8bb0\u5f55\u4f53\u91cd\u6570\u636e</li>'; }
    else {
      historyList.innerHTML = records.slice().reverse().map((r, i) => {
        const prev = records.slice().reverse()[i + 1];
        let changeHtml = '';
        if (prev) { const diff = (r.weight - prev.weight).toFixed(1); const cls = diff < 0 ? 'down' : 'up'; const sign = diff > 0 ? '+' : ''; changeHtml = '<span class="weight-change ' + cls + '">' + sign + diff + 'kg</span>'; }
        return '<li><span class="weight-date">' + r.date + '</span><span class="weight-val">' + r.weight + ' kg</span>' + changeHtml + '<button class="weight-history-del" data-date="' + r.date + '">\u2715</button></li>';
      }).join('');
      historyList.querySelectorAll('.weight-history-del').forEach(btn => {
        btn.addEventListener('click', (e) => { WeightTracker.deleteRecord(e.target.dataset.date); this.updateTrackerDisplay(); WeightTracker.renderChart('weightChart'); });
      });
    }
    if (stats) {
      document.getElementById('weightStats').style.display = 'block';
      document.getElementById('statStart').textContent = stats.startWeight.toFixed(1) + ' kg';
      document.getElementById('statCurrent').textContent = stats.currentWeight.toFixed(1) + ' kg';
      document.getElementById('statLost').textContent = stats.lost.toFixed(1) + ' kg';
      document.getElementById('statRemain').textContent = stats.remain > 0 ? stats.remain.toFixed(1) + ' kg' : '\u5df2\u8fbe\u6210\uff01\ud83c\udf89';
    } else { document.getElementById('weightStats').style.display = 'none'; }
  },

  setupSettings() {
    const modal = document.getElementById('settingsModal');
    const apiKeyInput = document.getElementById('apiKey');
    const endpointInput = document.getElementById('apiEndpoint');
    const modelSelect = document.getElementById('modelSelect');
    apiKeyInput.value = localStorage.getItem('openai_api_key') || '';
    endpointInput.value = localStorage.getItem('openai_endpoint') || 'https://open.bigmodel.cn/api/paas/v4';
    modelSelect.value = localStorage.getItem('openai_model') || 'glm-4v-flash';
    document.getElementById('settingsBtn').addEventListener('click', () => { modal.style.display = 'flex'; apiKeyInput.value = localStorage.getItem('openai_api_key') || ''; });
    document.getElementById('closeSettings').addEventListener('click', () => { modal.style.display = 'none'; });
    modal.addEventListener('click', (e) => { if (e.target === modal) modal.style.display = 'none'; });
    document.getElementById('saveSettings').addEventListener('click', () => {
      const key = apiKeyInput.value.trim();
      const endpoint = endpointInput.value.trim() || 'https://open.bigmodel.cn/api/paas/v4';
      const model = modelSelect.value;
      if (!key) { document.getElementById('settingsStatus').textContent = '\u8bf7\u8f93\u5165 API Key'; document.getElementById('settingsStatus').className = 'form-status error'; return; }
      localStorage.setItem('openai_api_key', key);
      localStorage.setItem('openai_endpoint', endpoint);
      localStorage.setItem('openai_model', model);
      document.getElementById('settingsStatus').textContent = '\u2705 \u8bbe\u7f6e\u5df2\u4fdd\u5b58\uff01';
      document.getElementById('settingsStatus').className = 'form-status success';
      setTimeout(() => { modal.style.display = 'none'; }, 1000);
    });
  },

  showToast(msg) {
    let toast = document.getElementById('toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'toast';
      toast.style.cssText = 'position: fixed; bottom: 90px; left: 50%; transform: translateX(-50%); background: #333; color: #fff; padding: 12px 24px; border-radius: 24px; font-size: 14px; font-weight: 600; z-index: 9999; opacity: 0; transition: opacity 0.3s; pointer-events: none; white-space: nowrap;';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.style.opacity = '1';
    clearTimeout(toast._timeout);
    toast._timeout = setTimeout(() => { toast.style.opacity = '0'; }, 2000);
  }
};

// ===== 启动 =====
document.addEventListener('DOMContentLoaded', () => App.init());

// ===== 恢复用户配置 =====
(function() {
  const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
  if (profile.gender) {
    const radio = document.querySelector('input[name="gender"][value="' + profile.gender + '"]');
    if (radio) radio.checked = true;
  }
  if (profile.age) document.getElementById('age').value = profile.age;
  if (profile.height) document.getElementById('height').value = profile.height;
  if (profile.weight) document.getElementById('weight').value = profile.weight;
  if (profile.goalWeight) document.getElementById('goalWeight').value = profile.goalWeight;
  if (profile.activity) document.getElementById('activity').value = profile.activity;
  if (profile.deficit) document.getElementById('goal').value = profile.deficit;
})();





