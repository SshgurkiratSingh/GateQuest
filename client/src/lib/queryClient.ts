import { QueryClient } from "@tanstack/react-query";
import { storage } from "./storage";

const DEMO_USER_ID = "demo-user-id";

// Mock API layer for client-side storage
export const api = {
  subjects: {
    getAll: () => storage.getAllSubjects(),
    getById: (id: string) => storage.getSubject(id),
  },
  
  questionAttempts: {
    create: (data: any) => storage.createQuestionAttempt(DEMO_USER_ID, data),
    getByUser: (limit?: number) => storage.getQuestionAttemptsByUser(DEMO_USER_ID, limit),
  },
  
  dailyProgress: {
    getToday: async () => {
      const today = new Date();
      const progress = await storage.getDailyProgress(DEMO_USER_ID, today);
      const attempts = await storage.getQuestionAttemptsByDate(DEMO_USER_ID, today);
      
      const questionsToday = attempts.reduce((sum, a) => sum + a.questionsAttempted, 0);
      const correctToday = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
      const timeToday = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
      
      return {
        progress,
        attempts,
        questionsToday,
        accuracyRate: questionsToday > 0 ? Math.round((correctToday / questionsToday) * 100) : 0,
        timeSpent: timeToday
      };
    }
  },
  
  analytics: {
    getSubjects: () => storage.getSubjectStats(DEMO_USER_ID),
    getWeekly: () => storage.getWeeklyStats(DEMO_USER_ID),
  },
  
  streak: {
    getCurrent: async () => {
      const streak = await storage.getCurrentStreak(DEMO_USER_ID);
      return { streak };
    }
  }
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
