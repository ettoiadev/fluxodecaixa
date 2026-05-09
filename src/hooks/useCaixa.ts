import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { todayISO } from "@/lib/format";
import type { Movimentacao } from "@/lib/totals";

export type Caixa = {
  id: string;
  data: string;
  valor_abertura: number;
  status: string;
  deposito_final: number | null;
  observacao_fechamento: string | null;
  criado_em: string | null;
  fechado_em: string | null;
};

export function useCaixaHoje() {
  return useQuery({
    queryKey: ["caixa", "hoje"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("caixas")
        .select("*")
        .eq("data", todayISO())
        .maybeSingle();
      if (error) throw error;
      return (data as Caixa | null) ?? null;
    },
  });
}

export function useMovimentacoes(caixaId: string | null | undefined) {
  return useQuery({
    queryKey: ["movimentacoes", caixaId],
    enabled: !!caixaId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("movimentacoes")
        .select("*")
        .eq("caixa_id", caixaId!)
        .order("criado_em", { ascending: true });
      if (error) throw error;
      return (data ?? []) as Movimentacao[];
    },
  });
}
