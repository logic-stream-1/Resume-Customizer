export interface BulletItem {
  original: string;
  rewritten: string;
  explanation: string;
}

export interface KeywordItem {
  keyword: string;
  status: "Genuine Gap" | "Rephrase Opportunity" | "Matched";
  context: string;
}

export interface TailoredResponse {
  rewrittenSummary: string;
  rewrittenBullets: BulletItem[];
  keywordAnalysis: KeywordItem[];
  atsScoreBefore: number;
  atsScoreAfter: number;
  modelUsed?: string;
}

export interface User {
  id: string;
  email: string;
  fullName: string;
  createdAt: string;
}

export interface UserConfig {
  id: string;
  userId: string;
  backgroundSummary: string;
  targetSectors: string[];
  activeRegion: "India" | "Global";
  personalPhone: string;
  personalLocation: string;
  personalLinks: string;
  personalTitle: string;
}

export interface HistoricalRun {
  id: string;
  userId: string;
  jobDescription: string;
  originalResume: string;
  rewrittenSummary: string;
  rewrittenBullets: BulletItem[];
  keywordAnalysis: KeywordItem[];
  atsScoreBefore: number;
  atsScoreAfter: number;
  createdAt: string;
}

export interface Opportunity {
  id: string;
  company: string;
  title: string;
  sector: string;
  region: "India" | "Global";
  score: number;
  wayInAngle: string;
  newsDomain: string;
  newsTitle: string;
  newsUrl: string;
}
