import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  LineChart, 
  Line,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from "recharts";
import { 
  Microchip, 
  Target, 
  Clock, 
  TrendingUp, 
  BookOpen, 
  Calendar,
  Plus,
  Moon,
  Sun,
  Flame,
  CheckCircle,
  AlertTriangle,
  Info,
  Bell
} from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import type { Subject, QuestionAttempt } from "@shared/schema";

const COLORS = [
  "#1976D2", "#388E3C", "#FF9800", "#9C27B0", 
  "#F44336", "#607D8B", "#795548", "#3F51B5"
];

const questionAttemptSchema = z.object({
  subjectId: z.string().min(1, "Please select a subject"),
  topic: z.string().min(1, "Please select a topic"),
  questionsAttempted: z.number().min(1, "Must attempt at least 1 question"),
  correctAnswers: z.number().min(0, "Correct answers cannot be negative"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  timeSpent: z.number().min(1, "Time spent must be at least 1 minute"),
});

type QuestionAttemptForm = z.infer<typeof questionAttemptSchema>;

interface DailyProgressResponse {
  progress?: {
    totalQuestions: number;
    totalCorrect: number;
    totalTimeSpent: number;
    targetAchieved: boolean;
  };
  attempts: QuestionAttempt[];
  questionsToday: number;
  accuracyRate: number;
  timeSpent: number;
}

interface SubjectStat {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  totalCorrect: number;
  totalTime: number;
  attemptCount: number;
  accuracy: number;
  avgTime: number;
}

interface WeeklyStat {
  date: string;
  totalQuestions: number;
  totalCorrect: number;
  totalTimeSpent: number;
  targetAchieved: boolean;
  streakDay: boolean;
}

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Queries with proper typing
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["/api/subjects"],
  });

  const { data: todayProgress } = useQuery<DailyProgressResponse>({
    queryKey: ["/api/daily-progress/today"],
    refetchInterval: 30000,
  });

  const { data: weeklyStats = [] } = useQuery<WeeklyStat[]>({
    queryKey: ["/api/analytics/weekly"],
  });

  const { data: subjectStats = [] } = useQuery<SubjectStat[]>({
    queryKey: ["/api/analytics/subjects"],
  });

  const { data: streak } = useQuery<{ streak: number }>({
    queryKey: ["/api/streak"],
  });

  // Form
  const form = useForm<QuestionAttemptForm>({
    resolver: zodResolver(questionAttemptSchema),
    defaultValues: {
      subjectId: "",
      topic: "",
      questionsAttempted: 5,
      correctAnswers: 4,
      difficulty: "Medium",
      timeSpent: 25,
    },
  });

  // Mutations
  const addQuestionMutation = useMutation({
    mutationFn: async (data: QuestionAttemptForm) => {
      const response = await apiRequest("POST", "/api/question-attempts", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/daily-progress/today"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/subjects"] });
      queryClient.invalidateQueries({ queryKey: ["/api/analytics/weekly"] });
      queryClient.invalidateQueries({ queryKey: ["/api/streak"] });
      form.reset();
      toast({
        title: "Success!",
        description: "Question attempt logged successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log question attempt.",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: QuestionAttemptForm) => {
    if (data.correctAnswers > data.questionsAttempted) {
      toast({
        title: "Invalid Data",
        description: "Correct answers cannot exceed total questions attempted.",
        variant: "destructive",
      });
      return;
    }
    addQuestionMutation.mutate(data);
  };

  // Get selected subject's topics
  const selectedSubjectData = subjects.find(s => s.id === selectedSubject);
  const topicOptions = selectedSubjectData?.topics || [];

  // Calculate progress percentages
  const dailyTarget = 30;
  const questionsToday = todayProgress?.questionsToday || 0;
  const accuracyRate = todayProgress?.accuracyRate || 0;
  const timeSpent = todayProgress?.timeSpent || 0;
  const progressPercentage = Math.min((questionsToday / dailyTarget) * 100, 140);

  // Format time
  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  // Chart data
  const weeklyChartData = weeklyStats.map((stat, index) => ({
    date: new Date(stat.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    questions: stat.totalQuestions,
    target: dailyTarget,
  }));

  const subjectChartData = subjectStats.map((stat, index) => ({
    subject: stat.subjectName?.split(' ')[0] || 'Unknown',
    questions: stat.totalQuestions,
    accuracy: stat.accuracy,
    color: COLORS[index % COLORS.length],
  }));

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navigation */}
      <nav className="bg-card shadow-lg border-b sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-primary">
                <Microchip className="inline mr-2" size={20} />
                GATE ECE Tracker
              </h1>
              <div className="hidden md:block ml-8">
                <div className="flex items-baseline space-x-4">
                  <Button variant="default" size="sm">Dashboard</Button>
                  <Button variant="ghost" size="sm">Analytics</Button>
                  <Button variant="ghost" size="sm">Syllabus</Button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon size={16} /> : <Sun size={16} />}
              </Button>
              <Badge className="bg-green-500 hover:bg-green-600">
                <Flame className="mr-1" size={12} />
                {streak?.streak || 0} Days
              </Badge>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Daily Progress Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-2xl">Today's Progress</CardTitle>
            <p className="text-muted-foreground">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              {/* Questions Today */}
              <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Questions Today</p>
                    <p className="text-3xl font-bold text-blue-700 dark:text-blue-300">{questionsToday}</p>
                  </div>
                  <div className="p-3 bg-blue-500 rounded-full">
                    <Target className="text-white" size={20} />
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={progressPercentage} className="h-2" />
                  <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                    Target: {dailyTarget} questions ({Math.round(progressPercentage)}%)
                  </p>
                </div>
              </div>

              {/* Accuracy Rate */}
              <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-600 dark:text-green-400">Accuracy Rate</p>
                    <p className="text-3xl font-bold text-green-700 dark:text-green-300">{accuracyRate}%</p>
                  </div>
                  <div className="p-3 bg-green-500 rounded-full">
                    <TrendingUp className="text-white" size={20} />
                  </div>
                </div>
                <div className="mt-2">
                  <Progress value={accuracyRate} className="h-2" />
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    {accuracyRate >= 70 ? "Good!" : "Needs improvement"}
                  </p>
                </div>
              </div>

              {/* Study Time */}
              <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Study Time</p>
                    <p className="text-3xl font-bold text-orange-700 dark:text-orange-300">{formatTime(timeSpent)}</p>
                  </div>
                  <div className="p-3 bg-orange-500 rounded-full">
                    <Clock className="text-white" size={20} />
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Avg: {questionsToday > 0 ? Math.round(timeSpent / questionsToday * 10) / 10 : 0} min/question
                  </p>
                </div>
              </div>
            </div>

            <Button 
              onClick={() => document.getElementById('question-form')?.scrollIntoView({ behavior: 'smooth' })}
              className="w-full"
              size="lg"
            >
              <Plus className="mr-2" size={16} />
              Log Questions Attempted
            </Button>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column: Question Logger */}
          <div className="lg:col-span-1 space-y-6">
            <Card id="question-form">
              <CardHeader>
                <CardTitle>
                  <Plus className="inline mr-2" size={20} />
                  Add Questions
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  {/* Subject Selection */}
                  <div>
                    <Label>Subject</Label>
                    <Select 
                      value={selectedSubject} 
                      onValueChange={(value) => {
                        setSelectedSubject(value);
                        form.setValue("subjectId", value);
                        form.setValue("topic", "");
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select subject" />
                      </SelectTrigger>
                      <SelectContent>
                        {subjects.map((subject) => (
                          <SelectItem key={subject.id} value={subject.id}>
                            {subject.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.subjectId && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.subjectId.message}</p>
                    )}
                  </div>

                  {/* Topic Selection */}
                  <div>
                    <Label>Topic</Label>
                    <Select 
                      value={form.watch("topic")} 
                      onValueChange={(value) => form.setValue("topic", value)}
                      disabled={!selectedSubject}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select topic" />
                      </SelectTrigger>
                      <SelectContent>
                        {topicOptions.map((topic) => (
                          <SelectItem key={topic} value={topic}>
                            {topic}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {form.formState.errors.topic && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.topic.message}</p>
                    )}
                  </div>

                  {/* Questions Attempted */}
                  <div>
                    <Label>Questions Attempted</Label>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      {...form.register("questionsAttempted", { valueAsNumber: true })}
                    />
                    {form.formState.errors.questionsAttempted && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.questionsAttempted.message}</p>
                    )}
                  </div>

                  {/* Correct Answers */}
                  <div>
                    <Label>Correct Answers</Label>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      {...form.register("correctAnswers", { valueAsNumber: true })}
                    />
                    {form.formState.errors.correctAnswers && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.correctAnswers.message}</p>
                    )}
                  </div>

                  {/* Difficulty */}
                  <div>
                    <Label>Difficulty</Label>
                    <div className="flex space-x-2 mt-1">
                      {["Easy", "Medium", "Hard"].map((difficulty) => (
                        <Button
                          key={difficulty}
                          type="button"
                          variant={form.watch("difficulty") === difficulty ? "default" : "outline"}
                          size="sm"
                          onClick={() => form.setValue("difficulty", difficulty as any)}
                          className="flex-1"
                        >
                          {difficulty}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Time Spent */}
                  <div>
                    <Label>Time Spent (minutes)</Label>
                    <Input
                      type="number"
                      min={1}
                      {...form.register("timeSpent", { valueAsNumber: true })}
                    />
                    {form.formState.errors.timeSpent && (
                      <p className="text-sm text-red-500 mt-1">{form.formState.errors.timeSpent.message}</p>
                    )}
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={addQuestionMutation.isPending}
                  >
                    {addQuestionMutation.isPending ? "Logging..." : "Log Questions"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quick Stats</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Streak</span>
                  <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">
                    <Flame className="mr-1" size={12} />
                    {streak?.streak || 0} days
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total Subjects</span>
                  <span className="font-semibold">{subjects.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Questions Today</span>
                  <span className="font-semibold">{questionsToday}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Analytics */}
          <div className="lg:col-span-2 space-y-6">
            <Tabs defaultValue="weekly" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="weekly">Weekly Progress</TabsTrigger>
                <TabsTrigger value="subjects">Subject Analysis</TabsTrigger>
              </TabsList>

              <TabsContent value="weekly" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Progress Chart</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line 
                            type="monotone" 
                            dataKey="questions" 
                            stroke="#2563eb" 
                            strokeWidth={3}
                            name="Questions Attempted"
                          />
                          <Line 
                            type="monotone" 
                            dataKey="target" 
                            stroke="#dc2626" 
                            strokeDasharray="5 5"
                            name="Daily Target"
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="subjects" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Subject-wise Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subjectStats.length > 0 ? (
                      <div className="space-y-4">
                        <div className="h-80">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={subjectChartData}>
                              <CartesianGrid strokeDasharray="3 3" />
                              <XAxis dataKey="subject" />
                              <YAxis />
                              <Tooltip />
                              <Legend />
                              <Bar dataKey="questions" fill="#2563eb" name="Questions Attempted" />
                              <Bar dataKey="accuracy" fill="#16a34a" name="Accuracy %" />
                            </BarChart>
                          </ResponsiveContainer>
                        </div>

                        <div className="mt-6">
                          <h4 className="text-lg font-semibold mb-4">Detailed Subject Analysis</h4>
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Subject</TableHead>
                                <TableHead>Questions</TableHead>
                                <TableHead>Accuracy</TableHead>
                                <TableHead>Avg Time</TableHead>
                                <TableHead>Sessions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {subjectStats.map((stat, index) => (
                                <TableRow key={stat.subjectId}>
                                  <TableCell>
                                    <div className="flex items-center">
                                      <div 
                                        className="w-3 h-3 rounded-full mr-2"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                      />
                                      {stat.subjectName}
                                    </div>
                                  </TableCell>
                                  <TableCell>{stat.totalQuestions}</TableCell>
                                  <TableCell>
                                    <Badge 
                                      variant={stat.accuracy >= 70 ? "default" : "secondary"}
                                      className={stat.accuracy >= 70 ? "bg-green-500" : "bg-orange-500"}
                                    >
                                      {stat.accuracy}%
                                    </Badge>
                                  </TableCell>
                                  <TableCell>{stat.avgTime} min</TableCell>
                                  <TableCell>{stat.attemptCount}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BookOpen className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                        <h3 className="text-lg font-medium text-muted-foreground mb-2">
                          No data available yet
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Start logging your question attempts to see detailed analytics
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>

        {/* Syllabus Overview */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="mr-2" size={20} />
              GATE ECE Syllabus Overview
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjects.map((subject, index) => {
                const subjectStat = subjectStats.find(s => s.subjectId === subject.id);
                const progress = subjectStat ? subjectStat.totalQuestions : 0;
                
                return (
                  <div key={subject.id} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-sm">{subject.name}</h4>
                      <Badge variant="outline" className="text-xs">
                        {subject.weightage}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-3">
                      {subject.topics.length} topics • {progress} questions attempted
                    </p>
                    <div className="space-y-1">
                      {subject.topics.slice(0, 3).map((topic, topicIndex) => (
                        <div key={topicIndex} className="text-xs text-muted-foreground">
                          • {topic}
                        </div>
                      ))}
                      {subject.topics.length > 3 && (
                        <div className="text-xs text-muted-foreground">
                          +{subject.topics.length - 3} more topics
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reminders and Notifications */}
        <Card className="mt-8 border-orange-200 bg-orange-50 dark:bg-orange-900/20">
          <CardHeader>
            <CardTitle className="flex items-center text-orange-800 dark:text-orange-200">
              <Bell className="mr-2" size={20} />
              Daily Reminder
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-orange-700 dark:text-orange-300">
                  {questionsToday >= dailyTarget ? (
                    <>
                      <CheckCircle className="inline mr-2" size={16} />
                      Congratulations! You've achieved today's target of {dailyTarget} questions.
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="inline mr-2" size={16} />
                      You need {dailyTarget - questionsToday} more questions to reach today's target.
                    </>
                  )}
                </p>
                <p className="text-sm text-orange-600 dark:text-orange-400 mt-1">
                  Current streak: {streak?.streak || 0} days
                </p>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-orange-800 dark:text-orange-200">
                  {Math.round(progressPercentage)}%
                </p>
                <p className="text-xs text-orange-600 dark:text-orange-400">
                  of daily target
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}