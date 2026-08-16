Streaming local raramente quebra por um único motivo dramático — quase sempre é um acúmulo de pequenos problemas que se manifestam como "o jogo engasga", "a imagem fica preta" ou "não conecta". A habilidade que separa quem resolve em cinco minutos de quem desiste é saber transformar um sintoma vago num teste que isole a causa. Esta seção ensina um método de diagnóstico sistemático.

:::objetivos
- Adotar um fluxo de diagnóstico do sintoma à causa, sem tentativas aleatórias
- Usar o overlay de desempenho e logs para localizar o gargalo
- Resolver os problemas mais comuns de conexão, vídeo e áudio
- Interpretar logs do Steam para erros de pareamento e autorização
- Saber quando reiniciar, quando atualizar e quando trocar o hardware de rede
:::

## O método: isolar antes de corrigir

O primeiro reflexo deve ser sempre o mesmo: reduzir o espaço do problema. A pergunta central do Remote Play é "onde está o gargalo?" — e as quatro respostas possíveis mapeiam para os quatro estágios do pipeline:

1. **Hospedeiro** (captura/encode) — CPU/GPU saturada, encoder em software, driver ruim.
2. **Rede** (transmissão) — interferência, bufferbloat, roteador saturado.
3. **Cliente** (decode/exibição) — Deck com processos em segundo plano, tela em modo errado.
4. **Jogo** (renderização) — fps instável, vsync em cascata, problema específico do título.

O overlay de desempenho (nível 4) já aponta o estágio: se **Streaming** mostra perda de frames mas **Framepacing** está estável, é rede. Se o **Framepacing** oscila com networking limpo, é encode ou render.

```terminal
$ ping -c 20 -i 0.1 192.168.1.100
PING 192.168.1.100 56(84) bytes of data.

--- 192.168.1.100 ping statistics ---
20 packets transmitted, 20 received, 0% packet loss, time 2051ms
rtt min/avg/max/mdev = 0.910/1.223/1.801/0.235 ms
```

Comece por aqui: um ping curto e rápido durante o jogo. Se ele se mantém limpo (0% loss, mdev baixo) **enquanto o streaming engasga**, descarte a rede e investigue o pipeline de encode/decode. Se o ping piora junto com os engasgos, é rede.

## Sintoma a sintoma

**"Não aparece o PC na lista"** — o Deck não encontra o hospedeiro.

- Ambos na mesma conta Steam e logados? O Remote Play exige a **mesma conta** nas duas pontas.
- O *Enable Remote Play* está ligado no PC (seção 2)?
- Firewall do Windows bloqueando: libere as portas UDP 27031-27036 e TCP 27036.
- Redes com isolamento de cliente (AP isolation) no roteador impedem dispositivos de se enxergarem.

**"Conecta mas fica tela preta"** — a sessão abre e o vídeo não chega.

- Quase sempre é codec: force H.264 no menu avançado se o HEVC está selecionado e o hardware não aguenta.
- Atualize os drivers de GPU do hospedeiro — captura de frame falha com drivers antigos.
- Desative o HDR no PC se a tela externa dele é HDR e o Deck LCD não reproduz o stream HDR.

```terminal
$ glxinfo -B 2>/dev/null | grep -i "renderer\|version"
OpenGL renderer string: AMD Custom GPU 0405 (radeonsi, ...)
OpenGL core profile version string: 4.6 ...
```

No Deck, `glxinfo -B` confirma o renderer ativo. Se o stream chega com tela preta, verifique se o Mesa (driver gráfico) está atualizado — em sistemas imutáveis, a atualização vem junto do SteamOS, mas em modo desktop pode ser necessário um `sudo steamos-readonly disable` para instalar drivers manualmente (desaconselhado; prefira atualizar o sistema).

**"Engasga em intervalos regulares"** — o padrão rítmico é uma pista valiosa.

- Engasgo a cada ~30-60 segundos: scan de rede do roteador, ou outro dispositivo fazendo broadcast (impressora, câmera).
- Engasgo a cada poucos segundos: bufferbloat de tráfego concorrente, ou vsync em cascata.
- Engasgo aleatório: interferência de Wi-Fi, canal congestionado.

**"Áudio fora de sincronia ou cortando"** — som atrasa ou pica.

