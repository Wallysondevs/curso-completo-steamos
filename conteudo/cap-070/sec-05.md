O Steam Remote Play é a solução nativa, já vem instalada e não pede conta extra — mas só funciona dentro do ecossistema Steam. Esta seção explora o Steam Link pelo que ele tem de melhor (integração e simplicidade) e pelo que ele deixa a desejar (jogos fora da Steam, latência maior, ausência de coop remoto). O objetivo é saber quando usar o Steam Link em vez do Parsec.

:::objetivos
- Dominar o Steam Remote Play no SteamOS como alternativa ao Parsec
- Ajustar qualidade, limite de banda e codec no cliente Steam
- Diagnosticar a latência do Steam Link com ferramentas de terminal
- Decidir entre Steam Remote Play e Parsec para cada cenário
:::

## Steam Remote Play: o que roda por baixo

O Steam Remote Play não é um aplicativo separado — é parte do cliente Steam. Quando você clica em "Transmitir" ou "Conectar", o Steam:

1. Inicia um serviço de streaming via `steamwebhelper`
2. Captura a saída do jogo (ou da tela, no modo desktop) usando o compositor do SO
3. Encoda em H.264 ou H.265 por hardware (NVENC, AMF ou VAAPI)
4. Transmite via UDP com fallback para relay Valve
5. No cliente, decodifica e renderiza com sobreposição de overlay Steam

No SteamOS, o processo de streaming aparece como:

```terminal
$ ps aux | grep -i stream
deck     1234  2.1  1.2  /home/deck/.local/share/Steam/ubuntu12_32/streaming_client
deck     1235  0.3  0.1  /home/deck/.local/share/Steam/ubuntu12_32/steamwebhelper ...
```

O binário `streaming_client` é o motor do Remote Play. Ele é um processo separado do Steam principal, então mesmo que o Steam trave, o streaming às vezes sobrevive.

## Configurações de streaming no cliente Steam

No Deck, as opções do Steam Remote Play estão em: Steam → Configurações → Remote Play. Os parâmetros que afetam a qualidade:

```terminal
# Essas configurações são gravadas em:
$ cat ~/.local/share/Steam/config/streaming_config.vdf
```

As opções importantes e seus equivalentes de linha de comando (não oficiais, mas úteis para scripting):

| Configuração | Descrição | Recomendação para Deck |
|---|---|---|
| `StreamingClientResolution` | Resolução de recepção | `1280x800` (nativa do Deck) |
| `StreamingLimitBandwidth` | Limite de banda em Kbps | `50000` (50 Mbps) |
| `StreamingAudioBitrate` | Bitrate de áudio em Kbps | `192` |
| `StreamingHardwareEncoding` | Forçar encode por hardware | `1` |
| `StreamingHardwareDecoding` | Forçar decode por hardware | `1` |
| `StreamingVSync` | Sincronização vertical | `0` (desligado para menor latência) |
| `StreamingColorRange` | Espaço de cor | `0` (Rec.601, padrão) |

Ajuste direto no arquivo (fecha o Steam antes):

```terminal
$ cat ~/.local/share/Steam/config/streaming_config.vdf
"streaming"
{
    "HardwareEncoding"    "1"
    "HardwareDecoding"    "1"
    "LimitBandwidth"      "50000"
    "ClientResolution"    "1280x800"
    "VSync"               "0"
}
```

## Medindo a latência do Steam Link

Ao contrário do Parsec (que tem overlay nativo com métricas), o Steam Remote Play esconde suas estatísticas. Para expô-las:

```terminal
# Ativar overlay de desempenho detalhado no Steam Remote Play
# Steam → Configurações → Remote Play → Opções Avançadas → Exibir informações de desempenho
```

Com o overlay ativo, durante uma sessão de streaming você vê:

```
┌─────────────────────────────────┐
│  Resolução: 1280x800@60         │
│  Codec: H.264 Hardware          │
│  Rede: 2.5 ms (ping) / 0% perda │
│  Bitrate: 48 Mbps               │
│  Decode: ~4 ms                  │
│  FPS: 60                        │
└─────────────────────────────────┘
```

Compare com os números do Parsec (seção 4) sob as mesmas condições. A diferença de `ping` entre as duas ferramentas, com mesma rede e mesmo host, dá a medida exata da sobrecarga do pipeline do Steam.

