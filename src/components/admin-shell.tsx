import Link from "next/link";
import { Container } from "@/components/container";
import { cn } from "@/lib/utils";

const links = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/usuarios", label: "Usuarios" },
  { href: "/admin/loterias", label: "Loterias" },
  { href: "/admin/concursos", label: "Concursos" },
  { href: "/admin/boloes", label: "Boloes" },
  { href: "/admin/compras", label: "Compras" },
  { href: "/admin/pagamentos", label: "Pagamentos" },
  { href: "/admin/resultados", label: "Resultados" },
  { href: "/admin/premios", label: "Premios" },
  { href: "/admin/logs", label: "Logs" },
];

export function AdminShell({
  currentPath,
  title,
  description,
  children,
}: {
  currentPath: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <Container className="py-10">
      <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="rounded-[28px] border border-fuchsia-100 bg-linear-to-b from-fuchsia-50 to-white p-4 shadow-sm">
          <p className="px-3 pb-3 text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Painel admin</p>
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-white hover:text-fuchsia-700",
                  currentPath === link.href && "bg-white text-fuchsia-700 shadow-sm",
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </aside>
        <section className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-900">{title}</h1>
            <p className="mt-2 text-slate-600">{description}</p>
          </div>
          {children}
        </section>
      </div>
    </Container>
  );
}

