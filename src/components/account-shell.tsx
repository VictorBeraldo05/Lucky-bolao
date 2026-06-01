import Link from "next/link";
import { Container } from "@/components/container";
import { cn } from "@/lib/utils";

const links = [
  { href: "/minha-conta", label: "Minha conta" },
  { href: "/meus-jogos", label: "Meus jogos" },
  { href: "/carteira", label: "Carteira" },
  { href: "/extrato", label: "Extrato" },
  { href: "/perfil", label: "Perfil" },
  { href: "/notificacoes", label: "Notificações" },
  { href: "/comprovantes", label: "Comprovantes" },
  { href: "/resgates", label: "Resgates" },
];

export function AccountShell({
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
        <aside className="rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-sm">
          <p className="px-3 pb-3 text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Área logada</p>
          <nav className="space-y-1">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-fuchsia-50 hover:text-fuchsia-700",
                  currentPath === link.href && "bg-fuchsia-50 text-fuchsia-700",
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
