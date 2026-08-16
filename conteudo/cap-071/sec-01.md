## Onde o jogo realmente roda?

Imagine que você está com seu Steam Deck nas mãos, prestes a jogar. Onde, fisicamente, o jogo será executado? A resposta tem mais camadas do que parece: o Deck pode rodar jogos de quatro formas radicalmente diferentes, cada uma posicionando o "motor do jogo" num lugar distinto — dentro do seu hardware, traduzido por uma camada de compatibilidade, num PC gamer do outro lado da casa, ou num datacenter a centenas de quilômetros. Entender esse espectro é o primeiro passo para extrair o máximo do aparelho.

:::objetivos
- Mapear as quatro grandes categorias de execução: nativo Linux, Proton, streaming local e cloud
- Compreender o trade-off entre latência, compatibilidade, duração de bateria e fidelidade visual
- Entender por que o hardware modesto do Deck torna essas escolhas especialmente relevantes
- Visualizar o pipeline de renderização em cada modo de operação
- Identificar qual modo adotar conforme o contexto (mobilidade, tomada, rede disponível)
:::

## As quatro posições no espectro

O espectro vai de "tudo acontece aqui dentro" até "o Deck é só uma tela com controles".

### Nível 1 — Nativo Linux

O jogo foi compilado para Linux e roda direto sobre o kernel, conversando com drivers Mesa e Vulkan sem tradução. **É o caso ideal**: latência mínima, consumo reduzido, integração perfeita com o SteamOS. Exemplos: *Factorio*, *Hades*, *Celeste*, *Portal 2*.

**Desvantagem**: catálogo limitado, nem todo estúdio compila para Linux.

### Nível 2 — Proton (local traduzido)

O jogo é um binário Windows rodando sobre Proton, a camada da Valve que combina Wine, DXVK e VKD3D. Chamadas DirectX são traduzidas para Vulkan em tempo real: o jogo *acha* que está no Windows, mas o kernel recebe Vulkan puro. É a categoria que torna o Deck viável — *Elden Ring*, *Cyberpunk 2077*, *Baldur's Gate 3* estão aqui.

**Vantagem**: catálogo imenso, performance próxima do nativo na maioria dos casos.

**Desvantagem**: pequeno overhead de CPU, shader stutter no primeiro lançamento e incompatibilidades pontuais com anti-cheats de kernel.

:::info
**Na prática**: depois que os shaders são cacheados, a diferença entre nativo e Proton costuma ser negligenciável — às vezes o Proton chega a ser *mais rápido* que ports nativos malfeitos.
:::

### Nível 3 — Streaming local (Remote Play, Moonlight, Sunshine)

O jogo roda num PC mais potente na mesma rede local. O Deck não executa nada: ele decodifica vídeo e devolve inputs. A Valve chama isso de Remote Play; a comunidade consolidou Sunshine (servidor) + Moonlight (cliente).

**Vantagens**: qualidade máxima (ultra, ray tracing), bateria de 6-8 horas, ventoinha silenciosa.

**Desvantagens**: exige PC gamer ligado na rede e adiciona 5-20ms de latência.

### Nível 4 — Cloud gaming (GeForce Now, Xbox Cloud, Boosteroid)

O jogo roda num datacenter; o Deck vira um terminal de exibição puro.

**Vantagens**: não ocupa armazenamento, dispensa PC gamer em casa, entrega hardware impossível no Deck, bateria de 7+ horas.

**Desvantagens**: latência de 30-60ms, exige conexão estável de 15-25 Mbps, assinatura paga.

### Tabela comparativa

| Aspecto | Nativo | Proton | Stream Local | Cloud |
|---------|--------|--------|-------------|-------|
| Onde o jogo roda | Deck | Deck | PC na rede | Datacenter |
| Latência típica | <1ms | <1ms | 5-20ms | 30-60ms |
| Bateria | 1.5-3h | 1.5-3h | 6-8h | 7+h |
| Catálogo | ~15% Steam | ~95% Steam | Toda sua biblioteca | Limitado ao serviço |
| Qualidade visual | Limitada pelo HW | Limitada pelo HW | Ultra possível | Ultra possível |
| Exige internet? | Não | Não | Não (rede local) | Sim |

## O triângulo dos trade-offs

Escolher onde o jogo roda é escolher o que preservar e o que sacrificar. Três eixos formam o triângulo de decisão:

**Latência × Fidelidade**. Quanto mais perto o motor do jogo está dos seus olhos, menor a latência — mas menor a potência disponível. Rodar nativo limita você aos ~1.6 TFLOPS da APU Van Gogh; fazer streaming entrega a GPU de 20+ TFLOPS do PC, mas insere delay de rede.

**Compatibilidade × Autonomia**. Proton expande o catálogo, mas não resolve a bateria: o Deck ainda renderiza frames e drena em 2 horas. Cloud resolve bateria e compatibilidade ao mesmo tempo, mas prende a uma assinatura e à qualidade da conexão.

