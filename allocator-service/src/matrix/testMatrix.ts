export type Env = "preview" | "production";
export type Mode = "streaming" | "non-streaming";
export type Risk = "low" | "medium" | "high";
export type Decision = "model" | "defer" | "reject";
export type Auth = "protected" | "bypass";

export type Vector = {
  env: Env;
  mode: Mode;
  risk: Risk;
  decision: Decision;
  auth: Auth;
};

export type AllocatorResponse = {
  headers: Record<string, string>;
  autoApproved: boolean;
  apiCalls: number;
  latency: number;
  stream: boolean;
  deferred: boolean;
};

export const ENVS: Env[] = ["preview", "production"];
export const MODES: Mode[] = ["streaming", "non-streaming"];
export const RISKS: Risk[] = ["low", "medium", "high"];
export const DECISIONS: Decision[] = ["model", "defer", "reject"];
export const AUTHS: Auth[] = ["protected", "bypass"];
