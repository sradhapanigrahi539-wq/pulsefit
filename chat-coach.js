/**
 * PulseFit AI Health Coach ("Aero")
 * Conversational fitness engine that conducts diagnostic interviews,
 * evaluates health type, calculates BMR/TDEE/Macros, and automatically
 * generates custom diet charts, workout routines, and alarm schedules.
 */

class ChatCoach {
  constructor() {
    this.messages = this.loadMessages();
    this.userProfile = this.loadProfile();
    this.assessmentStep = this.userProfile.completedAssessment ? null : 'intro';
    this.tempAnswers = {};
  }

  loadProfile() {
    const saved = localStorage.getItem('pulsefit_user_profile');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading profile:', e);
      }
    }
    return {
      completedAssessment: false,
      name: 'Champion',
      age: 26,
      gender: 'Male',
      height: 175,
      weight: 72,
      targetWeight: 68,
      bodyType: 'Mesomorph', // Ectomorph, Mesomorph, Endomorph
      goal: 'Lean Athletic & Muscle Definition',
      dietType: 'Balanced High-Protein',
      activityLevel: 'Moderate',
      targetCalories: 2150,
      targetProtein: 150,
      targetCarbs: 220,
      targetFats: 65,
      targetWaterLiters: 3.2
    };
  }

  saveProfile() {
    localStorage.setItem('pulsefit_user_profile', JSON.stringify(this.userProfile));
    if (window.updateDashboardProfile) {
      window.updateDashboardProfile(this.userProfile);
    }
  }

  loadMessages() {
    const saved = localStorage.getItem('pulsefit_chat_messages');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading messages:', e);
      }
    }
    return [
      {
        id: 'msg-0',
        sender: 'ai',
        time: 'Just now',
        text: `👋 Greetings! I am **Aero**, your PulseFit AI Health & Performance Coach.
<br><br>
I am here to analyze your biological profile, health type, and fitness aspirations, then build your **Personalized Diet Chart**, **Target Body Workout Plan**, and **Synchronized Alarm Reminders** (when to eat, train, hydrate, and recover).
<br><br>
Let's establish your baseline to design your optimal regimen!`,
        quickReplies: ['Start Diagnostic Assessment', 'I have a quick fitness question', 'Tell me how you work']
      }
    ];
  }

  saveMessages() {
    localStorage.setItem('pulsefit_chat_messages', JSON.stringify(this.messages));
    this.render();
  }

  addMessage(sender, text, quickReplies = null, card = null) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    this.messages.push({
      id: 'msg-' + Date.now(),
      sender,
      time: timeStr,
      text,
      quickReplies,
      card
    });
    this.saveMessages();
    this.scrollToBottom();
  }

  scrollToBottom() {
    const container = document.getElementById('chatMessagesContainer');
    if (container) {
      setTimeout(() => {
        container.scrollTop = container.scrollHeight;
      }, 50);
    }
  }

  handleUserSubmit(inputText) {
    const text = (inputText || '').trim();
    if (!text) return;

    // Add user message
    this.addMessage('user', text);

    // Show AI typing indicator
    this.showTypingIndicator();

    setTimeout(() => {
      this.hideTypingIndicator();
      this.processInput(text);
    }, 600);
  }

  showTypingIndicator() {
    const indicator = document.getElementById('aiTypingIndicator');
    if (indicator) indicator.classList.remove('hidden');
    this.scrollToBottom();
  }

  hideTypingIndicator() {
    const indicator = document.getElementById('aiTypingIndicator');
    if (indicator) indicator.classList.add('hidden');
  }

  processInput(text) {
    const lower = text.toLowerCase();

    // Reset or restart diagnostic
    if (lower.includes('start diagnostic') || lower.includes('diagnostic assessment') || lower.includes('restart assessment') || lower.includes('reset plan')) {
      this.assessmentStep = 'step_body_type';
      this.tempAnswers = {};
      this.addMessage('ai', `Let's determine your **Body & Health Type** first. Which biological archetype best characterizes your natural physique?
<br><br>
1️⃣ **Ectomorph (Hardgainer)**: Lean, fast metabolism, finds it hard to gain muscle/weight.<br>
2️⃣ **Mesomorph (Athletic)**: Naturally muscular, athletic frame, gains or loses weight with moderate ease.<br>
3️⃣ **Endomorph (Solid/Storage)**: Broader structure, slower metabolism, stores fat easily, powerful strength base.<br>
4️⃣ **Sedentary / Skinny-Fat**: High body fat percentage with lower lean muscle mass.`, 
      ['Ectomorph (Lean / Hardgainer)', 'Mesomorph (Athletic Build)', 'Endomorph (Broad / Stores Fat)', 'Skinny-Fat / Recomposition']);
      return;
    }

    // Step-by-step diagnostic handler
    if (this.assessmentStep) {
      this.handleAssessmentStep(text);
      return;
    }

    // Free-form intelligent fitness coaching response
    this.handleConsultationQuery(text);
  }

  handleAssessmentStep(text) {
    const lower = text.toLowerCase();

    // Step 1: Body Type
    if (this.assessmentStep === 'step_body_type') {
      if (lower.includes('ecto')) this.tempAnswers.bodyType = 'Ectomorph';
      else if (lower.includes('endo')) this.tempAnswers.bodyType = 'Endomorph';
      else if (lower.includes('skinny')) this.tempAnswers.bodyType = 'Skinny-Fat';
      else this.tempAnswers.bodyType = 'Mesomorph';

      this.assessmentStep = 'step_bio';
      this.addMessage('ai', `Excellent. Identified body archetype: **${this.tempAnswers.bodyType}**.
<br><br>
Next, tell me your biological details: **Age, Gender, Height (cm), and Current Weight (kg)**.
<br>*(e.g., "25, Male, 178 cm, 74 kg" or click a preset)*`,
      ['25, Male, 178 cm, 74 kg', '28, Female, 165 cm, 60 kg', '22, Male, 182 cm, 68 kg', '32, Female, 160 cm, 65 kg']);
      return;
    }

    // Step 2: Biological Stats
    if (this.assessmentStep === 'step_bio') {
      // Parse numbers
      const numbers = text.match(/\d+(\.\d+)?/g);
      if (numbers && numbers.length >= 3) {
        this.tempAnswers.age = parseInt(numbers[0]) || 25;
        this.tempAnswers.height = parseFloat(numbers[1]) || 175;
        this.tempAnswers.weight = parseFloat(numbers[2]) || 70;
      } else {
        this.tempAnswers.age = 25;
        this.tempAnswers.height = 175;
        this.tempAnswers.weight = 72;
      }
      this.tempAnswers.gender = lower.includes('female') || lower.includes('woman') ? 'Female' : 'Male';

      this.assessmentStep = 'step_goal';
      this.addMessage('ai', `Stats logged: **${this.tempAnswers.age} yrs**, **${this.tempAnswers.gender}**, **${this.tempAnswers.height} cm**, **${this.tempAnswers.weight} kg**.
<br><br>
Now, what is your **Primary Target Body Goal**?`,
      ['Shredded Fat Loss & Abs', 'Lean Athletic Muscle Definition', 'Strength & Mass Bulking', 'Endurance & Cardio Stamina']);
      return;
    }

    // Step 3: Target Goal
    if (this.assessmentStep === 'step_goal') {
      if (lower.includes('fat') || lower.includes('shred') || lower.includes('cut')) {
        this.tempAnswers.goal = 'Fat Loss & High Definition';
      } else if (lower.includes('bulk') || lower.includes('mass') || lower.includes('strength')) {
        this.tempAnswers.goal = 'Strength & Muscle Hypertrophy';
      } else if (lower.includes('endurance') || lower.includes('cardio') || lower.includes('stamina')) {
        this.tempAnswers.goal = 'Cardiovascular Endurance & Longevity';
      } else {
        this.tempAnswers.goal = 'Lean Athletic & Muscle Definition';
      }

      this.assessmentStep = 'step_diet';
      this.addMessage('ai', `Target goal locked: **${this.tempAnswers.goal}**.
<br><br>
What dietary lifestyle or restrictions do you adhere to?`,
      ['Balanced High-Protein', 'Vegetarian High-Protein', 'Plant-Based Vegan', 'Keto / Low-Carb', 'Diabetic-Friendly']);
      return;
    }

    // Step 4: Diet Lifestyle & Final Calculation
    if (this.assessmentStep === 'step_diet') {
      this.tempAnswers.dietType = text;
      this.assessmentStep = null; // Assessment complete!

      // Compute Mifflin-St Jeor BMR & TDEE
      const weight = this.tempAnswers.weight || 72;
      const height = this.tempAnswers.height || 175;
      const age = this.tempAnswers.age || 25;
      const isFemale = this.tempAnswers.gender === 'Female';

      // BMR = 10*weight + 6.25*height - 5*age + (5 for male, -161 for female)
      let bmr = Math.round(10 * weight + 6.25 * height - 5 * age + (isFemale ? -161 : 5));
      let tdee = Math.round(bmr * 1.45); // Moderate activity

      let targetCalories = tdee;
      let targetProtein = Math.round(weight * 2.0); // 2g per kg bodyweight
      let targetFats = Math.round((targetCalories * 0.25) / 9);
      let targetCarbs = Math.round((targetCalories - (targetProtein * 4 + targetFats * 9)) / 4);

      if (this.tempAnswers.goal.includes('Fat Loss')) {
        targetCalories = Math.round(tdee - 450); // Safe sustainable deficit
        targetProtein = Math.round(weight * 2.2); // High protein to preserve muscle
        targetCarbs = Math.max(100, Math.round((targetCalories - (targetProtein * 4 + targetFats * 9)) / 4));
      } else if (this.tempAnswers.goal.includes('Bulking') || this.tempAnswers.goal.includes('Hypertrophy')) {
        targetCalories = Math.round(tdee + 350); // Clean lean surplus
        targetCarbs = Math.round((targetCalories - (targetProtein * 4 + targetFats * 9)) / 4);
      }

      // Water target
      const waterLiters = (weight * 0.04).toFixed(1);

      // Save to user profile
      Object.assign(this.userProfile, {
        completedAssessment: true,
        bodyType: this.tempAnswers.bodyType,
        age: age,
        gender: this.tempAnswers.gender,
        height: height,
        weight: weight,
        goal: this.tempAnswers.goal,
        dietType: this.tempAnswers.dietType,
        targetCalories: targetCalories,
        targetProtein: targetProtein,
        targetCarbs: targetCarbs,
        targetFats: targetFats,
        targetWaterLiters: parseFloat(waterLiters)
      });
      this.saveProfile();

      // Trigger automatic generation of Diet, Workout, and Alarms
      if (window.dietPlanner) {
        window.dietPlanner.generateCustomPlan(this.userProfile);
      }
      if (window.workoutArena) {
        window.workoutArena.generateCustomWorkout(this.userProfile);
      }
      if (window.vitalsMonitor) {
        window.vitalsMonitor.userAge = age;
        window.vitalsMonitor.updateZones();
      }

      // Automatically construct personalized alarm schedule
      const recommendedAlarms = [
        { title: 'Morning Hydration & Detox', time: '07:30', category: 'water', icon: '💧' },
        { title: `Breakfast: ${this.userProfile.dietType}`, time: '08:15', category: 'meal', icon: '🍳' },
        { title: 'Hydration Check (500ml)', time: '11:00', category: 'water', icon: '💧' },
        { title: 'Macro-Dense Lunch', time: '13:00', category: 'meal', icon: '🥗' },
        { title: 'Pre-Workout Fuel Snack', time: '17:15', category: 'meal', icon: '⚡' },
        { title: `Target Workout (${this.userProfile.goal})`, time: '18:15', category: 'workout', icon: '🏋️' },
        { title: 'Post-Workout Anabolic Shake', time: '19:30', category: 'meal', icon: '🥤' },
        { title: 'Restorative Lean Dinner', time: '20:45', category: 'meal', icon: '🍲' },
        { title: 'Sleep & Muscle Recovery', time: '22:45', category: 'sleep', icon: '😴' }
      ];
      if (window.alarmManager) {
        window.alarmManager.syncWithRecommendations(recommendedAlarms);
      }

      // Play success celebration chime
      if (window.soundFx) window.soundFx.playSuccess();

      // Send master prescription message
      this.addMessage('ai', `🎉 **Assessment Complete! Your Master Fitness Blueprint is Activated.**
<br><br>
Based on your **${this.userProfile.bodyType}** archetype and **${this.userProfile.goal}** focus:
<br>
• **Daily Calorie Target**: <span class="text-emerald-400 font-bold">${targetCalories} kcal</span><br>
• **Macronutrients**: <span class="text-white font-bold">${targetProtein}g Protein</span> | <span class="text-slate-300">${targetCarbs}g Carbs</span> | <span class="text-slate-300">${targetFats}g Fats</span><br>
• **Hydration Threshold**: <span class="text-cyan-400 font-bold">${waterLiters} Liters/day</span>
<br><br>
I have configured:
✅ **7-Day Personalized Meal Planner** (Nutrient-timed meals)<br>
✅ **Target Body-Type Workout Protocol** (Sets, reps, rest timers)<br>
✅ **9 Scheduled Alarms** (When to eat, hydrate, train, and sleep)
<br><br>
Explore your customized tabs below or ask me any question!`, 
      ['View Diet Chart', 'View Exercise Plan', 'Check Alarms', 'Monitor Heart Rate']);
      return;
    }
  }

  handleConsultationQuery(text) {
    const lower = text.toLowerCase();

    // Check specific navigation intents
    if (lower.includes('view diet') || lower.includes('show diet') || lower.includes('meal chart')) {
      if (window.switchTab) window.switchTab('diet');
      this.addMessage('ai', 'Switched to your **Diet & Nutrition Hub**! Here you can view your scheduled meals, swap dishes, view recipes, and log calories.', ['Log a Meal', 'Back to Chat', 'How to hit protein goal']);
      return;
    }
    if (lower.includes('view exercise') || lower.includes('workout plan') || lower.includes('show workouts')) {
      if (window.switchTab) window.switchTab('workout');
      this.addMessage('ai', 'Switched to the **Workout Arena**! Check your exercise execution cues, start rest countdown timers, and check off completed sets.', ['Start Rest Timer', 'Back to Chat', 'What about rest days?']);
      return;
    }
    if (lower.includes('alarm') || lower.includes('check alarms') || lower.includes('reminder')) {
      if (window.switchTab) window.switchTab('alarms');
      this.addMessage('ai', 'Switched to **Alarms & Reminders**! You have active alerts for meals, workouts, water, and sleep. You can customize sounds or test them.', ['Add New Alarm', 'Back to Chat']);
      return;
    }
    if (lower.includes('heart') || lower.includes('heartbeat') || lower.includes('pulse') || lower.includes('bpm')) {
      if (window.switchTab) window.switchTab('vitals');
      this.addMessage('ai', 'Switched to **Heart Rate & Vitals**! You can view your real-time EKG trace, tap to measure your pulse, and check your training heart rate zones.', ['Measure Pulse Now', 'Back to Chat', 'What is Zone 2?']);
      return;
    }

    // Intelligent answers to common user questions
    let reply = '';
    let quicks = ['Start Diagnostic Assessment', 'View Diet Chart', 'Check Heart Rate'];

    if (lower.includes('lower belly') || lower.includes('belly fat') || lower.includes('stubborn fat')) {
      reply = `**Aero's Protocol for Lower Belly Fat:**
<br><br>
1. **Calorie Deficit is King**: Spot reduction is anatomically impossible. Lower belly fat has high density of alpha-2 adrenergic receptors, meaning it is often the last to mobilize.
2. **Sustained Zone 2 Cardio**: Low-intensity steady-state (e.g. brisk incline walking at 60-70% max heart rate) mobilizes free fatty acids without spiking cortisol.
3. **High Protein Satiety**: Keep protein at 2.0g-2.2g per kg of bodyweight to prevent muscle loss and suppress ghrelin (hunger hormone).
4. **Cortisol Control**: High stress and poor sleep flood your body with cortisol, which signals visceral fat storage around the midsection. Keep alarms for 8 hours of sleep!`;
      quicks = ['What is Zone 2?', 'View Diet Chart', 'Check Alarms'];
    } 
    else if (lower.includes('pre-workout') || lower.includes('before workout') || lower.includes('pre workout')) {
      reply = `**Optimal Pre-Workout Nutrition:**
<br><br>
• **Timing**: 45 to 60 minutes before training.
• **Primary Fuel**: Fast-to-medium digesting complex carbohydrates + low fat + moderate protein.
• **Top Options**:
  - 2 Rice cakes with 1 tbsp almond butter and half a sliced banana.
  - Oatmeal with half a scoop of whey/plant protein and cinnamon.
  - 2 Medjool dates with an espresso shot (natural vasodilator).
• **Hydration**: Drink 400-500ml water with a pinch of Himalayan salt for enhanced muscle pump!`;
      quicks = ['What to eat post-workout?', 'View Workout Plan'];
    }
    else if (lower.includes('post-workout') || lower.includes('after workout')) {
      reply = `**Post-Workout Muscle Recovery Window:**
<br><br>
• **The Goal**: Replenish depleted glycogen and initiate muscle protein synthesis (MPS).
• **The Formula**: 25-35g high-leucine protein + 40-50g easily absorbed carbohydrates within 45-90 minutes.
• **Best Picks**: Whey isolate shake with blueberries or banana, grilled chicken with jasmine rice, or scrambled egg whites with sweet potato mash.`;
      quicks = ['View Diet Chart', 'Start Rest Timer'];
    }
    else if (lower.includes('water') || lower.includes('hydration')) {
      reply = `**Hydration Science for Peak Performance:**
<br><br>
Even a 2% drop in hydration can reduce muscle strength output by up to 15% and increase resting heart rate!
<br><br>
• **Daily Target**: ${this.userProfile.targetWaterLiters || 3.2} Liters.
• **During Workouts**: Sip 200ml every 15-20 minutes.
• Check your dashboard water tracker and tap '+250ml' every time you drink!`;
      quicks = ['Log Water Now', 'View Alarms'];
    }
    else if (lower.includes('zone 2') || lower.includes('heart rate zone')) {
      reply = `**Zone 2 Cardio Explained:**
<br><br>
Zone 2 corresponds to **60% - 70% of your Maximum Heart Rate** (approx. ${Math.round((208 - 0.7 * this.userProfile.age) * 0.60)} - ${Math.round((208 - 0.7 * this.userProfile.age) * 0.70)} BPM for your age).
<br><br>
• **Why it's essential**: At this intensity, your muscle mitochondria rely almost 100% on fat oxidation for ATP, making it the most potent fat-burning zone.
• **Feel test**: You should be able to hold a conversation without gasping for air.`;
      quicks = ['Check My Heartbeat Rate', 'View Exercise Plan'];
    }
    else if (lower.includes('vegetarian') || lower.includes('protein source') || lower.includes('vegan')) {
      reply = `**Top Vegetarian & Vegan High-Protein Sources:**
<br><br>
1. **Tempeh & Tofu**: 19g-22g protein per 100g (complete amino acid profile).
2. **Greek Yogurt / Paneer / Cottage Cheese**: 12g-18g per 100g.
3. **Lentils & Chickpeas**: 18g protein per cooked cup + prebiotic fiber.
4. **Hemp Hearts & Nutritional Yeast**: Excellent complete protein toppers.
5. **Pea & Brown Rice Isolate Powder**: 25g clean protein per scoop.`;
      quicks = ['View Diet Chart', 'Start Diagnostic Assessment'];
    }
    else {
      reply = `I understand! To keep your progress continuous, consistency with your **Diet**, **Workout execution**, and **Scheduled alarms** is paramount.
<br><br>
You can ask me anything about your nutrition targets, exercise form, metabolic recovery, or run a diagnostic update anytime!`;
      quicks = ['Start Diagnostic Assessment', 'View Diet Chart', 'View Exercise Plan', 'Check Alarms'];
    }

    this.addMessage('ai', reply, quicks);
  }

  render() {
    const container = document.getElementById('chatMessagesContainer');
    if (!container) return;

    container.innerHTML = this.messages.map(msg => {
      const isAi = msg.sender === 'ai';
      return `
        <div class="flex gap-3.5 ${isAi ? 'items-start' : 'items-start justify-end'} mb-4">
          ${isAi ? `
            <div class="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-md shadow-emerald-500/20">
              ⚡
            </div>
          ` : ''}

          <div class="max-w-[85%] md:max-w-[75%]">
            <div class="p-4 rounded-2xl ${isAi ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-lg shadow-emerald-600/20'} text-sm leading-relaxed">
              ${msg.text}
            </div>
            
            <div class="text-[10px] text-slate-500 mt-1 flex items-center gap-2 ${isAi ? '' : 'justify-end'}">
              <span>${msg.time}</span>
              ${isAi ? '<span>• PulseCoach AI</span>' : ''}
            </div>

            ${msg.quickReplies && msg.quickReplies.length ? `
              <div class="flex flex-wrap gap-2 mt-2.5">
                ${msg.quickReplies.map(qr => `
                  <button onclick="window.chatCoach.handleUserSubmit('${qr.replace(/'/g, "\\'")}')" 
                          class="px-3 py-1.5 rounded-full text-xs font-medium bg-slate-800/90 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/30 transition-all hover:scale-105 active:scale-95">
                    ${qr}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>

          ${!isAi ? `
            <div class="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 font-bold text-sm shrink-0">
              👤
            </div>
          ` : ''}
        </div>
      `;
    }).join('');

    this.scrollToBottom();
  }
}

window.chatCoach = new ChatCoach();
