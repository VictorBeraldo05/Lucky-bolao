import Link from "next/link";
import {
  Banknote,
  Bell,
  FileCheck2,
  Gamepad2,
  Headset,
  LayoutDashboard,
  MoreHorizontal,
  ReceiptText,
  User2,
} from "lucide-react";
import { Container } from "@/components/container";
import { SUPPORT_WHATSAPP_URL } from "@/lib/support";
import { cn } from "@/lib/utils";

const links = [
  { href: "/minha-conta", label: "Minha conta", icon: LayoutDashboard },
  { href: "/meus-jogos", label: "Meus jogos", icon: Gamepad2 },
  { href: "/carteira", label: "Carteira", icon: Banknote },
  { href: "/extrato", label: "Extrato", icon: ReceiptText },
  { href: "/perfil", label: "Perfil", icon: User2 },
  { href: "/notificacoes", label: "Notificações", icon: Bell },
  { href: "/comprovantes", label: "Comprovantes", icon: FileCheck2 },
  { href: "/resgates", label: "Resgates", icon: Banknote },
  { href: SUPPORT_WHATSAPP_URL, label: "Suporte", icon: Headset, external: true },
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
  const showAccountNavigation = links.some((link) => link.href === currentPath);
  const primaryMobileLinks = links.slice(0, 4);
  const secondaryMobileLinks = links.slice(4);

  return (
    <Container className="overflow-x-hidden py-6 md:py-10">
      <div className={cn("grid gap-8", showAccountNavigation && "lg:grid-cols-[280px_minmax(0,1fr)]")}>
        {showAccountNavigation ? (
          <aside className="hidden rounded-[28px] border border-white/80 bg-white/90 p-4 shadow-sm lg:block">
            <p className="px-3 pb-3 text-sm font-semibold uppercase tracking-[0.25em] text-fuchsia-500">Área logada</p>
            <nav className="space-y-1">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    target={link.external ? "_blank" : undefined}
                    rel={link.external ? "noreferrer" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-fuchsia-50 hover:text-fuchsia-700",
                      currentPath === link.href && "bg-fuchsia-50 text-fuchsia-700",
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {link.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        ) : null}

        <section className="min-w-0 space-y-5 overflow-x-hidden md:space-y-6">
          <div className="min-w-0">
            <h1 className="text-[2.15rem] font-bold leading-[1.05] tracking-tight text-slate-900 md:text-3xl">
              {title}
            </h1>
            <p className="mt-2 max-w-full text-slate-600">{description}</p>
          </div>

          {showAccountNavigation ? (
            <div className="space-y-3 lg:hidden">
              <div className="-mx-1 flex max-w-full gap-2 overflow-x-auto px-1 pb-1">
                {primaryMobileLinks.map((link) => {
                  const Icon = link.icon;
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      className={cn(
                        "shrink-0 rounded-full border border-white/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-fuchsia-200 hover:text-fuchsia-700",
                        currentPath === link.href && "border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700",
                      )}
                    >
                      <span className="inline-flex items-center gap-2">
                        <Icon className="h-4 w-4 shrink-0" />
                        {link.label}
                      </span>
                    </Link>
                  );
                })}

                <details className="shrink-0">
                  <summary className="list-none rounded-full border border-white/80 bg-white px-4 py-2 text-sm font-medium text-slate-600 shadow-sm transition hover:border-fuchsia-200 hover:text-fuchsia-700">
                    <span className="inline-flex items-center gap-2">
                      <MoreHorizontal className="h-4 w-4 shrink-0" />
                      Mais
                    </span>
                  </summary>
                  <div className="mt-2 mr-1 min-w-56 max-w-[calc(100vw-2rem)] rounded-[24px] border border-white/80 bg-white p-2 shadow-xl">
                    {secondaryMobileLinks.map((link) => {
                      const Icon = link.icon;
                      return (
                        <Link
                          key={link.href}
                          href={link.href}
                          target={link.external ? "_blank" : undefined}
                          rel={link.external ? "noreferrer" : undefined}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium text-slate-600 transition hover:bg-fuchsia-50 hover:text-fuchsia-700",
                            currentPath === link.href && "bg-fuchsia-50 text-fuchsia-700",
                          )}
                        >
                          <Icon className="h-4 w-4 shrink-0" />
                          {link.label}
                        </Link>
                      );
                    })}
                  </div>
                </details>
              </div>
            </div>
          ) : null}

          {children}
        </section>
      </div>
    </Container>
  );
}
