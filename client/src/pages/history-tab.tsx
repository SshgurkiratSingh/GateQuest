import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/queryClient";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Subject, QuestionAttempt } from "@shared/schema";

export function HistoryTab() {
  const { data: attempts = [], isLoading } = useQuery<QuestionAttempt[]>({
    queryKey: ["question-attempts"],
    queryFn: () => api.questionAttempts.getByUser(),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ["subjects"],
    queryFn: api.subjects.getAll,
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
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
        {attempts.map((attempt) => {
          const subject = subjects.find((s) => s.id === attempt.subjectId);
          const accuracy = Math.round((attempt.correctAnswers / attempt.questionsAttempted) * 100);
          return (
            <TableRow key={attempt.id}>
              <TableCell>{new Date(attempt.attemptDate).toLocaleDateString()}</TableCell>
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
  );
}
