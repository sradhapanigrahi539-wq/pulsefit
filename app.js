/**
 * PulseFit Main Application Orchestrator
 * Tab navigation, Water Tracker, Calorie Balance, Weight Log, and System Init.
 */

class PulseFitApp {
  constructor() {
    this.currentTab = 'dashboard';
    this.waterCurrentMl = this.loadWater();
    this.waterTargetMl = 3200;
    this.stepsCurrent = this.loadSteps();
    this.burnedCalories = this.loadBurnedCalories();
    this.weightLog = this.loadWeightLog();
  }

  init() {
    this.initTabs();
    this.updateWaterDisplay();
    this.updateStepsDisplay();
    this.updateDashboardNextAlarm();
    this.initWeightChart();

    // Welcome banner / current date
    const dateEl = document.getElementById('currentDateBadge');
    if (dateEl) {
      const options = { weekday: 'long', month: 'short', day: 'numeric' };
      dateEl.textContent = new Date().toLocaleDateString(undefined, options);
    }

    // Initialize all sub-modules
    if (window.vitalsMonitor) window.vitalsMonitor.init();
    if (window.dietPlanner) window.dietPlanner.render();
    if (window.workoutArena) window.workoutArena.render();
    if (window.alarmManager) window.alarmManager.render();
    if (window.chatCoach) window.chatCoach.render();
  }

