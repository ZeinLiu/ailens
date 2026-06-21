import Anthropic from "@anthropic-ai/sdk";
import { createSupabaseServer } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createSupabaseServer();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return new Response("Unauthorized", { status: 401 });

  const { projectTitle, stepIndex, stepTitle, depth, tools, messages } =
    await request.json();

  const system = `The user is working on: ${projectTitle}.
They are on Step ${stepIndex + 1}: ${stepTitle}.
Their depth level: ${depth}.
Tools in use: ${tools}.
Help them with this specific step only.
If they describe an error, ask them to paste it.
Keep answers short. Do not jump ahead to future steps.`;

  const client = new Anthropic();
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const anthropicStream = await client.messages.create({
          model: "claude-opus-4-8",
          max_tokens: 1024,
          stream: true,
          system,
          messages,
        });

        for await (const event of anthropicStream) {
          if (
            event.type === "content_block_delta" &&
            event.delta.type === "text_delta"
          ) {
            controller.enqueue(encoder.encode(event.delta.text));
          }
        }
        controller.close();
      } catch (err) {
        controller.error(err);
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
