Se o Chiaki resolve o streaming do PlayStation, o ecossistema Xbox tem suas próprias soluções. A Microsoft oferece Remote Play oficial para Xbox One e Series, mas o aplicativo só existe para Windows, Android e iOS — não para Linux. Felizmente, a comunidade criou alternativas que preenchem essa lacuna no SteamOS com qualidade equivalente. O Greenlight e o xbPlay são os dois principais clientes para transformar o Deck em um Xbox portátil.

:::objetivos
- Conhecer as opções de streaming de Xbox para SteamOS
- Instalar e configurar o Greenlight como cliente Xbox Remote Play
- Instalar e configurar o xbPlay como alternativa rica em recursos
- Comparar as duas soluções em qualidade, latência e usabilidade
- Configurar o Xbox Cloud Gaming (xCloud) no Steam Deck
:::

## O protocolo Xbox Remote Play

O protocolo de streaming do Xbox é diferente do usado pelo PlayStation. Em vez de um protocolo proprietário exposto à rede local, o Xbox usa o mesmo protocolo que alimenta o Xbox Cloud Gaming (xCloud) — uma variação do que a Microsoft chama internamente de "Project xCloud", baseado em streaming de vídeo com codecs H.264 ou HEVC sobre uma conexão criptografada.

Isso significa que o Remote Play do Xbox e o xCloud são fundamentalmente a mesma tecnologia; o que muda é apenas a origem do stream — seu console físico no primeiro caso, servidores da Microsoft no segundo.

```terminal
## Requisitos para Remote Play no Xbox:
## 1. Console ligado ou em modo de consumo reduzido
## 2. Remote Play ativado em Configurações > Dispositivos e conexões > Recursos remotos
## 3. Console definido como "Meu Xbox principal"
## 4. Mesma conta Microsoft usada no cliente
```

## Greenlight: o cliente leve e direto

O Greenlight é um cliente de código aberto que implementa o protocolo de streaming do Xbox focado em simplicidade. Ele está disponível como Flatpak no Discover e não exige configuração complexa — basta fazer login com sua conta Microsoft e o aplicativo descobre o console automaticamente.

```terminal
$ flatpak search greenlight
Nome        Descrição                              ID do aplicativo             Versão  Remoto
Greenlight  Stream Xbox One/Series to your desktop  io.github.unknownskl.greenlight 1.2.0  flathub

$ flatpak install flathub io.github.unknownskl.greenlight
```

Ao abrir o Greenlight pela primeira vez, a tela de login solicita suas credenciais Microsoft. O fluxo de autenticação usa OAuth 2.0 — você não digita a senha diretamente no aplicativo, mas sim em uma página web oficial da Microsoft. Após autorizar, o Greenlight recebe um token que permite descobrir e conectar ao seu console.

```terminal
## Arquivo de configuração do Greenlight:
$ cat ~/.var/app/io.github.unknownskl.greenlight/config/greenlight/config.json
{
  "logged_in": true,
  "gamertag": "SeuGamertag",
  "default_console": "XboxSeriesX-abcdef",
  "bitrate": 15000,
  "resolution": "1080p"
}
```

A interface do Greenlight é minimalista: após o login, ele exibe a lista de consoles associados à sua conta. Um clique inicia o streaming. As opções de configuração incluem resolução (720p ou 1080p), bitrate e escolha entre H.264 e HEVC (no Xbox Series).

:::dica
O Greenlight suporta Wake-on-LAN para ligar o Xbox remotamente — desde que o console esteja configurado em modo de economia com "Ligar console remotamente" ativado. O comando de "ligar" é enviado automaticamente ao selecionar um console que está desligado.
:::

## xbPlay: mais recursos, mesma base

O xbPlay é uma alternativa comercial (paga, com trial gratuito) que oferece recursos ausentes no Greenlight. Além do Remote Play local, ele suporta xCloud — o serviço de cloud gaming do Xbox Game Pass Ultimate — diretamente no aplicativo, sem precisar de navegador.

```terminal
$ flatpak search xbplay
Nome    Descrição                              ID do aplicativo             Versão  Remoto
xbPlay  Xbox Cloud Gaming & Remote Play client  com.github.xbplay.xbplay    2.5.0   flathub

$ flatpak install flathub com.github.xbplay.xbplay
```

A principal vantagem do xbPlay é a interface polida e os recursos extras: filtros de nitidez, ajuste de contraste, suporte a múltiplas contas Microsoft e perfis de configuração por jogo. A desvantagem é o preço (cerca de US$ 6 na compra única) e o fato de não ter código aberto.

