Configurar o host do Parsec é onde a mágica da baixa latência acontece — ou se perde. As escolhas de codec, resolução, bitrate e modo de display determinam se a sua sessão de streaming vai ser responsiva ou frustrante. Esta seção cobre a configuração do host (o PC que roda o jogo) com foco em decisões práticas.

:::objetivos
- Configurar o host Parsec para mínima latência
- Selecionar codec, resolução e bitrate adequados ao hardware
- Ativar o modo headless para streaming sem monitor físico
- Ajustar o `server_config.txt` para o cenário Deck
:::

## O arquivo de configuração do Parsec

No host (Windows ou Linux), o Parsec guarda suas preferências em `config.txt`. A localização varia:

- **Windows:** `%AppData%\Parsec\config.txt`
- **Linux:** `~/.parsec/config.txt`

Os parâmetros que mais afetam a experiência no Deck:

```terminal
$ cat ~/.parsec/config.txt
app_host = 1
app_run_in_background = 1

host_video_codec = h264
host_video_bitrate = 50
host_video_fps = 60
host_video_resolution = 1920x1080

host_audio = 1
host_audio_capture = 1

host_input = 1
host_gamepad = 1

host_fullscreen = 1
host_windowed = 0

host_hdr = 0
host_vsync = 0
```

Cada linha tem uma razão de ser quando o cliente é um Steam Deck:

### Codec: H.264 vs H.265

`host_video_codec = h264` é a escolha de menor latência. O H.264 é codificado por hardware em praticamente qualquer GPU dos últimos 10 anos, com pipelines otimizados para velocidade. O H.265 (HEVC) comprime melhor — mesma qualidade com metade do bitrate — mas o encode leva mais tempo, adicionando 2–5 ms extras.

A regra para o Deck como cliente:
- **H.264:** menor latência, qualidade boa acima de 30 Mbps. Prefira para jogos de ação.
- **H.265:** melhor qualidade visual em bitrates baixos (10–20 Mbps). Use se sua rede for limitada ou o jogo for lento (estratégia, puzzle).

### Bitrate: o número mágico

`host_video_bitrate = 50` significa 50 Mbps. O Deck tem tela de 1280×800, então mesmo 1080p no host será downscaled. Na prática:

| Bitrate (Mbps) | Qualidade no Deck | Quando usar |
|---|---|---|
| 10–20 | Artefatos visíveis em movimento | Rede Wi-Fi congestionada ou 4G |
| 30–40 | Qualidade aceitável | Wi-Fi 5 GHz, distância média do roteador |
| 50–75 | Excelente para 1080p | Ethernet no host, Wi-Fi 5 GHz forte no Deck |
| 100+ | Overkill para tela 800p do Deck | Somente se você estiver espelhando para TV 4K |

Para o Deck, **50 Mbps** é o ponto ideal: qualidade visual nítida na tela de 800p sem consumir banda desnecessária.

### FPS e resolução

```terminal
$ grep -E 'host_video_fps|host_video_resolution' ~/.parsec/config.txt
host_video_fps = 60
host_video_resolution = 1920x1080
```

A resolução do host pode ser maior que a do Deck (1280×800) porque o downscale melhora a qualidade percebida (supersampling). Mas 60 FPS é o teto da tela do Deck LCD; se você tem o modelo OLED (90 Hz), pode subir para `host_video_fps = 90`.

## Modo headless: streaming sem monitor

Se o host for um PC sem monitor (ou com monitor desligado), a GPU pode se recusar a renderizar. O Parsec contorna isso com um **display virtual**:

No Windows, instale o driver `parsec-vdd` (Parsec Virtual Display Driver) que vem no instalador. No Linux, use um framebuffer virtual:

```terminal
$ cat /etc/X11/xorg.conf.d/99-parsec-virtual.conf
Section "Device"
    Identifier  "ParsecVDD"
    Driver      "modesetting"
    Option      "VirtualDisp" "true"
EndSection
```

Com o display virtual ativo, o host gera um framebuffer em memória que o Parsec captura — sem precisar de monitor físico. No `config.txt`, confirme:

```terminal
host_virtual_display = 1
host_virtual_display_resolution = 1920x1080
```

