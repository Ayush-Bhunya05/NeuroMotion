# 🧠 NeuroMotion AI — Intelligent Rehabilitation Platform

A cutting-edge **full-stack rehabilitation application** that combines **AI-powered pose detection** with **cognitive health tracking** to empower patients through intelligent, personalized therapy. Built with modern technologies including React Native, Expo, TypeScript, Python/Flask, and Firebase.

---

## 🎯 Overview

**NeuroMotion AI** is a comprehensive rehabilitation platform designed to support patients in their recovery journey by providing:

- ✨ **Real-time AI Pose Analysis** — Uses MediaPipe for frame-by-frame pose detection and exercise form validation
- 🧩 **Cognitive Health Tracking** — Monitors mental rehabilitation progress alongside physical recovery
- 📊 **Unified Clinician Dashboard** — Allows doctors to track multiple patients and adjust therapy plans
- 👥 **Multi-role Support** — Designed for patients, guardians, and healthcare professionals
- 📱 **Cross-platform Availability** — Native iOS, Android, and Web support via Expo

---

## 📁 Project Structure

```
NeuroMotion/
├── backend/                      # Python Flask REST API
│   ├── app.py                   # Main Flask application with pose detection endpoints
│   ├── pose_landmarker_lite.task # MediaPipe pose detection model (~5.8MB)
│   └── requirements.txt          # Python dependencies
│
└── neuromotion/                 # React Native/Expo Mobile & Web App
    ├── app/                     # Expo Router navigation structure
    │   ├── (auth)/              # Authentication screens (login, signup, onboarding)
    │   ├── (physical)/          # Physical rehabilitation module (squats, shoulder raises, etc.)
    │   ├── (cognitive)/         # Cognitive rehabilitation module
    │   ├── (shared)/            # Shared components for dual rehab
    │   ├── (doctor)/            # Doctor dashboard and patient management
    │   ├── index.tsx            # Landing page
    │   └── _layout.tsx          # Root app layout with context providers
    │
    ├── src/
    │   ├── components/          # Reusable UI components
    │   │   ├── ui/             # Base UI components (buttons, cards, etc.)
    │   │   ├── charts/         # Data visualization components
    │   │   └── shared/         # Shared module components
    │   ├── config/             # App configuration
    │   ├── contexts/           # React Context (App, Physical, Cognitive providers)
    │   ├── services/           # Firebase & API integration
    │   ├── theme/              # Design tokens (colors, typography, spacing)
    │   ├── types/              # TypeScript type definitions
    │   └── utils/              # Helper utilities
    │
    ├── assets/                 # Images, fonts, and static resources
    ├── package.json            # Dependencies & scripts
    ├── app.json                # Expo configuration
    ├── tsconfig.json           # TypeScript configuration
    ├── babel.config.js         # Babel configuration for React Native
    └── test_gemini.js          # Gemini API testing utility

```

---

## 🚀 Key Features

### 🏋️ **Physical Rehabilitation Module**
- **Real-time Pose Detection** — AI analyzes exercise form in real-time via camera
- **Joint Angle Tracking** — Measures knee, hip, shoulder, and elbow angles
- **Exercise Variety** — Supports multiple exercise types:
  - Squats (with depth analysis)
  - Shoulder Raises
  - Elbow Flexion (bicep curls)
- **Personalized Feedback** — Provides form corrections and encouragement
- **Session Scoring** — Calculates performance scores based on:
  - Accuracy (50% weight)
  - Range of Motion (30% weight)
  - Consistency (20% weight)
- **Adaptive Scoring** — Adjusts expectations based on age, height, and weight

### 🧩 **Cognitive Rehabilitation Module**
- Tracks mental health recovery progress
- Integrated into the same patient profile
- Supports both physical and cognitive therapy simultaneously

### 👨‍⚕️ **Doctor Dashboard**
- **Patient Management** — View and manage multiple patients
- **Performance Analytics** — Track patient progress over time
- **Unified Reporting** — Comprehensive health metrics
- **Therapy Adjustment** — Modify treatment plans based on data

### 🔐 **Multi-Role Authentication**
- **Patient** — Personal rehabilitation journey with progress tracking
- **Guardian** — Oversight of patient therapy (family member support)
- **Doctor** — Professional dashboard for clinical management
- Firebase-backed secure authentication

---

## 🛠️ Tech Stack

