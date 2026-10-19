# ⚡ PulseFit Pro — AI-Powered Fitness, Nutrition & Circadian Alarms Platform

PulseFit Pro is a high-performance, modern fitness web application designed to guide athletes and everyday fitness enthusiasts through customized health diagnostics, personalized nutrition meal planning, body-type-specific workout routines, real-time heart rate monitoring, and smart alarms for eating, training, and recovery.

---

## 🌟 Key Features

### 1. 💬 AI Health & Fitness Coach ("Coach Aero")
- **Interactive Multi-Turn Diagnostic**: Analyzes body archetype (Ectomorph, Mesomorph, Endomorph, Skinny-Fat), biological stats (Age, Gender, Height, Weight), target goals (Fat Loss, Muscle Hypertrophy, Lean Athletic, Endurance), and dietary preferences (Balanced, High-Protein, Vegetarian, Vegan, Keto, Diabetic-Safe).
- **Physiological Engine**: Calculates Mifflin-St Jeor Basal Metabolic Rate (BMR), Total Daily Energy Expenditure (TDEE), daily caloric targets, and exact macronutrient grams (Protein, Carbs, Healthy Fats, Water in Liters).
- **Auto-Prescription**: Automatically builds and activates the 7-day Diet Chart, Workout routines, and 9 synchronized daily alarms.
- **24/7 Fitness Consultation**: Answers questions regarding pre/post-workout nutrition, stubborn lower belly fat, hydration science, Zone 2 cardio, meal substitutions, and more.

### 2. 🥗 Precision Diet & Meal Planner
- **7-Day Meal Schedule**: Mon-Sun view with categorized meals (Breakfast, Mid-Morning Snack, Lunch, Pre-Workout Fuel, Dinner).
- **Macro Tracking**: Visualizes target vs. consumed calories, protein, carbohydrates, and fats.
- **Meal Swapping**: One-click alternative suggestions if an ingredient is unavailable.
- **Recipe & Prep Modals**: Exact ingredient lists, cooking guidelines, and nutritional insights.
- **PDF / Print Ready**: Clean print stylesheet to export the complete meal chart for kitchen fridge or gym binder.

### 3. 🏋️ Goal & Body-Type Workout Arena
- **Targeted Training Protocols**: Routines mapped directly to user body types and goals (e.g. Endomorph Fat Burning & Density, Ectomorph Progressive Overload Mass, Mesomorph Athletic V-Taper Definition).
- **Interactive Set Logger**: Log completed working sets (Set 1, Set 2, Set 3, etc.) with automatic tactile feedback.
- **Active Rest Timer Widget**: Visual countdown circle with audible second ticks and a completion bell chime.
- **Exercise Form Cues**: Biomechanical execution tips to maximize muscle recruitment and prevent joint injury.

### 4. ⏰ Circadian Alarms & Smart Schedule Manager
- **Synchronized Daily Alarms**: Built-in alarms for Power Breakfast, Hydration Boosts, Macro Lunch, Pre-Workout Snack, Workout Time, Post-Workout Protein, Dinner, and Sleep/Recovery.
- **Pure Web Audio API Synthesizer**: 100% offline harmonic chimes, boxing bells, digital beeps, and fanfare alerts that play directly in the browser without external dependencies.
- **Interactive Modal & Notification Support**: Features "Snooze (5m)" and "Dismiss" buttons plus desktop Web Notification API support.
- **Custom Alarms**: Add any custom meal, supplement, water, or workout alarm with customized ringtimes and sounds.

### 5. ❤️ Heart Rate & Vitals Biosensor Suite
- **Real-Time Animated EKG (Electrocardiogram) Canvas**: Smooth continuous Lead II oscilloscope wave featuring realistic P-Q-R-S-T peaks beating in sync with current BPM.
- **Synchronized Heartbeat Audio**: Realistic rhythmic "lub-dub" double-thump sound powered by Web Audio API.
- **Tap-to-Beat Pulse Detector**: Tap in tempo with your radial or carotid pulse to measure instantaneous rolling BPM.
- **Heart Rate Training Zones**: Tanaka formula ($208 - 0.7 \times \text{Age}$) calculates Zone 1 (Active Recovery), Zone 2 (Fat Burn Engine), Zone 3 (Aerobic Stamina), Zone 4 (Anaerobic Threshold), and Zone 5 (VO2 Max Peak).
- **Photoplethysmography Sensor Simulator**: Optical skin scanning simulation for quick vitals checks.
- **Chart.js Vitals Graph**: Tracks hourly heart rate trajectories throughout the day.

### 6. 📊 Dashboard, Water Tracker & Analytics
- **Calorie Budget Meter**: Visualizes net calorie balance ($\text{Target} - \text{Consumed} + \text{Burned}$).
- **Interactive Hydration System**: Quick `+250ml` and `+500ml` logging with milestone confetti celebrations.
- **Step & Distance Logger**: Quick steps counter estimating active calorie burn.
- **Weight Trajectory Chart**: Log daily morning weight with Trend lines.

---

## 🚀 How to Run the Website

### Method 1: Using the Included Python Server (Recommended)
Open PowerShell or Command Prompt in the `pulsefit` directory and run:

```powershell
python server.py
```

This starts a local web server at `http://localhost:8080/index.html` and automatically launches your default browser.

### Method 2: Open Directly in Any Browser
You can open `index.html` directly in Google Chrome, Microsoft Edge, Mozilla Firefox, or Brave:

```powershell
start "C:\Users\SRADHA PANIGRAHI\.gemini\antigravity\scratch\pulsefit\index.html"
```

---

## 📁 File Structure

```
pulsefit/
├── index.html            # Main HTML application and modal interfaces
├── styles.css            # Athletic dark mode styling, glassmorphism, animations & print media query
├── audio-engine.js       # Offline Web Audio API synthesizer (heartbeats, alarms, chimes, rest beeps)
├── alarm-manager.js      # Real-time alarm monitoring, alert popups, snooze, and schedule sync
├── vitals-heartrate.js   # Real-time EKG canvas renderer, tap pulse detector, Tanaka HR zones
├── diet-planner.js       # 7-day meal schedules, macro targets, recipe modals & meal swap logic
├── workout-arena.js      # Goal-focused exercise routines, interactive set logger, rest countdown
├── chat-coach.js         # AI Coach ("Aero") diagnostic interview & consultation conversational engine
├── app.js                # App orchestrator, water tracker, step logger, weight chart, toast notifications
├── server.py             # Simple Python server with automatic browser opening
└── README.md             # Documentation & feature manual
```
