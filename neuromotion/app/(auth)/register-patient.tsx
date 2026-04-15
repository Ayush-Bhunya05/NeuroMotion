// NeuroMotion AI — Patient Registration
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useRouter } from 'expo-router';
import { colors, typography, spacing, borderRadius } from '../../src/theme';
import GlassCard from '../../src/components/ui/GlassCard';
import GradientButton from '../../src/components/ui/GradientButton';
import Header from '../../src/components/shared/Header';
import { useApp } from '../../src/contexts/AppContext';

import { auth, db } from '../../src/services/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSharedValue, useAnimatedStyle, withTiming, interpolate, withSequence, withDelay } from 'react-native-reanimated';

// Memory Card Component for 3D Flip
const MemoryCard = ({ icon, isOpen, onPress, disabled }: { icon: string, isOpen: boolean, onPress: () => void, disabled?: boolean }) => {
  const rotation = useSharedValue(0);

  React.useEffect(() => {
    rotation.value = withTiming(isOpen ? 180 : 0, { duration: 400 });
  }, [isOpen]);

  const frontStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value}deg` }],
    backfaceVisibility: 'hidden',
  }));

  const backStyle = useAnimatedStyle(() => ({
    transform: [{ rotateY: `${rotation.value + 180}deg` }],
    backfaceVisibility: 'hidden',
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  }));

  return (
    <Pressable 
      onPress={onPress} 
      disabled={disabled}
      style={[{ width: '23%', margin: '1%', height: 90 }]}
    >
      <Animated.View style={[styles.memoryBtn, frontStyle, { borderColor: 'rgba(255,255,255,0.08)', backgroundColor: '#0F111A' }]}>
        <Ionicons name="help" size={26} color="rgba(255,255,255,0.15)" />
      </Animated.View>
      <Animated.View style={[styles.memoryBtn, backStyle, { borderColor: colors.cognitive, backgroundColor: 'rgba(108, 93, 211, 0.2)' }]}>
        <Ionicons name={icon as any} size={30} color={colors.cognitive} />
      </Animated.View>
    </Pressable>
  );
};

export default function RegisterPatient() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { dispatch } = useApp();
  
  // Step Management
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  
  const [goal, setGoal] = useState<'physical' | 'cognitive' | 'dual' | null>(null);
  
  // Physical Profile
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activityLevel, setActivityLevel] = useState<'low' | 'moderate' | 'high' | null>(null);
  
  // Joint Selection
  const [selectedJoints, setSelectedJoints] = useState<string[]>([]);
  
  // Joint Details (Dictionary: shoulder, knee, elbow)
  const [jointData, setJointData] = useState<Record<string, any>>({});

  const toggleJoint = (joint: string) => {
    setSelectedJoints(prev => prev.includes(joint) ? prev.filter(j => j !== joint) : [...prev, joint]);
  };

  const updateJointField = (joint: string, field: string, value: any) => {
    setJointData(prev => ({
      ...prev,
      [joint]: { ...(prev[joint] || {}), [field]: value }
    }));
  };

  // Cognitive State
  const [cognitiveIssues, setCognitiveIssues] = useState<string[]>([]);
  const [cognitiveResults, setCognitiveResults] = useState<Record<string, any>>({});
  const [currentTestKey, setCurrentTestKey] = useState<string | null>(null);
  const [testActive, setTestActive] = useState(false);
  const [testStep, setTestStep] = useState(0); // 0: Issues, 1+: Games

  const toggleCognitiveIssue = (issue: string) => {
    setCognitiveIssues(prev => 
      prev.includes(issue) ? prev.filter(i => i !== issue) : [...prev, issue]
    );
  };

  const handleNext = async () => {
    if (step === 1) {
      if (!name || !email || !contact || !password) {
        setErrorMsg('Please fill in all account details.');
        return;
      }
      
      if (!email.includes('@')) {
        setErrorMsg('Please enter a valid email addressing containing "@"');
        return;
      }

      if (contact.length > 10) {
        setErrorMsg('Phone number cannot exceed 10 digits.');
        return;
      }

      if (name.trim().toLowerCase() === email.trim().toLowerCase()) {
        setErrorMsg('Full name and email address cannot be identical.');
        return;
      }

      if (password.length < 6) {
        setErrorMsg('Password must be at least 6 characters.');
        return;
      }
      
      setLoading(true);
      setErrorMsg('');
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', email.toLowerCase().trim()));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setErrorMsg('This email is already registered.');
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Email check error:', err);
      }
      setLoading(false);
    }
    
    if (step === 2 && !goal) {
      setErrorMsg('Please select a primary goal.');
      return;
    }

    // Dual flow step adjustments
    if (goal === 'dual') {
      if (step === 3 && (!height || !weight || !activityLevel)) {
         setErrorMsg('Please complete all physical profile fields.');
         return;
      }
      if (step === 4 && selectedJoints.length === 0) {
         setErrorMsg('Please select at least one joint.');
         return;
      }
      if (step === 5 && cognitiveIssues.length === 0) {
         setErrorMsg('Please select at least one cognitive challenge.');
         return;
      }
    } else {
      // Single flow validation
      if (step === 3) {
        if (goal === 'physical') {
          if (!height || !weight || !activityLevel) {
            setErrorMsg('Please complete all physical profile fields.');
            return;
          }
        } else {
          if (cognitiveIssues.length === 0) {
            setErrorMsg('Please select at least one challenge.');
            return;
          }
        }
      }
    }
    setErrorMsg('');
    setStep(prev => prev + 1);
  };

  const handleBack = () => {
    if (step === 4) {
      setCognitiveResults({});
      setTestActive(false);
      setCurrentTestKey('');
      setGameState({});
    }
    if (step > 1) setStep(prev => prev - 1);
  };

  const handleRegister = async () => {
    if (goal === 'physical' && step === 5) {
      for (const joint of selectedJoints) {
        const jData = jointData[joint] || {};
        
        // Default pain level to 1 if untouched
        const painLevel = jData.pain_level !== undefined ? jData.pain_level : 1;
        updateJointField(joint, 'pain_level', painLevel);
        jData.pain_level = painLevel;

        // Common validation
        if (!jData.pain_type || !jData.mobility_level || !jData.pain_timing || !jData.injury_present) {
          setErrorMsg(`Please complete all general questions for the ${joint}.`);
          return;
        }

        if (jData.injury_present === 'yes' && !jData.duration) {
          setErrorMsg(`Please specify the injury duration for the ${joint}.`);
          return;
        }

        if (!jData.pain_triggers || jData.pain_triggers.length === 0) {
          setErrorMsg(`Please select at least one pain trigger for the ${joint}.`);
          return;
        }

        // Specific validation
        if (joint === 'shoulder') {
          if (!jData.arm_raise_level || !jData.rotation_ability) {
            setErrorMsg(`Please complete all shoulder-specific questions.`);
            return;
          }
        }
        if (joint === 'knee') {
          if (!jData.knee_bend_ability || !jData.knee_straighten_ability) {
            setErrorMsg(`Please complete all knee-specific questions.`);
            return;
          }
        }
      }
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, password);
      
      // Initial Score Calculations
      let initialCognitiveScore = 0;
      if (goal === 'cognitive' || goal === 'dual') {
        const memAcc = cognitiveResults.memory?.accuracy || 0;
        const focusAcc = cognitiveResults.attentionScore || 0;
        const rtMs = cognitiveResults.reactionTimeMs || 0;
        const rtScore = rtMs > 0 ? Math.max(0, 100 - (rtMs - 200) / 10) : 0;
        const metrics = [memAcc, focusAcc, rtScore].filter(m => m > 0);
        initialCognitiveScore = metrics.length > 0 ? Math.round(metrics.reduce((a, b) => a + b, 0) / metrics.length) : 0;
      }

      let initialPhysicalScore = 0;
      if (goal === 'physical' || goal === 'dual') {
        // Average inverse pain (Pain 1 = 100%, Pain 10 = 0%)
        const pains = Object.values(jointData).map((j: any) => j.pain_level || 1);
        const avgPain = pains.length > 0 ? pains.reduce((a, b) => a + b, 0) / pains.length : 1;
        initialPhysicalScore = Math.round(Math.max(0, 100 - (avgPain - 1) * 11));
      }

      const assessmentData = {
        id: userCred.user.uid,
        name,
        email,
        contact,
        role: 'user',
        rehabGoal: goal,
        // Physical Data
        physicalProfile: (goal === 'physical' || goal === 'dual') ? { height, weight, activityLevel } : null,
        physicalAssessment: (goal === 'physical' || goal === 'dual') ? { selectedJoints, jointData } : null,
        // Cognitive Data
        cognitiveIssues: (goal === 'cognitive' || goal === 'dual') ? cognitiveIssues : null,
        cognitiveBaseline: (goal === 'cognitive' || goal === 'dual') ? cognitiveResults : null,
        
        progress: { physical: 0, cognitive: 0 },
        score: { physical: initialPhysicalScore, cognitive: initialCognitiveScore },
        guardians: [],
        createdAt: new Date().toISOString()
      };
      await setDoc(doc(db, 'users', userCred.user.uid), assessmentData);

      if (goal === 'dual') {
        dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'dual' });
        router.replace('/(shared)/dashboard');
      } else if (goal === 'physical') {
        dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'physical' });
        router.replace('/(physical)/dashboard');
      } else {
        dispatch({ type: 'SET_ACTIVE_MODULE', payload: 'cognitive' });
        router.replace('/(cognitive)/dashboard');
      }
    } catch (error: any) {
      setErrorMsg(error.message || 'Registration failed.');
      setLoading(false);
    }
  };

  const renderStepIndicator = () => {
    const totalSteps = goal === 'dual' ? 7 : 5;
    return (
      <View style={styles.stepIndicator}>
        {Array.from({ length: totalSteps }).map((_, i) => {
          const s = i + 1;
          return (
            <View 
              key={s} 
              style={[
                styles.stepDot, 
                step >= s && styles.stepDotActive,
                step === s && styles.stepDotCurrent
              ]} 
            />
          );
        })}
      </View>
    );
  };

  const renderStep1 = () => (
    <Animated.View key="step1" entering={FadeInDown.duration(400)} style={styles.formCard}>
      <GlassCard style={styles.innerCard}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Full Name</Text>
          <TextInput value={name} onChangeText={setName} placeholder="John Doe" placeholderTextColor={colors.textMuted} style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Email Address</Text>
          <TextInput value={email} onChangeText={setEmail} placeholder="name@example.com" placeholderTextColor={colors.textMuted} keyboardType="email-address" autoCapitalize="none" style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Contact Number</Text>
          <TextInput value={contact} onChangeText={setContact} placeholder="1234567890" placeholderTextColor={colors.textMuted} keyboardType="number-pad" maxLength={10} style={styles.input} />
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Password</Text>
          <TextInput value={password} onChangeText={setPassword} placeholder="Create a password" placeholderTextColor={colors.textMuted} secureTextEntry style={styles.input} />
        </View>
        <GradientButton title="Next Step" onPress={handleNext} fullWidth size="lg" />
      </GlassCard>
    </Animated.View>
  );

  const renderStep2 = () => (
    <Animated.View key="step2" entering={FadeInDown.duration(400)} style={styles.formCard}>
      <Text style={styles.stepTitle}>Choose Your Path</Text>
      <View style={styles.choiceGrid}>
        <Pressable 
          onPress={() => setGoal('physical')} 
          style={[styles.choiceCard, goal === 'physical' && styles.choiceActive]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.physical + '20' }]}>
            <Ionicons name="body-outline" size={32} color={colors.physical} />
          </View>
          <Text style={styles.choiceLabel}>Physical Rehab</Text>
          <Text style={styles.choiceDesc}>Joint recovery & mobility</Text>
        </Pressable>
        <Pressable 
          onPress={() => setGoal('cognitive')} 
          style={[styles.choiceCard, goal === 'cognitive' && styles.choiceActive]}
        >
          <View style={[styles.iconCircle, { backgroundColor: colors.cognitive + '20' }]}>
            <Ionicons name="bulb-outline" size={32} color={colors.cognitive} />
          </View>
          <Text style={styles.choiceLabel}>Cognitive Training</Text>
          <Text style={styles.choiceDesc}>Memory & focus exercises</Text>
        </Pressable>
        <Pressable 
          onPress={() => setGoal('dual')} 
          style={[styles.choiceCard, goal === 'dual' && styles.choiceActive, { borderColor: '#8B5CF6', backgroundColor: 'rgba(139, 92, 246, 0.05)' }]}
        >
          <View style={[styles.iconCircle, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <View style={{ flexDirection: 'row' }}>
              <Ionicons name="body-outline" size={24} color={colors.physical} />
              <Ionicons name="add" size={24} color="#8B5CF6" />
              <Ionicons name="bulb-outline" size={24} color={colors.cognitive} />
            </View>
          </View>
          <Text style={[styles.choiceLabel, { color: '#8B5CF6' }]}>Both</Text>
          <Text style={styles.choiceDesc}>Complete physical & cognitive care</Text>
        </Pressable>
      </View>
      <View style={styles.btnRow}>
        <GradientButton title="Back" onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <GradientButton title="Next" onPress={handleNext} style={{ flex: 2 }} loading={loading} />
      </View>
    </Animated.View>
  );

  const renderStep3Cognitive = () => (
    <Animated.View key="step3-cog" entering={FadeInDown.duration(400)} style={styles.formCard}>
      <Text style={styles.stepTitle}>Tell us about your challenges</Text>
      <Text style={styles.stepSubtitle}>This helps us personalize your training</Text>
      
      <ScrollView style={{ maxHeight: 450 }} showsVerticalScrollIndicator={false}>
        <View style={styles.challengeGrid}>
          {[
            { id: 'memory', label: 'Memory issues', icon: 'brain-outline' },
            { id: 'focus', label: 'Lack of focus', icon: 'eye-outline' },
            { id: 'thinking', label: 'Slow thinking / reaction', icon: 'timer-outline' },
            { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
          ].map(item => {
            const isSelected = cognitiveIssues.includes(item.id);
            return (
              <Pressable 
                key={item.id} 
                onPress={() => toggleCognitiveIssue(item.id)}
                style={[
                  styles.challengeCard, 
                  isSelected && styles.challengeCardActive
                ]}
              >
                <View style={[
                  styles.iconCircle, 
                  { backgroundColor: isSelected ? colors.cognitive : 'rgba(255,255,255,0.05)', width: 44, height: 44 }
                ]}>
                  <Ionicons 
                    name={item.icon as any} 
                    size={22} 
                    color={isSelected ? '#fff' : colors.textMuted} 
                  />
                </View>
                <Text style={[
                  styles.challengeLabel, 
                  isSelected && { color: colors.cognitive, fontWeight: '700' }
                ]}>{item.label}</Text>
                
                {isSelected && (
                   <View style={styles.selectedIndicator}>
                     <Ionicons name="checkmark-circle" size={18} color={colors.cognitive} />
                   </View>
                )}
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <View style={[styles.btnRow, { marginTop: spacing.xl }]}>
        <GradientButton title="Back" onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <GradientButton 
          title="Start Baseline Tests" 
          onPress={handleNext} 
          disabled={cognitiveIssues.length === 0}
          style={{ flex: 2 }} 
        />
      </View>
    </Animated.View>
  );

  const [gameState, setGameState] = useState<any>({});
  
  React.useEffect(() => {
    if (currentTestKey === 'memory' && gameState.phase === 'preview') {
      const timer = setTimeout(() => {
        setGameState((prev: any) => ({ ...prev, phase: 'input', startTime: Date.now() }));
      }, 10000); // 10 second preview
      return () => clearTimeout(timer);
    }
  }, [currentTestKey, gameState.phase]);

  // Game Timer Effect
  const [elapsedTime, setElapsedTime] = useState(0);
  React.useEffect(() => {
    let interval: any;
    if (currentTestKey === 'memory' && gameState.phase === 'input') {
      interval = setInterval(() => {
        setElapsedTime(Math.floor((Date.now() - (gameState.startTime || Date.now())) / 1000));
      }, 1000);
    } else {
      setElapsedTime(0);
    }
    return () => clearInterval(interval);
  }, [currentTestKey, gameState.phase, gameState.startTime]);
  
  const startNextGame = (finishedKey?: string) => {
    let sequence: string[] = [];
    if (cognitiveIssues.includes('other')) {
      sequence = ['memory', 'focus', 'thinking'];
    } else {
      const selected = [];
      if (cognitiveIssues.includes('memory')) selected.push('memory');
      if (cognitiveIssues.includes('focus')) selected.push('focus');
      if (cognitiveIssues.includes('thinking')) selected.push('thinking');
      sequence = selected;
    }
    
    if (sequence.length === 0) sequence = ['thinking'];

    const completed = [...(cognitiveResults.sequence || [])];
    if (finishedKey) completed.push(finishedKey);
    
    const nextGame = sequence.find(s => !completed.includes(s));

    if (nextGame) {
      setCurrentTestKey(nextGame);
      setTestActive(true);
      if (nextGame === 'memory') {
        const icons = ['star', 'heart', 'sunny', 'moon', 'leaf', 'bulb'];
        const pattern = [...icons, ...icons].sort(() => Math.random() - 0.5);
        setGameState({ 
          pattern, 
          flipped: [], 
          matched: [], 
          wrongAttempts: 0, 
          phase: 'preview', 
          startTime: Date.now() 
        });
      }
      if (nextGame === 'focus') setGameState({ currentColor: colors.textMuted, count: 0, wrongAttempts: 0, intervalStarted: false });
      if (nextGame === 'thinking') setGameState({ round: 1, ready: false, timerStarted: false, results: [] });
    } else {
      setTestActive(false);
      handleNext();
    }
  };

  const renderStep4Cognitive = () => {
    if (!testActive) {
      return (
        <Animated.View key="step4-cog-intro" entering={FadeInDown.duration(400)} style={styles.formCard}>
          <Text style={styles.stepTitle}>Tailored Assessment</Text>
          <GlassCard style={styles.innerCard}>
            <Text style={styles.stepSubtitle}>To personalize your profile, we have prepared short baseline tests based on your selected challenges.</Text>
            <View style={{ gap: spacing.md, marginBottom: 20 }}>
              {cognitiveIssues.includes('memory') || cognitiveIssues.includes('other') ? (
                <View style={styles.infoRow}><Ionicons name="apps-outline" size={20} color={colors.cognitive} /><Text style={styles.infoLabel}>Memory Card</Text></View>
              ) : null}
              {cognitiveIssues.includes('focus') || cognitiveIssues.includes('other') ? (
                <View style={styles.infoRow}><Ionicons name="eye-outline" size={20} color={colors.cognitive} /><Text style={styles.infoLabel}>Attention Stability Test</Text></View>
              ) : null}
              {cognitiveIssues.includes('thinking') || cognitiveIssues.includes('other') ? (
                <View style={styles.infoRow}><Ionicons name="flash-outline" size={20} color={colors.cognitive} /><Text style={styles.infoLabel}>Quick Reaction</Text></View>
              ) : null}
            </View>
            <GradientButton title="Start Assessments" onPress={startNextGame} fullWidth size="lg" />
          </GlassCard>
        </Animated.View>
      );
    }

    if (currentTestKey === 'memory') {
      const isPreview = gameState.phase === 'preview';
      const handleCardPress = (index: number) => {
        if (isPreview || gameState.matched.includes(index) || gameState.flipped.includes(index) || gameState.flipped.length >= 2) return;
        
        const newFlipped = [...gameState.flipped, index];
        setGameState((prev: any) => ({ ...prev, flipped: newFlipped }));

        if (newFlipped.length === 2) {
          const [first, second] = newFlipped;
          if (gameState.pattern[first] === gameState.pattern[second]) {
            const newMatched = [...gameState.matched, first, second];
            setTimeout(() => {
              setGameState((prev: any) => ({ ...prev, flipped: [], matched: newMatched }));
              if (newMatched.length === gameState.pattern.length) {
                const totalTime = Math.round((Date.now() - (gameState.startTime || Date.now())) / 1000);
                setCognitiveResults((prev: any) => ({
                  ...prev,
                  memory: { accuracy: 100, mistakes: gameState.wrongAttempts, time: totalTime },
                  sequence: [...(prev.sequence || []), 'memory']
                }));
                setTimeout(() => {
                  setTestActive(false);
                  startNextGame('memory');
                }, 1000);
              }
            }, 600);
          } else {
            const newWrongAttempts = (gameState.wrongAttempts || 0) + 1;
            setTimeout(() => {
              if (newWrongAttempts >= 10) {
                setCognitiveResults((prev: any) => ({
                  ...prev,
                  memory: { accuracy: 0, mistakes: newWrongAttempts, time: 0 },
                  sequence: [...(prev.sequence || []), 'memory']
                }));
                setTestActive(false);
                startNextGame();
                return;
              }
              setGameState((prev: any) => ({ 
                ...prev, 
                flipped: [], 
                wrongAttempts: newWrongAttempts 
              }));
            }, 1000);
          }
        }
      };

      return (
        <View style={styles.formCard}>
          <View style={styles.gameStatsHeader}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>TIME</Text>
              <Text style={styles.statValue}>{elapsedTime}s</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>MATCHES</Text>
              <Text style={styles.statValue}>{gameState.matched.length / 2} <Text style={{fontSize: 12, color: colors.textMuted}}>/ 6</Text></Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ERRORS</Text>
              <Text style={[styles.statValue, { color: (gameState.wrongAttempts || 0) > 3 ? colors.error : colors.cognitive }]}>{gameState.wrongAttempts || 0}</Text>
            </View>
          </View>

          <Text style={[styles.stepSubtitle, { marginBottom: spacing.md, marginTop: -spacing.sm }]}>
            {isPreview ? "Memorize card locations!" : "Find all matching pairs"}
          </Text>

          <View style={styles.memoryGrid}>
            {gameState.pattern.map((icon: string, idx: number) => (
              <MemoryCard 
                key={idx}
                icon={icon}
                isOpen={isPreview || gameState.flipped.includes(idx) || gameState.matched.includes(idx)}
                onPress={() => handleCardPress(idx)}
                disabled={isPreview}
              />
            ))}
          </View>
        </View>
      );
    }

    if (currentTestKey === 'thinking') {
      return (
        <View style={styles.formCard}>
          <Text style={styles.stepTitle}>Reaction Test (Round {gameState.round}/3)</Text>
          <Text style={styles.stepSubtitle}>Tap as SOON as the screen turns GREEN!</Text>
          <Pressable 
            onPress={() => {
              if (gameState.ready) {
                const rt = Date.now() - gameState.startTime;
                const newResults = [...(gameState.results || []), rt];
                
                if (gameState.round < 3) {
                  setGameState((prev: any) => ({ 
                    ...prev, 
                    round: prev.round + 1, 
                    ready: false, 
                    timerStarted: false,
                    results: newResults 
                  }));
                } else {
                  const avgRT = Math.round(newResults.reduce((a, b) => a + b, 0) / 3);
                  setCognitiveResults((prev: any) => ({ 
                    ...prev, 
                    reactionTimeMs: avgRT, 
                    sequence: [...(prev.sequence || []), 'thinking'] 
                  }));
                  setTestActive(false);
                  startNextGame('thinking');
                }
              } else {
                setErrorMsg("Wait for green!");
                setTimeout(() => setErrorMsg(''), 1000);
              }
            }}
            style={[styles.gameArea, { backgroundColor: gameState.ready ? '#4CAF50' : '#FF5252' }]}
          >
            <Text style={styles.gameText}>{gameState.ready ? 'TAP NOW!' : 'WAIT...'}</Text>
          </Pressable>
          {!gameState.timerStarted && (
            <View>
              {(() => {
                const timer = setTimeout(() => {
                  setGameState((prev: any) => ({ ...prev, ready: true, startTime: Date.now(), timerStarted: true }));
                }, 3000 + Math.random() * 4000); // Slower delay
                return null;
              })()}
            </View>
          )}
        </View>
      );
    }

    if (currentTestKey === 'focus') {
      const COLORS = [colors.cognitive, '#E53935', '#1E88E5', '#43A047', '#FB8C00'];
      return (
        <View style={styles.formCard}>
          <Text style={styles.stepTitle}>Attention Test</Text>
          <Text style={styles.stepSubtitle}>Tap the circle ONLY when it is PURPLE!</Text>
          <View style={styles.gameContainer}>
            <Pressable 
              onPress={() => {
                if (gameState.currentColor === colors.cognitive) {
                  const newCount = (gameState.count || 0) + 1;
                  if (newCount >= 5) {
                    const finalScore = Math.max(0, 100 - ((gameState.wrongAttempts || 0) * 10));
                    setCognitiveResults((prev: any) => ({ 
                      ...prev, 
                      attentionScore: finalScore, 
                      attentionMistakes: gameState.wrongAttempts || 0,
                      sequence: [...(prev.sequence || []), 'focus'] 
                    }));
                    setTestActive(false);
                    startNextGame('focus');
                  } else {
                    setGameState((prev: any) => ({ ...prev, count: newCount }));
                  }
                } else {
                  const newWrong = (gameState.wrongAttempts || 0) + 1;
                  setGameState((prev: any) => ({ ...prev, wrongAttempts: newWrong }));
                  setErrorMsg("Wrong! Wait for PURPLE.");
                  setTimeout(() => setErrorMsg(''), 1000);
                }
              }}
              style={[styles.targetCircle, { backgroundColor: gameState.currentColor || colors.textMuted }]}
            />
            <View style={styles.statsRow}>
              <Text style={styles.scoreText}>Hits: {gameState.count || 0} / 5</Text>
              <Text style={[styles.scoreText, { color: colors.error }]}>Errors: {gameState.wrongAttempts || 0}</Text>
            </View>
          </View>
          {!gameState.intervalStarted && (
            <View>
              {(() => {
                const int = setInterval(() => {
                  setGameState((prev: any) => {
                    const others = ['#E53935', '#1E88E5', '#43A047', '#FB8C00'];
                    // 40% chance for Target Purple, 60% split across others
                    const nextColor = Math.random() < 0.4 ? colors.cognitive : others[Math.floor(Math.random() * others.length)];
                    return { 
                      ...prev, 
                      currentColor: nextColor, 
                      intervalStarted: true 
                    };
                  });
                }, 1200);
                return null;
              })()}
            </View>
          )}
        </View>
      );
    }

    return (
       <View style={styles.formCard}>
         <Text style={styles.stepTitle}>Initial Baseline...</Text>
         <Text style={styles.stepSubtitle}>Preparing your personalized assessment...</Text>
         <GradientButton title="Start First Test" onPress={startNextGame} fullWidth size="lg" />
       </View>
    );
  };

  const renderStep5Cognitive = () => (
    <Animated.View key="step5-cog" entering={FadeInDown.duration(400)} style={styles.formCard}>
      <Text style={styles.stepTitle}>Registration Ready</Text>
      <GlassCard style={styles.innerCard}>
        <View style={styles.avatarSection}>
          <Ionicons name="checkmark-circle" size={80} color="#4CAF50" />
          <Text style={styles.choiceLabel}>Tests Complete</Text>
          <Text style={styles.stepSubtitle}>We've personalized your cognitive training plan based on your results.</Text>
        </View>
        <GradientButton title="Complete Registration" onPress={handleRegister} loading={loading} fullWidth size="lg" />
      </GlassCard>
    </Animated.View>
  );
  const renderStep3Physical = () => (
    <Animated.View key="step3-phys" entering={FadeInDown.duration(400)} style={styles.formCard}>
      <Text style={styles.stepTitle}>Physical Profile</Text>
      <GlassCard style={styles.innerCard}>
        <View style={styles.inputRow}>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Height (cm)</Text>
            <TextInput value={height} onChangeText={setHeight} placeholder="180" keyboardType="numeric" style={styles.input} />
          </View>
          <View style={[styles.inputGroup, { flex: 1 }]}>
            <Text style={styles.label}>Weight (kg)</Text>
            <TextInput value={weight} onChangeText={setWeight} placeholder="75" keyboardType="numeric" style={styles.input} />
          </View>
        </View>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Activity Level</Text>
          <View style={styles.chipRow}>
            {['low', 'moderate', 'high'].map(level => (
              <Pressable 
                key={level} 
                onPress={() => setActivityLevel(level as any)}
                style={[styles.chip, activityLevel === level && styles.chipActive]}
              >
                <Text style={[styles.chipText, activityLevel === level && styles.chipTextActive]}>{level.charAt(0).toUpperCase() + level.slice(1)}</Text>
              </Pressable>
            ))}
          </View>
        </View>
        <View style={styles.btnRow}>
          <GradientButton title="Back" onPress={handleBack} variant="outline" style={{ flex: 1 }} />
          <GradientButton title="Next" onPress={handleNext} style={{ flex: 2 }} />
        </View>
      </GlassCard>
    </Animated.View>
  );

  const renderStep4Physical = () => (
    <Animated.View key="step4-phys" entering={FadeInDown.duration(400)} style={styles.formCard}>
      <Text style={styles.stepTitle}>Select Affected Joints</Text>
      <Text style={styles.stepSubtitle}>Which areas need rehabilitation? (Select all that apply)</Text>
      <View style={styles.jointGrid}>
        {['shoulder', 'knee'].map(joint => (
          <Pressable 
            key={joint} 
            onPress={() => toggleJoint(joint)}
            style={[styles.jointCard, selectedJoints.includes(joint) && styles.jointActive]}
          >
            <Ionicons 
              name={selectedJoints.includes(joint) ? "checkbox" : "square-outline"} 
              size={24} 
              color={selectedJoints.includes(joint) ? colors.primary : colors.textMuted} 
            />
            <Text style={styles.jointLabel}>{joint.charAt(0).toUpperCase() + joint.slice(1)}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.btnRow}>
        <GradientButton title="Back" onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <GradientButton 
          title="Start Assessment" 
          onPress={() => selectedJoints.length > 0 ? handleNext() : setErrorMsg('Please select at least one joint.')} 
          style={{ flex: 2 }} 
        />
      </View>
    </Animated.View>
  );

  const renderStep5Physical = () => (
    <Animated.View key="step5-phys" entering={FadeInDown.duration(400)} style={styles.formCard}>
      <ScrollView style={{ maxHeight: 550 }} showsVerticalScrollIndicator={false}>
        {/* Unified Clinical Assessment */}
        <Text style={styles.stepTitle}>Clinical Assessment</Text>
        
        {/* Pain intensity - Unified Slider */}
        {selectedJoints.length > 0 && (
          <Animated.View entering={FadeInDown.duration(400)} style={[styles.assessmentSection, { borderBottomWidth: 0, paddingBottom: 0 }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: colors.textPrimary, fontSize: 15 }]}>
                Pain Level (1-10): <Text style={{ fontWeight: '800' }}>{jointData[selectedJoints[0]]?.pain_level || 1}</Text>
              </Text>
              <Slider
                style={{ width: '100%', height: 45 }}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={jointData[selectedJoints[0]]?.pain_level || 1}
                onValueChange={(val) => {
                  // Apply same pain level to all selected joints for unified assessment
                  selectedJoints.forEach(joint => updateJointField(joint, 'pain_level', val));
                }}
                minimumTrackTintColor="#000000"
                maximumTrackTintColor="rgba(0,0,0,0.1)"
                thumbTintColor="#000000"
              />
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 4 }}>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>No Pain</Text>
                <Text style={{ fontSize: 10, color: colors.textMuted }}>Severe</Text>
              </View>
            </View>
          </Animated.View>
        )}

        {selectedJoints.map((joint) => (
          <View key={joint} style={styles.assessmentSection}>
            <Text style={styles.sectionHeading}>{joint.toUpperCase()} DETAILS</Text>

            {/* Common: Pain Type */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pain Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.hScroll}>
                {['sharp', 'stiffness', 'burning/grinding'].map(type => (
                  <Pressable 
                    key={type} 
                    onPress={() => updateJointField(joint, 'pain_type', type)}
                    style={[styles.miniChip, jointData[joint]?.pain_type === type && styles.miniChipActive]}
                  >
                    <Text style={[styles.miniChipText, jointData[joint]?.pain_type === type && styles.miniChipTextActive]}>{type.charAt(0).toUpperCase() + type.slice(1)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>

            {/* Common: Mobility */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Mobility Level</Text>
              <View style={styles.chipRow}>
                {['full', 'partial'].map(lvl => (
                  <Pressable 
                    key={lvl} 
                    onPress={() => updateJointField(joint, 'mobility_level', lvl)}
                    style={[styles.chip, jointData[joint]?.mobility_level === lvl && styles.chipActive]}
                  >
                    <Text style={[styles.chipText, jointData[joint]?.mobility_level === lvl && styles.chipTextActive]}>{lvl.charAt(0).toUpperCase() + lvl.slice(1)}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Common: Pain Timing */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pain Timing</Text>
              <View style={styles.chipRow}>
                {['movement', 'rest', 'after_activity', 'constant'].map(time => (
                  <Pressable 
                    key={time} 
                    onPress={() => updateJointField(joint, 'pain_timing', time)}
                    style={[styles.miniChip, jointData[joint]?.pain_timing === time && styles.miniChipActive]}
                  >
                    <Text style={[styles.miniChipText, jointData[joint]?.pain_timing === time && styles.miniChipTextActive]}>{time.replace('_', ' ')}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Common: Injury Context */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Is there an active injury?</Text>
              <View style={styles.chipRow}>
                {['yes', 'no'].map(opt => (
                  <Pressable key={opt} onPress={() => updateJointField(joint, 'injury_present', opt)} style={[styles.chip, jointData[joint]?.injury_present === opt && styles.chipActive]}>
                    <Text style={[styles.chipText, jointData[joint]?.injury_present === opt && styles.chipTextActive]}>{opt}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {jointData[joint]?.injury_present === 'yes' && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Injury Duration</Text>
                <View style={styles.chipRow}>
                  {['days', 'weeks', 'months'].map(dur => (
                    <Pressable key={dur} onPress={() => updateJointField(joint, 'duration', dur)} style={[styles.miniChip, jointData[joint]?.duration === dur && styles.miniChipActive]}>
                      <Text style={[styles.miniChipText, jointData[joint]?.duration === dur && styles.miniChipTextActive]}>{dur}</Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Common: Pain Triggers */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Pain Triggers (Select all that apply)</Text>
              <View style={styles.chipRow}>
                {(joint === 'shoulder' ? ['overhead_motion', 'weight', 'repetition'] :
                  ['walking', 'load', 'long_sitting']).map(trigger => (
                  <Pressable 
                    key={trigger} 
                    onPress={() => {
                      const current = jointData[joint]?.pain_triggers || [];
                      const updated = current.includes(trigger) ? current.filter((t: any) => t !== trigger) : [...current, trigger];
                      updateJointField(joint, 'pain_triggers', updated);
                    }}
                    style={[styles.miniChip, jointData[joint]?.pain_triggers?.includes(trigger) && styles.miniChipActive]}
                  >
                    <Text style={[styles.miniChipText, jointData[joint]?.pain_triggers?.includes(trigger) && styles.miniChipTextActive]}>{trigger.replace('_', ' ')}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Joint Specifics */}
            {joint === 'shoulder' && (
              <>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Arm Raise Level</Text>
                  {['above_head', 'shoulder_level', 'below'].map(level => (
                    <Pressable key={level} onPress={() => updateJointField(joint, 'arm_raise_level', level)} style={styles.radioItem}>
                      <Ionicons name={jointData[joint]?.arm_raise_level === level ? "radio-button-on" : "radio-button-off"} size={20} color={colors.primary} />
                      <Text style={styles.radioText}>{level.replace('_', ' ')}</Text>
                    </Pressable>
                  ))}
                </View>
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Rotation Ability</Text>
                  <View style={styles.chipRow}>
                    {['full', 'partial', 'none'].map(opt => (
                      <Pressable key={opt} onPress={() => updateJointField(joint, 'rotation_ability', opt)} style={[styles.miniChip, jointData[joint]?.rotation_ability === opt && styles.miniChipActive]}>
                        <Text style={[styles.miniChipText, jointData[joint]?.rotation_ability === opt && styles.miniChipTextActive]}>{opt}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}

            {joint === 'knee' && (
              <>
                <View style={[styles.inputRow, { marginBottom: spacing.md }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Knee Bend</Text>
                    {['full', 'partial', 'none'].map(lvl => (
                      <Pressable key={lvl} onPress={() => updateJointField(joint, 'knee_bend_ability', lvl)} style={[styles.miniChip, { marginBottom: 4 }, jointData[joint]?.knee_bend_ability === lvl && styles.miniChipActive]}>
                        <Text style={[styles.miniChipText, jointData[joint]?.knee_bend_ability === lvl && styles.miniChipTextActive]}>{lvl}</Text>
                      </Pressable>
                    ))}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.label}>Knee Straighten</Text>
                    {['full', 'partial', 'none'].map(lvl => (
                      <Pressable key={lvl} onPress={() => updateJointField(joint, 'knee_straighten_ability', lvl)} style={[styles.miniChip, { marginBottom: 4 }, jointData[joint]?.knee_straighten_ability === lvl && styles.miniChipActive]}>
                        <Text style={[styles.miniChipText, jointData[joint]?.knee_straighten_ability === lvl && styles.miniChipTextActive]}>{lvl}</Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              </>
            )}
          </View>
        ))}
      </ScrollView>
      <View style={styles.btnRow}>
        <GradientButton title="Back" onPress={handleBack} variant="outline" style={{ flex: 1 }} />
        <GradientButton title="Complete Registration" onPress={handleRegister} loading={loading} style={{ flex: 2 }} />
      </View>
    </Animated.View>
  );

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.bgPrimary, colors.bgSecondary]} style={[styles.container, { paddingTop: insets.top }]}>
        <Header title="" showBack backIconColor={colors.primary} onBackPress={handleBack} />
        
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.header}>
            <Text style={styles.title}>Patient Setup</Text>
            {renderStepIndicator()}
          </View>

          {errorMsg ? <Text style={styles.errorText}>{errorMsg}</Text> : null}

          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          
          {/* Goal-Specific Routing */}
          {goal === 'physical' && (
            <>
              {step === 3 && renderStep3Physical()}
              {step === 4 && renderStep4Physical()}
              {step === 5 && renderStep5Physical()}
            </>
          )}

          {goal === 'cognitive' && (
            <>
              {step === 3 && renderStep3Cognitive()}
              {step === 4 && renderStep4Cognitive()}
              {step === 5 && renderStep5Cognitive()}
            </>
          )}

          {goal === 'dual' && (
            <>
              {step === 3 && renderStep3Physical()}
              {step === 4 && renderStep4Physical()}
              {step === 5 && renderStep3Cognitive()}
              {step === 6 && renderStep4Cognitive()}
              {step === 7 && renderStep5Cognitive()}
            </>
          )}

        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { flexGrow: 1, paddingHorizontal: spacing.xl, paddingBottom: 60 },
  header: { alignItems: 'center', marginBottom: spacing.xl },
  title: { fontSize: 24, fontFamily: typography.fonts.headingBold, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.sm },
  
  stepIndicator: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.glassBorderLight },
  stepDotActive: { backgroundColor: colors.primary, width: 20 },
  stepDotCurrent: { backgroundColor: colors.primary, transform: [{ scale: 1.2 }] },

  formCard: { width: '100%' },
  innerCard: { padding: spacing.lg },
  inputGroup: { marginBottom: spacing.lg },
  label: { fontSize: 13, fontFamily: typography.fonts.bodySemiBold, color: colors.textSecondary, marginBottom: 8 },
  input: { backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: colors.glassBorderLight, borderRadius: borderRadius.md, padding: 14, fontSize: 15, color: colors.textPrimary },
  
  btnRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md },
  
  stepTitle: { fontSize: 20, fontFamily: typography.fonts.headingBold, color: colors.textPrimary, textAlign: 'center', marginBottom: spacing.xl },
  stepSubtitle: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: spacing.xl },

  choiceGrid: { gap: spacing.md, marginBottom: spacing.xl },
  choiceCard: { padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorderLight, alignItems: 'center' },
  choiceActive: { borderColor: colors.primary, backgroundColor: 'rgba(255,255,255,0.1)' },
  iconCircle: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md },
  choiceLabel: { fontSize: 18, fontFamily: typography.fonts.headingBold, color: colors.textPrimary },
  choiceDesc: { fontSize: 13, color: colors.textMuted, marginTop: 4 },

  inputRow: { flexDirection: 'row', gap: spacing.md },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.02)', borderWidth: 1, borderColor: colors.glassBorderLight, borderRadius: borderRadius.md },
  chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  chipText: { fontSize: 13, fontFamily: typography.fonts.bodySemiBold, color: colors.textSecondary },
  chipTextActive: { color: '#fff', fontWeight: '700' },

  jointGrid: { gap: spacing.md, marginBottom: spacing.xl },
  jointCard: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.glassBorderLight, gap: 12 },
  jointActive: { borderColor: colors.primary },
  jointLabel: { fontSize: 16, color: colors.textPrimary, fontFamily: typography.fonts.bodySemiBold },

  assessmentSection: { marginBottom: spacing.xxl, borderBottomWidth: 1, borderBottomColor: colors.glassBorderLight, paddingBottom: spacing.xl },
  sectionHeading: { fontSize: 14, color: colors.primary, fontFamily: typography.fonts.headingBold, marginBottom: spacing.lg, letterSpacing: 1 },
  hScroll: { gap: spacing.sm },
  miniChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: colors.glassBorderLight },
  miniChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  miniChipText: { fontSize: 12, color: colors.textSecondary },
  miniChipTextActive: { color: '#fff' },

  radioItem: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 },
  radioActive: { opacity: 1 },
  radioText: { fontSize: 14, color: colors.textPrimary },

  errorText: { color: colors.error, textAlign: 'center', marginBottom: spacing.md, fontSize: 13 },
  
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: 8 },
  infoLabel: { fontSize: 14, color: colors.textSecondary },
  gameArea: { height: 200, borderRadius: borderRadius.lg, alignItems: 'center', justifyContent: 'center', marginVertical: 20 },
  gameText: { fontSize: 24, fontWeight: '700', color: '#fff' },
  gameContainer: {
    alignItems: 'center',
    gap: spacing.lg,
    paddingVertical: spacing.xl,
  },
  targetCircle: { width: 100, height: 100, borderRadius: 50 },
  scoreText: { marginTop: 20, fontSize: 18, color: colors.textPrimary, fontWeight: '600' },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.xl,
    marginTop: spacing.md,
  },
  avatarSection: { alignItems: 'center', paddingVertical: spacing.xl, gap: spacing.sm },
  
  memoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.lg, justifyContent: 'center', marginVertical: spacing.xxl },
  memoryBtn: { width: '100%', height: '100%', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg, borderWidth: 2, borderColor: colors.glassBorderLight, alignItems: 'center', justifyContent: 'center' },
  
  gameStatsHeader: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.xl, padding: spacing.lg, marginBottom: spacing.xl, borderWidth: 1, borderColor: 'rgba(255,255,255,0.1)' },
  statBox: { alignItems: 'center', flex: 1 },
  statLabel: { fontSize: 10, fontFamily: typography.fonts.headingBold, color: colors.textMuted, letterSpacing: 1.5, marginBottom: 4 },
  statValue: { fontSize: 24, fontFamily: typography.fonts.headingBold, color: colors.cognitive, fontWeight: '700' },
  
  challengeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.md, justifyContent: 'space-between' },
  challengeCard: { width: '48%', padding: spacing.lg, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.glassBorderLight, alignItems: 'center', minHeight: 130 },
  challengeCardActive: { borderColor: colors.cognitive, backgroundColor: 'rgba(108, 93, 211, 0.1)' },
  challengeLabel: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', marginTop: spacing.md, fontFamily: typography.fonts.bodySemiBold },
  selectedIndicator: { position: 'absolute', top: 8, right: 8 },
});
