"""
NeuroMotion AI — Rehab Backend API

Flask REST API for rehabilitation exercise processing.
Provides REAL-TIME pose detection via MediaPipe for the mobile app.

Endpoints:
  POST /api/pose      — Real-time: accept a frame image, return keypoints + angles
  POST /api/analyze   — Batch: analyze a video file for exercise form
  GET  /api/exercises — List available exercises
  POST /api/score     — Calculate score from session data
  GET  /api/health    — Health check
"""

import os
import sys
import json
import math
import time
import uuid
import base64
import traceback
import threading
import numpy as np
from io import BytesIO

from flask import Flask, request, jsonify
from flask_cors import CORS

# Suppress TensorFlow/MediaPipe logs
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "3"
os.environ["GLOG_minloglevel"] = "3"

app = Flask(__name__)
CORS(app)

UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)


# ==================== MEDIAPIPE INIT ====================

import cv2
import mediapipe as mp

BaseOptions = mp.tasks.BaseOptions
PoseLandmarker = mp.tasks.vision.PoseLandmarker
PoseLandmarkerOptions = mp.tasks.vision.PoseLandmarkerOptions
VisionRunningMode = mp.tasks.vision.RunningMode

# Persistent pose detector using the downloaded task model
options = PoseLandmarkerOptions(
    base_options=BaseOptions(model_asset_path='pose_landmarker_lite.task'),
    running_mode=VisionRunningMode.IMAGE)

pose_detector = PoseLandmarker.create_from_options(options)
pose_lock = threading.Lock()  # Protect from concurrent access

# Clean up MediaPipe properly on shutdown to avoid TypeError
import atexit
def _cleanup_mediapipe():
    try:
        pose_detector.close()
    except Exception:
        pass
atexit.register(_cleanup_mediapipe)

print("✅ MediaPipe Pose initialized (Tasks API)")


# ==================== ANGLE CALCULATION ====================

def calculate_angle(a, b, c):
    """
    Calculate angle at vertex b between points a-b-c.
    Each point is [x, y].
    Returns angle in degrees (0-180).
    """
    a = np.array(a)
    b = np.array(b)
    c = np.array(c)

    ba = a - b
    bc = c - b

    dot = np.dot(ba, bc)
    mag_ba = np.linalg.norm(ba)
    mag_bc = np.linalg.norm(bc)

    if mag_ba == 0 or mag_bc == 0:
        return 0

    cos_angle = np.clip(dot / (mag_ba * mag_bc), -1.0, 1.0)
    angle = np.abs(np.degrees(np.arccos(cos_angle)))
    return float(angle)


# ==================== REAL-TIME POSE ENDPOINT ====================

