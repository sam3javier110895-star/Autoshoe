import { useState } from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard, Smartphone, Users, Zap, Send, Package,
  Contact, Activity, Brain, LogOut, Menu, X, ChevronRight, GitBranch,
} from "lucide-react";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard, color: "#25D366" },
  { name: "WhatsApp", href: "/whatsapp", icon: Smartphone, color: "#25D366" },
  { name: "Grupos", href: "/grupos", icon: Users, color: "#3B82F6" },
  { name: "Automatizaciones", href: "/automatizaciones", icon: Zap, color: "#F59E0B" },
  { name: "Flujos Agente", href: "/flujos", icon: GitBranch, color: "#25D366" },
  { name: "Reenvios", href: "/reenvios", icon: Send, color: "#8B5CF6" },
  { name: "Disponibilidad", href: "/disponibilidad", icon: Package, color: "#14B8A6" },
  { name: "Contactos", href: "/contactos", icon: Contact, color: "#EC4899" },
  { name: "Monitor", href: "/monitor", icon: Activity, color: "#EF4444" },
  { name: "IA", href: "/ia", icon: Brain, color: "#8B5CF6" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("sf_auth");
    window.location.href = "/";
  };

  const isActive = (href: string) =>
    location === href || (href !== "/" && location.startsWith(href));

  return (
    <div className="flex min-h-screen w-full bg-background">
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-border transition-transform md:static md:translate-x-0 md:w-56 flex-shrink-0 ${
          mobileOpen ? "translate-x-0 w-56" : "-translate-x-full"
        }`}
        style={{ background: "hsl(var(--sidebar))" }}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-14 px-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
            >
              <Smartphone className="w-4 h-4 text-white" />
            </div>
            <div>
              <p className="text-xs font-bold text-sidebar-foreground leading-none">ShoeFlow</p>
              <p className="text-[10px] text-muted-foreground leading-none mt-0.5">Manager</p>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="md:hidden text-muted-foreground hover:text-sidebar-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
          {navigation.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-all group relative ${
                  active
                    ? "text-sidebar-foreground"
                    : "text-muted-foreground hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                }`}
                style={active ? { background: `${item.color}15` } : {}}
              >
                {active && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full"
                    style={{ background: item.color }}
                  />
                )}
                <item.icon
                  className="w-4 h-4 flex-shrink-0 transition-colors"
                  style={{ color: active ? item.color : undefined }}
                />
                <span className={`flex-1 ${active ? "text-sidebar-foreground" : ""}`}>{item.name}</span>
                {active && <ChevronRight className="w-3 h-3 opacity-50 flex-shrink-0" style={{ color: item.color }} />}
              </Link>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-2 pb-4">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all"
          >
            <LogOut className="w-4 h-4" />
            Cerrar sesion
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Mobile header */}
        <div className="flex md:hidden items-center gap-3 h-14 px-4 border-b border-border bg-card">
          <button
            onClick={() => setMobileOpen(true)}
            className="text-muted-foreground hover:text-foreground"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, #25D366, #128C7E)" }}
          >
            <Smartphone className="w-3.5 h-3.5 text-white" />
          </div>
          <p className="text-sm font-bold text-foreground">ShoeFlow Manager</p>
        </div>

        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
    </div>
  );
}
