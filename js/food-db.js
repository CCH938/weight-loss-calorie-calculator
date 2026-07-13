// ===== 常见食物数据库（每100g营养素） =====

const FoodDB = [
  // 主食类
  { name: '白米饭', cal: 116, protein: 2.6, carbs: 25.9, fat: 0.3, category: '主食', unit: '100g' },
  { name: '馒头', cal: 223, protein: 7.0, carbs: 44.2, fat: 1.1, category: '主食', unit: '100g' },
  { name: '面条（煮）', cal: 110, protein: 3.5, carbs: 22.0, fat: 0.5, category: '主食', unit: '100g' },
  { name: '全麦面包', cal: 246, protein: 10.0, carbs: 43.0, fat: 3.5, category: '主食', unit: '100g' },
  { name: '白面包', cal: 265, protein: 8.0, carbs: 49.0, fat: 3.2, category: '主食', unit: '100g' },
  { name: '燕麦片', cal: 367, protein: 13.5, carbs: 66.3, fat: 6.7, category: '主食', unit: '100g' },
  { name: '红薯', cal: 86, protein: 1.6, carbs: 20.1, fat: 0.1, category: '主食', unit: '100g' },
  { name: '玉米', cal: 112, protein: 3.3, carbs: 22.8, fat: 1.2, category: '主食', unit: '100g' },
  { name: '小米粥', cal: 46, protein: 1.4, carbs: 8.4, fat: 0.7, category: '主食', unit: '100g' },
  { name: '糙米饭', cal: 123, protein: 2.7, carbs: 25.6, fat: 0.9, category: '主食', unit: '100g' },
  { name: '包子（猪肉）', cal: 227, protein: 8.0, carbs: 28.0, fat: 10.0, category: '主食', unit: '100g' },
  { name: '饺子（猪肉）', cal: 240, protein: 9.0, carbs: 26.0, fat: 12.0, category: '主食', unit: '100g' },

  // 肉类
  { name: '鸡胸肉', cal: 133, protein: 24.6, carbs: 2.0, fat: 3.6, category: '肉类', unit: '100g' },
  { name: '鸡腿肉', cal: 181, protein: 19.0, carbs: 0, fat: 11.0, category: '肉类', unit: '100g' },
  { name: '猪瘦肉', cal: 143, protein: 20.3, carbs: 1.5, fat: 6.2, category: '肉类', unit: '100g' },
  { name: '猪五花肉', cal: 395, protein: 13.5, carbs: 2.4, fat: 37.0, category: '肉类', unit: '100g' },
  { name: '牛肉（瘦）', cal: 106, protein: 20.2, carbs: 1.2, fat: 2.3, category: '肉类', unit: '100g' },
  { name: '牛排', cal: 207, protein: 20.0, carbs: 0, fat: 14.0, category: '肉类', unit: '100g' },
  { name: '羊肉', cal: 203, protein: 19.0, carbs: 0, fat: 14.1, category: '肉类', unit: '100g' },
  { name: '鸭肉', cal: 240, protein: 15.5, carbs: 0.2, fat: 19.7, category: '肉类', unit: '100g' },
  { name: '培根', cal: 541, protein: 12.0, carbs: 1.5, fat: 53.0, category: '肉类', unit: '100g' },
  { name: '火腿肠', cal: 212, protein: 14.0, carbs: 8.0, fat: 15.0, category: '肉类', unit: '100g' },

  // 水产
  { name: '三文鱼', cal: 208, protein: 20.4, carbs: 0, fat: 13.4, category: '水产', unit: '100g' },
  { name: '虾仁', cal: 99, protein: 20.3, carbs: 0.2, fat: 1.7, category: '水产', unit: '100g' },
  { name: '带鱼', cal: 127, protein: 17.7, carbs: 0, fat: 4.9, category: '水产', unit: '100g' },
  { name: '鳕鱼', cal: 88, protein: 18.0, carbs: 0, fat: 0.8, category: '水产', unit: '100g' },
  { name: '金枪鱼', cal: 144, protein: 23.3, carbs: 0, fat: 4.9, category: '水产', unit: '100g' },
  { name: '螃蟹', cal: 95, protein: 13.8, carbs: 2.6, fat: 2.3, category: '水产', unit: '100g' },

  // 蛋奶豆
  { name: '鸡蛋（煮）', cal: 155, protein: 13.1, carbs: 1.1, fat: 11.1, category: '蛋奶', unit: '100g(约2个)' },
  { name: '鸡蛋（炒）', cal: 196, protein: 12.0, carbs: 2.0, fat: 15.0, category: '蛋奶', unit: '100g' },
  { name: '全脂牛奶', cal: 61, protein: 3.0, carbs: 4.8, fat: 3.2, category: '蛋奶', unit: '100ml' },
  { name: '脱脂牛奶', cal: 33, protein: 3.4, carbs: 5.0, fat: 0.1, category: '蛋奶', unit: '100ml' },
  { name: '酸奶（原味）', cal: 72, protein: 3.5, carbs: 9.3, fat: 2.7, category: '蛋奶', unit: '100g' },
  { name: '奶酪', cal: 328, protein: 25.0, carbs: 1.3, fat: 25.0, category: '蛋奶', unit: '100g' },
  { name: '豆腐', cal: 76, protein: 8.1, carbs: 2.8, fat: 3.7, category: '蛋奶', unit: '100g' },
  { name: '豆浆', cal: 31, protein: 3.0, carbs: 1.2, fat: 1.6, category: '蛋奶', unit: '100ml' },

  // 蔬菜
  { name: '西兰花', cal: 34, protein: 4.1, carbs: 4.6, fat: 0.4, category: '蔬菜', unit: '100g' },
  { name: '番茄', cal: 18, protein: 0.9, carbs: 3.9, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '黄瓜', cal: 15, protein: 0.8, carbs: 2.9, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '菠菜', cal: 23, protein: 2.6, carbs: 2.8, fat: 0.4, category: '蔬菜', unit: '100g' },
  { name: '生菜', cal: 13, protein: 1.3, carbs: 1.3, fat: 0.3, category: '蔬菜', unit: '100g' },
  { name: '胡萝卜', cal: 41, protein: 1.0, carbs: 8.8, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '土豆', cal: 77, protein: 2.0, carbs: 17.2, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '白菜', cal: 13, protein: 1.5, carbs: 2.2, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '芹菜', cal: 14, protein: 1.2, carbs: 1.3, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '茄子', cal: 21, protein: 1.1, carbs: 4.5, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '青椒', cal: 22, protein: 1.0, carbs: 4.0, fat: 0.2, category: '蔬菜', unit: '100g' },
  { name: '蘑菇', cal: 22, protein: 3.1, carbs: 3.3, fat: 0.3, category: '蔬菜', unit: '100g' },
  { name: '南瓜', cal: 26, protein: 1.0, carbs: 5.3, fat: 0.1, category: '蔬菜', unit: '100g' },

  // 水果
  { name: '苹果', cal: 52, protein: 0.3, carbs: 13.8, fat: 0.2, category: '水果', unit: '100g' },
  { name: '香蕉', cal: 89, protein: 1.1, carbs: 22.8, fat: 0.3, category: '水果', unit: '100g' },
  { name: '橙子', cal: 47, protein: 1.0, carbs: 11.1, fat: 0.1, category: '水果', unit: '100g' },
  { name: '葡萄', cal: 69, protein: 0.7, carbs: 18.1, fat: 0.2, category: '水果', unit: '100g' },
  { name: '西瓜', cal: 30, protein: 0.6, carbs: 7.6, fat: 0.2, category: '水果', unit: '100g' },
  { name: '草莓', cal: 32, protein: 0.7, carbs: 7.7, fat: 0.3, category: '水果', unit: '100g' },
  { name: '蓝莓', cal: 57, protein: 0.7, carbs: 14.5, fat: 0.3, category: '水果', unit: '100g' },
  { name: '猕猴桃', cal: 61, protein: 1.1, carbs: 14.7, fat: 0.5, category: '水果', unit: '100g' },
  { name: '芒果', cal: 60, protein: 0.8, carbs: 15.0, fat: 0.4, category: '水果', unit: '100g' },
  { name: '梨', cal: 57, protein: 0.4, carbs: 15.5, fat: 0.1, category: '水果', unit: '100g' },
  { name: '桃子', cal: 39, protein: 0.9, carbs: 9.5, fat: 0.3, category: '水果', unit: '100g' },
  { name: '牛油果', cal: 160, protein: 2.0, carbs: 8.5, fat: 14.7, category: '水果', unit: '100g' },

  // 零食饮料
  { name: '薯片', cal: 536, protein: 6.0, carbs: 53.0, fat: 34.0, category: '零食', unit: '100g' },
  { name: '巧克力', cal: 546, protein: 5.0, carbs: 60.0, fat: 31.0, category: '零食', unit: '100g' },
  { name: '饼干', cal: 433, protein: 7.0, carbs: 71.0, fat: 14.0, category: '零食', unit: '100g' },
  { name: '冰淇淋', cal: 207, protein: 3.5, carbs: 25.0, fat: 10.0, category: '零食', unit: '100g' },
  { name: '蛋糕', cal: 347, protein: 5.0, carbs: 45.0, fat: 16.0, category: '零食', unit: '100g' },
  { name: '可乐', cal: 42, protein: 0, carbs: 10.6, fat: 0, category: '零食', unit: '100ml' },
  { name: '果汁', cal: 45, protein: 0.1, carbs: 10.8, fat: 0.1, category: '零食', unit: '100ml' },
  { name: '奶茶', cal: 65, protein: 0.5, carbs: 10.0, fat: 2.5, category: '零食', unit: '100ml' },
  { name: '咖啡（黑）', cal: 2, protein: 0.1, carbs: 0.3, fat: 0, category: '零食', unit: '100ml' },
  { name: '啤酒', cal: 43, protein: 0.5, carbs: 3.6, fat: 0, category: '零食', unit: '100ml' },

  // 油脂调味
  { name: '橄榄油', cal: 884, protein: 0, carbs: 0, fat: 100, category: '油脂', unit: '100g' },
  { name: '花生油', cal: 899, protein: 0, carbs: 0, fat: 99.9, category: '油脂', unit: '100g' },
  { name: '黄油', cal: 717, protein: 0.9, carbs: 0.1, fat: 81.1, category: '油脂', unit: '100g' },
  { name: '花生酱', cal: 588, protein: 25.0, carbs: 20.0, fat: 50.0, category: '油脂', unit: '100g' },
  { name: '沙拉酱', cal: 470, protein: 1.0, carbs: 3.0, fat: 50.0, category: '油脂', unit: '100g' },
];