- O áudio viaja no mesmo stream mas com buffer separado. Atraso de áudio geralmente indica buffer do cliente cheio.
- No menu avançado, reduza a qualidade de vídeo e veja se o áudio estabiliza (pista de que a rede está no limite).

## Lendo os logs do Steam

O Steam registra erros de streaming em arquivos de log que, lidos com paciência, apontam a causa exata de falhas de conexão e pareamento:

```terminal
$ find ~/.steam -name "*.log" -mmin -60 2>/dev/null | head
/home/deck/.steam/root/logs/remote_connections.txt
/home/deck/.steam/root/logs/streaming_client.log
$ grep -iE "error|fail|timeout" ~/.steam/root/logs/streaming_client.log | tail -10
[Streaming] Client: Failed to initialize video decoder for H265, falling back to H264
[Streaming] Client: Network timeout waiting for keyframe from host
[Streaming] Client: Reconnecting stream (attempt 1 of 5)
```

Acima, três entradas reveladoras: o cliente **tentou H.265 e falhou** (caindo para H.264), depois **esperou um keyframe que não chegou** (perda no início do stream) e **reconectou**. A sequência sugere, primeiro, desativar o HEVC e, segundo, investigar a rede (o keyframe perdido é típico de packet loss alto no handshake).

:::dica
O arquivo `remote_connections.txt` registra o histórico de tentativas de pareamento com timestamps. Se um dispositivo "some" da lista repetidamente, procure ali por entradas de *pairing rejected* ou *auth expired* — geralmente resolva re-pareando (revogar e reautorizar nas configurações de dispositivo do Steam).
:::

## O escalonamento de correções

Quando o diagnóstico rápido não resolve, escale em ordem de custo:

1. **Reinicie os três lados** — PC, roteador e Deck. Resolve uma fatia surpreendente de problemas (estado de NAT, cache de pareamento, encoder preso).
2. **Atualize tudo** — Steam (ambos), drivers de GPU, firmware do roteador.
3. **Teste com cabo** — Ethernet no Deck elimina a variável Wi-Fi de uma vez e diz se o problema é RF ou outra coisa.
4. **Troque o hardware de rede** — roteador com mais de 5 anos, ou mesh com backhaul saturado, é a causa raiz em muitos casos de streaming ruim.

```terminal
$ sudo systemctl restart NetworkManager
$ sudo systemctl restart steam 2>/dev/null || true
```

No modo desktop do Deck, reiniciar o `NetworkManager` e o processo do Steam limpa estados de conexão sem precisar desligar a máquina inteira. Em modo de jogo, o reinício completo é mais confiável (o gamescope gerencia a rede de forma integrada).

:::atencao
Nunca rode `sudo steamos-readonly disable` só para "tentar resolver" um problema de streaming. O sistema imutável do SteamOS é uma proteção, e desativá-lo para instalar binários de terceiros pode corromper o sistema e impedir atualizações futuras. Problemas de streaming resolvem-se por configuração, rede ou atualização — raramente por modificar o sistema de arquivos.
:::

## Resumo

- Isolar o gargalo (hospedeiro, rede, cliente ou jogo) é o primeiro passo; o overlay nível 4 aponta o estágio.
- Um `ping` limpo durante o engasgo descarta a rede e direciona a investigação para encode/decode.
- Tela preta costuma ser codec (force H.264) ou HDR incompatível; "PC não aparece" é conta, firewall ou isolamento de AP.
- Logs em `~/.steam/root/logs/` registram falhas de decoder, keyframe e reconexão com a causa exata.
- Escale correções na ordem: reiniciar → atualizar → testar com cabo → trocar hardware de rede.

## Exercícios

1. Reproduza um engasgo e, simultaneamente, rode um `ping` rápido. O ping piora junto? Registre o resultado e conclua se é rede ou pipeline.
2. Gere falhas propositais: desative o hardware encoding e note o sintoma; depois reative e compare.
3. Force HEVC numa GPU que não suporta (ou num jogo problemático) e leia `streaming_client.log` para ver o fallback para H.264.
4. Habilite o isolamento de cliente (AP isolation) no roteador temporariamente e observe que o Deck deixa de achar o PC. Desfaça a mudança.
5. **Desafio.** Monte uma tabela de sintoma→causa→correção com pelo menos 6 problemas reais que você já encontrou ou reproduziu, usando o método de isolamento desta seção para validar cada linha.