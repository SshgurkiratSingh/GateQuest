import { z } from "zod";

// Type definitions for JSON storage
export interface User {
  id: string;
  username: string;
  password: string;
  dailyTarget: number;
  createdAt: Date;
}

export interface Subject {
  id: string;
  name: string;
  code: string;
  weightage: string;
  topics: string[];
}

export interface QuestionAttempt {
  id: string;
  userId: string;
  subjectId: string;
  topic: string;
  questionsAttempted: number;
  correctAnswers: number;
  difficulty: string;
  timeSpent: number;
  attemptDate: Date;
}

export interface DailyProgress {
  id: string;
  userId: string;
  date: Date;
  totalQuestions: number;
  totalCorrect: number;
  totalTimeSpent: number;
  targetAchieved: boolean;
  streakDay: boolean;
}

export interface UserSettings {
  id: string;
  userId: string;
  theme: string;
  morningReminder?: string;
  eveningReminder?: string;
  reminderEnabled: boolean;
}

// Insert schemas using Zod
export const insertUserSchema = z.object({
  username: z.string().min(1),
  password: z.string().min(1),
  dailyTarget: z.number().default(30),
});

export const insertSubjectSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  weightage: z.string().min(1),
  topics: z.array(z.string()).default([]),
});

export const insertQuestionAttemptSchema = z.object({
  subjectId: z.string().min(1),
  topic: z.string().min(1),
  questionsAttempted: z.number().min(1),
  correctAnswers: z.number().min(0),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  timeSpent: z.number().min(1),
});

export const insertDailyProgressSchema = z.object({
  date: z.date(),
  totalQuestions: z.number().default(0),
  totalCorrect: z.number().default(0),
  totalTimeSpent: z.number().default(0),
  targetAchieved: z.boolean().default(false),
  streakDay: z.boolean().default(false),
});

export const insertUserSettingsSchema = z.object({
  theme: z.string().default("light"),
  morningReminder: z.string().optional(),
  eveningReminder: z.string().optional(),
  reminderEnabled: z.boolean().default(true),
});

// Inferred types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type InsertQuestionAttempt = z.infer<typeof insertQuestionAttemptSchema>;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