@app.route('/api/pose', methods=['POST'])
def detect_pose():
    """
    Accept a camera frame (base64 JPEG) and return pose landmarks + joint angles.
    """
    try:
        data = request.json
        if not data or 'image' not in data:
            return jsonify({'error': 'No image provided', 'detected': False}), 400

        # Decode base64 image
        img_data = data['image']
        if ',' in img_data:
            img_data = img_data.split(',', 1)[1]

        img_bytes = base64.b64decode(img_data)
        img_array = np.frombuffer(img_bytes, dtype=np.uint8)
        frame = cv2.imdecode(img_array, cv2.IMREAD_COLOR)

        if frame is None:
            return jsonify({'error': 'Could not decode image', 'detected': False}), 400

        # Process with MediaPipe Tasks API (thread-safe)
        rgb_frame = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
        mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_frame)

        with pose_lock:
            results = pose_detector.detect(mp_image)

        if not results.pose_landmarks:
            return jsonify({
                'detected': False,
                'angles': {},
                'primary_angle': 0,
                'landmarks': {},
                'feedback': ['No pose detected — make sure your full body is visible'],
            })

        # Extract landmark coordinates (normalized 0-1)
        lm = results.pose_landmarks[0]

        def get_point(idx):
            l = lm[idx]
            return [l.x, l.y]

        landmarks = {
            'left_shoulder': get_point(11),
            'right_shoulder': get_point(12),
            'left_hip': get_point(23),
            'right_hip': get_point(24),
            'left_knee': get_point(25),
            'right_knee': get_point(26),
            'left_ankle': get_point(27),
            'right_ankle': get_point(28),
            'left_elbow': get_point(13),
            'right_elbow': get_point(14),
            'left_wrist': get_point(15),
            'right_wrist': get_point(16),
        }

        # Calculate joint angles
        left_hip_angle = calculate_angle(
            landmarks['left_shoulder'], landmarks['left_hip'], landmarks['left_knee']
        )
        right_hip_angle = calculate_angle(
            landmarks['right_shoulder'], landmarks['right_hip'], landmarks['right_knee']
        )
        left_knee_angle = calculate_angle(
            landmarks['left_hip'], landmarks['left_knee'], landmarks['left_ankle']
        )
        right_knee_angle = calculate_angle(
            landmarks['right_hip'], landmarks['right_knee'], landmarks['right_ankle']
        )

        # Spine angle (forward lean)
        mid_shoulder = [(landmarks['left_shoulder'][0] + landmarks['right_shoulder'][0]) / 2,
                       (landmarks['left_shoulder'][1] + landmarks['right_shoulder'][1]) / 2]
        mid_hip = [(landmarks['left_hip'][0] + landmarks['right_hip'][0]) / 2,
                  (landmarks['left_hip'][1] + landmarks['right_hip'][1]) / 2]
        vertical_ref = [mid_hip[0], mid_hip[1] - 0.3]
        spine_angle = calculate_angle(mid_shoulder, mid_hip, vertical_ref)

        angles = {
            'left_hip': round(left_hip_angle, 1),
            'right_hip': round(right_hip_angle, 1),
            'left_knee': round(left_knee_angle, 1),
            'right_knee': round(right_knee_angle, 1),
            'spine': round(spine_angle, 1),
        }

        exercise = data.get('exercise', 'squat')
        if exercise == 'squat':
            primary_angle = round((left_knee_angle + right_knee_angle) / 2, 1)
        elif exercise == 'shoulder_raise':
            left_shoulder_angle = calculate_angle(
                landmarks['left_hip'], landmarks['left_shoulder'], landmarks['left_elbow']
            )
            right_shoulder_angle = calculate_angle(
                landmarks['right_hip'], landmarks['right_shoulder'], landmarks['right_elbow']
            )
            primary_angle = round((left_shoulder_angle + right_shoulder_angle) / 2, 1)
            angles['left_shoulder_raise'] = round(left_shoulder_angle, 1)
            angles['right_shoulder_raise'] = round(right_shoulder_angle, 1)
        elif exercise == 'elbow_flexion':
            left_elbow_angle = calculate_angle(
                landmarks['left_shoulder'], landmarks['left_elbow'], landmarks['left_wrist']
            )
            right_elbow_angle = calculate_angle(
                landmarks['right_shoulder'], landmarks['right_elbow'], landmarks['right_wrist']
            )
            primary_angle = round((left_elbow_angle + right_elbow_angle) / 2, 1)
            angles['left_elbow'] = round(left_elbow_angle, 1)
            angles['right_elbow'] = round(right_elbow_angle, 1)
        else:
            primary_angle = round((left_hip_angle + right_hip_angle) / 2, 1)

        # Generate form feedback
        feedback = []
        if exercise == 'squat':
            if spine_angle > 30:
                feedback.append('⚠️ Leaning too far forward — keep chest up')
            if abs(left_knee_angle - right_knee_angle) > 15:
                feedback.append('⚠️ Uneven knee angles — distribute weight evenly')
            if primary_angle < 70:
                feedback.append('ℹ️ Very deep squat — watch knee strain')

        return jsonify({
            'detected': True,
            'angles': angles,
            'primary_angle': primary_angle,
            'landmarks': landmarks,
            'feedback': feedback,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': str(e), 'detected': False}), 500


# ==================== SCORING ENGINE ====================

def calculate_score(total_reps, correct_reps, avg_angle, variation, user_metrics=None):
    """score = accuracy*0.5 + rom*0.3 + consistency*0.2"""
    accuracy = (correct_reps / total_reps * 100) if total_reps > 0 else 0

    ideal_angle = 90
    rom_score = max(0, min(100, 100 - abs(avg_angle - ideal_angle)))

    if user_metrics:
        age = user_metrics.get('age', 30)
        height = user_metrics.get('height', 170)
        weight = user_metrics.get('weight', 70)
        bmi = weight / ((height / 100) ** 2)
        if age > 60: rom_score += 15
        elif age > 50: rom_score += 10
        elif age > 40: rom_score += 5
        if bmi > 30: rom_score += 10
        elif bmi > 25: rom_score += 5

    rom_score = max(0, min(100, rom_score))
    consistency = max(0, min(100, 100 - variation * 5))
    final_score = round(accuracy * 0.5 + rom_score * 0.3 + consistency * 0.2)

    if final_score >= 90: grade = 'A'
    elif final_score >= 80: grade = 'B'
    elif final_score >= 70: grade = 'C'
    elif final_score >= 60: grade = 'D'
    else: grade = 'F'

    risk = 0
    if final_score < 50: risk += 2
    elif final_score < 70: risk += 1
    if variation > 15: risk += 1
    if user_metrics and user_metrics.get('age', 30) > 60: risk += 1
    risk_level = 'high' if risk >= 3 else ('moderate' if risk >= 1 else 'low')

    feedback = []
    if accuracy >= 90: feedback.append('Excellent form accuracy!')
    elif accuracy >= 70: feedback.append('Good accuracy. Focus on controlled movements.')
    else: feedback.append('Try to maintain proper form throughout each rep.')
    if rom_score >= 90: feedback.append('Great range of motion achieved.')
    elif rom_score >= 70: feedback.append('Try to go a little deeper for better ROM.')
    else: feedback.append('Focus on reaching full range of motion safely.')
    if consistency >= 90: feedback.append('Very consistent reps — great control.')
    elif consistency >= 70: feedback.append('Try to make each rep identical.')
    else: feedback.append('Work on making each repetition more uniform.')

    # ============== SQUAT-SPECIFIC PERFORMANCE & RECOMMENDATIONS ==============
    feedback.append('--- SQUAT PERFORMANCE ANALYSIS ---')
    if avg_angle > 105:
        feedback.append(f'Result: Shallow squat depth (Avg Angle: {round(avg_angle)}°). You did not reach parallel.')
        feedback.append('Recommendation: Focus on ankle and hip mobility stretches. Try "Box Squats" to build confidence descending lower.')
    elif avg_angle < 70:
        feedback.append(f'Result: Deep squat achieved (Avg Angle: {round(avg_angle)}°).')
        feedback.append('Recommendation: Excellent depth! Just ensure your lower back doesn\'t round ("butt wink") at the very bottom.')
    else:
        feedback.append(f'Result: Optimal squat depth (Avg Angle: {round(avg_angle)}°).')
        feedback.append('Recommendation: You have great range of motion. Keep your chest up and focus on adding progressive resistance.')

    if variation > 15:
        feedback.append(f'Result: High rep inconsistency (Angle Variance: {round(variation)}°).')
        feedback.append('Recommendation: Slow down your eccentric (lowering) tempo to 3 seconds to build better neuromuscular control.')
    else:
        feedback.append('Result: High movement consistency.')
        feedback.append('Recommendation: Great motor control! Your reps are identical. You are ready to increase the difficulty.')

    return {
        'accuracy': round(accuracy),
        'rom_score': round(rom_score),
        'consistency': round(consistency),
        'final_score': final_score,
        'grade': grade,
        'risk_level': risk_level,
        'feedback': feedback,
    }


# ==================== OTHER ROUTES ====================

@app.route('/api/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'service': 'neuromotion-ai',
        'version': '1.0.0',
        'pose_ready': True,
    })


@app.route('/api/exercises', methods=['GET'])
def list_exercises():
    exercises = [
        {'id': 'squat', 'name': 'Squat', 'joint': 'knee',
         'muscles': ['Quadriceps', 'Glutes', 'Hamstrings'],
         'difficulty': 'beginner', 'default_reps': 10, 'default_sets': 3},
        {'id': 'shoulder_raise', 'name': 'Shoulder Raise', 'joint': 'shoulder',
         'muscles': ['Deltoids', 'Rotator Cuff'],
         'difficulty': 'beginner', 'default_reps': 12, 'default_sets': 3},
        {'id': 'elbow_flexion', 'name': 'Elbow Flexion', 'joint': 'elbow',
         'muscles': ['Biceps', 'Brachialis'],
         'difficulty': 'beginner', 'default_reps': 15, 'default_sets': 3},
    ]
    return jsonify({'exercises': exercises, 'count': len(exercises)})


@app.route('/api/score', methods=['POST'])
def compute_score():
    data = request.json
    if not data:
        return jsonify({'error': 'No data provided'}), 400
    result = calculate_score(
        total_reps=data.get('total_reps', 0),
        correct_reps=data.get('correct_reps', 0),
        avg_angle=data.get('avg_angle', 90),
        variation=data.get('variation', 0),
        user_metrics=data.get('user_metrics'),
    )
    return jsonify(result)


@app.route('/api/analyze', methods=['POST'])
def analyze_video():
    return jsonify({'error': 'Not implemented for Tasks API yet. Use /api/pose.'}), 501


if __name__ == '__main__':
    import socket
    hostname = socket.gethostname()
    local_ip = socket.gethostbyname(hostname)

    print("=" * 55)
    print("  🧠 NeuroMotion AI — Rehab Backend")
    print("=" * 55)
    print(f"  🌐 Local:   http://127.0.0.1:5000")
    print(f"  📱 Network: http://{local_ip}:5000")
    print("  ─────────────────────────────────────")
    print("  📋 Endpoints:")
    print("     POST /api/pose       ← Real-time pose detection")
    print("     POST /api/analyze    ← Video analysis")
    print("     POST /api/score      ← Score calculation")
    print("     GET  /api/exercises  ← Exercise list")
    print("     GET  /api/health     ← Health check")
    print("=" * 55)
    print(f"\n  👉 Set this URL in the app: http://{local_ip}:5000\n")
    app.run(debug=False, host='0.0.0.0', port=5000, threaded=True)
