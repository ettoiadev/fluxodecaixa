import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";
import { computeTotais, type Movimentacao } from "@/lib/totals";
import { formatBRL } from "@/lib/format";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

type Props = {
  movs: Movimentacao[];
  valorAbertura: number;
  fechado: boolean;
  showFooter?: boolean;
};

export function MovimentacoesList({ movs, valorAbertura, fechado, showFooter = true }: Props) {
  const [toDelete, setToDelete] = useState<string | null>(null);
  const qc = useQueryClient();

  const totals = useMemo(() => computeTotais(movs, valorAbertura), [movs, valorAbertura]);

  const dinheiro = movs.filter((m) => m.forma_pagamento === "dinheiro");
  const cartao = movs.filter((m) => m.forma_pagamento === "cartao");
  const pixList = movs.filter((m) => m.forma_pagamento === "pix");

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("movimentacoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimentação excluída");
      qc.invalidateQueries({ queryKey: ["movimentacoes"] });
    },
    onError: (e: any) => toast.error("Erro ao excluir: " + (e?.message || "")),
  });

  return (
    <div className="space-y-4">
      <Section title="🏦 PIX" subtotal={totals.pix}>
        <RegRows rows={pixList} field="banco" header="Banco" onDelete={(id) => setToDelete(id)} fechado={fechado} />
      </Section>

      <Section title="💳 Cartão" subtotal={totals.cartao}>
        <RegRows rows={cartao} field="maquineta" header="Maquineta" onDelete={(id) => setToDelete(id)} fechado={fechado} />
      </Section>

      <Section title="💵 Dinheiro" subtotal={totals.entradasDinheiro - totals.saidasDinheiro}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nº Pedido</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead className="text-right">Valor</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {dinheiro.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum registro</TableCell></TableRow>
            ) : dinheiro.map((m) => (
              <TableRow key={m.id}>
                <TableCell>{m.numero_pedido || "—"}</TableCell>
                <TableCell>
                  <span className={
                    "rounded-full px-2 py-0.5 text-xs font-semibold " +
                    (m.tipo === "entrada" ? "bg-[var(--success)]/15 text-[var(--success)]" : "bg-[var(--danger)]/15 text-[var(--danger)]")
                  }>
                    {m.tipo === "entrada" ? "Entrada" : "Saída"}
                  </span>
                </TableCell>
                <TableCell className={"text-right font-medium " + (m.tipo === "entrada" ? "text-[var(--success)]" : "text-[var(--danger)]")}>
                  {m.tipo === "saida" ? "- " : ""}{formatBRL(m.valor)}
                </TableCell>
                <DelCell disabled={fechado} onClick={() => setToDelete(m.id)} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Section>

      {showFooter && (
        <Card className="border-primary/30">
          <CardContent className="grid grid-cols-2 gap-3 py-4 sm:grid-cols-4">
            <Foot label="Entradas" value={formatBRL(totals.totalEntradas)} cls="text-[var(--success)]" />
            <Foot label="Saídas" value={formatBRL(totals.totalSaidas)} cls="text-[var(--danger)]" />
            <Foot label="Saldo Dinheiro" value={formatBRL(totals.saldoDinheiro)} />
            <Foot label="Saldo Final" value={formatBRL(totals.saldoFinal)} cls="text-primary font-bold" />
          </CardContent>
        </Card>
      )}

      <AlertDialog open={!!toDelete} onOpenChange={(v) => !v && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir movimentação?</AlertDialogTitle>
            <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (toDelete) { delMut.mutate(toDelete); setToDelete(null); } }}
            >Excluir</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function Section({ title, subtotal, children }: { title: string; subtotal: number; children: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
        <span className="text-sm font-semibold">Subtotal: {formatBRL(subtotal)}</span>
      </CardHeader>
      <CardContent className="overflow-x-auto">{children}</CardContent>
    </Card>
  );
}

function DelCell({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <TableCell>
      <Button size="icon" variant="ghost" onClick={onClick} disabled={disabled} aria-label="Excluir">
        <Trash2 className="h-4 w-4 text-[var(--danger)]" />
      </Button>
    </TableCell>
  );
}

function RegRows({
  rows, field, header, onDelete, fechado,
}: {
  rows: Movimentacao[]; field: "maquineta" | "banco"; header: string;
  onDelete: (id: string) => void; fechado: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nº Pedido</TableHead>
          <TableHead>{header}</TableHead>
          <TableHead className="text-right">Valor</TableHead>
          <TableHead className="w-12"></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground">Nenhum registro</TableCell></TableRow>
        ) : rows.map((m) => (
          <TableRow key={m.id}>
            <TableCell>{m.numero_pedido || "—"}</TableCell>
            <TableCell>{m[field] || "—"}</TableCell>
            <TableCell className={"text-right font-medium " + (m.tipo === "saida" ? "text-[var(--danger)]" : "")}>
              {m.tipo === "saida" ? "- " : ""}{formatBRL(m.valor)}
            </TableCell>
            <DelCell disabled={fechado} onClick={() => onDelete(m.id)} />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function Foot({ label, value, cls }: { label: string; value: string; cls?: string }) {
  return (
    <div>
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className={"text-base font-semibold " + (cls || "")}>{value}</div>
    </div>
  );
}
