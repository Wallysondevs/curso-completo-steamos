Cloud gaming não compete com jogos nativos no Steam Deck — complementa. A mesma máquina que roda *Hades* a 90 FPS nativos pode transmitir *Starfield* do datacenter a 60 FPS, alternando entre os dois mundos com um botão. Esta seção fecha o capítulo mostrando como os atalhos de cloud gaming se integram ao Modo Jogo, convivem com ferramentas como Decky Loader e EmuDeck, e se beneficiam de recursos do SteamOS como FSR, limite de TDP e perfis de desempenho por jogo.

:::objetivos
- Integrar atalhos de cloud gaming à biblioteca Steam com identidade visual
- Configurar perfis de desempenho por jogo para streaming
- Entender a convivência com Decky Loader, EmuDeck e plugins
- Automatizar a alternância entre streaming e jogos nativos
- Planejar uma biblioteca híbrida: nuvem + local + emulação
:::

## Atalhos de cloud gaming como cidadãos de primeira classe

Os atalhos que você criou nas seções [2](#/cap-066/sec-02) e [5](#/cap-066/sec-05) são tratados pelo Steam como jogos. Isso significa que cada um herda todas as funcionalidades do Modo Jogo: perfil de desempenho, layout de controle, arte personalizada, notas e até compatibilidade forçada com Proton — embora esta última seja irrelevante para atalhos de navegador.

```terminal
$ ls ~/.steam/steam/userdata/*/config/localconfig.vdf
/home/deck/.steam/steam/userdata/12345678/config/localconfig.vdf
```

O `localconfig.vdf` armazena os metadados de cada entrada da biblioteca: nome, arte, layout de controle associado e configurações de compatibilidade. É esse arquivo que o Steam lê quando você abre o Modo Jogo. Se você perder os atalhos após uma atualização do Steam, restaurar o backup desse arquivo (e da pasta `grid/`) resolve.

:::dica
Mantenha um backup de `~/.steam/steam/userdata/` antes de atualizações grandes do SteamOS (ex.: 3.6 → 3.7). Atualizações do canal Stable não costumam apagar atalhos, mas o canal Beta e Preview podem reescrever o `localconfig.vdf`.
:::

## Perfis de desempenho para streaming

O Quick Access ([[...]]) permite configurar TDP, GPU clock, scaling filter e limite de FPS por jogo. Para atalhos de cloud gaming, a recomendação é o oposto dos jogos nativos:

| Parâmetro | Valor recomendado | Motivo |
|---|---|---|
| TDP | 4-5 W | O Deck está só decodificando vídeo; 15 W é desperdício |
| GPU Clock | Padrão | O decoder VCN opera independentemente do clock 3D |
| Scaling Filter | Linear ou Integer | FSR pode introduzir artefatos no stream comprimido |
| Limite de FPS | 60 | Sincronizado com o stream (60 FPS) |
| Perfil de desempenho | Salvar como "Cloud Gaming" | Reutilize para todos os atalhos de streaming |

```terminal
$ cat /sys/class/power_supply/BAT1/power_now
8500000
$ echo "4000000" | sudo tee /sys/class/power_supply/BAT1/power_now
```

O `power_now` está em microwatts. 8.500.000 µW = 8,5 W de consumo total do sistema durante streaming. Com TDP limitado a 4 W pelo Quick Access, o consumo cai para ~6 W totais — dobrando a autonomia de bateria comparado a um jogo nativo (que consome 15-22 W).

## Decky Loader e plugins relevantes

O [Decky Loader](/cap-039) é o gerenciador de plugins mais popular do SteamOS. Três plugins são particularmente úteis para cloud gaming:

**SteamGridDB**: integra o banco de imagens direto no menu do Steam, permitindo trocar a arte de qualquer atalho sem sair do Modo Jogo. Essencial para manter a biblioteca visualmente consistente.

**PowerTools**: desbloqueia controle fino sobre clocks de CPU e GPU além do que o Quick Access oferece. Para cloud gaming, você pode desabilitar núcleos da CPU que não são usados na decodificação, reduzindo ainda mais o consumo.

**CSS Loader**: cosmético, mas trocar o tema do Steam enquanto joga na nuvem ajuda a separar mentalmente jogos nativos de jogos em streaming.

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
```

A instalação do Decky é um script que adiciona um serviço systemd. Após instalar, o ícone do Decky aparece no menu Quick Access. Os plugins são instalados de dentro da loja do Decky, no Modo Jogo.

:::atencao
O PowerTools permite configurar clocks que podem travar o Deck se usados incorretamente. Para cloud gaming, a única configuração segura é reduzir o número de núcleos ativos (de 8 para 4) e manter clocks em Auto. Nunca faça overclock para streaming — não há benefício.
:::

## A biblioteca híbrida: nuvem + local + emulação

O Steam Deck é três consoles em um: roda jogos Steam nativos (Linux ou Proton), transmite jogos AAA da nuvem e emula consoles antigos via EmuDeck. Organizar a biblioteca para refletir essas três fontes evita a sensação de fragmentação.

Uma estratégia eficaz é usar coleções do Steam (as "categorias" da biblioteca) com nomes descritivos:

```
🎮 Nativos        → jogos instalados localmente
☁️ Cloud Gaming   → GeForce NOW, Xbox Cloud Gaming
🕹️ Emulação       → EmuDeck / RetroArch
📺 Streaming      → Remote Play, Steam Link
```

O Steam respeita coleções tanto no Modo Desktop quanto no Modo Jogo. No Modo Jogo, pressione [[Steam]] > **Biblioteca** > [[R1]] para filtrar por coleção. Em dois cliques você alterna entre jogar algo local, transmitir da nuvem ou abrir um emulador.

```terminal
$ ls ~/Emulation/roms/
nes/  snes/  genesis/  n64/  psx/  ps2/  gc/  wii/  switch/  arcade/
```

O EmuDeck cria essa árvore de diretórios automaticamente. Os atalhos de cloud gaming (GeForce NOW e xCloud) ficam na biblioteca Steam lado a lado com os emuladores — o Steam não distingue entre um executável Flatpak, um script shell ou um ROM launcher. Tudo é "jogo".

## Automatizando a alternância

Três scripts pequenos podem facilitar a vida no Modo Desktop:

**`~/.local/bin/cloud-ready.sh`** — prepara o Deck para streaming (limita TDP, desliga Bluetooth se não estiver usando controle externo, ajusta brilho):

```bash
#!/bin/bash
# Reduz TDP para 5W e brilho para 50%
echo 5000000 | sudo tee /sys/class/power_supply/BAT1/power_now
brightnessctl set 50%
rfkill block bluetooth
echo "Modo cloud gaming ativado"
```

**`~/.local/bin/cloud-off.sh`** — restaura o perfil normal após o streaming:

```bash
#!/bin/bash
# Restaura limite padrão e reativa Bluetooth
echo 15000000 | sudo tee /sys/class/power_supply/BAT1/power_now
rfkill unblock bluetooth
echo "Modo normal restaurado"
```

**`~/.local/bin/check-cloud-latency.sh`** — script rápido que faz ping nos dois serviços e reporta qual está melhor naquele momento:

```bash
#!/bin/bash
nvidia=$(ping -c 5 -q static-01.nvidia.com 2>&1 | tail -1 | awk '{print $4}' | cut -d'/' -f2)
msft=$(ping -c 5 -q xbox.com 2>&1 | tail -1 | awk '{print $4}' | cut -d'/' -f2)
echo "NVIDIA: ${nvidia}ms | Microsoft: ${msft}ms"
```

## Resumo

- Os atalhos de cloud gaming são cidadãos de primeira classe no Steam: herdam perfis de desempenho, layouts de controle e arte.
- Para streaming, reduza o TDP para 4-5 W; o decoder VCN opera com consumo mínimo.
- Plugins do Decky Loader como SteamGridDB e PowerTools complementam a experiência de cloud gaming.
- Coleções do Steam organizam a biblioteca híbrida: nativos, cloud, emulação e streaming local.
- Scripts simples automatizam a alternância entre modo cloud e modo nativo.

## Exercícios

1. Crie as coleções "Cloud Gaming", "Nativos" e "Emulação" na sua biblioteca Steam e organize todos os atalhos existentes.
2. Com um jogo na nuvem rodando, reduza o TDP para 4 W no Quick Access. A qualidade do stream é afetada? Monitore a temperatura da APU com `sensors`.
3. Instale o Decky Loader e o plugin SteamGridDB. Troque a arte de um atalho de cloud gaming sem sair do Modo Jogo.
4. Crie o script `cloud-ready.sh` e execute-o antes de uma sessão de streaming. Todos os comandos funcionam sem erro?
5. **Desafio.** Escreva um script que detecte automaticamente quando um atalho de cloud gaming está rodando (monitore processos do Chrome/Edge) e aplique o perfil de economia de energia. Use `pgrep`, `systemctl` e os controles do kernel em `/sys/class/`.