### Frontend (96.8% TypeScript)
- **React Native** (0.81.5) — Cross-platform mobile framework
- **Expo** (54.0.33) — Build and deployment platform
- **Expo Router** (6.0.23) — File-based navigation
- **React Native Reanimated** (4.1.1) — Smooth animations
- **React Navigation** (7.1.8) — Navigation management
- **Firebase** (12.11.0) — Backend services (Auth, Firestore)
- **Victory Native** (41.20.2) — Chart visualization
- **React Three Fiber** (9.5.0) — 3D graphics (potential future use)

### Backend (Python)
- **Flask** (2.0+) — Lightweight REST API framework
- **Flask-CORS** (3.0+) — Cross-origin resource sharing
- **MediaPipe** (0.10+) — AI pose detection
- **OpenCV** (4.5+) — Image processing
- **NumPy** (1.21+) — Numerical computing

### Data & Services
- **Firebase Authentication** — Secure user login
- **Cloud Firestore** — Real-time database for user data
- **Google Maps API** — Locate nearby rehabilitation clinics

---

## 📦 Installation & Setup

### Prerequisites
- **Node.js** (14+) and npm
- **Python** (3.8+) and pip
- **Expo CLI** — Install with `npm install -g expo-cli`

### Backend Setup (Python)

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run Flask server
python app.py
```

The backend will start at `http://0.0.0.0:5000`

### Frontend Setup (React Native)

```bash
cd neuromotion

# Install dependencies
npm install

# Start Expo development server
npm start

# Run on iOS (macOS only)
npm run ios

# Run on Android (requires Android SDK)
npm run android

# Run on Web
npm run web
```

---

## 🔗 API Endpoints

### Real-time Pose Detection
```
POST /api/pose
```
**Request:**
```json
{
  "image": "base64-encoded-image-string",
  "exercise": "squat"  // or "shoulder_raise", "elbow_flexion"
}
```

**Response:**
```json
{
  "detected": true,
  "angles": {
    "left_hip": 85.5,
    "right_hip": 87.2,
    "left_knee": 92.1,
    "right_knee": 91.8,
    "spine": 15.3,
    "left_shoulder_raise": 45.0,
    "right_shoulder_raise": 46.2
  },
  "primary_angle": 91.95,
  "landmarks": {
    "left_shoulder": [0.42, 0.35],
    "right_shoulder": [0.58, 0.35],
    // ... more joint positions
  },
  "feedback": [
    "⚠️ Leaning too far forward — keep chest up",
    "ℹ️ Very deep squat — watch knee strain"
  ]
}
```

### Exercise List
```
GET /api/exercises
```

### Score Calculation
```
POST /api/score
```
**Request:**
```json
{
  "total_reps": 10,
  "correct_reps": 9,
  "avg_angle": 92,
  "variation": 8.5,
  "user_metrics": {
    "age": 45,
    "height": 170,
    "weight": 75
  }
}
```

**Response:**
```json
{
  "accuracy": 90,
  "rom_score": 85,
  "consistency": 85,
  "final_score": 87,
  "grade": "B",
  "risk_level": "low",
  "feedback": [
    "Excellent form accuracy!",
    "Great range of motion achieved.",
    "Very consistent reps — great control."
    // ... exercise-specific feedback
  ]
}
```

### Health Check
```
GET /api/health
```

---

## 🎓 How It Works

### Physical Rehabilitation Flow

1. **User Starts Session** — Selects exercise and sets up camera
2. **Real-time Pose Detection** — Backend analyzes each frame via `/api/pose`
3. **Form Validation** — App calculates joint angles and compares to expected ranges
4. **Live Feedback** — User receives instant corrections ("Keep chest up", "Go deeper")
5. **Rep Tracking** — System counts successful reps and records metrics
6. **Session Analysis** — After session, comprehensive scoring via `/api/score`
7. **Progress Tracking** — Results stored in Firestore for long-term analysis

### Pose Detection Pipeline

```
Camera Frame → Base64 Encoding → Flask Backend
    ↓
cv2.imread() → RGB Conversion
    ↓
MediaPipe PoseLandmarker.detect()
    ↓
Extract 33 Joint Landmarks (normalized 0-1 coordinates)
    ↓
Calculate Angles Between Joint Triplets
    ↓
Generate Feedback Based on Exercise Type
    ↓
Return JSON with angles, landmarks, and guidance
```

