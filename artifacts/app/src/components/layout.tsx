import { Link, useLocation } from "wouter";
import { LayoutDashboard, Folder, CheckSquare } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  const navigation = [
    { name: "Dashboard", href: "/", icon: LayoutDashboard },
    { name: "Groups", href: "/groups", icon: Folder },
    { name: "Tasks", href: "/tasks", icon: CheckSquare },
  ];

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="hidden border-r bg-sidebar md:block md:w-64 flex-shrink-0">
        <div className="flex h-full flex-col">
          <div className="flex h-14 items-center border-b border-sidebar-border px-4">
            <div className="flex items-center gap-2 font-bold tracking-tight text-sidebar-foreground">
              <div className="h-6 w-6 rounded bg-primary flex items-center justify-center">
                <span className="text-primary-foreground text-xs">AP</span>
              </div>
              Automatización
            </div>
          </div>
          <div className="flex-1 overflow-auto py-4">
            <nav className="grid gap-1 px-2">
              {navigation.map((item) => {
                const isActive = location === item.href || (item.href !== "/" && location.startsWith(item.href));
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground"
                        : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }`}
                  >
                    <item.icon className="h-4 w-4" />
                    {item.name}
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </div>
      <div className="flex flex-1 flex-col overflow-hidden">
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
