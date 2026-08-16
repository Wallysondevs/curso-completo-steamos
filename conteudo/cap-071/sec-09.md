Chegamos ao ponto em que as peças se encaixam. Nativo, Proton, Remote Play, Moonlight e cloud são caminhos para o mesmo destino: jogar bem no Deck. Esta seção fecha o capítulo com um **framework de decisão** — perguntas que você roda em trinta segundos antes de abrir qualquer jogo.

:::objetivos
- Construir uma **árvore de decisão** em prosa que leve do jogo à melhor forma de execução
- Comparar **latência, bateria, qualidade visual e dependência externa** de cada modo
- Fixar o pipeline mental de "pensar como o Deck" antes de instalar ou lançar
- Reconhecer o **custo escondido** do streaming e quando ele se paga de verdade
:::

## A árvore de decisão: cinco perguntas em sequência

Para cada jogo, responda na ordem. A primeira que fechar uma opção é a decisão. Sem fechar? Caia no padrão conservador.

**1. Tem nativo Linux com boa performance?**
Se sim, e o build não é abandonado, a resposta é **nativo**. Menor atrito: sem camada de tradução, menos overhead de CPU. CS2 é o exemplo — nativo, 120+ fps, TDP baixo.

**2. Funciona bem no Proton?**
Sem nativo (ou build ruim), cheque compatibilidade. **Platinum** e **Gold**: instala e joga. **Silver** e **Bronze**: tweaks e GE-Proton. **Borked**: rua. Cada tweak é manutenção futura.

**3. Tem PC gamer disponível em casa?**
Jogo sofre no Deck e desktop parrudo na rede? Streaming local entra. Moonlight/Sunshine para catálogo geral, Remote Play para Steam. Deck a 30 fps, PC a 60+? Streaming é mais honesto — *se a rede cooperar*.

**4. A latência importa para este gênero?**
FPS competitivo, ritmo, fighting: latência é decisiva. RPG por turnos, estratégia, visual novel: 40–60 ms passam despercebidos. O mesmo atraso que arruína um CS2 é irrelevante num Baldur's Gate.

**5. Você está na bateria ou na tomada?**
Na tomada, o modo mais bonito que couber vence. Na bateria, streaming rende 4–6 horas contra 1,5–2 horas de jogo pesado local. Sessão longa? Streaming. Sessão rápida na rua? Local.

:::atencao
A ordem importa. Responder "estou na bateria" *antes* de checar se o jogo é leve o suficiente para rodar nativo a 60 fps com 6 W de TDP faz você apelar para o streaming sem necessidade. **Nativo leve na bateria** existe — nem todo jogo é Cyberpunk.
:::

## Um jeito rápido de medir a latência até o host

Antes de confiar no streaming, meça a rede. Um `ping` já dá o panorama:

```bash
## Cria script de medição em ~/lab
mkdir -p ~/lab && cat > ~/lab/lat_host.sh <<'EOF'
#!/bin/bash
HOST="${1:-192.168.1.50}"
N=20
echo "Medindo latência até $HOST ($N pacotes)..."
RESP=$(ping -c $N -i 0.2 "$HOST" 2>/dev/null | tail -1)
AVG=$(echo "$RESP" | awk -F'/' '{print $5}')
if [ -z "$AVG" ]; then
  echo "Host inacessível. Verifique IP e rede."
  exit 1
fi
echo "Latência média: ${AVG} ms"
if   (( $(echo "$AVG < 15" | bc -l) )); then echo "Veredito: ideal para streaming."
elif (( $(echo "$AVG < 40" | bc -l) )); then echo "Veredito: aceitável. Evite gêneros de reflexo."
else echo "Veredito: alto. Prefira jogo local."
fi
EOF
chmod +x ~/lab/lat_host.sh
~/lab/lat_host.sh 192.168.1.50
```

```terminal
$ ./lat_host.sh 192.168.1.50
Medindo latência até 192.168.1.50 (20 pacotes)...
Latência média: 6.4 ms
Veredito: ideal para streaming.
```

