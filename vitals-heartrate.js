/**
 * PulseFit Heart Rate & Vitals Monitor
 * Features:
 * - Real-time animated Electrocardiogram (EKG) Canvas synced to BPM
 * - Synchronized Audio Heartbeat ("lub-dub")
 * - Tap-to-Beat Pulse detector (rolling RR intervals)
 * - Heart Rate Zone Calculator (Tanaka / Karvonen formulas)
 * - Blood Pressure, SpO2 & HRV Vitals Tracker
 * - Vitals History Graph using Chart.js
 */

class VitalsMonitor {
  constructor() {
    this.bpm = 72;
    this.userAge = 25;
    this.restingBpm = 65;
    this.soundEnabled = false;
    this.isMeasuring = false;
    this.tapTimes = [];
    this.tapTimeout = null;
    this.canvas = null;
    this.ctx = null;
    this.animId = null;
    this.chart = null;

    // EKG waveform variables
    this.x = 0;
    this.points = [];
    this.phase = 0;
    this.lastBeatTime = 0;

    this.history = this.loadHistory();
  }

  init() {
    this.canvas = document.getElementById('ekgCanvas');
    if (this.canvas) {
      this.ctx = this.canvas.getContext('2d');
      this.resizeCanvas();
      window.addEventListener('resize', () => this.resizeCanvas());
      this.startEkgLoop();
    }
    this.updateZones();
    this.initHistoryChart();
    this.renderHistoryList();
  }

