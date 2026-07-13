// ===== AI 拍照识别模块 =====

const CameraApp = {
  capturedImage: null, // base64 image data
  analyzedFoods: [],   // parsed food items from AI

  init() {
    const captureBtn = document.getElementById('captureBtn');
    const cameraInput = document.getElementById('cameraInput');
    const retakeBtn = document.getElementById('retakeBtn');

    captureBtn.addEventListener('click', () => cameraInput.click());
    cameraInput.addEventListener('change', (e) => this.handleCapture(e));
    retakeBtn.addEventListener('click', () => this.resetCapture());
  },

  handleCapture(e) {
    const file = e.target.files[0];
    if (!file) return;

    // 压缩并转 base64
    this.compressImage(file, (base64) => {
      this.capturedImage = base64;
      this.showPreview(base64);
      this.analyzeImage(base64);
    });
  },

  compressImage(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 1024, maxH = 1024;
        let w = img.width, h = img.height;
        if (w > maxW || h > maxH) {
          const ratio = Math.min(maxW / w, maxH / h);
          w = Math.round(w * ratio);
          h = Math.round(h * ratio);
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
        callback(canvas.toDataURL('image/jpeg', 0.8));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  },

  showPreview(base64) {
    document.getElementById('cameraActions').style.display = 'none';
    document.getElementById('cameraPreview').style.display = 'block';
    document.getElementById('previewImg').src = base64;
  },

  resetCapture() {
    this.capturedImage = null;
    this.analyzedFoods = [];
    document.getElementById('cameraActions').style.display = 'block';
    document.getElementById('cameraPreview').style.display = 'none';
    document.getElementById('analyzeResult').style.display = 'none';
    document.getElementById('analyzeLoading').style.display = 'none';
    document.getElementById('analyzeData').style.display = 'none';
    document.getElementById('cameraInput').value = '';
  },

  async analyzeImage(base64) {
    const apiKey = localStorage.getItem('openai_api_key');
    const endpoint = localStorage.getItem('openai_endpoint') || 'https://open.bigmodel.cn/api/paas/v4';
    const model = localStorage.getItem('openai_model') || 'glm-4v-flash';

    // 检查模型是否支持视觉
    const visionCapableModels = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4-vision-preview', 'gpt-4.1', 'gpt-4.1-mini', 'glm-4v', 'qwen-vl', 'qwen2-vl', 'qwen2.5-vl', 'deepseek-vl', 'gemini', 'moonshot-v1-8k-vision', 'step-1v', 'step-1.5v', 'doubao-vision', 'claude-3-5-sonnet', 'claude-3-opus'];
    const isVisionCapable = visionCapableModels.some(m => model.includes(m));
    const isDeepSeek = endpoint.includes('deepseek');
    
    if (isDeepSeek && model === 'deepseek-chat' && !model.includes('deepseek-vl')) {
      document.getElementById('analyzeResult').style.display = 'block';
      document.getElementById('analyzeData').style.display = 'block';
      document.getElementById('analyzeData').innerHTML = `
        <div class="analyze-summary" style="text-align:center;padding:16px;">
          <p style="font-size:28px;margin-bottom:12px;">🚫</p>
          <p style="color:#e74c3c;font-size:14px;font-weight:600;">当前模型 <code style="background:#fce4e4;padding:2px 6px;border-radius:4px;">deepseek-chat</code> 不支持图片识别</p>
          <p style="font-size:13px;color:#666;margin-top:8px;">DeepSeek Chat 是纯文本模型，无法处理图片。</p>
          <p style="font-size:13px;color:#666;">请在设置中切换到支持视觉识别的 API：</p>
          <div style="background:#f8f9fa;border-radius:8px;padding:12px;margin-top:8px;text-align:left;font-size:12px;">
            <p><strong>推荐配置：</strong></p>
            <p>• API 地址：<code>https://api.openai.com/v1</code></p>
            <p>• 模型：<code>gpt-4o-mini</code>（便宜且支持视觉）</p>
            <p>• API Key：<a href="https://platform.openai.com/api-keys" target="_blank">获取 OpenAI Key →</a></p>
          </div>
        </div>
      `;
      return;
    }

    if (!apiKey) {
      App.showToast('⚠️ 请先在设置中配置 API Key');
      document.getElementById('settingsModal').style.display = 'flex';
      this.resetCapture();
      return;
    }

    // 显示加载状态
    document.getElementById('analyzeResult').style.display = 'block';
    document.getElementById('analyzeLoading').style.display = 'block';
    document.getElementById('analyzeData').style.display = 'none';

    const systemPrompt = `你是一个专业的营养师和食物热量分析助手。用户会给你一张食物照片，请分析图片中的食物，并返回JSON格式的结果。

请严格按以下JSON格式回复（不要包含markdown代码块标记）：
{
  "foods": [
    {
      "name": "食物名称（中文）",
      "weight": 估算重量（克，数字）,
      "calories": 估算热量（千卡，数字）,
      "note": "简短备注（如烹饪方式）"
    }
  ],
  "totalCalories": 总热量数字,
  "summary": "一句简短总结"
}

注意：
1. 如果图片中看不出食物，返回空数组并说明
2. 热量估算尽量准确，根据常见食材和分量推断
3. 如果有多样食物，逐项列出
4. 不确定的食物要在note里注明"估算"`;

    try {
      const response = await fetch(`${endpoint}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: model,
          messages: [
            { role: 'system', content: systemPrompt },
            {
              role: 'user',
              content: [
                { type: 'text', text: '请分析这张食物照片中的食物和热量。' },
                { type: 'image_url', image_url: { url: base64, detail: 'low' } }
              ]
            }
          ],
          max_tokens: 800,
          temperature: 0.3
        })
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error?.message || err.error || `API 请求失败 (${response.status})`);
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content || '';
      this.parseResult(content);

    } catch (err) {
      document.getElementById('analyzeLoading').style.display = 'none';
      document.getElementById('analyzeData').style.display = 'block';

      let errorMsg = err.message || '未知错误';
      
      // 检测不支持图片的模型/API
      if (errorMsg.includes('image_url') || errorMsg.includes('unknown variant')) {
        errorMsg = '当前模型不支持图片输入，请切换到支持视觉识别的模型（如 gpt-4o-mini）';
      }
      
      document.getElementById('analyzeData').innerHTML = `
        <div class="analyze-summary" style="text-align:center;padding:16px;">
          <p style="color:#e74c3c;font-size:14px;">❌ ${errorMsg}</p>
          <p style="font-size:13px;color:#666;margin-top:8px;">💡 提示：DeepSeek Chat 不支持图片，建议使用 OpenAI gpt-4o-mini。</p>
        </div>
      `;
      App.showToast('❌ 分析失败');
      this.resetCapture();
    }
  },

  parseResult(content) {
    // 尝试提取 JSON
    let parsed;
    try {
      // 清理可能的 markdown 代码块
      let jsonStr = content.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
      parsed = JSON.parse(jsonStr);
    } catch (e) {
      // 尝试从文本中提取 JSON
      const match = content.match(/\{[\s\S]*\}/);
      if (match) {
        try { parsed = JSON.parse(match[0]); } catch (e2) {}
      }
    }

    document.getElementById('analyzeLoading').style.display = 'none';
    const dataDiv = document.getElementById('analyzeData');

    if (!parsed || !parsed.foods || parsed.foods.length === 0) {
      dataDiv.innerHTML = `
        <div class="analyze-summary">
          <p style="color:#999;">😕 未能识别出食物，请换一张清晰的照片重试</p>
        </div>
        <p class="ai-disclaimer">AI 识别结果仅供参考</p>
      `;
      dataDiv.style.display = 'block';
      return;
    }

    this.analyzedFoods = parsed.foods;

    dataDiv.innerHTML = `
      <div class="analyze-summary">
        <span class="ai-label">AI 估算总热量</span>
        <span class="ai-total">${parsed.totalCalories} kcal</span>
        ${parsed.summary ? `<p style="font-size:13px;color:#666;margin-top:4px;">${parsed.summary}</p>` : ''}
      </div>
      <ul class="analyze-items">
        ${parsed.foods.map(f => `
          <li>
            <div>
              <span class="ai-item-name">${f.name}</span>
              <span class="ai-item-info">${f.weight || '?'}g${f.note ? ' · ' + f.note : ''}</span>
            </div>
            <span class="ai-item-cal">${f.calories} kcal</span>
          </li>
        `).join('')}
      </ul>
      <button class="btn-add-all" id="addAIFoodsBtn">📥 全部添加到今日记录</button>
      <p class="ai-disclaimer">⚠️ AI 识别结果仅供参考，实际热量可能因烹饪方式等因素有所不同</p>
    `;
    dataDiv.style.display = 'block';

    // 绑定添加按钮
    document.getElementById('addAIFoodsBtn').addEventListener('click', () => {
      this.addToDiary();
    });
  },

  addToDiary() {
    if (this.analyzedFoods.length === 0) return;

    const today = new Date().toISOString().slice(0, 10);
    const time = new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });

    this.analyzedFoods.forEach(f => {
      App.todayMeals.push({
        name: f.name,
        amount: f.weight || 100,
        calPer100: f.weight ? Math.round(f.calories / f.weight * 100) : f.calories,
        totalCal: f.calories,
        time: time,
        date: today,
        fromAI: true, mealType: 'lunch'
      });
    });

    App.saveTodayMeals();
    App.updateDiaryDisplay();
    this.resetCapture();
    App.showToast(`✅ 已添加 ${this.analyzedFoods.length} 种食物`);
  }
};





