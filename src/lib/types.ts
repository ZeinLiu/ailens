export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type Category = "RAG" | "Agents" | "Chatbots" | "Fine-tuning" | "Vision" | "Speech" | "Automation";
export type Depth = "beginner" | "intermediate" | "advanced";

export interface EnvSetup {
  prerequisites: string[];
  tools: { name: string; installCmd: string; purpose: string }[];
  apiKeys: { name: string; where: string; envVar: string }[];
  projectStructure: string;
}

export interface StepMeta {
  location: string;
  tool: string;
  userInputs?: string[];
}

export interface StepPrompt {
  context: string;
  instruction: string;
  tool?: string;
}

export interface StepVerify {
  run: string;
  expect: string;
  type: string;
}

export interface Step {
  title: string;
  sub: string;
  meta: StepMeta;
  body: string;
  prompt: StepPrompt;
  verify: StepVerify;
  time: string;
  confidence?: number;
}

export interface Source {
  author: string;
  platform: string;
  url?: string;
  note?: string;
}

export interface Project {
  id: number;
  num: string;
  title: string;
  tagline: string;
  difficulty: Difficulty;
  categories: Category[];
  tools: string[];
  timeEstimate: string;
  stepCount: number;
  isLocal: boolean;
  source?: Source;
  envSetup: EnvSetup;
  depthDesc: Record<Depth, string>;
  overview: string;
  realWorldUses: { scenario: string; desc: string }[];
  painPoints: string[];
  whoBenefits: { role: string; gain: string }[];
  steps: Record<Depth, Step[]>;
}
