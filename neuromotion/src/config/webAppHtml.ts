export const WEB_APP_HTML = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>NeuroMotion AI — Squat Detector</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap');

    * { margin: 0; padding: 0; box-sizing: border-box; }

    body {
      font-family: 'Inter', sans-serif;
      background: #0F0D2E;
      color: #FFF;
      min-height: 100vh;
      overflow: hidden;
    }

    .app {
      display: flex;
      flex-direction: column;
      height: 100vh;
      max-width: 1200px;
      margin: 0 auto;
      padding: 12px;
      gap: 12px;
    }

    /* Header */
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 16px;
      background: linear-gradient(135deg, #1E1B4B, #312E81);
      border-radius: 16px;
      border: 1px solid #4338CA;
    }
    .header h1 {
      font-size: 20px;
      font-weight: 800;
      background: linear-gradient(135deg, #818CF8, #C084FC);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }
    .header-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: #A5B4FC;
      background: rgba(99, 102, 241, 0.2);
      padding: 4px 12px;
      border-radius: 20px;
    }
    .header-badge .dot {
      width: 8px; height: 8px;
      border-radius: 50%;
      background: #EF4444;
      transition: background 0.3s;
    }
    .header-badge .dot.active { background: #10B981; }

    /* Main layout */
    .main {
      display: flex;
      gap: 12px;
      flex: 1;
      min-height: 0;
    }

    /* Camera section */
    .camera-section {
      flex: 1;
      position: relative;
      border-radius: 20px;
      overflow: hidden;
      background: #000;
      border: 2px solid #312E81;
    }
    #webcam {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transform: scaleX(-1);
    }
    #overlay {
      position: absolute;
      top: 0; left: 0;
      width: 100%;
      height: 100%;
      transform: scaleX(-1);
      pointer-events: none;
    }
    .cam-top-bar { top: 12px; left: 12px; right: 12px; flex-direction: row; }
    .cam-bottom-bar {
      bottom: 12px; left: 12px; right: 12px;
      flex-direction: row;
      justify-content: space-between;
      opacity: 0;
      transform: translateY(10px);
      transition: opacity 0.3s, transform 0.3s;
    }
    .cam-bottom-bar.visible { opacity: 1; transform: translateY(0); }

    .coach-overlay {
      position: absolute;
      top: 50%; left: 50%;
      transform: translate(-50%, -50%) scale(0.9);
      background: rgba(220, 38, 38, 0.95);
      color: white;
      padding: 16px 24px;
      border-radius: 12px;
      font-size: 20px;
      font-weight: 900;
      text-transform: uppercase;
      letter-spacing: 1px;
      z-index: 20;
      opacity: 0;
      transition: opacity 0.2s, transform 0.2s;
      pointer-events: none;
      box-shadow: 0 10px 25px rgba(220, 38, 38, 0.5);
    }
    .coach-overlay.visible {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1.1);
    }

    /* Camera overlays */
    .cam-top-bar {
      position: absolute;
      top: 0; left: 0; right: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 16px;
      background: linear-gradient(180deg, rgba(0,0,0,0.7), transparent);
      z-index: 2;
    }
    .live-badge {
      display: none;
      align-items: center;
      gap: 5px;
      background: rgba(239, 68, 68, 0.3);
      padding: 4px 10px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      color: #EF4444;
    }
    .live-badge.visible { display: flex; }
    .live-dot {
      width: 7px; height: 7px;
      border-radius: 50%;
      background: #EF4444;
      animation: pulse-dot 1s ease infinite;
    }
    @keyframes pulse-dot {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.3; }
    }
    .cam-exercise-name {
      font-size: 16px;
      font-weight: 700;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    .cam-fps {
      font-size: 11px;
      color: #A5B4FC;
      background: rgba(0,0,0,0.5);
      padding: 3px 8px;
      border-radius: 8px;
    }

    /* Angle overlay on camera */
    .cam-bottom-bar {
      position: absolute;
      bottom: 0; left: 0; right: 0;
      display: none;
      gap: 6px;
      padding: 10px;
      background: linear-gradient(0deg, rgba(0,0,0,0.7), transparent);
      z-index: 2;
    }
    .cam-bottom-bar.visible { display: flex; }
    .cam-stat {
      flex: 1;
      background: rgba(30, 27, 75, 0.85);
      border-radius: 12px;
      padding: 8px;
      text-align: center;
    }
    .cam-stat-label {
      font-size: 9px;
      font-weight: 700;
      color: #A5B4FC;
      letter-spacing: 1px;
      margin-bottom: 2px;
    }
    .cam-stat-value {
      font-size: 22px;
      font-weight: 800;
    }

    /* Guidance overlay */
    .guidance {
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
    }
    .guidance.hidden { display: none; }
    .guidance-box {
      background: rgba(0,0,0,0.65);
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      border: 1px solid rgba(99,102,241,0.4);
    }
    .guidance-icon { font-size: 48px; margin-bottom: 12px; }
    .guidance-title { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .guidance-text { font-size: 14px; color: #C7D2FE; line-height: 1.5; }

    /* Side panel */
    .side-panel {
      width: 280px;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    /* Stats card */
    .stats-card {
      background: linear-gradient(135deg, #1E1B4B, #312E81);
      border-radius: 16px;
      padding: 16px;
      border: 1px solid #4338CA;
    }
    .stats-row {
      display: flex;
      justify-content: space-around;
      gap: 8px;
    }
    .stat-item { text-align: center; }
    .stat-label {
      font-size: 10px;
      font-weight: 700;
      color: #818CF8;
      letter-spacing: 1px;
      margin-bottom: 4px;
    }
    .stat-value {
      font-size: 28px;
      font-weight: 900;
    }
    .stat-goal {
      font-size: 14px;
      color: #818CF8;
      font-weight: 500;
    }

    /* Angles card */
    .angles-card {
      background: #1E1B4B;
      border-radius: 14px;
      padding: 12px;
      border: 1px solid #312E81;
    }
    .angles-title {
      font-size: 10px;
      font-weight: 700;
      color: #818CF8;
      letter-spacing: 1px;
      margin-bottom: 8px;
    }
    .angles-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
    }
    .angle-item {
      background: rgba(15, 13, 46, 0.6);
      border-radius: 10px;
      padding: 8px;
      text-align: center;
    }
    .angle-value {
      font-size: 16px;
      font-weight: 700;
      color: #E0E7FF;
    }
    .angle-name {
      font-size: 9px;
      color: #818CF8;
      margin-top: 2px;
      text-transform: capitalize;
    }

    /* Rep dots */
    .rep-dots {
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      justify-content: center;
      padding: 8px 0;
    }
    .rep-dot {
      width: 14px; height: 14px;
      border-radius: 50%;
      background: #312E81;
      border: 1px solid #4338CA;
      transition: all 0.3s;
    }
    .rep-dot.good { background: #10B981; border-color: #10B981; }
    .rep-dot.warn { background: #F59E0B; border-color: #F59E0B; }

    /* Feedback */
    .feedback-card {
      background: rgba(239, 68, 68, 0.15);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 12px;
      padding: 10px;
      display: none;
    }
    .feedback-card.visible { display: block; }
    .feedback-text {
      font-size: 12px;
      color: #FCA5A5;
      text-align: center;
      font-weight: 600;
      line-height: 1.4;
    }

    /* Button */
    .action-area { margin-top: auto; }
    .btn {
      width: 100%;
      padding: 14px;
      border: none;
      border-radius: 14px;
      font-family: 'Inter', sans-serif;
      font-size: 16px;
      font-weight: 700;
      color: #FFF;
      cursor: pointer;
      transition: transform 0.15s, box-shadow 0.15s;
    }
    .btn:hover { transform: translateY(-1px); }
    .btn:active { transform: translateY(0); }
    .btn-start {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
    }
    .btn-stop {
      background: linear-gradient(135deg, #EF4444, #DC2626);
      box-shadow: 0 4px 20px rgba(239, 68, 68, 0.4);
    }
    .btn-loading {
      background: #312E81;
      cursor: wait;
    }

    /* Score colors */
    .green { color: #10B981; }
    .yellow { color: #F59E0B; }
    .red { color: #EF4444; }
    .blue { color: #3B82F6; }
    .gray { color: #6B7280; }

    /* Session complete overlay */
    .complete-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(15, 13, 46, 0.95);
      display: none;
      align-items: center;
      justify-content: center;
      z-index: 100;
    }
    .complete-overlay.visible { display: flex; }
    .complete-card {
      background: linear-gradient(135deg, #1E1B4B, #312E81);
      border-radius: 24px;
      padding: 40px;
      text-align: center;
      border: 1px solid #4338CA;
      max-width: 500px;
      width: 90%;
    }
    .complete-emoji { font-size: 56px; margin-bottom: 16px; }
    .complete-title { font-size: 24px; font-weight: 800; margin-bottom: 8px; }
    .complete-subtitle { font-size: 14px; color: #A5B4FC; margin-bottom: 24px; }
    .score-big {
      font-size: 72px;
      font-weight: 900;
      margin-bottom: 4px;
    }
    .grade-badge {
      display: inline-block;
      padding: 4px 16px;
      border-radius: 8px;
      font-size: 18px;
      font-weight: 800;
      margin-bottom: 20px;
    }
    .complete-stats {
      display: flex;
      justify-content: center;
      gap: 24px;
      margin-bottom: 24px;
    }
    .complete-stat-label { font-size: 10px; color: #818CF8; letter-spacing: 1px; }
    .complete-stat-value { font-size: 22px; font-weight: 700; }
    .btn-restart {
      background: linear-gradient(135deg, #6366F1, #8B5CF6);
      box-shadow: 0 4px 20px rgba(99, 102, 241, 0.4);
      margin-top: 8px;
    }

    /* Mobile Responsiveness */
    @media (max-width: 900px) {
      .app { padding: 6px; gap: 8px; }
      .header { padding: 6px 12px; border-radius: 12px; }
      .header h1 { font-size: 16px; }
      .main { flex-direction: column; gap: 8px; }
      .camera-section { flex: none; height: 50vh; border-radius: 16px; }
      .side-panel { width: 100%; gap: 8px; }
      .stats-card { padding: 10px; }
      .stat-value { font-size: 22px; }
      .angles-card { padding: 10px; }
      .action-area { margin-top: 4px; padding-bottom: 20px; }
      .btn { padding: 12px; }
    }
  </style>
</head>
<body>
  <div class="app">
    <!-- Header -->
    <div class="header">
      <h1>\u{1F9E0} NeuroMotion AI</h1>
      <div class="header-badge">
        <div class="dot" id="statusDot"></div>
        <span id="statusText">Loading model...</span>
      </div>
    </div>

    <!-- Main -->
    <div class="main">
      <!-- Camera -->
      <div class="camera-section" id="webcamContainer">
        <video id="webcam" autoplay playsinline></video>
        <canvas id="overlay"></canvas>
        <div id="coachOverlay" class="coach-overlay"></div>

        <div class="cam-top-bar">
          <div class="live-badge" id="liveBadge">
            <div class="live-dot"></div>
            <span>LIVE</span>
          </div>
          <span class="cam-exercise-name">Squat \u2014 Knee Joint</span>
          <span class="cam-fps" id="fpsDisplay">0 fps</span>
        </div>

        <div class="cam-bottom-bar" id="camBottomBar">
          <div class="cam-stat">
            <div class="cam-stat-label">ANGLE</div>
            <div class="cam-stat-value" id="camAngle">0\u00B0</div>
          </div>
          <div class="cam-stat">
            <div class="cam-stat-label">STATE</div>
            <div class="cam-stat-value" id="camState" style="font-size:16px">READY</div>
          </div>
          <div class="cam-stat">
            <div class="cam-stat-label">FORM</div>
            <div class="cam-stat-value green" id="camForm">100</div>
          </div>
        </div>

        <div class="guidance" id="guidance">
          <div class="guidance-box">
            <div class="guidance-icon">\u{1F9CD}</div>
            <div class="guidance-title">Position Yourself</div>
            <div class="guidance-text">Stand so your full body is visible in the webcam.<br>Click "Start Session" when ready.</div>
          </div>
        </div>
      </div>

      <!-- Side panel -->
      <div class="side-panel">
        <div class="stats-card">
          <div class="stats-row">
            <div class="stat-item">
              <div class="stat-label">REPS</div>
              <div class="stat-value"><span id="repsCount">0</span><span class="stat-goal">/<span id="repsGoal">10</span></span></div>
            </div>
            <div class="stat-item">
              <div class="stat-label">TIME</div>
              <div class="stat-value" id="timerDisplay">00:00</div>
            </div>
            <div class="stat-item">
              <div class="stat-label">FORM</div>
              <div class="stat-value green" id="formDisplay">100%</div>
            </div>
          </div>
        </div>

        <div class="angles-card">
          <div class="angles-title">JOINT ANGLES</div>
          <div class="angles-grid" id="anglesGrid">
            <div class="angle-item"><div class="angle-value" id="ang-left_knee">\u2014</div><div class="angle-name">left knee</div></div>
            <div class="angle-item"><div class="angle-value" id="ang-right_knee">\u2014</div><div class="angle-name">right knee</div></div>
            <div class="angle-item"><div class="angle-value" id="ang-left_hip">\u2014</div><div class="angle-name">left hip</div></div>
            <div class="angle-item"><div class="angle-value" id="ang-right_hip">\u2014</div><div class="angle-name">right hip</div></div>
          </div>
        </div>

        <div class="rep-dots" id="repDots"></div>

        <div class="feedback-card" id="feedbackCard">
          <div class="feedback-text" id="feedbackText"></div>
        </div>

        <div class="action-area">
          <button class="btn btn-loading" id="actionBtn" disabled>Loading AI Model...</button>
        </div>
      </div>
    </div>
  </div>

  <!-- Session Complete Overlay -->
  <div class="complete-overlay" id="completeOverlay">
    <div class="complete-card">
      <div class="complete-emoji">\u{1F3C6}</div>
      <div class="complete-title">Session Complete!</div>
      <div class="complete-subtitle" id="completeSubtitle">Great workout!</div>
      <div class="score-big green" id="completeScore">0</div>
      <div class="grade-badge green" id="completeGrade" style="background:rgba(16,185,129,0.2)">A</div>
      <div class="complete-stats">
        <div class="stat-item">
          <div class="complete-stat-label">REPS</div>
          <div class="complete-stat-value" id="completeReps">0</div>
        </div>
        <div class="stat-item">
          <div class="complete-stat-label">TIME</div>
          <div class="complete-stat-value" id="completeTime">00:00</div>
        </div>
        <div class="stat-item">
          <div class="complete-stat-label">AVG ANGLE</div>
          <div class="complete-stat-value" id="completeAngle">0\u00B0</div>
        </div>
      </div>
      <div id="completeFeedback" style="text-align:left;margin-bottom:20px;"></div>
      <button class="btn btn-restart" onclick="resetSession()">\u{1F504}  New Session</button>
    </div>
  </div>

  <!-- MediaPipe Vision SDK -->
  <script src="https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs" type="module"></script>

  <script type="module">
    import { PoseLandmarker, FilesetResolver, DrawingUtils } from
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/vision_bundle.mjs";

    // ===================== CONFIG =====================
    let TARGET_REPS = 10;
    let TOP_THRESHOLD = 160;
    let BOTTOM_THRESHOLD = 135;
    let MIN_REP_DURATION = 0.8;
    let coachingEvents = [];

    const LM = {
      LEFT_SHOULDER: 11, RIGHT_SHOULDER: 12,
      LEFT_ELBOW: 13, RIGHT_ELBOW: 14,
      LEFT_WRIST: 15, RIGHT_WRIST: 16,
      LEFT_HIP: 23, RIGHT_HIP: 24,
      LEFT_KNEE: 25, RIGHT_KNEE: 26,
      LEFT_ANKLE: 27, RIGHT_ANKLE: 28,
    };

    let audioCtx = null;
    function initAudio() {
      if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      }
    }
    function playBeep(type) {
      if (!audioCtx) return;
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      if (type === 'success') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.1);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.1);
      } else {
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(400, audioCtx.currentTime);
        gain.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
      }
    }

    const SKELETON = [
      [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER],
      [LM.LEFT_SHOULDER, LM.LEFT_HIP],
      [LM.RIGHT_SHOULDER, LM.RIGHT_HIP],
      [LM.LEFT_HIP, LM.RIGHT_HIP],
      [LM.LEFT_SHOULDER, LM.LEFT_ELBOW],
      [LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW],
      [LM.LEFT_ELBOW, LM.LEFT_WRIST],
      [LM.RIGHT_ELBOW, LM.RIGHT_WRIST],
      [LM.LEFT_HIP, LM.LEFT_KNEE],
      [LM.RIGHT_HIP, LM.RIGHT_KNEE],
      [LM.LEFT_KNEE, LM.LEFT_ANKLE],
      [LM.RIGHT_KNEE, LM.RIGHT_ANKLE],
    ];

    const HIGHLIGHT_JOINTS = [LM.LEFT_KNEE, LM.RIGHT_KNEE, LM.LEFT_HIP, LM.RIGHT_HIP, LM.LEFT_ANKLE, LM.RIGHT_ANKLE];

    // ===================== STATE =====================
    let poseLandmarker = null;
    let webcamRunning = false;
    let isSessionRunning = false;
    let animFrameId = null;

    let phase = 'up';
    let hasBeenDown = false;
    let repCounter = 0;
    let correctCounter = 0;
    let repStartTime = 0;
    let lastCountTime = 0;
    let repAngles = [];
    let allReps = [];
    let allAnglesHistory = [];
    let formScore = 100;

    let timerInterval = null;
    let timerSeconds = 0;

    let frameCount = 0;
    let lastFpsTime = Date.now();

    // ===================== DOM =====================
    const video = document.getElementById('webcam');
    const canvas = document.getElementById('overlay');
    const ctx = canvas.getContext('2d');

    // ===================== ADAPTIVE ENGINE =====================
    function applyAdaptiveConfig() {
      if (window.USER_REHAB_CONFIG) {
        const config = window.USER_REHAB_CONFIG;
        const knee = config.jointSpecificData?.knee || {};

        if (knee.knee_bend_ability === 'Partially bend' || knee.knee_bend_ability === 'Cannot bend') {
          BOTTOM_THRESHOLD = 145;
        }
        if (knee.knee_straighten_ability === 'Cannot straighten') {
          TOP_THRESHOLD = 150;
        }

        if (knee.pain_level >= 7 || config.physicalContext?.activity_level === 'Low') {
          TARGET_REPS = 5;
        }

        if (knee.swelling === 'Moderate' || knee.swelling === 'Severe' || knee.injury_present) {
          MIN_REP_DURATION = 1.2;
        }
      }
    }

    // ===================== INIT MEDIAPIPE =====================
    async function initMediaPipe() {
      applyAdaptiveConfig();

      const vision = await FilesetResolver.forVisionTasks(
        "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.18/wasm"
      );

      poseLandmarker = await PoseLandmarker.createFromOptions(vision, {
        baseOptions: {
          modelAssetPath: "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task",
          delegate: "GPU",
        },
        runningMode: "VIDEO",
        numPoses: 1,
      });

      document.getElementById('statusDot').classList.add('active');
      document.getElementById('statusText').textContent = 'AI Ready';

      const btn = document.getElementById('actionBtn');
      btn.textContent = '\u25B6  Start Session';
      btn.className = 'btn btn-start';
      btn.disabled = false;
      btn.onclick = toggleSession;

      await startWebcam();
    }

    async function startWebcam() {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' },
        audio: false,
      });
      video.srcObject = stream;
      await new Promise(resolve => video.onloadeddata = resolve);

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      webcamRunning = true;
      detectLoop();
    }

    // ===================== ANGLE MATH =====================
    function calcAngle(a, b, c) {
      const ba = { x: a.x - b.x, y: a.y - b.y };
      const bc = { x: c.x - b.x, y: c.y - b.y };
      const dot = ba.x * bc.x + ba.y * bc.y;
      const magBA = Math.sqrt(ba.x ** 2 + ba.y ** 2);
      const magBC = Math.sqrt(bc.x ** 2 + bc.y ** 2);
      if (magBA === 0 || magBC === 0) return 0;
      const cos = Math.max(-1, Math.min(1, dot / (magBA * magBC)));
      return Math.abs(Math.acos(cos) * 180 / Math.PI);
    }

    // ===================== REP COUNTER =====================
    let standingHipY = null;

    function processAngles(lm, leftKnee, rightKnee, leftHip, rightHip) {
      const avgKnee = (leftKnee + rightKnee) / 2;
      allAnglesHistory.push(avgKnee);

      const now = Date.now();
      let counted = false;
      let repData = null;
      let displayState;

      const asymmetry = Math.abs(leftKnee - rightKnee);
      const bothKneesVisible = lm[LM.LEFT_KNEE].visibility > 0.6 && lm[LM.RIGHT_KNEE].visibility > 0.6;

      if (bothKneesVisible && asymmetry > 35 && phase === 'down') {
        const msg = leftKnee < rightKnee ? "Leaning Left!" : "Leaning Right!";
        if (coachingEvents.length === 0 || now - coachingEvents[coachingEvents.length-1].timestamp > 2000) {
          coachingEvents.push({ type: 'asymmetry', message: msg, timestamp: now });
          showFeedbackOverlay(msg);
        }
      }

      const currentHipY = (lm[LM.LEFT_HIP].y + lm[LM.RIGHT_HIP].y) / 2;

      const isUp = avgKnee >= TOP_THRESHOLD - 10;

      if (isUp) {
        standingHipY = currentHipY;
      }

      const isKneeBent = Math.min(leftKnee, rightKnee) <= BOTTOM_THRESHOLD;

      let isHipDropped = false;
      if (standingHipY !== null) {
        isHipDropped = (currentHipY - standingHipY) > 0.04;
      }

      const isDown = isKneeBent && isHipDropped;

      if (isUp) {
        if (hasBeenDown && phase === 'down') {
          const elapsed = (now - lastCountTime) / 1000;
          if (elapsed >= MIN_REP_DURATION || repCounter === 0) {
            repCounter++;
            counted = true;
            repData = {
              angle: Math.min(...repAngles, avgKnee),
              duration: elapsed,
              formScore: calcFormScore(Math.min(...repAngles, avgKnee), elapsed)
            };
            formScore = repData.formScore;
            if (repData.formScore >= 75) correctCounter++;
            allReps.push(repData);
            lastCountTime = now;
            updateRepDots();

            window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'HAPTIC', payload: repData.formScore >= 75 ? 'success' : 'warning' }));
            playBeep('success');
          } else {
             coachingEvents.push({ type: 'tempo', message: "Too Fast! Control descent.", timestamp: now });
             showFeedbackOverlay("Too Fast!");
             window.ReactNativeWebView?.postMessage(JSON.stringify({ type: 'HAPTIC', payload: 'warning' }));
             playBeep('error');
          }
          hasBeenDown = false;
          repAngles = [];
        }
        phase = 'up';
        displayState = 'TOP';
      } else if (isDown) {
        if (phase === 'up' && !hasBeenDown) {
          repStartTime = now;
          repAngles = [];
        }
        hasBeenDown = true;
        phase = 'down';
        repAngles.push(avgKnee);
        displayState = 'BOTTOM';
      } else {
        repAngles.push(avgKnee);
        displayState = phase === 'up' ? 'DESCENDING' : 'ASCENDING';
      }

      return { counted, state: displayState, repData };
    }

    function calcFormScore(minAngle, duration) {
      let score = 100;
      const delta = Math.abs(minAngle - BOTTOM_THRESHOLD);
      if (delta > 30) score -= 25;
      else if (delta > 20) score -= 15;
      else if (delta > 10) score -= 5;
      if (minAngle < BOTTOM_THRESHOLD) score += 5;
      if (duration < MIN_REP_DURATION) score -= 15;
      if (duration > 6) score -= 10;
      return Math.max(0, Math.min(100, score));
    }

    // ===================== DRAWING =====================
    function drawSkeleton(landmarks) {
      const w = canvas.width;
      const h = canvas.height;

      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.globalAlpha = 0.85;
      for (const [i, j] of SKELETON) {
        const a = landmarks[i];
        const b = landmarks[j];
        if (a.visibility > 0.5 && b.visibility > 0.5) {
          ctx.beginPath();
          ctx.moveTo(a.x * w, a.y * h);
          ctx.lineTo(b.x * w, b.y * h);
          ctx.stroke();
        }
      }

      ctx.globalAlpha = 0.9;
      for (let idx = 0; idx < landmarks.length; idx++) {
        const lm = landmarks[idx];
        if (lm.visibility < 0.5) continue;
        if (!Object.values(LM).includes(idx)) continue;

        const isHighlight = HIGHLIGHT_JOINTS.includes(idx);
        const radius = isHighlight ? 8 : 5;

        ctx.beginPath();
        ctx.arc(lm.x * w, lm.y * h, radius, 0, 2 * Math.PI);
        ctx.fillStyle = isHighlight ? '#FF6B6B' : '#00FF88';
        ctx.fill();
        ctx.strokeStyle = '#FFF';
        ctx.lineWidth = 2;
        ctx.stroke();
      }

      ctx.globalAlpha = 1;
    }

    // ===================== MAIN DETECTION LOOP =====================
    function detectLoop() {
      if (!webcamRunning) return;

      const startTime = performance.now();
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const results = poseLandmarker.detectForVideo(video, startTime);

      if (results.landmarks && results.landmarks.length > 0) {
        const lm = results.landmarks[0];
        drawSkeleton(lm);

        if (isSessionRunning) {
          const leftKnee = calcAngle(lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE], lm[LM.LEFT_ANKLE]);
          const rightKnee = calcAngle(lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE], lm[LM.RIGHT_ANKLE]);
          const leftHip = calcAngle(lm[LM.LEFT_SHOULDER], lm[LM.LEFT_HIP], lm[LM.LEFT_KNEE]);
          const rightHip = calcAngle(lm[LM.RIGHT_SHOULDER], lm[LM.RIGHT_HIP], lm[LM.RIGHT_KNEE]);

          const primaryAngle = (leftKnee + rightKnee) / 2;

          document.getElementById('ang-left_knee').textContent = Math.round(leftKnee) + '\u00B0';
          document.getElementById('ang-right_knee').textContent = Math.round(rightKnee) + '\u00B0';
          document.getElementById('ang-left_hip').textContent = Math.round(leftHip) + '\u00B0';
          document.getElementById('ang-right_hip').textContent = Math.round(rightHip) + '\u00B0';

          const result = processAngles(lm, leftKnee, rightKnee, leftHip, rightHip);

          document.getElementById('camAngle').textContent = Math.round(primaryAngle) + '\u00B0';
          document.getElementById('camState').textContent = result.state;
          document.getElementById('camState').className = 'cam-stat-value ' + getStateColorClass(result.state);
          document.getElementById('camForm').textContent = formScore;
          document.getElementById('camForm').className = 'cam-stat-value ' + getScoreColorClass(formScore);

          document.getElementById('repsCount').textContent = repCounter;
          const scoreColor = getScoreColorClass(formScore);
          const formDisplayElem = document.getElementById('formDisplay');
          formDisplayElem.textContent = Math.round(formScore) + '%';
          formDisplayElem.className = 'stat-value ' + scoreColor;

          const webcamContainer = document.getElementById('webcamContainer');
          if (scoreColor === 'green') {
            webcamContainer.style.boxShadow = 'inset 0 0 0 4px #10B981, 0 0 15px rgba(16,185,129,0.5)';
            webcamContainer.style.borderColor = '#10B981';
          } else if (scoreColor === 'yellow') {
            webcamContainer.style.boxShadow = 'inset 0 0 0 4px #F59E0B, 0 0 15px rgba(245,158,11,0.5)';
            webcamContainer.style.borderColor = '#F59E0B';
          } else {
            webcamContainer.style.boxShadow = 'inset 0 0 0 4px #EF4444, 0 0 15px rgba(239,68,68,0.5)';
            webcamContainer.style.borderColor = '#EF4444';
          }

          const feedback = generateFeedback(primaryAngle, leftKnee, rightKnee, leftHip, rightHip);
          const feedbackCard = document.getElementById('feedbackCard');
          if (feedback.length > 0) {
            feedbackCard.classList.add('visible');
            document.getElementById('feedbackText').textContent = feedback.join(' \u2022 ');
          } else {
            feedbackCard.classList.remove('visible');
          }

          if (result.counted) {
            updateRepDots();
            if (repCounter >= TARGET_REPS) {
              endSession();
              return;
            }
          }
        }
      }

      frameCount++;
      const now = Date.now();
      if (now - lastFpsTime >= 1000) {
        document.getElementById('fpsDisplay').textContent = frameCount + ' fps';
        frameCount = 0;
        lastFpsTime = now;
      }

      animFrameId = requestAnimationFrame(detectLoop);
    }

    function generateFeedback(primary, lk, rk, lh, rh) {
      const fb = [];
      const midHip = (lh + rh) / 2;
      if (midHip < 60) fb.push('\u26A0\uFE0F Leaning too far forward');
      if (primary < 70) fb.push('\u2139\uFE0F Very deep squat \u2014 watch knee strain');
      return fb;
    }

    function getStateColorClass(state) {
      switch (state) {
        case 'TOP': return 'green';
        case 'DESCENDING': return 'yellow';
        case 'BOTTOM': return 'red';
        case 'ASCENDING': return 'blue';
        default: return 'gray';
      }
    }

    function getScoreColorClass(score) {
      if (score >= 90) return 'green';
      if (score >= 70) return 'yellow';
      return 'red';
    }

    function showFeedbackOverlay(msg) {
      const el = document.getElementById('coachOverlay');
      el.textContent = msg;
      el.classList.add('visible');
      setTimeout(() => el.classList.remove('visible'), 1500);
    }

    // ===================== SESSION CONTROL =====================
    function toggleSession() {
      if (!isSessionRunning) startSession();
      else endSession();
    }

    function startSession() {
      initAudio();
      phase = 'up';
      hasBeenDown = false;
      repCounter = 0;
      correctCounter = 0;
      repStartTime = 0;
      lastCountTime = 0;
      repAngles = [];
      allReps = [];
      allAnglesHistory = [];
      coachingEvents = [];
      formScore = 100;
      timerSeconds = 0;

      isSessionRunning = true;

      document.getElementById('guidance').classList.add('hidden');
      document.getElementById('liveBadge').classList.add('visible');
      document.getElementById('camBottomBar').classList.add('visible');
      document.getElementById('repsCount').textContent = '0';
      document.getElementById('timerDisplay').textContent = '00:00';
      document.getElementById('formDisplay').textContent = '100%';
      document.getElementById('completeOverlay').classList.remove('visible');

      const btn = document.getElementById('actionBtn');
      btn.textContent = '\u23F9  End Session';
      btn.className = 'btn btn-stop';

      const dotsContainer = document.getElementById('repDots');
      dotsContainer.innerHTML = '';
      for (let i = 0; i < TARGET_REPS; i++) {
        const dot = document.createElement('div');
        dot.className = 'rep-dot';
        dot.id = 'dot-' + i;
        dotsContainer.appendChild(dot);
      }

      timerInterval = setInterval(() => {
        timerSeconds++;
        const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
        const s = String(timerSeconds % 60).padStart(2, '0');
        document.getElementById('timerDisplay').textContent = m + ':' + s;
      }, 1000);
    }

    function endSession() {
      isSessionRunning = false;
      if (timerInterval) clearInterval(timerInterval);

      document.getElementById('liveBadge').classList.remove('visible');
      document.getElementById('camBottomBar').classList.remove('visible');

      const btn = document.getElementById('actionBtn');
      btn.textContent = '\u25B6  Start Session';
      btn.className = 'btn btn-start';

      const angles = allReps.map(r => r.angle);
      const avgAngle = angles.length > 0 ? angles.reduce((s, a) => s + a, 0) / angles.length : 0;

      if (window.ReactNativeWebView) {
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type: 'SESSION_COMPLETE',
          payload: {
            totalReps: repCounter,
            correctReps: correctCounter,
            timerSeconds: timerSeconds,
            allReps: allReps,
            avgAngle: avgAngle,
            angles: angles,
            coachingEvents: coachingEvents
          }
        }));
      }

      showResults();
    }

    function updateRepDots() {
      for (let i = 0; i < allReps.length && i < TARGET_REPS; i++) {
        const dot = document.getElementById('dot-' + i);
        if (dot) {
          dot.className = allReps[i].formScore >= 75 ? 'rep-dot good' : 'rep-dot warn';
        }
      }
    }

    function showResults() {
      const angles = allReps.map(r => r.angle);
      const avgAngle = angles.length > 0 ? angles.reduce((s, a) => s + a, 0) / angles.length : 0;
      const accuracy = repCounter > 0 ? Math.round((correctCounter / repCounter) * 100) : 0;

      let romScore = 100 - Math.abs(avgAngle - 90);
      romScore = Math.max(0, Math.min(100, Math.round(romScore)));

      let consistency = 0;
      if (allReps.length >= 2) {
        const mean = avgAngle;
        const variance = angles.reduce((s, a) => s + (a - mean) ** 2, 0) / angles.length;
        consistency = Math.max(0, Math.min(100, Math.round(100 - Math.sqrt(variance) * 5)));
      } else if (allReps.length === 1) {
        consistency = 75;
      }

      const finalScore = Math.round(accuracy * 0.5 + romScore * 0.3 + consistency * 0.2);
      let grade;
      if (finalScore >= 90) grade = 'A';
      else if (finalScore >= 80) grade = 'B';
      else if (finalScore >= 70) grade = 'C';
      else if (finalScore >= 60) grade = 'D';
      else grade = 'F';

      const colorClass = getScoreColorClass(finalScore);

      const m = String(Math.floor(timerSeconds / 60)).padStart(2, '0');
      const s = String(timerSeconds % 60).padStart(2, '0');

      document.getElementById('completeScore').textContent = finalScore;
      document.getElementById('completeScore').className = 'score-big ' + colorClass;
      document.getElementById('completeGrade').textContent = grade;
      document.getElementById('completeGrade').className = 'grade-badge ' + colorClass;
      document.getElementById('completeReps').textContent = repCounter;
      document.getElementById('completeTime').textContent = m + ':' + s;
      document.getElementById('completeAngle').textContent = Math.round(avgAngle) + '\u00B0';

      let fbHTML = '';
      if (accuracy >= 90) fbHTML += '<p style="color:#10B981;font-size:13px">\u2705 Excellent form accuracy!</p>';
      else if (accuracy >= 70) fbHTML += '<p style="color:#F59E0B;font-size:13px">\u{1F44D} Good accuracy. Focus on controlled movements.</p>';
      else fbHTML += '<p style="color:#EF4444;font-size:13px">\u26A0\uFE0F Try to maintain proper form throughout.</p>';

      if (romScore >= 90) fbHTML += '<p style="color:#10B981;font-size:13px">\u2705 Great range of motion!</p>';
      else if (romScore >= 70) fbHTML += '<p style="color:#F59E0B;font-size:13px">\u{1F44D} Try going a little deeper.</p>';
      else fbHTML += '<p style="color:#EF4444;font-size:13px">\u26A0\uFE0F Focus on reaching full ROM safely.</p>';

      document.getElementById('completeFeedback').innerHTML = fbHTML;
      document.getElementById('completeOverlay').classList.add('visible');
    }

    window.resetSession = function() {
      document.getElementById('completeOverlay').classList.remove('visible');
      document.getElementById('guidance').classList.remove('hidden');
    };

    // ===================== INIT =====================
    document.getElementById('repsGoal').textContent = TARGET_REPS;
    initMediaPipe().catch(err => {
      console.error('Init error:', err);
      document.getElementById('statusText').textContent = 'Error: ' + err.message;
    });
  </script>
</body>
</html>
`;
