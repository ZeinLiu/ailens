import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Python 3.10+",
    "pip",
    "Completed Project 01 (RAG) and Project 03 (Chatbot)",
    "Basic familiarity with NumPy and ML concepts",
  ],
  tools: [
    {
      name: "transformers peft torch datasets",
      installCmd: "pip install transformers peft torch datasets python-dotenv",
      purpose:
        "HuggingFace Transformers (models), PEFT (LoRA adapters), PyTorch (training), Datasets (data loading)",
    },
  ],
  apiKeys: [
    {
      name: "HUGGING_FACE_HUB_TOKEN",
      where: "huggingface.co → Settings → Access Tokens → New token (read)",
      envVar: "HUGGING_FACE_HUB_TOKEN=hf_...",
    },
  ],
  projectStructure:
    "fine-tune/\n├── prepare_data.py\n├── train.py\n├── evaluate.py\n├── data/\n│   ├── train.jsonl\n│   └── eval.jsonl\n├── output/          ← saved model checkpoints\n└── .env",
};

const beginner: Step[] = [
  {
    title: "Complete Projects 01 and 03 first",
    sub: "Fine-tuning requires ML fundamentals — build the foundation first.",
    meta: { location: "—", tool: "—" },
    body: "Fine-tuning a language model is classified as Advanced because it requires comfort with Python, API responses, and basic ML concepts (loss functions, epochs, overfitting). Projects 01 and 03 cover the practical foundations. Return here — and switch to Intermediate depth — once both are working on your machine.",
    prompt: {
      context: "Prerequisites not met.",
      instruction:
        "Complete Project 01 (Document Q&A) and Project 03 (Streaming Chatbot) first. Once both are working end-to-end, return here and switch to Intermediate depth.",
    },
    verify: {
      run: "Check that both projects work:\n  python query.py 'test' (Project 01)\n  npm run dev (Project 03)",
      expect:
        "Project 01: returns a cited answer\nProject 03: chatbot streams a response at localhost:3000",
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
