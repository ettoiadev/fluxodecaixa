import { useMemo, useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CurrencyInput from "@/components/CurrencyInput";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatBRL } from "@/lib/format";
import { computeTotais, type Movimentacao } from "@/lib/totals";
import type { Caixa } from "@/hooks/useCaixa";
import { CheckCircle2, AlertTriangle } from "lucide-react";

export function FecharCaixaDialog({
  open, onOpenChange, caixa, movimentacoes,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  caixa: Caixa;
  movimentacoes: Movimentacao[];
}) {
  const totals = useMemo(
    () => computeTotais(movimentacoes, Number(caixa.valor_abertura) || 0),
    [movimentacoes, caixa.valor_abertura],
  );
  const [deposito, setDeposito] = useState(0);
  const [obs, setObs] = useState("");
  const qc = useQueryClient();

  const depositoNum = deposito;
  const bateu = Math.abs(depositoNum - totals.saldoFinal) < 0.01;

  const mut = useMutation({
    mutationFn: async () => {
      const { error: e1 } = await supabase.from("fechamentos").insert({
        caixa_id: caixa.id,
        data: caixa.data,
        valor_abertura: caixa.valor_abertura,
        total_entradas_dinheiro: totals.entradasDinheiro,
        total_saidas_dinheiro: totals.saidasDinheiro,
        total_cartao: totals.cartao,
        total_pix: totals.pix,
        
        total_geral_entradas: totals.totalEntradas,
        total_geral_saidas: totals.totalSaidas,
        saldo_final: totals.saldoFinal,
        deposito_final: depositoNum,
        caixa_bateu: bateu,
        observacao: obs || null,
      });
      if (e1) throw e1;

      const { error: e2 } = await supabase
        .from("caixas")
        .update({
          status: "fechado",
          deposito_final: depositoNum,
          observacao_fechamento: obs || null,
          fechado_em: new Date().toISOString(),
        })
        .eq("id", caixa.id);
      if (e2) throw e2;
    },
    onSuccess: () => {
      toast.success("Caixa fechado com sucesso!");
      qc.invalidateQueries({ queryKey: ["caixa"] });
      qc.invalidateQueries({ queryKey: ["fechamentos"] });
      onOpenChange(false);
    },
    onError: (e: any) => toast.error("Erro ao fechar: " + (e?.message || "")),
  });

  const Row = ({ label, value, color }: { label: string; value: string; color?: string }) => (
    <div className="flex items-center justify-between py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={"font-semibold " + (color || "")}>{value}</span>
    </div>
  );

  const Group = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="rounded-lg border bg-muted/30 p-3">
      <div className="mb-1 text-xs font-bold uppercase tracking-wide text-muted-foreground">{title}</div>
      <div className="divide-y">{children}</div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Fechar Caixa</DialogTitle>
          <DialogDescription>Confira o resumo do dia antes de confirmar.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Group title="🏦 PIX">
            <Row label="Total PIX" value={formatBRL(totals.pix)} color="text-[var(--info)]" />
          </Group>

          <Group title="💳 Cartão">
            <Row label="Total cartão" value={formatBRL(totals.cartao)} color="text-[var(--info)]" />
          </Group>

          <Group title="💵 Dinheiro">
            <Row label="Valor de abertura" value={formatBRL(caixa.valor_abertura)} />
            <Row label="Entradas em dinheiro" value={formatBRL(totals.entradasDinheiro)} color="text-[var(--success)]" />
            <Row label="Saídas em dinheiro" value={formatBRL(totals.saidasDinheiro)} color="text-[var(--danger)]" />
            <Row label="Saldo dinheiro" value={formatBRL(totals.saldoDinheiro)} />
          </Group>

          <Group title="📊 Totais Gerais">
            <Row label="Total geral entradas" value={formatBRL(totals.totalEntradas)} color="text-[var(--success)]" />
            <Row label="Total geral saídas" value={formatBRL(totals.totalSaidas)} color="text-[var(--danger)]" />
            <Row label="Saldo final (caixa físico)" value={formatBRL(totals.saldoFinal)} color="text-primary" />
          </Group>
        </div>

        <div className="space-y-3 pt-2">
          <div>
            <Label htmlFor="dep">Depósito Final do Dia (R$)</Label>
            <CurrencyInput id="dep" value={deposito} onChange={setDeposito} placeholder="0,00" />
          </div>
          <div>
            <Label htmlFor="obs">Observações</Label>
            <Textarea id="obs" value={obs} onChange={(e) => setObs(e.target.value)} rows={2} />
          </div>

          <div className={
            "rounded-md border p-3 text-sm font-medium " +
            (bateu
              ? "border-[var(--success)] bg-[var(--success)]/10 text-[var(--success)]"
              : "border-[var(--danger)] bg-[var(--danger)]/10 text-[var(--danger)]")
          }>
            <div className="flex items-center gap-2">
              {bateu ? <CheckCircle2 className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
              <span className="font-semibold">{bateu ? "Caixa Bateu" : "Caixa Não Bateu"}</span>
            </div>
            <div className="mt-2 grid grid-cols-3 gap-2 text-xs">
              <div>
                <div className="text-muted-foreground">Calculado</div>
                <div className="font-semibold">{formatBRL(totals.saldoFinal)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Físico</div>
                <div className="font-semibold">{formatBRL(depositoNum)}</div>
              </div>
              <div>
                <div className="text-muted-foreground">Diferença</div>
                <div className="font-semibold">{formatBRL(depositoNum - totals.saldoFinal)}</div>
              </div>
            </div>
            {!bateu && (
              <div className="mt-2 text-xs">
                ⚠️ O fechamento só pode ser confirmado quando o saldo físico for igual ao calculado.
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button
            onClick={() => {
              if (!bateu) {
                toast.error("Caixa não bateu — ajuste o depósito final para igualar ao saldo calculado.");
                return;
              }
              mut.mutate();
            }}
            disabled={mut.isPending || !bateu}
            className="bg-[var(--success)] text-white hover:bg-[var(--success)]/90 disabled:opacity-50"
          >
            {mut.isPending ? "Fechando..." : "Confirmar Fechamento"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
