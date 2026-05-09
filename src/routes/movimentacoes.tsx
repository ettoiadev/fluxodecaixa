import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useCaixaHoje, useMovimentacoes } from "@/hooks/useCaixa";
import { formatBRL } from "@/lib/format";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { MovimentacoesList } from "@/components/MovimentacoesList";

export const Route = createFileRoute("/movimentacoes")({
  head: () => ({
    meta: [
      { title: "Movimentações do Dia · Controle de Caixa" },
      { name: "description", content: "Registre entradas e saídas em PIX, cartão e dinheiro do caixa do dia." },
    ],
  }),
  component: MovimentacoesPage,
});

function MovimentacoesPage() {
  const { data: caixa } = useCaixaHoje();
  const { data: movs = [] } = useMovimentacoes(caixa?.id);
  const [openMov, setOpenMov] = useState(false);

  if (!caixa) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          Nenhum caixa aberto. <Link className="text-primary underline" to="/">Voltar ao dashboard</Link>
        </CardContent>
      </Card>
    );
  }

  const fechado = caixa.status !== "aberto";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Movimentações do Dia</h1>
          <p className="text-sm text-muted-foreground">
            Abertura: {formatBRL(caixa.valor_abertura)} · {fechado ? "Caixa fechado" : "Caixa aberto"}
          </p>
        </div>
        {!fechado && (
          <Button onClick={() => setOpenMov(true)}>
            <Plus className="mr-2 h-4 w-4" /> Nova Movimentação
          </Button>
        )}
      </div>

      <MovimentacoesList
        movs={movs}
        valorAbertura={Number(caixa.valor_abertura) || 0}
        fechado={fechado}
      />

      {!fechado && (
        <MovimentacaoDialog open={openMov} onOpenChange={setOpenMov} caixaId={caixa.id} />
      )}
    </div>
  );
}
