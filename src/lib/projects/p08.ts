import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Python 3.10+",
    "pip",
    "Docker Desktop (for running Qdrant locally)",
    "Completed Project 01 (Document Q&A) — this is the production evolution of that project",
  ],
  tools: [
    {
      name: "qdrant-client openai rank-bm25 sentence-transformers python-dotenv",
      installCmd:
        "pip install qdrant-client openai rank-bm25 sentence-transformers python-dotenv\ndocker run -p 6333:6333 qdrant/qdrant",
      purpose:
        "Qdrant vector store, OpenAI embeddings, BM25 keyword search, and cross-encoder reranking",
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
    "semantic-search/\n├── ingest.py\n├── search.py\n├── rerank.py\n├── api.py\n├── .env\n└── data/\n    └── your-documents.txt  (or .json, .csv)",
};

const beginner: Step[] = [
  {
    title: "Complete Document Q&A (Project 01) first",
    sub: "Semantic search is the production evolution of the RAG project.",
    meta: { location: "—", tool: "—" },
    body: "Project 08 extends the vector search concepts from Project 01 with a production-grade vector store (Qdrant), BM25 keyword search, and a reranking step. If you haven't built and tested Project 01 end-to-end, start there — this project's intermediate depth is where the real work begins.",
    prompt: {
      context: "Prerequisite not met.",
      instruction:
        "Complete Project 01 first — get query.py returning cited answers from a Chroma database. Then return here and switch to Intermediate depth to build the Qdrant-based hybrid search service.",
    },
    verify: {
      run: 'python query.py "test question"  (from Project 01)',
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
