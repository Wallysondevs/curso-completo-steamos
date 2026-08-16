O pareamento foi só o começo. Sunshine e Moonlight oferecem controle fino sobre encoder, bitrate, resolução, codec e FPS. A configuração padrão é segura e funciona, mas o objetivo deste capítulo é extrair o máximo: imagem nítida, latência mínima e zero artefatos — ou, alternativamente, economia de bateria e banda.

:::objetivos
- Configurar o encoder correto no Sunshine (NVENC, AMF, VAAPI, Software)
- Escolher resolução, FPS e aspect ratio ideais para o Deck
- Ajustar bitrate e entender VBR vs CBR
- Selecionar codec: H.264, HEVC ou AV1
- Configurar áudio (stereo, surround) e HDR
:::

## Encoder: o coração do Sunshine

Na aba **Configuration** → **Video** do Sunshine (`https://localhost:47990`), o campo **Encoder** define qual hardware faz a compressão:

| Encoder | GPUs | Qualidade | Latência |
|---------|------|-----------|----------|
| **NVENC** | NVIDIA GTX 900+ | Excelente | Baixíssima |
| **AMF** | AMD RX 400+ | Muito boa | Baixa |
| **QSV** | Intel Arc / iGPU | Boa | Baixa |
| **VAAPI** | Linux genérico | Variável | Média |
| **Software** | CPU | Ruim para jogos | Alta |

O Sunshine detecta automaticamente o melhor encoder disponível. Para forçar manualmente, edite `sunshine.conf`:

```ini
# Forçar NVENC (NVIDIA)
encoder = nvenc

# Forçar AMF (AMD)
encoder = amf

# Forçar VAAPI (Linux)
encoder = vaapi
```

### NVENC: ajustes por preset

No Windows, o NVENC expõe presets de qualidade. No Sunshine, a configuração `nvenc_preset` controla:

| Preset | Uso |
|--------|-----|
| `p1` | Mais rápido, menor latência, qualidade OK |
| `p2`–`p4` | Equilíbrio |
| `p5`–`p7` | Melhor qualidade, latência ligeiramente maior |

Recomendação para o Deck: `p3` ou `p4` para 60 fps, `p2` para 90 fps.

## Resolução, FPS e aspect ratio

O Deck tem tela nativa de **1280×800** (16:10). O streaming deve casar com essa resolução para evitar scaling desnecessário:

| Resolução | Aspect | Quando usar |
|-----------|--------|-------------|
| `1280x800` | 16:10 | Nativa do Deck — melhor qualidade sem scaling |
| `1280x720` | 16:9 | Jogos 16:9 sem barras, pequeno scaling vertical |
| `1920x1080` | 16:9 | Supersampling: o host renderiza em 1080p, o Deck downsample para 800p — imagem mais nítida |
| `2560x1600` | 16:10 | Supersampling máximo; host potente, jogo leve |
| `3840x2160` | 16:9 | Overkill; só para testar limites da rede |

**FPS**: o Deck LCD faz 60 Hz, o OLED faz 90 Hz. Configure o Sunshine para o FPS máximo que seu host consegue manter estável no jogo alvo. Transmitir a 90 fps com quedas é pior que 60 fps sólido.

Na aba Configuration → Video:

- **Resolution**: `1280x800` ou `1920x1080` (supersample)
- **FPS**: `60` ou `90`

No Moonlight (linha de comando), é possível sobrescrever:

```terminal
$ moonlight stream 192.168.1.100 --resolution 1280x800 --fps 60
```

## Bitrate: quanto mais, melhor (até certo ponto)

Bitrate controla quantos bits por segundo o encoder gasta. Mais bits = menos artefatos, mas também mais latência de rede e consumo de bateria no Deck.

Faixas recomendadas para H.264/HEVC em 1280×800:

| Bitrate (Kbps) | Qualidade | Uso |
|----------------|-----------|-----|
| 10.000–20.000 | Aceitável | Jogos lentos, economia de bateria |
| 20.000–40.000 | Boa | Uso geral, single-player |
| 40.000–80.000 | Excelente | Jogos rápidos, muitos detalhes |
| 80.000–150.000 | Overkill | Só perceptível em cenas muito complexas |

### CBR vs VBR

- **CBR (Constant Bitrate)**: o encoder gasta sempre os mesmos bits. Latência previsível, ideal para streaming de jogos.
- **VBR (Variable Bitrate)**: gasta mais em cenas complexas e menos nas simples. Economiza banda mas pode causar picos de latência.

No Sunshine:

```ini
# Forçar CBR (recomendado para jogos)
cbr = 1
vbr = 0
```

