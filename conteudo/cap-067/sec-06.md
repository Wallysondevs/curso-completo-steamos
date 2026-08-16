Console não é a única fonte de streaming. Se você tem um PC gamer potente em casa — seja Windows ou Linux — o Steam Deck pode funcionar como um terminal fino, recebendo o vídeo dos jogos mais pesados que rodam no desktop. O Moonlight é o cliente de código aberto que implementa o protocolo GameStream da NVIDIA, e o Sunshine é o servidor que substitui a tecnologia proprietária da NVIDIA por uma alternativa aberta, compatível com GPUs AMD, Intel e NVIDIA. Juntos, formam a plataforma de streaming mais flexível disponível para o Deck.

:::objetivos
- Entender o ecossistema Moonlight/Sunshine e como ele difere do Steam Remote Play
- Instalar o Sunshine em um PC host com GPU NVIDIA, AMD ou Intel
- Configurar o Moonlight como cliente no Steam Deck
- Comparar qualidade e latência com Chiaki e Greenlight
- Ajustar parâmetros avançados de encode por hardware
:::

## Por que Moonlight/Sunshine em vez do Steam Remote Play

O Steam Remote Play já vem embutido no SteamOS e funciona bem para transmitir jogos da sua biblioteca Steam de outro PC. A limitação aparece quando você quer transmitir jogos fora da Steam, usar o desktop remoto para tarefas além de jogos, ou quando o host tem uma GPU que o Steam Remote Play não otimiza bem.

O Sunshine resolve isso ao expor um servidor de streaming que qualquer cliente compatível com GameStream pode acessar — incluindo o Moonlight no Deck. As vantagens:

- **Suporte universal a GPUs:** NVIDIA, AMD e Intel com encode por hardware.
- **Mais codecs:** H.264, HEVC (H.265) e AV1 nos hardwares mais recentes.
- **Resoluções customizadas:** inclusive 1280x800 nativa do Deck.
- **Menor overhead:** o Sunshine é mais leve que o Steam Remote Play em hardware modesto.
- **Desktop remoto:** transmite a área de trabalho inteira, não só jogos.

```terminal
## Comparação de latência típica (rede cabeada, 1080p 60 FPS):
## Steam Remote Play:  15-25 ms
## Moonlight/Sunshine: 8-15 ms
## Chiaki (local):     10-20 ms
## Greenlight (local): 12-22 ms
```

## Instalando o Sunshine no PC host

O Sunshine roda no PC que vai transmitir os jogos. Ele está disponível para Windows, Linux e macOS. No Linux (Ubuntu/Debian), a instalação é simples:

```terminal
## No PC host (Ubuntu 24.04):
$ sudo add-apt-repository ppa:cgutman/sunshine
$ sudo apt update
$ sudo apt install sunshine
$ systemctl --user enable sunshine
$ systemctl --user start sunshine
```

No Windows, o instalador está disponível no GitHub oficial do projeto. Após instalar, o Sunshine abre uma interface web em `https://localhost:47990` para configuração:

```terminal
## Acesse no navegador do PC host:
## https://localhost:47990
## Usuário padrão: sunshine
## Senha padrão: sunshine (altere no primeiro login)
```

A interface web permite configurar codecs, resoluções, taxas de quadros e ajustes finos de encode. Para GPUs AMD e Intel, o Sunshine usa VA-API; para NVIDIA, pode usar NVENC diretamente.

```terminal
## Configuração recomendada no Sunshine (aba "Video"):
## Encoder: NVENC (NVIDIA) / VA-API (AMD/Intel)
## Codec: HEVC (H.265) para melhor qualidade/bitrate
## Resolução: 1280x800 (nativa do Deck) ou 1920x1080
## FPS: 60
## Bitrate máximo: 30000 kbps
```

:::dica
Definir a resolução do Sunshine como 1280x800 (a resolução nativa do Deck) elimina uma etapa de scaling e reduz o uso de GPU tanto no host quanto no cliente. Os 80 pixels a menos em relação a 720p são insignificantes visualmente, mas ajudam a manter o encode no caminho rápido do hardware.
:::

## Instalando o Moonlight no Steam Deck

O Moonlight está disponível como Flatpak no Discover do SteamOS:

```terminal
$ flatpak search moonlight
Nome       Descrição                              ID do aplicativo             Versão  Remoto
Moonlight  Open-source NVIDIA GameStream client    com.moonlight_stream.Moonlight 6.0.0  flathub

$ flatpak install flathub com.moonlight_stream.Moonlight
```

Ao abrir o Moonlight, ele escaneia a rede automaticamente em busca de servidores Sunshine (e GameStream da NVIDIA). Se o PC host estiver na mesma rede com o Sunshine rodando, ele aparece em segundos:

