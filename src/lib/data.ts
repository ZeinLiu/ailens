export type Difficulty = "Beginner" | "Intermediate" | "Advanced";
export type Category = "RAG" | "Agents" | "Chatbots" | "Fine-tuning" | "Vision" | "Speech" | "Automation";
export type Depth = "beginner" | "intermediate" | "advanced";

export interface Step {
  title: string;
  sub: string;
  body: string;
  code?: string;
  why?: string;
  watchOut?: string;
  time: string;
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
  depthDesc: Record<Depth, string>;
  overview: string;
  realWorldUses: { scenario: string; desc: string }[];
  painPoints: string[];
  whoBenefits: { role: string; gain: string }[];
  steps: Record<Depth, Step[]>;
}

export const PROJECTS: Project[] = [
  {
    id: 1,
    num: "01",
    title: "Document Q&A with citations",
    tagline: "Chunk PDFs, embed, retrieve, and answer grounded in your own sources — runs fully local.",
    difficulty: "Beginner",
    categories: ["RAG"],
    tools: ["Python", "LangChain", "Chroma"],
    timeEstimate: "~3h",
    stepCount: 6,
    isLocal: true,
    depthDesc: {
      beginner: "Local files, a single PDF, and a prebuilt retriever — you wire the pieces together and see it answer with citations.",
      intermediate: "Focus on chunking strategy, retrieval tuning, and wrapping the chain as a reusable API endpoint.",
      advanced: "Hybrid search, reranking, semantic chunking, and production cost/latency modelling.",
    },
    overview: "Takes a folder of PDF documents, splits them into overlapping chunks, converts each chunk into a vector embedding stored in a local Chroma database, and answers plain-English questions grounded only in your documents — with citations back to the exact source.",
    realWorldUses: [
      { scenario: "Law firm knowledge base", desc: "Lawyers query 500 case files in plain English and get cited answers with exact document and page." },
      { scenario: "HR policy Q&A", desc: 'Staff ask "how many sick days do I get?" and receive a cited answer from the employee handbook.' },
      { scenario: "Academic research", desc: "Query 50 papers at once, get cited synthesis without reading everything." },
      { scenario: "Customer support", desc: "Ground your support bot in product docs only — no hallucinated features." },
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
    steps: {
      beginner: [
        {
          title: "Set up the environment",
          sub: "Install Python deps and load your PDF into the project.",
          body: "Install the three libraries this project needs. Open Terminal and run the command below. Each library handles one job: langchain orchestrates the pipeline, chromadb stores your vectors locally, pypdf reads PDF files.",
          code: `pip install langchain-community langchain-openai chromadb pypdf`,
          why: "Libraries are pre-built tools so you don't write everything from scratch — like downloading apps before using them.",
          watchOut: 'You also need an OpenAI API key. Get one at platform.openai.com, then run: export OPENAI_API_KEY="sk-..."',
          time: "~15 min",
        },
        {
          title: "Load and split the document",
          sub: "Read the PDF and break it into overlapping chunks.",
          body: "Create a file called ingest.py and add the code below. This loads your PDF and splits it into chunks of 1000 characters with 200-character overlap so context isn't lost between chunks.",
          code: `from langchain_community.document_loaders import PyPDFLoader
from langchain.text_splitter import RecursiveCharacterTextSplitter

loader = PyPDFLoader("your-document.pdf")
pages = loader.load()

splitter = RecursiveCharacterTextSplitter(
    chunk_size=1000, chunk_overlap=200
)
chunks = splitter.split_documents(pages)
print(f"Created {len(chunks)} chunks")`,
          why: "Splitting into chunks means the AI finds the relevant section, not the whole document. Overlap prevents cutting mid-sentence.",
          time: "~20 min",
        },
        {
          title: "Embed and index the chunks",
          sub: "Turn each chunk into a vector and store it in Chroma.",
          body: "Each chunk is embedded into a vector and written to a local Chroma collection. This index is what makes retrieval fast — build it once, query it many times.",
          code: `from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

embeddings = OpenAIEmbeddings()
db = Chroma.from_documents(
    documents=chunks,
    embedding=embeddings,
    persist_directory="./chroma",
)
db.persist()
print(f"Indexed {len(chunks)} chunks")`,
          why: "Embedding converts text into numbers that capture meaning. Similar meanings → similar numbers → fast retrieval.",
          time: "~15 min",
        },
        {
          title: "Build the retriever",
          sub: "Fetch the top-k most relevant chunks for a query.",
          body: "The retriever takes a question, converts it to a vector, and finds the most similar chunks in your database. Add this to a new file called query.py.",
          code: `from langchain_community.vectorstores import Chroma
from langchain_openai import OpenAIEmbeddings

db = Chroma(
    persist_directory="./chroma",
    embedding_function=OpenAIEmbeddings()
)
retriever = db.as_retriever(search_kwargs={"k": 4})

results = retriever.invoke("What is the refund policy?")
for r in results:
    print(r.page_content[:200])`,
          why: "k=4 means fetch 4 chunks. More chunks = more context but higher cost. Start with 4 and tune.",
          time: "~15 min",
        },
        {
          title: "Wire up the Q&A chain",
          sub: "Pass retrieved context to the model and return citations.",
          body: "Connect the retriever to an LLM. The chain automatically formats retrieved chunks as context and returns the source document alongside the answer.",
          code: `from langchain_openai import ChatOpenAI
from langchain.chains import RetrievalQAWithSourcesChain

llm = ChatOpenAI(model="gpt-4o-mini", temperature=0)
chain = RetrievalQAWithSourcesChain.from_chain_type(
    llm=llm, retriever=retriever
)

result = chain.invoke({"question": "What is the refund policy?"})
print("Answer:", result["answer"])
print("Source:", result["sources"])`,
          why: "temperature=0 means the model won't guess — it sticks to the context provided.",
          time: "~20 min",
        },
        {
          title: "Ask questions & verify sources",
          sub: "Run a query and click through to the cited passages.",
          body: "Run the full pipeline. First ingest your document, then ask questions. Test with questions you know the answers to — verify the citation points to the right page.",
          code: `# Terminal — run in order:
python ingest.py       # builds the vector database
python query.py        # asks a question

# Try these test questions:
# 1. Ask something clearly in the doc → expect a cited answer
# 2. Ask something NOT in the doc → expect "I don't know"
# 3. Ask the same question twice → expect the same answer`,
          watchOut: 'If the model answers questions not in your doc, add to your prompt: "Answer only from the provided context. If not found, say I don\'t have that information."',
          time: "~15 min",
        },
      ],
      intermediate: [
        { title: "Environment + deps", sub: "Set up project and install libraries.", body: "pip install langchain chromadb pypdf openai python-dotenv. Use .env for OPENAI_API_KEY. Add .env to .gitignore immediately.", code: `pip install langchain-community langchain-openai chromadb pypdf python-dotenv`, time: "~10 min" },
        { title: "Ingestion pipeline", sub: "Load, chunk, embed, persist.", body: "PyPDFDirectoryLoader → RecursiveCharacterTextSplitter(1000/200) → OpenAIEmbeddings → Chroma(persist_directory). Decision point: chunk_size=1000 is a starting heuristic. Dense technical docs → go smaller (500). Narrative text → larger (1500).", time: "~20 min" },
        { title: "Retrieval chain", sub: "Build the QA chain with sources.", body: "Use RetrievalQAWithSourcesChain, not plain RetrievalQA — the Sources variant returns document metadata for citations. Set retriever k=4. Tune up if answers feel incomplete.", time: "~15 min" },
        { title: "Quality testing", sub: "Verify before shipping.", body: "Write 5 questions whose answers you know are in the docs. Check: (a) correct answer, (b) correct citation, (c) 'I don't know' when the answer isn't in the docs (set temperature=0).", time: "~20 min" },
        { title: "FastAPI wrapper", sub: "Expose as an API endpoint.", body: "POST /query { question: str } → { answer: str, sources: str[] }. This makes it composable — any frontend or Slack bot can call it.", code: `from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class Query(BaseModel):
    question: str

@app.post("/query")
def query(q: Query):
    result = chain.invoke({"question": q.question})
    return {"answer": result["answer"], "sources": result["sources"]}`, time: "~20 min" },
        { title: "Incremental ingestion", sub: "Only re-embed changed files.", body: "First run: ingest all docs. Subsequent runs: check content_hash against stored metadata, only re-embed changed/new files.", time: "~15 min" },
      ],
      advanced: [
        { title: "Chunking strategy", sub: "Choose the right split approach.", body: "RecursiveCharacterTextSplitter is fine for prototyping. For production: use semantic chunking (split on meaning, not character count). Watch out: overlap too high → retrieval noise; too low → context breaks mid-sentence.", time: "~30 min" },
        { title: "Embedding model", sub: "Pick the right model for cost vs quality.", body: "text-embedding-3-small: cheap, fast, good enough for most cases. text-embedding-3-large: better recall, 5x cost. Local alternative: nomic-embed-text via Ollama — zero API cost, runs on CPU, comparable quality.", time: "~20 min" },
        { title: "Vector store", sub: "Chroma for local, Qdrant for production.", body: "Chroma degrades past ~100k chunks on a single node. For multi-user or large corpora: Qdrant (self-host) or Pinecone (managed). Key metric: p95 query latency.", time: "~30 min" },
        { title: "Hybrid search + reranking", sub: "BM25 + vector + cross-encoder.", body: "Naive cosine similarity misses keyword matches. Hybrid search (BM25 + vector) significantly improves recall. Add a reranking step (Cohere Rerank or cross-encoder) before passing chunks to the LLM — cuts hallucination meaningfully.", time: "~45 min" },
        { title: "Prompt hardening", sub: "Prevent out-of-context answers.", body: 'System prompt must include: "Answer only from the provided context. If the answer is not in the context, say \'I don\'t have that information\'." Without this, the LLM will hallucinate from training data.', time: "~15 min" },
        { title: "Cost + latency model", sub: "Understand your production economics.", body: "Embedding cost: ~$0.02 per 1M tokens (3-small). One-time per doc. Query cost: retrieval is free; LLM call is the variable cost. At gpt-4o-mini pricing, 1000 queries/day ≈ $2–5/day. Cache frequent queries: hash(question) → cached response.", time: "~20 min" },
      ],
    },
  },
  {
    id: 2, num: "02", title: "An agent that uses tools", tagline: "Build a ReAct loop that calls search, a calculator, and APIs — with tool routing you control.",
    difficulty: "Advanced", categories: ["Agents"], tools: ["Python", "OpenAI"], timeEstimate: "~5h", stepCount: 8, isLocal: false,
    depthDesc: { beginner: "Not recommended at Beginner level — complete project 01 first.", intermediate: "Understand the ReAct loop, implement 2 tools, and handle tool-call errors.", advanced: "Design the tool schema, implement streaming tool calls, handle parallel tool use and retry logic." },
    overview: "Implements a ReAct (Reason + Act) agent loop that decides which tool to call based on the user's query, executes the tool, observes the result, and loops until it has a final answer. You control which tools are available and how routing decisions are made.",
    realWorldUses: [
      { scenario: "Research assistant", desc: "Agent searches the web, reads URLs, and synthesises a cited answer." },
      { scenario: "Data analyst", desc: "Agent calls a calculator and SQL tool to answer quantitative questions over your database." },
      { scenario: "Customer ops bot", desc: "Agent looks up order status, checks inventory, and drafts a reply — all in one turn." },
      { scenario: "Personal assistant", desc: "Agent checks calendar, sends emails, and sets reminders in response to natural language." },
    ],
    painPoints: ["LLMs can't take actions — they only produce text", "Hard-coding tool logic doesn't scale to new request types", "Users need multi-step reasoning, not single-shot answers"],
    whoBenefits: [
      { role: "Developers", gain: "Build autonomous workflows without writing decision trees" },
      { role: "Ops teams", gain: "Automate multi-step lookups that currently require human triage" },
    ],
    steps: {
      beginner: [{ title: "Start with project 01 first", sub: "This project assumes RAG and API fundamentals.", body: "An agent that uses tools is classified Advanced. Complete Document Q&A with citations (project 01) before attempting this one.", time: "—" }],
      intermediate: [
        { title: "Define your tools", sub: "Schema-first tool design.", body: "Each tool is a Python function with a docstring. The LLM reads the docstring to decide when to call it. Keep tool names and descriptions precise.", code: `def search_web(query: str) -> str:\n    """Search the web for current information. Use for facts, news, prices.\"\"\"\n    # implement with SerpAPI or Tavily\n    ...`, time: "~30 min" },
        { title: "Build the ReAct loop", sub: "Reason → Act → Observe → repeat.", body: "Pass tools to the OpenAI API with tool_choice='auto'. Parse tool_calls from the response, execute the function, append the result, and loop until finish_reason == 'stop'.", time: "~45 min" },
        { title: "Handle tool errors", sub: "Graceful failure is required.", body: "Wrap every tool call in try/except. Return the error message as the tool result — the LLM will often self-correct on the next loop.", time: "~20 min" },
        { title: "Add a calculator tool", sub: "Safe expression evaluation.", body: "Never use eval(). Use Python's ast.literal_eval or the simpleeval library for safe arithmetic.", time: "~20 min" },
        { title: "Add a web search tool", sub: "Real-time information.", body: "Use Tavily AI search API — it's designed for LLM agents and returns clean, citation-ready results. Free tier covers development.", time: "~30 min" },
        { title: "Test with adversarial queries", sub: "Break it before users do.", body: "Test: queries that need 3+ tool calls, queries where no tool applies, queries with ambiguous tool routing, and queries that cause tool errors.", time: "~30 min" },
        { title: "Add streaming output", sub: "Show thinking in real time.", body: "Use stream=True on the OpenAI call. Surface intermediate tool calls to the UI so users see 'Searching...' and 'Calculating...' as it happens.", time: "~30 min" },
        { title: "Wrap as an API", sub: "FastAPI + Server-Sent Events.", body: "POST /agent { query } → SSE stream of {type: 'tool_call' | 'observation' | 'answer', content}. This decouples the agent from any frontend.", time: "~30 min" },
      ],
      advanced: [
        { title: "Tool schema design", sub: "Precision prevents misrouting.", body: "Overly broad tool descriptions cause the LLM to call the wrong tool. Write descriptions as if explaining to a junior dev when NOT to use this tool.", time: "~30 min" },
        { title: "Parallel tool calls", sub: "Multiple tools per loop iteration.", body: "GPT-4o supports parallel tool calls in a single response. Design your loop to execute all tool_calls concurrently (asyncio.gather), not sequentially.", time: "~45 min" },
        { title: "Retry and fallback logic", sub: "Production reliability.", body: "Tool failures should trigger a retry with the error context injected. After 2 retries, fall back to a 'I was unable to complete this action' response — never infinite loop.", time: "~30 min" },
        { title: "Context window management", sub: "Long conversations hit limits.", body: "Each tool result adds tokens. After 5 tool calls, summarise the observation history before continuing. Track token usage and truncate oldest observations first.", time: "~45 min" },
        { title: "Observability", sub: "Log every decision.", body: "Log: query, each tool called, tool inputs/outputs, total tokens, wall-clock latency, finish reason. This is the only way to debug agent failures in production.", time: "~30 min" },
        { title: "Evals", sub: "Measure routing accuracy.", body: "Build a test set of 20 queries with known correct tool sequences. Score: (a) correct tool selected, (b) correct tool inputs, (c) correct final answer. Run on every prompt change.", time: "~60 min" },
        { title: "Cost controls", sub: "Agents can be expensive.", body: "Set a max_iterations limit (5–10). Set a max_tokens_per_run budget. Prefer gpt-4o-mini for tool routing; only escalate to gpt-4o for final synthesis.", time: "~20 min" },
        { title: "Streaming architecture", sub: "SSE + React for real-time UI.", body: "Use ReadableStream in Next.js route handler. On the client, consume with EventSource or fetch+ReadableStream. Render each tool call as a collapsible 'thinking' block.", time: "~45 min" },
      ],
    },
  },
  {
    id: 3, num: "03", title: "Deploy a streaming chatbot", tagline: "A chat UI with streaming output and memory, shipped live with a single command.",
    difficulty: "Beginner", categories: ["Chatbots"], tools: ["Next.js", "Vercel"], timeEstimate: "~2h", stepCount: 5, isLocal: false,
    depthDesc: { beginner: "Use the Vercel AI SDK useChat hook — streaming and memory handled for you.", intermediate: "Implement conversation memory strategies and add system prompt customisation.", advanced: "Design the streaming architecture, add multi-turn context management, and build evaluation tooling." },
    overview: "Builds a full chat interface with token-by-token streaming output and multi-turn conversation memory, deployed to a live URL on Vercel. Uses the Vercel AI SDK to handle the streaming complexity.",
    realWorldUses: [
      { scenario: "Internal knowledge bot", desc: "Company chatbot that employees query for policies and procedures." },
      { scenario: "Product onboarding", desc: "Guided assistant that helps new users learn a product feature by feature." },
      { scenario: "Personal AI assistant", desc: "Custom-prompted chatbot tuned to your writing style and preferences." },
      { scenario: "Customer FAQ bot", desc: "Deflect common support questions before they reach a human agent." },
    ],
    painPoints: ["Building streaming from scratch involves complex SSE/WebSocket plumbing", "Chat memory requires careful context management to avoid token limits", "Deploying AI apps usually requires backend infrastructure knowledge"],
    whoBenefits: [
      { role: "Frontend developers", gain: "Ship a production AI feature without backend expertise" },
      { role: "Founders", gain: "Validate a chatbot product idea in an afternoon" },
    ],
    steps: {
      beginner: [
        { title: "Create the Next.js app", sub: "Scaffold and install the AI SDK.", body: "Create a new Next.js project and install the Vercel AI SDK — it handles streaming, state management, and the API route for you.", code: `npx create-next-app@latest my-chatbot --typescript --tailwind --app\ncd my-chatbot\nnpm install ai @ai-sdk/openai`, time: "~15 min" },
        { title: "Create the API route", sub: "The streaming endpoint.", body: "Create a route handler that receives messages, calls the LLM with streaming enabled, and pipes the response back to the browser.", code: `// src/app/api/chat/route.ts\nimport { openai } from '@ai-sdk/openai';\nimport { streamText } from 'ai';\n\nexport async function POST(req: Request) {\n  const { messages } = await req.json();\n  const result = streamText({\n    model: openai('gpt-4o-mini'),\n    messages,\n  });\n  return result.toDataStreamResponse();\n}`, time: "~15 min" },
        { title: "Build the chat UI", sub: "useChat gives you everything.", body: "The useChat hook provides messages, input, handleSubmit, and isLoading — wire them to a simple form and message list.", code: `'use client';\nimport { useChat } from 'ai/react';\n\nexport default function Chat() {\n  const { messages, input, handleInputChange, handleSubmit } = useChat();\n  return (\n    <div>\n      {messages.map(m => (\n        <div key={m.id}><b>{m.role}:</b> {m.content}</div>\n      ))}\n      <form onSubmit={handleSubmit}>\n        <input value={input} onChange={handleInputChange} />\n        <button type="submit">Send</button>\n      </form>\n    </div>\n  );\n}`, time: "~20 min" },
        { title: "Add a system prompt", sub: "Give your bot a personality.", body: "Pass a system message in the API route to define the bot's role, tone, and constraints. This shapes every response.", code: `const result = streamText({\n  model: openai('gpt-4o-mini'),\n  system: 'You are a helpful assistant for a software company. Be concise and friendly.',\n  messages,\n});`, time: "~10 min" },
        { title: "Deploy to Vercel", sub: "One command, live URL.", body: "Install the Vercel CLI and deploy. Set your OPENAI_API_KEY as an environment variable in the Vercel dashboard.", code: `npx vercel --prod\n# then in Vercel dashboard:\n# Settings → Environment Variables → OPENAI_API_KEY`, watchOut: "Never commit your API key to git. Always use environment variables.", time: "~20 min" },
      ],
      intermediate: [
        { title: "Scaffold + install", sub: "Next.js + AI SDK setup.", body: "Use create-next-app with TypeScript. Install: ai @ai-sdk/openai. Set OPENAI_API_KEY in .env.local.", time: "~15 min" },
        { title: "Streaming route handler", sub: "streamText with proper error handling.", body: "Use streamText from the ai package. Handle rate limit errors (429) and return a proper error response — the SDK will surface it in the UI automatically.", time: "~20 min" },
        { title: "Conversation memory strategies", sub: "Three approaches, different tradeoffs.", body: "Full history: simple, hits context limits fast. Windowed: keep last N messages. Summarisation: periodically compress old turns. Choose based on expected conversation length.", time: "~30 min" },
        { title: "System prompt management", sub: "Dynamic prompts per user/session.", body: "Store system prompts in a config object keyed by bot type. Inject user context (name, plan, history) into the prompt at request time.", time: "~25 min" },
        { title: "Deploy + env vars", sub: "Vercel deployment with secrets.", body: "npx vercel. Set OPENAI_API_KEY in Vercel dashboard. Use vercel env pull to sync env vars locally for development.", time: "~20 min" },
      ],
      advanced: [
        { title: "Streaming architecture", sub: "SSE vs WebSockets vs ReadableStream.", body: "The AI SDK uses ReadableStream over HTTP. This works for stateless requests. For stateful multi-user sessions needing server-push, consider WebSockets. For most chatbots, ReadableStream is the right choice.", time: "~30 min" },
        { title: "Context window management", sub: "Token budget and summarisation.", body: "Track token count per message with tiktoken. When approaching the model's context limit, trigger a summarisation step that compresses old messages into a 'conversation summary' system message.", time: "~45 min" },
        { title: "Prompt injection defence", sub: "Harden against adversarial inputs.", body: "Validate and sanitise user input before passing to the LLM. Use a separate guardrail model call to classify intent before the main response. Never trust user-provided system prompt overrides.", time: "~30 min" },
        { title: "Evals and regression testing", sub: "Measure prompt quality over time.", body: "Build a test set of canonical Q&A pairs. Run after every system prompt change. Score with an LLM-as-judge approach: does the response meet the rubric?", time: "~60 min" },
        { title: "Observability", sub: "Log every conversation turn.", body: "Log: session_id, messages[], model, tokens_in, tokens_out, latency_ms, finish_reason. Use Langfuse or a simple Postgres table. This is essential for debugging prompt regressions.", time: "~30 min" },
      ],
    },
  },
  {
    id: 4, num: "04", title: "Fine-tune a small model", tagline: "Prepare a dataset, train with LoRA, and evaluate intent classification accuracy.",
    difficulty: "Advanced", categories: ["Fine-tuning"], tools: ["PyTorch", "PEFT"], timeEstimate: "~6h", stepCount: 9, isLocal: false,
    depthDesc: { beginner: "Not recommended at Beginner level — requires ML fundamentals.", intermediate: "Use the OpenAI fine-tuning API for a no-infrastructure path to a custom model.", advanced: "Full LoRA fine-tune with PEFT, custom training loop, and rigorous evaluation." },
    overview: "Prepares a labelled dataset, fine-tunes a small language model using LoRA (Low-Rank Adaptation) via the PEFT library, and evaluates accuracy on an intent classification task. Produces a model you own and can serve privately.",
    realWorldUses: [
      { scenario: "Intent classifier", desc: "Route customer messages to the right support queue with >95% accuracy." },
      { scenario: "Tone detector", desc: "Classify text as formal/informal/aggressive for content moderation." },
      { scenario: "Domain-specific Q&A", desc: "A model trained on your internal knowledge that outperforms a general LLM on your use case." },
      { scenario: "PII detector", desc: "Fine-tuned NER model that identifies personally identifiable information in documents." },
    ],
    painPoints: ["General LLMs perform poorly on narrow domain tasks", "API-based models have latency and cost at scale", "You can't run a general LLM on-device — a fine-tuned small model can"],
    whoBenefits: [
      { role: "ML engineers", gain: "Build domain-specific models without training from scratch" },
      { role: "Product teams", gain: "Reduce inference cost by 10–100x vs a general LLM API" },
    ],
    steps: {
      beginner: [{ title: "Start with project 01 and 03 first", sub: "Fine-tuning requires ML fundamentals.", body: "This project is classified Advanced and requires Python, NumPy, and basic ML concepts. Complete Beginner projects first.", time: "—" }],
      intermediate: [
        { title: "Prepare your dataset", sub: "Format for fine-tuning.", body: "Fine-tuning requires labelled examples in JSONL format: {prompt, completion} pairs. Aim for 50–200 examples per class minimum.", code: `{"prompt": "I can't log into my account", "completion": "account_access"}\n{"prompt": "My order hasn't arrived", "completion": "shipping_issue"}`, time: "~60 min" },
        { title: "Use OpenAI fine-tuning API", sub: "Easiest path to a custom model.", body: "Upload your JSONL file, create a fine-tuning job, wait for completion, and call your custom model by its ft: model ID.", code: `from openai import OpenAI\nclient = OpenAI()\n\n# Upload dataset\nfile = client.files.create(file=open("data.jsonl","rb"), purpose="fine-tune")\n\n# Start fine-tuning\njob = client.fine_tuning.jobs.create(training_file=file.id, model="gpt-4o-mini")\nprint(job.id)`, time: "~30 min" },
        { title: "Evaluate accuracy", sub: "Measure before shipping.", body: "Hold out 20% of your data for evaluation. Run the fine-tuned model on the eval set and compute accuracy, precision, recall per class.", time: "~30 min" },
      ],
      advanced: [
        { title: "Dataset preparation", sub: "Quality over quantity.", body: "Clean labels matter more than volume. Remove duplicates, fix label errors, ensure class balance. Track your dataset version in git alongside the model.", time: "~90 min" },
        { title: "Choose base model", sub: "Size vs performance tradeoff.", body: "Llama 3.2 1B: runs on CPU, low accuracy ceiling. Llama 3.2 3B: good balance. Mistral 7B: strong baseline, needs GPU. Start with the smallest that meets your accuracy target.", time: "~30 min" },
        { title: "Set up LoRA with PEFT", sub: "Parameter-efficient fine-tuning.", body: "LoRA freezes most model weights and trains only low-rank adapter matrices. 10–100x fewer parameters to train vs full fine-tuning.", code: `from peft import LoraConfig, get_peft_model\nfrom transformers import AutoModelForCausalLM\n\nmodel = AutoModelForCausalLM.from_pretrained("meta-llama/Llama-3.2-1B")\nconfig = LoraConfig(r=16, lora_alpha=32, target_modules=["q_proj","v_proj"])\nmodel = get_peft_model(model, config)\nmodel.print_trainable_parameters()`, time: "~45 min" },
        { title: "Training loop", sub: "Trainer API for standard tasks.", body: "Use HuggingFace Trainer for classification tasks. It handles batching, gradient accumulation, LR scheduling, and checkpointing. Only write a custom loop if Trainer doesn't support your task.", time: "~60 min" },
        { title: "Evaluation suite", sub: "Beyond accuracy.", body: "Measure: accuracy, F1 per class, confusion matrix, latency (p50/p95), and memory footprint. Compare against a zero-shot baseline with the same general LLM — fine-tuning should win by a meaningful margin.", time: "~45 min" },
        { title: "Merge and quantise", sub: "Ship a smaller, faster model.", body: "Merge LoRA adapters into the base model with merge_and_unload(). Quantise to 4-bit with bitsandbytes or GGUF for CPU inference. Measure accuracy delta after quantisation.", time: "~45 min" },
        { title: "Serve with Ollama", sub: "Run locally or self-host.", body: "Convert to GGUF format and import into Ollama. Run ollama serve and call it like any OpenAI-compatible API. No cloud costs.", time: "~30 min" },
        { title: "Continuous evaluation", sub: "Catch regressions early.", body: "Run your eval suite on every new training run. Track accuracy over time in a simple CSV or MLflow. Fine-tuning on new data can regress performance on old data (catastrophic forgetting).", time: "~30 min" },
        { title: "Deployment options", sub: "Choose your inference path.", body: "Options by cost: Ollama (free, self-hosted) → Modal/Replicate (pay per token) → AWS/GCP dedicated endpoint (fixed cost, highest throughput). Choose based on queries/day.", time: "~30 min" },
      ],
    },
  },
  {
    id: 5, num: "05", title: "A multimodal vision assistant", tagline: "Wire up a vision model for screenshot Q&A, chart reading, and OCR — wrapped as an API.",
    difficulty: "Intermediate", categories: ["Vision"], tools: ["VLM", "FastAPI"], timeEstimate: "~4h", stepCount: 7, isLocal: false,
    depthDesc: { beginner: "Start with project 03 first — this builds on API fundamentals.", intermediate: "Send images to a vision model, parse structured outputs, and wrap as a FastAPI service.", advanced: "Handle multi-image inputs, implement streaming, and design for production throughput." },
    overview: "Builds an API that accepts images (screenshots, charts, documents) and answers questions about them using a vision-language model. Handles OCR, chart reading, and visual Q&A in a single unified endpoint.",
    realWorldUses: [
      { scenario: "Screenshot bug reporter", desc: "User pastes a screenshot; the assistant describes the bug and suggests a fix." },
      { scenario: "Chart data extractor", desc: "Upload a chart image; get back the underlying data as JSON." },
      { scenario: "Document OCR pipeline", desc: "Photograph a handwritten form; extract all fields as structured data." },
      { scenario: "UI accessibility checker", desc: "Upload a UI screenshot; get a list of accessibility issues." },
    ],
    painPoints: ["OCR tools are brittle and format-specific", "Charts require manual data extraction", "Screenshots are unstructured — impossible to process with text tools alone"],
    whoBenefits: [
      { role: "Developers", gain: "Automate visual QA workflows that previously needed human review" },
      { role: "Data teams", gain: "Extract chart data without manual transcription" },
    ],
    steps: {
      beginner: [{ title: "Complete project 03 first", sub: "This project builds on API fundamentals.", body: "Deploy a streaming chatbot (project 03) covers the API and deployment fundamentals required here.", time: "—" }],
      intermediate: [
        { title: "Set up FastAPI", sub: "Python API server for image processing.", body: "FastAPI handles file uploads cleanly and generates automatic API docs. Install dependencies.", code: `pip install fastapi uvicorn python-multipart openai pillow`, time: "~10 min" },
        { title: "Image upload endpoint", sub: "Accept and validate image files.", body: "Create an endpoint that accepts an image file and a question string. Validate file type and size before processing.", code: `from fastapi import FastAPI, UploadFile, Form\n\napp = FastAPI()\n\n@app.post("/vision")\nasync def vision(file: UploadFile, question: str = Form(...)):\n    contents = await file.read()\n    # pass to vision model\n    ...`, time: "~20 min" },
        { title: "Call the vision model", sub: "Encode image and send to API.", body: "Vision models accept images as base64-encoded strings in the messages array alongside the text question.", code: `import base64\nfrom openai import OpenAI\n\nclient = OpenAI()\n\ndef ask_vision(image_bytes: bytes, question: str) -> str:\n    b64 = base64.b64encode(image_bytes).decode()\n    response = client.chat.completions.create(\n        model="gpt-4o",\n        messages=[{"role":"user","content":[\n            {"type":"image_url","image_url":{"url":f"data:image/jpeg;base64,{b64}"}},\n            {"type":"text","text": question}\n        ]}]\n    )\n    return response.choices[0].message.content`, time: "~25 min" },
        { title: "Structured output for OCR", sub: "Extract fields as JSON.", body: "For document extraction, prompt the model to return JSON with specific fields. Use response_format={'type': 'json_object'} to enforce structured output.", time: "~25 min" },
        { title: "Test with real images", sub: "Validate across image types.", body: "Test with: a screenshot, a bar chart, a handwritten note, a table in a PDF. Each type has different failure modes.", time: "~30 min" },
        { title: "Add image preprocessing", sub: "Resize and optimise before sending.", body: "Large images cost more tokens and are slower. Resize to max 2048px on the longest side before encoding. Use Pillow for preprocessing.", code: `from PIL import Image\nimport io\n\ndef preprocess(image_bytes: bytes, max_size=2048) -> bytes:\n    img = Image.open(io.BytesIO(image_bytes))\n    img.thumbnail((max_size, max_size))\n    buf = io.BytesIO()\n    img.save(buf, format="JPEG", quality=85)\n    return buf.getvalue()`, time: "~20 min" },
        { title: "Deploy and document", sub: "Ship and share the API.", body: "Run with uvicorn. FastAPI auto-generates interactive docs at /docs. Deploy to Railway or Fly.io for a persistent URL.", code: `uvicorn main:app --host 0.0.0.0 --port 8000\n# Docs at: http://localhost:8000/docs`, time: "~20 min" },
      ],
      advanced: [
        { title: "Multi-image inputs", sub: "Compare and contrast across images.", body: "GPT-4o and Claude support multiple images per request. Design prompts that explicitly reference 'the first image' and 'the second image' for comparison tasks.", time: "~30 min" },
        { title: "Streaming vision responses", sub: "Stream long analysis outputs.", body: "Use stream=True for long-form analysis (e.g., full document extraction). Pipe tokens to the client via SSE. Don't stream for short structured outputs — wait for the complete JSON.", time: "~30 min" },
        { title: "Model selection by task", sub: "Different models for different tasks.", body: "OCR and form extraction: GPT-4o or Claude Sonnet. Chart reading: GPT-4o (stronger spatial reasoning). Screenshot Q&A: Claude Sonnet (cheaper, sufficient). Route by task type in your API.", time: "~20 min" },
        { title: "Cost model", sub: "Vision tokens are expensive.", body: "A 512x512 image costs ~170 tokens with gpt-4o. A full-page document scan at 2048px costs ~800 tokens. Cache results by image hash. For high-volume OCR, consider open-source alternatives (surya, marker).", time: "~20 min" },
        { title: "Quality assurance", sub: "Vision models make spatial errors.", body: "Build an eval set of 20 images with known ground-truth answers. Common failure modes: misreading small text, confusing similar symbols, hallucinating chart values. Test all of these.", time: "~45 min" },
        { title: "Rate limiting and queuing", sub: "Vision APIs have strict rate limits.", body: "Implement a job queue (Redis + worker) for high-volume processing. GPT-4o vision has lower RPM limits than text-only. Retry with exponential backoff on 429s.", time: "~45 min" },
        { title: "Local alternatives", sub: "Llava and Moondream for private data.", body: "For sensitive images (medical, legal, financial), use a local VLM. Llava-1.6 via Ollama runs on a consumer GPU. Quality is lower but data never leaves your network.", time: "~45 min" },
      ],
    },
  },
  {
    id: 6, num: "06", title: "Transcribe & summarize meetings", tagline: "Transcribe audio with Whisper, then turn it into structured notes and action items.",
    difficulty: "Intermediate", categories: ["Speech"], tools: ["Whisper", "Python"], timeEstimate: "~3h", stepCount: 6, isLocal: false,
    depthDesc: { beginner: "Use the OpenAI Whisper API — no local model needed.", intermediate: "Run Whisper locally, add speaker diarisation, and structure the output with Claude.", advanced: "Real-time streaming transcription, custom vocabulary, and integration with calendar/task tools." },
    overview: "Records or uploads a meeting audio file, transcribes it with Whisper, and passes the transcript to an LLM to produce structured meeting notes: summary, key decisions, action items with owners, and follow-up questions.",
    realWorldUses: [
      { scenario: "Engineering standups", desc: "Auto-generate a written summary and action item list from 15-minute standups." },
      { scenario: "Sales call notes", desc: "Extract next steps, objections, and commitments from customer calls automatically." },
      { scenario: "Board meetings", desc: "Produce formal minutes with decisions and assigned actions from long meetings." },
      { scenario: "Interviews", desc: "Transcribe user research interviews and extract key themes and quotes." },
    ],
    painPoints: ["Manual note-taking splits attention from the conversation", "Action items from meetings are forgotten within hours", "Meeting recordings are watched by almost no one"],
    whoBenefits: [
      { role: "Managers", gain: "Stop taking notes, stay present, get a better summary" },
      { role: "Sales teams", gain: "Capture every commitment from customer calls automatically" },
    ],
    steps: {
      beginner: [
        { title: "Install dependencies", sub: "Whisper API and LLM libraries.", body: "Install the OpenAI SDK to access both Whisper (transcription) and GPT (summarisation) from one package.", code: `pip install openai`, time: "~5 min" },
        { title: "Transcribe with Whisper API", sub: "Upload audio, get transcript.", body: "Send your audio file to the Whisper API. It returns a full transcript with timestamps. Supports mp3, mp4, wav, and most common formats.", code: `from openai import OpenAI\nclient = OpenAI()\n\nwith open("meeting.mp3", "rb") as f:\n    transcript = client.audio.transcriptions.create(\n        model="whisper-1",\n        file=f,\n        response_format="verbose_json",\n        timestamp_granularities=["segment"]\n    )\n\nprint(transcript.text)`, time: "~20 min" },
        { title: "Summarise with GPT", sub: "Extract structure from the transcript.", body: "Pass the transcript to GPT with a prompt that asks for a structured summary. The output format you define here becomes the template for every meeting.", code: `summary_prompt = """\nYou are a meeting notes assistant. Given the transcript below, extract:\n1. SUMMARY: 3-5 sentence overview\n2. DECISIONS: List of decisions made\n3. ACTION ITEMS: Each with owner and deadline if mentioned\n4. OPEN QUESTIONS: Unresolved questions that need follow-up\n\nTranscript:\n{transcript}\n"""\n\nresponse = client.chat.completions.create(\n    model="gpt-4o-mini",\n    messages=[{"role":"user","content":summary_prompt.format(transcript=transcript.text)}]\n)\nprint(response.choices[0].message.content)`, time: "~20 min" },
        { title: "Output to markdown", sub: "Save structured notes to a file.", body: "Write the structured output to a markdown file. This can be pasted into Notion, Confluence, or any notes tool.", code: `with open("meeting_notes.md", "w") as f:\n    f.write(response.choices[0].message.content)`, time: "~10 min" },
        { title: "Automate with a script", sub: "One command for the full pipeline.", body: "Combine transcription and summarisation into a single script you can run on any audio file.", code: `python transcribe.py meeting.mp3\n# outputs meeting_notes.md`, time: "~15 min" },
        { title: "Send to Slack or email", sub: "Deliver notes automatically.", body: "Use the Slack API or smtplib to send the finished notes to a channel or email address immediately after the meeting.", time: "~30 min" },
      ],
      intermediate: [
        { title: "Local Whisper", sub: "Run transcription without API costs.", body: "Install whisper package. Use whisper.load_model('base') locally. Faster-whisper gives 4x speed on CPU with the same accuracy.", code: `pip install faster-whisper\n\nfrom faster_whisper import WhisperModel\nmodel = WhisperModel("base", device="cpu")\nsegments, _ = model.transcribe("meeting.mp3")\ntranscript = " ".join(s.text for s in segments)`, time: "~20 min" },
        { title: "Speaker diarisation", sub: "Who said what.", body: "Use pyannote.audio to identify speakers. Combine speaker labels with Whisper timestamps to produce 'Speaker A: ...' format transcripts.", time: "~45 min" },
        { title: "Structured JSON output", sub: "Machine-readable action items.", body: "Use response_format json_object to get action items as a list of objects: {owner, task, deadline, priority}. This enables downstream automation.", time: "~25 min" },
        { title: "Chunked transcription", sub: "Handle long meetings.", body: "Whisper API has a 25MB file size limit. For longer meetings, chunk audio into 10-minute segments with ffmpeg and concatenate transcripts.", time: "~30 min" },
        { title: "Notion/Confluence integration", sub: "Push notes directly to your tool.", body: "Use the Notion API to create a page in a specified database. Populate properties (date, attendees, action items) from the structured JSON output.", time: "~40 min" },
        { title: "Automated trigger", sub: "Run after every calendar event.", body: "Use Google Calendar webhook or Zapier to trigger the pipeline when a meeting ends. Pass the recording URL from Zoom/Google Meet.", time: "~30 min" },
      ],
      advanced: [
        { title: "Real-time streaming transcription", sub: "Transcribe as the meeting happens.", body: "Use Deepgram or AssemblyAI's streaming WebSocket API for live transcription. Buffer 3-second audio chunks and stream segments to the client. Whisper is batch-only.", time: "~60 min" },
        { title: "Custom vocabulary", sub: "Improve accuracy on domain terms.", body: "Whisper accepts a prompt parameter — seed it with your company name, product names, and jargon. This significantly improves accuracy on domain-specific vocabulary.", time: "~20 min" },
        { title: "Multi-language support", sub: "Auto-detect and translate.", body: "Whisper auto-detects language. For multilingual meetings, transcribe each segment in its original language and pass to Claude for translation + summarisation in one step.", time: "~30 min" },
        { title: "Calendar integration", sub: "Enrich notes with meeting context.", body: "Pull attendee list, meeting title, and agenda from Google Calendar before summarisation. Inject as context — the LLM can then assign action items to the right people.", time: "~45 min" },
        { title: "Evaluation", sub: "Measure transcript and summary quality.", body: "For transcription: WER (Word Error Rate) against a gold standard. For summaries: human eval of action item completeness (did every commitment get captured?). Run monthly.", time: "~60 min" },
        { title: "Cost optimisation", sub: "Reduce API spend at scale.", body: "Whisper API: $0.006/min. At 10 meetings/day of 60 min each = $1.80/day. Local Whisper: $0. For high volume, local is the right call. Use cloud for occasional or time-sensitive jobs.", time: "~20 min" },
      ],
    },
  },
  {
    id: 7, num: "07", title: "Automate a repetitive workflow", tagline: "Chain scrape, summarize, and notify into one scheduled flow — no heavy backend.",
    difficulty: "Beginner", categories: ["Automation"], tools: ["n8n", "Webhook"], timeEstimate: "~2h", stepCount: 5, isLocal: false,
    depthDesc: { beginner: "Use n8n's visual editor — no code required.", intermediate: "Build the same flow in Python with schedule and httpx.", advanced: "Design for reliability: idempotency, error handling, dead letter queues, and monitoring." },
    overview: "Chains three steps — scrape a source, summarise with AI, and notify via Slack or email — into a scheduled workflow that runs automatically. Demonstrates how to build useful AI automations without writing a backend.",
    realWorldUses: [
      { scenario: "Competitor monitoring", desc: "Check competitor pricing pages daily and get a Slack alert if anything changes." },
      { scenario: "News digest", desc: "Scrape RSS feeds, summarise the top 5 stories, and email them to your inbox every morning." },
      { scenario: "Job board monitor", desc: "Watch a job board for new postings matching your criteria and notify immediately." },
      { scenario: "Price tracker", desc: "Monitor product prices and alert when they drop below a threshold." },
    ],
    painPoints: ["Repetitive monitoring tasks consume hours per week", "Manual checking is inconsistent — you miss things", "Building a proper backend for simple automations is overkill"],
    whoBenefits: [
      { role: "Non-developers", gain: "Automate workflows without writing code" },
      { role: "Solopreneurs", gain: "Replace hours of manual monitoring with a single setup" },
    ],
    steps: {
      beginner: [
        { title: "Set up n8n", sub: "Install the visual workflow tool.", body: "n8n runs locally with a single Docker command. It provides a visual editor for chaining steps without code.", code: `docker run -it --rm \\\n  -p 5678:5678 \\\n  -v ~/.n8n:/home/node/.n8n \\\n  n8nio/n8n`, why: "n8n gives you a visual canvas where each box is a step. You connect them like building blocks.", time: "~15 min" },
        { title: "Add an HTTP Request node", sub: "Fetch content from any URL.", body: "In n8n, add an HTTP Request node. Set the URL to the page you want to monitor. Choose GET method. Run it once to see the raw HTML response.", time: "~15 min" },
        { title: "Extract the content", sub: "Parse HTML into clean text.", body: "Add an HTML Extract node. Use a CSS selector to pull out the specific content you care about (e.g., '.price', 'h2.title'). If you're not sure of the selector, right-click the element in Chrome → Inspect → copy the selector.", watchOut: "Websites change their HTML structure. If your flow breaks, re-check the selector.", time: "~20 min" },
        { title: "Summarise with AI", sub: "Add an OpenAI node.", body: "Add the OpenAI node. Connect your API key. Set the prompt to summarise the extracted text in 3 bullet points. The output becomes the message you'll send.", time: "~20 min" },
        { title: "Send to Slack or email", sub: "Deliver the result.", body: "Add a Slack node (or Send Email node). Connect your Slack workspace. Map the AI summary to the message body. Set a Schedule trigger to run the whole flow daily at 8am.", time: "~20 min" },
      ],
      intermediate: [
        { title: "Python setup", sub: "requests, schedule, and openai.", body: "Build the same flow in Python for more control and easier version control.", code: `pip install requests schedule openai beautifulsoup4`, time: "~10 min" },
        { title: "Scrape and extract", sub: "requests + BeautifulSoup.", body: "Fetch the page, parse with BeautifulSoup, extract the target element. Handle errors: connection timeout, 404, selector not found.", time: "~25 min" },
        { title: "Summarise", sub: "OpenAI API call.", body: "Pass extracted text to gpt-4o-mini with a summarisation prompt. Keep the prompt consistent — variable prompts produce variable output quality.", time: "~20 min" },
        { title: "Notify", sub: "Slack webhook or email.", body: "Use Slack incoming webhooks (no OAuth required). Or smtplib for email. Store webhook URL in .env, never in code.", time: "~20 min" },
        { title: "Schedule and deploy", sub: "Run on a server.", body: "Use Python schedule library for the cron logic. Deploy on Railway or Fly.io — free tier covers low-frequency automations.", time: "~25 min" },
      ],
      advanced: [
        { title: "Idempotency", sub: "Don't alert on the same content twice.", body: "Hash the scraped content and store in a database. Only trigger the downstream steps if the hash has changed since the last run.", time: "~30 min" },
        { title: "Error handling and alerting", sub: "Know when your automation breaks.", body: "Wrap every external call in try/except. On failure, send an alert to a separate error Slack channel. Include: which step failed, the error message, and a timestamp.", time: "~30 min" },
        { title: "Dead letter queue", sub: "Don't lose failed runs.", body: "Store failed jobs in a DLQ table (Postgres or SQLite). Build a retry mechanism that replays failed runs after 15 minutes, up to 3 times.", time: "~45 min" },
        { title: "Observability", sub: "Log every run.", body: "Log: run_id, trigger_time, scrape_status, ai_tokens_used, notification_status, total_duration_ms. Review weekly to catch gradual failures.", time: "~30 min" },
        { title: "Anti-scraping defence", sub: "Avoid getting blocked.", body: "Rotate user agents. Add random delays (2–5s) between requests. Respect robots.txt. For sites with strong bot detection, use a headless browser (Playwright) or a scraping API (ScrapingBee).", time: "~30 min" },
      ],
    },
  },
  {
    id: 8, num: "08", title: "Semantic search over your docs", tagline: "Compare keyword vs. vector retrieval, add reranking, and deploy it as a service.",
    difficulty: "Intermediate", categories: ["RAG"], tools: ["Embeddings", "Qdrant"], timeEstimate: "~4h", stepCount: 7, isLocal: false,
    depthDesc: { beginner: "Complete project 01 first — this is the production evolution of that project.", intermediate: "Build hybrid search and add a reranking step to compare retrieval strategies.", advanced: "Design for scale: sharded Qdrant, ANN index tuning, and latency SLOs." },
    overview: "Builds a semantic search service that goes beyond keyword matching. Implements vector search with Qdrant, adds BM25 keyword search, combines them with hybrid retrieval, and adds a reranking step — then measures the quality improvement at each stage.",
    realWorldUses: [
      { scenario: "Internal documentation search", desc: "Find the right engineering doc even when you can't remember the exact terms used." },
      { scenario: "E-commerce product search", desc: "Return relevant products for 'something warm for a winter hike' without those exact words in product descriptions." },
      { scenario: "Legal case search", desc: "Find relevant precedents by concept, not just matching citation numbers." },
      { scenario: "Code search", desc: "Search a codebase by what the code does, not just the function name." },
    ],
    painPoints: ["Keyword search fails when users don't use the exact right words", "Embedding-only search misses exact-match cases (names, codes, IDs)", "No reranking means the most semantically similar chunk isn't always the most relevant"],
    whoBenefits: [
      { role: "Developers", gain: "Search infrastructure that finds the right result, not just the lexically matching one" },
      { role: "Product teams", gain: "Search that understands user intent, not just keywords" },
    ],
    steps: {
      beginner: [{ title: "Complete project 01 first", sub: "This builds directly on Document Q&A.", body: "Semantic search over your docs extends the RAG fundamentals from project 01. Complete that project first.", time: "—" }],
      intermediate: [
        { title: "Set up Qdrant", sub: "Production-grade vector store.", body: "Run Qdrant locally with Docker. It scales to millions of vectors and supports hybrid search natively.", code: `docker run -p 6333:6333 qdrant/qdrant\n\npip install qdrant-client openai`, time: "~15 min" },
        { title: "Ingest documents", sub: "Embed and store in Qdrant.", body: "Embed your documents and store vectors in a Qdrant collection with payload (the original text and metadata).", code: `from qdrant_client import QdrantClient\nfrom qdrant_client.models import PointStruct, VectorParams, Distance\n\nclient = QdrantClient("localhost", port=6333)\nclient.create_collection("docs", vectors_config=VectorParams(size=1536, distance=Distance.COSINE))\n\n# Insert\nclient.upsert("docs", points=[\n    PointStruct(id=i, vector=embedding, payload={"text": chunk})\n    for i, (chunk, embedding) in enumerate(zip(chunks, embeddings))\n])`, time: "~30 min" },
        { title: "Vector search baseline", sub: "Measure pure semantic retrieval.", body: "Implement vector-only search and create an eval set of 10 queries with known relevant documents. Record recall@5 as your baseline.", time: "~30 min" },
        { title: "BM25 keyword search", sub: "Add the lexical layer.", body: "Implement BM25 using rank_bm25. Test the same eval set. Note where it outperforms vector search (exact names, codes) and where it fails (conceptual queries).", code: `from rank_bm25 import BM25Okapi\n\ntokenised = [doc.split() for doc in corpus]\nbm25 = BM25Okapi(tokenised)\nscores = bm25.get_scores(query.split())`, time: "~25 min" },
        { title: "Hybrid search", sub: "Combine BM25 + vector scores.", body: "Use Reciprocal Rank Fusion (RRF) to merge the two result lists. RRF is simple and consistently outperforms weighted averaging.", code: `def rrf(rankings: list[list[int]], k=60) -> dict[int, float]:\n    scores = {}\n    for ranking in rankings:\n        for rank, doc_id in enumerate(ranking):\n            scores[doc_id] = scores.get(doc_id, 0) + 1 / (k + rank + 1)\n    return dict(sorted(scores.items(), key=lambda x: x[1], reverse=True))`, time: "~30 min" },
        { title: "Add reranking", sub: "Cross-encoder for final ordering.", body: "Use a cross-encoder model to rerank the top-20 hybrid results down to top-5. This is the highest quality signal but too slow to run on the full corpus.", code: `from sentence_transformers import CrossEncoder\n\nreranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")\npairs = [[query, doc] for doc in candidate_docs]\nscores = reranker.predict(pairs)\nreranked = sorted(zip(scores, candidate_docs), reverse=True)`, time: "~30 min" },
        { title: "Deploy as a service", sub: "FastAPI endpoint with metrics.", body: "Wrap the full pipeline in a FastAPI endpoint. Log retrieval strategy, latency, and result count per query. This data drives future improvements.", time: "~30 min" },
      ],
      advanced: [
        { title: "ANN index tuning", sub: "HNSW parameters for your data.", body: "Qdrant uses HNSW. Key params: m (graph connectivity, default 16) and ef_construct (build quality, default 100). Higher = better recall, more memory. Tune based on your recall/latency SLO.", time: "~45 min" },
        { title: "Quantisation", sub: "Reduce memory footprint.", body: "Scalar quantisation (int8) reduces memory 4x with <1% recall loss. Product quantisation reduces further but with higher loss. Enable in Qdrant collection config.", time: "~30 min" },
        { title: "Sharding strategy", sub: "Distribute at scale.", body: "Qdrant supports sharding across nodes. Design shard keys by document domain or tenant_id. Each shard should be <50M vectors for optimal performance.", time: "~45 min" },
        { title: "Latency SLOs", sub: "Define and measure targets.", body: "Set SLOs: vector search p95 < 50ms, hybrid p95 < 100ms, with reranking p95 < 300ms. Instrument with Prometheus metrics. Alert if p95 exceeds SLO for 5 minutes.", time: "~45 min" },
        { title: "Evaluation pipeline", sub: "Continuous quality measurement.", body: "Build an automated eval that runs nightly on a fixed query set. Track NDCG@5 and recall@10 over time. A retrieval regression is often the first sign of data quality issues.", time: "~60 min" },
        { title: "Query understanding", sub: "Classify before retrieval.", body: "Some queries are better served by keyword search, others by vector search. Build a query classifier that routes to the optimal retrieval strategy based on query type (exact-match vs conceptual).", time: "~45 min" },
        { title: "Caching strategy", sub: "Cache at multiple levels.", body: "L1: exact query hash → cached results (TTL 1h). L2: similar embedding cache (cosine > 0.98 → reuse). L3: reranker cache keyed on (query, doc_ids). Caching is the highest-ROI latency optimisation.", time: "~30 min" },
      ],
    },
  },
  {
    id: 9, num: "09", title: "Build a prompt eval set", tagline: "Create a graded test set and scoring rules to compare prompts and models quantitatively.",
    difficulty: "Intermediate", categories: ["Agents"], tools: ["Python", "Pytest"], timeEstimate: "~3h", stepCount: 6, isLocal: false,
    depthDesc: { beginner: "Start with project 03 — this assumes you have a prompt to evaluate.", intermediate: "Build a structured eval set, implement LLM-as-judge scoring, and integrate with Pytest.", advanced: "Design multi-dimensional rubrics, statistical significance testing, and CI integration." },
    overview: "Builds a structured evaluation framework for prompts and models. Creates a graded test set with expected outputs, implements an LLM-as-judge scoring system, and produces comparative reports — so prompt changes can be made with confidence.",
    realWorldUses: [
      { scenario: "Prompt regression testing", desc: "Catch when a prompt change makes answers worse before it reaches users." },
      { scenario: "Model comparison", desc: "Quantitatively compare GPT-4o vs Claude vs Gemini on your specific task." },
      { scenario: "A/B prompt testing", desc: "Run two prompt variants on the same test set and pick the winner by score." },
      { scenario: "Quality gate for deployment", desc: "Block a release if eval score drops below a threshold." },
    ],
    painPoints: ["Prompt changes feel like guessing — you don't know if they helped", "Manual review of outputs doesn't scale past 20 examples", "Model upgrades might break carefully tuned prompts"],
    whoBenefits: [
      { role: "AI engineers", gain: "Ship prompt changes with confidence instead of hope" },
      { role: "Product teams", gain: "Data-driven decisions on model and prompt selection" },
    ],
    steps: {
      beginner: [{ title: "Complete project 03 first", sub: "You need a prompt to evaluate.", body: "Build a prompt eval set assumes you have a chatbot or prompt-based system already running. Complete Deploy a streaming chatbot (project 03) first.", time: "—" }],
      intermediate: [
        { title: "Define your eval dimensions", sub: "What does 'good' mean for your task?", body: "Before writing test cases, define your scoring rubric. Common dimensions: correctness, completeness, conciseness, tone, groundedness (no hallucination). Pick 2-3 for your first eval.", time: "~20 min" },
        { title: "Build the test set", sub: "20 cases minimum, with expected outputs.", body: "Write 20 input/expected_output pairs covering: easy cases, edge cases, and adversarial cases. Store as JSONL.", code: `# eval_set.jsonl\n{"input": "What is the return policy?", "expected": "30-day returns", "category": "policy"}\n{"input": "Can I return a used item?", "expected": "No, unused only", "category": "edge_case"}`, time: "~45 min" },
        { title: "Run the model", sub: "Generate outputs for every test case.", body: "Loop through your test set, call your prompt/model, and store the actual output alongside the expected output.", code: `import json\nfrom openai import OpenAI\n\nclient = OpenAI()\nresults = []\n\nwith open("eval_set.jsonl") as f:\n    for line in f:\n        case = json.loads(line)\n        response = client.chat.completions.create(\n            model="gpt-4o-mini",\n            messages=[{"role":"user","content":case["input"]}]\n        )\n        results.append({**case, "actual": response.choices[0].message.content})`, time: "~20 min" },
        { title: "LLM-as-judge scoring", sub: "Use a model to grade outputs.", body: "Pass each (input, expected, actual) triple to a grader LLM with a rubric. Ask it to return a score 1-5 and a reason. Use a stronger model (gpt-4o) as the judge even if you're testing a cheaper one.", code: `judge_prompt = """\nGrade the ACTUAL answer vs EXPECTED answer on correctness (1-5).\nInput: {input}\nExpected: {expected}\nActual: {actual}\nReturn JSON: {{"score": int, "reason": str}}\n"""`, time: "~30 min" },
        { title: "Aggregate and report", sub: "Summarise scores across the test set.", body: "Compute mean score per category, overall pass rate (score >= 4), and flag any score <= 2 for manual review.", code: `import statistics\n\nscores = [r["score"] for r in results]\nprint(f"Mean: {statistics.mean(scores):.2f}")\nprint(f"Pass rate: {sum(s >= 4 for s in scores)/len(scores)*100:.0f}%")\nprint(f"Failures: {[r for r in results if r['score'] <= 2]}")`, time: "~20 min" },
        { title: "Integrate with Pytest", sub: "Run evals as part of your test suite.", body: "Wrap the eval runner in a Pytest test that fails if mean score drops below a threshold. This creates a quality gate you can run in CI.", code: `def test_prompt_quality():\n    results = run_eval("eval_set.jsonl", prompt=SYSTEM_PROMPT)\n    mean_score = statistics.mean(r["score"] for r in results)\n    assert mean_score >= 3.5, f"Prompt quality dropped: {mean_score:.2f}"`, time: "~20 min" },
      ],
      advanced: [
        { title: "Multi-dimensional rubrics", sub: "Score on multiple axes.", body: "Single-score evals miss nuance. Build a rubric with 3-5 dimensions (correctness, groundedness, helpfulness, conciseness, safety). Report a radar chart of scores per dimension.", time: "~45 min" },
        { title: "Statistical significance", sub: "Is the improvement real?", body: "With n=20, many apparent improvements are noise. Use a bootstrap test or Wilcoxon signed-rank test to confirm that a score difference is statistically significant before acting on it.", time: "~45 min" },
        { title: "Calibrate your judge", sub: "Measure judge reliability.", body: "Have two humans grade 20 examples. Measure inter-rater agreement (Cohen's kappa). Then measure judge-human agreement. If kappa < 0.6, revise your rubric — it's too ambiguous.", time: "~60 min" },
        { title: "CI integration", sub: "Block deploys on quality regression.", body: "Run evals in GitHub Actions on every PR that touches prompt files. Post results as a PR comment. Fail the check if score drops > 0.3 from main branch baseline.", time: "~45 min" },
        { title: "Eval set maintenance", sub: "Evals rot if not updated.", body: "Add new test cases whenever: a user reports a bad output, you fix a bug, or you add a new feature. Tag cases by version. Retire cases that no longer reflect current product behaviour.", time: "~30 min" },
        { title: "Cost tracking", sub: "Evals have a token budget.", body: "With 100 test cases and LLM-as-judge, each eval run costs ~50k tokens for grading alone. Track cost per run. For cheap iteration, use a faster/cheaper judge model (gpt-4o-mini) and only run the expensive judge on final candidates.", time: "~20 min" },
      ],
    },
  },
];

export const CATEGORIES: Category[] = ["RAG", "Agents", "Chatbots", "Fine-tuning", "Vision", "Speech", "Automation"];
export const DIFFICULTIES: Difficulty[] = ["Beginner", "Intermediate", "Advanced"];
