Depois de instalar Sunshine, parear Moonlight, configurar encoder, otimizar rede, integrar ao modo Gaming e estender para acesso remoto, o capítulo fecha com uma seção de diagnóstico. Aqui, cada sintoma comum ganha um fluxo de investigação: o que checar primeiro, segundo e terceiro. Também inclui uma checklist final que consolida tudo o que foi coberto.

:::objetivos
- Diagnosticar os problemas mais comuns de streaming
- Saber qual log olhar para cada sintoma
- Executar uma checklist completa de validação
- Criar um script de diagnóstico que roda no Deck
- Documentar a configuração para referência futura
:::

## Fluxograma de diagnóstico

Siga a ordem — o problema quase sempre está no item mais simples.

### Sintoma 1: "O host não aparece no Moonlight"

1. **Sunshine está rodando?** Confirme no host: `systemctl --user status sunshine` (Linux) ou `Get-Service SunshineService` (Windows).
2. **Portas em escuta?** `ss -tlnp | grep 47989` no host. Se vazio, o Sunshine não subiu corretamente.
3. **Firewall bloqueando?** Desabilite temporariamente o firewall do host para testar. Se resolver, crie regras para TCP 47984-48010, UDP 47998-48010.
4. **Redes diferentes?** Deck e host na mesma sub-rede? `ip addr` no Deck e no host — os IPs devem começar com os mesmos três octetos (ex.: 192.168.1.x).
5. **mDNS funcionando?** O Moonlight descobre hosts via mDNS (porta 5353). Teste: `avahi-browse -rt _nvstream._tcp` (Linux) ou verifique se o serviço Bonjour está rodando no Windows.
6. **Adicione manualmente:** se tudo falhar, clique em **Add Host Manually** e digite o IP do host.

### Sintoma 2: "Stream inicia mas fica preto / congela"

1. **Encoder capturando?** No Sunshine logs, procure por `Capture error` ou `Encoder timeout`.
2. **GPU ocupada?** Se o host estiver rodando um jogo pesado e o encoder compartilha recursos, reduza a qualidade gráfica do jogo.
3. **Driver de vídeo?** Atualize drivers NVIDIA/AMD no host. Drivers quebrados = encoder quebrado.
4. **Codec incompatível?** Force H.264 no Moonlight para testar: `--codec h264`. Se funcionar, o problema é HEVC.
5. **HDCP?** Alguns conteúdos protegidos (Netflix no navegador) bloqueiam captura de tela. Não há solução — é por design.

### Sintoma 3: "Latência alta / delay nos controles"

1. **Host via Wi-Fi?** Conecte o host por Ethernet. Host Wi-Fi → Wi-Fi dobra a latência.
2. **Verifique o ping:** `ping <host>` no Deck. Se > 10 ms na rede local, há problema de rede.
3. **Bufferbloat?** Teste conforme seção 6. Ative SQM no roteador.
4. **Modo de exibição do jogo:** jogos em fullscreen exclusivo têm menos latência que borderless window. Prefira fullscreen.
5. **VSync no host:** desabilite VSync no jogo. O Moonlight gerencia o ritmo de frames.
6. **Aumente o buffer do Moonlight:** Settings → Video buffer size → 2 ou 3 frames. Cada frame extra = ~16 ms de latência.

### Sintoma 4: "Artefatos / blocos na imagem"

1. **Bitrate baixo:** aumente para 50-80 Mbps e teste com HEVC.
2. **Cenas escuras:** HEVC sofre menos com banding em áreas escuras que H.264.
3. **Perda de pacotes:** confirme com `ping -c 100 <host>`. Qualquer perda > 0% causa artefatos.
4. **Fragmentação:** reduza `fragment_size` para 800 no Sunshine e teste.
5. **Wi-Fi congestionado:** mude o canal 5 GHz do roteador. Use app Wi-Fi Analyzer para achar canal livre.

### Sintoma 5: "Áudio com delay / fora de sincronia"

1. **Sink de áudio errado:** no Sunshine, confirme que o sink selecionado é o de saída padrão (alto-falantes/fones que você está usando no host).
2. **Sample rate mismatch:** host a 48 kHz, Sunshine configurado a 44.1 kHz (ou vice-versa). Prefira 48 kHz.
3. **Wireless audio device?** Se o áudio do host vai para fones Bluetooth e depois para Sunshine, há duas camadas de delay. Use áudio cabeado no host.

### Sintoma 6: "Moonlight fecha sozinho / crash"

1. **Flatpak desatualizado:** `flatpak update com.moonlight_stream.Moonlight`.
2. **Falta de memória:** o Deck tem 16 GB, mas se muitos processos estiverem rodando, feche navegador e apps pesados.
3. **Driver de vídeo no Deck:** `lsmod | grep amdgpu` — se não aparecer, o kernel não carregou o driver. Reinicie.
4. **Log do Moonlight:** execute via terminal e veja a saída de erro.

```terminal
$ flatpak run com.moonlight_stream.Moonlight 2>&1 | tee moonlight.log
```

