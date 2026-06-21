import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Activity, ClipboardList, History, LogOut, Settings, LayoutDashboard, Zap } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { useEffect, useState, type ReactNode } from "react";
import { getGuardPost, guardPostLabel } from "@/lib/utilities";

const NAV = [
  { to: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { to: "/energie", label: "Énergie temps réel", icon: Zap },
  { to: "/entry", label: "Saisie", icon: ClipboardList },
  { to: "/history", label: "Historique", icon: History },
  { to: "/admin", label: "Admin", icon: Settings, adminOnly: true },
];

export function AppShell({ children }: { children: ReactNode }) {
  const { tech, logout, ready } = useAuth();
  const navigate = useNavigate();
  const path = useRouterState({ select: (s) => s.location.pathname });
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    if (ready && !tech) navigate({ to: "/" });
  }, [ready, tech, navigate]);

  if (!ready || !tech) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-muted-foreground">Chargement…</div>
      </div>
    );
  }

  const visibleNav = NAV.filter((n) => !n.adminOnly || tech.role === "admin");

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-card/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Activity className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-bold leading-tight">INDUS · Monitoring</div>
              <div className="text-xs text-muted-foreground">{guardPostLabel(getGuardPost(now))}</div>
            </div>
          </div>
          <div className="hidden md:block text-center font-mono text-sm tabular-nums text-muted-foreground">
            {now.toLocaleString("fr-FR")}
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <div className="text-sm font-medium leading-tight">
                {tech.first_name} {tech.last_name}
              </div>
              <div className="text-xs text-muted-foreground">
                {tech.matricule} · <Badge variant="secondary" className="ml-1 text-[10px]">{tech.role}</Badge>
              </div>
            </div>
            <Button size="sm" variant="ghost" onClick={() => { logout(); navigate({ to: "/" }); }}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-2 pb-2">
          {visibleNav.map((n) => {
            const Icon = n.icon;
            const active = path.startsWith(n.to);
            return (
              <Link
                key={n.to}
                to={n.to}
                className={cn(
                  "flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  active ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {n.label}
              </Link>
            );
          })}
        </nav>
      </header>
      <main className="mx-auto max-w-7xl p-4">{children}</main>
    </div>
  );
}