  // Tab switching
  initTabs() {
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const target = btn.dataset.tab;
        this.switchTab(target);
      });
    });
  }

  switchTab(tabId) {
    this.currentTab = tabId;
    const views = document.querySelectorAll('.view-tab-content');
    views.forEach(v => {
      v.classList.add('hidden');
    });

    const activeView = document.getElementById(`view-${tabId}`);
    if (activeView) {
      activeView.classList.remove('hidden');
    }

    // Update active nav styling
    const tabBtns = document.querySelectorAll('.nav-tab-btn');
    tabBtns.forEach(btn => {
      if (btn.dataset.tab === tabId) {
        btn.classList.add('bg-emerald-500/15', 'text-emerald-400', 'border-emerald-500/30');
        btn.classList.remove('text-slate-400', 'hover:bg-slate-800/60');
      } else {
        btn.classList.remove('bg-emerald-500/15', 'text-emerald-400', 'border-emerald-500/30');
        btn.classList.add('text-slate-400', 'hover:bg-slate-800/60');
      }
    });

    // Special tab refreshes
    if (tabId === 'vitals' && window.vitalsMonitor) {
      window.vitalsMonitor.resizeCanvas();
    }
    if (tabId === 'chat' && window.chatCoach) {
      window.chatCoach.scrollToBottom();
    }
    if (tabId === 'alarms' && window.alarmManager) {
      window.alarmManager.render();
    }
    if (tabId === 'diet' && window.dietPlanner) {
      window.dietPlanner.render();
    }
    if (tabId === 'workout' && window.workoutArena) {
      window.workoutArena.render();
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // Water Tracker
  loadWater() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`pulsefit_water_${today}`);
    return saved ? parseInt(saved, 10) : 1000;
  }

  saveWater() {
    const today = new Date().toDateString();
    localStorage.setItem(`pulsefit_water_${today}`, this.waterCurrentMl);
    this.updateWaterDisplay();
  }

  addWater(amountMl) {
    this.waterCurrentMl += amountMl;
    if (window.soundFx) window.soundFx.playSuccess();

    if (this.waterCurrentMl >= this.waterTargetMl && (this.waterCurrentMl - amountMl) < this.waterTargetMl) {
      if (window.confetti) {
        window.confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }
      this.showToast('🎉 Hydration Goal Achieved! Peak cellular performance reached!');
    } else {
      this.showToast(`+${amountMl}ml logged. Total: ${this.waterCurrentMl}ml`);
    }

    this.saveWater();
  }

  resetWater() {
    this.waterCurrentMl = 0;
    this.saveWater();
    this.showToast('Water counter reset for today.');
  }

  updateWaterDisplay() {
    const textEl = document.getElementById('waterCurrentDisplay');
    if (textEl) textEl.textContent = `${this.waterCurrentMl} / ${this.waterTargetMl} ml`;

    const percent = Math.min(100, Math.round((this.waterCurrentMl / this.waterTargetMl) * 100));
    const percentEl = document.getElementById('waterPercentDisplay');
    if (percentEl) percentEl.textContent = `${percent}%`;

    const barEl = document.getElementById('waterProgressBar');
    if (barEl) barEl.style.width = `${percent}%`;
  }

  // Steps & Calorie Tracker
  loadSteps() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`pulsefit_steps_${today}`);
    return saved ? parseInt(saved, 10) : 6420;
  }

  loadBurnedCalories() {
    const today = new Date().toDateString();
    const saved = localStorage.getItem(`pulsefit_burned_${today}`);
    return saved ? parseInt(saved, 10) : 480;
  }

  addSteps(steps) {
    this.stepsCurrent += steps;
    // Approximation: 1000 steps ≈ 40 kcal burned
    this.burnedCalories += Math.round(steps * 0.04);
    const today = new Date().toDateString();
    localStorage.setItem(`pulsefit_steps_${today}`, this.stepsCurrent);
    localStorage.setItem(`pulsefit_burned_${today}`, this.burnedCalories);
    this.updateStepsDisplay();
    this.showToast(`+${steps} steps logged! Burned approx. ${Math.round(steps * 0.04)} kcal.`);
  }

  updateStepsDisplay() {
    const stepsEl = document.getElementById('dashboardStepsDisplay');
    if (stepsEl) stepsEl.textContent = this.stepsCurrent.toLocaleString();

    const burnedEl = document.getElementById('dashboardBurnedCalsDisplay');
    if (burnedEl) burnedEl.textContent = `${this.burnedCalories} kcal`;

    const distanceKm = (this.stepsCurrent * 0.00078).toFixed(1);
    const distEl = document.getElementById('dashboardDistanceDisplay');
    if (distEl) distEl.textContent = `${distanceKm} km`;
  }

  // Dashboard Next Alarm preview
  updateDashboardNextAlarm() {
    const nextAlarm = window.alarmManager ? window.alarmManager.getNextAlarm() : null;
    const badge = document.getElementById('dashboardNextAlarmBadge');
    if (!badge) return;

    if (nextAlarm) {
      const hours = Math.floor(nextAlarm.diffMinutes / 60);
      const mins = nextAlarm.diffMinutes % 60;
      let timeText = '';
      if (hours > 0) timeText += `${hours}h `;
      timeText += `${mins}m`;

      badge.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center text-xl font-bold border border-amber-500/20">
            ${nextAlarm.icon || '⏰'}
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-white text-base">${nextAlarm.time}</span>
              <span class="text-[10px] uppercase font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">${nextAlarm.category}</span>
            </div>
            <p class="text-xs text-slate-400 mt-0.5">${nextAlarm.title} (in ${timeText})</p>
          </div>
        </div>
        <button onclick="window.switchTab('alarms')" class="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 border border-slate-700 transition-colors">
          Manage
        </button>
      `;
    } else {
      badge.innerHTML = `
        <div class="flex items-center gap-2 text-slate-400 text-xs">
          <span>⏰</span>
          <span>No upcoming alarms today</span>
        </div>
        <button onclick="window.switchTab('alarms')" class="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs font-semibold border border-emerald-500/30">
          + Add Alarm
        </button>
      `;
    }
  }

  // Weight Log & Chart
  loadWeightLog() {
    const saved = localStorage.getItem('pulsefit_weight_log');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    return [
      { date: 'Oct 01', weight: 74.2 },
      { date: 'Oct 05', weight: 73.8 },
      { date: 'Oct 09', weight: 73.2 },
      { date: 'Oct 13', weight: 72.8 },
      { date: 'Oct 17', weight: 72.4 },
      { date: 'Oct 19', weight: 72.0 }
    ];
  }

  addWeightEntry(weightVal) {
    const w = parseFloat(weightVal);
    if (isNaN(w) || w <= 30 || w >= 250) {
      this.showToast('Please enter a valid weight in kg (30 - 250)');
      return;
    }

    const options = { month: 'short', day: 'numeric' };
    const dateStr = new Date().toLocaleDateString(undefined, options);

    this.weightLog.push({ date: dateStr, weight: w });
    localStorage.setItem('pulsefit_weight_log', JSON.stringify(this.weightLog));
    this.updateWeightChart();

    // Update user profile
    if (window.chatCoach) {
      window.chatCoach.userProfile.weight = w;
      window.chatCoach.saveProfile();
    }

    this.showToast(`Weight of ${w} kg logged! Great commitment!`);
  }

  initWeightChart() {
    const canvas = document.getElementById('weightTrendChart');
    if (!canvas || !window.Chart) return;

    this.weightChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: this.weightLog.map(d => d.date),
        datasets: [{
          label: 'Weight (kg)',
          data: this.weightLog.map(d => d.weight),
          borderColor: '#06b6d4',
          backgroundColor: 'rgba(6, 182, 212, 0.12)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#06b6d4',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          },
          y: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          }
        }
      }
    });
  }

  updateWeightChart() {
    if (!this.weightChart) {
      this.initWeightChart();
      return;
    }
    this.weightChart.data.labels = this.weightLog.map(d => d.date);
    this.weightChart.data.datasets[0].data = this.weightLog.map(d => d.weight);
    this.weightChart.update();
  }

  // Global Toast Notifications
  showToast(message) {
    const toast = document.getElementById('globalToast');
    if (!toast) return;

    document.getElementById('globalToastMessage').textContent = message;
    toast.classList.remove('translate-y-24', 'opacity-0');
    toast.classList.add('translate-y-0', 'opacity-100');

    clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('translate-y-0', 'opacity-100');
      toast.classList.add('translate-y-24', 'opacity-0');
    }, 3200);
  }
}

// Global hooks
window.pulseApp = new PulseFitApp();
window.switchTab = (tabId) => window.pulseApp.switchTab(tabId);
window.showToast = (msg) => window.pulseApp.showToast(msg);
window.updateDashboardNextAlarm = () => window.pulseApp.updateDashboardNextAlarm();

document.addEventListener('DOMContentLoaded', () => {
  window.pulseApp.init();
});
