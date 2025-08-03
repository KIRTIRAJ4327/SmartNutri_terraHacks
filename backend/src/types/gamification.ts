// 🎮 Gamification System Types

export interface UserPoints {
  totalPoints: number;
  level: number;
  streakDays: number;
  lastActivityDate: Date;
  badges: Badge[];
  achievements: Achievement[];
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  rarity: 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond';
  pointsRequired?: number;
  unlockedAt: Date;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'health' | 'consistency' | 'improvement' | 'exploration' | 'social';
  progress: number;
  target: number;
  completed: boolean;
  pointsReward: number;
  unlockedAt?: Date;
}

export interface PointsEvent {
  type: 'analysis_completed' | 'recommendation_followed' | 'streak_maintained' | 'goal_achieved' | 'first_scan' | 'manual_entry' | 'health_improved';
  points: number;
  description: string;
  multiplier?: number;
  timestamp: Date;
}

export interface HealthStreak {
  currentStreak: number;
  longestStreak: number;
  lastAnalysisDate: Date;
  weeklyGoal: number;
  weeklyCompleted: number;
}

export interface LevelSystem {
  level: number;
  currentXP: number;
  xpToNextLevel: number;
  levelName: string;
  levelIcon: string;
  perks: string[];
}