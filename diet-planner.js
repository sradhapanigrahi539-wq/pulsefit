/**
 * PulseFit Diet Chart & Nutrition Hub
 * Manages daily meal schedules, macro breakdowns, swap meals, and recipe popups.
 */

class DietPlanner {
  constructor() {
    this.currentDay = 'Monday';
    this.dietPlan = this.loadDietPlan();
    this.consumedMeals = this.loadConsumedMeals();
  }

  loadDietPlan() {
    const saved = localStorage.getItem('pulsefit_diet_plan');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading diet plan:', e);
      }
    }
    return this.getDefaultDietPlan();
  }

  saveDietPlan() {
    localStorage.setItem('pulsefit_diet_plan', JSON.stringify(this.dietPlan));
    this.render();
  }

  loadConsumedMeals() {
    const saved = localStorage.getItem('pulsefit_consumed_meals');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading consumed meals:', e);
      }
    }
    return {};
  }

  saveConsumedMeals() {
    localStorage.setItem('pulsefit_consumed_meals', JSON.stringify(this.consumedMeals));
    this.updateConsumedMacros();
  }

  setDay(day) {
    this.currentDay = day;
    this.render();
  }

  toggleMealConsumed(mealId, calories, protein, carbs, fats) {
    const todayKey = new Date().toDateString();
    if (!this.consumedMeals[todayKey]) {
      this.consumedMeals[todayKey] = [];
    }

    const index = this.consumedMeals[todayKey].indexOf(mealId);
    if (index > -1) {
      this.consumedMeals[todayKey].splice(index, 1);
    } else {
      this.consumedMeals[todayKey].push(mealId);
      if (window.soundFx) window.soundFx.playSuccess();
    }

    this.saveConsumedMeals();
    this.render();
  }

  isMealConsumed(mealId) {
    const todayKey = new Date().toDateString();
    return (this.consumedMeals[todayKey] || []).includes(mealId);
  }

  updateConsumedMacros() {
    const todayKey = new Date().toDateString();
    const consumedIds = this.consumedMeals[todayKey] || [];
    
    // Sum up totals from current plan
    let totalCals = 0;
    let totalProtein = 0;
    let totalCarbs = 0;
    let totalFats = 0;

    const currentMeals = this.dietPlan[this.currentDay] || [];
    currentMeals.forEach(meal => {
      if (consumedIds.includes(meal.id)) {
        totalCals += meal.calories || 0;
        totalProtein += meal.protein || 0;
        totalCarbs += meal.carbs || 0;
        totalFats += meal.fats || 0;
      }
    });

    const consumedCalsEl = document.getElementById('dashboardConsumedCals');
    if (consumedCalsEl) consumedCalsEl.textContent = totalCals;

    const consumedProteinEl = document.getElementById('dietConsumedProtein');
    if (consumedProteinEl) consumedProteinEl.textContent = `${totalProtein}g`;

    const consumedCarbsEl = document.getElementById('dietConsumedCarbs');
    if (consumedCarbsEl) consumedCarbsEl.textContent = `${totalCarbs}g`;

    const consumedFatsEl = document.getElementById('dietConsumedFats');
    if (consumedFatsEl) consumedFatsEl.textContent = `${totalFats}g`;

    if (window.updateDashboardMacros) {
      window.updateDashboardMacros(totalCals, totalProtein, totalCarbs, totalFats);
    }
  }

  // Open recipe details modal
  viewRecipe(mealId) {
    const currentMeals = this.dietPlan[this.currentDay] || [];
    const meal = currentMeals.find(m => m.id === mealId);
    if (!meal) return;

    const modal = document.getElementById('recipeModal');
    if (!modal) return;

    document.getElementById('recipeModalTitle').textContent = meal.name;
    document.getElementById('recipeModalType').textContent = `${meal.timing} • ${meal.category}`;
    document.getElementById('recipeModalCals').textContent = `${meal.calories} kcal`;
    document.getElementById('recipeModalProtein').textContent = `${meal.protein}g Protein`;
    document.getElementById('recipeModalCarbs').textContent = `${meal.carbs}g Carbs`;
    document.getElementById('recipeModalFats').textContent = `${meal.fats}g Fats`;

    const ingContainer = document.getElementById('recipeIngredientsList');
    ingContainer.innerHTML = (meal.ingredients || []).map(ing => `
      <li class="flex items-center gap-2 text-slate-300 text-sm">
        <span class="w-2 h-2 rounded-full bg-emerald-400"></span>
        <span>${ing}</span>
      </li>
    `).join('');

    const prepContainer = document.getElementById('recipePrepSteps');
    prepContainer.innerHTML = (meal.steps || [
      'Assemble ingredients according to specified portions.',
      'Cook using light olive oil or steam for optimal nutrient preservation.',
      'Season with Himalayan pink salt, black pepper, and herbs to taste.',
      'Consume fresh to maximize digestive enzyme efficiency.'
    ]).map((step, idx) => `
      <li class="flex items-start gap-3 text-slate-300 text-sm">
        <span class="w-5 h-5 rounded-full bg-slate-800 text-emerald-400 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">${idx+1}</span>
        <span>${step}</span>
      </li>
    `).join('');

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeRecipeModal() {
    const modal = document.getElementById('recipeModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  // Swap meal with an alternative healthy option
  swapMeal(mealId) {
    const currentMeals = this.dietPlan[this.currentDay] || [];
    const meal = currentMeals.find(m => m.id === mealId);
    if (!meal) return;

    const alternatives = this.getAlternatives(meal.timing);
    if (!alternatives || !alternatives.length) {
      if (window.showToast) window.showToast('No alternative meal found for this slot.');
      return;
    }

    // Pick next alternative
    const nextMeal = alternatives[(Math.floor(Math.random() * alternatives.length))];
    meal.name = nextMeal.name;
    meal.calories = nextMeal.calories;
    meal.protein = nextMeal.protein;
    meal.carbs = nextMeal.carbs;
    meal.fats = nextMeal.fats;
    meal.ingredients = nextMeal.ingredients;
    meal.steps = nextMeal.steps;
    meal.icon = nextMeal.icon;

    this.saveDietPlan();
    if (window.showToast) {
      window.showToast(`Swapped to: ${nextMeal.name}!`);
    }
  }

  getAlternatives(timing) {
    const pool = {
      'Breakfast': [
        { name: 'Avocado & Poached Egg Protein Sourdough', calories: 420, protein: 26, carbs: 34, fats: 18, icon: '🥑', ingredients: ['2 organic eggs', '1 slice sourdough', '1/2 ripe avocado', 'Chili flakes & lime'], steps: ['Toast sourdough until crisp', 'Poach eggs in simmering water with vinegar', 'Mash avocado with lime juice', 'Top sourdough with avocado, eggs, and sea salt'] },
        { name: 'Greek Yogurt Superfood Bowl with Berries & Chia', calories: 380, protein: 32, carbs: 40, fats: 8, icon: '🫐', ingredients: ['250g 0% Greek Yogurt', '1 cup mixed blueberries & raspberries', '1 tbsp chia seeds', '10g crushed almonds', '1 tsp raw honey'], steps: ['Add Greek yogurt to bowl', 'Top with fresh antioxidant-rich berries', 'Sprinkle chia seeds and almonds', 'Drizzle with pure honey'] },
        { name: 'Golden High-Protein Scrambled Tofu & Spinach', calories: 350, protein: 28, carbs: 18, fats: 14, icon: '🍳', ingredients: ['200g firm tofu', '1 cup baby spinach', '1/2 tsp turmeric', 'Nutritional yeast', '1 tsp extra virgin olive oil'], steps: ['Crumble firm tofu in skillet with olive oil', 'Add turmeric and nutritional yeast for golden savory finish', 'Fold in baby spinach until wilted', 'Serve warm with whole grain toast'] }
      ],
      'Lunch': [
        { name: 'Grilled Herb Chicken & Quinoa Harvest Bowl', calories: 580, protein: 48, carbs: 52, fats: 14, icon: '🥗', ingredients: ['180g lean chicken breast', '1 cup cooked quinoa', 'Steamed broccoli & bell peppers', 'Lemon tahini dressing'], steps: ['Season chicken with rosemary, oregano, garlic', 'Grill for 6-8 mins each side until juicy', 'Fluff cooked quinoa with lemon zest', 'Plate together and drizzle with tahini'] },
        { name: 'Atlantic Salmon Fillet with Sweet Potato Mash', calories: 610, protein: 44, carbs: 48, fats: 22, icon: '🐟', ingredients: ['170g wild salmon', '1 medium roasted sweet potato', 'Steamed asparagus spears', 'Extra virgin olive oil'], steps: ['Pan-sear salmon skin-down for 5 mins, flip for 3 mins', 'Mash roasted sweet potato with pinch of nutmeg', 'Steam asparagus spears al dente', 'Serve immediately'] },
        { name: 'Mediterranean Lentil & Feta Power Salad', calories: 510, protein: 30, carbs: 58, fats: 16, icon: '🫒', ingredients: ['1.5 cups brown lentils', '50g low-fat crumbled feta', 'Cherry tomatoes, cucumber, red onion', 'Olive oil and apple cider vinegar'], steps: ['Combine cooked lentils with chopped fresh veggies', 'Whisk olive oil, cider vinegar, and dried oregano', 'Toss gently and garnish with crumbled feta'] }
      ],
      'Pre-Workout': [
        { name: 'Banana Rice Cakes with Almond Butter & Cinnamon', calories: 230, protein: 6, carbs: 36, fats: 7, icon: '🍌', ingredients: ['2 whole grain brown rice cakes', '1 tbsp natural almond butter', '1/2 sliced banana', 'Dash of cinnamon'], steps: ['Spread almond butter evenly across rice cakes', 'Top with banana slices', 'Dust with cinnamon for glucose regulation'] },
        { name: 'Espresso & Medjool Date Power Surge', calories: 190, protein: 3, carbs: 42, fats: 1, icon: '⚡', ingredients: ['2 Medjool dates', '1 shot espresso or black coffee', 'Handful of raw walnuts (10g)'], steps: ['Enjoy dates with walnuts 30 mins before workout', 'Drink espresso for peak central nervous system activation'] }
      ],
      'Dinner': [
        { name: 'Lean Turkey & Vegetable Stir-Fry with Bok Choy', calories: 460, protein: 42, carbs: 24, fats: 16, icon: '🍲', ingredients: ['180g lean minced turkey / lean beef', 'Bok choy, snap peas, mushrooms', 'Low sodium tamari / soy sauce', 'Fresh ginger & garlic'], steps: ['Sauté garlic and grated ginger in wok', 'Brown lean minced protein thoroughly', 'Add vibrant greens and toss on high heat', 'Drizzle with tamari sauce'] },
        { name: 'Charred White Fish Tacos with Cabbage Slaw', calories: 440, protein: 38, carbs: 36, fats: 12, icon: '🌮', ingredients: ['160g cod or tilapia fillet', '2 warm corn tortillas', 'Shredded purple cabbage', 'Lime cilantro crema (Greek yogurt base)'], steps: ['Blacken seasoned fish in cast iron skillet', 'Warm corn tortillas over open flame', 'Layer purple cabbage slaw and flaked fish', 'Top with Greek yogurt cilantro crema'] }
      ]
    };
    return pool[timing] || pool['Breakfast'];
  }

  // Generate personalized plan based on AI Assessment results
  generateCustomPlan(profile) {
    const goal = profile.goal || 'Fat Loss';
    const dietType = profile.dietType || 'Balanced';
    const calories = profile.targetCalories || 2000;
    const proteinTarget = profile.targetProtein || 140;

    // Adjust meals according to caloric and dietary goals
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const newPlan = {};

    days.forEach(day => {
      newPlan[day] = [
        {
          id: `${day}-m1`,
          timing: 'Breakfast',
          name: dietType.includes('Vegetarian') || dietType.includes('Vegan') 
            ? 'Super Green Protein Oatmeal with Chia & Walnuts' 
            : 'Organic Scrambled Eggs with Avocado & Whole Grain Toast',
          calories: Math.round(calories * 0.25),
          protein: Math.round(proteinTarget * 0.28),
          carbs: Math.round(calories * 0.08),
          fats: 16,
          icon: '🍳',
          category: 'High Protein',
          ingredients: ['Eggs or Tofu Scramble', 'Organic Spinach', 'Avocado', 'Sourdough or Oats'],
          steps: ['Cook over medium heat with light olive oil', 'Season with turmeric and black pepper', 'Serve warm with fresh greens']
        },
        {
          id: `${day}-m2`,
          timing: 'Mid-Morning',
          name: 'Antioxidant Berry Bowl with Greek Yogurt or Vegan Protein',
          calories: Math.round(calories * 0.12),
          protein: Math.round(proteinTarget * 0.15),
          carbs: 22,
          fats: 4,
          icon: '🫐',
          category: 'Metabolic Snack',
          ingredients: ['0% Greek Yogurt or Plant Protein', 'Wild Blueberries', 'Hemp hearts'],
          steps: ['Combine ingredients into a light energizing bowl', 'Eat 2-3 hours before main lunch']
        },
        {
          id: `${day}-m3`,
          timing: 'Lunch',
          name: dietType.includes('Vegetarian') || dietType.includes('Vegan')
            ? 'Charred Tempeh & Quinoa Rainbow Buddha Bowl'
            : 'Grilled Lemon Herb Chicken with Brown Rice & Steamed Greens',
          calories: Math.round(calories * 0.30),
          protein: Math.round(proteinTarget * 0.32),
          carbs: Math.round(calories * 0.09),
          fats: 14,
          icon: '🥗',
          category: 'Macro Power Lunch',
          ingredients: ['Lean Protein (Chicken/Fish/Tempeh)', '1 Cup Quinoa or Brown Rice', 'Steamed Broccoli, Zucchini, Carrots'],
          steps: ['Grill protein to golden perfection', 'Pair with slow-digesting complex carbohydrates', 'Drizzle with cold-pressed olive oil']
        },
        {
          id: `${day}-m4`,
          timing: 'Pre-Workout',
          name: 'Glycogen Fuel: Banana & Raw Almond Butter Rice Cakes',
          calories: Math.round(calories * 0.10),
          protein: 8,
          carbs: 32,
          fats: 6,
          icon: '⚡',
          category: 'Pre-Training Fuel',
          ingredients: ['Brown rice cakes', '1 tbsp Pure almond butter', 'Half banana'],
          steps: ['Spread nut butter on rice cakes', 'Layer fresh banana slices', 'Consume 45 mins prior to workout session']
        },
        {
          id: `${day}-m5`,
          timing: 'Dinner',
          name: dietType.includes('Vegetarian') || dietType.includes('Vegan')
            ? 'Spiced Golden Lentil Dahl with Roasted Cauliflower'
            : 'Wild Atlantic Salmon Fillet with Asparagus & Sweet Potato Mash',
          calories: Math.round(calories * 0.23),
          protein: Math.round(proteinTarget * 0.25),
          carbs: 28,
          fats: 15,
          icon: '🍲',
          category: 'Recovery & Anti-Inflammatory',
          ingredients: ['Omega-3 rich Salmon or Lentil Dahl', 'Roasted Asparagus / Cauliflower', 'Herbs & Sea Salt'],
          steps: ['Bake or pan-sear on medium heat', 'Season with fresh dill, lemon juice, and garlic', 'Keep dinner light to encourage deep restorative sleep']
        }
      ];
    });

    this.dietPlan = newPlan;
    this.saveDietPlan();
  }

  getDefaultDietPlan() {
    const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const plan = {};
    days.forEach(day => {
      plan[day] = [
        {
          id: `${day}-m1`,
          timing: 'Breakfast',
          name: 'High-Protein Avocado Omelette & Sprouted Toast',
          calories: 450,
          protein: 34,
          carbs: 32,
          fats: 18,
          icon: '🍳',
          category: 'Metabolic Kickstart',
          ingredients: ['3 free-range egg whites + 1 whole egg', '1/3 Hass avocado', 'Handful baby spinach', '1 slice sprouted grain bread'],
          steps: ['Whisk eggs with a splash of almond milk and black pepper', 'Cook with light avocado oil spray in non-stick pan', 'Fold over sauteed spinach and avocado slices', 'Serve with warm sprouted grain toast']
        },
        {
          id: `${day}-m2`,
          timing: 'Mid-Morning',
          name: 'Greek Yogurt Superfood Parfait with Raw Honey',
          calories: 220,
          protein: 24,
          carbs: 22,
          fats: 3,
          icon: '🫐',
          category: 'Lean Protein Snack',
          ingredients: ['200g Authentic Greek Yogurt (0% fat)', '1/2 cup organic blueberries', '1 tbsp raw chia seeds', '1/2 tsp Ceylon cinnamon'],
          steps: ['Layer Greek yogurt in a glass with fresh blueberries', 'Top with raw chia seeds for omega-3 fiber', 'Dust with Ceylon cinnamon to stabilize blood glucose']
        },
        {
          id: `${day}-m3`,
          timing: 'Lunch',
          name: 'Grilled Herb Chicken Breast with Quinoa & Steamed Asparagus',
          calories: 560,
          protein: 48,
          carbs: 45,
          fats: 14,
          icon: '🥗',
          category: 'Nutrient Dense Power Lunch',
          ingredients: ['180g lean chicken breast marinated in herbs', '1 cup fluffy cooked quinoa', '8 steamed asparagus spears', '1 tsp extra virgin olive oil + lemon'],
          steps: ['Grill chicken breast 6-7 mins each side until internal temp is 165°F', 'Steam asparagus spears for 4 minutes until vibrant green', 'Plate with warm quinoa and drizzle with lemon olive oil dressing']
        },
        {
          id: `${day}-m4`,
          timing: 'Pre-Workout',
          name: 'Quick Carb Charger: Banana & Almond Butter Rice Cakes',
          calories: 210,
          protein: 6,
          carbs: 34,
          fats: 6,
          icon: '⚡',
          category: 'Fast Glycogen Surge',
          ingredients: ['2 whole grain rice cakes', '1 tbsp natural almond butter', '1/2 sliced ripe banana', 'Pinch of pink salt'],
          steps: ['Spread almond butter evenly over crispy rice cakes', 'Garnish with sliced banana and a micro pinch of pink salt for electrolyte balance', 'Eat 40-50 minutes before training session']
        },
        {
          id: `${day}-m5`,
          timing: 'Dinner',
          name: 'Pan-Seared Wild Atlantic Salmon with Sweet Potato Mash & Broccoli',
          calories: 520,
          protein: 42,
          carbs: 36,
          fats: 20,
          icon: '🍲',
          category: 'Restorative Recovery Dinner',
          ingredients: ['170g wild salmon fillet', '1 medium baked sweet potato', '1.5 cups steamed broccoli florets', 'Fresh garlic, rosemary & lemon'],
          steps: ['Pan sear salmon in cast iron skillet 4 mins on skin side, flip for 3 mins', 'Mash baked sweet potato with a fork, season with black pepper', 'Serve with tender steamed broccoli florets']
        }
      ];
    });
    return plan;
  }

  render() {
    const container = document.getElementById('dietMealsContainer');
    if (!container) return;

    // Update active day selector pills
    const dayPills = document.querySelectorAll('.diet-day-pill');
    dayPills.forEach(pill => {
      if (pill.dataset.day === this.currentDay) {
        pill.className = 'diet-day-pill px-4 py-2 rounded-xl text-xs font-bold transition-all bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/25';
      } else {
        pill.className = 'diet-day-pill px-4 py-2 rounded-xl text-xs font-semibold transition-all bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800';
      }
    });

    const meals = this.dietPlan[this.currentDay] || [];
    
    // Calculate total targets for this day
    const dayCals = meals.reduce((sum, m) => sum + (m.calories || 0), 0);
    const dayProtein = meals.reduce((sum, m) => sum + (m.protein || 0), 0);
    const dayCarbs = meals.reduce((sum, m) => sum + (m.carbs || 0), 0);
    const dayFats = meals.reduce((sum, m) => sum + (m.fats || 0), 0);

    const targetCalsEl = document.getElementById('dietDayTotalCals');
    if (targetCalsEl) targetCalsEl.textContent = `${dayCals} kcal`;
    const targetProteinEl = document.getElementById('dietDayTotalProtein');
    if (targetProteinEl) targetProteinEl.textContent = `${dayProtein}g`;
    const targetCarbsEl = document.getElementById('dietDayTotalCarbs');
    if (targetCarbsEl) targetCarbsEl.textContent = `${dayCarbs}g`;
    const targetFatsEl = document.getElementById('dietDayTotalFats');
    if (targetFatsEl) targetFatsEl.textContent = `${dayFats}g`;

    container.innerHTML = meals.map(meal => {
      const isConsumed = this.isMealConsumed(meal.id);
      return `
        <div class="p-5 rounded-2xl border transition-all ${isConsumed ? 'bg-emerald-950/20 border-emerald-500/40' : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'} shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-slate-800/80 border border-slate-700/60 shrink-0">
              ${meal.icon || '🥗'}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  ${meal.timing}
                </span>
                <span class="text-xs text-slate-400 font-medium">${meal.category || 'Healthy Fuel'}</span>
                ${isConsumed ? '<span class="text-xs font-semibold text-emerald-400 flex items-center gap-1">✓ Logged Eaten</span>' : ''}
              </div>
              <h3 class="text-base font-bold text-white mt-1">${meal.name}</h3>
              <div class="flex items-center gap-4 text-xs font-mono text-slate-400 mt-2">
                <span class="text-amber-400 font-semibold">🔥 ${meal.calories} kcal</span>
                <span>🍗 ${meal.protein}g Protein</span>
                <span>🌾 ${meal.carbs}g Carbs</span>
                <span>🥑 ${meal.fats}g Fats</span>
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <!-- View Recipe -->
            <button onclick="window.dietPlanner.viewRecipe('${meal.id}')" class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700">
              📖 Recipe & Prep
            </button>
            <!-- Swap Meal -->
            <button onclick="window.dietPlanner.swapMeal('${meal.id}')" title="Swap for alternative meal" class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-300 transition-colors border border-slate-700 flex items-center gap-1">
              🔄 Swap
            </button>
            <!-- Mark as Eaten -->
            <button onclick="window.dietPlanner.toggleMealConsumed('${meal.id}', ${meal.calories}, ${meal.protein}, ${meal.carbs}, ${meal.fats})" class="px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${isConsumed ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/20' : 'bg-slate-800 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'}">
              ${isConsumed ? '✓ Eaten' : '+ Log Meal'}
            </button>
          </div>
        </div>
      `;
    }).join('');

    this.updateConsumedMacros();
  }

  // Print/Export Diet Plan as neat document
  printPlan() {
    window.print();
  }
}

window.dietPlanner = new DietPlanner();
