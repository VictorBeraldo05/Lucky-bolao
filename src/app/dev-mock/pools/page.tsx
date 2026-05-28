"use client";

import { PoolTable } from "@/components/pool-table";

const mockPools = [
  {
    id: "mock-1",
    code: "LF-001",
    title: "Bolão rápido 1",
    description: "Mock: combinação pra testar UI",
    status: "OPEN",
    totalValue: 100,
    sharePrice: 2,
    totalShares: 50,
    availableShares: 20,
    relativeChance: "1 em 10",
    ticketImageUrl: null,
    ticketCode: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lottery: { id: "lot-1", slug: "lotofacil", name: "Lotofácil" },
    gameType: { id: "gt-1", name: "Padrão", slug: "padrao" },
    contest: { id: "c-1", contestNumber: 3103 },
    games: [
      { id: "g-1", title: "Jogo 1", numbers: [1, 2, 3, 4, 5] },
    ],
  },
  {
    id: "mock-2",
    code: "LF-002",
    title: "Bolão rápido 2",
    description: "Mock: opção econômica",
    status: "OPEN",
    totalValue: 200,
    sharePrice: 5,
    totalShares: 40,
    availableShares: 12,
    relativeChance: "1 em 5",
    ticketImageUrl: null,
    ticketCode: null,
    metadata: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    lottery: { id: "lot-1", slug: "lotofacil", name: "Lotofácil" },
    gameType: { id: "gt-1", name: "Padrão", slug: "padrao" },
    contest: { id: "c-2", contestNumber: 3103 },
    games: [
      { id: "g-2", title: "Jogo 1", numbers: [6, 7, 8, 9, 10] },
    ],
  },
];

export default function DevMockPoolsPage() {
  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold">Dev mock: pools</h2>
      <PoolTable pools={mockPools as any} />
    </div>
  );
}
