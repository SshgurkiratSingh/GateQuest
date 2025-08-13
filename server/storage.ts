import { 
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
import { promises as fs } from "fs";
import { join } from "path";

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
  getAllQuestionAttempts(): Promise<QuestionAttempt[]>;
  importQuestionAttempts(attempts: QuestionAttempt[]): Promise<void>;
  exportAllData(): Promise<JsonData>;
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
  getTopicStats(userId: string, subjectId: string): Promise<any[]>;
  getDifficultyStats(userId: string, subjectId: string): Promise<any[]>;
  getWeeklyStats(userId: string): Promise<any[]>;
  getUserStats(userId: string): Promise<any>;

  // Settings methods
  getUserSettings(userId: string): Promise<UserSettings | undefined>;
  updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings>;
}

const DATA_DIR = join(process.cwd(), 'data');
const USERS_FILE = join(DATA_DIR, 'users.json');
const SUBJECTS_FILE = join(DATA_DIR, 'subjects.json');
const QUESTION_ATTEMPTS_FILE = join(DATA_DIR, 'question-attempts.json');
const DAILY_PROGRESS_FILE = join(DATA_DIR, 'daily-progress.json');
const USER_SETTINGS_FILE = join(DATA_DIR, 'user-settings.json');

interface JsonData {
  users: User[];
  subjects: Subject[];
  questionAttempts: QuestionAttempt[];
  dailyProgress: DailyProgress[];
  userSettings: UserSettings[];
}

export class JsonStorage implements IStorage {
  private async ensureDataDir(): Promise<void> {
    try {
      await fs.mkdir(DATA_DIR, { recursive: true });
    } catch (error) {
      // Directory already exists
    }
  }

  private async readJsonFile<T>(filepath: string, defaultValue: T): Promise<T> {
    try {
      const data = await fs.readFile(filepath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      await this.writeJsonFile(filepath, defaultValue);
      return defaultValue;
    }
  }

  private async writeJsonFile<T>(filepath: string, data: T): Promise<void> {
    await this.ensureDataDir();
    await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2) + Date.now().toString(36);
  }

