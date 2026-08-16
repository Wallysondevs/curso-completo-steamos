Depois de 8 seções explorando ferramentas, configurações e diagnósticos, é hora de consolidar tudo em um fluxo de decisão prático. Esta seção fecha o capítulo com uma checklist de configuração mínima para cada ferramenta, uma tabela comparativa de latência, e um roteiro de exercícios que amarram os conceitos das seções anteriores.

:::objetivos
- Reunir as configurações essenciais de cada ferramenta em uma checklist
- Comparar latência, qualidade e complexidade de forma consolidada
- Escolher a ferramenta certa para cada cenário com um fluxograma de decisão
- Validar todo o conhecimento do capítulo com exercícios integradores
:::

## Checklist mínima por ferramenta

### Parsec (cliente no Deck, host no PC)

```terminal
# No Deck:
$ flatpak install flathub com.parsecgaming.parsec
$ flatpak override --user --device=all --socket=wayland --socket=x11 --share=network com.parsecgaming.parsec
$ systemctl --user enable --now pipewire-pulse

# No host (Windows/Linux):
# Edite config.txt:
host_video_codec = h264
host_video_bitrate = 50
host_video_fps = 60
host_gamepad = 1
host_allow_guests = 1

# Verificação rápida:
$ flatpak run com.parsecgaming.parsec &
# → Login → Host visível → Conectar → Overlay mostra HW decode
```

### Steam Remote Play

```terminal
# Zero instalação — já está no Steam.
# Ajustes em:
~/.local/share/Steam/config/streaming_config.vdf
# → HardwareEncoding=1, HardwareDecoding=1, LimitBandwidth=50000

# Verificação rápida:
# Steam → Configurações → Remote Play → Ativar Remote Play
# → Host aparece na biblioteca do Deck → Conectar
```

### Moonlight + Sunshine

```terminal
# No Deck:
$ flatpak install flathub com.moonlight_stream.Moonlight
$ flatpak override --user --device=all --socket=wayland --socket=x11 com.moonlight_stream.Moonlight

# No host:
$ sudo apt install sunshine   # (ou equivalente)
$ systemctl --user enable --now sunshine

# Pairing: abra Moonlight → anote PIN → https://localhost:47990 → digite PIN

# Verificação rápida:
# Moonlight vê o host Sunshine → Conectar → streaming inicia
```

### Chiaki (PS4/PS5 → Deck)

```terminal
$ flatpak install flathub re.chiaki.Chiaki
$ flatpak override --user --device=all re.chiaki.Chiaki
# Obter Account ID e configurar no app

# Verificação rápida:
# Chiaki → Host configurado com Account ID → Acordar PS → Conectar
```

## Tabela comparativa consolidada

| Dimensão | Parsec | Steam Link | Moonlight+Sunshine | Chiaki |
|---|---|---|---|---|
| Instalação | Flatpak + override | Nativo (zero) | Flatpak + override + Sunshine no host | Flatpak + override |
| Conta externa | Sim (Parsec) | Não (Steam) | Não | Sim (PSN) |
| Codecs | H.264, H.265 | H.264, H.265 | H.264, HEVC, AV1 | H.264 |
| Latência (local) | ★★★★★ | ★★★★☆ | ★★★★★ | ★★★★☆ |
| Qualidade visual | ★★★★☆ | ★★★★☆ | ★★★★★ | ★★★☆☆ |
| Cooperação remota | ★★★★★ (até 4) | ★★★☆☆ (Steam only) | ☆ (não suporta) | ☆ (não suporta) |
| Jogos fora da Steam | ★★★★★ | ★★☆☆☆ | ★★★★★ | ★★★★★ (PS) |
| Open source | Não | Não | Sim | Sim |
| Complexidade | Média | Baixa | Alta | Média |
| Headless host | Sim (VDD) | Não | Sim (config) | N/A |

## Fluxograma de decisão

```
O que você quer transmitir?
│
├─ Jogo da minha biblioteca Steam, só eu vou jogar
│   └─ Steam Remote Play (zero config, já funciona)
│
├─ Jogo de outra loja (Epic, GOG, etc.), só eu vou jogar
│   ├─ Host Windows → Parsec
│   └─ Host Linux   → Moonlight+Sunshine (ou Parsec, se tolerar beta)
│
├─ Jogo cooperativo local, amigos remotos
│   └─ Parsec (única opção que funciona bem)
│
├─ Jogo de PlayStation (PS4/PS5)
│   └─ Chiaki
│
├─ Quero a melhor qualidade de imagem possível
│   └─ Moonlight+Sunshine (HDR, AV1, HEVC alta qualidade)
│
└─ Quero acesso ao desktop remoto completo (não só jogos)
    └─ Parsec (melhor que RDP/VNC para uso geral)
```

