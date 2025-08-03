import { UserPoints, Badge, Achievement, PointsEvent, HealthStreak, LevelSystem } from '../types/gamification';
import { NutritionAnalysis } from '../types/nutrition';
import { UserPreferences } from '../types/user';

class GamificationService {
  private userPoints: Map<string, UserPoints> = new Map();
  private healthStreaks: Map<string, HealthStreak> = new Map();

  constructor() {
    console.log('🎮 Gamification Service initialized');
  }

  // 🏆 Level System Configuration
  private getLevelConfig(level: number): LevelSystem {
    const levelConfigs = [
      { name: 'Nutrition Newbie', icon: '🌱', xpRequired: 0, perks: ['Basic analysis'] },
      { name: 'Health Explorer', icon: '🔍', xpRequired: 100, perks: ['Detailed recommendations'] },
      { name: 'Wellness Warrior', icon: '⚔️', xpRequired: 300, perks: ['Advanced insights', 'Streak bonuses'] },
      { name: 'Nutrition Ninja', icon: '🥷', xpRequired: 600, perks: ['Personalized tips', 'Achievement badges'] },
      { name: 'Health Guru', icon: '🧘', xpRequired: 1000, perks: ['Expert analysis', 'Special rewards'] },
      { name: 'Wellness Master', icon: '👑', xpRequired: 1500, perks: ['All features unlocked', 'Exclusive content'] }
    ];

    const currentLevel = levelConfigs[Math.min(level, levelConfigs.length - 1)];
    const nextLevel = levelConfigs[Math.min(level + 1, levelConfigs.length - 1)];

    return {
      level,
      currentXP: 0, // Will be calculated
      xpToNextLevel: nextLevel.xpRequired - currentLevel.xpRequired,
      levelName: currentLevel.name,
      levelIcon: currentLevel.icon,
      perks: currentLevel.perks
    };
  }

  // 🏅 Badge Definitions
  private getBadgeDefinitions(): Badge[] {
    return [
      // 🥉 Bronze Badges
      { id: 'first_scan', name: 'First Steps', description: 'Completed your first nutrition analysis', icon: '👶', rarity: 'bronze', pointsRequired: 0, unlockedAt: new Date() },
      { id: 'manual_master', name: 'Manual Master', description: 'Used manual entry 5 times', icon: '✍️', rarity: 'bronze', pointsRequired: 50, unlockedAt: new Date() },
      { id: 'sodium_sleuth', name: 'Sodium Sleuth', description: 'Successfully reduced sodium intake', icon: '🧂', rarity: 'bronze', pointsRequired: 75, unlockedAt: new Date() },
      
      // 🥈 Silver Badges  
      { id: 'week_warrior', name: 'Week Warrior', description: 'Maintained 7-day health streak', icon: '📅', rarity: 'silver', pointsRequired: 150, unlockedAt: new Date() },
      { id: 'heart_hero', name: 'Heart Hero', description: 'Achieved excellent heart-health scores 10 times', icon: '❤️', rarity: 'silver', pointsRequired: 200, unlockedAt: new Date() },
      { id: 'sugar_slayer', name: 'Sugar Slayer', description: 'Consistently chose low-sugar options', icon: '🍯', rarity: 'silver', pointsRequired: 175, unlockedAt: new Date() },
      
      // 🥇 Gold Badges
      { id: 'month_champion', name: 'Month Champion', description: 'Maintained 30-day health streak', icon: '🏆', rarity: 'gold', pointsRequired: 500, unlockedAt: new Date() },
      { id: 'nutrition_ninja', name: 'Nutrition Ninja', description: 'Completed 100 analyses with 80+ scores', icon: '🥷', rarity: 'gold', pointsRequired: 750, unlockedAt: new Date() },
      { id: 'trend_master', name: 'Trend Master', description: 'Showed consistent health improvement', icon: '📈', rarity: 'gold', pointsRequired: 600, unlockedAt: new Date() },
      
      // 💎 Platinum Badges
      { id: 'wellness_guru', name: 'Wellness Guru', description: 'Achieved 500 total points', icon: '🧘', rarity: 'platinum', pointsRequired: 500, unlockedAt: new Date() },
      { id: 'perfect_week', name: 'Perfect Week', description: 'Scored 90+ on all analyses for a week', icon: '✨', rarity: 'platinum', pointsRequired: 300, unlockedAt: new Date() },
      
      // 💠 Diamond Badges (Ultra Rare)
      { id: 'health_legend', name: 'Health Legend', description: 'Achieved 1000 total points', icon: '👑', rarity: 'diamond', pointsRequired: 1000, unlockedAt: new Date() }
    ];
  }

