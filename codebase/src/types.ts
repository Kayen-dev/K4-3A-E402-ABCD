export interface SourceItem {
  id: string; // 'A' | 'B' | 'C' | custom
  code: string; // 'Nguồn A', etc.
  name: string;
  org: string;
  year?: string;
  link: string;
  quote: string;
  reliability: 'high' | 'medium' | 'low';
  isExcluded: boolean;
  statusText: string;
  reason: string;
  isAutoApproved?: boolean;
}

export interface ScriptSentence {
  id: number;
  originalText: string;
  currentText: string;
  sourceIds: string[];
  requiresSourceC?: boolean;
  isRewritten?: boolean;
  rewrittenText?: string;
  rewrittenSourceIds?: string[];
  badgeStatus: 'valid' | 'multi_valid' | 'warning' | 'rewritten';
}

export interface LectureForm {
  topic: string;
  goal: string;
  audience: string;
  duration: string;
}
