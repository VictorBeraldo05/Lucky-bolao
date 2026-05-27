import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { AdminShell } from "@/components/admin-shell";
import { AdminCreditForm } from "@/components/forms/admin-credit-form";
import { formatCurrency } from "@/lib/utils";

export default async function AdminUsersPage() {
  await requireAdmin();
  const users = await prisma.user.findMany({ include: { wallet: true }, orderBy: { createdAt: "desc" } });

  return (
    <AdminShell currentPath="/admin/usuarios" title="Gestão de usuários" description="Cadastro, papéis, saldo e apoio operacional ao atendimento.">
      <AdminCreditForm users={users.map((user) => ({ id: user.id, name: user.name, email: user.email }))} />
      <div className="overflow-hidden rounded-[28px] border border-white/80 bg-white/90 shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-fuchsia-50 text-slate-600">
              <tr>
                <th className="px-4 py-3">Nome</th>
                <th className="px-4 py-3">E-mail</th>
                <th className="px-4 py-3">Perfil</th>
                <th className="px-4 py-3">Saldo</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-fuchsia-50">
                  <td className="px-4 py-3">{user.name}</td>
                  <td className="px-4 py-3">{user.email}</td>
                  <td className="px-4 py-3">{user.role}</td>
                  <td className="px-4 py-3">{formatCurrency(user.wallet?.balance ?? 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </AdminShell>
  );
}

