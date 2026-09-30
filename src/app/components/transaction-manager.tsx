"use client";

import {
  FormEvent,
  useMemo,
  useState,
} from "react";

import {
  ArrowDownLeft,
  ArrowUpRight,
  Check,
  Pencil,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";

import LogoutButton from "./logout-button";

type DebtType = "owed_to_me" | "i_owe";

type Debt = {
  id: string;
  type: DebtType;
  counterpart_name: string;
  amount: number;
  note: string | null;
  due_date: string | null;
  settled_at: string | null;
  created_at: string;
  updated_at: string;
};

type FormData = {
  type: DebtType;
  counterpart_name: string;
  amount: string;
  due_date: string;
  note: string;
};

const formatRupiah = (amount: number) =>
  `Rp ${new Intl.NumberFormat("id-ID", {
    maximumFractionDigits: 0,
  }).format(amount)}`;

function formatRelativeDate(date: string) {
  const target = new Date(`${date}T00:00:00`);
  const now = new Date();
  const today = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
  );
  const diff = today.getTime() - target.getTime();
  const days = Math.floor(diff / 86400000);

  if (days <= 0) return "hari ini";
  if (days === 1) return "kemarin";
  if (days < 7) return `${days} hari lalu`;
  if (days < 30) return `${Math.floor(days / 7)} minggu lalu`;
  if (days < 365) return `${Math.floor(days / 30)} bulan lalu`;

  return `${Math.floor(days / 365)} tahun lalu`;
}