## Codecs: H.264, HEVC, AV1

O Moonlight e o Sunshine negociam o codec automaticamente, mas você pode forçar:

```terminal
$ moonlight stream 192.168.1.100 --codec hevc
```

| Codec | Vantagens | Deck suporta? |
|-------|-----------|---------------|
| **H.264** | Compatibilidade máxima, baixo custo de decode | Sim |
| **HEVC (H.265)** | 30-50% melhor qualidade no mesmo bitrate | Sim |
| **AV1** | Qualidade ainda melhor, mas exige hardware recente | Não (decode via software, pesado) |

No Deck, **HEVC é a escolha certa**. Ele oferece a melhor relação qualidade/bitrate com decodificação por hardware. H.264 use apenas para compatibilidade (smartphone antigo como cliente, por exemplo).

No Sunshine, em Configuration → Video:

```ini
codec = hevc
```

Se o Sunshine estiver no Linux com GPU AMD, o suporte a HEVC via AMF/VAAPI requer a flag `--hevc` na inicialização. No Flatpak, isso já vem habilitado por padrão nas versões recentes.

## Áudio e HDR

### Áudio

O Sunshine captura o áudio do sistema do host. Nas configurações:

- **Audio Sink**: no Windows, `{dd0e7f53-...}` (alto-falantes padrão); no Linux, o nome do sink PipeWire/PulseAudio.
- **Channels**: `stereo` (padrão) ou `5.1`/`7.1` se o Deck estiver conectado a um sistema surround.
- **Bitrate**: 96–320 Kbps. 192 Kbps é suficiente para jogos.

Para listar os sinks disponíveis no Linux:

```terminal
$ pactl list short sinks
0       alsa_output.pci-0000_09_00.4.analog-stereo      PipeWire        s16le 2ch 48000Hz       RUNNING
```

Copie o nome do sink e cole na configuração do Sunshine.

### HDR

Se o host e o monitor suportam HDR e o jogo também, o Sunshine (≥ 0.23) pode transmitir HDR para o Deck OLED. Requer:

- Sunshine configurado com `hdr = 1`
- Moonlight com suporte a HDR (versão ≥ 5.0)
- Codec HEVC Main 10 (10-bit)
- Resolução e FPS compatíveis com HDR

No Deck LCD (sem HDR), deixe desabilitado — a imagem fica lavada se o host renderizar HDR e o cliente não souber interpretar.

## Perfis de configuração: templates

Monte dois perfis no Sunshine e salve como presets mentais:

**Perfil "Qualidade" (single-player imersivo):**

```ini
resolution = 1920x1080
fps = 60
bitrate = 60000
codec = hevc
cbr = 1
preset = p4
```

**Perfil "Performance" (competitivo / multiplayer):**

```ini
resolution = 1280x800
fps = 90
bitrate = 40000
codec = hevc
cbr = 1
preset = p1
```

No Moonlight, o bitrate pode ser ajustado no seletor de qualidade da GUI (Low, Medium, High, Custom) antes de iniciar o stream.

## Resumo

- Escolha o encoder de hardware: NVENC > AMF > QSV > VAAPI > Software.
- Resolução ideal para o Deck: 1280×800 (nativa) ou 1920×1080 (supersampling).
- FPS: 60 (LCD) ou 90 (OLED), mas só se o host mantiver estável.
- Bitrate 40-60 Mbps com HEVC é o sweet spot para 1280×800 a 60 fps.
- CBR é preferível a VBR para latência previsível.
- HEVC é o melhor codec para o Deck (decodificação por hardware).
- HDR funciona no Deck OLED com Sunshine ≥ 0.23 e HEVC Main 10.

## Exercícios

1. No Sunshine, identifique o encoder ativo na aba Configuration → Video. Se for Software, troque para o de hardware e reinicie o Sunshine.
2. Configure o Sunshine para 1280×800, 60 fps, HEVC, CBR e 50 Mbps. Inicie um stream de um jogo com cenas escuras e verifique se há banding ou artefatos.
3. Compare H.264 vs HEVC no mesmo bitrate (30 Mbps). Use `moonlight stream --codec h264` e depois `--codec hevc`. Qual apresenta menos artefatos em movimento?
4. No Linux, liste os sinks de áudio com `pactl list short sinks` e identifique qual está ativo. Confirme que o Sunshine está usando o sink correto.
5. **Desafio.** Crie um script que alterne entre dois perfis de Sunshine editando `sunshine.conf` e reiniciando o serviço. Teste a diferença de latência entre `p1` e `p5` no NVENC usando o overlay de estatísticas do Moonlight.