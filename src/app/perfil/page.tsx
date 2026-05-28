import { requireUser } from "@/lib/auth";
import { AccountShell } from "@/components/account-shell";
import { ProfileCpfForm } from "@/components/forms/profile-cpf-form";

export default async function ProfilePage() {
  const user = await requireUser();

  return (
    <AccountShell currentPath="/perfil" title="Perfil" description="Dados básicos do usuário e ponto central para futuras configurações de conta.">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[28px] border border-white/80 bg-white/90 p-6 shadow-sm">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-sm text-slate-500">Nome</p>
              <p className="text-lg font-semibold text-slate-900">{user.name}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">E-mail</p>
              <p className="text-lg font-semibold text-slate-900">{user.email}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Perfil</p>
              <p className="text-lg font-semibold text-slate-900">{user.role}</p>
            </div>
            <div>
              <p className="text-sm text-slate-500">Status</p>
              <p className="text-lg font-semibold text-slate-900">{user.isActive ? "Ativo" : "Inativo"}</p>
            </div>
          </div>
        </div>

        <ProfileCpfForm initialCpf={user.cpf ?? null} />
      </div>
    </AccountShell>
  );
}

