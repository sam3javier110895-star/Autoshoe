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

    // Smart fallback if GROQ_API_KEY is missing, preventing user-facing errors
    if (!process.env.GROQ_API_KEY) {
      let reply = "⚠️ *Nota: GROQ_API_KEY no está configurada en las variables de entorno de Render.*\n\nComo asistente simulado de ShoeFlow Manager, te respondo:\n\n";
      const q = message.toLowerCase();
      if (q.includes("foto") || q.includes("imagen") || q.includes("detectar")) {
        reply += "Para configurar una automatización que detecte fotos de zapatos:\n1. Ve a la sección **Automatizaciones**.\n2. Crea una regla seleccionando como Trigger/Disparador **'Detección de Foto/Imagen'**.\n3. Configura la acción para que reenvíe automáticamente la referencia detectada al grupo de tus proveedores seleccionados.";
      } else if (q.includes("mejor precio") || q.includes("criterio")) {
        reply += "El criterio de **'Mejor Precio'** analiza las respuestas y cotizaciones de los proveedores en los grupos. El sistema extrae el valor monetario detectado en el texto del mensaje del proveedor y selecciona la oferta más económica para enviártela automáticamente.";
      } else if (q.includes("proveedor") || q.includes("contacto")) {
        reply += "Puedes gestionar tu lista de proveedores en la sección **Contactos**. Asegúrate de asignarle el tipo 'Proveedor' a los números de WhatsApp correspondientes para que el bot de ShoeFlow pueda identificarlos correctamente en los grupos.";
      } else {
        reply += `Has preguntado: "${message}".\n\nPara que la Inteligencia Artificial de Llama 3 te responda de manera personalizada y dinámica, por favor configura la variable de entorno **GROQ_API_KEY** con tu API key en tu panel de Render.`;
      }
      res.json({ message: reply });
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
  } catch (err: any) {
    req.log.error({ err }, "Error in AI chat");
    res.status(500).json({ 
      error: "Error al procesar la solicitud de IA",
      details: err?.message || String(err)
    });
  }
});

export default router;
