import type { EnvSetup, Step, Depth } from "../types";

export const envSetup: EnvSetup = {
  prerequisites: [
    "Python 3.10+",
    "pip",
    "An audio recording of a meeting (mp3, mp4, wav, m4a, or webm — max 25 MB)",
  ],
  tools: [
    {
      name: "openai python-dotenv",
      installCmd: "pip install openai python-dotenv",
      purpose: "OpenAI Whisper API for transcription and GPT for summarisation",
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
    "meeting-notes/\n├── transcribe.py\n├── summarise.py\n├── run.py\n├── .env\n└── recordings/\n    └── your-meeting.mp3",
};

const beginner: Step[] = [
  {
    title: "Transcribe the audio with Whisper",
    sub: "Send your audio file to OpenAI and get a full text transcript.",
    meta: {
      location: "transcribe.py",
      tool: "Claude Code",
      userInputs: ["Path to your audio file (e.g. recordings/meeting.mp3)"],
    },
    body: "transcribe.py sends your audio file to the Whisper API and gets back a word-for-word transcript. Whisper supports mp3, mp4, wav, m4a and webm files up to 25 MB — a typical 60-minute meeting recording in mp3 is around 15–20 MB. The transcript is saved to a .txt file so the next step can read it.",
    prompt: {
      context:
        "transcribe.py does not exist. OPENAI_API_KEY is in .env. The recordings/ folder has an audio file.",
      instruction: `Create transcribe.py that:
1. Loads .env with python-dotenv
2. Accepts an audio file path as sys.argv[1]
3. Opens the file in binary mode and calls:
   client.audio.transcriptions.create(model="whisper-1", file=f, response_format="text")
4. Saves the transcript to a .txt file with the same name in the same directory
   (e.g. recordings/meeting.mp3 → recordings/meeting.txt)
5. Prints the first 200 characters of the transcript and the total word count

Use from openai import OpenAI and instantiate the client with client = OpenAI().`,
    },
    verify: {
      run: "python transcribe.py recordings/your-meeting.mp3",
      expect:
        "Transcript preview: 'Good morning everyone, thanks for joining...\nWord count: 847\nSaved to: recordings/your-meeting.txt ✓",
      type: "terminal-output",
    },
    time: "~20 min",
  },
  {
    title: "Extract structure with GPT",
    sub: "Turn the raw transcript into summary, decisions, action items, and open questions.",
    meta: {
      location: "summarise.py",
      tool: "Claude Code",
      userInputs: ["The .txt transcript file from step 1"],
    },
    body: "summarise.py reads the transcript and asks GPT to extract the four things people actually need from a meeting: a brief summary, a list of concrete decisions, action items with owners and deadlines, and open questions that still need answers. The output is saved as meeting_notes.md — ready to paste into Notion, Slack, or any tool you use.",
    prompt: {
      context:
        "transcribe.py was created in step 1 and produced a .txt file. summarise.py does not exist.",
      instruction: `Create summarise.py that:
1. Loads .env with python-dotenv
2. Reads the transcript text from the .txt path provided as sys.argv[1]
3. Calls gpt-4o-mini with this system prompt (use it verbatim):

"You are a meeting notes assistant. From the transcript below, extract exactly these four sections in markdown:

## Summary
2–3 sentences covering the main purpose and outcome of the meeting.

## Decisions Made
Bulleted list of concrete decisions reached. Skip discussion and opinions.

## Action Items
Each on its own line: - [OWNER first name] Task description (deadline if mentioned)
If no owner is named, write [UNASSIGNED].

## Open Questions
Bulleted list of questions that came up but were not resolved."

4. Saves the GPT output to meeting_notes.md in the current directory
5. Prints "Notes saved to meeting_notes.md ✓"`,
    },
    verify: {
      run: "python summarise.py recordings/your-meeting.txt\ncat meeting_notes.md",
      expect:
        "Notes saved to meeting_notes.md ✓\n\n## Summary\n...\n\n## Decisions Made\n- ...\n\n## Action Items\n- [Alice] ...\n\n## Open Questions\n- ...",
      type: "terminal-output",
    },
    time: "~20 min",
  },
  {
    title: "Combine into one command",
    sub: "Chain both scripts so the full pipeline runs from a single line.",
    meta: {
      location: "run.py",
      tool: "Claude Code",
      userInputs: ["Path to any audio file"],
    },
    body: "run.py is the script you'll actually use day-to-day: give it an audio file and it handles transcription and summarisation in sequence, producing meeting_notes.md in under two minutes. It also refactors transcribe.py and summarise.py to expose importable functions so the pipeline stays clean.",
    prompt: {
      context:
        "transcribe.py and summarise.py both work as standalone scripts. run.py does not exist.",
      instruction: `Do the following in one go:

1. Refactor transcribe.py: extract the main logic into a function called transcribe(filepath: str) -> str that returns the transcript text. Keep the if __name__ == '__main__' block so it still works standalone.

2. Refactor summarise.py: extract the main logic into a function called summarise(transcript: str) -> str that returns the markdown notes. Keep the standalone block.

3. Create run.py that:
   - Accepts an audio file path as sys.argv[1]
   - Calls transcribe() and prints "Transcribing {filename}..."
   - Calls summarise() on the result and prints "Summarising {word_count} words..."
   - Saves the output to meeting_notes.md
   - Prints "Done. Notes saved to meeting_notes.md ✓"`,
    },
    verify: {
      run: "python run.py recordings/your-meeting.mp3",
      expect:
        "Transcribing your-meeting.mp3...\nSummarising 847 words...\nDone. Notes saved to meeting_notes.md ✓",
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
