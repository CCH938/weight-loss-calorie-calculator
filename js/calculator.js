// ===== BMR / TDEE 计算引擎 =====

const Calculator = {
  /**
   * Mifflin-St Jeor 公式计算 BMR
   */
  calcBMR(gender, weight, height, age) {
    // weight in kg, height in cm, age in years
    if (gender === 'male') {
      return 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      return 10 * weight + 6.25 * height - 5 * age - 161;
    }
  },

  /**
   * 计算 TDEE
   */
  calcTDEE(bmr, activityLevel) {
    return Math.round(bmr * parseFloat(activityLevel));
  },

  /**
   * 计算建议摄入热量
   */
  calcTarget(tdee, deficit) {
    return Math.round(tdee - parseInt(deficit));
  },

  /**
   * 计算预计达成天数
   */
  calcEstDays(currentWeight, goalWeight, deficit) {
    const diff = currentWeight - goalWeight;
    if (diff <= 0) return 0;
    // deficit is calories per day, 7700 kcal ≈ 1kg
    const dailyLoss = parseInt(deficit) / 7700;
    return Math.ceil(diff / dailyLoss);
  },

  /**
   * 计算营养素分配
   */
  calcMacros(weight, targetCalories) {
    // Protein: 1.8g per kg bodyweight
    const proteinGram = Math.round(weight * 1.8);
    const proteinCal = proteinGram * 4;

    // Fat: 25% of total calories
    const fatCal = Math.round(targetCalories * 0.25);
    const fatGram = Math.round(fatCal / 9);

    // Carbs: remaining calories
    const carbsCal = targetCalories - proteinCal - fatCal;
    const carbsGram = Math.round(carbsCal / 4);

    return {
      protein: { gram: proteinGram, cal: proteinCal, pct: Math.round(proteinCal / targetCalories * 100) },
      carbs: { gram: carbsGram, cal: carbsCal, pct: Math.round(carbsCal / targetCalories * 100) },
      fat: { gram: fatGram, cal: fatCal, pct: Math.round(fatCal / targetCalories * 100) }
    };
  }
};