:::info
No Windows, o `parsec-vdd` é instalado automaticamente e cria um monitor virtual na resolução configurada. No Linux, o suporte é limitado e depende da GPU: NVIDIA requer o driver proprietário com `CoolBits`; AMD funciona com `modesetting` + kernel 5.15+; Intel funciona out of the box.
:::

## Desligando recursos que atrapalham

Vários recursos visuais do Windows e do Linux adicionam latência ou consomem GPU sem necessidade durante o streaming:

```terminal
# Desativar V-Sync no host (o Parsec gerencia o ritmo)
host_vsync = 0

# Desativar HDR (o Deck LCD não tem HDR; o OLED tem, mas o Parsec ainda não suporta bem)
host_hdr = 0

# Impedir que o host entre em sleep
host_prevent_sleep = 1

# Prioridade de processo (Windows: high; Linux: nice -10)
host_process_priority = high
```

## Ajustes específicos para GPU NVIDIA no host

Se o host tem GPU NVIDIA, três configurações no driver reduzem a latência de encode:

```terminal
# No Windows, via PowerShell como admin:
PS> nvidia-smi --gpu-reset
# Configurar máximo desempenho para o encoder
PS> nvidia-smi -ac 5001,2100

# No Linux:
$ sudo nvidia-smi -ac 5001,2100
$ sudo nvidia-smi -pm 1
```

O comando `-ac` trava os clocks de memória e GPU, evitando oscilações que causam micro-stutter no stream. O `-pm 1` ativa o modo de persistência (a GPU não desliga entre frames).

## Testando a configuração

Depois de ajustar o `config.txt`, reinicie o Parsec no host e verifique os logs:

```terminal
# Windows (PowerShell)
PS> Get-Content "$env:AppData\Parsec\log.txt" -Tail 20

# Linux
$ tail -20 ~/.parsec/log.txt
```

Procure por linhas como:
```
[INFO] Video encode using hardware encoder (h264_nvenc)
[INFO] Host ready for connections on port 8000-8004/UDP
```

Se aparecer `software encoder` em vez de `hardware encoder`, o codec escolhido não tem suporte de hardware na GPU do host — troque para `h264`.

## Verificação de portas e firewall

O Parsec usa UDP nas portas 8000–8004. Se o host está atrás de firewall ou NAT, essas portas precisam estar acessíveis para o cliente:

```terminal
# No host Linux, verifique se as portas estão ouvindo:
$ ss -uln | grep -E '800[0-4]'
UNCONN 0   0   0.0.0.0:8000   0.0.0.0:*
UNCONN 0   0   0.0.0.0:8001   0.0.0.0:*
```

No Windows, o instalador do Parsec adiciona as regras de firewall automaticamente. Se estiver com problemas, execute como administrador:

```terminal
PS> New-NetFirewallRule -DisplayName "Parsec UDP" -Direction Inbound -Protocol UDP -LocalPort 8000-8004 -Action Allow
```

**Em resumo:** a configuração de host do Parsec gira em torno de três decisões: codec (H.264 para latência, H.265 para economia), bitrate (50 Mbps é o ponto ideal para o Deck) e display virtual (obrigatório para host headless). Ajuste o `config.txt`, verifique os logs e valide que o encode está usando hardware.

## Exercícios

1. No host, localize o `config.txt` do Parsec e anote os valores atuais de `host_video_codec`, `host_video_bitrate` e `host_video_fps`.
2. Altere o codec para `h264`, bitrate para `50` e FPS para `60`. Reinicie o Parsec e observe `log.txt`: o encoder está usando hardware?
3. Simule uma situação de baixa banda: reduza o bitrate para `15` e conecte o Deck. Descreva a qualidade visual e em que tipo de jogo ela ainda seria aceitável.
4. Ative o display virtual (se seu host suportar) e desconecte o monitor físico. Confirme que o Deck ainda consegue se conectar e jogar.
5. **Desafio.** Meça a latência de encode de cada codec: configure `h264`, jogue 30 segundos e anote o decode time no overlay do Parsec (Ctrl+Shift+D). Repita com `h265`. Qual a diferença em milissegundos?