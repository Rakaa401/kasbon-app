"use client";

import { useState } from "react";

type Transaction = {
  id: number;
  name: string;
  type: "Piutang" | "Hutang";
  amount: number;
  status: "Belum Lunas" | "Lunas";
};

const formatRupiah = (amount: number) =>
  `Rp ${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(amount)}`;

export default function TransactionManager() {
  const [transactions, setTransactions] = useState<Transaction[]>([
    {
      id: 1,
      name: "Andi",
      type: "Piutang",
      amount: 150000,
      status: "Belum Lunas",
    },
    {
      id: 2,
      name: "Budi",
      type: "Hutang",
      amount: 75000,
      status: "Belum Lunas",
    },
    {
      id: 3,
      name: "Citra",
      type: "Piutang",
      amount: 200000,
      status: "Lunas",
    },
  ]);

  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [type, setType] = useState<"Piutang" | "Hutang">("Piutang");
  const [amount, setAmount] = useState("");

  const totalPiutang = transactions
    .filter((item) => item.type === "Piutang" && item.status !== "Lunas")
    .reduce((total, item) => total + item.amount, 0);

  const totalHutang = transactions
    .filter((item) => item.type === "Hutang" && item.status !== "Lunas")
    .reduce((total, item) => total + item.amount, 0);

  const belumLunas = transactions.filter(
    (item) => item.status !== "Lunas",
  ).length;

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const parsedAmount = Number(amount);

    if (!name.trim() || !parsedAmount || parsedAmount <= 0) {
      return;
    }

    setTransactions((current) => [
      ...current,
      {
        id: Date.now(),
        name: name.trim(),
        type,
        amount: parsedAmount,
        status: "Belum Lunas",
      },
    ]);

    setName("");
    setType("Piutang");
    setAmount("");
    setIsOpen(false);
  };

  const markAsPaid = (id: number) => {
    setTransactions((current) =>
      current.map((transaction) =>
        transaction.id === id
          ? { ...transaction, status: "Lunas" }
          : transaction,
      ),
    );
  };

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Kasbon
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Kelola catatan hutang dan piutang dengan mudah.
            </p>
          </div>

          <button
            onClick={() => setIsOpen(true)}
            className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800"
          >
            + Tambah Transaksi
          </button>
        </header>

        <section className="mb-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Total Piutang</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {formatRupiah(totalPiutang)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Uang yang harus diterima
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Total Hutang</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {formatRupiah(totalHutang)}
            </p>
            <p className="mt-1 text-xs text-zinc-400">
              Uang yang harus dibayar
            </p>
          </div>

          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm text-zinc-500">Belum Lunas</p>
            <p className="mt-2 text-2xl font-bold text-zinc-900">
              {belumLunas}
            </p>
            <p className="mt-1 text-xs text-zinc-400">Transaksi aktif</p>
          </div>
        </section>

        <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
          <div className="flex items-center justify-between border-b border-zinc-200 px-5 py-4">
            <div>
              <h2 className="font-semibold text-zinc-900">
                Daftar Transaksi
              </h2>
              <p className="mt-1 text-xs text-zinc-500">
                Semua catatan hutang dan piutang kamu.
              </p>
            </div>
          </div>

          <div className="divide-y divide-zinc-100">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="font-medium text-zinc-900">
                      {transaction.name}
                    </h3>

                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        transaction.type === "Piutang"
                          ? "bg-blue-50 text-blue-700"
                          : "bg-orange-50 text-orange-700"
                      }`}
                    >
                      {transaction.type}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-zinc-500">
                    {transaction.status}
                  </p>
                </div>

                <div className="flex items-center gap-4">
                  <p className="font-semibold text-zinc-900">
                    {formatRupiah(transaction.amount)}
                  </p>

                  {transaction.status !== "Lunas" && (
                    <button
                      onClick={() => markAsPaid(transaction.id)}
                      className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50"
                    >
                      Tandai Lunas
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
            <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-zinc-900">
                    Tambah Transaksi
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500">
                    Masukkan detail hutang atau piutang.
                  </p>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  className="text-xl text-zinc-400 hover:text-zinc-700"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Nama
                  </label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Contoh: Andi"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Tipe
                  </label>
                  <select
                    value={type}
                    onChange={(event) =>
                      setType(event.target.value as "Piutang" | "Hutang")
                    }
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                  >
                    <option value="Piutang">Piutang</option>
                    <option value="Hutang">Hutang</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-zinc-700">
                    Nominal
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={amount}
                    onChange={(event) => setAmount(event.target.value)}
                    placeholder="150000"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2.5 text-sm outline-none focus:border-zinc-500"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="flex-1 rounded-lg border border-zinc-200 px-4 py-2.5 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                  >
                    Batal
                  </button>

                  <button
                    type="submit"
                    className="flex-1 rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                  >
                    Simpan
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}