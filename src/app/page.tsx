const transactions = [
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
];

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);

export default function Home() {
  const totalPiutang = transactions
    .filter((item) => item.type === "Piutang" && item.status !== "Lunas")
    .reduce((total, item) => total + item.amount, 0);

  const totalHutang = transactions
    .filter((item) => item.type === "Hutang" && item.status !== "Lunas")
    .reduce((total, item) => total + item.amount, 0);

  const belumLunas = transactions.filter(
    (item) => item.status !== "Lunas",
  ).length;

  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-6 py-10">
        {/* Header */}
        <header className="mb-10 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
              Kasbon
            </h1>
            <p className="mt-1 text-sm text-zinc-500">
              Kelola catatan hutang dan piutang dengan mudah.
            </p>
          </div>

          <button className="rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-zinc-800">
            + Tambah Transaksi
          </button>
        </header>

        {/* Summary */}
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
            <p className="mt-1 text-xs text-zinc-400">
              Transaksi aktif
            </p>
          </div>
        </section>

        {/* Transactions */}
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

                  <button className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-600 transition hover:bg-zinc-50">
                    Tandai Lunas
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}