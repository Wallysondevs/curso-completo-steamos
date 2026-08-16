O `xrandr` é a ferramenta tradicional de controle de modos de vídeo no Linux X11, e embora o SteamOS use Wayland (via gamescope), o `xrandr` ainda funciona para consultas e, em alguns contextos, para forçar modos. Esta seção detalha o que ele expõe sobre refresh rate, como ajustá-lo e o que a GPU informa sobre o display por outros caminhos.

:::objetivos
- Listar refresh rates disponíveis com `xrandr --query`
- Trocar o refresh rate de um display em tempo real
- Inspecionar o clock da GPU e sua relação com as taxas disponíveis
- Entender as limitações do `xrandr` num sistema Wayland
:::

## Lendo a lista de modos

O `xrandr` sem argumentos lista conectores, resoluções e taxas. Cada modo é uma combinação de resolução + refresh rate, e a lista revela o cardápio que o monitor (ou painel embutido) declarou ao sistema.

```terminal
$ xrandr --query
Screen 0: minimum 16 x 16, current 1280 x 800, maximum 32767 x 32767
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 160mm x 100mm
   1280x800      90.00*+  45.00    40.00    60.00
DP-1 disconnected (normal left inverted right x axis y axis)
HDMI-A-1 disconnected (normal left inverted right x axis y axis)
```

A tela do Deck (`eDP-1`) está ativa em 90 Hz, e oferece também 45, 40 e 60 Hz. Os conectores externos (`DP-1`, `HDMI-A-1`) estão desconectados. Quando plugados, cada um lista seus próprios modos, e a taxa disponível depende tanto do monitor quanto do cabo.

:::info
No Steam Deck, o conector USB-C com DisplayPort Alt Mode pode exportar 4K a 60 Hz ou 1440p a 120/144 Hz, dependendo da versão do dock e do monitor. O conector HDMI de alguns docks é limitado a 4K a 30 Hz — algo que o `xrandr` denuncia na hora.
:::

## Trocando o refresh rate

A troca de taxa pelo `xrandr` é feita com a flag `--rate` e o nome do conector:

```terminal
$ xrandr --output eDP-1 --mode 1280x800 --rate 40
$ xrandr --query | grep eDP-1 -A4
eDP-1 connected primary 1280x800+0+0 (normal left inverted right x axis y axis) 160mm x 100mm
   1280x800      90.00+   45.00    40.00*   60.00
```

Repare que o `*` agora está em 40.00, indicando que o painel mudou para 40 Hz. A troca é imediata; a tela pisca brevemente e volta. No Wayland, porém, o `xrandr` mexe apenas com o XWayland — o compositor (gamescope) não é afetado diretamente, então o refresh que o jogo vê pode não mudar. No Modo Jogo, a troca pelo menu é sempre preferível.

## O que o clock da GPU diz

O clock da GPU (sclk) está diretamente ligado à carga de renderização, e a carga depende do FPS que você pede. O kernel expõe os clocks suportados e o ativo em arquivos do DRM.

```terminal
$ cat /sys/class/drm/card0/device/pp_dpm_sclk
0: 200Mhz
1: 300Mhz
2: 500Mhz
3: 700Mhz
4: 900Mhz
5: 1100Mhz
6: 1300Mhz
7: 1500Mhz
8: 1600Mhz *
```

Com o jogo rodando sem limite, a GPU sobe ao degrau mais alto (1600 MHz). Travar em 40 FPS derruba esse degrau, frequentemente para 700–900 MHz em títulos mais leves. Menos clock significa menos watts, e o Deck aquece menos e ventila menos. É o mecanismo mais direto de economia de bateria que o usuário tem — e ele começa com o refresh rate.

## xrandr num mundo Wayland

O SteamOS roda gamescope como compositor Wayland, e o `xrandr` só vê os clientes XWayland (que são os jogos rodando via X11 traduzido). Isso tem consequências práticas: `xrandr --rate` pode afetar a sessão XWayland, mas o gamescope retoma o controle no próximo ciclo, e a alteração se perde. Para consultas, o `xrandr` é confiável; para alterações, prefira o menu do Modo Jogo ou `gamescope -r`.

Para ver os modos como o kernel os entende (sem a camada Wayland), o `cat` direto do sysfs é mais confiável:

```terminal
$ cat /sys/class/drm/card0-eDP-1/modes
1280x800
1280x800
1280x800
1280x800
```

Cada linha é um modo (resolução), e a ordem indica preferência. As taxas associadas não aparecem nesse arquivo simples; para tê-las, o caminho é o EDID do painel em `/sys/class/drm/card0-eDP-1/edid`, um binário que decodificadores como `edid-decode` transformam em tabela.

:::dica
Instale o pacote `edid-decode` com `sudo apt install edid-decode` (ou o equivalente no SteamOS, se disponível) e rode `cat /sys/class/drm/card0-eDP-1/edid | edid-decode` para ver o cardápio completo do painel como o monitor o declarou — inclusive as taxas exatas, tempos de blanking e capacidades de cor.
:::

## Resumo

- `xrandr --query` lista conectores, resoluções e refresh rates disponíveis.
- `xrandr --output eDP-1 --rate 40` troca o refresh, mas no Wayland o efeito pode ser efêmero.
- `pp_dpm_sclk` mostra o clock ativo da GPU, que cai com o refresh rate menor.
- No SteamOS Wayland, o gamescope é o controlador real; `xrandr` serve mais para consulta.
- `/sys/class/drm/card0-eDP-1/edid` contém o EDID do painel, decodificável com `edid-decode`.
- O conector USB-C (DisplayPort Alt Mode) do Deck suporta taxas altas que o `xrandr` expõe quando o monitor é plugado.

## Exercícios

1. Liste os modos do painel com `xrandr --query` e anote quais refresh rates estão disponíveis.
2. Troque o refresh rate com `xrandr --output eDP-1 --rate 40` e confirme a mudança olhando o `*` na lista.
3. Antes e depois de limitar o FPS, leia `cat /sys/class/drm/card0/device/pp_dpm_sclk` e anote a mudança de degrau.
4. Conecte um monitor externo e compare as taxas disponíveis no `xrandr` para `DP-1` vs `HDMI-A-1`.
5. **Desafio.** Instale o `edid-decode`, decodifique o EDID do painel e identifique, na tabela de *detailed timings*, o modo de 40 Hz — explicando por que ele aparece no `xrandr` ou não.