// 运动消耗数据库（每小时每kg体重消耗 kcal）
const ExerciseDB = [
  { name: '跑步（慢跑）', calPerKgH: 7.0, icon: '🏃' },
  { name: '跑步（快跑）', calPerKgH: 10.0, icon: '🏃‍♂️' },
  { name: '快走', calPerKgH: 4.5, icon: '🚶' },
  { name: '散步', calPerKgH: 2.5, icon: '🚶‍♂️' },
  { name: '跳绳', calPerKgH: 11.0, icon: '🪢' },
  { name: '游泳', calPerKgH: 8.0, icon: '🏊' },
  { name: '骑行', calPerKgH: 6.0, icon: '🚴' },
  { name: '爬楼梯', calPerKgH: 8.5, icon: '🪜' },
  { name: '瑜伽', calPerKgH: 3.0, icon: '🧘' },
  { name: '力量训练', calPerKgH: 5.5, icon: '🏋️' },
  { name: 'HIIT', calPerKgH: 12.0, icon: '🔥' },
  { name: '跳舞', calPerKgH: 5.0, icon: '💃' },
  { name: '篮球', calPerKgH: 6.5, icon: '🏀' },
  { name: '羽毛球', calPerKgH: 5.5, icon: '🏸' },
  { name: '乒乓球', calPerKgH: 3.5, icon: '🏓' },
];

/**
 * 搜索食物
 */
function searchFood(query) {
  if (!query || query.trim() === '') return [];
  const q = query.trim().toLowerCase();
  return FoodDB.filter(f => f.name.toLowerCase().includes(q)).slice(0, 8);
}

/**
 * 根据名称精确匹配食物
 */
function findFood(name) {
  return FoodDB.find(f => f.name === name);
}

/**
 * 搜索运动
 */
function searchExercise(query) {
  if (!query || query.trim() === '') return ExerciseDB;
  const q = query.trim().toLowerCase();
  return ExerciseDB.filter(e => e.name.toLowerCase().includes(q));
}
