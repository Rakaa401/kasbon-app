import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type DebtType = "owed_to_me" | "i_owe";

type DebtUpdatePayload = {
  type?: DebtType;
  counterpart_name?: string;
  amount?: number;
  note?: string | null;
  due_date?: string | null;
  settled?: boolean;
};

function isDebtType(value: unknown): value is DebtType {
  return value === "owed_to_me" || value === "i_owe";
}

function isValidDate(value: string) {
  return /^\d{4}-\d{2}-\d{2}$/.test(value);
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json(
      { error: "Kamu harus login terlebih dahulu." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "ID utang tidak valid." },
      { status: 400 },
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

  if (!body || typeof body !== "object") {
    return NextResponse.json(
      { error: "Data tidak valid." },
      { status: 400 },
    );
  }

  const payload = body as Record<string, unknown>;
  const updateData: DebtUpdatePayload = {};

  if (payload.type !== undefined) {
    if (!isDebtType(payload.type)) {
      return NextResponse.json(
        { error: "Tipe utang tidak valid." },
        { status: 400 },
      );
    }

    updateData.type = payload.type;
  }

  if (payload.counterpart_name !== undefined) {
    if (
      typeof payload.counterpart_name !== "string" ||
      payload.counterpart_name.trim().length === 0
    ) {
      return NextResponse.json(
        { error: "Nama orang wajib diisi." },
        { status: 400 },
      );
    }

    if (payload.counterpart_name.trim().length > 100) {
      return NextResponse.json(
        { error: "Nama orang maksimal 100 karakter." },
        { status: 400 },
      );
    }

    updateData.counterpart_name = payload.counterpart_name.trim();
  }

  if (payload.amount !== undefined) {
    if (
      typeof payload.amount !== "number" ||
      !Number.isInteger(payload.amount) ||
      payload.amount <= 0
    ) {
      return NextResponse.json(
        { error: "Nominal harus berupa angka Rupiah yang lebih dari 0." },
        { status: 400 },
      );
    }

    updateData.amount = payload.amount;
  }

  if (payload.note !== undefined) {
    if (
      payload.note !== null &&
      (typeof payload.note !== "string" || payload.note.length > 200)
    ) {
      return NextResponse.json(
        { error: "Catatan maksimal 200 karakter." },
        { status: 400 },
      );
    }

    updateData.note =
      typeof payload.note === "string"
        ? payload.note.trim() || null
        : null;
  }

  if (payload.due_date !== undefined) {
    if (
      payload.due_date !== null &&
      (typeof payload.due_date !== "string" ||
        !isValidDate(payload.due_date))
    ) {
      return NextResponse.json(
        { error: "Tanggal tidak valid." },
        { status: 400 },
      );
    }

    updateData.due_date =
      typeof payload.due_date === "string"
        ? payload.due_date
        : null;
  }

  if (payload.settled !== undefined) {
    if (typeof payload.settled !== "boolean") {
      return NextResponse.json(
        { error: "Status pelunasan tidak valid." },
        { status: 400 },
      );
    }

    updateData.settled = payload.settled;
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json(
      { error: "Tidak ada data yang diubah." },
      { status: 400 },
    );
  }

  const databaseUpdate: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };

  if (updateData.type !== undefined) {
    databaseUpdate.type = updateData.type;
  }

  if (updateData.counterpart_name !== undefined) {
    databaseUpdate.counterpart_name = updateData.counterpart_name;
  }

  if (updateData.amount !== undefined) {
    databaseUpdate.amount = updateData.amount;
  }

  if (updateData.note !== undefined) {
    databaseUpdate.note = updateData.note;
  }

  if (updateData.due_date !== undefined) {
    databaseUpdate.due_date = updateData.due_date;
  }

  if (updateData.settled !== undefined) {
    databaseUpdate.settled_at = updateData.settled
      ? new Date().toISOString()
      : null;
  }

  const { data, error } = await supabase
    .from("debts")
    .update(databaseUpdate)
    .eq("id", id)
    .eq("user_id", authData.user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json(
      { error: "Data utang tidak ditemukan atau gagal diperbarui." },
      { status: 404 },
    );
  }

  return NextResponse.json({ data });
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();

  if (!authData.user) {
    return NextResponse.json(
      { error: "Kamu harus login terlebih dahulu." },
      { status: 401 },
    );
  }

  const { id } = await context.params;

  if (!id) {
    return NextResponse.json(
      { error: "ID utang tidak valid." },
      { status: 400 },
    );
  }

  const { data, error } = await supabase
    .from("debts")
    .delete()
    .eq("id", id)
    .eq("user_id", authData.user.id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json(
      { error: "Data utang tidak ditemukan atau gagal dihapus." },
      { status: 404 },
    );
  }

  return NextResponse.json({
    message: "Data utang berhasil dihapus.",
  });
}