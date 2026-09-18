export type ResearchMedia = { kind: 'image' | 'video'; url: string };
export type Source = {
  nguon_id: string;
  url: string;
  meta?: {
    tieu_de?: string;
    tac_gia?: string;
    to_chuc?: string;
    ngay_dang?: string;
  };
  trang_thai: string;
  ly_do?: string;
  canh_bao?: string[];
  rationale?: string;
  trich_dan: string[];
  evidence?: { id: string; sourceId: string; snapshotHash?: string; quote: string; start: number; end: number }[];
  snapshot?: string;
  media?: ResearchMedia[];
  extraction_method?: string;
  fetched_at?: string;
  approved: boolean;
  snapshot_hash?: string;
  diem_tieu_chi?: number[];
  cach_ly?: string[];
};
export type Sentence = {
  id: string;
  scene: number;
  text: string;
  original: string;
  claimIds: string[];
  evidenceIds: string[];
  sourceIds?: string[];
  media?: ResearchMedia | null;
  visual?: string;
  seconds?: number;
  needsRewrite?: boolean;
  needsVerification?: boolean;
};
export type Finding = {
  id: string;
  sentenceId: string;
  quote: string | null;
  start: number;
  end: number;
  category: string;
  feedbackId?: string | null;
  feedbackTitle?: string | null;
  severity: string;
  reason: string;
  suggestion: string;
  replacement: string | null;
  decision: string | null;
};
export type Project = {
  id: string;
  mode: "research" | "qa";
  revision: number;
  brief: { topic: string; goal: string; audience: string; duration: number };
  sources: Source[];
  researchQueries?: string[];
  scriptContext?: string;
  sentences: Sentence[];
  claims: Record<
    string,
    {
      trang_thai: string;
      bang_chung: { nguon_id: string; doan_trich: string }[];
    }
  >;
  findings: Finding[];
  sourceApprovalRevision: number | null;
  approvedRevision: number | null;
  reviewStatus: string;
  reviewFeedbackIds?: string[];
  run: { status: string; message: string } | null;
  audit: unknown[];
};
export type Summary = {
  id: string;
  mode: string;
  title: string;
  updatedAt: string;
  revision: number;
};
export type User = { email: string; role: "teacher" | "student" };
export type Feedback = {
  id: string;
  title: string;
  content: string;
  authorEmail: string;
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  updatedAt: string;
  reviewedAt: string | null;
  reviewedBy: string | null;
};

async function parse(res: Response) {
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Yêu cầu thất bại");
  return data;
}
export async function getSession(): Promise<User | null> {
  return (await parse(await fetch("/api/auth/session"))).user;
}
export async function login(email: string, password: string, role: User["role"]): Promise<User> {
  return (await parse(await fetch("/api/auth/login", {
    method: "POST", headers: { "content-type": "application/json" },
    body: JSON.stringify({ email, password, role }),
  }))).user;
}
export async function logout(): Promise<void> {
  await parse(await fetch("/api/auth/logout", { method: "POST" }));
}
export async function listFeedback(): Promise<Feedback[]> {
  return (await parse(await fetch("/api/feedback"))).feedback;
}
export async function createFeedback(input: { title: string; content: string }): Promise<Feedback> {
  return parse(await fetch("/api/feedback", {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }));
}
export async function updateFeedback(id: string, input: { title: string; content: string }): Promise<Feedback> {
  return parse(await fetch(`/api/feedback/${id}`, {
    method: "PUT", headers: { "content-type": "application/json" }, body: JSON.stringify(input),
  }));
}
export async function deleteFeedback(id: string): Promise<void> {
  await parse(await fetch(`/api/feedback/${id}`, { method: "DELETE" }));
}
export async function decideFeedback(id: string, decision: "approved" | "rejected"): Promise<Feedback> {
  return parse(await fetch(`/api/feedback/${id}/decision`, {
    method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ decision }),
  }));
}
export async function listProjects(): Promise<Summary[]> {
  return (await parse(await fetch("/api/projects"))).projects;
}
export async function getProject(id: string): Promise<Project> {
  return parse(await fetch(`/api/projects/${id}`));
}
export async function createProject(input: unknown): Promise<Project> {
  return parse(
    await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    }),
  );
}
export async function deleteProject(id: string) {
  return parse(await fetch(`/api/projects/${id}`, { method: "DELETE" }));
}
export async function projectAction(
  project: Project,
  action: string,
  extra: object = {},
  onProgress?: (message: string) => void,
): Promise<Project> {
  const res = await fetch(`/api/projects/${project.id}/action`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      action,
      revision: project.revision,
      requestId: crypto.randomUUID(),
      ...extra,
    }),
  });
  if (res.headers.get("content-type")?.includes("ndjson")) {
    if (!res.body) throw new Error("Không nhận được tiến trình");
    const reader = res.body.getReader(),
      decoder = new TextDecoder();
    let buffer = "";
    let output: Project | null = null;
    while (true) {
      const { done, value } = await reader.read();
      buffer += decoder.decode(value || new Uint8Array(), { stream: !done });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        const event = JSON.parse(line);
        if (event.type === "error") throw new Error(event.message);
        if (event.type === "result") output = event.project;
        if (event.message) onProgress?.(event.message);
      }
      if (done) break;
    }
    if (!output)
      throw new Error("Tác vụ kết thúc nhưng không có kết quả. Tải lại phiên.");
    return output;
  }
  return parse(res);
}
