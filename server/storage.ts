import { 
  users, 
  subjects, 
  questionAttempts, 
  dailyProgress, 
  userSettings,
  type User, 
  type InsertUser,
  type Subject,
  type InsertSubject,
  type QuestionAttempt,
  type InsertQuestionAttempt,
  type DailyProgress,
  type InsertDailyProgress,
  type UserSettings,
  type InsertUserSettings
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Subject methods
  getAllSubjects(): Promise<Subject[]>;
  getSubject(id: string): Promise<Subject | undefined>;
  createSubject(subject: InsertSubject): Promise<Subject>;

  // Question attempt methods
  createQuestionAttempt(userId: string, attempt: InsertQuestionAttempt): Promise<QuestionAttempt>;
  getQuestionAttemptsByUser(userId: string, limit?: number): Promise<QuestionAttempt[]>;
  getQuestionAttemptsByDate(userId: string, date: Date): Promise<QuestionAttempt[]>;
  getQuestionAttemptsBySubject(userId: string, subjectId: string): Promise<QuestionAttempt[]>;

  // Daily progress methods
  getDailyProgress(userId: string, date: Date): Promise<DailyProgress | undefined>;
  updateDailyProgress(userId: string, progress: InsertDailyProgress): Promise<DailyProgress>;
  getProgressHistory(userId: string, days: number): Promise<DailyProgress[]>;
  getCurrentStreak(userId: string): Promise<number>;

  // Analytics methods
  getSubjectStats(userId: string): Promise<any[]>;
  getWeeklyStats(userId: string): Promise<any[]>;
  getUserStats(userId: string): Promise<any>;

  // Settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects).orderBy(subjects.name);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const [newSubject] = await db
      .insert(subjects)
      .values(subject)
      .returning();
    return newSubject;
  }

  async createQuestionAttempt(userId: string, attempt: InsertQuestionAttempt): Promise<QuestionAttempt> {
    const [questionAttempt] = await db
      .insert(questionAttempts)
      .values({ ...attempt, userId })
      .returning();
    return questionAttempt;
  }

  async getQuestionAttemptsByUser(userId: string, limit: number = 100): Promise<QuestionAttempt[]> {
    return await db
      .select()
      .from(questionAttempts)
      .where(eq(questionAttempts.userId, userId))
      .orderBy(desc(questionAttempts.attemptDate))
      .limit(limit);
  }

  async getQuestionAttemptsByDate(userId: string, date: Date): Promise<QuestionAttempt[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return await db
      .select()
      .from(questionAttempts)
      .where(
        and(
          eq(questionAttempts.userId, userId),
          gte(questionAttempts.attemptDate, startOfDay),
          lte(questionAttempts.attemptDate, endOfDay)
        )
      )
      .orderBy(desc(questionAttempts.attemptDate));
  }

  async getQuestionAttemptsBySubject(userId: string, subjectId: string): Promise<QuestionAttempt[]> {
    return await db
      .select()
      .from(questionAttempts)
      .where(
        and(
          eq(questionAttempts.userId, userId),
          eq(questionAttempts.subjectId, subjectId)
        )
      )
      .orderBy(desc(questionAttempts.attemptDate));
  }

  async getDailyProgress(userId: string, date: Date): Promise<DailyProgress | undefined> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [progress] = await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.userId, userId),
          gte(dailyProgress.date, startOfDay),
          lte(dailyProgress.date, endOfDay)
        )
      );
    return progress || undefined;
  }

  async updateDailyProgress(userId: string, progress: InsertDailyProgress): Promise<DailyProgress> {
    const existing = await this.getDailyProgress(userId, progress.date);
    
    if (existing) {
      const [updated] = await db
        .update(dailyProgress)
        .set({
          totalQuestions: progress.totalQuestions,
          totalCorrect: progress.totalCorrect,
          totalTimeSpent: progress.totalTimeSpent,
          targetAchieved: progress.targetAchieved,
          streakDay: progress.streakDay,
        })
        .where(eq(dailyProgress.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(dailyProgress)
        .values({ ...progress, userId })
        .returning();
      return created;
    }
  }

  async getProgressHistory(userId: string, days: number): Promise<DailyProgress[]> {
    const date = new Date();
    date.setDate(date.getDate() - days);
    
    return await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.userId, userId),
          gte(dailyProgress.date, date)
        )
      )
      .orderBy(desc(dailyProgress.date));
  }

  async getCurrentStreak(userId: string): Promise<number> {
    const history = await this.getProgressHistory(userId, 30);
    let streak = 0;
    
    for (const day of history) {
      if (day.streakDay) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  async getSubjectStats(userId: string): Promise<any[]> {
    const result = await db
      .select({
        subjectId: questionAttempts.subjectId,
        subjectName: subjects.name,
        totalQuestions: sql<number>`sum(${questionAttempts.questionsAttempted})`,
        totalCorrect: sql<number>`sum(${questionAttempts.correctAnswers})`,
        totalTime: sql<number>`sum(${questionAttempts.timeSpent})`,
        attemptCount: sql<number>`count(*)`,
      })
      .from(questionAttempts)
      .innerJoin(subjects, eq(questionAttempts.subjectId, subjects.id))
      .where(eq(questionAttempts.userId, userId))
      .groupBy(questionAttempts.subjectId, subjects.name);

    return result.map(stat => ({
      ...stat,
      accuracy: stat.totalQuestions > 0 ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100) : 0,
      avgTime: stat.totalQuestions > 0 ? Math.round(stat.totalTime / stat.totalQuestions * 10) / 10 : 0,
    }));
  }

  async getWeeklyStats(userId: string): Promise<any[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    return await db
      .select()
      .from(dailyProgress)
      .where(
        and(
          eq(dailyProgress.userId, userId),
          gte(dailyProgress.date, weekAgo)
        )
      )
      .orderBy(dailyProgress.date);
  }

  async getUserStats(userId: string): Promise<any> {
    const totalStats = await db
      .select({
        totalQuestions: sql<number>`sum(${questionAttempts.questionsAttempted})`,
        totalCorrect: sql<number>`sum(${questionAttempts.correctAnswers})`,
        totalTime: sql<number>`sum(${questionAttempts.timeSpent})`,
      })
      .from(questionAttempts)
      .where(eq(questionAttempts.userId, userId));

    const streak = await this.getCurrentStreak(userId);
    
    return {
      ...totalStats[0],
      currentStreak: streak,
      accuracy: totalStats[0].totalQuestions > 0 ? 
        Math.round((totalStats[0].totalCorrect / totalStats[0].totalQuestions) * 100) : 0,
    };
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const [settings] = await db
      .select()
      .from(userSettings)
      .where(eq(userSettings.userId, userId));
    return settings || undefined;
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userSettings)
        .set(settings)
        .where(eq(userSettings.userId, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db
        .insert(userSettings)
        .values({ ...settings, userId })
        .returning();
      return created;
    }
  }
}

export const storage = new DatabaseStorage();