## Limitações do Steam Remote Play

Onde o Steam Remote Play perde para o Parsec:

### 1. Só roda jogos Steam (ou atalhos Steam)

Se você quer transmitir um jogo da Epic Games Store, precisa adicioná-lo como atalho não-Steam no host. Mesmo assim, a detecção automática de compatibilidade pode falhar. O Parsec transmite a tela inteira — qualquer jogo, qualquer launcher, sem truques.

### 2. Sem cooperação remota (cada sessão é 1:1)

No Steam Remote Play Together (o recurso de coop), o host convida amigos, mas cada um precisa ter conta Steam. No Parsec, o amigo instala o cliente, conecta e joga — não precisa de conta Steam nem de possuir o jogo. E o Parsec suporta múltiplos gamepads simultâneos mapeados no host.

### 3. Latência adicional do compositor

O Steam Remote Play captura o jogo através do compositor gráfico (X11/Wayland + GameScope), o que adiciona pelo menos 1 frame de latência (~16 ms a 60 FPS). O Parsec captura direto do framebuffer da GPU, pulando o compositor.

### 4. Sem modo headless nativo

O Steam Remote Play exige que o host tenha uma sessão gráfica ativa. Se o monitor estiver desligado ou o usuário não estiver logado, o streaming não funciona (ou funciona com resolução errada). O Parsec resolve isso com display virtual.

## Quando o Steam Link é a melhor escolha

Apesar das limitações, há cenários em que o Steam Remote Play é superior:

- **Zero configuração.** Já está instalado, já está logado, já funciona. Para transmitir um jogo Steam da sua própria biblioteca, é imbatível em conveniência.
- **Integração com Steam Input.** O layout de controle é o mesmo — sem dupla configuração no Parsec e no Steam. Gyro, touchpad e botões traseiros funcionam com os perfis da comunidade.
- **Wake-on-LAN integrado.** O Steam Link consegue acordar o host via rede se ele estiver dormindo. O Parsec depende de configuração manual de WoL.
- **Compatibilidade total com Steam Deck.** Como é uma funcionalidade nativa, nunca quebra com atualização do SteamOS. Já o Parsec Flatpak pode quebrar se o runtime mudar.

## Usando Steam Link e Parsec lado a lado

Nada impede usar os dois. Uma estratégia comum:

- **Jogos Steam single-player:** Steam Remote Play (conveniência)
- **Jogos de outras lojas:** Parsec (compatibilidade)
- **Sessões cooperativas:** Parsec (múltiplos gamepads)
- **Jogos competitivos:** Parsec (menor latência)
- **Acesso ao desktop remoto:** Parsec (modo desktop)

No Modo Jogo, ambos aparecem como atalhos na biblioteca. Alterne entre eles como se fossem "jogos" diferentes.

**Em resumo:** o Steam Remote Play é a solução de streaming mais conveniente no SteamOS — integrada, nativa e sem configuração extra. Suas limitações (apenas jogos Steam, sem coop remoto real, latência do compositor) são exatamente os pontos onde o Parsec brilha. A decisão entre um e outro depende do jogo, da latência tolerável e de quem está jogando com você.

## Exercícios

1. Inicie uma sessão de Steam Remote Play do seu PC para o Deck usando um jogo Steam leve. Ative o overlay de desempenho e anote ping, bitrate, FPS e codec.
2. Transmita o mesmo jogo usando Parsec (seção 4). Compare os números lado a lado. Qual ferramenta teve menor ping?
3. Adicione um jogo da Epic Games Store como atalho não-Steam no host e tente transmiti-lo via Steam Remote Play. Funcionou? O controle foi reconhecido?
4. Teste o Steam Remote Play com o host via Wi-Fi (não cabeado). O bitrate caiu em relação ao teste cabeado? Houve perda de frames?
5. **Desafio.** Compare o tráfego de rede das duas ferramentas com `tcpdump`: inicie `sudo tcpdump -i wlan0 udp -w steam.pcap` no Deck durante uma sessão Steam Link, depois repita com Parsec. Analise com `tcpdump -r steam.pcap` e compare o tamanho médio dos pacotes e a frequência de envio.