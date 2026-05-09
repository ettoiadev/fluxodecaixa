
create table public.caixas (
  id uuid primary key default gen_random_uuid(),
  data date not null unique,
  valor_abertura numeric(10,2) not null default 0,
  status text not null default 'aberto',
  deposito_final numeric(10,2) default 0,
  observacao_fechamento text,
  criado_em timestamptz default now(),
  fechado_em timestamptz
);

create table public.movimentacoes (
  id uuid primary key default gen_random_uuid(),
  caixa_id uuid references public.caixas(id) on delete cascade,
  tipo text not null,
  forma_pagamento text not null,
  numero_pedido text,
  maquineta text,
  banco text,
  valor numeric(10,2) not null,
  descricao text,
  criado_em timestamptz default now()
);

create table public.fechamentos (
  id uuid primary key default gen_random_uuid(),
  caixa_id uuid references public.caixas(id),
  data date not null,
  valor_abertura numeric(10,2),
  total_entradas_dinheiro numeric(10,2),
  total_saidas_dinheiro numeric(10,2),
  total_cartao numeric(10,2),
  total_pix numeric(10,2),
  total_transferencia numeric(10,2),
  total_geral_entradas numeric(10,2),
  total_geral_saidas numeric(10,2),
  saldo_final numeric(10,2),
  deposito_final numeric(10,2),
  caixa_bateu boolean,
  observacao text,
  fechado_em timestamptz default now()
);

alter table public.caixas enable row level security;
alter table public.movimentacoes enable row level security;
alter table public.fechamentos enable row level security;

create policy "Public access caixas" on public.caixas for all using (true) with check (true);
create policy "Public access movimentacoes" on public.movimentacoes for all using (true) with check (true);
create policy "Public access fechamentos" on public.fechamentos for all using (true) with check (true);