  // 🎯 Calculate Points for Analysis
  public calculateAnalysisPoints(analysis: NutritionAnalysis, userPreferences?: UserPreferences): PointsEvent[] {
    const events: PointsEvent[] = [];
    
    // Base points for completing analysis
    events.push({
      type: 'analysis_completed',
      points: 10,
      description: 'Completed nutrition analysis',
      timestamp: new Date()
    });

    // Bonus points for good scores
    if (analysis.overallScore >= 90) {
      events.push({
        type: 'goal_achieved',
        points: 25,
        description: 'Excellent nutrition choices! (90+ score)',
        timestamp: new Date()
      });
    } else if (analysis.overallScore >= 80) {
      events.push({
        type: 'goal_achieved',
        points: 15,
        description: 'Great nutrition choices! (80+ score)',
        timestamp: new Date()
      });
    } else if (analysis.overallScore >= 70) {
      events.push({
        type: 'goal_achieved',
        points: 5,
        description: 'Good nutrition choices! (70+ score)',
        timestamp: new Date()
      });
    }

    // Goal-specific bonuses
    if (userPreferences) {
      switch (userPreferences.goal) {
        case 'heart_health':
          if (analysis.sodiumScore >= 80) {
            events.push({
              type: 'recommendation_followed',
              points: 10,
              description: '❤️ Heart-healthy sodium levels!',
              timestamp: new Date()
            });
          }
          break;
        case 'diabetes_care':
          if (analysis.sugarScore >= 80) {
            events.push({
              type: 'recommendation_followed',
              points: 10,
              description: '🩺 Excellent sugar management!',
              timestamp: new Date()
            });
          }
          break;
        case 'fitness':
          if (analysis.nutrientScore >= 80) {
            events.push({
              type: 'recommendation_followed',
              points: 10,
              description: '💪 Perfect fitness nutrition!',
              timestamp: new Date()
            });
          }
          break;
      }
    }

    return events;
  }

  // 📊 Update User Points
  public updateUserPoints(userId: string, events: PointsEvent[]): UserPoints {
    let userPoints = this.userPoints.get(userId) || {
      totalPoints: 0,
      level: 1,
      streakDays: 0,
      lastActivityDate: new Date(),
      badges: [],
      achievements: []
    };

    // Add points from events
    const pointsGained = events.reduce((sum, event) => sum + event.points, 0);
    userPoints.totalPoints += pointsGained;
    userPoints.lastActivityDate = new Date();

    // Calculate level
    const newLevel = this.calculateLevel(userPoints.totalPoints);
    if (newLevel > userPoints.level) {
      userPoints.level = newLevel;
      // Level up bonus!
      events.push({
        type: 'goal_achieved',
        points: 50,
        description: `🎉 Level up! Welcome to level ${newLevel}!`,
        timestamp: new Date()
      });
      userPoints.totalPoints += 50;
    }

    // Check for new badges
    const newBadges = this.checkForNewBadges(userPoints);
    userPoints.badges.push(...newBadges);

    this.userPoints.set(userId, userPoints);
    return userPoints;
  }

