import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertQuestionAttemptSchema, insertDailyProgressSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize GATE ECE subjects data
  await initializeSubjects();

  // Get all subjects
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Add question attempt
  app.post("/api/question-attempts", async (req, res) => {
    try {
      // For demo purposes, using a default user ID
      // In a real app, this would come from authentication
      const userId = "demo-user-id";
      
      const validatedData = insertQuestionAttemptSchema.parse(req.body);
      const attempt = await storage.createQuestionAttempt(userId, validatedData);
      
      // Update daily progress
      const today = new Date();
      const todayAttempts = await storage.getQuestionAttemptsByDate(userId, today);
      const totalQuestions = todayAttempts.reduce((sum, att) => sum + att.questionsAttempted, 0);
      const totalCorrect = todayAttempts.reduce((sum, att) => sum + att.correctAnswers, 0);
      const totalTimeSpent = todayAttempts.reduce((sum, att) => sum + att.timeSpent, 0);
      
      const dailyTarget = 30; // This should come from user settings
      const targetAchieved = totalQuestions >= dailyTarget;
      
      await storage.updateDailyProgress(userId, {
        date: today,
        totalQuestions,
        totalCorrect,
        totalTimeSpent,
        targetAchieved,
        streakDay: targetAchieved,
      });

      res.json(attempt);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to create question attempt" });
      }
    }
  });

  // Get question attempts by user
  app.get("/api/question-attempts", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const attempts = await storage.getQuestionAttemptsByUser(userId, limit);
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch question attempts" });
    }
  });

  // Get today's progress
  app.get("/api/daily-progress/today", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const today = new Date();
      const progress = await storage.getDailyProgress(userId, today);
      const attempts = await storage.getQuestionAttemptsByDate(userId, today);
      
      res.json({
        progress,
        attempts,
        questionsToday: progress?.totalQuestions || 0,
        accuracyRate: progress && progress.totalQuestions > 0 ? 
          Math.round((progress.totalCorrect / progress.totalQuestions) * 100) : 0,
        timeSpent: progress?.totalTimeSpent || 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch daily progress" });
    }
  });

  // Get weekly stats
  app.get("/api/analytics/weekly", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const weeklyStats = await storage.getWeeklyStats(userId);
      res.json(weeklyStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch weekly stats" });
    }
  });

  // Get subject-wise analytics
  app.get("/api/analytics/subjects", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const subjectStats = await storage.getSubjectStats(userId);
      res.json(subjectStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subject analytics" });
    }
  });

  // Get user stats
  app.get("/api/analytics/user", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const userStats = await storage.getUserStats(userId);
      res.json(userStats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch user stats" });
    }
  });

  // Get current streak
  app.get("/api/streak", async (req, res) => {
    try {
      const userId = "demo-user-id";
      const streak = await storage.getCurrentStreak(userId);
      res.json({ streak });
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch streak" });
    }
  });

  // Export all question attempts
  app.get("/api/export", async (req, res) => {
    try {
      const attempts = await storage.getAllQuestionAttempts();
      res.json(attempts);
    } catch (error) {
      res.status(500).json({ message: "Failed to export data" });
    }
  });

  // Import question attempts
  app.post("/api/import", async (req, res) => {
    try {
      const attempts = z.array(z.any()).parse(req.body);
      await storage.importQuestionAttempts(attempts as any);
      res.json({ message: "Import successful" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data", errors: error.errors });
      } else {
        res.status(500).json({ message: "Failed to import data" });
      }
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}

async function initializeSubjects() {
  try {
    const existingSubjects = await storage.getAllSubjects();
    if (existingSubjects.length > 0) return;

    // GATE ECE 2025 Syllabus based on web research
    const subjects = [
      {
        name: "Networks, Signals & Systems",
        code: "NSS",
        weightage: "15.0",
        topics: [
          "Network Analysis Techniques",
          "Network Theorems",
          "Two-port Networks",
          "Filters",
          "Continuous-time Signals",
          "Fourier Series",
          "Fourier Transform",
          "Discrete-time Signals",
          "DFT and FFT",
          "Z-Transform",
          "LTI Systems",
          "Convolution",
          "Sampling Theorem"
        ]
      },
      {
        name: "Electronic Devices",
        code: "ED",
        weightage: "12.0",
        topics: [
          "PN Junction Diodes",
          "Zener Diodes",
          "BJT Characteristics",
          "BJT Models",
          "MOSFET Characteristics",
          "MOSFET Models",
          "Semiconductor Memories",
          "ROM and RAM",
          "LED and Photodiodes",
          "Solar Cells",
          "Power Devices",
          "Thyristors"
        ]
      },
      {
        name: "Analog Circuits",
        code: "AC",
        weightage: "12.0",
        topics: [
          "Diode Circuits",
          "Rectifiers",
          "Voltage Regulators",
          "BJT Amplifiers",
          "MOSFET Amplifiers",
          "Operational Amplifiers",
          "Op-Amp Applications",
          "Feedback Amplifiers",
          "Oscillators",
          "Active Filters",
          "Comparators",
          "ADC and DAC"
        ]
      },
      {
        name: "Digital Circuits",
        code: "DC",
        weightage: "10.0",
        topics: [
          "Number Systems",
          "Boolean Algebra",
          "Karnaugh Maps",
          "Logic Gates",
          "CMOS Implementation",
          "Combinational Circuits",
          "Decoders and Multiplexers",
          "Sequential Circuits",
          "Flip-Flops",
          "Counters and Registers",
          "Finite State Machines",
          "Memory Elements"
        ]
      },
      {
        name: "Control Systems",
        code: "CS",
        weightage: "10.0",
        topics: [
          "Open and Closed Loop Systems",
          "Transfer Functions",
          "Block Diagrams",
          "Signal Flow Graphs",
          "Mason's Gain Formula",
          "Time Domain Analysis",
          "Frequency Domain Analysis",
          "Bode Plots",
          "Nyquist Plots",
          "Stability Analysis",
          "Routh-Hurwitz Criteria",
          "Root Locus",
          "PID Controllers"
        ]
      },
      {
        name: "Communications",
        code: "COM",
        weightage: "12.0",
        topics: [
          "Analog Modulation",
          "AM, FM, PM",
          "Digital Modulation",
          "ASK, PSK, FSK",
          "QAM",
          "Pulse Modulation",
          "PCM",
          "Digital Communication",
          "Information Theory",
          "Channel Capacity",
          "Source Coding",
          "Channel Coding",
          "Multiple Access",
          "Mobile Communication"
        ]
      },
      {
        name: "Electromagnetics",
        code: "EM",
        weightage: "10.0",
        topics: [
          "Maxwell's Equations",
          "Electromagnetic Waves",
          "Wave Propagation",
          "Transmission Lines",
          "Smith Chart",
          "Waveguides",
          "Rectangular Waveguides",
          "Circular Waveguides",
          "Antennas",
          "Dipole and Monopole",
          "Antenna Arrays",
          "Microwave Devices",
          "Optical Fibers"
        ]
      },
      {
        name: "Engineering Mathematics",
        code: "MATH",
        weightage: "15.0",
        topics: [
          "Linear Algebra",
          "Matrix Operations",
          "Eigenvalues",
          "Calculus",
          "Differential Equations",
          "Partial Derivatives",
          "Multiple Integrals",
          "Vector Analysis",
          "Complex Variables",
          "Probability",
          "Statistics",
          "Numerical Methods"
        ]
      }
    ];

    for (const subject of subjects) {
      await storage.createSubject(subject);
    }
  } catch (error) {
    console.error("Failed to initialize subjects:", error);
  }
}
