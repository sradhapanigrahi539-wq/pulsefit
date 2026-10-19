/**
 * PulseFit Alarm & Smart Schedule Manager
 * Handles meal alarms, workout alerts, hydration reminders, audio chimes & notifications.
 */

class AlarmManager {
  constructor() {
    this.alarms = this.loadAlarms();
    this.activeAlarmModal = null;
    this.audioInterval = null;
    this.triggeredToday = new Set();
    this.lastMinuteChecked = -1;

    this.initTimer();
    this.requestNotificationPermission();
  }

  loadAlarms() {
    const saved = localStorage.getItem('pulsefit_alarms');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading alarms:', e);
      }
    }
    // Default initial alarms
    return [
      { id: 'alm-1', title: 'Power Breakfast', time: '08:00', category: 'meal', icon: '🍳', enabled: true, sound: 'chime', days: [1,2,3,4,5,6,0] },
      { id: 'alm-2', title: 'Hydration Boost (500ml)', time: '11:00', category: 'water', icon: '💧', enabled: true, sound: 'beep', days: [1,2,3,4,5,6,0] },
      { id: 'alm-3', title: 'Macro Balanced Lunch', time: '13:00', category: 'meal', icon: '🥗', enabled: true, sound: 'chime', days: [1,2,3,4,5,6,0] },
      { id: 'alm-4', title: 'Pre-Workout Fuel Snack', time: '17:00', category: 'meal', icon: '⚡', enabled: true, sound: 'chime', days: [1,2,3,4,5,6,0] },
      { id: 'alm-5', title: 'Target Workout Session', time: '18:00', category: 'workout', icon: '🏋️', enabled: true, sound: 'bell', days: [1,2,3,4,5,6,0] },
      { id: 'alm-6', title: 'Post-Workout Protein Shake', time: '19:15', category: 'meal', icon: '🥤', enabled: true, sound: 'energy', days: [1,2,3,4,5,6,0] },
      { id: 'alm-7', title: 'Lean Recovery Dinner', time: '20:30', category: 'meal', icon: '🍲', enabled: true, sound: 'chime', days: [1,2,3,4,5,6,0] },
      { id: 'alm-8', title: 'Sleep & Muscle Recovery', time: '22:45', category: 'sleep', icon: '😴', enabled: true, sound: 'chime', days: [1,2,3,4,5,6,0] }
    ];
  }

  saveAlarms() {
    localStorage.setItem('pulsefit_alarms', JSON.stringify(this.alarms));
    this.render();
    if (window.updateDashboardNextAlarm) {
      window.updateDashboardNextAlarm();
    }
  }

  requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }

  initTimer() {
    // Check every second for trigger
    setInterval(() => {
      this.checkAlarms();
    }, 1000);
  }

  checkAlarms() {
    const now = new Date();
    const currentHour = String(now.getHours()).padStart(2, '0');
    const currentMin = String(now.getMinutes()).padStart(2, '0');
    const currentTimeStr = `${currentHour}:${currentMin}`;
    const currentDay = now.getDay();
    const minuteKey = `${now.toDateString()}_${currentTimeStr}`;

    // Avoid double triggering in the same minute
    if (this.lastMinuteChecked === minuteKey) return;

    this.alarms.forEach(alarm => {
      if (!alarm.enabled) return;
      if (alarm.days && !alarm.days.includes(currentDay)) return;

      if (alarm.time === currentTimeStr && !this.triggeredToday.has(`${alarm.id}_${minuteKey}`)) {
        this.triggeredToday.add(`${alarm.id}_${minuteKey}`);
        this.lastMinuteChecked = minuteKey;
        this.triggerAlarm(alarm);
      }
    });
  }

  triggerAlarm(alarm) {
    // Play sound immediately
    if (window.soundFx) {
      window.soundFx.playAlarm(alarm.sound || 'chime');
      // Repeat sound every 4 seconds until dismissed
      if (this.audioInterval) clearInterval(this.audioInterval);
      this.audioInterval = setInterval(() => {
        window.soundFx.playAlarm(alarm.sound || 'chime');
      }, 4000);
    }

    // Trigger Web Notification
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`PulseFit Reminder: ${alarm.title}`, {
        body: `Time for your ${alarm.category.toUpperCase()} routine! Stay on track to reach your goal body.`,
        icon: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png'
      });
    }

    // Show Alarm Modal
    this.showAlarmModal(alarm);
  }

  showAlarmModal(alarm) {
    const modal = document.getElementById('alarmTriggerModal');
    if (!modal) return;

    document.getElementById('alarmModalIcon').textContent = alarm.icon || '⏰';
    document.getElementById('alarmModalTitle').textContent = alarm.title;
    document.getElementById('alarmModalTime').textContent = alarm.time;
    document.getElementById('alarmModalCategory').textContent = (alarm.category || 'reminder').toUpperCase();
    
    let advice = 'Stick to your schedule to maximize metabolic efficiency and muscle recovery.';
    if (alarm.category === 'meal') advice = 'Fuel your body with your recommended macros and stay hydrated!';
    if (alarm.category === 'workout') advice = 'Hydrate, warm up your joints, and execute your sets with great form!';
    if (alarm.category === 'water') advice = 'Drink 300-500ml water now to boost circulation and metabolic rate.';
    if (alarm.category === 'sleep') advice = 'Dim the lights, avoid blue light, and give your body optimal recovery.';
    document.getElementById('alarmModalAdvice').textContent = advice;

    modal.classList.remove('hidden');
    modal.classList.add('flex');
    this.activeAlarmModal = alarm;
  }

  dismissActiveAlarm() {
    if (this.audioInterval) {
      clearInterval(this.audioInterval);
      this.audioInterval = null;
    }
    const modal = document.getElementById('alarmTriggerModal');
    if (modal) {
      modal.classList.add('hidden');
      modal.classList.remove('flex');
    }
    this.activeAlarmModal = null;
  }

  snoozeActiveAlarm(minutes = 5) {
    this.dismissActiveAlarm();
    const now = new Date();
    now.setMinutes(now.getMinutes() + minutes);
    const snoozeTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    
    const snoozedAlarm = {
      id: 'snooze-' + Date.now(),
      title: `[Snoozed ${minutes}m] ${this.activeAlarmModal ? this.activeAlarmModal.title : 'Reminder'}`,
      time: snoozeTime,
      category: this.activeAlarmModal ? this.activeAlarmModal.category : 'custom',
      icon: '⏳',
      enabled: true,
      sound: 'beep',
      days: [0,1,2,3,4,5,6]
    };
    this.alarms.push(snoozedAlarm);
    this.saveAlarms();
    
    // Quick notification toast
    if (window.showToast) {
      window.showToast(`Alarm snoozed for ${minutes} minutes (will ring at ${snoozeTime})`);
    }
  }

  toggleAlarm(id) {
    const alarm = this.alarms.find(a => a.id === id);
    if (alarm) {
      alarm.enabled = !alarm.enabled;
      this.saveAlarms();
    }
  }

  deleteAlarm(id) {
    this.alarms = this.alarms.filter(a => a.id !== id);
    this.saveAlarms();
  }

  addAlarm(alarmData) {
    const newAlarm = {
      id: 'alm-' + Date.now(),
      title: alarmData.title || 'Fitness Reminder',
      time: alarmData.time || '12:00',
      category: alarmData.category || 'meal',
      icon: alarmData.icon || this.getIconForCategory(alarmData.category),
      enabled: true,
      sound: alarmData.sound || 'chime',
      days: alarmData.days || [0,1,2,3,4,5,6]
    };
    this.alarms.push(newAlarm);
    // Sort alarms by time
    this.alarms.sort((a, b) => a.time.localeCompare(b.time));
    this.saveAlarms();
    if (window.showToast) {
      window.showToast(`Alarm "${newAlarm.title}" set for ${newAlarm.time}!`);
    }
  }

  getIconForCategory(cat) {
    switch (cat) {
      case 'meal': return '🥗';
      case 'workout': return '🏋️';
      case 'water': return '💧';
      case 'supplement': return '💊';
      case 'sleep': return '😴';
      default: return '⏰';
    }
  }

  // Auto-sync alarms when AI coach recommends a schedule
  syncWithRecommendations(schedule) {
    if (!schedule || !schedule.length) return;
    
    // Keep custom alarms, replace default generated ones
    const customAlarms = this.alarms.filter(a => a.id.startsWith('custom-'));
    const newAlarms = schedule.map((item, idx) => ({
      id: 'ai-alm-' + idx,
      title: item.title,
      time: item.time,
      category: item.category || 'meal',
      icon: item.icon || this.getIconForCategory(item.category),
      enabled: true,
      sound: item.category === 'workout' ? 'bell' : 'chime',
      days: [0,1,2,3,4,5,6]
    }));

    this.alarms = [...newAlarms, ...customAlarms].sort((a, b) => a.time.localeCompare(b.time));
    this.saveAlarms();
  }

  getNextAlarm() {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const enabledAlarms = this.alarms.filter(a => a.enabled);
    if (!enabledAlarms.length) return null;

    let closest = null;
    let minDiff = Infinity;

    enabledAlarms.forEach(alarm => {
      const [h, m] = alarm.time.split(':').map(Number);
      let alarmMins = h * 60 + m;
      let diff = alarmMins - currentMins;
      if (diff <= 0) diff += 24 * 60; // next day
      if (diff < minDiff) {
        minDiff = diff;
        closest = { ...alarm, diffMinutes: diff };
      }
    });

    return closest;
  }

  render() {
    const container = document.getElementById('alarmsListContainer');
    if (!container) return;

    if (this.alarms.length === 0) {
      container.innerHTML = `
        <div class="text-center py-12 text-slate-400">
          <p class="text-3xl mb-2">⏰</p>
          <p class="font-medium text-lg text-slate-200">No alarms configured</p>
          <p class="text-sm">Click "+ Add Alarm" or let the AI Coach build your daily rhythm.</p>
        </div>
      `;
      return;
    }

    container.innerHTML = this.alarms.map(alarm => {
      const isEnabled = alarm.enabled;
      const catColors = {
        meal: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        workout: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        water: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        sleep: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
        supplement: 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      };
      const catColor = catColors[alarm.category] || 'bg-slate-700/50 text-slate-300 border-slate-600/40';

      return `
        <div class="flex items-center justify-between p-4 rounded-2xl bg-slate-900/70 border border-slate-800 hover:border-slate-700 transition-all ${isEnabled ? 'shadow-lg shadow-emerald-500/5' : 'opacity-60'}">
          <div class="flex items-center gap-4">
            <div class="w-12 h-12 rounded-xl flex items-center justify-center text-2xl bg-slate-800/80 border border-slate-700/50">
              ${alarm.icon || '⏰'}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <span class="text-2xl font-bold font-mono tracking-tight text-white">${alarm.time}</span>
                <span class="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full border ${catColor}">${alarm.category}</span>
              </div>
              <h4 class="font-medium text-slate-200 text-sm mt-0.5">${alarm.title}</h4>
              <p class="text-xs text-slate-400 flex items-center gap-1.5 mt-0.5">
                <span>🔊 ${alarm.sound || 'chime'}</span>
                <span>•</span>
                <span>Daily</span>
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <!-- Test trigger button -->
            <button onclick="window.alarmManager.triggerAlarm(window.alarmManager.alarms.find(a => a.id === '${alarm.id}'))" 
                    title="Test Sound"
                    class="p-2 text-xs text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800/80 transition-colors">
              ▶ Test
            </button>
            <!-- Toggle switch -->
            <label class="relative inline-flex items-center cursor-pointer">
              <input type="checkbox" ${isEnabled ? 'checked' : ''} onchange="window.alarmManager.toggleAlarm('${alarm.id}')" class="sr-only peer">
              <div class="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
            </label>
            <!-- Delete -->
            <button onclick="window.alarmManager.deleteAlarm('${alarm.id}')" class="p-2 text-slate-500 hover:text-rose-400 rounded-lg hover:bg-rose-500/10 transition-colors">
              <svg xmlns="http://www.w3.org/2000/svg" class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      `;
    }).join('');
  }
}

window.alarmManager = new AlarmManager();
