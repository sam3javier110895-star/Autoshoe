import { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Smartphone, Lock, User, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function Login() {
  const [, navigate] = useLocation();
  const [usuario, setUsuario] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setCargando(true);
    setError("");
    await new Promise((r) => setTimeout(r, 800));
    if (usuario === "admin" && contrasena === "admin") {
      localStorage.setItem("sf_auth", "true");
      navigate("/dashboard");
    } else {
      setError("Credenciales incorrectas. Use admin / admin");
    }
    setCargando(false);
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden flex items-center justify-center">
      <div className="absolute inset-0 overflow-hidden">
        <div
          className="absolute -top-40 -right-40 w-96 h-96 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #25D366 0%, transparent 70%)",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -bottom-40 -left-40 w-80 h-80 rounded-full opacity-10"
          style={{
            background: "radial-gradient(circle, #3B82F6 0%, transparent 70%)",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
        <div
          className="absolute top-1/2 left-1/4 w-64 h-64 rounded-full opacity-5"
          style={{
            background: "radial-gradient(circle, #25D366 0%, transparent 70%)",
            animation: "float 12s ease-in-out infinite 2s",
          }}
        />
        <style>{`
          @keyframes float {
            0%, 100% { transform: translateY(0px) scale(1); }
            50% { transform: translateY(-30px) scale(1.05); }
          }
        `}</style>
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 w-full max-w-md px-6"
      >
        <div className="text-center mb-10">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)", boxShadow: "0 0 40px rgba(37,211,102,0.3)" }}
          >
            <Smartphone className="w-8 h-8 text-white" />
          </motion.div>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold text-foreground tracking-tight"
          >
            ShoeFlow Manager
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="mt-2 text-sm text-muted-foreground"
          >
            Sistema de automatizacion operativa WhatsApp
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-8"
        >
          <h2 className="text-lg font-semibold text-foreground mb-6">Acceder al sistema</h2>
          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="usuario" className="text-sm font-medium text-muted-foreground">
                Usuario
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="usuario"
                  type="text"
                  placeholder="Ingrese su usuario"
                  value={usuario}
                  onChange={(e) => setUsuario(e.target.value)}
                  className="pl-10 bg-card border-border text-foreground"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="contrasena" className="text-sm font-medium text-muted-foreground">
                Contrasena
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="contrasena"
                  type="password"
                  placeholder="Ingrese su contrasena"
                  value={contrasena}
                  onChange={(e) => setContrasena(e.target.value)}
                  className="pl-10 bg-card border-border text-foreground"
                  required
                />
              </div>
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2"
              >
                {error}
              </motion.p>
            )}

            <Button
              type="submit"
              disabled={cargando}
              className="w-full font-semibold gap-2 h-11"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              {cargando ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Ingresar <ChevronRight className="w-4 h-4" />
                </>
              )}
            </Button>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Demo: usuario <span className="text-[#25D366] font-mono">admin</span> / contrasena{" "}
            <span className="text-[#25D366] font-mono">admin</span>
          </p>
        </motion.div>

        <p className="text-center text-xs text-muted-foreground mt-6">
          ShoeFlow Manager v1.0 — Sistema de Automatizacion Interna
        </p>
      </motion.div>
    </div>
  );
}