```terminal
## Logs do Moonlight ao descobrir o Sunshine:
$ flatpak run com.moonlight_stream.Moonlight
[INFO] Scanning for GameStream hosts...
[INFO] Found Sunshine at 192.168.1.100:47989
[INFO] Hostname: Desktop-Gamer, GPU: NVIDIA GeForce RTX 4070
```

O pareamento inicial exige um PIN: o Moonlight exibe um código de 4 dígitos, e você deve digitá-lo na interface web do Sunshine (em `Pin` na aba de configurações). Depois disso, o vínculo é permanente.

## Configurações avançadas de encode

O Sunshine expõe parâmetros de encoder que o Steam Remote Play não revela. Na aba "Video" da interface web, os ajustes mais impactantes são:

| Parâmetro | Efeito | Recomendação |
|---|---|---|
| Preset | Velocidade vs qualidade do encode | P1 (mais rápido) para baixa latência, P5 para qualidade |
| Tune | Otimização do encoder | "Low Latency" para jogos, "HQ" para desktop |
| B-frames | Quadros de referência bidirecionais | 0 para latência mínima |
| CBR vs VBR | Bitrate constante vs variável | CBR para estabilidade em Wi-Fi |
| Max bitrate | Teto de banda | 80% da banda medida com iperf3 |

```terminal
## Configuração otimizada para baixa latência (NVENC):
## Preset: P1
## Tune: LowLatency
## B-frames: 0
## Rate control: CBR
## Max bitrate: 25000
```

Para GPUs AMD via VA-API, os nomes dos parâmetros mudam, mas a lógica é a mesma: privilegie velocidade sobre qualidade para jogos de ação, e o inverso para jogos contemplativos.

:::atencao
O Moonlight no Flatpak tem acesso restrito a recursos de hardware por padrão. Se você notar queda de desempenho ou tearing, instale o pacote `flatpak override` para conceder acesso total à GPU: `flatpak override --socket=wayland --socket=x11 --device=dri com.moonlight_stream.Moonlight`.
:::

## Comparação com outras soluções

Cada solução de streaming tem seu lugar no ecossistema do Deck:

| Solução | Ideal para | Limitação principal |
|---|---|---|
| Steam Remote Play | Biblioteca Steam | Só funciona com jogos Steam |
| Chiaki | PS4/PS5 | Apenas consoles Sony |
| Greenlight/xbPlay | Xbox | Apenas consoles Microsoft |
| Moonlight/Sunshine | PC gamer + qualquer jogo | Exige configurar host separado |

O Moonlight/Sunshine é a solução mais flexível: transmite qualquer coisa que rode no PC host, incluindo emuladores, aplicativos de trabalho e jogos de qualquer loja (Epic, GOG, Game Pass PC). O preço dessa flexibilidade é a necessidade de manter o Sunshine configurado e atualizado no PC host.

## Resumo

- O Sunshine substitui o GameStream proprietário da NVIDIA por um servidor aberto compatível com GPUs AMD, Intel e NVIDIA.
- O Moonlight é o cliente Flatpak que se conecta ao Sunshine e oferece latência geralmente inferior ao Steam Remote Play.
- A resolução nativa do Deck (1280x800) é ideal para streaming, eliminando scaling desnecessário.
- Parâmetros de encoder (preset, tune, b-frames) permitem priorizar latência ou qualidade conforme o jogo.
- O Moonlight/Sunshine complementa Chiaki e Greenlight, cobrindo o cenário de PC gamer como host.

## Exercícios

1. Instale o Sunshine em um PC com GPU e configure codec, resolução 1280x800 e bitrate de 20000 kbps. Confirme que a interface web está acessível.
2. Instale o Moonlight no Steam Deck e pareie com o Sunshine. Teste a transmissão do desktop: a imagem preenche corretamente a tela de 1280x800?
3. Meça a latência do Moonlight/Sunshine com o overlay de estatísticas (Ctrl+Alt+Shift+S no Moonlight). Qual é a latência de rede reportada? Compare com o Steam Remote Play no mesmo jogo.
4. Teste o parâmetro B-frames: configure 0 e depois 2. Jogue por 5 minutos em cada configuração. Você nota diferença na latência percebida? E na qualidade de imagem?
5. **Desafio.** Configure o Sunshine para expor dois codecs simultaneamente (H.264 e HEVC) e crie dois atalhos no Steam Deck: um que conecta com H.264 para baixa latência e outro com HEVC para qualidade máxima. O script de atalho deve passar o codec desejado como parâmetro para o Moonlight.