function getToday() {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

const initialForm: FormData = {
  type: "owed_to_me",
  counterpart_name: "",
  amount: "",
  due_date: getToday(),
  note: "",
};

export default function TransactionManager({
  initialDebts,
}: {
  initialDebts: Debt[];
}) {
  const [debts, setDebts] = useState<Debt[]>(initialDebts);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormData>(initialForm);

  async function fetchDebts() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/debts");

      const result: { data?: Debt[]; error?: string } =
        await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal mengambil data.");
      }

      setDebts(result.data ?? []);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengambil data.",
      );
    } finally {
      setLoading(false);
    }
  }

  const summary = useMemo(() => {
    const owedToMe = debts
      .filter((debt) => debt.type === "owed_to_me" && !debt.settled_at)
      .reduce((total, debt) => total + debt.amount, 0);

    const iOwe = debts
      .filter((debt) => debt.type === "i_owe" && !debt.settled_at)
      .reduce((total, debt) => total + debt.amount, 0);

    return {
      owedToMe,
      iOwe,
      net: owedToMe - iOwe,
    };
  }, [debts]);

  const filteredDebts = useMemo(() => {
    const query = search.trim().toLowerCase();

    return debts.filter((debt) => {
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "unpaid" && !debt.settled_at) ||
        (statusFilter === "settled" && Boolean(debt.settled_at));

      const matchesType =
        typeFilter === "all" || debt.type === typeFilter;

      const matchesSearch =
        !query ||
        debt.counterpart_name.toLowerCase().includes(query);

      return matchesStatus && matchesType && matchesSearch;
    });
  }, [debts, statusFilter, typeFilter, search]);

  function openCreateModal() {
    setEditingId(null);
    setForm({
      ...initialForm,
      due_date: getToday(),
    });
    setModalOpen(true);
  }

  function openEditModal(debt: Debt) {
    setEditingId(debt.id);
    setForm({
      type: debt.type,
      counterpart_name: debt.counterpart_name,
      amount: String(debt.amount),
      due_date: debt.due_date ?? "",
      note: debt.note ?? "",
    });
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setEditingId(null);
    setForm({
      ...initialForm,
      due_date: getToday(),
    });
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    const amount = Number(form.amount);

    if (!form.counterpart_name.trim()) {
      setError("Nama orang wajib diisi.");
      setSubmitting(false);
      return;
    }

    if (!Number.isInteger(amount) || amount <= 0) {
      setError("Nominal harus lebih dari 0.");
      setSubmitting(false);
      return;
    }

    if (form.note.length > 200) {
      setError("Catatan maksimal 200 karakter.");
      setSubmitting(false);
      return;
    }

    if (!form.due_date) {
      setError("Tanggal wajib diisi.");
      setSubmitting(false);
      return;
    }

    const payload = {
      type: form.type,
      counterpart_name: form.counterpart_name.trim(),
      amount,
      due_date: form.due_date,
      note: form.note.trim() || null,
    };

    try {
      const response = await fetch(
        editingId ? `/api/debts/${editingId}` : "/api/debts",
        {
          method: editingId ? "PATCH" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      );

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menyimpan data.");
      }

      closeModal();
      await fetchDebts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menyimpan data.",
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSettle(debt: Debt) {
    setError("");

    try {
      const response = await fetch(`/api/debts/${debt.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          settled: !debt.settled_at,
        }),
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal mengubah status.");
      }

      await fetchDebts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal mengubah status.",
      );
    }
  }

  async function handleDelete(id: string) {
    const confirmed = window.confirm(
      "Yakin ingin menghapus catatan ini?",
    );

    if (!confirmed) return;

    setError("");

    try {
      const response = await fetch(`/api/debts/${id}`, {
        method: "DELETE",
      });

      const result: { error?: string } = await response.json();

      if (!response.ok) {
        throw new Error(result.error ?? "Gagal menghapus data.");
      }

      await fetchDebts();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Gagal menghapus data.",
      );
    }
  }
  
  return (
    <main className="min-h-screen bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <header className="mb-8 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-medium text-zinc-500">Kasbon</p>
            <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
              Catatan utang piutang
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <LogoutButton />

            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            >
              <Plus size={18} />
              Catat baru
            </button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
              <ArrowDownLeft size={18} />
              Total dihutang ke saya
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {formatRupiah(summary.owedToMe)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2 text-sm text-zinc-500">
              <ArrowUpRight size={18} />
              Total saya hutang
            </div>
            <p className="text-2xl font-bold text-zinc-900">
              {formatRupiah(summary.iOwe)}
            </p>
          </div>

          <div className="rounded-2xl border border-zinc-200 bg-white p-5">
            <p className="mb-3 text-sm text-zinc-500">Net</p>
            <p
              className={`text-2xl font-bold ${
                summary.net >= 0 ? "text-emerald-600" : "text-red-600"
              }`}
            >
              {formatRupiah(summary.net)}
            </p>
          </div>
        </section>

        <section className="mt-8 rounded-2xl border border-zinc-200 bg-white">
          <div className="flex flex-col gap-3 border-b border-zinc-200 p-4 md:flex-row">
            <div className="relative flex-1">
              <Search
                size={18}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              />
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Cari nama..."
                className="w-full rounded-xl border border-zinc-200 py-2.5 pl-10 pr-4 text-sm outline-none focus:border-zinc-900"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(event) => setStatusFilter(event.target.value)}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none"
            >
              <option value="all">Semua status</option>
              <option value="unpaid">Belum lunas</option>
              <option value="settled">Lunas</option>
            </select>

            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-xl border border-zinc-200 px-4 py-2.5 text-sm outline-none"
            >
              <option value="all">Semua tipe</option>
              <option value="owed_to_me">Dihutang</option>
              <option value="i_owe">Saya hutang</option>
            </select>
          </div>

          {error && (
            <div className="m-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {loading ? (
            <div className="p-10 text-center text-sm text-zinc-500">
              Memuat data...
            </div>
          ) : filteredDebts.length === 0 ? (
            <div className="p-10 text-center">
              <p className="font-medium text-zinc-900">Belum ada catatan</p>
              <p className="mt-1 text-sm text-zinc-500">
                Tambahkan catatan utang atau piutang pertama kamu.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-100">
              {filteredDebts.map((debt) => (
                <div
                  key={debt.id}
                  className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex min-w-0 items-center gap-3">
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
                        debt.type === "owed_to_me"
                          ? "bg-emerald-50 text-emerald-600"
                          : "bg-orange-50 text-orange-600"
                      }`}
                    >
                      {debt.type === "owed_to_me" ? (
                        <ArrowDownLeft size={18} />
                      ) : (
                        <ArrowUpRight size={18} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="truncate font-semibold text-zinc-900">
                        {debt.counterpart_name}
                      </p>
                      <p className="text-sm text-zinc-500">
                        {debt.type === "owed_to_me"
                          ? "Dihutang ke saya"
                          : "Saya hutang"}{" "}
                        · {formatRelativeDate(debt.created_at)}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 md:justify-end">
                    <div className="text-right">
                      <p className="font-semibold text-zinc-900">
                        {formatRupiah(debt.amount)}
                      </p>
                      <span
                        className={`text-xs font-medium ${
                          debt.settled_at
                            ? "text-emerald-600"
                            : "text-orange-600"
                        }`}
                      >
                        {debt.settled_at ? "Lunas" : "Belum lunas"}
                      </span>
                    </div>

                    {!debt.settled_at && (
                      <button
                        type="button"
                        onClick={() => handleSettle(debt)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-2 text-xs font-medium text-emerald-700 hover:bg-emerald-100"
                      >
                        <Check size={15} />
                        Tandai lunas
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => openEditModal(debt)}
                      className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900"
                      aria-label="Edit"
                    >
                      <Pencil size={17} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(debt.id)}
                      className="rounded-lg p-2 text-zinc-500 hover:bg-red-50 hover:text-red-600"
                      aria-label="Hapus"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-bold text-zinc-900">
                  {editingId ? "Edit catatan" : "Catat baru"}
                </h2>
                <p className="mt-1 text-sm text-zinc-500">
                  Isi detail utang atau piutang.
                </p>
              </div>

              <button
                type="button"
                onClick={closeModal}
                className="rounded-lg p-2 text-zinc-500 hover:bg-zinc-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <label
                  className={`cursor-pointer rounded-xl border p-4 ${
                    form.type === "owed_to_me"
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="owed_to_me"
                    checked={form.type === "owed_to_me"}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        type: "owed_to_me",
                      }))
                    }
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Saya dihutang</span>
                </label>

                <label
                  className={`cursor-pointer rounded-xl border p-4 ${
                    form.type === "i_owe"
                      ? "border-zinc-900 bg-zinc-50"
                      : "border-zinc-200"
                  }`}
                >
                  <input
                    type="radio"
                    name="type"
                    value="i_owe"
                    checked={form.type === "i_owe"}
                    onChange={() =>
                      setForm((current) => ({
                        ...current,
                        type: "i_owe",
                      }))
                    }
                    className="sr-only"
                  />
                  <span className="text-sm font-medium">Saya hutang</span>
                </label>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Nama orang
                </label>
                <input
                  value={form.counterpart_name}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      counterpart_name: event.target.value,
                    }))
                  }
                  required
                  maxLength={100}
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  placeholder="Contoh: Budi"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Nominal
                </label>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={form.amount}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      amount: event.target.value,
                    }))
                  }
                  required
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  placeholder="150000"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Tanggal
                </label>
                <input
                  type="date"
                  value={form.due_date}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      due_date: event.target.value,
                    }))
                  }
                  className="w-full rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-zinc-700">
                  Catatan
                </label>
                <textarea
                  value={form.note}
                  onChange={(event) =>
                    setForm((current) => ({
                      ...current,
                      note: event.target.value,
                    }))
                  }
                  maxLength={200}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900"
                  placeholder="Catatan tambahan (opsional)"
                />
              </div>

              {error && (
                <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">
                  {error}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={submitting}
                  className="rounded-xl border border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
                >
                  Batal
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {submitting
                    ? "Menyimpan..."
                    : editingId
                      ? "Simpan perubahan"
                      : "Simpan"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}
