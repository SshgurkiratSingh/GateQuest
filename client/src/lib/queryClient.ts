import { QueryClient } from "@tanstack/react-query";
import { storage } from "./storage";

const DEMO_USER_ID = "demo-user-id";

async function fetcher(url: string, options?: RequestInit) {
  const res = await fetch(url, options);
  if (!res.ok) {
    throw new Error(`Request failed with status ${res.status}`);
  }
  return res.json();
}

// API layer for client-side calls
export const api = {
  subjects: {
    getAll: () => fetcher("/api/subjects"),
  },
  
  questionAttempts: {
    create: (data: any) => fetcher("/api/question-attempts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    }),
    getByUser: (limit?: number) => fetcher(`/api/question-attempts?limit=${limit || 100}`),
  },
  
  dailyProgress: {
    getToday: () => fetcher("/api/daily-progress/today"),
  },
  
  analytics: {
    getSubjects: () => fetcher("/api/analytics/subjects"),
    getTopics: () => fetcher("/api/analytics/topics"),
    getWeekly: () => fetcher("/api/analytics/weekly"),
  },
  
  streak: {
    getCurrent: () => fetcher("/api/streak"),
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