## O comando que responde "qual ferramenta usar?"

Se você quer uma heurística de terminal, eis um script que sugere a ferramenta baseado em três perguntas:

```terminal
$ cat ~/lab/stream-picker.sh
#!/bin/bash
echo "=== Stream Picker ==="
read -p "O jogo está na Steam? (s/n): " steam
read -p "Vai jogar cooperativo? (s/n): " coop
read -p "O host é Windows? (s/n): " win

if [ "$coop" = "s" ]; then
    echo "→ Use Parsec (única opção viável para coop remoto)"
elif [ "$steam" = "s" ] && [ "$coop" = "n" ]; then
    echo "→ Use Steam Remote Play (zero configuração)"
elif [ "$win" = "s" ]; then
    echo "→ Use Parsec (melhor latência em Windows)"
else
    echo "→ Use Moonlight+Sunshine (melhor qualidade em Linux)"
fi
```

## O que aprendemos neste capítulo

O capítulo 70 percorreu o ecossistema de streaming no SteamOS além do Steam Remote Play nativo:

- **Seção 1** desenhou o mapa: Parsec para baixa latência e cooperação, Steam Link para conveniência, Moonlight+Sunshine para qualidade, Chiaki para PlayStation.
- **Seções 2–4** cobriram o Parsec do zero: instalação Flatpak, configuração de host, conexão do Deck e diagnóstico com overlay.
- **Seção 5** posicionou o Steam Remote Play como alternativa nativa, com suas vantagens (zero config) e limitações (só Steam, sem coop real).
- **Seção 6** explorou Moonlight+Sunshine e Chiaki, as alternativas open source que cobrem o que Parsec e Steam Link não cobrem.
- **Seção 7** mergulhou nos jogos cooperativos via streaming — o recurso matador do Parsec.
- **Seção 8** forneceu o arsenal de diagnóstico: `ping`, `iperf3`, `mtr`, `iw`, `vainfo`, `radeontop` e o script `stream-diag.sh`.
- **Seção 9** consolidou tudo em checklists, tabelas e um fluxograma de decisão.

O denominador comum é o terminal: mesmo com ferramentas gráficas como Parsec e Moonlight, os comandos de diagnóstico revelam o que está acontecendo de verdade — e foi essa a proposta do livro desde o capítulo 1.

## Exercícios integradores

1. **Monte o laboratório completo.** Instale as 4 ferramentas (Parsec, Steam Remote Play, Moonlight, Chiaki) e execute cada uma por 5 minutos. Anote, para cada ferramenta: latência (overlay ou ping), qualidade visual (sua percepção) e facilidade de configuração (1–5). Qual venceu em cada categoria?

2. **Teste de estresse cooperativo.** Junte 3 amigos. Você é o host (Deck ou PC). Transmita Overcooked, Gang Beasts e um jogo de luta (Street Fighter ou similar). Cada amigo se conecta via Parsec. Em qual jogo a latência foi mais perceptível? O número de jogadores afetou o desempenho?

3. **Simulação de rede ruim.** Use `tc` no host para adicionar 20 ms de latência e 1% de perda de pacotes. Teste as 3 ferramentas (Parsec, Steam Link, Moonlight). Qual delas lidou melhor com a rede degradada? Qual teve mais artefatos?

4. **Documente seu setup ideal.** Com base em tudo que aprendeu, escreva seu `config.txt` ideal do Parsec, suas configurações do Sunshine e do `streaming_config.vdf`. Salve em `~/lab/stream-setup/` como referência futura.

5. **Desafio.** Construa um script `stream-bench.sh` que: (a) mede ping, jitter e banda entre Deck e host; (b) inicia uma sessão de streaming (qualquer ferramenta); (c) coleta métricas de encode/decode/rede a cada 5 segundos por 1 minuto; (d) gera um relatório em markdown com tabela de médias, mínimos e máximos. Execute com cada ferramenta e compare os relatórios.