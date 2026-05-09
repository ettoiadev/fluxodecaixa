import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import CurrencyInput from "@/components/CurrencyInput";
import { supabase } from "@/integrations/supabase/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { todayISO } from "@/lib/format";

export function AbrirCaixaDialog({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [data, setData] = useState(todayISO());
  const [valor, setValor] = useState(0);
  const qc = useQueryClient();

  const mut = useMutation({
    mutationFn: async () => {
      const valor_abertura = valor;
      const { error } = await supabase.from("caixas").insert({
        data,
        valor_abertura,
        status: "aberto",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast.success("Caixa aberto com sucesso!");
      qc.invalidateQueries({ queryKey: ["caixa"] });
      onOpenChange(false);
      setValor(0);
    },
    onError: (e: any) => {
      if (e?.code === "23505") toast.error("Já existe um caixa para esta data.");
      else toast.error("Erro ao abrir caixa: " + (e?.message || "desconhecido"));
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Abrir Caixa do Dia</DialogTitle>
          <DialogDescription>Informe a data e o troco inicial em dinheiro.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="valor">Valor de Abertura (R$)</Label>
            <CurrencyInput 
              id="valor" 
              value={valor} 
              onChange={setValor} 
              placeholder="0,00" 
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
          <Button onClick={() => mut.mutate()} disabled={mut.isPending}>
            {mut.isPending ? "Abrindo..." : "Abrir Caixa"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