  // 🔢 Calculate Level from Points
  private calculateLevel(points: number): number {
    if (points < 100) return 1;
    if (points < 300) return 2;
    if (points < 600) return 3;
    if (points < 1000) return 4;
    if (points < 1500) return 5;
    return 6; // Max level
  }

  // 🏅 Check for New Badges
  private checkForNewBadges(userPoints: UserPoints): Badge[] {
    const allBadges = this.getBadgeDefinitions();
    const unlockedBadgeIds = userPoints.badges.map(b => b.id);
    const newBadges: Badge[] = [];

    for (const badge of allBadges) {
      if (!unlockedBadgeIds.includes(badge.id) && 
          badge.pointsRequired !== undefined && 
          userPoints.totalPoints >= badge.pointsRequired) {
        newBadges.push({
          ...badge,
          unlockedAt: new Date()
        });
      }
    }

    return newBadges;
  }

  // 🔥 Update Health Streak
  public updateHealthStreak(userId: string, analysisScore: number): HealthStreak {
    let streak = this.healthStreaks.get(userId) || {
      currentStreak: 0,
      longestStreak: 0,
      lastAnalysisDate: new Date(0),
      weeklyGoal: 3,
      weeklyCompleted: 0
    };

    const today = new Date();
    const lastActivity = streak.lastAnalysisDate;
    const daysDiff = Math.floor((today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));

    // Good score threshold
    const isGoodScore = analysisScore >= 70;

    if (isGoodScore) {
      if (daysDiff === 1) {
        // Consecutive day - extend streak
        streak.currentStreak++;
      } else if (daysDiff > 1) {
        // Broke streak - restart
        streak.currentStreak = 1;
      }
      // Same day doesn't affect streak

      streak.longestStreak = Math.max(streak.longestStreak, streak.currentStreak);
      streak.lastAnalysisDate = today;
    } else if (daysDiff > 1) {
      // Bad score and missed days - break streak
      streak.currentStreak = 0;
    }

    // Weekly progress
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    if (lastActivity < weekStart) {
      streak.weeklyCompleted = 0;
    }
    if (isGoodScore) {
      streak.weeklyCompleted = Math.min(streak.weeklyCompleted + 1, streak.weeklyGoal);
    }

    this.healthStreaks.set(userId, streak);
    return streak;
  }

  // 📈 Get User Stats
  public getUserStats(userId: string): { points: UserPoints; streak: HealthStreak; level: LevelSystem } {
    const points = this.userPoints.get(userId) || {
      totalPoints: 0,
      level: 1,
      streakDays: 0,
      lastActivityDate: new Date(),
      badges: [],
      achievements: []
    };

    const streak = this.healthStreaks.get(userId) || {
      currentStreak: 0,
      longestStreak: 0,
      lastAnalysisDate: new Date(0),
      weeklyGoal: 3,
      weeklyCompleted: 0
    };

    const level = this.getLevelConfig(points.level);
    level.currentXP = points.totalPoints;

    return { points, streak, level };
  }

  // 🎮 Generate Motivational Messages
  public getMotivationalMessage(userPoints: UserPoints, events: PointsEvent[]): string {
    const totalPoints = events.reduce((sum, e) => sum + e.points, 0);
    const userName = 'there'; // Will be passed in real implementation

    if (totalPoints >= 50) {
      return `🔥 Amazing work! You earned ${totalPoints} points! You're absolutely crushing it! 🎉`;
    } else if (totalPoints >= 25) {
      return `⭐ Fantastic! +${totalPoints} points! You're building awesome healthy habits! 💪`;
    } else if (totalPoints >= 15) {
      return `🌟 Great job! +${totalPoints} points! Keep up the excellent choices! 👏`;
    } else if (totalPoints >= 10) {
      return `✨ Nice! +${totalPoints} points! Every healthy choice counts! 🙌`;
    } else {
      return `🎯 Progress! +${totalPoints} points! You're on the right track! 😊`;
    }
  }
}

export { GamificationService };