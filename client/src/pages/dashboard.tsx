import { useState, useEffect } from "react";
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
import { COLORS } from "@/lib/constants";

const questionAttemptSchema = z.object({
  subjectId: z.string().min(1, "Please select a subject"),
  topic: z.string().min(1, "Please select a topic"),
  questionsAttempted: z.number().min(1, "Must attempt at least 1 question"),
  correctAnswers: z.number().min(0, "Correct answers cannot be negative"),
  difficulty: z.enum(["Easy", "Medium", "Hard"]),
  timeSpent: z.number().min(1, "Time spent must be at least 1 minute"),
});

type QuestionAttemptForm = z.infer<typeof questionAttemptSchema>;

export default function Dashboard() {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedSubject, setSelectedSubject] = useState<string>("");

  // Queries
  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: todayProgress } = useQuery({
    queryKey: ["/api/daily-progress/today"],
    refetchInterval: 30000,
  });

  const { data: weeklyStats = [] } = useQuery({
    queryKey: ["/api/analytics/weekly"],
  });

  const { data: subjectStats = [] } = useQuery({
    queryKey: ["/api/analytics/subjects"],
  });

  const { data: streak } = useQuery({
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
                    {addQuestionMutation.isPending ? "Saving..." : "Save Progress"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Weekly Target Card */}
            <Card className="bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20">
              <CardHeader>
                <CardTitle className="text-purple-800 dark:text-purple-300">
                  <Target className="inline mr-2" size={20} />
                  Weekly Goals
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700 dark:text-purple-300">Daily 30+ Questions</span>
                  <div className="flex items-center">
                    <Progress value={85} className="w-16 mr-2" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">6/7</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700 dark:text-purple-300">Cover 8 Subjects</span>
                  <div className="flex items-center">
                    <Progress value={75} className="w-16 mr-2" />
                    <span className="text-sm font-medium text-purple-700 dark:text-purple-300">6/8</span>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-purple-700 dark:text-purple-300">70%+ Accuracy</span>
                  <div className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={16} />
                    <span className="text-sm font-medium text-green-600 dark:text-green-400">{accuracyRate}% ✓</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Analytics */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Charts */}
            <Tabs defaultValue="subjects" className="space-y-6">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="subjects">Subject Performance</TabsTrigger>
                <TabsTrigger value="weekly">Weekly Progress</TabsTrigger>
              </TabsList>
              
              <TabsContent value="subjects">
                <Card>
                  <CardHeader>
                    <CardTitle>Subject-wise Performance</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="subject" />
                          <YAxis yAxisId="left" />
                          <YAxis yAxisId="right" orientation="right" />
                          <Tooltip />
                          <Legend />
                          <Bar yAxisId="left" dataKey="questions" fill="hsl(var(--primary))" name="Questions" />
                          <Line yAxisId="right" dataKey="accuracy" stroke="hsl(var(--destructive))" name="Accuracy %" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="weekly">
                <Card>
                  <CardHeader>
                    <CardTitle>Weekly Progress Trend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={weeklyChartData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="date" />
                          <YAxis />
                          <Tooltip />
                          <Legend />
                          <Line dataKey="questions" stroke="hsl(var(--primary))" name="Daily Questions" strokeWidth={2} />
                          <Line dataKey="target" stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" name="Target (30)" />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            {/* Subject Breakdown Table */}
            <Card>
              <CardHeader>
                <CardTitle>Detailed Subject Analysis</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Avg Time</TableHead>
                      <TableHead>Trend</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {subjectStats.map((stat, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{stat.subjectName}</TableCell>
                        <TableCell>
                          {stat.totalQuestions} 
                          <span className="text-xs text-muted-foreground ml-1">
                            ({Math.round((stat.totalQuestions / subjectStats.reduce((sum, s) => sum + s.totalQuestions, 0)) * 100)}%)
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={stat.accuracy >= 75 ? "default" : stat.accuracy >= 60 ? "secondary" : "destructive"}
                          >
                            {stat.accuracy}%
                          </Badge>
                        </TableCell>
                        <TableCell>{stat.avgTime} min</TableCell>
                        <TableCell>
                          {stat.accuracy >= 75 ? (
                            <TrendingUp className="text-green-500" size={16} />
                          ) : (
                            <AlertTriangle className="text-yellow-500" size={16} />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Syllabus Coverage */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>
              <BookOpen className="inline mr-2" size={20} />
              GATE ECE 2025 Syllabus Coverage
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {subjects.slice(0, 4).map((subject, index) => {
                const stats = subjectStats.find(s => s.subjectId === subject.id);
                const coverage = stats ? Math.min((stats.totalQuestions / 50) * 100, 100) : 0;
                
                return (
                  <div key={subject.id} className={`rounded-lg p-4 border ${
                    index === 0 ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-700' :
                    index === 1 ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700' :
                    index === 2 ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-700' :
                    'bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700'
                  }`}>
                    <h4 className={`font-medium mb-2 ${
                      index === 0 ? 'text-blue-800 dark:text-blue-300' :
                      index === 1 ? 'text-green-800 dark:text-green-300' :
                      index === 2 ? 'text-yellow-800 dark:text-yellow-300' :
                      'text-purple-800 dark:text-purple-300'
                    }`}>{subject.name}</h4>
                    <div className={`text-xs space-y-1 ${
                      index === 0 ? 'text-blue-600 dark:text-blue-400' :
                      index === 1 ? 'text-green-600 dark:text-green-400' :
                      index === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-purple-600 dark:text-purple-400'
                    }`}>
                      {subject.topics.slice(0, 4).map((topic, topicIndex) => (
                        <div key={topicIndex} className="flex justify-between">
                          <span>{topic}</span>
                          <span className="font-medium">{Math.floor(Math.random() * 30) + 70}%</span>
                        </div>
                      ))}
                    </div>
                    <div className="mt-3">
                      <Progress value={coverage} className="h-2" />
                      <p className={`text-xs mt-1 ${
                        index === 0 ? 'text-blue-600 dark:text-blue-400' :
                        index === 1 ? 'text-green-600 dark:text-green-400' :
                        index === 2 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-purple-600 dark:text-purple-400'
                      }`}>Overall: {Math.round(coverage)}% covered</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>

        {/* Reminder System */}
        <Card className="mt-8 bg-gradient-to-r from-red-50 to-pink-50 dark:from-red-900/20 dark:to-pink-900/20">
          <CardHeader>
            <CardTitle className="text-red-800 dark:text-red-300">
              <Bell className="inline mr-2" size={20} />
              Study Reminders & Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-700 dark:text-red-400">Today's Alerts</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  {questionsToday >= dailyTarget ? (
                    <div className="flex items-center text-green-600 dark:text-green-400">
                      <CheckCircle className="mr-2" size={16} />
                      <span>Daily target achieved! ({questionsToday}/{dailyTarget} questions)</span>
                    </div>
                  ) : (
                    <div className="flex items-center text-orange-600 dark:text-orange-400">
                      <AlertTriangle className="mr-2" size={16} />
                      <span>Daily target pending ({questionsToday}/{dailyTarget} questions)</span>
                    </div>
                  )}
                  {accuracyRate < 70 && (
                    <div className="flex items-center text-red-600 dark:text-red-400">
                      <AlertTriangle className="mr-2" size={16} />
                      <span>Overall accuracy below 70%</span>
                    </div>
                  )}
                  <div className="flex items-center text-blue-600 dark:text-blue-400">
                    <Info className="mr-2" size={16} />
                    <span>{streak?.streak || 0}-day streak maintained!</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-base text-red-700 dark:text-red-400">Study Schedule</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Morning Session</span>
                    <span className="font-medium">9:00 AM - 12:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Evening Session</span>
                    <span className="font-medium">6:00 PM - 9:00 PM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Next Reminder</span>
                    <span className="font-medium text-blue-600 dark:text-blue-400">6:00 PM Today</span>
                  </div>
                  <Button size="sm" variant="outline" className="w-full mt-3">
                    Configure Reminders
                  </Button>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Mobile Bottom Navigation */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t px-4 py-2">
        <div className="flex justify-around">
          <Button variant="ghost" size="sm" className="flex flex-col py-2 text-primary">
            <Calendar size={18} />
            <span className="text-xs mt-1">Dashboard</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col py-2">
            <Plus size={18} />
            <span className="text-xs mt-1">Add</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col py-2">
            <TrendingUp size={18} />
            <span className="text-xs mt-1">Analytics</span>
          </Button>
          <Button variant="ghost" size="sm" className="flex flex-col py-2">
            <BookOpen size={18} />
            <span className="text-xs mt-1">Syllabus</span>
          </Button>
        </div>
      </div>
    </div>
  );
}
