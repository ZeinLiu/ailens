import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Node.js 18+",
    "npm or pnpm",
    "A Vercel account (free at vercel.com)",
  ],
  tools: [
    {
      name: "Next.js + Vercel AI SDK",
      installCmd:
        "npx create-next-app@latest my-chatbot --typescript --tailwind --app\ncd my-chatbot\nnpm install ai @ai-sdk/openai",
      purpose:
        "Next.js App Router for the UI and API route; AI SDK for streaming LLM responses",
    },
  ],
  apiKeys: [
    {
      name: "OPENAI_API_KEY",
      where: "platform.openai.com → API Keys → Create new secret key",
      envVar: "Add to .env.local as: OPENAI_API_KEY=sk-...",
    },
  ],
  projectStructure:
    "my-chatbot/\n├── src/\n│   └── app/\n│       ├── api/\n│       │   └── chat/\n│       │       └── route.ts\n│       └── page.tsx\n├── .env.local\n└── package.json",
};

const beginner: Step[] = [
  {
    title: "Create the streaming API route",
    sub: "The server-side handler that calls the model and streams tokens back.",
    meta: {
      location: "src/app/api/chat/route.ts",
      tool: "Claude Code",
    },
    body: "The API route is the backend half of your chatbot — it receives the conversation history, calls the model with streaming enabled, and pipes each token back to the browser as it arrives. The AI SDK's streamText function handles all the streaming complexity so you write five lines instead of fifty.",
    prompt: {
      context:
        "create-next-app has run. The ai and @ai-sdk/openai packages are installed. src/app/api/chat/route.ts does not exist yet.",
      instruction: `Create src/app/api/chat/route.ts that:
1. Imports openai from '@ai-sdk/openai' and streamText from 'ai'
2. Exports an async POST function
3. Reads { messages } from await request.json()
4. Calls streamText({ model: openai('gpt-4o-mini'), messages })
5. Returns result.toDataStreamResponse()

No other logic needed — the SDK handles everything else.`,
    },
    verify: {
      run: "npm run dev  (then in a second terminal:)\ncurl -X POST http://localhost:3000/api/chat -H 'Content-Type: application/json' -d '{\"messages\":[{\"role\":\"user\",\"content\":\"hello\"}]}'",
      expect:
        "data: {\"type\":\"text-delta\",\"textDelta\":\"Hello\"}\ndata: {\"type\":\"text-delta\",\"textDelta\":\"!\"}\n... (streaming continues)",
      type: "terminal-output",
    },
    time: "~15 min",
  },
  {
    title: "Build the chat UI",
    sub: "A message list and input form wired to the useChat hook.",
    meta: {
      location: "src/app/page.tsx",
      tool: "Claude Code",
    },
    body: "The useChat hook from the AI SDK gives you the complete chat state — messages array, input value, form handlers, and a loading flag — in a single import. It automatically calls your /api/chat route, appends each streamed token to the last assistant message, and re-renders as they arrive. You never manage state manually.",
    prompt: {
      context:
        "The API route at src/app/api/chat/route.ts is working (verified in step 1). src/app/page.tsx has the default Next.js landing page.",
      instruction: `Replace src/app/page.tsx with a clean chat interface:
1. Add 'use client' at the top
2. Import useChat from 'ai/react'
3. Destructure: const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat()
4. Render a scrollable message list — each message shows "You:" or "AI:" followed by the content
5. Render a form with a text input (controlled by input/handleInputChange) and a Submit button
6. Show a subtle "Thinking..." label when isLoading is true
7. Style with Tailwind — clean, readable, works on mobile

Keep it simple — no markdown rendering, no avatars, no sidebar needed.`,
    },
    verify: {
      run: "Open http://localhost:3000 in your browser",
      expect:
        "A chat input box is visible. Type 'Hello' and press Enter — the response streams word by word below your message.",
      type: "browser",
    },
    time: "~20 min",
  },
  {
    title: "Add a system prompt",
    sub: "Define who your bot is, its tone, and what it won't answer.",
    meta: {
      location: "src/app/api/chat/route.ts",
      tool: "Claude Code",
    },
    body: "A system prompt is the most impactful single change you can make to a chatbot — it defines the assistant's role, tone, and constraints. Without one, the model behaves as a generic assistant. This edit adds a system field to the streamText call; every conversation now starts with your instructions baked in.",
    prompt: {
      context:
        "The streaming API route is working. The system field has not been set in the streamText call.",
      instruction: `Update the streamText call in src/app/api/chat/route.ts to add a system field.

Write a system prompt for your specific use case. Include:
1. The assistant's role (e.g. "You are a support assistant for a project management tool")
2. Tone (pick one: friendly and conversational / concise and professional / encouraging)
3. One constraint ("Do not speculate about topics outside of X. If asked, say: I can only help with X.")

Use your real use case — don't use a generic placeholder.`,
    },
    verify: {
      run: "Open http://localhost:3000 and type: What are you?",
      expect:
        "The assistant describes itself using the role you defined — not a generic 'I am a helpful assistant'.",
      type: "browser",
    },
    time: "~10 min",
  },
  {
    title: "Deploy to Vercel",
    sub: "Get a public URL you can share — in one command.",
    meta: {
      location: "Terminal",
      tool: "Terminal",
      userInputs: ["Your OPENAI_API_KEY value"],
    },
    body: "Deploying to Vercel creates a live public URL instantly. The critical step that most people miss: .env.local is never uploaded to Vercel, so you must add OPENAI_API_KEY in the Vercel dashboard and redeploy — otherwise the live app will get 401 errors from OpenAI.",
    prompt: {
      context:
        "The chatbot works locally at http://localhost:3000. You have a Vercel account.",
      instruction: `Deploy the chatbot to Vercel:
1. Run: npx vercel --prod
   (If prompted, link to an existing project or create a new one)
2. After deploy completes, copy the production URL from the output
3. Open the Vercel dashboard → your project → Settings → Environment Variables
4. Add: OPENAI_API_KEY = your key value (set for Production environment)
5. Go to Deployments → click the latest deployment → Redeploy
6. Open the redeployed URL and send a test message`,
      tool: "Terminal",
    },
    verify: {
      run: "Open the Vercel deployment URL in your browser",
      expect:
        "The chat interface loads. Send a message — it responds with streaming, same as localhost.",
      type: "browser",
    },
    time: "~20 min",
  },
];

export const steps: Record<Depth, Step[]> = {
  beginner,
  intermediate: [],
  advanced: [],
};