Seis milissegundos na rede cabeada é excelente. No Wi-Fi 5 do Deck, some 4–8 ms de jitter e ainda está confortável. Passou de 40 ms, o streaming vira chateação.

## Consultando o ProtonDB sem abrir o navegador

No modo Desktop você pode automatizar o passo 2. A API do ProtonDB responde com o tier pelo AppID:

```bash
## Busca tier pelo AppID (ex.: Elden Ring = 1245620)
cd ~/lab
curl -s "https://www.protondb.com/api/v1/reports/summaries/1245620.json" \
  | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Tier: {d['tier']} | Confiança: {d['confidence']} reports\")"
```

```terminal
$ curl -s "https://www.protondb.com/api/v1/reports/summaries/1245620.json" \
>   | python3 -c "import sys,json; d=json.load(sys.stdin); print(f\"Tier: {d['tier']} | Confiança: {d['confidence']} reports\")"
Tier: platinum | Confiança: 0.91 reports
```

:::dica
O AppID é o número na URL da loja (`store.steampowered.com/app/1245620`). Dá para montar um script que recebe o nome do jogo e resolve o AppID via busca da Steam.
:::

Com `platinum`, o Elden Ring vira "sim" no passo 2 — você nem precisa pensar em streaming.

## A tabela-resumo: os cinco modos lado a lado

A latência é o valor *adicional* do modo. Bateria considera o Deck em condições típicas.

| Modo | Latência típica | Bateria | Qualidade visual | Depende de rede/PC? |
|------|-----------------|---------|------------------|---------------------|
| **Nativo Linux** | ~0 ms | Variável | Máxima para o hardware | Não |
| **Proton** | ~0 ms (overhead de CPU) | Levemente menor que nativo | Quase nativa | Não |
| **Remote Play** | 20–60 ms | 5–7 h | Comprime; melhora com rede | Sim (host Steam) |
| **Moonlight** | 5–20 ms | 5–7 h | Excelente (HEVC/AV1) | Sim (Sunshine no PC) |
| **Cloud (GFN/xCloud)** | 40–90 ms | 5–7 h | Boa, depende da internet | Sim (assinatura + internet) |

:::info
**Streaming transfere bateria e calor para outro lugar**, mas cobra em latência e dependência de segunda máquina ou internet boa. Não existe modo grátis — a decisão é sempre uma troca.
:::

## Exemplos reais: a decisão na prática

**Counter-Strike 2 — nativo, local.** Build Linux otimizado, 120+ fps, ~2 h de bateria, latência zero extra. **Decisão: nativo.**

**Elden Ring — Proton Platinum, local.** Sem nativo, Platinum no ProtonDB, 40 fps travados, ~2 h. **Decisão: Proton, local.**

**Cyberpunk 2077 — streaming do PC.** 30 fps instáveis no baixo, ventoinha alta, ~1 h de bateria. Desktop a 60+: Moonlight entrega visual rico e 5–6 h de bateria. **Decisão: Moonlight, em casa.**

**Baldur's Gate 3 — ambos.** Local: 30–40 fps, jogável para RPG tático. Maratona: streaming mantém 5+ h de bateria. **Decisão: Proton para curtas; streaming para longas.**

**Forza Horizon 5 — Proton local, cloud alternativo.** 40–50 fps via Proton. Cloud poupa bateria com boa internet, mas 40–90 ms incomodam em corrida. **Decisão: Proton; cloud se rede impecável.**

:::nota
Nenhum dos cinco caiu em "cloud obrigatório". Cloud é *conveniência* — testar antes de baixar, jogar em viagem, economizar armazenamento. Como solução primária em jogo de reflexo, raramente vence Proton ou Moonlight.
:::

## Comparando local vs streaming com mangohud

O `mangohud` mostra o que o Deck sofre. Cyberpunk 2077 local (Proton, preset baixo) contra Moonlight:

