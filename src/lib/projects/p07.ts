import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Docker Desktop installed and running (download at docker.com)",
    "A Slack workspace you can post to — OR a Gmail account for email delivery",
    "An OpenAI API key",
  ],
  tools: [
    {
      name: "n8n",
      installCmd:
        "docker run -it --rm -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n",
      purpose:
        "Visual no-code workflow automation — runs in your browser at http://localhost:5678",
    },
  ],
  apiKeys: [
    {
      name: "OPENAI_API_KEY",
      where: "platform.openai.com → API Keys",
      envVar:
        "Set inside n8n: Credentials panel → New Credential → OpenAI API → paste key",
    },
  ],
  projectStructure:
    "No files to create — the entire workflow is configured in n8n's visual canvas.\nWorkflows are saved to ~/.n8n on your machine and persist between restarts.\nAccess the editor at: http://localhost:5678",
};

const beginner: Step[] = [
  {
    title: "Start n8n",
    sub: "Run the visual workflow editor in Docker and open it in your browser.",
    meta: {
      location: "Terminal",
      tool: "Terminal",
    },
    body: "n8n is a visual workflow tool that runs entirely in your browser. The Docker command downloads and starts it in one step with no configuration. Workflows are saved locally so they persist across restarts — the -v flag mounts your ~/.n8n folder into the container.",
    prompt: {
      context: "Docker Desktop is running on your machine.",
      instruction: `Run this command in Terminal to start n8n:

docker run -it --rm -p 5678:5678 -v ~/.n8n:/home/node/.n8n n8nio/n8n

Then open http://localhost:5678 in your browser.
Complete the one-time account setup (just an email and password — no external signup needed).
Click "New workflow" to open a blank canvas.`,
      tool: "Terminal",
    },
    verify: {
      run: "Open http://localhost:5678 in your browser",
      expect:
        "The n8n canvas loads with an empty workflow. A '+ Add first step' prompt is visible in the centre.",
      type: "browser",
    },
    time: "~15 min",
  },
  {
    title: "Add the content source",
    sub: "Fetch and extract text from the page you want to monitor.",
    meta: {
      location: "n8n canvas",
      tool: "n8n",
      userInputs: [
        "URL of the page to monitor (any publicly accessible page)",
        "CSS selector for the content you want (e.g. 'main', 'article', '.content')",
      ],
    },
    body: "The first two nodes fetch and clean the content from your target source. The HTTP Request node retrieves the raw page, and the HTML Extract node strips away navigation, ads, and boilerplate — leaving only the text you care about. If you're unsure of the CSS selector, right-click the target content in Chrome → Inspect → right-click the highlighted element → Copy → Copy selector.",
    prompt: {
      context:
        "n8n is running at http://localhost:5678. You have a blank canvas with no nodes yet.",
      instruction: `In the n8n canvas, add and configure two nodes:

Node 1 — HTTP Request:
- Click the + button to add a node, search "HTTP Request"
- Method: GET
- URL: the page you want to monitor (paste the full URL)
- Click "Test step" — you should see raw HTML in the output

Node 2 — HTML Extract:
- Add an HTML Extract node connected after the HTTP Request node
- Source Data: Input Data
- Extraction Values:
  - Key: text
  - CSS Selector: main (or article, or the selector for your page's main content)
  - Return: HTML of matches → set to Text Only
- Click "Test step" — you should see clean text in the output`,
    },
    verify: {
      run: "Click 'Test step' on the HTML Extract node",
      expect:
        "The Output panel shows readable text content from the page — not raw HTML tags.",
      type: "ui-state",
    },
    time: "~20 min",
  },
  {
    title: "Add AI summarisation",
    sub: "Summarise the extracted content into 3 bullet points.",
    meta: {
      location: "n8n canvas",
      tool: "n8n",
      userInputs: ["Your OPENAI_API_KEY (to set up the n8n credential)"],
    },
    body: "The OpenAI node takes the cleaned text from the HTML Extract node and summarises it according to a prompt you write. This is where you define what to look for — new items, price changes, key updates, or anything relevant to your monitoring goal. Write a specific prompt for your use case rather than a generic one.",
    prompt: {
      context:
        "The HTTP Request → HTML Extract chain works and produces clean text in the node output.",
      instruction: `Add an OpenAI node connected after the HTML Extract node:

1. Search for "OpenAI" in the node picker and add it
2. Connect your API key:
   - Click the Credential field → New Credential → OpenAI API
   - Paste your OPENAI_API_KEY and save
3. Set:
   - Resource: Text
   - Operation: Message a Model
   - Model: gpt-4o-mini
   - Messages → User Message:
     "Summarise the following content in 3 bullet points. Focus on what is new, changed, or notable. Be specific and concise. Avoid repeating phrases from the source.

     {{ $('HTML Extract').item.json.text }}"

4. Click "Test step" and confirm the output is a readable 3-bullet summary`,
    },
    verify: {
      run: "Click 'Test step' on the OpenAI node",
      expect:
        "The Output panel shows 3 bullet points summarising the page content — not an error and not a refusal.",
      type: "ui-state",
    },
    time: "~20 min",
  },
  {
    title: "Add delivery and a daily schedule",
    sub: "Send the summary to Slack or email, then activate the workflow.",
    meta: {
      location: "n8n canvas",
      tool: "n8n",
      userInputs: [
        "Slack channel name OR email address to send notes to",
      ],
    },
    body: "The last two additions make the workflow useful: a delivery node sends the AI summary to Slack or email, and a Schedule Trigger replaces the manual 'Test' button with a daily automatic run. Once you click Activate, the workflow runs on its own — you never have to check the page manually again.",
    prompt: {
      context:
        "The HTTP Request → HTML Extract → OpenAI chain is working and producing a 3-bullet summary.",
      instruction: `Add two more nodes:

Delivery node — choose one:
  Option A (Slack):
  - Add a Slack node after OpenAI
  - Connect your Slack workspace via OAuth
  - Operation: Send a message
  - Channel: #your-channel
  - Message: {{ $('OpenAI').item.json.message.content }}

  Option B (Email — no OAuth needed):
  - Add a Send Email node after OpenAI
  - To: your email address
  - Subject: Daily update — {{ $now.format('MMMM D, YYYY') }}
  - Body: {{ $('OpenAI').item.json.message.content }}
  - Connect Gmail or SMTP credentials

Then add the trigger:
- Add a Schedule Trigger node at the very start (before HTTP Request)
- Set: Trigger interval → Every Day → at 08:00

Finally:
- Click "Activate" (toggle in the top-right corner)
- Confirm the workflow shows "Active" in the Workflows list`,
    },
    verify: {
      run: "Check Slack / your inbox after clicking 'Test workflow'",
      expect:
        "A message arrives in your Slack channel or inbox containing the 3-bullet summary of the monitored page.",
      type: "ui-state",
    },
    time: "~25 min",
  },
];

export const steps: Record<Depth, Step[]> = {
  beginner,
  intermediate: [],
  advanced: [],
};