  resizeCanvas() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = 140;
    this.points = [];
  }

  setBpm(newBpm) {
    this.bpm = Math.max(40, Math.min(220, Math.round(newBpm)));
    
    // Update all BPM displays
    const bpmDisplays = document.querySelectorAll('.current-bpm-val');
    bpmDisplays.forEach(el => el.textContent = this.bpm);

    const bpmSlider = document.getElementById('bpmSlider');
    if (bpmSlider) bpmSlider.value = this.bpm;

    // Pulsing heart animation speed
    const heartIcon = document.getElementById('animatedHeartIcon');
    if (heartIcon) {
      const beatDurationSec = 60 / this.bpm;
      heartIcon.style.animationDuration = `${beatDurationSec}s`;
    }

    this.updateZones();
    if (window.updateDashboardVitals) {
      window.updateDashboardVitals(this.bpm);
    }
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    const btn = document.getElementById('toggleHeartSoundBtn');
    if (btn) {
      btn.innerHTML = this.soundEnabled 
        ? `<span class="text-rose-400">🔊 Heart Audio ON</span>` 
        : `<span class="text-slate-400">🔇 Heart Audio OFF</span>`;
    }
  }

  // Tap-to-Beat Detector
  handleTapBeat() {
    const now = performance.now();
    this.tapTimes.push(now);

    // Keep only last 8 taps
    if (this.tapTimes.length > 8) {
      this.tapTimes.shift();
    }

    // Play tactile sound & haptic feel
    if (window.soundFx) {
      window.soundFx.playTick();
    }

    const tapBtn = document.getElementById('tapPulseBtn');
    if (tapBtn) {
      tapBtn.classList.add('scale-95', 'bg-rose-500/30');
      setTimeout(() => tapBtn.classList.remove('scale-95', 'bg-rose-500/30'), 120);
    }

    clearTimeout(this.tapTimeout);
    this.tapTimeout = setTimeout(() => {
      this.tapTimes = [];
      const statusEl = document.getElementById('tapPulseStatus');
      if (statusEl) statusEl.textContent = 'Tap button rhythmically along with your pulse';
    }, 3000);

    const statusEl = document.getElementById('tapPulseStatus');
    if (this.tapTimes.length < 2) {
      if (statusEl) statusEl.textContent = 'Keep tapping to measure BPM... (1 beat logged)';
      return;
    }

    // Calculate average interval between consecutive taps
    let intervals = [];
    for (let i = 1; i < this.tapTimes.length; i++) {
      intervals.push(this.tapTimes[i] - this.tapTimes[i - 1]);
    }
    const avgIntervalMs = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const calculatedBpm = Math.round(60000 / avgIntervalMs);

    if (calculatedBpm >= 40 && calculatedBpm <= 210) {
      this.setBpm(calculatedBpm);
      if (statusEl) {
        statusEl.innerHTML = `<span class="text-emerald-400 font-semibold">Detected: ${calculatedBpm} BPM</span> (${this.tapTimes.length} beats analyzed)`;
      }
    }
  }

  // Camera / Sensor Optical Pulse Scan Simulation
  startSensorScan() {
    const scanModal = document.getElementById('opticalScanModal');
    if (scanModal) {
      scanModal.classList.remove('hidden');
      scanModal.classList.add('flex');
    }

    const progressBar = document.getElementById('scanProgressBar');
    const scanStatus = document.getElementById('scanStatusText');
    let progress = 0;

    const interval = setInterval(() => {
      progress += 4;
      if (progressBar) progressBar.style.width = `${progress}%`;
      
      if (progress < 30) {
        if (scanStatus) scanStatus.textContent = 'Calibrating optical sensor & skin tone luminance...';
      } else if (progress < 70) {
        if (scanStatus) scanStatus.textContent = 'Detecting subcutaneous micro-capillary pulse waves...';
      } else if (progress < 95) {
        if (scanStatus) scanStatus.textContent = 'Filtering noise & computing heart rate variability (HRV)...';
      } else {
        clearInterval(interval);
        if (scanStatus) scanStatus.textContent = 'Measurement complete!';
        
        // Slight physiological variance around 70-78
        const simulatedBpm = Math.floor(68 + Math.random() * 12);
        this.setBpm(simulatedBpm);
        this.logVitals({
          bpm: simulatedBpm,
          type: 'Optical Sensor Scan',
          spo2: Math.floor(97 + Math.random() * 3),
          bp: '118/78'
        });

        setTimeout(() => {
          if (scanModal) {
            scanModal.classList.add('hidden');
            scanModal.classList.remove('flex');
          }
          if (window.showToast) {
            window.showToast(`Scan complete: ${simulatedBpm} BPM, 99% SpO2 (Optimal)`);
          }
        }, 800);
      }
    }, 120);
  }

  closeSensorModal() {
    const scanModal = document.getElementById('opticalScanModal');
    if (scanModal) {
      scanModal.classList.add('hidden');
      scanModal.classList.remove('flex');
    }
  }

  // Realistic EKG waveform generator
  startEkgLoop() {
    let lastTime = performance.now();

    const loop = (currentTime) => {
      const dt = (currentTime - lastTime) / 1000;
      lastTime = currentTime;

      this.drawEkgFrame(currentTime);
      this.animId = requestAnimationFrame(loop);
    };

    this.animId = requestAnimationFrame(loop);
  }

  drawEkgFrame(time) {
    if (!this.ctx || !this.canvas) return;
    const width = this.canvas.width;
    const height = this.canvas.height;
    const midY = height / 2;

    // Time period for 1 beat in seconds
    const beatPeriod = 60 / this.bpm;
    const timeSinceLastBeat = (time - this.lastBeatTime) / 1000;

    // Check if beat triggered
    if (timeSinceLastBeat >= beatPeriod) {
      this.lastBeatTime = time;
      if (this.soundEnabled && window.soundFx) {
        window.soundFx.playHeartbeat();
      }
    }

    // Normalized phase within the current heartbeat cycle [0, 1]
    const currentPhase = (timeSinceLastBeat % beatPeriod) / beatPeriod;

    // Calculate EKG voltage offset based on classic P-Q-R-S-T wave model
    let waveY = 0;
    if (currentPhase > 0.08 && currentPhase < 0.18) {
      // P wave (atrial depolarization)
      const pPhase = (currentPhase - 0.08) / 0.10;
      waveY = -12 * Math.sin(pPhase * Math.PI);
    } else if (currentPhase >= 0.20 && currentPhase < 0.23) {
      // Q wave (septal depolarization)
      const qPhase = (currentPhase - 0.20) / 0.03;
      waveY = 8 * Math.sin(qPhase * Math.PI);
    } else if (currentPhase >= 0.23 && currentPhase < 0.29) {
      // R peak (ventricular depolarization - sharp tall peak)
      const rPhase = (currentPhase - 0.23) / 0.06;
      waveY = -56 * Math.sin(rPhase * Math.PI);
    } else if (currentPhase >= 0.29 && currentPhase < 0.33) {
      // S wave
      const sPhase = (currentPhase - 0.29) / 0.04;
      waveY = 16 * Math.sin(sPhase * Math.PI);
    } else if (currentPhase >= 0.42 && currentPhase < 0.62) {
      // T wave (ventricular repolarization)
      const tPhase = (currentPhase - 0.42) / 0.20;
      waveY = -18 * Math.sin(tPhase * Math.PI);
    } else {
      // Baseline with tiny physiological noise
      waveY = (Math.random() - 0.5) * 1.5;
    }

    // Scroll wave points to left
    this.points.push(midY + waveY);
    if (this.points.length > width) {
      this.points.shift();
    }

    // Clear Canvas with subtle fade for oscilloscope persistence
    this.ctx.fillStyle = '#0a0f1d';
    this.ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.08)';
    this.ctx.lineWidth = 1;
    this.ctx.beginPath();
    for (let x = 0; x < width; x += 25) {
      this.ctx.moveTo(x, 0);
      this.ctx.lineTo(x, height);
    }
    for (let y = 0; y < height; y += 25) {
      this.ctx.moveTo(0, y);
      this.ctx.lineTo(width, y);
    }
    this.ctx.stroke();

    // Draw EKG glow wave
    if (this.points.length > 1) {
      // Outer glow line
      this.ctx.beginPath();
      this.ctx.strokeStyle = 'rgba(16, 185, 129, 0.35)';
      this.ctx.lineWidth = 4;
      this.ctx.lineJoin = 'round';
      for (let i = 0; i < this.points.length; i++) {
        if (i === 0) this.ctx.moveTo(i, this.points[i]);
        else this.ctx.lineTo(i, this.points[i]);
      }
      this.ctx.stroke();

      // Sharp central neon line
      this.ctx.beginPath();
      this.ctx.strokeStyle = '#10b981';
      this.ctx.lineWidth = 2;
      for (let i = 0; i < this.points.length; i++) {
        if (i === 0) this.ctx.moveTo(i, this.points[i]);
        else this.ctx.lineTo(i, this.points[i]);
      }
      this.ctx.stroke();

      // Leading beam point
      const lastX = this.points.length - 1;
      const lastY = this.points[lastX];
      this.ctx.beginPath();
      this.ctx.arc(lastX, lastY, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = '#34d399';
      this.ctx.shadowColor = '#10b981';
      this.ctx.shadowBlur = 12;
      this.ctx.fill();
      this.ctx.shadowBlur = 0;
    }
  }

  // Calculate Tanaka Max HR and 5 Training Zones
  updateZones() {
    const maxHr = Math.round(208 - (0.7 * this.userAge));
    const maxHrEl = document.getElementById('maxHrDisplay');
    if (maxHrEl) maxHrEl.textContent = `${maxHr} BPM`;

    const currentBpm = this.bpm;
    const currentPercent = Math.round((currentBpm / maxHr) * 100);

    const percentEl = document.getElementById('bpmMaxPercentDisplay');
    if (percentEl) percentEl.textContent = `${currentPercent}% of Max HR`;

    // Zones ranges:
    // Z1: 50 - 60%
    // Z2: 60 - 70% (Fat burn)
    // Z3: 70 - 80% (Cardio)
    // Z4: 80 - 90% (Anaerobic)
    // Z5: 90 - 100% (Peak)
    const zones = [
      { id: 1, name: 'Zone 1: Active Recovery', min: 0.50, max: 0.60, color: 'text-cyan-400', desc: 'Promotes muscle repair & warm-up' },
      { id: 2, name: 'Zone 2: Fat Burning Engine', min: 0.60, max: 0.70, color: 'text-emerald-400', desc: 'Max lipid oxidation & endurance base' },
      { id: 3, name: 'Zone 3: Aerobic Capacity', min: 0.70, max: 0.80, color: 'text-amber-400', desc: 'Cardiovascular efficiency & stamina' },
      { id: 4, name: 'Zone 4: Anaerobic Threshold', min: 0.80, max: 0.90, color: 'text-orange-400', desc: 'Lactate tolerance & speed power' },
      { id: 5, name: 'Zone 5: VO2 Max Peak Burst', min: 0.90, max: 1.00, color: 'text-rose-400', desc: 'Maximum explosive effort & sprint limit' }
    ];

    let currentZone = zones[0];
    const fraction = currentBpm / maxHr;
    if (fraction >= 0.90) currentZone = zones[4];
    else if (fraction >= 0.80) currentZone = zones[3];
    else if (fraction >= 0.70) currentZone = zones[2];
    else if (fraction >= 0.60) currentZone = zones[1];
    else currentZone = zones[0];

    const currentZoneBadge = document.getElementById('currentZoneBadge');
    if (currentZoneBadge) {
      currentZoneBadge.textContent = currentZone.name;
      currentZoneBadge.className = `px-3 py-1 rounded-full text-xs font-bold border border-current ${currentZone.color} bg-slate-900/60`;
    }

    const currentZoneDesc = document.getElementById('currentZoneDesc');
    if (currentZoneDesc) currentZoneDesc.textContent = currentZone.desc;

    // Update zone list indicators
    const zoneContainer = document.getElementById('zoneBarsContainer');
    if (zoneContainer) {
      zoneContainer.innerHTML = zones.map(z => {
        const lowerBpm = Math.round(maxHr * z.min);
        const upperBpm = Math.round(maxHr * z.max);
        const isCurrent = z.id === currentZone.id;
        return `
          <div class="p-3 rounded-xl border transition-all ${isCurrent ? 'bg-slate-800/80 border-emerald-500 shadow-md shadow-emerald-500/10' : 'bg-slate-900/40 border-slate-800/60 opacity-75'}">
            <div class="flex items-center justify-between text-xs mb-1">
              <span class="font-semibold ${z.color}">${z.name}</span>
              <span class="font-mono text-slate-300">${lowerBpm} - ${upperBpm} BPM</span>
            </div>
            <div class="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div class="h-full rounded-full ${isCurrent ? 'bg-emerald-400 animate-pulse' : 'bg-slate-700'}" style="width: ${z.max * 100}%"></div>
            </div>
            <p class="text-[11px] text-slate-400 mt-1">${z.desc}</p>
          </div>
        `;
      }).join('');
    }
  }

  // Load / Save History
  loadHistory() {
    const saved = localStorage.getItem('pulsefit_vitals_history');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error('Error loading history:', e);
      }
    }
    return [
      { time: '08:30 AM', bpm: 64, type: 'Resting Baseline', spo2: 99, bp: '116/76' },
      { time: '11:15 AM', bpm: 72, type: 'Work / Sitting', spo2: 98, bp: '118/78' },
      { time: '01:45 PM', bpm: 78, type: 'Post-Lunch Digestion', spo2: 98, bp: '120/80' },
      { time: '06:30 PM', bpm: 142, type: 'Workout HIIT Peak', spo2: 97, bp: '135/85' },
      { time: '07:45 PM', bpm: 82, type: 'Post-Workout Recovery', spo2: 99, bp: '118/77' }
    ];
  }

  logVitals(entry) {
    const now = new Date();
    const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newEntry = {
      time: timeStr,
      bpm: entry.bpm || this.bpm,
      type: entry.type || 'Manual Check',
      spo2: entry.spo2 || 98,
      bp: entry.bp || '120/80'
    };
    this.history.push(newEntry);
    localStorage.setItem('pulsefit_vitals_history', JSON.stringify(this.history));
    this.renderHistoryList();
    this.updateHistoryChart();
  }

  renderHistoryList() {
    const list = document.getElementById('vitalsLogList');
    if (!list) return;

    list.innerHTML = this.history.slice(-6).reverse().map(item => `
      <div class="flex items-center justify-between p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs">
        <div class="flex items-center gap-3">
          <div class="w-8 h-8 rounded-lg bg-rose-500/10 text-rose-400 flex items-center justify-center font-bold">
            ❤️
          </div>
          <div>
            <div class="flex items-center gap-2">
              <span class="font-bold text-white text-sm">${item.bpm} BPM</span>
              <span class="text-slate-400">${item.type}</span>
            </div>
            <div class="text-[11px] text-slate-500 flex gap-2">
              <span>BP: ${item.bp}</span>
              <span>•</span>
              <span>SpO2: ${item.spo2}%</span>
            </div>
          </div>
        </div>
        <span class="font-mono text-slate-400">${item.time}</span>
      </div>
    `).join('');
  }

  initHistoryChart() {
    const canvas = document.getElementById('vitalsTrendChart');
    if (!canvas || !window.Chart) return;

    const labels = this.history.map(h => h.time);
    const data = this.history.map(h => h.bpm);

    this.chart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: labels,
        datasets: [{
          label: 'Heart Rate (BPM)',
          data: data,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.35,
          pointBackgroundColor: '#10b981',
          pointBorderColor: '#fff',
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => `${ctx.raw} BPM`
            }
          }
        },
        scales: {
          x: {
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          },
          y: {
            min: 50,
            max: 180,
            grid: { color: 'rgba(255,255,255,0.05)' },
            ticks: { color: '#94a3b8', font: { size: 10 } }
          }
        }
      }
    });
  }

  updateHistoryChart() {
    if (!this.chart) {
      this.initHistoryChart();
      return;
    }
    this.chart.data.labels = this.history.map(h => h.time);
    this.chart.data.datasets[0].data = this.history.map(h => h.bpm);
    this.chart.update();
  }
}

window.vitalsMonitor = new VitalsMonitor();
