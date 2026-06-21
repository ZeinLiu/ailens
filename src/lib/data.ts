export type { Difficulty, Category, Depth, EnvSetup, StepMeta, StepPrompt, StepVerify, Step, Source, Project } from "./types";
import type { Project, Difficulty, Category } from "./types";

import { envSetup as p01Env, steps as p01Steps } from "./projects/p01";
import { envSetup as p02Env, steps as p02Steps } from "./projects/p02";
import { envSetup as p03Env, steps as p03Steps } from "./projects/p03";
import { envSetup as p04Env, steps as p04Steps } from "./projects/p04";
import { envSetup as p05Env, steps as p05Steps } from "./projects/p05";
import { envSetup as p06Env, steps as p06Steps } from "./projects/p06";
import { envSetup as p07Env, steps as p07Steps } from "./projects/p07";
import { envSetup as p08Env, steps as p08Steps } from "./projects/p08";
import { envSetup as p09Env, steps as p09Steps } from "./projects/p09";

export const PROJECTS: Project[] = [
  {
    id: 1,
    num: "01",
    title: "Ask questions across your files and get cited answers instantly",
    tagline:
      "Stop ctrl+F searching through hundreds of pages. Upload your PDFs, ask in plain English, get the answer with the exact source — runs fully on your machine.",
    source: {
      author: "LangChain team",
      platform: "LangChain docs",
      url: "https://python.langchain.com/docs/tutorials/rag/",
    },
    difficulty: "Beginner",
    categories: ["RAG"],
    tools: ["Python", "LangChain", "Chroma"],
    timeEstimate: "~3h",
    stepCount: 3,
    isLocal: true,
    depthDesc: {
      beginner:
        "Local files, a single PDF, and a prebuilt retriever — you wire the pieces together and see it answer with citations.",
      intermediate:
        "Focus on chunking strategy, retrieval tuning, and wrapping the chain as a reusable API endpoint.",
      advanced:
        "Hybrid search, reranking, semantic chunking, and production cost/latency modelling.",
    },
    overview:
      "Takes a folder of PDF documents, splits them into overlapping chunks, converts each chunk into a vector embedding stored in a local Chroma database, and answers plain-English questions grounded only in your documents — with citations back to the exact source.",
    realWorldUses: [
      {
        scenario: "Law firm knowledge base",
        desc: "Lawyers query 500 case files in plain English and get cited answers with exact document and page.",
      },
      {
        scenario: "HR policy Q&A",
        desc: "Staff ask 'how many sick days do I get?' and receive a cited answer from the employee handbook.",
      },
      {
        scenario: "Academic research",
        desc: "Query 50 papers at once, get cited synthesis without reading everything.",
      },
      {
        scenario: "Customer support",
        desc: "Ground your support bot in product docs only — no hallucinated features.",
      },
    ],
    painPoints: [
      "Ctrl+F only finds exact strings — you need concept-level search",
      "Generic LLMs will invent answers when they don't know",
      "Reading 500 pages to find one answer costs hours",
      "External SaaS tools send your sensitive docs to third-party servers",
    ],
    whoBenefits: [
      { role: "Researchers", gain: "Synthesise literature without reading everything" },
      { role: "Legal teams", gain: "Find precedents across case library in seconds" },
      { role: "Support teams", gain: "Answer tickets grounded in product docs only" },
      { role: "Product managers", gain: "Instant answers from specs and PRDs" },
    ],
    envSetup: p01Env,
    steps: p01Steps,
  },
  {
    id: 2,
    num: "02",
    title: "Build an AI that searches, calculates, and takes actions on your behalf",
    tagline:
      "Give an LLM real tools — web search, a calculator, live APIs — and watch it reason through multi-step problems without you lifting a finger.",
    source: {
      author: "Simon Willison",
      platform: "X / Blog",
      url: "https://simonwillison.net",
    },
    difficulty: "Advanced",
    categories: ["Agents"],
    tools: ["Python", "OpenAI"],
    timeEstimate: "~5h",
    stepCount: 8,
    isLocal: false,
    depthDesc: {
      beginner: "Not recommended at Beginner level — complete project 01 first.",
      intermediate:
        "Understand the ReAct loop, implement 2 tools, and handle tool-call errors.",
      advanced:
        "Design the tool schema, implement streaming tool calls, handle parallel tool use and retry logic.",
    },
    overview:
      "Implements a ReAct (Reason + Act) agent loop that decides which tool to call based on the user's query, executes the tool, observes the result, and loops until it has a final answer. You control which tools are available and how routing decisions are made.",
    realWorldUses: [
      {
        scenario: "Research assistant",
        desc: "Agent searches the web, reads URLs, and synthesises a cited answer.",
      },
      {
        scenario: "Data analyst",
        desc: "Agent calls a calculator and SQL tool to answer quantitative questions over your database.",
      },
      {
        scenario: "Customer ops bot",
        desc: "Agent looks up order status, checks inventory, and drafts a reply — all in one turn.",
      },
      {
        scenario: "Personal assistant",
        desc: "Agent checks calendar, sends emails, and sets reminders in response to natural language.",
      },
    ],
    painPoints: [
      "LLMs can't take actions — they only produce text",
      "Hard-coding tool logic doesn't scale to new request types",
      "Users need multi-step reasoning, not single-shot answers",
    ],
    whoBenefits: [
      {
        role: "Developers",
        gain: "Build autonomous workflows without writing decision trees",
      },
      {
        role: "Ops teams",
        gain: "Automate multi-step lookups that currently require human triage",
      },
    ],
    envSetup: p02Env,
    steps: p02Steps,
  },
  {
    id: 3,
    num: "03",
    title: "Ship a live AI chat assistant in an afternoon — with streaming and memory",
    tagline:
      "No backend expertise needed. Build a chat UI where responses stream word-by-word and the bot remembers what you said — deployed to a real URL with one command.",
    source: {
      author: "Vercel AI SDK team",
      platform: "Vercel Docs",
      url: "https://sdk.vercel.ai/docs",
    },
    difficulty: "Beginner",
    categories: ["Chatbots"],
    tools: ["Next.js", "Vercel"],
    timeEstimate: "~2h",
    stepCount: 4,
    isLocal: false,
    depthDesc: {
      beginner: "Use the Vercel AI SDK useChat hook — streaming and memory handled for you.",
      intermediate:
        "Implement conversation memory strategies and add system prompt customisation.",
      advanced:
        "Design the streaming architecture, add multi-turn context management, and build evaluation tooling.",
    },
    overview:
      "Builds a full chat interface with token-by-token streaming output and multi-turn conversation memory, deployed to a live URL on Vercel. Uses the Vercel AI SDK to handle the streaming complexity.",
    realWorldUses: [
      {
        scenario: "Internal knowledge bot",
        desc: "Company chatbot that employees query for policies and procedures.",
      },
      {
        scenario: "Product onboarding",
        desc: "Guided assistant that helps new users learn a product feature by feature.",
      },
      {
        scenario: "Personal AI assistant",
        desc: "Custom-prompted chatbot tuned to your writing style and preferences.",
      },
      {
        scenario: "Customer FAQ bot",
        desc: "Deflect common support questions before they reach a human agent.",
      },
    ],
    painPoints: [
      "Building streaming from scratch involves complex SSE/WebSocket plumbing",
      "Chat memory requires careful context management to avoid token limits",
      "Deploying AI apps usually requires backend infrastructure knowledge",
    ],
    whoBenefits: [
      {
        role: "Frontend developers",
        gain: "Ship a production AI feature without backend expertise",
      },
      {
        role: "Founders",
        gain: "Validate a chatbot product idea in an afternoon",
      },
    ],
    envSetup: p03Env,
    steps: p03Steps,
  },
  {
    id: 4,
    num: "04",
    title: "Train a private AI model that outperforms ChatGPT on your specific task",
    tagline:
      "A general LLM is a generalist. A fine-tuned model trained on your data beats it every time on your task — at a fraction of the inference cost, running entirely on your own hardware.",
    source: {
      author: "Sebastian Raschka",
      platform: "Magazine / X",
      url: "https://magazine.sebastianraschka.com",
    },
    difficulty: "Advanced",
    categories: ["Fine-tuning"],
    tools: ["PyTorch", "PEFT"],
    timeEstimate: "~6h",
    stepCount: 9,
    isLocal: false,
    depthDesc: {
      beginner: "Not recommended at Beginner level — requires ML fundamentals.",
      intermediate: "Use the OpenAI fine-tuning API for a no-infrastructure path to a custom model.",
      advanced:
        "Full LoRA fine-tune with PEFT, custom training loop, and rigorous evaluation.",
    },
    overview:
      "Prepares a labelled dataset, fine-tunes a small language model using LoRA (Low-Rank Adaptation) via the PEFT library, and evaluates accuracy on an intent classification task. Produces a model you own and can serve privately.",
    realWorldUses: [
      {
        scenario: "Intent classifier",
        desc: "Route customer messages to the right support queue with >95% accuracy.",
      },
      {
        scenario: "Tone detector",
        desc: "Classify text as formal/informal/aggressive for content moderation.",
      },
      {
        scenario: "Domain-specific Q&A",
        desc: "A model trained on your internal knowledge that outperforms a general LLM on your use case.",
      },
      {
        scenario: "PII detector",
        desc: "Fine-tuned NER model that identifies personally identifiable information in documents.",
      },
    ],
    painPoints: [
      "General LLMs perform poorly on narrow domain tasks",
      "API-based models have latency and cost at scale",
      "You can't run a general LLM on-device — a fine-tuned small model can",
    ],
    whoBenefits: [
      {
        role: "ML engineers",
        gain: "Build domain-specific models without training from scratch",
      },
      {
        role: "Product teams",
        gain: "Reduce inference cost by 10–100x vs a general LLM API",
      },
    ],
    envSetup: p04Env,
    steps: p04Steps,
  },
  {
    id: 5,
    num: "05",
    title: "Build an AI that reads screenshots, charts, and documents like a human would",
    tagline:
      "Point a vision model at any image — a UI screenshot, a bar chart, a scanned form — and get back structured answers, extracted data, or a description of what's wrong.",
    source: {
      author: "Greg Kamradt",
      platform: "YouTube / X",
      url: "https://www.youtube.com/@DataIndependent",
    },
    difficulty: "Intermediate",
    categories: ["Vision"],
    tools: ["VLM", "FastAPI"],
    timeEstimate: "~4h",
    stepCount: 7,
    isLocal: false,
    depthDesc: {
      beginner: "Start with project 03 first — this builds on API fundamentals.",
      intermediate:
        "Send images to a vision model, parse structured outputs, and wrap as a FastAPI service.",
      advanced:
        "Handle multi-image inputs, implement streaming, and design for production throughput.",
    },
    overview:
      "Builds an API that accepts images (screenshots, charts, documents) and answers questions about them using a vision-language model. Handles OCR, chart reading, and visual Q&A in a single unified endpoint.",
    realWorldUses: [
      {
        scenario: "Screenshot bug reporter",
        desc: "User pastes a screenshot; the assistant describes the bug and suggests a fix.",
      },
      {
        scenario: "Chart data extractor",
        desc: "Upload a chart image; get back the underlying data as JSON.",
      },
      {
        scenario: "Document OCR pipeline",
        desc: "Photograph a handwritten form; extract all fields as structured data.",
      },
      {
        scenario: "UI accessibility checker",
        desc: "Upload a UI screenshot; get a list of accessibility issues.",
      },
    ],
    painPoints: [
      "OCR tools are brittle and format-specific",
      "Charts require manual data extraction",
      "Screenshots are unstructured — impossible to process with text tools alone",
    ],
    whoBenefits: [
      {
        role: "Developers",
        gain: "Automate visual QA workflows that previously needed human review",
      },
      {
        role: "Data teams",
        gain: "Extract chart data without manual transcription",
      },
    ],
    envSetup: p05Env,
    steps: p05Steps,
  },
  {
    id: 6,
    num: "06",
    title: "Turn any meeting recording into structured notes and action items automatically",
    tagline:
      "Stop taking notes during calls. Record, transcribe with Whisper, and get a clean summary with decisions made, owners named, and deadlines captured — delivered to Slack before the meeting ends.",
    source: {
      author: "Swyx (Shawn Wang)",
      platform: "Latent Space Podcast / X",
      url: "https://www.latent.space",
    },
    difficulty: "Intermediate",
    categories: ["Speech"],
    tools: ["Whisper", "Python"],
    timeEstimate: "~3h",
    stepCount: 3,
    isLocal: false,
    depthDesc: {
      beginner: "Use the OpenAI Whisper API — no local model needed.",
      intermediate:
        "Run Whisper locally, add speaker diarisation, and structure the output with Claude.",
      advanced:
        "Real-time streaming transcription, custom vocabulary, and integration with calendar/task tools.",
    },
    overview:
      "Records or uploads a meeting audio file, transcribes it with Whisper, and passes the transcript to an LLM to produce structured meeting notes: summary, key decisions, action items with owners, and follow-up questions.",
    realWorldUses: [
      {
        scenario: "Engineering standups",
        desc: "Auto-generate a written summary and action item list from 15-minute standups.",
      },
      {
        scenario: "Sales call notes",
        desc: "Extract next steps, objections, and commitments from customer calls automatically.",
      },
      {
        scenario: "Board meetings",
        desc: "Produce formal minutes with decisions and assigned actions from long meetings.",
      },
      {
        scenario: "Interviews",
        desc: "Transcribe user research interviews and extract key themes and quotes.",
      },
    ],
    painPoints: [
      "Manual note-taking splits attention from the conversation",
      "Action items from meetings are forgotten within hours",
      "Meeting recordings are watched by almost no one",
    ],
    whoBenefits: [
      {
        role: "Managers",
        gain: "Stop taking notes, stay present, get a better summary",
      },
      {
        role: "Sales teams",
        gain: "Capture every commitment from customer calls automatically",
      },
    ],
    envSetup: p06Env,
    steps: p06Steps,
  },
  {
    id: 7,
    num: "07",
    title: "Replace hours of manual monitoring with an AI workflow that runs itself",
    tagline:
      "Pick any repetitive task — check this page, summarise what changed, tell me on Slack. Chain it into a scheduled flow that runs without you. No backend, no code if you use n8n.",
    source: {
      author: "Ben Tossell",
      platform: "Ben's Bites Newsletter",
      url: "https://bensbites.com",
    },
    difficulty: "Beginner",
    categories: ["Automation"],
    tools: ["n8n", "Webhook"],
    timeEstimate: "~2h",
    stepCount: 4,
    isLocal: false,
    depthDesc: {
      beginner: "Use n8n's visual editor — no code required.",
      intermediate: "Build the same flow in Python with schedule and httpx.",
      advanced:
        "Design for reliability: idempotency, error handling, dead letter queues, and monitoring.",
    },
    overview:
      "Chains three steps — scrape a source, summarise with AI, and notify via Slack or email — into a scheduled workflow that runs automatically. Demonstrates how to build useful AI automations without writing a backend.",
    realWorldUses: [
      {
        scenario: "Competitor monitoring",
        desc: "Check competitor pricing pages daily and get a Slack alert if anything changes.",
      },
      {
        scenario: "News digest",
        desc: "Scrape RSS feeds, summarise the top 5 stories, and email them to your inbox every morning.",
      },
      {
        scenario: "Job board monitor",
        desc: "Watch a job board for new postings matching your criteria and notify immediately.",
      },
      {
        scenario: "Price tracker",
        desc: "Monitor product prices and alert when they drop below a threshold.",
      },
    ],
    painPoints: [
      "Repetitive monitoring tasks consume hours per week",
      "Manual checking is inconsistent — you miss things",
      "Building a proper backend for simple automations is overkill",
    ],
    whoBenefits: [
      {
        role: "Non-developers",
        gain: "Automate workflows without writing code",
      },
      {
        role: "Solopreneurs",
        gain: "Replace hours of manual monitoring with a single setup",
      },
    ],
    envSetup: p07Env,
    steps: p07Steps,
  },
  {
    id: 8,
    num: "08",
    title: "Build search that understands meaning, not just keywords",
    tagline:
      "Keyword search fails when users phrase things differently. Vector search finds what they mean, even when the words don't match. Add reranking and you beat Google-level search in an afternoon.",
    source: {
      author: "Jason Liu",
      platform: "X / Instructor Docs",
      url: "https://jxnl.github.io/instructor",
    },
    difficulty: "Intermediate",
    categories: ["RAG"],
    tools: ["Embeddings", "Qdrant"],
    timeEstimate: "~4h",
    stepCount: 7,
    isLocal: false,
    depthDesc: {
      beginner: "Complete project 01 first — this is the production evolution of that project.",
      intermediate:
        "Build hybrid search and add a reranking step to compare retrieval strategies.",
      advanced:
        "Design for scale: sharded Qdrant, ANN index tuning, and latency SLOs.",
    },
    overview:
      "Builds a semantic search service that goes beyond keyword matching. Implements vector search with Qdrant, adds BM25 keyword search, combines them with hybrid retrieval, and adds a reranking step — then measures the quality improvement at each stage.",
    realWorldUses: [
      {
        scenario: "Internal documentation search",
        desc: "Find the right engineering doc even when you can't remember the exact terms used.",
      },
      {
        scenario: "E-commerce product search",
        desc: "Return relevant products for 'something warm for a winter hike' without those exact words in product descriptions.",
      },
      {
        scenario: "Legal case search",
        desc: "Find relevant precedents by concept, not just matching citation numbers.",
      },
      {
        scenario: "Code search",
        desc: "Search a codebase by what the code does, not just the function name.",
      },
    ],
    painPoints: [
      "Keyword search fails when users don't use the exact right words",
      "Embedding-only search misses exact-match cases (names, codes, IDs)",
      "No reranking means the most semantically similar chunk isn't always the most relevant",
    ],
    whoBenefits: [
      {
        role: "Developers",
        gain: "Search infrastructure that finds the right result, not just the lexically matching one",
      },
      {
        role: "Product teams",
        gain: "Search that understands user intent, not just keywords",
      },
    ],
    envSetup: p08Env,
    steps: p08Steps,
  },
  {
    id: 9,
    num: "09",
    title: "Stop guessing which AI prompt works — measure and compare them quantitatively",
    tagline:
      "Every team changes prompts by gut feel and hopes things got better. Build a graded test set, an LLM-as-judge scorer, and a CI gate — so you know for certain before you ship.",
    source: {
      author: "Hamel Husain",
      platform: "Blog / X",
      url: "https://hamel.dev",
    },
    difficulty: "Intermediate",
    categories: ["Agents"],
    tools: ["Python", "Pytest"],
    timeEstimate: "~3h",
    stepCount: 6,
    isLocal: false,
    depthDesc: {
      beginner: "Start with project 03 — this assumes you have a prompt to evaluate.",
      intermediate:
        "Build a structured eval set, implement LLM-as-judge scoring, and integrate with Pytest.",
      advanced:
        "Design multi-dimensional rubrics, statistical significance testing, and CI integration.",
    },
    overview:
      "Builds a structured evaluation framework for prompts and models. Creates a graded test set with expected outputs, implements an LLM-as-judge scoring system, and produces comparative reports — so prompt changes can be made with confidence.",
    realWorldUses: [
      {
        scenario: "Prompt regression testing",
        desc: "Catch when a prompt change makes answers worse before it reaches users.",
      },
      {
        scenario: "Model comparison",
        desc: "Quantitatively compare GPT-4o vs Claude vs Gemini on your specific task.",
      },
      {
        scenario: "A/B prompt testing",
        desc: "Run two prompt variants on the same test set and pick the winner by score.",
      },
      {
        scenario: "Quality gate for deployment",
        desc: "Block a release if eval score drops below a threshold.",
      },
    ],
    painPoints: [
      "Prompt changes feel like guessing — you don't know if they helped",
      "Manual review of outputs doesn't scale past 20 examples",
      "Model upgrades might break carefully tuned prompts",
    ],
    whoBenefits: [
      {
        role: "AI engineers",
        gain: "Ship prompt changes with confidence instead of hope",
      },
      {
        role: "Product teams",
        gain: "Data-driven decisions on model and prompt selection",
      },
    ],
    envSetup: p09Env,
    steps: p09Steps,
  },
];

export const CATEGORIES: Category[] = [
  "RAG",
  "Agents",
  "Chatbots",
  "Fine-tuning",
  "Vision",
  "Speech",
  "Automation",
];
export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
