// ===== AI 减肥智能体 =====

const AIAgent = {
  messages: [],

  init() {
    this.setupChat();
    this.initSystemPrompt();
  },

  initSystemPrompt() {
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const today = new Date().toISOString().slice(0, 10);
    const rawMeals = localStorage.getItem('meals_' + today);
    const meals = rawMeals ? JSON.parse(rawMeals) : [];
    const totalCal = meals.reduce((s, m) => s + (m.totalCal || 0), 0);
    const target = profile.target || 2000;
    const remaining = target - totalCal;
    const rawEx = localStorage.getItem('exercise_' + today);
    const exercises = rawEx ? JSON.parse(rawEx) : [];
    const exTotal = exercises.reduce((s, e) => s + e.calBurned, 0);
    const records = (typeof WeightTracker !== 'undefined') ? WeightTracker.getRecords() : [];
    const recentWeights = records.slice(-7).map(r => r.date + ': ' + r.weight + 'kg').join(', ');
    const goalWeight = profile.goalWeight || '未知';

    this.messages = [{
      role: 'system',
      content: '你是"减肥热量计算器"的AI助手。你的任务是帮助用户记录饮食、分析进展、给出建议。你拥有操作权限，可以帮用户直接执行操作。\n\n' +
        '【用户信息】\n' +
        '目标摄入: ' + target + ' kcal/天 | 目标体重: ' + goalWeight + ' kg | 体重: ' + (profile.weight || '?') + ' kg\n\n' +
        '【今日状态】\n' +
        '已摄入: ' + totalCal + ' kcal | 剩余: ' + remaining + ' kcal | 运动消耗: ' + exTotal + ' kcal\n' +
        '今日食物: ' + (meals.length > 0 ? meals.map(m => m.name + '(' + m.totalCal + 'kcal)').join('、') : '尚未记录') + '\n' +
        '今日运动: ' + (exercises.length > 0 ? exercises.map(e => e.name + '(' + e.calBurned + 'kcal)').join('、') : '暂无') + '\n\n' +
        '【体重历史】\n' + (recentWeights || '暂无记录') + '\n\n' +
        '【你的能力】你可以通过以下JSON格式执行操作。每次回复都必须在末尾附带JSON：\n' +
        '{"reply":"你的自然语言回复","actions":[]}\n\n' +
        '支持的actions：\n' +
        '- {"type":"add_food","name":"食物名","amount":克数} - 记录食物\n' +
        '- {"type":"add_exercise","name":"运动名","minutes":分钟} - 记录运动\n' +
        '- {"type":"log_weight","weight":公斤} - 记录体重\n' +
        '- {"type":"show_tab","tab":"calculator|diary|tracker"} - 切换页面\n\n' +
        '【规则】\n' +
        '1. 用户说吃了东西，必须用add_food记录\n' +
        '2. 估算食物热量要合理（米饭116kcal/100g，鸡胸肉133kcal/100g，苹果52kcal/100g等）\n' +
        '3. 结合剩余热量给出建议，鼓励健康选择\n' +
        '4. 保持简短友好，2-3句话即可\n' +
        '5. 回复末尾必须包含完整的JSON，不要用markdown代码块包裹'
    }];
  },

  setupChat() {
    const input = document.getElementById('chatInput');
    const sendBtn = document.getElementById('chatSendBtn');

    sendBtn.addEventListener('click', () => this.sendMessage());
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this.sendMessage();
    });

    document.querySelectorAll('.chat-chip').forEach(chip => {
      chip.addEventListener('click', () => {
        input.value = chip.dataset.msg;
        this.sendMessage();
      });
    });
  },

  sendMessage() {
    const input = document.getElementById('chatInput');
    const text = input.value.trim();
    if (!text) return;
    input.value = '';
    document.getElementById('chatSendBtn').disabled = true;

    this.addBubble('user', text);
    this.addTyping();

    this.messages.push({ role: 'user', content: text });

    const apiKey = localStorage.getItem('openai_api_key');
    const endpoint = localStorage.getItem('openai_endpoint') || 'https://open.bigmodel.cn/api/paas/v4';
    const model = localStorage.getItem('openai_model') || 'glm-4v-flash';

    if (!apiKey) {
      this.removeTyping();
      this.addBubble('bot', '请先在设置中配置API Key。');
      document.getElementById('chatSendBtn').disabled = false;
      return;
    }

    // Use text model (strip vision suffix)
    const textModel = model
      .replace('glm-4v-flash', 'glm-4-flash').replace('glm-4v-plus', 'glm-4-plus')
      .replace('qwen-vl-max', 'qwen-max').replace('qwen-vl-plus', 'qwen-plus')
      .replace('qwen2.5-vl-72b-instruct', 'qwen2.5-72b-instruct')
      .replace('moonshot-v1-8k-vision-preview', 'moonshot-v1-8k');

    fetch(endpoint + '/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + apiKey },
      body: JSON.stringify({
        model: textModel,
        messages: this.messages,
        max_tokens: 600,
        temperature: 0.7
      })
    }).then(r => r.json()).then(data => {
      this.removeTyping();
      if (data.error) throw new Error(data.error.message);
      const content = data.choices[0]?.message?.content || '';
      this.handleResponse(content);
    }).catch(err => {
      this.removeTyping();
      this.addBubble('bot', '抱歉，出了点问题：' + err.message);
    }).finally(() => {
      document.getElementById('chatSendBtn').disabled = false;
    });
  },

  handleResponse(content) {
    let reply = content;
    let actions = [];

    // 尝试解析末尾的JSON
    const jsonMatch = content.match(/\{[^{}]*"reply"[^{}]*"actions"[^{}]*\[.*?\][^{}]*\}/s) ||
                       content.match(/\{[^{}]*"actions"[^{}]*\[.*?\][^{}]*"reply"[^{}]*\}/s);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[0]);
        reply = parsed.reply || reply;
        actions = parsed.actions || [];
        reply = reply.replace(jsonMatch[0], '').trim();
      } catch(e) {}
    }

    // 如果没有JSON，尝试简单意图识别
    if (actions.length === 0) {
      actions = this.simpleIntentParse(content);
    }

    this.messages.push({ role: 'assistant', content: content });
    this.addBubble('bot', reply, actions);
    this.executeActions(actions);

    // 限制历史长度
    if (this.messages.length > 30) {
      this.messages = [this.messages[0], ...this.messages.slice(-20)];
    }
  },

  simpleIntentParse(content) {
    const actions = [];
    const text = content.toLowerCase();

    // 检测食物记录意图
    const foodPatterns = [
      { pattern: /吃了([一|两|三|半]?[个|碗|份|盘|块]?)([^\s,，。.]+)/, estimate: 150 },
      { pattern: /吃([^\s,，。.]+)/, estimate: 100 },
    ];

    if (text.includes('记录') || text.includes('添加') || text.includes('吃了')) {
      // Too ambiguous without structured output, skip
    }

    return actions;
  },

  executeActions(actions) {
    if (!actions || actions.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);

    actions.forEach(action => {
      switch (action.type) {
        case 'add_food':
          this.execAddFood(action.name, action.amount, today);
          break;
        case 'add_exercise':
          this.execAddExercise(action.name, action.minutes, today);
          break;
        case 'log_weight':
          this.execLogWeight(action.weight);
          break;
        case 'show_tab':
          this.execShowTab(action.tab);
          break;
      }
    });

    // 刷新当前页面数据
    if (typeof App !== 'undefined') {
      App.loadTodayMeals();
      App.loadTodayExercises();
      App.updateDiaryDisplay();
      App.updateTrackerDisplay();
    }
    this.initSystemPrompt();

    if (actions.length > 0) {
      setTimeout(() => {
        if (typeof App !== 'undefined') App.showToast('\u2705 \u5df2\u6267\u884c ' + actions.length + ' \u9879\u64cd\u4f5c');
      }, 200);
    }
  },

  execAddFood(name, amount, date) {
    const food = typeof findFood === 'function' ? findFood(name) : null;
    const cal = food ? food.cal : this.estimateCalories(name);
    const totalCal = Math.round(cal * (amount || 100) / 100);
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    const raw = localStorage.getItem('meals_' + date);
    const meals = raw ? JSON.parse(raw) : [];

    meals.push({
      name: name, amount: amount || 100, calPer100: cal, totalCal: totalCal,
      protein: food ? food.protein || 0 : 0,
      carbs: food ? food.carbs || 0 : 0,
      fat: food ? food.fat || 0 : 0,
      time: time, date: date, mealType: 'lunch'
    });

    localStorage.setItem('meals_' + date, JSON.stringify(meals));
  },

  execAddExercise(name, minutes, date) {
    const exDef = typeof searchExercise === 'function' ? searchExercise(name)[0] : null;
    const calPerKgH = exDef ? exDef.calPerKgH : 6;
    const profile = JSON.parse(localStorage.getItem('user_profile') || '{}');
    const weight = profile.weight || 70;
    const calBurned = Math.round(calPerKgH * weight * (minutes || 30) / 60);

    const raw = localStorage.getItem('exercise_' + date);
    const exercises = raw ? JSON.parse(raw) : [];

    exercises.push({ name: name, duration: minutes || 30, calBurned: calBurned, date: date });
    localStorage.setItem('exercise_' + date, JSON.stringify(exercises));
  },

  execLogWeight(weight) {
    const date = new Date().toISOString().slice(0, 10);
    if (typeof WeightTracker !== 'undefined') {
      WeightTracker.saveRecord(date, weight);
    }
  },

  execShowTab(tab) {
    const tabs = ['calculator', 'diary', 'tracker', 'agent'];
    if (tabs.includes(tab)) {
      document.querySelectorAll('.tab-bar .tab').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
      const targetBtn = document.querySelector('.tab-bar .tab[data-tab="' + tab + '"]');
      const targetContent = document.getElementById('tab-' + tab);
      if (targetBtn) targetBtn.classList.add('active');
      if (targetContent) targetContent.classList.add('active');
    }
  },

  estimateCalories(name) {
    const estimates = {
      '苹果': 52, '香蕉': 89, '橙子': 47, '葡萄': 69, '西瓜': 30, '草莓': 32,
      '鸡蛋': 155, '牛奶': 61, '酸奶': 72, '面包': 265, '米饭': 116, '馒头': 223,
      '面条': 110, '鸡胸肉': 133, '鸡腿': 181, '猪肉': 143, '牛肉': 106, '鱼': 100,
      '虾': 99, '豆腐': 76, '西兰花': 34, '番茄': 18, '黄瓜': 15, '土豆': 77,
      '咖啡': 2, '可乐': 42, '奶茶': 65, '啤酒': 43, '巧克力': 546, '薯片': 536
    };
    for (const [key, cal] of Object.entries(estimates)) {
      if (name.includes(key)) return cal;
    }
    return 150;
  },

  addBubble(role, text, actions) {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-bubble ' + role;

    if (role === 'bot') {
      div.innerHTML = '<div class="chat-avatar">\ud83e\udd16</div><div class="chat-content"></div>';
      const content = div.querySelector('.chat-content');

      // 移除可能残留的JSON
      let displayText = text.replace(/\{"reply"[^}]*"actions"\s*:\s*\[[^\]]*\][^}]*\}/g, '').trim();
      if (!displayText) displayText = text;

      displayText.split('\n').filter(l => l.trim()).forEach(line => {
        const p = document.createElement('p');
        p.textContent = line;
        content.appendChild(p);
      });

      if (actions && actions.length > 0) {
        const actionDiv = document.createElement('div');
        actionDiv.style.marginTop = '8px';
        const labels = { add_food: '\u{1F34E} \u5df2\u8bb0\u5f55\u98df\u7269', add_exercise: '\u{1F3C3} \u5df2\u8bb0\u5f55\u8fd0\u52a8', log_weight: '\u2696\uFE0F \u5df2\u8bb0\u5f55\u4f53\u91cd', show_tab: '\u{1F4CC} \u5df2\u5207\u6362\u9875\u9762' };
        actions.forEach(a => {
          const span = document.createElement('span');
          span.className = 'action-hint';
          span.textContent = labels[a.type] || '\u2705 \u5df2\u6267\u884c';
          actionDiv.appendChild(span);
        });
        content.appendChild(actionDiv);
      }
    } else {
      div.innerHTML = '<div class="chat-avatar">\u{1F464}</div><div class="chat-content"><p>' + text + '</p></div>';
    }

    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  addTyping() {
    const container = document.getElementById('chatMessages');
    const div = document.createElement('div');
    div.className = 'chat-bubble bot';
    div.id = 'typingBubble';
    div.innerHTML = '<div class="chat-avatar">\ud83e\udd16</div><div class="chat-content"><div class="typing-indicator"><div class="typing-dot"></div><div class="typing-dot"></div><div class="typing-dot"></div></div></div>';
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  },

  removeTyping() {
    const bubble = document.getElementById('typingBubble');
    if (bubble) bubble.remove();
  }
};

