import { QuestionAttempt } from "@shared/schema";
import Papa from "papaparse";

export function exportQuestionAttemptsToCsv(attempts: QuestionAttempt[]): string {
  const data = attempts.map(attempt => ({
    "id": attempt.id,
    "userId": attempt.userId,
    "attemptDate": attempt.attemptDate.toISOString(),
    "subjectId": attempt.subjectId,
    "topic": attempt.topic,
    "questionsAttempted": attempt.questionsAttempted,
    "correctAnswers": attempt.correctAnswers,
    "difficulty": attempt.difficulty,
    "timeSpent": attempt.timeSpent,
  }));

  return Papa.unparse(data);
}

export function importQuestionAttemptsFromCsv(csvString: string): Omit<QuestionAttempt, 'id' | 'userId' | 'attemptDate'>[] {
    const { data } = Papa.parse<Omit<QuestionAttempt, 'id' | 'userId' | 'attemptDate'>>(csvString, {
        header: true,
        dynamicTyping: true,
    });
    return data;
}
