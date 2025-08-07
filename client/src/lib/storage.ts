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

const STORAGE_KEYS = {
  SUBJECTS: 'gate-ece-subjects',
  QUESTION_ATTEMPTS: 'gate-ece-question-attempts',
  DAILY_PROGRESS: 'gate-ece-daily-progress',
  USER_SETTINGS: 'gate-ece-user-settings',
  USERS: 'gate-ece-users'
};

// GATE ECE Subjects Data
const GATE_ECE_SUBJECTS: Subject[] = [
  {
    id: "y98nw5jrq2cme07kgy3",
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
    id: "71vrewftccgme07kgy7",
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
    id: "o1px4pnrhcjme07kgy7",
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
    id: "x87e0ojndybme07kgy8",
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
    id: "j6kzlu7l55sme07kgy9",
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
    id: "l2z90dd3oibme07kgy9",
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
    id: "m4bbw9tvwzbme07kgya",
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
    id: "0yjkpdiktr7me07kgyb",
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

function generateId(): string {
  return Math.random().toString(36).substr(2, 15);
}

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function setToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

function parseDate(dateStr: string | Date): Date {
  return typeof dateStr === 'string' ? new Date(dateStr) : dateStr;
}

function isToday(date: Date): boolean {
  const today = new Date();
  return date.toDateString() === today.toDateString();
}

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

export class LocalStorage implements IStorage {
  constructor() {
    this.initializeSubjects();
  }

  private initializeSubjects(): void {
    const subjects = getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    if (subjects.length === 0) {
      setToStorage(STORAGE_KEYS.SUBJECTS, GATE_ECE_SUBJECTS);
    }
  }

  async getUser(id: string): Promise<User | undefined> {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    return users.find(u => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    return users.find(u => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const users = getFromStorage<User[]>(STORAGE_KEYS.USERS, []);
    const newUser: User = {
      id: generateId(),
      ...user,
      createdAt: new Date()
    };
    users.push(newUser);
    setToStorage(STORAGE_KEYS.USERS, users);
    return newUser;
  }

  async getAllSubjects(): Promise<Subject[]> {
    return getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, GATE_ECE_SUBJECTS);
  }

  async getSubject(id: string): Promise<Subject | undefined> {
    const subjects = await this.getAllSubjects();
    return subjects.find(s => s.id === id);
  }

  async createSubject(subject: InsertSubject): Promise<Subject> {
    const subjects = getFromStorage<Subject[]>(STORAGE_KEYS.SUBJECTS, []);
    const newSubject: Subject = {
      id: generateId(),
      ...subject
    };
    subjects.push(newSubject);
    setToStorage(STORAGE_KEYS.SUBJECTS, subjects);
    return newSubject;
  }

  async createQuestionAttempt(userId: string, attempt: InsertQuestionAttempt): Promise<QuestionAttempt> {
    const attempts = getFromStorage<QuestionAttempt[]>(STORAGE_KEYS.QUESTION_ATTEMPTS, []);
    const newAttempt: QuestionAttempt = {
      id: generateId(),
      userId,
      ...attempt,
      attemptDate: new Date()
    };
    
    attempts.push(newAttempt);
    setToStorage(STORAGE_KEYS.QUESTION_ATTEMPTS, attempts);

    // Update daily progress
    await this.updateDailyProgressForAttempt(userId, newAttempt);
    
    return newAttempt;
  }

  private async updateDailyProgressForAttempt(userId: string, attempt: QuestionAttempt): Promise<void> {
    const today = new Date();
    const todayAttempts = await this.getQuestionAttemptsByDate(userId, today);
    
    const totalQuestions = todayAttempts.reduce((sum, a) => sum + a.questionsAttempted, 0);
    const totalCorrect = todayAttempts.reduce((sum, a) => sum + a.correctAnswers, 0);
    const totalTimeSpent = todayAttempts.reduce((sum, a) => sum + a.timeSpent, 0);
    
    const progress: InsertDailyProgress = {
      date: today,
      totalQuestions,
      totalCorrect,
      totalTimeSpent,
      targetAchieved: totalQuestions >= 30,
      streakDay: totalQuestions >= 30
    };

    await this.updateDailyProgress(userId, progress);
  }

  async getQuestionAttemptsByUser(userId: string, limit?: number): Promise<QuestionAttempt[]> {
    const attempts = getFromStorage<QuestionAttempt[]>(STORAGE_KEYS.QUESTION_ATTEMPTS, [])
      .filter(a => a.userId === userId)
      .map(a => ({ ...a, attemptDate: parseDate(a.attemptDate) }))
      .sort((a, b) => b.attemptDate.getTime() - a.attemptDate.getTime());
    
    return limit ? attempts.slice(0, limit) : attempts;
  }

  async getQuestionAttemptsByDate(userId: string, date: Date): Promise<QuestionAttempt[]> {
    const attempts = getFromStorage<QuestionAttempt[]>(STORAGE_KEYS.QUESTION_ATTEMPTS, [])
      .filter(a => a.userId === userId)
      .map(a => ({ ...a, attemptDate: parseDate(a.attemptDate) }))
      .filter(a => isToday(a.attemptDate));
    
    return attempts;
  }

  async getQuestionAttemptsBySubject(userId: string, subjectId: string): Promise<QuestionAttempt[]> {
    const attempts = getFromStorage<QuestionAttempt[]>(STORAGE_KEYS.QUESTION_ATTEMPTS, [])
      .filter(a => a.userId === userId && a.subjectId === subjectId)
      .map(a => ({ ...a, attemptDate: parseDate(a.attemptDate) }));
    
    return attempts;
  }

  async getDailyProgress(userId: string, date: Date): Promise<DailyProgress | undefined> {
    const progressList = getFromStorage<DailyProgress[]>(STORAGE_KEYS.DAILY_PROGRESS, [])
      .filter(p => p.userId === userId)
      .map(p => ({ ...p, date: parseDate(p.date) }))
      .find(p => p.date.toDateString() === date.toDateString());
    
    return progressList;
  }

  async updateDailyProgress(userId: string, progress: InsertDailyProgress): Promise<DailyProgress> {
    const progressList = getFromStorage<DailyProgress[]>(STORAGE_KEYS.DAILY_PROGRESS, []);
    const existingIndex = progressList.findIndex(p => 
      p.userId === userId && 
      parseDate(p.date).toDateString() === progress.date.toDateString()
    );

    const newProgress: DailyProgress = {
      id: existingIndex >= 0 ? progressList[existingIndex].id : generateId(),
      userId,
      ...progress
    };

    if (existingIndex >= 0) {
      progressList[existingIndex] = newProgress;
    } else {
      progressList.push(newProgress);
    }

    setToStorage(STORAGE_KEYS.DAILY_PROGRESS, progressList);
    return newProgress;
  }

  async getProgressHistory(userId: string, days: number): Promise<DailyProgress[]> {
    const endDate = new Date();
    const startDate = new Date(endDate.getTime() - (days - 1) * 24 * 60 * 60 * 1000);
    
    const progressList = getFromStorage<DailyProgress[]>(STORAGE_KEYS.DAILY_PROGRESS, [])
      .filter(p => p.userId === userId)
      .map(p => ({ ...p, date: parseDate(p.date) }))
      .filter(p => p.date >= startDate && p.date <= endDate)
      .sort((a, b) => a.date.getTime() - b.date.getTime());
    
    return progressList;
  }

  async getCurrentStreak(userId: string): Promise<number> {
    const progressList = getFromStorage<DailyProgress[]>(STORAGE_KEYS.DAILY_PROGRESS, [])
      .filter(p => p.userId === userId)
      .map(p => ({ ...p, date: parseDate(p.date) }))
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    let streak = 0;
    const today = new Date();
    
    for (const progress of progressList) {
      const daysDiff = Math.floor((today.getTime() - progress.date.getTime()) / (24 * 60 * 60 * 1000));
      
      if (daysDiff === streak && progress.streakDay) {
        streak++;
      } else {
        break;
      }
    }
    
    return streak;
  }

  async getSubjectStats(userId: string): Promise<any[]> {
    const attempts = await this.getQuestionAttemptsByUser(userId);
    const subjects = await this.getAllSubjects();
    
    const stats = subjects.map(subject => {
      const subjectAttempts = attempts.filter(a => a.subjectId === subject.id);
      const totalQuestions = subjectAttempts.reduce((sum, a) => sum + a.questionsAttempted, 0);
      const totalCorrect = subjectAttempts.reduce((sum, a) => sum + a.correctAnswers, 0);
      const totalTime = subjectAttempts.reduce((sum, a) => sum + a.timeSpent, 0);
      
      return {
        subjectId: subject.id,
        subjectName: subject.name,
        totalQuestions,
        correctAnswers: totalCorrect,
        totalTime,
        attemptCount: subjectAttempts.length,
        accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
        avgTime: totalQuestions > 0 ? Math.round(totalTime / totalQuestions * 10) / 10 : 0
      };
    }).filter(stat => stat.totalQuestions > 0);
    
    return stats;
  }

  async getWeeklyStats(userId: string): Promise<any[]> {
    const progressHistory = await this.getProgressHistory(userId, 7);
    
    return progressHistory.map(progress => ({
      ...progress,
      date: progress.date.toISOString().split('T')[0]
    }));
  }

  async getUserStats(userId: string): Promise<any> {
    const attempts = await this.getQuestionAttemptsByUser(userId);
    const totalQuestions = attempts.reduce((sum, a) => sum + a.questionsAttempted, 0);
    const totalCorrect = attempts.reduce((sum, a) => sum + a.correctAnswers, 0);
    const totalTime = attempts.reduce((sum, a) => sum + a.timeSpent, 0);
    
    return {
      totalQuestions,
      totalCorrect,
      totalTime,
      accuracy: totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0,
      avgTime: totalQuestions > 0 ? Math.round(totalTime / totalQuestions * 10) / 10 : 0
    };
  }

  async getUserSettings(userId: string): Promise<UserSettings | undefined> {
    const settings = getFromStorage<UserSettings[]>(STORAGE_KEYS.USER_SETTINGS, []);
    return settings.find(s => s.userId === userId);
  }

  async updateUserSettings(userId: string, settings: Partial<InsertUserSettings>): Promise<UserSettings> {
    const allSettings = getFromStorage<UserSettings[]>(STORAGE_KEYS.USER_SETTINGS, []);
    const existingIndex = allSettings.findIndex(s => s.userId === userId);

    const newSettings: UserSettings = {
      id: existingIndex >= 0 ? allSettings[existingIndex].id : generateId(),
      userId,
      theme: "light",
      reminderEnabled: true,
      ...settings
    };

    if (existingIndex >= 0) {
      allSettings[existingIndex] = newSettings;
    } else {
      allSettings.push(newSettings);
    }

    setToStorage(STORAGE_KEYS.USER_SETTINGS, allSettings);
    return newSettings;
  }
}

export const storage = new LocalStorage();