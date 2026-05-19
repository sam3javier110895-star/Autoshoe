import { Router } from "express";
import Groq from "groq-sdk";

const router = Router();

function getGroqClient(): Groq {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set");
  return new Groq({ apiKey });
}

router.post("/chat", async (req, res) => {
  try {
    const { message, conversationHistory } = req.body;
    if (!message) {
      res.status(400).json({ error: "message requerido" });
      return;
    }

    const systemContext = `Eres un asistente de inteligencia artificial especializado en automatización de WhatsApp para negocios de calzado. 
Tu rol es ayudar al usuario a:
- Entender y configurar automatizaciones de WhatsApp para consultas de zapatos
- Analizar flujos de mensajes, precios y disponibilidad de proveedores
- Optimizar reglas de detección de fotos y reenvío a grupos
- Interpretar datos de respuestas de proveedores
- Sugerir mejoras en el flujo de cotización
- Resolver dudas sobre el sistema ShoeFlow Manager

Responde siempre en español, de manera concisa y práctica. Si el usuario pregunta algo no relacionado con WhatsApp o zapatos, redirige amablemente a los temas relevantes del sistema.`;

    const groq = getGroqClient();
    const history = (conversationHistory ?? []).map((m: { role: string; content: string }) => ({
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

    const reply = completion.choices[0]?.message?.content ?? "No pude generar una respuesta.";
    res.json({ message: reply });
  } catch (err) {
    req.log.error({ err }, "Error in AI chat");
    res.status(500).json({ error: "Error al procesar la solicitud de IA" });
  }
});

export default router;
