import { Router, type IRouter } from "express";
import Groq from "groq-sdk";
import { eq } from "drizzle-orm";
import { db, tasksTable, groupsTable } from "@workspace/db";
import { AiChatBody, AiChatResponse, AiSuggestTasksBody, AiSuggestTasksResponse } from "@workspace/api-zod";

const router: IRouter = Router();

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey });
}

router.post("/ai/chat", async (req, res): Promise<void> => {
  const parsed = AiChatBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { message, groupId, conversationHistory } = parsed.data;

  let systemContext = "You are a helpful productivity assistant for task management. Help users organize their work, prioritize tasks, and stay productive. Be concise and actionable.";

  if (groupId != null) {
    try {
      const [group, tasks] = await Promise.all([
        db.select().from(groupsTable).where(eq(groupsTable.id, groupId)),
        db.select().from(tasksTable).where(eq(tasksTable.groupId, groupId)),
      ]);

      if (group[0]) {
        const taskSummary = tasks.map((t) => `- [${t.status}/${t.priority}] ${t.title}${t.description ? `: ${t.description}` : ""}`).join("\n");
        systemContext = `You are a helpful productivity assistant for task management. You are helping with the group "${group[0].name}"${group[0].description ? ` (${group[0].description})` : ""}.

Current tasks in this group:
${taskSummary || "No tasks yet."}

Help the user manage, prioritize, and complete their tasks. Be concise and actionable. You can suggest creating, completing, or reorganizing tasks based on the context above.`;
      }
    } catch {
      req.log.warn({ groupId }, "Could not fetch group context for AI chat");
    }
  }

  const groq = getGroqClient();
  const history = (conversationHistory ?? []).map((m) => ({
    role: m.role as "user" | "assistant",
    content: m.content,
  }));

  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: systemContext },
      ...history,
      { role: "user", content: message },
    ],
    max_tokens: 1024,
    temperature: 0.7,
  });

  const reply = completion.choices[0]?.message?.content ?? "I'm sorry, I couldn't generate a response.";
  res.json(AiChatResponse.parse({ message: reply }));
});

router.post("/ai/suggest-tasks", async (req, res): Promise<void> => {
  const parsed = AiSuggestTasksBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { groupId, context } = parsed.data;

  const [group, tasks] = await Promise.all([
    db.select().from(groupsTable).where(eq(groupsTable.id, groupId)),
    db.select().from(tasksTable).where(eq(tasksTable.groupId, groupId)),
  ]);

  if (!group[0]) {
    res.status(404).json({ error: "Group not found" });
    return;
  }

  const existingTasks = tasks.map((t) => `- [${t.status}] ${t.title}`).join("\n");
  const prompt = `You are a productivity assistant. Based on the group "${group[0].name}"${group[0].description ? ` (description: ${group[0].description})` : ""}, suggest 5 actionable tasks.

Existing tasks:
${existingTasks || "None yet."}

${context ? `Additional context: ${context}` : ""}

Respond ONLY with a valid JSON array (no markdown, no explanation) with exactly this shape:
[
  {"title": "Task title", "description": "Brief description", "priority": "high"|"medium"|"low"},
  ...
]`;

  const groq = getGroqClient();
  const completion = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [{ role: "user", content: prompt }],
    max_tokens: 800,
    temperature: 0.8,
  });

  const raw = completion.choices[0]?.message?.content ?? "[]";

  let suggestions: { title: string; description?: string; priority: string }[] = [];
  try {
    const jsonMatch = raw.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        suggestions = parsed.map((s) => ({
          title: String(s.title ?? ""),
          description: s.description ? String(s.description) : undefined,
          priority: ["low", "medium", "high"].includes(s.priority) ? s.priority : "medium",
        })).filter((s) => s.title.length > 0);
      }
    }
  } catch {
    req.log.warn("Failed to parse AI suggestions JSON");
  }

  res.json(AiSuggestTasksResponse.parse({ suggestions }));
});

export default router;
