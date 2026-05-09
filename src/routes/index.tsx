import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useCaixaHoje, useMovimentacoes } from "@/hooks/useCaixa";
import { computeTotais } from "@/lib/totals";
import { formatBRL, formatDateBR, todayISO } from "@/lib/format";
import { AbrirCaixaDialog } from "@/components/AbrirCaixaDialog";
import { MovimentacaoDialog } from "@/components/MovimentacaoDialog";
import { FecharCaixaDialog } from "@/components/FecharCaixaDialog";
import { MovimentacoesList } from "@/components/MovimentacoesList";
import { Banknote, CreditCard, Landmark, TrendingDown, Wallet, Plus, Lock, ArrowRight } from "lucide-react";

function Dashboard() {
  const { data: caixa, isLoading } = useCaixaHoje();
  const { data: movs = [] } = useMovimentacoes(caixa?.id);
  const [openAbrir, setOpenAbrir] = useState(false);
  const [openMov, setOpenMov] = useState(false);
  const [openFechar, setOpenFechar] = useState(false);

  const totals = useMemo(
    () => computeTotais(movs, Number(caixa?.valor_abertura) || 0),
    [movs, caixa?.valor_abertura],
  );

  const status = !caixa ? "Não aberto" : caixa.status === "aberto" ? "Aberto" : "Fechado";
  const statusColor =
    !caixa ? "bg-muted text-muted-foreground"
    : caixa.status === "aberto" ? "bg-[var(--success)] text-white"
    : "bg-muted text-muted-foreground";

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Caixa de hoje — {formatDateBR(todayISO())}
          </p>
        </div>
        <Badge className={statusColor + " px-3 py-1 text-sm"}>Status: {status}</Badge>
      </div>

      {isLoading ? (
        <p className="text-muted-foreground">Carregando...</p>
      ) : !caixa ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Wallet className="h-12 w-12 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum caixa aberto para hoje.</p>
            <Button size="lg" onClick={() => setOpenAbrir(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Abrir Caixa do Dia
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
            <Stat icon={Banknote} label="Entradas Dinheiro" value={formatBRL(totals.entradasDinheiro)} accent="text-[var(--success)]" />
            <Stat icon={CreditCard} label="Total Cartão" value={formatBRL(totals.cartao)} accent="text-[var(--info)]" />
            <Stat icon={Landmark} label="PIX" value={formatBRL(totals.pix)} accent="text-[var(--info)]" />
            <Stat icon={TrendingDown} label="Saídas" value={formatBRL(totals.saidasDinheiro)} accent="text-[var(--danger)]" />
            <Stat icon={Wallet} label="Saldo do Caixa" value={formatBRL(totals.saldoFinal)} accent="text-primary" highlight />
          </div>

          <div className="flex flex-wrap gap-3">
            {caixa.status === "aberto" ? (
              <>
                <Button onClick={() => setOpenMov(true)}>
                  <Plus className="mr-2 h-4 w-4" /> Registrar Movimentação
                </Button>
                <Button variant="secondary" asChild>
                  <Link to="/movimentacoes">Ver Movimentações <ArrowRight className="ml-2 h-4 w-4" /></Link>
                </Button>
                <Button variant="destructive" onClick={() => setOpenFechar(true)}>
                  <Lock className="mr-2 h-4 w-4" /> Fechar Caixa
                </Button>
              </>
            ) : (
              <Card className="w-full">
                <CardContent className="py-6 text-center text-muted-foreground">
                  Este caixa já foi fechado. Veja o registro no histórico.
                </CardContent>
              </Card>
            )}
            <Button variant="outline" asChild>
              <Link to="/historico">Histórico de Fechamentos</Link>
            </Button>
          </div>

          <MovimentacoesList
            movs={movs}
            valorAbertura={Number(caixa.valor_abertura) || 0}
            fechado={caixa.status !== "aberto"}
            showFooter={false}
          />
        </>
      )}

      <AbrirCaixaDialog open={openAbrir} onOpenChange={setOpenAbrir} />
      {caixa && (
        <>
          <MovimentacaoDialog open={openMov} onOpenChange={setOpenMov} caixaId={caixa.id} />
          <FecharCaixaDialog open={openFechar} onOpenChange={setOpenFechar} caixa={caixa} movimentacoes={movs} />
        </>
      )}
    </div>
  );
}

function Stat({
  icon: Icon, label, value, accent, highlight,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string; value: string; accent?: string; highlight?: boolean;
}) {
  return (
    <Card className={highlight ? "border-primary/40 shadow-md" : ""}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
          <Icon className={"h-4 w-4 " + (accent || "")} />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={"text-lg font-bold sm:text-xl " + (accent || "")}>{value}</div>
      </CardContent>
    </Card>
  );
}

export default Dashboard;