**Portabilidade × Poder**. Streaming local é ótimo em casa, mas não funciona no metrô; cloud depende de 5G ou Wi-Fi público confiável; nativo e Proton funcionam em qualquer lugar, offline — com hardware fixo.

:::dica
**Analogia do motorista**: rodar nativo/Proton é dirigir você mesmo — controle total, mas você cansa (bateria). Streaming local é ir de carona: relaxado, mas sem o volante. Cloud é táxi: resolve, mas custa e depende de haver motorista por perto.
:::

## Por que o Deck é o caso especial

Três características tornam o Deck particularmente sensível a essas escolhas:

**Hardware modesto, porém equilibrado**. A APU AMD Van Gogh (Zen 2 + RDNA 2, 4c/8t) entrega o poder de um PS4 mirando 800p em vez de 1080p. Jogos AAA recentes frequentemente exigem FSR e qualidade baixa para 30 FPS estáveis. O streaming elimina esse limite — trocando por latência.

**Bateria como fator limitante**. Com 40 Wh, o Deck LCD entrega de 1.5 a 8 horas conforme o modo. Rodar *Elden Ring* nativo (~2h) contra fazer stream dele (~7h) é a diferença entre acabar a bateria antes do almoço ou jogar o dia todo.

**Tela 800p**. Renderizar em 1280×800 é ~55% mais barato que 1080p e ~73% mais barato que 1440p, o que torna o hardware modesto aceitável. No streaming, a resolução reduz a banda exigida: um stream 800p a 60 FPS consome ~10-15 Mbps em HEVC.

Vejamos o que o Deck tem por dentro:

```terminal
$ vulkaninfo --summary | head -30

==========
VULKANINFO
==========

Vulkan Instance Version: 1.3.280

Instance Extensions: count = 22
-------------------------------
VK_EXT_acquire_drm_display             : extension revision 1
VK_EXT_debug_report                    : extension revision 10
VK_EXT_debug_utils                     : extension revision 2
VK_EXT_direct_mode_display             : extension revision 1
VK_EXT_display_surface_counter         : extension revision 1
VK_KHR_device_group_creation           : extension revision 1
...

Device Properties and Extensions:
=================================
GPU0:
  apiVersion         = 1.3.287 (4213141511)
  driverVersion      = 23.3.6 (96469510)
  vendorID           = 0x1002 (AMD)
  deviceID           = 0x1435
  deviceType         = PHYSICAL_DEVICE_TYPE_INTEGRATED_GPU
  deviceName         = AMD Custom GPU 0405 (RADV VANGOGH)
  driverName         = radv
  driverInfo         = Mesa 24.2.4
```

Note `deviceType = PHYSICAL_DEVICE_TYPE_INTEGRATED_GPU`: uma GPU integrada, competente para 800p, mas com teto claro. O driver RADV (Vulkan da Mesa) é o mesmo no modo nativo e via Proton/DXVK, o que explica a eficiência da tradução DirectX→Vulkan.

E confirmando que não há GPU dedicada escondida:

```terminal
$ lspci | grep -iE "vga|3d|display"
04:00.0 VGA compatible controller: Advanced Micro Devices, Inc. [AMD/ATI] VanGogh [Aerith] (rev ae)
```

Apenas a APU. Sem dGPU, sem eGPU — arquiteturalmente, o Deck é um laptop compacto.

## O pipeline de renderização em cada modo

Visualizar o caminho de um frame ajuda a entender onde a latência e a fidelidade são ganhas ou perdidas.

### Modo Nativo/Proton

```
[Input] → [Game Logic (CPU Deck)] → [Render (GPU Deck)] → [Display (800p)]
                                                              ↑
                                                   Latência: ~16-33ms
                                                   (1-2 frames a 60 FPS)
```

Tudo dentro do Deck. Latência é o tempo de frame (~16.6ms a 60 FPS). GPU integrada é o gargalo.

### Modo Streaming Local

```
[Input Deck] → [Rede local → PC host] → [Game Logic + Render (GPU host)]
       ↑                                                              ↓
       └─────────── [Rede local ← Stream HEVC/H.265] ←───────────────┘
       
[Decodificação HW (Deck)] → [Display (800p)]
                             
Latência: ~20-50ms (encode + rede + decode)
```

O Deck vira decodificador de vídeo com controles. O chip Van Gogh decodifica HEVC/H.264 em hardware, consumindo miliwatts. A GPU 3D fica ociosa.

### Modo Cloud

```
[Input Deck] → [Internet → Datacenter] → [Game Logic + Render (GPU servidor)]
       ↑                                                                   ↓
       └───────────── [Internet ← Stream codificado] ←────────────────────┘

[Decodificação HW (Deck)] → [Display (800p)]

Latência: ~40-100ms (variável conforme rede e distância)
```

Similar ao streaming local, mas o gargalo é a internet: cada pacote atravessa roteadores, switches e cabos de fibra. Latência inevitavelmente maior e variável.

