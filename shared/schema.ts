import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, decimal, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  dailyTarget: integer("daily_target").notNull().default(30),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const subjects = pgTable("subjects", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  weightage: decimal("weightage", { precision: 4, scale: 1 }).notNull(),
  topics: jsonb("topics").$type<string[]>().notNull().default([]),
});

export const questionAttempts = pgTable("question_attempts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  subjectId: varchar("subject_id").notNull().references(() => subjects.id),
  topic: text("topic").notNull(),
  questionsAttempted: integer("questions_attempted").notNull(),
  correctAnswers: integer("correct_answers").notNull(),
  difficulty: text("difficulty").notNull(),
  timeSpent: integer("time_spent").notNull(), // in minutes
  attemptDate: timestamp("attempt_date").defaultNow().notNull(),
});

export const dailyProgress = pgTable("daily_progress", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  totalQuestions: integer("total_questions").notNull().default(0),
  totalCorrect: integer("total_correct").notNull().default(0),
  totalTimeSpent: integer("total_time_spent").notNull().default(0), // in minutes
  targetAchieved: boolean("target_achieved").notNull().default(false),
  streakDay: boolean("streak_day").notNull().default(false),
});

export const userSettings = pgTable("user_settings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id).unique(),
  theme: text("theme").notNull().default("light"),
  morningReminder: text("morning_reminder"),
  eveningReminder: text("evening_reminder"),
  reminderEnabled: boolean("reminder_enabled").notNull().default(true),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  dailyTarget: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).pick({
  name: true,
  code: true,
  weightage: true,
  topics: true,
});

export const insertQuestionAttemptSchema = createInsertSchema(questionAttempts).pick({
  subjectId: true,
  topic: true,
  questionsAttempted: true,
  correctAnswers: true,
  difficulty: true,
  timeSpent: true,
});

export const insertDailyProgressSchema = createInsertSchema(dailyProgress).pick({
  date: true,
  totalQuestions: true,
  totalCorrect: true,
  totalTimeSpent: true,
  targetAchieved: true,
  streakDay: true,
});

export const insertUserSettingsSchema = createInsertSchema(userSettings).pick({
  theme: true,
  morningReminder: true,
  eveningReminder: true,
  reminderEnabled: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;
export type Subject = typeof subjects.$inferSelect;
export type InsertQuestionAttempt = z.infer<typeof insertQuestionAttemptSchema>;
export type QuestionAttempt = typeof questionAttempts.$inferSelect;
export type InsertDailyProgress = z.infer<typeof insertDailyProgressSchema>;
export type DailyProgress = typeof dailyProgress.$inferSelect;
export type InsertUserSettings = z.infer<typeof insertUserSettingsSchema>;
export type UserSettings = typeof userSettings.$inferSelect;