| Característica | Greenlight | xbPlay |
|---|---|---|
| Remote Play local | Sim | Sim |
| Xbox Cloud Gaming | Não | Sim |
| Wake-on-LAN | Sim | Sim |
| Filtros de imagem | Não | Nitidez, contraste |
| Código aberto | Sim | Não |
| Custo | Gratuito | Pago (trial disponível) |
| Interface | Minimalista | Polida, moderna |

## Configuração recomendada para ambos

Independentemente do cliente escolhido, as configurações ótimas seguem a mesma lógica do Chiaki: comece conservador e suba até o limite da rede.

```terminal
## Configuração inicial recomendada:
## Resolução: 720p
## Codec: H.264
## Bitrate: 10000 kbps

## Configuração alvo (com boa rede):
## Resolução: 1080p
## Codec: HEVC (H.265) — apenas Xbox Series
## Bitrate: 15000-20000 kbps
```

O Xbox One original limita-se a 720p para Remote Play, enquanto o Xbox One X, One S, Series S e Series X suportam 1080p. O codec HEVC está disponível apenas nas gerações Series.

```terminal
$ iperf3 -c 192.168.1.152 -t 10
## O mesmo teste de banda se aplica: meça antes de configurar.
## Para 1080p HEVC: mínimo de 12 Mbps estáveis.
```

## Xbox Cloud Gaming (xCloud) no Steam Deck

Além do Remote Play, o ecossistema Xbox inclui o xCloud, que transmite jogos de servidores Microsoft sem precisar de console físico. Requer assinatura Xbox Game Pass Ultimate. No Steam Deck, há duas rotas:

**Rota 1: Microsoft Edge.** A Microsoft fornece um guia oficial para instalar o Edge via Flatpak e configurá-lo como atalho da Steam com parâmetros específicos para o xCloud:

```terminal
$ flatpak install flathub com.microsoft.Edge
$ flatpak run com.microsoft.Edge --window-size=1280,800 \
    --kiosk "https://www.xbox.com/play"
```

Essa abordagem funciona bem, mas roda no navegador, o que adiciona uma camada de overhead. A qualidade é aceitável, mas a latência é maior que no Remote Play local.

**Rota 2: xbPlay.** O xbPlay integra o xCloud nativamente, com melhor desempenho que o navegador. Após fazer login com a conta Microsoft vinculada ao Game Pass, a biblioteca de jogos na nuvem aparece diretamente no aplicativo.

:::atencao
O xCloud depende da latência até os datacenters da Microsoft, não da sua rede local. A qualidade varia muito conforme a região. No Brasil, a latência costuma ficar entre 30 e 80 ms, o que é aceitável para RPGs e jogos de estratégia, mas pode incomodar em jogos de ação.
:::

## Resumo

- O protocolo Xbox Remote Play usa a mesma tecnologia do xCloud; o Greenlight e o xbPlay implementam-no no Linux.
- O Greenlight é gratuito, de código aberto e minimalista; instala-se via Flatpak e exige apenas login Microsoft.
- O xbPlay é pago e oferece xCloud integrado, filtros de imagem e interface mais sofisticada.
- Ambos suportam Wake-on-LAN, configuração de bitrate/resolução e codec HEVC no Xbox Series.
- O xCloud funciona via Edge ou xbPlay, mas a latência depende da distância aos datacenters Microsoft.

## Exercícios

1. Instale o Greenlight via Flatpak e faça login com sua conta Microsoft. O aplicativo encontrou seu Xbox automaticamente?
2. Configure o Remote Play no Xbox (Configurações > Recursos remotos) e faça um streaming de teste. Anote a resolução e o bitrate usados por padrão.
3. Meça a latência do xCloud: acesse `xbox.com/play` pelo Edge no Deck, abra um jogo e use o medidor de desempenho da Steam (Steam > Configurações > Em jogo > Contador de FPS) para verificar a estabilidade.
4. Compare Greenlight e xbPlay (trial) no mesmo jogo. Qual deles entrega imagem mais nítida? A latência percebida difere?
5. **Desafio.** Escreva um script que verifica se o Xbox está ligado (via `ping` ou API de descoberta do Greenlight) e, se estiver desligado, envia o comando Wake-on-LAN. O script deve esperar até 60 segundos pelo boot do console e então iniciar o streaming automaticamente.