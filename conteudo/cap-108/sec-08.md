Você montou servidor, subiu containers, automatizou tarefas — e agora tem várias coisas rodando 24/7 sem ninguém olhando. Monitoramento é o que transforma "acho que está tudo bem" em "sei que está, e sei desde quando". O padrão de fato do ecossistema Linux/cloud é a dupla Prometheus (coleta e armazena métricas) + Grafana (visualiza e alerta), e cabe com folga no Steam Deck — usados juntos no próprio home lab que ele hospeda.

:::objetivos
- Entender o modelo pull-based de coleta de métricas do Prometheus
- Instalar Prometheus, node_exporter e Grafana via containers
- Expor e consultar métricas do host com PromQL
- Construir dashboards no Grafana para temperatura, CPU e disco
- Criar regras de alerta que disparam quando algo sai do normal
:::

## O modelo que você precisa entender

O Prometheus funciona por **pull** (puxar), não por push. Em vez de cada serviço mandar suas métricas para um coletor central, o Prometheus visita periodicamente cada *endpoint* de métricas (o `/metrics` HTTP que cada exporter expõe) e coleta. Essa inversão tem uma consequência elegante: para adicionar um novo alvo, você só edita a config e aponta para ele — o alvo não precisa saber do Prometheus.

O **node_exporter** é o "exporter" mais importante para começar: ele expõe as métricas do próprio host (CPU, memória, disco, rede, temperatura do NVMe) em `/metrics`. É ele que transforma o Steam Deck num alvo monitorável.

O fluxo completo:

```
node_exporter (expõe /metrics)
        ▲
        │  pull a cada 15s
        │
   Prometheus (coleta + armazena em time series)
        ▲
        │  consulta (PromQL)
        │
     Grafana (dashboards + alertas)
```

## Subindo a pilha com Compose

A pilha inteira sobe com um `compose.yaml`, reaproveitando o que você aprendeu no capítulo de containers:

```yaml
services:
  prometheus:
    image: prom/prometheus:latest
    restart: unless-stopped
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
      - prom-data:/prometheus
    ports:
      - "9090:9090"

  node-exporter:
    image: prom/node-exporter:latest
    restart: unless-stopped
    command:
      - '--path.rootfs=/host'
    volumes:
      - /:/host:ro,rslave
    pid: host
    ports:
      - "9100:9100"

  grafana:
    image: grafana/grafana:latest
    restart: unless-stopped
    environment:
      - GF_SECURITY_ADMIN_PASSWORD=${GRAFANA_PASSWORD}
    volumes:
      - grafana-data:/var/lib/grafana
    ports:
      - "3000:3000"

volumes:
  prom-data:
  grafana-data:
```

Detalhe importante no `node-exporter`: para ele ler as métricas do sistema do **host** (e não do container), você monta a raiz do host em `/host` com `ro` (somente leitura) e `rslave`, e passa `--path.rootfs=/host` e `pid: host`. Sem isso, o exporter mostraria as métricas do container efêmero, não do Deck.

O `prometheus.yml` lista o alvo:

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'node'
    static_configs:
      - targets: ['node-exporter:9100']
