import TransactionManager from "./components/transaction-manager";
import { createClient } from "@/lib/supabase/server";

export default async function Home() {
  const supabase = await createClient();

  const { data: debts } = await supabase
    .from("debts")
    .select("*")
    .order("created_at", { ascending: false });

  return <TransactionManager initialDebts={debts ?? []} />;
}