## Checklist de validação completa

Marque cada item. Se todos passarem, sua configuração está sólida:

| # | Verificação | Comando / Ação | Esperado |
|---|-------------|---------------|----------|
| 1 | Sunshine rodando | `systemctl --user status sunshine` | `active (running)` |
| 2 | Portas escutando | `ss -tlnp \| grep 47989` | Uma linha com sunshine |
| 3 | Encoder de hardware | Abrir `localhost:47990` → Configuration | NVENC/AMF/QSV/VAAPI (não Software) |
| 4 | Moonlight instalado | `flatpak list \| grep Moonlight` | `com.moonlight_stream.Moonlight` |
| 5 | Pareado | `moonlight list` | Host aparece como `(Paired)` |
| 6 | Decode por hardware | `vainfo` | `VAEntrypointVLD` para HEVC |
| 7 | Ping < 5 ms | `ping -c 10 <host>` | avg < 5 ms, 0% loss |
| 8 | Stream desktop | `moonlight stream <host> --desktop --stats` | Abre em < 3 segundos |
| 9 | Stream 5 min sem drops | Estatísticas overlay | Frame drops = 0% |
| 10 | Áudio sincronizado | Abrir vídeo YouTube no host durante stream | Áudio casado com vídeo |
| 11 | Controles respondem | Mexer analógico e ver reação no host | < 20 ms |
| 12 | Sair do stream | `Ctrl+Alt+Shift+Q` ou botão mapeado | Fecha imediatamente |
| 13 | Tailscale ativo | `tailscale status` | Ambos online, `direct` |
| 14 | Stream remoto | `moonlight stream <ip-tailscale> --bitrate 20000` | Funciona fora de casa |

## Script de diagnóstico

Crie um script `moonlight-check.sh` no Deck que executa essa checklist:

```bash
#!/bin/bash
# moonlight-check.sh — diagnóstico de streaming
HOST="${1:-192.168.1.100}"

echo "=== Moonlight Diagnostic ==="
echo ""

echo "1. Flatpak Moonlight:"
flatpak list 2>/dev/null | grep -q Moonlight && echo "   OK: Installed" || echo "   FAIL: Not installed"

echo "2. VA-API decode:"
vainfo 2>/dev/null | grep -q HEVC && echo "   OK: HEVC decode available" || echo "   FAIL: No HEVC hardware decode"

echo "3. Ping to host ($HOST):"
ping -c 5 -W 2 "$HOST" 2>/dev/null | tail -1 | awk '{print "   " $0}'

echo "4. Host port 47989:"
timeout 2 bash -c "echo >/dev/tcp/$HOST/47989" 2>/dev/null && echo "   OK: Sunshine reachable" || echo "   FAIL: Cannot reach Sunshine"

echo "5. Tailscale:"
tailscale status 2>/dev/null | grep -q "$HOST" && echo "   OK: Host in Tailscale mesh" || echo "   INFO: Tailscale not used or host not in mesh"

echo "6. Moonlight pairing:"
flatpak run --command=moonlight com.moonlight_stream.Moonlight list 2>/dev/null | grep -q "$HOST" && echo "   OK: Paired" || echo "   FAIL: Not paired"

echo "7. Wi-Fi link:"
iw dev wlan0 link 2>/dev/null | grep -E "signal|freq" | sed 's/^/   /'

echo ""
echo "=== End of diagnostic ==="
```

Execute:

```terminal
$ chmod +x moonlight-check.sh
$ ./moonlight-check.sh 192.168.1.100
```

## Resumo

- Siga o fluxograma: Sunshine rodando → portas escutando → firewall → rede → pareamento.
- Latência: host cabeado > host Wi-Fi. Bufferbloat é a causa mais comum de latência alta.
- Artefatos: bitrate baixo ou packet loss. Aumente bitrate ou troque canal Wi-Fi.
- Use o script `moonlight-check.sh` como primeiro passo em qualquer diagnóstico.
- A checklist cobre todos os pontos vitais: serviço, encoder, codec, rede, VPN.

## Exercícios

1. Crie e execute o script `moonlight-check.sh` no Deck. Todos os itens passaram? Se algum falhou, investigue.
2. Simule um problema: pare o Sunshine no host (`systemctl --user stop sunshine`). Rode o script de diagnóstico e veja quais itens falham. Depois restaure.
3. Durante um stream de 10 minutos de um jogo em movimento, mantenha o overlay de estatísticas aberto. Anote frame drops, decode time médio e bitrate recebido.
4. Documente sua configuração final: encoder, resolução, FPS, bitrate, codec, rede (Ethernet/Wi-Fi) e VPN. Guarde num arquivo `~/streaming-setup.md` para referência.
5. **Desafio.** Provoque perda de pacotes artificialmente no host (Linux: `tc qdisc add dev eth0 root netem loss 2%`). Inicie um stream e observe o impacto no overlay. Ajuste `fec_packets_per_group = 3` no Sunshine e veja se melhora. Depois remova o netem: `tc qdisc del dev eth0 root`.