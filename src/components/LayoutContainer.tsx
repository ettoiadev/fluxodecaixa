import React from "react";
import { Link, useLocation } from "react-router-dom";
import { History, ListOrdered, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface LayoutContainerProps {
  children: React.ReactNode;
  className?: string;
}

const LayoutContainer: React.FC<LayoutContainerProps> = ({ 
  children, 
  className 
}) => {
  const location = useLocation();
  const pathname = location.pathname;

  return (
    <div className="min-h-screen bg-background pb-20 md:pb-0">
      <header className="sticky top-0 z-30 border-b bg-primary text-primary-foreground shadow-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2 font-semibold tracking-tight">
            <Wallet className="h-5 w-5" />
            <span className="hidden sm:inline">Controle de Caixa</span>
            <span className="sm:hidden">Caixa</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavLink to="/" label="Dashboard" active={pathname === "/"} />
            <NavLink to="/movimentacoes" label="Movimentações" active={pathname === "/movimentacoes"} />
            <NavLink to="/historico" label="Histórico" active={pathname === "/historico"} />
          </nav>
        </div>
      </header>

      <main className={cn("mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8", className)}>
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-30 grid grid-cols-3 border-t bg-card md:hidden">
        <MobileNavLink
          to="/"
          label="Dashboard"
          icon={Wallet}
          active={pathname === "/"}
        />
        <MobileNavLink
          to="/movimentacoes"
          label="Movimentações"
          icon={ListOrdered}
          active={pathname === "/movimentacoes"}
        />
        <MobileNavLink
          to="/historico"
          label="Histórico"
          icon={History}
          active={pathname === "/historico"}
        />
      </nav>
    </div>
  );
};

function NavLink({ to, label, active }: { to: string; label: string; active: boolean }) {
  return (
    <Link
      to={to}
      className={cn(
        "rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-primary-foreground/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-foreground/30",
        active && "bg-primary-foreground/15",
      )}
    >
      {label}
    </Link>
  );
}

function MobileNavLink({
  to,
  label,
  icon: Icon,
  active,
}: {
  to: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  active: boolean;
}) {
  return (
    <Link
      to={to}
      className={cn(
        "flex flex-col items-center gap-1 py-2.5 text-xs text-muted-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        active && "text-primary",
      )}
    >
      <Icon className="h-5 w-5" />
      <span>{label}</span>
    </Link>
  );
}

export default LayoutContainer;