```terminal
$ mangohud %command% -- proton run cyberpunk2077
## Modo local, 30s de gameplay:
FPS: 28  | Frametime: 35.7ms | GPU: 99% | CPU: 62%
TDP: 19W | Battery drain: 21W | Temp: 82°C | Fan: 5200 RPM
Tempo restante de bateria: 1h 12min
```

```terminal
$ mangohud %command% -- moonlight stream cyberpunk2077
## Modo streaming, 30s de gameplay:
FPS: 60  | Frametime: 16.6ms | GPU: 18% | CPU: 12%
TDP: 6W  | Battery drain: 7W  | Temp: 48°C | Fan: 2100 RPM
Tempo restante de bateria: 5h 38min
```

O Deck deixa de ser fogareiro e vira cliente de vídeo: os 60 fps saem do desktop, o Deck só decodifica. O custo é a latência — imperceptível com 6,4 ms até o host. É esse dado concreto que tira a árvore de decisão do papel.

## O pipeline mental e o custo escondido

"Pensar como o Deck" é internalizar três orçamentos:

1. **CPU/GPU:** O SoC tem teto de ~15 W. Jogo que exige 45 W no desktop não cabe como renderizador, mas cabe como cliente de stream.
2. **Bateria:** 40 Wh é pouco. Jogo a 15 W dura ~1,5 h; streamado a 4–6 W dura 5+ h. Pergunte "roda por quanto tempo *do jeito que eu quero*?"
3. **Latência:** Cada jogo tem um teto de atraso aceitável. Local = 0 ms extra; streaming = 5 a 90 ms.

Pipeline completo: **jogo → nativo? → Proton? → tenho PC/rede? → latência ok? → bateria/tomada? → decisão**. Trinta segundos, com prática.

### O custo escondido do streaming

Configurar Moonlight + Sunshine, bitrate, codec, wake-on-LAN, PC sempre atualizado: **é trabalho**. Manter dois PCs custa dinheiro. Quando se paga?

Paga-se quando **o ganho é grande e recorrente** — Cyberpunk a 60 fps toda noite. Não se paga quando o jogo já roda bem local e o streaming só adiciona latência por vaidade. Jogo pesado jogado raramente não justifica a engenharia; jogado toda semana, justifica em dias.

## Resumo

- A decisão segue **cinco perguntas na ordem**: nativo? Proton? PC disponível? latência importa? bateria ou tomada?
- **Nativo e Proton** adicionam ~0 ms e são o padrão quando o jogo roda bem localmente
- **Remote Play e Moonlight** transferem bateria/calor para o host, custando latência (5–60 ms) e dependência de segunda máquina
- **Cloud** é conveniência e economia de armazenamento, mas tem a maior latência (40–90 ms) — evite em jogo de reflexo
- O **custo escondido** do streaming só se paga quando o ganho é grande *e* recorrente
- O pipeline "pensar como o Deck" avalia CPU, bateria e tolerância à latência antes de instalar

## Exercícios

1. Pegue três jogos da sua biblioteca e, para cada um, responda as cinco perguntas da árvore de decisão por escrito — registrando a decisão final e o porquê.
2. Execute o `~/lab/lat_host.sh` contra o IP do seu PC (ou roteador) e anote a latência média. Ela habilita ou desabilita o streaming na sua casa?
3. Escolha um jogo pesado da sua biblioteca e rode-o de duas formas — local e via Moonlight/Remote Play — usando `mangohud` para comparar frame rate e consumo de bateria entre os cenários.
4. Consulte a API do ProtonDB para cinco jogos (pelo AppID) e monte uma mini-tabela com o tier. Quais são "instala e joga"?
5. **Desafio integrador:** Escolha um jogo que roda mediano no Deck e faça o processo completo: meça a latência da rede, consulte o ProtonDB, compare local vs streaming com `mangohud`, e escreva um "cartão de decisão" com a opção ideal para *casa (tomada)*, *casa (bateria)* e *fora de casa*. Justifique com números medidos.