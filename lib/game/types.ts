export type SubjectId = "informatics" | "math" | "russian";

export type TrackId = "overall" | SubjectId;

export type StatusId =
  | "botik"
  | "nubik"
  | "normis"
  | "sharyashiy"
  | "tasher"
  | "sigma"
  | "gigachad";

export type GameEntry = {
  subject: SubjectId;
  date: string;
  countA: number;
  countB: number;
  countC: number;
};

export type LevelProgress = {
  level: number;
  xpIntoLevel: number;
  xpToNext: number;
  progress01: number;
};

export type TrackProgress = LevelProgress & {
  totalXp: number;
  statusId: StatusId;
  statusTitle: string;
};

export type AchievementContext = {
  entries: readonly GameEntry[];
  overall: TrackProgress;
  subjects: Record<SubjectId, TrackProgress>;
  streak: number;
};

export type ProgressSnapshot = {
  overall: TrackProgress;
  subjects: Record<SubjectId, TrackProgress>;
  streak: number;
  satisfiedAchievementIds: string[];
};
