import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: ["Python 3.10+", "pip", "A code editor (VS Code or Cursor)"],
  tools: [
    {
      name: "langchain-community langchain-openai chromadb pypdf python-dotenv",
      installCmd: "pip install langchain-community langchain-openai chromadb pypdf python-dotenv",
      purpose: "PDF loading, text chunking, OpenAI embeddings, and local Chroma vector storage",
    },
  ],
  apiKeys: [
    {
      name: "OPENAI_API_KEY",
      where: "platform.openai.com → API Keys → Create new secret key",
      envVar: "OPENAI_API_KEY=sk-...",
    },
  ],
  projectStructure:
    "rag-demo/\n├── ingest.py\n├── query.py\n├── .env\n├── docs/\n│   └── your-document.pdf\n└── chroma_db/   ← created automatically by ingest.py",
};

const beginner: Step[] = [
  {
    title: "Create the ingestion script",
    sub: "Load your PDF, split into chunks, and store in a local vector database.",
    meta: {
      location: "ingest.py",
      tool: "Claude Code",
      userInputs: ["Path to your PDF file (e.g. docs/my-document.pdf)"],
    },
    body: "ingest.py is the one-time setup script: it reads your PDF, splits it into 1,000-character overlapping chunks, converts each chunk into a vector embedding, and stores everything in a local Chroma database. Run it once per document — the database persists to disk so you don't re-embed on every query. A 50-page PDF typically creates 150–200 chunks and takes about 20 seconds.",
    prompt: {
      context:
        "ingest.py does not exist yet. The project folder has a docs/ subdirectory with a PDF file. OPENAI_API_KEY is set in a .env file.",
      instruction: `Create ingest.py that does the following in order:
1. Load .env with python-dotenv (load_dotenv())
2. Accept a PDF file path as sys.argv[1], defaulting to "docs/document.pdf"
3. Load the PDF with PyPDFLoader from langchain_community.document_loaders
4. Split into chunks with RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
5. Embed with OpenAIEmbeddings() from langchain_openai
6. Store in Chroma(persist_directory="./chroma_db") from langchain_community.vectorstores
7. Call db.persist() to save to disk
8. Print: "Loaded {N} pages → {M} chunks → stored in ./chroma_db ✓"`,
    },
    verify: {
      run: "python ingest.py docs/your-document.pdf",
      expect: "Loaded 12 pages → 47 chunks → stored in ./chroma_db ✓",
      type: "terminal-output",
    },
    time: "~25 min",
  },
  {
    title: "Create the query script",
    sub: "Ask plain-English questions and get cited answers from your documents.",
    meta: {
      location: "query.py",
      tool: "Claude Code",
    },
    body: "query.py loads the Chroma database that ingest.py built, finds the 4 most relevant chunks for any question, and passes them to GPT to generate a cited answer. Temperature is set to 0 — the model will say 'I don't have that information' rather than inventing an answer.",
    prompt: {
      context:
        "ingest.py was just created in step 1 and populated ./chroma_db. query.py does not exist yet.",
      instruction: `Create query.py that:
1. Loads .env with python-dotenv
2. Opens the Chroma database from "./chroma_db" using OpenAIEmbeddings()
3. Creates a retriever with db.as_retriever(search_kwargs={"k": 4})
4. Builds a RetrievalQAWithSourcesChain using ChatOpenAI(model="gpt-4o-mini", temperature=0)
5. Accepts a question string as sys.argv[1]
6. Calls chain.invoke({"question": question}) and prints:
   - "Answer: {answer}"
   - "Sources: {sources}"

Import RetrievalQAWithSourcesChain from langchain.chains.`,
    },
    verify: {
      run: 'python query.py "What is the main topic of this document?"',
      expect:
        "Answer: The document covers annual leave policy for full-time employees...\nSources: docs/your-document.pdf",
      type: "terminal-output",
    },
    time: "~20 min",
  },
  {
    title: "Test accuracy and block hallucination",
    sub: "Verify correct answers and that the model refuses out-of-scope questions.",
    meta: {
      location: "query.py",
      tool: "Terminal",
      userInputs: [
        "3 questions whose answers are in your document",
        "1 question whose answer is NOT in your document",
      ],
    },
    body: "Before relying on this for real work, confirm two things: it gives correct answers with citations for questions that are in the document, and it refuses to answer questions that aren't covered. Most RAG failures happen when the model invents a plausible-sounding answer instead of admitting it doesn't know.",
    prompt: {
      context: "Both ingest.py and query.py are working. The chroma_db is populated.",
      instruction: `Run these two tests in Terminal:

Test 1 — question that IS in the document:
  python query.py "What is the refund policy?"
  Expected: a cited answer pointing to your PDF

Test 2 — question that is NOT in the document:
  python query.py "What is the CEO's personal phone number?"
  Expected: "I don't have that information"

If Test 2 returns a made-up answer instead of refusing, update query.py:
Add a system message to the RetrievalQAWithSourcesChain prompt that says:
"Answer ONLY from the provided context. If the answer is not explicitly stated in the context, respond with: I don't have that information in the provided documents."`,
      tool: "Terminal",
    },
    verify: {
      run: 'python query.py "What is the CEO\'s personal phone number?"',
      expect:
        "Answer: I don't have that information in the provided documents.\nSources: N/A",
      type: "terminal-output",
    },
    time: "~15 min",
  },
];

export const steps: Record<Depth, Step[]> = {
  beginner,
  intermediate: [],
  advanced: [],
};