  async getUser(id: string): Promise<User | undefined> {
    const users = await this.readJsonFile<User[]>(USERS_FILE, []);
    return users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = await this.readJsonFile<User[]>(USERS_FILE, []);
    return users.find(u => u.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const users = await this.readJsonFile<User[]>(USERS_FILE, []);
    const newUser: User = {
      id: this.generateId(),
      ...insertUser,
      createdAt: new Date(),
    };
    users.push(newUser);
    await this.writeJsonFile(USERS_FILE, users);
    return newUser;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return await this.readJsonFile<Subject[]>(SUBJECTS_FILE, []);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const subjects = await this.readJsonFile<Subject[]>(SUBJECTS_FILE, []);
    return subjects.find(s => s.id === id);
  }

  async createSubject(insertSubject: InsertSubject): Promise<Subject> {
    const subjects = await this.readJsonFile<Subject[]>(SUBJECTS_FILE, []);
    const newSubject: Subject = {
      id: this.generateId(),
      ...insertSubject,
    };
    subjects.push(newSubject);
    await this.writeJsonFile(SUBJECTS_FILE, subjects);
    return newSubject;
  }

  async createQuestionAttempt(userId: string, attempt: InsertQuestionAttempt): Promise<QuestionAttempt> {
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    const newAttempt: QuestionAttempt = {
      id: this.generateId(),
      userId,
      attemptDate: new Date(),
      ...attempt,
    };
    attempts.push(newAttempt);
    await this.writeJsonFile(QUESTION_ATTEMPTS_FILE, attempts);
    return newAttempt;
  }

  async getAllQuestionAttempts(): Promise<QuestionAttempt[]> {
    return await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
  }

  async importQuestionAttempts(attempts: QuestionAttempt[]): Promise<void> {
    const existingAttempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    const newAttempts = attempts.filter(newAttempt =>
      !existingAttempts.some(existingAttempt => existingAttempt.id === newAttempt.id)
    );
    const allAttempts = [...existingAttempts, ...newAttempts];
    await this.writeJsonFile(QUESTION_ATTEMPTS_FILE, allAttempts);
  }

  async exportAllData(): Promise<JsonData> {
    const users = await this.readJsonFile<User[]>(USERS_FILE, []);
    const subjects = await this.readJsonFile<Subject[]>(SUBJECTS_FILE, []);
    const questionAttempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    const dailyProgress = await this.readJsonFile<DailyProgress[]>(DAILY_PROGRESS_FILE, []);
    const userSettings = await this.readJsonFile<UserSettings[]>(USER_SETTINGS_FILE, []);
    return { users, subjects, questionAttempts, dailyProgress, userSettings };
  }

  async importAllData(data: JsonData): Promise<void> {
    await this.writeJsonFile(USERS_FILE, data.users);
    await this.writeJsonFile(SUBJECTS_FILE, data.subjects);
    await this.writeJsonFile(QUESTION_ATTEMPTS_FILE, data.questionAttempts);
    await this.writeJsonFile(DAILY_PROGRESS_FILE, data.dailyProgress);
    await this.writeJsonFile(USER_SETTINGS_FILE, data.userSettings);
  }

  async getQuestionAttemptsByUser(userId: string, limit: number = 100): Promise<QuestionAttempt[]> {
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    return attempts
      .filter(a => a.userId === userId)
      .sort((a, b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime())
      .slice(0, limit);
  }

  async getQuestionAttemptsByDate(userId: string, date: Date): Promise<QuestionAttempt[]> {
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return attempts.filter(a => 
      a.userId === userId && 
      new Date(a.attemptDate) >= startOfDay && 
      new Date(a.attemptDate) <= endOfDay
    ).sort((a, b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime());
  }

  async getQuestionAttemptsBySubject(userId: string, subjectId: string): Promise<QuestionAttempt[]> {
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    return attempts
      .filter(a => a.userId === userId && a.subjectId === subjectId)
      .sort((a, b) => new Date(b.attemptDate).getTime() - new Date(a.attemptDate).getTime());
  }

  async getDailyProgress(userId: string, date: Date): Promise<DailyProgress | undefined> {
    const progress = await this.readJsonFile<DailyProgress[]>(DAILY_PROGRESS_FILE, []);
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return progress.find(p => 
      p.userId === userId && 
      new Date(p.date) >= startOfDay && 
      new Date(p.date) <= endOfDay
    );
  }

  async updateDailyProgress(userId: string, progressData: InsertDailyProgress): Promise<DailyProgress> {
    const progressList = await this.readJsonFile<DailyProgress[]>(DAILY_PROGRESS_FILE, []);
    const existing = await this.getDailyProgress(userId, progressData.date);
    
    if (existing) {
      const index = progressList.findIndex(p => p.id === existing.id);
      const updated = { ...existing, ...progressData };
      progressList[index] = updated;
      await this.writeJsonFile(DAILY_PROGRESS_FILE, progressList);
      return updated;
    } else {
      const newProgress: DailyProgress = {
        id: this.generateId(),
        userId,
        ...progressData,
      };
      progressList.push(newProgress);
      await this.writeJsonFile(DAILY_PROGRESS_FILE, progressList);
      return newProgress;
    }
  }

  async getProgressHistory(userId: string, days: number): Promise<DailyProgress[]> {
    const progress = await this.readJsonFile<DailyProgress[]>(DAILY_PROGRESS_FILE, []);
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return progress
      .filter(p => p.userId === userId && new Date(p.date) >= cutoffDate)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    const subjects = await this.readJsonFile<Subject[]>(SUBJECTS_FILE, []);
    
    const userAttempts = attempts.filter(a => a.userId === userId);
    const subjectMap = new Map<string, any>();
    
    userAttempts.forEach(attempt => {
      const subject = subjects.find(s => s.id === attempt.subjectId);
      if (!subject) return;
      
      if (!subjectMap.has(attempt.subjectId)) {
        subjectMap.set(attempt.subjectId, {
          subjectId: attempt.subjectId,
          subjectName: subject.name,
          totalQuestions: 0,
          totalCorrect: 0,
          totalTime: 0,
          attemptCount: 0,
        });
      }
      
      const stat = subjectMap.get(attempt.subjectId);
      stat.totalQuestions += attempt.questionsAttempted;
      stat.totalCorrect += attempt.correctAnswers;
      stat.totalTime += attempt.timeSpent;
      stat.attemptCount += 1;
    });

    return Array.from(subjectMap.values()).map(stat => ({
      ...stat,
      accuracy: stat.totalQuestions > 0 ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100) : 0,
      avgTime: stat.totalQuestions > 0 ? Math.round(stat.totalTime / stat.totalQuestions * 10) / 10 : 0,
    }));
  }

  async getTopicStats(userId: string, subjectId: string): Promise<any[]> {
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);

    const userSubjectAttempts = attempts.filter(a => a.userId === userId && a.subjectId === subjectId);
    const topicMap = new Map<string, any>();

    userSubjectAttempts.forEach(attempt => {
      if (!topicMap.has(attempt.topic)) {
        topicMap.set(attempt.topic, {
          topic: attempt.topic,
          totalQuestions: 0,
          totalCorrect: 0,
          totalTime: 0,
          attemptCount: 0,
        });
      }

      const stat = topicMap.get(attempt.topic);
      stat.totalQuestions += attempt.questionsAttempted;
      stat.totalCorrect += attempt.correctAnswers;
      stat.totalTime += attempt.timeSpent;
      stat.attemptCount += 1;
    });

    return Array.from(topicMap.values()).map(stat => ({
      ...stat,
      accuracy: stat.totalQuestions > 0 ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100) : 0,
      avgTime: stat.totalQuestions > 0 ? Math.round(stat.totalTime / stat.totalQuestions * 10) / 10 : 0,
    }));
  }

