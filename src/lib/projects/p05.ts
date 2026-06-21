import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Python 3.10+",
    "pip",
    "Completed Project 03 (Streaming Chatbot) — covers API and deployment basics",
  ],
  tools: [
    {
      name: "fastapi uvicorn openai pillow python-multipart python-dotenv",
      installCmd:
        "pip install fastapi uvicorn openai pillow python-multipart python-dotenv",
      purpose:
        "FastAPI for the image upload API, Pillow for preprocessing, OpenAI for the vision model",
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
    "vision-api/\n├── main.py\n├── vision.py\n├── .env\n└── test_images/\n    ├── screenshot.png\n    ├── chart.png\n    └── form.jpg",
};

const beginner: Step[] = [
  {
    title: "Complete Streaming Chatbot (Project 03) first",
    sub: "This project builds on API and deployment fundamentals from Project 03.",
    meta: { location: "—", tool: "—" },
    body: "Building a vision API requires comfort with API routes, request/response handling, and file uploads. Project 03 (Ship a live AI chat assistant) covers these API fundamentals. Once that's deployed and working, return here and switch to Intermediate depth to build the image processing service.",
    prompt: {
      context: "Prerequisite not met.",
      instruction:
        "Complete Project 03 first — deploy the streaming chatbot to Vercel and confirm it works at the live URL. Then return here and switch to Intermediate depth.",
    },
    verify: {
      run: "Open your Project 03 Vercel URL and send a message",
      expect: "The chatbot responds with streaming output at the live URL.",
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
