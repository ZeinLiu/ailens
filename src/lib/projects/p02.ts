import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Python 3.10+",
    "pip",
    "Completed Project 01 (Document Q&A with citations)",
  ],
  tools: [
    {
      name: "openai tavily-python python-dotenv",
      installCmd: "pip install openai tavily-python python-dotenv",
      purpose: "OpenAI tool-calling API and Tavily web search (built for LLM agents)",
    },
  ],
  apiKeys: [
    {
      name: "OPENAI_API_KEY",
      where: "platform.openai.com → API Keys",
      envVar: "OPENAI_API_KEY=sk-...",
    },
    {
      name: "TAVILY_API_KEY",
      where: "app.tavily.com → API Keys (free tier available)",
      envVar: "TAVILY_API_KEY=tvly-...",
    },
  ],
  projectStructure:
    "agent/\n├── agent.py\n├── tools.py\n├── .env\n└── tests/\n    └── test_agent.py",
};

const beginner: Step[] = [
  {
    title: "Complete Document Q&A (Project 01) first",
    sub: "This is an Advanced project — Project 01 builds the required foundation.",
    meta: { location: "—", tool: "—" },
    body: "Building a tool-calling ReAct agent requires confidence with Python, the OpenAI API, and reading API responses. Project 01 (Document Q&A with cited answers) covers exactly these foundations. Return here once Project 01 is working end-to-end on your machine.",
    prompt: {
      context: "Prerequisite not met.",
      instruction:
        "Go to Project 01 and complete all 3 beginner steps. Once query.py returns cited answers from your PDF, come back here and switch to Intermediate depth.",
    },
    verify: {
      run: 'python query.py "test question"',
      expect: "Answer: [cited answer]\nSources: docs/your-document.pdf",
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
