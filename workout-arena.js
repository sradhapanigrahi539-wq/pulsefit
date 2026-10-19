/**
 * PulseFit Workout Arena
 * Goal-driven exercise routines, interactive set logger, active rest timer with audio.
 */

class WorkoutArena {
  constructor() {
    this.currentGoal = 'Lean Athletic & Muscle Definition';
    this.routines = this.loadRoutines();
    this.activeDay = 'Day 1: Upper Body Power & Sculpt';
    this.completedSets = this.loadCompletedSets();

    // Rest timer state
    this.restTimerInterval = null;
    this.restTimeRemaining = 0;
    this.restTotalTime = 60;
  }

  loadRoutines() {
    const saved = localStorage.getItem('pulsefit_routines');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading routines:', e);
      }
    }
    return this.getDefaultRoutines();
  }

  saveRoutines() {
    localStorage.setItem('pulsefit_routines', JSON.stringify(this.routines));
    this.render();
  }

  loadCompletedSets() {
    const saved = localStorage.getItem('pulsefit_completed_sets');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading completed sets:', e);
      }
    }
    return {};
  }

  saveCompletedSets() {
    localStorage.setItem('pulsefit_completed_sets', JSON.stringify(this.completedSets));
  }

  toggleSet(exerciseId, setIndex) {
    const today = new Date().toDateString();
    const key = `${today}_${exerciseId}_set${setIndex}`;
    this.completedSets[key] = !this.completedSets[key];
    this.saveCompletedSets();

    if (this.completedSets[key]) {
      if (window.soundFx) window.soundFx.playSuccess();
      // Auto-suggest rest timer
      this.startRestTimer(60);
    }
    this.render();
  }

  isSetCompleted(exerciseId, setIndex) {
    const today = new Date().toDateString();
    const key = `${today}_${exerciseId}_set${setIndex}`;
    return !!this.completedSets[key];
  }

  // Interactive Rest Timer
  startRestTimer(seconds = 60) {
    if (this.restTimerInterval) clearInterval(this.restTimerInterval);
    this.restTotalTime = seconds;
    this.restTimeRemaining = seconds;

    const modal = document.getElementById('restTimerWidget');
    if (modal) modal.classList.remove('hidden');

    this.updateRestDisplay();

    this.restTimerInterval = setInterval(() => {
      this.restTimeRemaining--;
      this.updateRestDisplay();

      if (this.restTimeRemaining <= 3 && this.restTimeRemaining > 0) {
        if (window.soundFx) window.soundFx.playTick();
      }

      if (this.restTimeRemaining <= 0) {
        clearInterval(this.restTimerInterval);
        this.restTimerInterval = null;
        if (window.soundFx) window.soundFx.playAlarm('bell');
        if (window.showToast) window.showToast('Rest complete! Time to crush the next set! 💪');
      }
    }, 1000);
  }

  stopRestTimer() {
    if (this.restTimerInterval) {
      clearInterval(this.restTimerInterval);
      this.restTimerInterval = null;
    }
    const modal = document.getElementById('restTimerWidget');
    if (modal) modal.classList.add('hidden');
  }

  updateRestDisplay() {
    const display = document.getElementById('restTimerCountdown');
    if (display) {
      const mins = Math.floor(this.restTimeRemaining / 60);
      const secs = this.restTimeRemaining % 60;
      display.textContent = `${mins}:${String(secs).padStart(2, '0')}`;
    }

    const circle = document.getElementById('restTimerProgressCircle');
    if (circle) {
      const radius = 36;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference * (1 - this.restTimeRemaining / this.restTotalTime);
      circle.style.strokeDashoffset = offset;
    }
  }

  // Set daily alarm for workout directly
  scheduleWorkoutAlarm(time = '18:00') {
    if (window.alarmManager) {
      window.alarmManager.addAlarm({
        title: `Workout: ${this.activeDay}`,
        time: time,
        category: 'workout',
        icon: '🏋️',
        sound: 'bell'
      });
      if (window.showToast) {
        window.showToast(`Workout reminder set for ${time}! 🏋️`);
      }
    }
  }

  // Customize routines based on AI diagnosis
  generateCustomWorkout(profile) {
    const goal = profile.goal || 'Lean Athletic';
    const bodyType = profile.bodyType || 'Mesomorph';

    this.currentGoal = `${bodyType} - ${goal}`;
    
    // Generate specialized split
    if (goal.includes('Fat Loss') || bodyType === 'Endomorph') {
      this.routines = this.getEndomorphFatLossRoutine();
    } else if (goal.includes('Bulking') || bodyType === 'Ectomorph') {
      this.routines = this.getEctomorphMassRoutine();
    } else {
      this.routines = this.getDefaultRoutines();
    }

    this.activeDay = Object.keys(this.routines)[0];
    this.saveRoutines();
  }

  getEndomorphFatLossRoutine() {
    return {
      'Day 1: High Density Push & Metabolic Cardio': [
        { id: 'w-e1', name: 'Incline Dumbbell Chest Press', muscle: 'Upper Chest & Triceps', sets: 4, reps: '12-15 reps', rest: '45s', icon: '🏋️', cue: 'Full range of motion, drive up explosively with control' },
        { id: 'w-e2', name: 'Barbell Overhead Military Press', muscle: 'Anterior Deltoids & Core', sets: 4, reps: '10-12 reps', rest: '45s', icon: '⚡', cue: 'Brace core tightly, lock out overhead without arching lower back' },
        { id: 'w-e3', name: 'Dips / Weighted Triceps Dips', muscle: 'Triceps & Lower Chest', sets: 3, reps: '12 reps', rest: '45s', icon: '💪', cue: 'Keep torso slightly leaned forward for chest engagement' },
        { id: 'w-e4', name: 'Kettlebell Swings (Metabolic Finisher)', muscle: 'Posterior Chain & Heart Rate Peak', sets: 5, reps: '20 reps', rest: '30s', icon: '🔥', cue: 'Hinge at the hips, snap glutes forward at peak' }
      ],
      'Day 2: Pull & Posture Builder': [
        { id: 'w-e5', name: 'Wide Grip Lat Pulldowns', muscle: 'Latissimus Dorsi', sets: 4, reps: '12-15 reps', rest: '45s', icon: '🏋️', cue: 'Pull down to upper collarbone, driving elbows toward ribs' },
        { id: 'w-e6', name: 'Chest-Supported Row', muscle: 'Rhomboids & Mid-Traps', sets: 4, reps: '12 reps', rest: '45s', icon: '⚡', cue: 'Hold peak contraction for 1 full second' },
        { id: 'w-e7', name: 'Incline Dumbbell Bicep Curls', muscle: 'Biceps Brachii', sets: 3, reps: '15 reps', rest: '45s', icon: '💪', cue: 'Supinate wrist at top of movement for peak peak' },
        { id: 'w-e8', name: 'Assault Bike / Row Ergometer Sprints', muscle: 'VO2 Max Cardio Burst', sets: 6, reps: '30s sprint / 30s rest', rest: '30s', icon: '🚴', cue: 'Max speed effort to tap into anaerobic threshold' }
      ],
      'Day 3: Quads, Glutes & Core Sculpt': [
        { id: 'w-e9', name: 'Goblet Squats with Pulse', muscle: 'Quads & Gluteus Maximus', sets: 4, reps: '15 reps', rest: '45s', icon: '🦵', cue: 'Descend to parallel, add a micro pulse at bottom before driving up' },
        { id: 'w-e10', name: 'Romanian Deadlifts (RDL)', muscle: 'Hamstrings & Glutes', sets: 4, reps: '12 reps', rest: '60s', icon: '🏋️', cue: 'Hinge hips backwards, feel deep hamstring stretch' },
        { id: 'w-e11', name: 'Bulgarian Split Squats', muscle: 'Single Leg Stability & Quads', sets: 3, reps: '12 reps per leg', rest: '45s', icon: '⚡', cue: 'Keep front shin vertical, drive through midfoot' },
        { id: 'w-e12', name: 'Hanging Leg Raises / Captains Chair', muscle: 'Lower Abdominals & Hip Flexors', sets: 4, reps: '15 reps', rest: '30s', icon: '🔥', cue: 'Tilt pelvis up to engage lower rectus abdominis' }
      ]
    };
  }

  getEctomorphMassRoutine() {
    return {
      'Day 1: Heavy Compound Chest & Back': [
        { id: 'w-m1', name: 'Barbell Flat Bench Press', muscle: 'Pectoralis Major & Triceps', sets: 5, reps: '6-8 reps (Heavy)', rest: '90s', icon: '🏋️', cue: 'Tuck shoulder blades, drive feet into floor, bar touches lower sternum' },
        { id: 'w-m2', name: 'Weighted Pull-Ups or Lat Pulls', muscle: 'Lats & Upper Back Thickness', sets: 4, reps: '6-8 reps', rest: '90s', icon: '💪', cue: 'Initiate pull with lats, drive elbows down to hips' },
        { id: 'w-m3', name: 'Incline Dumbbell Press', muscle: 'Clavicular Upper Chest', sets: 4, reps: '8-10 reps', rest: '75s', icon: '⚡', cue: 'Slow 3-second eccentric lower phase' },
        { id: 'w-m4', name: 'Heavy Barbell Bent-Over Rows', muscle: 'Lats, Rhomboids, Lower Back', sets: 4, reps: '8 reps', rest: '90s', icon: '🏋️', cue: 'Maintain flat neutral spine, pull bar into belly button' }
      ],
      'Day 2: Pure Leg Hypertrophy & Calves': [
        { id: 'w-m5', name: 'Barbell Back Squats', muscle: 'Quads, Adductors & Core', sets: 5, reps: '6-8 reps', rest: '120s', icon: '🦵', cue: 'Deep breath into belly (Valsalva), break at hips and knees together' },
        { id: 'w-m6', name: 'Leg Press (Foot Placement Mid-High)', muscle: 'Quad Sweep & Glute Mass', sets: 4, reps: '10-12 reps', rest: '90s', icon: '⚡', cue: 'Do not lock out knees at top to maintain continuous muscle tension' },
        { id: 'w-m7', name: 'Lying Hamstring Leg Curls', muscle: 'Biceps Femoris', sets: 4, reps: '10-12 reps', rest: '60s', icon: '💪', cue: 'Control the descent for 3 seconds' },
        { id: 'w-m8', name: 'Standing Heavy Calf Raises', muscle: 'Gastrocnemius', sets: 4, reps: '15 reps', rest: '45s', icon: '🦶', cue: 'Full stretch at bottom, 2-second hold at peak contraction' }
      ],
      'Day 3: Boulder Shoulders & Arms': [
        { id: 'w-m9', name: 'Seated Dumbbell Shoulder Press', muscle: 'Anterior & Medial Delts', sets: 4, reps: '8-10 reps', rest: '90s', icon: '🏋️', cue: 'Keep elbows slightly in front of shoulders' },
        { id: 'w-m10', name: 'Cable Lateral Raises', muscle: 'Lateral Deltoids (Cap Width)', sets: 4, reps: '12-15 reps', rest: '45s', icon: '⚡', cue: 'Raise out to the side, slight internal rotation' },
        { id: 'w-m11', name: 'Barbell Bicep Curls (Strict)', muscle: 'Biceps Peak', sets: 4, reps: '10 reps', rest: '60s', icon: '💪', cue: 'No swinging, keep elbows pinned to ribcage' },
        { id: 'w-m12', name: 'Overhead Cable Triceps Extensions', muscle: 'Long Head of Triceps', sets: 4, reps: '12 reps', rest: '60s', icon: '🔥', cue: 'Feel deep stretch in triceps behind head' }
      ]
    };
  }

  getDefaultRoutines() {
    return {
      'Day 1: Upper Body Sculpt & Definition': [
        { id: 'w-d1', name: 'Incline Dumbbell Bench Press', muscle: 'Upper Chest & Front Delts', sets: 4, reps: '10-12 reps', rest: '60s', icon: '🏋️', cue: 'Lower dumbbells smoothly, press up along natural natural arc' },
        { id: 'w-d2', name: 'Single-Arm Dumbbell Rows', muscle: 'Latissimus Dorsi & Rhomboids', sets: 4, reps: '10-12 reps/arm', rest: '60s', icon: '⚡', cue: 'Pull dumbbell towards hip, avoid twisting torso' },
        { id: 'w-d3', name: 'Dumbbell Lateral Raises', muscle: 'Medial Deltoid (Shoulder Width)', sets: 4, reps: '12-15 reps', rest: '45s', icon: '💪', cue: 'Lead with elbows, pause 0.5s at shoulder height' },
        { id: 'w-d4', name: 'Cable Triceps Rope Pushdown', muscle: 'Triceps Lateral & Medial Heads', sets: 3, reps: '15 reps', rest: '45s', icon: '🔥', cue: 'Flay rope apart at bottom for peak contraction' }
      ],
      'Day 2: Lower Body Power & Glute Firming': [
        { id: 'w-d5', name: 'Barbell / Dumbbell Romanian Deadlifts', muscle: 'Hamstrings & Gluteus Maximus', sets: 4, reps: '10 reps', rest: '75s', icon: '🏋️', cue: 'Push hips straight back, keep weight on midfoot and heels' },
        { id: 'w-d6', name: 'Barbell / Dumbbell Goblet Squats', muscle: 'Quads & Core Stability', sets: 4, reps: '12 reps', rest: '60s', icon: '🦵', cue: 'Chest high, knees track in line with toes' },
        { id: 'w-d7', name: 'Walking Lunges with Dumbbells', muscle: 'Glutes, Quads & Hamstrings', sets: 3, reps: '20 total steps', rest: '60s', icon: '⚡', cue: 'Keep steps long to optimize glute activation' },
        { id: 'w-d8', name: 'Glute Hip Thrusts', muscle: 'Gluteus Maximus Focus', sets: 4, reps: '12 reps', rest: '60s', icon: '🍑', cue: 'Drive through heels, squeeze glutes hard at horizontal lockout' }
      ],
      'Day 3: Core, HIIT & Functional Agility': [
        { id: 'w-d9', name: 'Hanging Knee/Leg Raises', muscle: 'Lower Rectus Abdominis', sets: 4, reps: '15 reps', rest: '45s', icon: '🔥', cue: 'Curl pelvis up, control the descent without swinging' },
        { id: 'w-d10', name: 'Plank with Shoulder Taps', muscle: 'Transverse Abdominis & Shoulder Stability', sets: 3, reps: '20 taps', rest: '45s', icon: '⚡', cue: 'Keep hips completely still, avoid swaying side to side' },
        { id: 'w-d11', name: 'Mountain Climbers', muscle: 'Cardio Core Burner', sets: 3, reps: '40 seconds', rest: '30s', icon: '🏃', cue: 'Drive knees rapidly toward chest with flat back' },
        { id: 'w-d12', name: 'Jump Rope or High Knees Intervals', muscle: 'Cardiovascular Conditioning', sets: 5, reps: '45s on / 15s off', rest: '30s', icon: '⚡', cue: 'Stay light on the balls of your feet' }
      ]
    };
  }

  setActiveDay(day) {
    this.activeDay = day;
    this.render();
  }

  // Open exercise detail & tips modal
  viewExerciseDetails(exerciseId) {
    const list = this.routines[this.activeDay] || [];
    const ex = list.find(e => e.id === exerciseId);
    if (!ex) return;

    const modal = document.getElementById('exerciseModal');
    if (!modal) return;

    document.getElementById('exerciseModalTitle').textContent = ex.name;
    document.getElementById('exerciseModalMuscle').textContent = `Target: ${ex.muscle}`;
    document.getElementById('exerciseModalSets').textContent = `${ex.sets} Sets`;
    document.getElementById('exerciseModalReps').textContent = ex.reps;
    document.getElementById('exerciseModalRest').textContent = `${ex.rest} Rest`;
    document.getElementById('exerciseModalCue').textContent = ex.cue;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
  }

  closeExerciseModal() {
    const modal = document.getElementById('exerciseModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
  }

  render() {
    const container = document.getElementById('workoutExercisesContainer');
    if (!container) return;

    // Render day selector tabs
    const daysContainer = document.getElementById('workoutDayTabs');
    if (daysContainer) {
      daysContainer.innerHTML = Object.keys(this.routines).map(day => {
        const isActive = day === this.activeDay;
        return `
          <button onclick="window.workoutArena.setActiveDay('${day}')" 
                  class="px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${isActive ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20' : 'bg-slate-900/60 text-slate-300 hover:bg-slate-800 border border-slate-800'}">
            ${day}
          </button>
        `;
      }).join('');
    }

    const currentTitleEl = document.getElementById('activeDayTitle');
    if (currentTitleEl) currentTitleEl.textContent = this.activeDay;

    const exercises = this.routines[this.activeDay] || [];
    container.innerHTML = exercises.map(ex => {
      // Build set checkboxes
      const setButtons = [];
      for (let s = 1; s <= ex.sets; s++) {
        const completed = this.isSetCompleted(ex.id, s);
        setButtons.push(`
          <button onclick="window.workoutArena.toggleSet('${ex.id}', ${s})" 
                  class="px-2.5 py-1 rounded-lg text-xs font-mono font-semibold transition-all border ${completed ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold' : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:border-emerald-500/50'}">
            Set ${s} ${completed ? '✓' : ''}
          </button>
        `);
      }

      return `
        <div class="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition-all shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div class="flex items-start gap-4">
            <div class="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl bg-slate-800/80 border border-slate-700/60 shrink-0">
              ${ex.icon || '🏋️'}
            </div>
            <div>
              <div class="flex items-center gap-2 flex-wrap">
                <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2.5 py-0.5 rounded-full border border-cyan-500/20">
                  ${ex.muscle}
                </span>
                <span class="text-xs text-slate-400">Rest: ${ex.rest}</span>
              </div>
              <h3 class="text-base font-bold text-white mt-1 cursor-pointer hover:text-emerald-400 transition-colors" onclick="window.workoutArena.viewExerciseDetails('${ex.id}')">
                ${ex.name}
              </h3>
              <p class="text-xs text-slate-400 mt-1 italic flex items-center gap-1">
                <span>💡 Form tip:</span>
                <span>"${ex.cue}"</span>
              </p>
              
              <!-- Set Progress Tracker -->
              <div class="flex items-center gap-2 mt-3 flex-wrap">
                <span class="text-xs font-semibold text-slate-400 mr-1">Log Sets:</span>
                ${setButtons.join('')}
              </div>
            </div>
          </div>

          <div class="flex items-center gap-2.5 shrink-0 self-end md:self-center">
            <!-- Rest Timer Trigger -->
            <button onclick="window.workoutArena.startRestTimer(parseInt('${ex.rest}') || 60)" class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-cyan-300 transition-colors border border-slate-700 flex items-center gap-1.5">
              ⏱ Rest Timer (${ex.rest})
            </button>
            <!-- Guide -->
            <button onclick="window.workoutArena.viewExerciseDetails('${ex.id}')" class="px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-xs font-medium text-slate-200 transition-colors border border-slate-700">
              ℹ Guide
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.workoutArena = new WorkoutArena();
