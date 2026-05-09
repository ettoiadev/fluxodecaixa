import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import CurrencyInput from "@/components/CurrencyInput";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type Tipo = "entrada" | "saida";
type Forma = "dinheiro" | "cartao" | "pix";

export function MovimentacaoDialog({
  open, onOpenChange, caixaId,
}: { open: boolean; onOpenChange: (v: boolean) => void; caixaId: string }) {
  const [tipo, setTipo] = useState<Tipo>("entrada");
  const [forma, setForma] = useState<Forma>("pix");
  const [numeroPedido, setNumeroPedido] = useState("");
  const [maquineta, setMaquineta] = useState("");
  const [banco, setBanco] = useState("Mercado Pago");
  const [valor, setValor] = useState(0);
  const [descricao, setDescricao] = useState("");
  const qc = useQueryClient();

  const reset = () => {
    setTipo("entrada"); setForma("pix"); setNumeroPedido("");
    setMaquineta(""); setBanco("Mercado Pago"); setValor(0); setDescricao("");
  };

  const mut = useMutation({
    mutationFn: async () => {
      const v = valor;
      if (!v || v <= 0) throw new Error("Informe um valor válido.");
      if (tipo === "entrada" && !numeroPedido.trim()) throw new Error("Informe o Nº do Pedido.");
      const { error } = await supabase.from("movimentacoes").insert({
        caixa_id: caixaId,
        tipo, forma_pagamento: forma,
        numero_pedido: tipo === "entrada" ? (numeroPedido || null) : null,
        maquineta: forma === "cartao" ? maquineta || null : null,
        banco: forma === "pix" ? banco || null : null,
        valor: v,
        descricao: descricao || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Movimentação registrada com sucesso!");
      qc.invalidateQueries({ queryKey: ["movimentacoes"] });
      reset();
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao registrar"),
  });

  const tipoBtn = (t: Tipo, label: string, color: string) => (
    <button
      type="button"
      onClick={() => {
        setTipo(t);
        if (t === "saida") setNumeroPedido("");
      }}
      className={cn(
        "flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        tipo === t ? `${color} text-white border-transparent` : "bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  const formaBtn = (f: Forma, label: string) => (
    <button
      type="button"
      onClick={() => setForma(f)}
      className={cn(
        "rounded-md border px-3 py-2 text-sm font-medium transition-colors",
        forma === f ? "bg-primary text-primary-foreground border-transparent" : "bg-background hover:bg-muted",
      )}
    >
      {label}
    </button>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Registrar Movimentação</DialogTitle>
          <DialogDescription>Preencha os dados da movimentação do caixa.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="mb-2 block">Tipo</Label>
            <div className="flex gap-2">
              {tipoBtn("entrada", "Entrada", "bg-[var(--success)]")}
              {tipoBtn("saida", "Saída", "bg-[var(--danger)]")}
            </div>
          </div>

          <div>
            <Label className="mb-2 block">Forma de Pagamento</Label>
            <div className="grid grid-cols-3 gap-2">
              {formaBtn("pix", "PIX")}
              {formaBtn("cartao", "Cartão")}
              {formaBtn("dinheiro", "Dinheiro")}
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {tipo === "entrada" ? (
              <div>
                <Label htmlFor="ped">Nº do Pedido</Label>
                <Input id="ped" value={numeroPedido} onChange={(e) => setNumeroPedido(e.target.value)} placeholder="Ex: 485" />
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
            <div>
              <Label htmlFor="val">Valor (R$)</Label>
              <CurrencyInput 
                id="val" 
                value={valor} 
                onChange={setValor} 
                placeholder="0,00" 
              />
            </div>
          </div>

          {forma === "cartao" && (
            <div>
              <Label htmlFor="maq">Maquineta</Label>
              <Input id="maq" value={maquineta} onChange={(e) => setMaquineta(e.target.value)} placeholder="INF, CIELO..." />
            </div>
          )}
          {forma === "pix" && (
            <div>
              <Label htmlFor="bco">Banco</Label>
              <Input id="bco" value={banco} onChange={(e) => setBanco(e.target.value)} placeholder="PIX, Itaú..." />
            </div>
          )}

          <div>
            <Label htmlFor="desc">Descrição (opcional)</Label>
            <Textarea id="desc" value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Salvando..." : "Salvar Movimentação"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