:::atencao
**Latência não é só número**: em fighting games, FPS competitivo e rhythm games, 50ms extras são a diferença entre acertar o parry e tomar o hit. Em RPGs de turno ou estratégia, 100ms são irrelevantes. O gênero pesa tanto quanto a infraestrutura na escolha do modo.
:::

## Cenários: quando cada modo brilha

Vejamos o cotidiano da jogadora **ana** com seu Steam Deck:

**Metrô, offline, 40 minutos**. Ana quer jogar *Hades* (nativo Linux). Sem rede, só há uma opção real: local. Bateria dura o trajeto inteiro.

**Sala de casa, PC gamer com RTX 4070**. Ana quer *Alan Wake 2* no ultra. O Deck sofre para passar de 25 FPS no low. Moonlight resolve: ultra a 60 FPS, 7 horas de bateria.

**Hotel, Wi-Fi instável, sem PC por perto**. Ana quer *Baldur's Gate 3*. Roda a ~30 FPS com FSR equilibrado — perfeitamente jogável para RPG de turno. Wi-Fi do hotel não aguenta cloud. Melhor escolha: Proton local.

**Casa, fibra 500 Mbps, GeForce Now Ultimate**. Ana quer *Cyberpunk 2077* com ray tracing no talo. O Deck mal chega a 30 FPS no low. GeForce Now entrega RT Overdrive a 60 FPS — latência de ~30ms, aceitável para FPS casual.

O que esses cenários revelam: **o Deck é mais poderoso quando você domina o espectro e escolhe o modo certo para cada situação**. A jogadora que só usa Proton deixa performance na mesa; a que só usa cloud se limita a ter internet boa; quem domina as quatro posições joga qualquer coisa, em qualquer lugar.

Vamos verificar a conectividade que serve de fundação para modos de streaming:

```terminal
## Verifica a interface de rede ativa
$ ip -br addr show | grep -v lo
wlan0    UP     192.168.1.105/24

## Testa latência na rede local (gateway)
$ ping -c 3 192.168.1.1
PING 192.168.1.1 (192.168.1.1) 56(84) bytes of data.
64 bytes from 192.168.1.1: icmp_seq=1 ttl=64 time=2.11 ms
64 bytes from 192.168.1.1: icmp_seq=2 ttl=64 time=1.87 ms
64 bytes from 192.168.1.1: icmp_seq=3 ttl=64 time=1.93 ms

--- 192.168.1.1 ping statistics ---
3 packets transmitted, 3 received, 0% packet loss
time 2003ms
rtt min/avg/max/mdev = 1.870/1.970/2.110/0.102 ms
```

Latência local de ~2ms — excelente para streaming local. Nas próximas seções, exploraremos cada modo em profundidade: configurar Proton para títulos problemáticos, montar um servidor Sunshine e otimizar serviços de cloud gaming no Steam Deck.

## Resumo

- O Steam Deck executa jogos em quatro pontos do espectro: nativo Linux, Proton (tradução local), streaming local e cloud gaming
- O trade-off fundamental envolve latência, fidelidade visual, duração de bateria e dependência de rede
- O Deck tem hardware modesto (~PS4, 800p), bateria de 40 Wh e tela de baixa resolução — fatores que tornam o streaming atraente
- Streaming local e cloud transformam o Deck em decodificador de vídeo, entregando qualidade que o hardware local não alcançaria
- Latência é o calcanhar de Aquiles do streaming: irrelevante em RPGs, crítica em jogos de ritmo
- Dominar o espectro significa escolher o modo certo para cada contexto

## Exercícios

1. Liste os quatro modos de execução do espectro e anote, para cada um, uma vantagem e uma desvantagem que você considera mais relevante para seu uso pessoal do Steam Deck.

2. No terminal do Steam Deck, execute `vulkaninfo --summary` e identifique o `deviceName` e `driverVersion`. Esses são os mesmos componentes usados tanto por jogos nativos Vulkan quanto por DXVK (Proton). Explique com suas palavras por que isso é relevante para a eficiência do Proton.

3. Meça a latência da sua rede local usando `ping -c 5 <gateway>` e estime se sua infraestrutura atual suportaria streaming local confortável (latência < 5ms é ideal, < 15ms é aceitável). Documente o resultado.

4. Escolha três jogos da sua biblioteca Steam e classifique cada um em qual(is) modo(s) do espectro eles rodariam bem no Steam Deck, justificando com base no gênero (latência tolerável?) e exigência gráfica (hardware local aguenta?).

5. **Desafio integrador**: Projete um "plano de jogo" para um dia inteiro fora de casa com o Steam Deck: manhã no transporte público (offline), tarde num café com Wi-Fi público e noite em casa. Para cada período, escolha um modo do espectro e um jogo compatível. Justifique cada escolha considerando bateria restante estimada, conectividade disponível e adequação do gênero ao modo.