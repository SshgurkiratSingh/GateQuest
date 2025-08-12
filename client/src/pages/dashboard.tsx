import { useState, useRef, FC } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, api } from "@/lib/queryClient";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, LineChart, Line, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Microchip, Target, Clock, TrendingUp, BookOpen, Calendar, Plus, Moon, Sun, Flame, CheckCircle, AlertTriangle, Info, Bell, Shuffle } from "lucide-react";
import { useTheme } from "@/components/theme-provider";
import { useToast } from "@/hooks/use-toast";
import type { Subject, QuestionAttempt } from "@shared/schema";
import { HistoryTab } from "./history-tab";

const COLORS = ["#1976D2", "#388E3C", "#FF9800", "#9C27B0", "#F44336", "#607D8B", "#795548", "#3F51B5"];

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

interface AnalyticsData {
  subjectId: string;
  subjectName: string;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
}

interface TopicStatsData {
  topicName: string;
  subjectName: string;
  totalQuestions: number;
  totalCorrect: number;
  accuracy: number;
  avgTime: number;
}

const Dashboard: FC = () => {
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const form = useForm<QuestionAttemptForm>({
    resolver: zodResolver(questionAttemptSchema),
    defaultValues: {
      subjectId: "",
      topic: "",
      questionsAttempted: 1,
      correctAnswers: 0,
      difficulty: "Medium",
      timeSpent: 30,
    },
  });

  const { data: subjects = [], isLoading: loadingSubjects } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: api.subjects.getAll,
  });

  const { data: dailyProgress, isLoading: loadingProgress } = useQuery<DailyProgressResponse>({
    queryKey: ["daily-progress", "today"],
    queryFn: api.dailyProgress.getToday,
  });

  const { data: weeklyStats = [], isLoading: loadingWeekly } = useQuery<any[]>({
    queryKey: ["analytics", "weekly"],
    queryFn: api.analytics.getWeekly,
  });

  const { data: subjectStats = [], isLoading: loadingSubjects2 } = useQuery<AnalyticsData[]>({
    queryKey: ["analytics", "subjects"],
    queryFn: api.analytics.getSubjects,
  });

  const { data: topicStats = [], isLoading: loadingTopics } = useQuery<TopicStatsData[]>({
    queryKey: ["analytics", "topics"],
    queryFn: api.analytics.getTopics,
  });

  const { data: streakData, isLoading: loadingStreak } = useQuery<{ streak: number }>({
    queryKey: ["streak"],
    queryFn: api.streak.getCurrent,
  });

  const questionMutation = useMutation({
    mutationFn: (data: QuestionAttemptForm) => api.questionAttempts.create(data),
    onSuccess: () => {
      toast({
        title: "Success!",
        description: "Question attempt logged successfully.",
      });
      form.reset();
      queryClient.invalidateQueries({ queryKey: ["daily-progress"] });
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to log question attempt. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (data: QuestionAttemptForm) => {
    if (data.correctAnswers > data.questionsAttempted) {
      form.setError("correctAnswers", {
        message: "Correct answers cannot exceed questions attempted",
      });
      return;
    }
    questionMutation.mutate(data);
  };

  const handleSuggestTopic = async () => {
    try {
      const res = await fetch("/api/random-topic");
      if (!res.ok) throw new Error("Failed to suggest topic");
      const data = await res.json();
      form.setValue("subjectId", data.subjectId);
      setSelectedSubjectId(data.subjectId);
      form.setValue("topic", data.topic);
      const subjectName = subjects.find((s: Subject) => s.id === data.subjectId)?.name;
      toast({
        title: "Topic Suggested!",
        description: `How about studying "${data.topic}" from "${subjectName}"?`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Could not suggest a topic. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleExport = async () => {
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Failed to export data");
      const csvData = await res.text();
      const blob = new Blob([csvData], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "question-attempts.csv";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast({
        title: "Success!",
        description: "Question attempts exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to export data. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') return;

        const res = await fetch("/api/import", {
          method: "POST",
          headers: { "Content-Type": "text/csv" },
          body: content,
        });

        if (!res.ok) throw new Error("Failed to import data");

        toast({
          title: "Success!",
          description: "Data imported successfully. The page will now reload.",
        });

        await queryClient.invalidateQueries();
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to import data. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  if (loadingSubjects) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const selectedSubject = subjects.find((s: Subject) => s.id === selectedSubjectId);
  const currentStreak = streakData?.streak || 0;
  const progressPercentage = dailyProgress ? Math.round((dailyProgress.questionsToday / 30) * 100) : 0;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="flex h-16 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <Microchip className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-2xl font-bold">GATE ECE Tracker</h1>
              <p className="text-sm text-muted-foreground">Electronics & Communication Engineering</p>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 space-y-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Today's Progress</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="text-2xl font-bold">{dailyProgress?.questionsToday || 0}/30</div>
                <Progress value={progressPercentage} className="h-2" />
                <p className="text-xs text-muted-foreground">{progressPercentage}% of daily target</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Accuracy Rate</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyProgress?.accuracyRate || 0}%</div>
              <p className="text-xs text-muted-foreground">Today's performance</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{currentStreak}</div>
              <p className="text-xs text-muted-foreground">{currentStreak === 1 ? "day" : "days"} in a row</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Time Spent</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{dailyProgress?.timeSpent || 0}m</div>
              <p className="text-xs text-muted-foreground">Today's study time</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="log" className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="log">Log Questions</TabsTrigger>
            <TabsTrigger value="progress">Progress</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="subjects">Subjects</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>

          <TabsContent value="log" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Plus className="h-5 w-5" />
                    <span>Log Question Attempt</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={handleSuggestTopic}>
                    <Shuffle className="h-4 w-4 mr-2" />
                    Suggest a Topic
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="subjectId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <Select
                              value={field.value}
                              onValueChange={(value) => {
                                field.onChange(value);
                                setSelectedSubjectId(value);
                              }}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a subject" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {subjects.map((subject: Subject) => (
                                  <SelectItem key={subject.id} value={subject.id}>
                                    {subject.name} ({subject.code})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="topic"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Topic</FormLabel>
                            <Select value={field.value} onValueChange={field.onChange}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select a topic" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {selectedSubject?.topics.map((topic: string) => (
                                  <SelectItem key={topic} value={topic}>
                                    {topic}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="questionsAttempted"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Questions Attempted</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" max="50" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="correctAnswers"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Correct Answers</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="difficulty"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Difficulty</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select difficulty" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="Easy">Easy</SelectItem>
                                <SelectItem value="Medium">Medium</SelectItem>
                                <SelectItem value="Hard">Hard</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="timeSpent"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Time Spent (minutes)</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" max="300" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" className="w-full" disabled={questionMutation.isPending}>
                      {questionMutation.isPending ? "Logging..." : "Log Question Attempt"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Weekly Progress</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingWeekly ? (
                  <div className="h-[300px] flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={weeklyStats}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="totalQuestions" stroke="#1976D2" name="Questions" />
                      <Line type="monotone" dataKey="totalCorrect" stroke="#388E3C" name="Correct" />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Recent Attempts</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Subject</TableHead>
                      <TableHead>Topic</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Difficulty</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {dailyProgress?.attempts.map((attempt: QuestionAttempt) => {
                      const subject = subjects.find((s: Subject) => s.id === attempt.subjectId);
                      const accuracy = Math.round((attempt.correctAnswers / attempt.questionsAttempted) * 100);
                      return (
                        <TableRow key={attempt.id}>
                          <TableCell className="font-medium">{subject?.code || "Unknown"}</TableCell>
                          <TableCell>{attempt.topic}</TableCell>
                          <TableCell>{attempt.questionsAttempted}</TableCell>
                          <TableCell>{attempt.correctAnswers}</TableCell>
                          <TableCell>
                            <Badge variant={accuracy >= 80 ? "default" : accuracy >= 60 ? "secondary" : "destructive"}>
                              {accuracy}%
                            </Badge>
                          </TableCell>
                          <TableCell>{attempt.timeSpent}m</TableCell>
                          <TableCell>
                            <Badge variant="outline">{attempt.difficulty}</Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {loadingSubjects2 ? (
                    <div className="h-[300px] flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                    </div>
                  ) : (
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={subjectStats}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="subjectName" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="totalQuestions" fill="#1976D2" name="Questions" />
                        <Bar dataKey="correctAnswers" fill="#388E3C" name="Correct" />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Accuracy Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={subjectStats} cx="50%" cy="50%" labelLine={false} label={({ subjectName, accuracy }: { subjectName: string; accuracy: number; }) => `${subjectName}: ${accuracy}%`} outerRadius={80} fill="#8884d8" dataKey="accuracy">
                        {subjectStats.map((entry: AnalyticsData, index: number) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Topic Performance</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Topic</TableHead>
                      <TableHead>Subject</TableHead>
                      <TableHead>Questions</TableHead>
                      <TableHead>Correct</TableHead>
                      <TableHead>Accuracy</TableHead>
                      <TableHead>Avg Time (m)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {loadingTopics ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">Loading...</TableCell>
                      </TableRow>
                    ) : (
                      topicStats.sort((a, b) => a.accuracy - b.accuracy).map((topic: TopicStatsData) => (
                        <TableRow key={`${topic.subjectName}-${topic.topicName}`}>
                          <TableCell>{topic.topicName}</TableCell>
                          <TableCell>{topic.subjectName}</TableCell>
                          <TableCell>{topic.totalQuestions}</TableCell>
                          <TableCell>{topic.totalCorrect}</TableCell>
                          <TableCell>
                            <Badge variant={topic.accuracy >= 80 ? "default" : topic.accuracy >= 60 ? "secondary" : "destructive"}>
                              {topic.accuracy}%
                            </Badge>
                          </TableCell>
                          <TableCell>{topic.avgTime}</TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="subjects" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {subjects.map((subject: Subject, index: number) => (
                <Card key={subject.id}>
                  <CardHeader>
                    <CardTitle className="flex items-center justify-between">
                      <span>{subject.name}</span>
                      <Badge style={{ backgroundColor: COLORS[index % COLORS.length] }}>{subject.code}</Badge>
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">Weightage: {subject.weightage}%</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold">Topics ({subject.topics.length})</h4>
                      <div className="max-h-32 overflow-y-auto">
                        {subject.topics.map((topic: string) => (
                          <Badge key={topic} variant="outline" className="mr-1 mb-1 text-xs">{topic}</Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>All Question Attempts</CardTitle>
                <div className="space-x-2">
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".csv" />
                  <Button variant="outline" size="sm" onClick={handleImportClick}>Import</Button>
                  <Button variant="outline" size="sm" onClick={handleExport}>Export</Button>
                </div>
              </CardHeader>
              <CardContent>
                <HistoryTab />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Dashboard;