  async getDifficultyStats(userId: string, subjectId: string): Promise<any[]> {
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);

    const userSubjectAttempts = attempts.filter(a => a.userId === userId && a.subjectId === subjectId);
    const difficultyMap = new Map<string, any>();

    // Initialize map for all difficulties
    ["Easy", "Medium", "Hard"].forEach(level => {
        difficultyMap.set(level, {
            difficulty: level,
            totalQuestions: 0,
            totalCorrect: 0,
            totalTime: 0,
            attemptCount: 0,
        });
    });

    userSubjectAttempts.forEach(attempt => {
      const stat = difficultyMap.get(attempt.difficulty);
      if (stat) {
        stat.totalQuestions += attempt.questionsAttempted;
        stat.totalCorrect += attempt.correctAnswers;
        stat.totalTime += attempt.timeSpent;
        stat.attemptCount += 1;
      }
    });

    return Array.from(difficultyMap.values()).map(stat => ({
      ...stat,
      accuracy: stat.totalQuestions > 0 ? Math.round((stat.totalCorrect / stat.totalQuestions) * 100) : 0,
      avgTime: stat.totalQuestions > 0 ? Math.round(stat.totalTime / stat.totalQuestions * 10) / 10 : 0,
    }));
  }

  async getWeeklyStats(userId: string): Promise<any[]> {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const progress = await this.readJsonFile<DailyProgress[]>(DAILY_PROGRESS_FILE, []);
    return progress
      .filter(p => p.userId === userId && new Date(p.date) >= weekAgo)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async getUserStats(userId: string): Promise<any> {
    const attempts = await this.readJsonFile<QuestionAttempt[]>(QUESTION_ATTEMPTS_FILE, []);
    const userAttempts = attempts.filter(a => a.userId === userId);
    
    const totalQuestions = userAttempts.reduce((sum, a) => sum + a.questionsAttempted, 0);
    const totalCorrect = userAttempts.reduce((sum, a) => sum + a.correctAnswers, 0);
    const totalTime = userAttempts.reduce((sum, a) => sum + a.timeSpent, 0);
    const streak = await this.getCurrentStreak(userId);
    
    return {
      totalQuestions,
      totalCorrect,
      totalTime,
      currentStreak: streak,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
    };
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const settings = await this.readJsonFile<UserSettings[]>(USER_SETTINGS_FILE, []);
    return settings.find(s => s.userId === userId);
  }

  async updateUserSettings(userId: string, settingsData: Partial<InsertUserSettings>): Promise<UserSettings> {
    const settingsList = await this.readJsonFile<UserSettings[]>(USER_SETTINGS_FILE, []);
    const existing = await this.getUserSettings(userId);
    
    if (existing) {
      const index = settingsList.findIndex(s => s.id === existing.id);
      const updated = { ...existing, ...settingsData };
      settingsList[index] = updated;
      await this.writeJsonFile(USER_SETTINGS_FILE, settingsList);
      return updated;
    } else {
      const newSettings: UserSettings = {
        id: this.generateId(),
        userId,
        theme: "light",
        reminderEnabled: true,
        ...settingsData,
      };
      settingsList.push(newSettings);
      await this.writeJsonFile(USER_SETTINGS_FILE, settingsList);
      return newSettings;
    }
  }
}

export const storage = new JsonStorage();