```

O nome `node-exporter` resolve por DNS interno da rede do Podman — mais uma razão para usar Compose em vez de `podman run` solto.

```terminal
$ podman-compose up -d
...
$ curl -s localhost:9100/metrics | grep node_cpu_seconds_total
node_cpu_seconds_total{cpu="0",mode="idle"} 3.11457e+06
node_cpu_seconds_total{cpu="0",mode="system"} 81126.9
node_cpu_seconds_total{cpu="0",mode="user"} 1.40315e+06
node_cpu_seconds_total{cpu="0",mode="iowait"} 2044.18
```

## Consultando com PromQL

O PromQL (Prometheus Query Language) é a linguagem de consulta. Os quatro padrões que cobrem 90% dos casos:

**Uso de CPU** (média de 5 minutos, em %):

```promql
100 - (avg by (instance) (rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)
```

**Memória disponível** (em bytes):

```promql
node_memory_MemAvailable_bytes
```

**Espaço livre no disco raiz** (em %):

```promql
100 - (node_filesystem_avail_bytes{mountpoint="/"} / node_filesystem_size_bytes{mountpoint="/"} * 100)
```

**Temperatura do NVMe** (em Celsius):

```promql
node_hwmon_temp_celsius
```

O `rate()` calcula a taxa de mudança por segundo de um counter (métrica que só cresce, como segundos de CPU) — sem ele você estaria olhando um total acumulado sem sentido. A janela `[5m]` suaviza picos instantâneos.

```terminal
$ curl -s 'localhost:9090/api/v1/query' \
    --data-urlencode 'query=100 - (avg(rate(node_cpu_seconds_total{mode="idle"}[5m])) * 100)' \
  | python3 -m json.tool
{
    "status": "success",
    "data": {
        "resultType": "vector",
        "result": [
            {
                "metric": {},
                "value": [ 1737226800, "12.431" ]
            }
        ]
    }
}
```

O resultado: 12.4% de uso de CPU no host ao longo dos últimos 5 minutos. É esse valor — um número, com timestamp — que o Grafana vai desenhar.

:::dica
Teste seus PromQL direto no Prometheus antes de montar o dashboard: `http://localhost:9090` tem um editor de consultas com autocompletar. Se a query não retorna o que você espera lá, também não vai retornar no Grafana. Depure no lugar mais simples primeiro.
:::

## Dashboards no Grafana

O Grafana fica em `http://localhost:3000` (login padrão `admin` + a senha que você pôs em `${GRAFANA_PASSWORD}`). O fluxo para o primeiro dashboard:

1. **Aponte a fonte de dados** — *Connections → Data sources → Prometheus* e informe `http://prometheus:9090` (nome interno do container). Teste a conexão.
2. **Crie o dashboard** — *Dashboards → New → Add panel*.
3. **Cole uma query** — use uma das PromQL acima como ponto de partida.
4. **Escolha a visualização** — `Time series` (gráfico de linha) é o padrão; `Stat` mostra um número grande (ótimo para temperatura); `Gauge` desenha um velocímetro (ótimo para espaço em disco).

Um dashboard de "saúde do Deck" útil tem pelo menos quatro painéis: CPU (time series), memória disponível (stat), espaço em disco raiz (gauge com thresholds) e temperatura do NVMe (time series). Com thresholds no gauge de disco, você vê a cor mudar de verde para vermelho quando o espaço aperta.

:::nota
Existe um atalho enorme: o dashboard **Node Exporter Full** (ID 1860) da comunidade Grafana. Em *Dashboards → Import*, digite `1860` e selecione sua fonte Prometheus. Você ganha dezenas de painéis prontos — CPU por núcleo, I/O de disco, tráfego de rede, pressão de memória — sem escrever uma query sequer. É o caminho sensato para o primeiro contato: importe, observe, e só depois crie os seus.
:::

## Alertas que avisam antes de doer

Dashboard é para olhar; alerta é para não ter que olhar. O Grafana transforma qualquer query em alerta com regra de limiar:

**Regra de exemplo**: alertar quando o disco raiz tiver menos de 15% livre por 10 minutos.

1. Sobre o painel (ou em *Alerting → Alert rules → New*), defina a query de espaço livre.
2. Configure a condição: `B < 15` (a métrica caiu abaixo de 15%).
3. Defina `for: 10m` — o alerta só dispara se a condição persistir 10 minutos, evitando picos falsos.
4. Configure o **contact point**: e-mail, Discord, Telegram, webhook — o Discord/Slack via webhook é o mais rápido de testar, reutilizando o padrão que você já viu na seção de automação.

```terminal
$ curl -s 'localhost:3000/api/alertmanager/grafana/api/v2/alerts' \
    -H 'Authorization: Bearer SEU_TOKEN' | python3 -m json.tool | head -20
```

Quando o disco do Deck passar de 15% livre, você recebe a mensagem no celular — sem nem estar olhando. É monitoramento fechando o ciclo: medir, visualizar, e agir antes do estrago.

## Resumo

- Prometheus usa modelo pull: visita cada endpoint `/metrics` periodicamente; adicionar alvo é editar config, não alterar o alvo.
- `node_exporter` expõe métricas do host; para ler o host (não o container), monte `/` em `/host` com `ro,rslave` e passe `--path.rootfs=/host` e `pid: host`.
- PromQL: `rate()` calcula taxa de counters, a janela `[5m]` suaviza; os quatro padrões cobrem CPU, memória, disco e temperatura.
- Teste PromQL direto no Prometheus (`:9090`) antes de montar dashboards — depure no lugar mais simples.
- Importe o dashboard "Node Exporter Full" (ID 1860) para começar com dezenas de painéis prontos.
- Alertas usam condição de limiar + `for` (persistência) + contact point (Discord/Slack/Telegram via webhook) para avisar antes do problema doer.

## Exercícios

1. Suba a pilha Prometheus + node_exporter + Grafana com o `compose.yaml` da seção. Confirme que `curl localhost:9100/metrics` retorna métricas do host.
2. Rode as quatro PromQL da seção no editor do Prometheus (`:9090`). Anote o valor de cada uma e o que ele significa no seu Deck.
3. Configure a fonte de dados Prometheus no Grafana e crie um painel de temperatura do NVMe (`node_hwmon_temp_celsius`) em modo `Stat`.
4. Importe o dashboard "Node Exporter Full" (ID 1860) e identifique três painéis cujas métricas você aprendeu a ler neste curso.
5. **Desafio.** Crie uma regra de alerta que dispare quando o espaço em disco raiz ficar abaixo de 15% por 10 minutos, com notificação via webhook do Discord. Depois encha temporariamente o disco (ex.: `dd` de um arquivo de teste em `/tmp`) e confirme que o alerta chega — e lembre de apagar o arquivo.