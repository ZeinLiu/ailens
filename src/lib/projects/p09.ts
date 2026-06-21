import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Python 3.10+",
    "pip",
    "Completed Project 03 (Streaming Chatbot) — you need an existing prompt to evaluate",
  ],
  tools: [
    {
      name: "openai pytest python-dotenv",
      installCmd: "pip install openai pytest python-dotenv",
      purpose:
        "OpenAI for running and judging outputs, Pytest for the CI-compatible test runner",
    },
  ],
  apiKeys: [
    {
      name: "OPENAI_API_KEY",
      where: "platform.openai.com → API Keys",
      envVar: "OPENAI_API_KEY=sk-...",
    },
  ],
  projectStructure:
    "prompt-eval/\n├── eval_set.jsonl\n├── runner.py\n├── judge.py\n├── report.py\n├── tests/\n│   └── test_quality.py\n└── .env",
};

const beginner: Step[] = [
  {
    title: "Complete Streaming Chatbot (Project 03) first",
    sub: "You need an existing prompt and chatbot to evaluate.",
    meta: { location: "—", tool: "—" },
    body: "A prompt evaluation framework requires an existing prompt-based system to evaluate. Project 03 (Ship a live AI chat assistant) gives you exactly that: a working chatbot with a system prompt. Build and deploy that first, then return here to measure whether your prompt is actually doing what you think it is.",
    prompt: {
      context: "Prerequisite not met.",
      instruction:
        "Complete Project 03 first — deploy the streaming chatbot with a custom system prompt and confirm it responds correctly at the live Vercel URL. Then return here and switch to Intermediate depth to build the evaluation framework.",
    },
    verify: {
      run: "Open your Project 03 Vercel URL",
      expect:
        "The chatbot responds using the role and tone defined in your system prompt.",
      type: "prerequisite-check",
    },
    time: "—",
  },
];

export const steps: Record<Depth, Step[]> = {
  beginner,
  intermediate: [],
  advanced: [],
};
