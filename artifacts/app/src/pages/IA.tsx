import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, Send, Loader2, Bot, User, Sparkles, RefreshCw } from "lucide-react";
import { useAiChat } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const SUGGESTIONS = [
  "Como configuro una automatizacion para detectar fotos de zapatos?",
  "Explica el flujo de consulta a proveedores paso a paso",
  "Como puedo optimizar los tiempos de respuesta de mis proveedores?",
  "Que significa el criterio mejor precio en las automatizaciones?",
  "Como funciona el sistema de reenvio de mensajes?",
];

function MessageBubble({ msg, index }: { msg: Message; index: number }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{
          background: isUser ? "linear-gradient(135deg, #25D366, #128C7E)" : "rgba(139,92,246,0.15)",
        }}
      >
        {isUser ? (
          <User className="w-4 h-4 text-white" />
        ) : (
          <Bot className="w-4 h-4" style={{ color: "#8B5CF6" }} />
        )}
      </div>
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isUser
            ? "text-white rounded-tr-sm"
            : "text-foreground border border-border rounded-tl-sm"
        }`}
        style={{
          background: isUser
            ? "linear-gradient(135deg, #25D366, #128C7E)"
            : "hsl(var(--card))",
        }}
      >
        <p className="whitespace-pre-wrap">{msg.content}</p>
      </div>
    </motion.div>
  );
}

export default function IA() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hola! Soy el asistente de IA de ShoeFlow Manager. Puedo ayudarte a entender y optimizar tus automatizaciones de WhatsApp para el negocio de calzado. Que quieres saber?",
    },
  ]);
  const [input, setInput] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  const chatMutation = useAiChat({
    mutation: {
      onSuccess: (data) => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: data.message },
        ]);
      },
      onError: () => {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: "Error al conectar con la IA. Verifica tu conexion e intenta de nuevo." },
        ]);
      },
    },
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim() || chatMutation.isPending) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    const history = messages.map((m) => ({ role: m.role, content: m.content }));
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    chatMutation.mutate({
      data: {
        message: text.trim(),
        conversationHistory: history,
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleReset = () => {
    setMessages([
      {
        role: "assistant",
        content: "Hola! Soy el asistente de IA de ShoeFlow Manager. Puedo ayudarte a entender y optimizar tus automatizaciones de WhatsApp para el negocio de calzado. Que quieres saber?",
      },
    ]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-full" style={{ height: "calc(100vh - 0px)" }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 py-4 border-b border-border">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ background: "rgba(139,92,246,0.12)" }}
            >
              <Brain className="w-5 h-5" style={{ color: "#8B5CF6" }} />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">Inteligencia Artificial</h1>
              <p className="text-xs text-muted-foreground">Asistente especializado en ShoeFlow</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-xs px-2 py-1 rounded-lg" style={{ background: "rgba(139,92,246,0.1)", color: "#8B5CF6" }}>
              <Sparkles className="w-3 h-3" />
              <span>Groq AI</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleReset}
              className="border-border text-xs gap-1.5"
            >
              <RefreshCw className="w-3 h-3" />
              Nueva conversacion
            </Button>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} index={i} />
            ))}
          </AnimatePresence>

          {chatMutation.isPending && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3"
            >
              <div
                className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "rgba(139,92,246,0.15)" }}
              >
                <Bot className="w-4 h-4" style={{ color: "#8B5CF6" }} />
              </div>
              <div className="rounded-2xl rounded-tl-sm border border-border bg-card px-4 py-3 flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin" style={{ color: "#8B5CF6" }} />
                <span className="text-xs text-muted-foreground">Pensando...</span>
              </div>
            </motion.div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Suggestions (show only at start) */}
      {messages.length === 1 && (
        <div className="flex-shrink-0 px-6 pb-3">
          <div className="max-w-4xl mx-auto">
            <p className="text-xs text-muted-foreground mb-2">Preguntas frecuentes:</p>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-border hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 text-muted-foreground hover:text-foreground transition-all text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex-shrink-0 px-6 pb-6 pt-2 border-t border-border">
        <form onSubmit={handleSubmit} className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Pregunta sobre automatizaciones, grupos, proveedores..."
              className="w-full bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#8B5CF6] transition-colors pr-4"
              disabled={chatMutation.isPending}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage(input);
                }
              }}
            />
          </div>
          <Button
            type="submit"
            disabled={!input.trim() || chatMutation.isPending}
            className="gap-2 px-5"
            style={{ background: input.trim() ? "linear-gradient(135deg, #8B5CF6, #6D28D9)" : undefined }}
          >
            {chatMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </Button>
        </form>
        <p className="text-center text-[10px] text-muted-foreground mt-2 max-w-4xl mx-auto">
          Powered by Groq · llama-3.3-70b-versatile · Especializado en automatizacion WhatsApp
        </p>
      </div>
    </div>
  );
}
