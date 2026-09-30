import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DebtType = "owed_to_me" | "i_owe";

type DebtPayload = {
  type: DebtType;
  counterpart_name: string;
  amount: number;
  note?: string | null;
  due_date?: string | null;
};

function isDebtType(value: unknown): value is DebtType {
  return value === "owed_to_me" || value === "i_owe";
}

function isValidDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  return (
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day
  );
}

function validatePayload(body: unknown): {
  valid: boolean;
  data?: DebtPayload;
  error?: string;
} {
  if (!body || typeof body !== "object") {
    return {
      valid: false,
      error: "Data tidak valid.",
    };
  }

  const payload = body as Record<string, unknown>;

  if (!isDebtType(payload.type)) {
    return {
      valid: false,
      error: "Tipe utang tidak valid.",
    };
  }

  if (
    typeof payload.counterpart_name !== "string" ||
    payload.counterpart_name.trim().length === 0
  ) {
    return {
      valid: false,
      error: "Nama orang wajib diisi.",
    };
  }

  if (
    payload.counterpart_name.trim().length > 100
  ) {
    return {
      valid: false,
      error: "Nama orang maksimal 100 karakter.",
    };
  }

  if (
    typeof payload.amount !== "number" ||
    !Number.isInteger(payload.amount) ||
    payload.amount <= 0
  ) {
    return {
      valid: false,
      error: "Nominal harus berupa angka Rupiah yang lebih dari 0.",
    };
  }

  if (
    payload.note !== undefined &&
    payload.note !== null &&
    (typeof payload.note !== "string" || payload.note.length > 200)
  ) {
    return {
      valid: false,
      error: "Catatan maksimal 200 karakter.",
    };
  }

if (
  payload.due_date !== undefined &&
  payload.due_date !== null &&
  (typeof payload.due_date !== "string" ||
    !isValidDate(payload.due_date))
) {
  return {
    valid: false,
    error: "Tanggal tidak valid.",
  };
}

  return {
    valid: true,
    data: {
      type: payload.type,
      counterpart_name: payload.counterpart_name.trim(),
      amount: payload.amount,
      note:
        typeof payload.note === "string"
          ? payload.note.trim() || null
          : null,
      due_date:
        typeof payload.due_date === "string"
          ? payload.due_date || null
          : null,
    },
  };
}

export async function GET(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json(
      { error: "Kamu harus login terlebih dahulu." },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const status = searchParams.get("status");
  const type = searchParams.get("type");

  let query = supabase
    .from("debts")
    .select("*")
    .eq("user_id", authData.user.id)
    .order("created_at", { ascending: false });

  if (status === "unpaid") {
    query = query.is("settled_at", null);
  }

  if (status === "settled") {
    query = query.not("settled_at", "is", null);
  }

  if (type === "owed_to_me" || type === "i_owe") {
    query = query.eq("type", type);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      { error: "Gagal mengambil data utang." },
      { status: 500 },
    );
  }

  return NextResponse.json({ data });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json(
      { error: "Kamu harus login terlebih dahulu." },
      { status: 401 },
    );
  }

  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Format data tidak valid." },
      { status: 400 },
    );
  }

  const validation = validatePayload(body);

  if (!validation.valid || !validation.data) {
    return NextResponse.json(
      { error: validation.error },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("debts")
    .insert({
      user_id: authData.user.id,
      ...validation.data,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Gagal menyimpan data utang." },
      { status: 500 },
    );
  }

  return NextResponse.json({ data }, { status: 201 });
}