---

## 🔧 Scoring Algorithm

The final performance score is calculated as:

```
Final Score = (Accuracy × 0.5) + (ROM Score × 0.3) + (Consistency × 0.2)

Where:
- Accuracy = (Correct Reps / Total Reps) × 100
- ROM Score = Based on distance from ideal angle (adjusted for age/BMI)
- Consistency = How uniform reps are (reduced by angle variation)
```

**Grade Mapping:**
- A: 90-100
- B: 80-89
- C: 70-79
- D: 60-69
- F: <60

---

## 📱 Navigation Structure

### Authentication Flow
```
Landing Page → Login/Signup → Role Selection → Onboarding
```

### Patient Flow (Physical Therapy)
```
Dashboard → Select Exercise → Camera Setup → Live Session → Results
```

### Doctor Flow
```
Dashboard → Patient List → Select Patient → View Progress → Adjust Plan
```

### Cognitive Module
```
Cognitive Dashboard → Cognitive Exercises → Progress Tracking
```

---

## 🔐 Security & Privacy

- **Firebase Auth** — Secure user authentication with email/password or OAuth
- **Firestore Security Rules** — Role-based access control
- **CORS Enabled** — Secure cross-origin requests
- **Thread-Safe Pose Detection** — Mutex locks prevent concurrent processing issues
- **Base64 Image Encoding** — Secure image transmission

---

## 📊 Key Dependencies

| Package | Version | Purpose |
|---------|---------|---------|
| expo | ~54.0.33 | App framework |
| react-native | 0.81.5 | UI framework |
| firebase | 12.11.0 | Backend services |
| expo-camera | ~17.0.10 | Camera access |
| react-native-reanimated | ~4.1.1 | Animations |
| victory-native | 41.20.2 | Charts |
| mediapipe | 0.10+ | Pose detection |
| flask | 2.0+ | REST API |
| opencv-python | 4.5+ | Image processing |

---

## 🚀 Getting Started

### Quick Start

```bash
# 1. Clone repository
git clone https://github.com/Ayush-Bhunya05/NeuroMotion.git
cd NeuroMotion

# 2. Set up backend
cd backend
pip install -r requirements.txt
python app.py  # Runs on http://localhost:5000

# 3. In a new terminal, set up frontend
cd neuromotion
npm install
npm start

# 4. Choose platform
# - Press 'i' for iOS simulator
# - Press 'a' for Android emulator
# - Press 'w' for Web browser
```

### Environment Variables

Create `.env` file in `neuromotion/` directory:
```
EXPO_PUBLIC_FIREBASE_API_KEY=your_key
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=your_domain
EXPO_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=your_bucket
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
EXPO_PUBLIC_FIREBASE_APP_ID=your_app_id
EXPO_PUBLIC_GOOGLE_MAPS_API_KEY=your_maps_key
```

---

## 📈 Development Roadmap

- [ ] Video file analysis endpoint (batch processing)
- [ ] Additional exercises (lunges, push-ups, bridges)
- [ ] Voice-guided workouts
- [ ] Wearable device integration (Apple Watch, Fitbit)
- [ ] Advanced ML models for injury prediction
- [ ] Multiplayer therapy sessions
- [ ] Offline mode for mobile app
- [ ] Augmented Reality exercise visualization

---

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License — see the LICENSE file for details.

---

## 📞 Support

For issues, questions, or feature requests:
- **GitHub Issues** — [Report a bug](https://github.com/Ayush-Bhunya05/NeuroMotion/issues)
- **Email** — [Contact us](mailto:support@neuromotion.ai)

---

## 🙏 Acknowledgments

- **MediaPipe** — For providing robust pose detection models
- **Expo** — For streamlined cross-platform development
- **Firebase** — For reliable backend infrastructure
- **Community** — For feedback and contributions

---

## 📊 Project Stats

- **Languages** — TypeScript (96.8%), Python (2.7%), JavaScript (0.5%)
- **Frontend Framework** — React Native + Expo
- **Backend** — Python Flask
- **Database** — Cloud Firestore
- **Model** — MediaPipe Pose Landmarker Lite

---

**Made with ❤️ by [Ayush Bhunya](https://github.com/Ayush-Bhunya05)**

🌟 If you find NeuroMotion AI helpful, please consider starring the repository!
