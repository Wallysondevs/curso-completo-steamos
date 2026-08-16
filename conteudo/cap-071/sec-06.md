O Steam Deck pode nunca rodar *Starfield* a 60 FPS no ultra — mas isso não importa quando existe um RTX 4080 a 200 km de você disposto a trabalhar. Cloud gaming inverte a equação que discutimos até aqui: em vez da APU Van Gogh renderizar o jogo, um servidor remoto faz o trabalho pesado e transmite apenas vídeo para sua tela. O Deck vira um terminal com controles, e sua maior preocupação deixa de ser o hardware local e passa a ser a qualidade da conexão.

:::objetivos
- Mapear os serviços de cloud gaming compatíveis com o Steam Deck (GeForce Now, xCloud, Boosteroid, Luna)
- Instalar o GeForce Now no modo Gaming e comparar seus tiers (Free, Priority, Ultimate)
- Configurar o Xbox Cloud Gaming via Microsoft Edge e Game Pass Ultimate
- Medir a latência real até os datacenters e interpretar o resultado
- Reconhecer quando cloud compensa — e quando o streaming local vence
:::

## O panorama dos serviços

Nem todo serviço funciona bem no Deck. A boa notícia: como quase tudo roda no navegador, qualquer serviço com cliente web pode ser "instalado" aqui. A má notícia: a experiência varia conforme o serviço investiu (ou não) em um fluxo otimizado.

**NVIDIA GeForce Now (GFN)**. O mais maduro para PC. Você conecta sua biblioteca Steam, Epic e GOG e joga os títulos que *já possui* — o GFN só aluga a máquina. Roda bem no Chrome/Edge, com suporte a controle, até 4K/120 FPS no tier Ultimate e latência consistentemente baixa onde há datacenter NVIDIA.

**Xbox Cloud Gaming (xCloud)**. Joga o catálogo do Game Pass Ultimate direto do navegador, sem comprar nada além da assinatura. O ponto sensível é o user-agent: a Microsoft não tem suporte oficial ao Linux, então é preciso mascarar o Deck como Windows para o streaming funcionar bem.

**Boosteroid**. Alternativa europeia popular, no modelo "traga seus jogos" (como o GFN). Catálogo e datacenters crescem rápido, mas a consistência de latência ainda fica atrás da NVIDIA.

**Amazon Luna**. Catálogo por assinatura (Luna+, Ubisoft+). Funciona no navegador, porém cobertura e catálogo seguem limitados para o público brasileiro.

:::info
**Regra de ouro**: no Deck, qualquer serviço que funcione bem num navegador Chromium funciona no Deck. GFN e xCloud são os dois com melhor suporte comprovado — é neles que vamos focar.
:::

| Serviço | Modelo | Biblioteca | Resolução máx. | Latência | Preço (aprox.) |
|---------|--------|-----------|---------------|----------|----------------|
| GeForce Now | Traga seus jogos | Steam, Epic, GOG | 4K/120 | ~15-40ms | Free / ~R$45 / ~R$100 |
| Xbox Cloud | Assinatura | Game Pass Ultimate | 1080p/60 | ~25-60ms | ~R$60 |
| Boosteroid | Traga seus jogos | Vasta | 4K/60 | ~30-60ms | ~R$50 |
| Amazon Luna | Assinatura | Luna+, Ubisoft+ | 1080p/60 | ~30-70ms | ~R$40 |

## GeForce Now em detalhes

O GFN é o serviço que melhor aproveita o Deck, e vale entender seus tiers com calma.

**Free**. Máquina básica, sessões de 1 hora, filas em pico, sem ray tracing. Perfeito para testar se sua conexão aguenta cloud — e já surpreende muita gente.

**Priority**. Sessões de 6 horas, acesso a RTX 3060/2080 na nuvem, prioridade nas filas, 1080p/60 FPS. Resolve 95% dos casos no Deck, cuja tela de 800p faz 1080p sobrar.

**Ultimate**. RTX 4080 na nuvem, sessões de 8 horas, 4K/120 FPS, ray tracing completo e latência baixa via Reflex. Exagero para a tela do Deck, mas perfeito se você também joga em TV 4K via dock.

A lacuna de potência é brutal: mesmo o tier Priority entrega ~8× a performance do Deck (~12 TFLOPS contra ~1.6 da Van Gogh). Por isso *Alan Wake 2* e *Cyberpunk 2077* com path tracing deixam de ser sonho.

:::atencao
**Limite de sessão é real**: no Free você é desconectado após 1 hora — às vezes sem aviso, o que custa progresso não salvo. Priority (6h) e Ultimate (8h) praticamente eliminam isso. Grave o detalhe antes de iniciar uma sessão longa.
:::

## Instalando o GeForce Now no modo Gaming

O objetivo não é só rodar o GFN, mas fazê-lo aparecer como um "jogo" na sua biblioteca Steam, acessível pelo modo Gaming sem tocar no Desktop.

### Passo 1 — Um navegador Chromium

O GFN precisa de um navegador Chromium. O Microsoft Edge, via Flatpak, virou o preferido da comunidade por sua integração com o Xbox Cloud:

```terminal
## Lista navegadores Chromium disponíveis no Flathub
$ flatpak search edge

Name              Description                        Application ID                  Version     Branch
Microsoft Edge    The web browser by Microsoft       com.microsoft.Edge              135.0.3179.98 stable
Chromium          The open-source web browser        org.chromium.Chromium          135.0.7049.84 stable
Brave             Privacy-focused web browser        com.brave.Browser              1.78.136    stable
```

```terminal
## Instala o Microsoft Edge
$ flatpak install --user -y com.microsoft.Edge

Looking for matches…
Required runtime for com.microsoft.Edge/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/23.08)
found in remote flathub
        ID                             Branch            Op  Remote   Download
 1. [✓] org.freedesktop.Platform       23.08             i   flathub  209.7 MB / 210.1 MB
 2. [✓] com.microsoft.Edge             stable            i   flathub  161.2 MB / 161.6 MB

Installation complete.
```

### Passo 2 — Medindo a latência até a NVIDIA

Antes de criar qualquer atalho, faça o teste decisivo: quão longe está o datacenter? A latência de rede é o que define se cloud será prazeroso ou frustrante.

```terminal
## Testa latência até um datacenter NVIDIA (ajuste a região)
$ ping -c 5 play.geforcenow.com
PING play.geforcenow.com (146.75.30.5) 56(84) bytes of data.
64 bytes from 146.75.30.5: icmp_seq=1 ttl=54 time=18.4 ms
64 bytes from 146.75.30.5: icmp_seq=2 ttl=54 time=17.9 ms
64 bytes from 146.75.30.5: icmp_seq=3 ttl=54 time=19.2 ms
64 bytes from 146.75.30.5: icmp_seq=4 ttl=54 time=18.1 ms
64 bytes from 146.75.30.5: icmp_seq=5 ttl=54 time=18.6 ms

--- play.geforcenow.com ping statistics ---
5 packets transmitted, 5 received, 0% packet loss
time 4004ms
rtt min/avg/max/mdev = 17.900/18.440/19.200/0.466 ms
```

Uma média de ~18ms é excelente. Somando encode e decode, a latência *total* percebida fica em torno de 30-45ms — jogável para a maioria dos gêneros.

:::dica
**Interpretação do ping**: <20ms é ótimo para cloud; 20-40ms é aceitável para tudo exceto jogo competitivo; 40-60ms começa a incomodar em ação rápida; >60ms torna a experiência ruim. Se o ping ao datacenter for alto, prefira o streaming local ([Moonlight e Sunshine](#/cap-071/sec-05)).
:::

### Passo 3 — Criando o atalho como "jogo"

O truque para o modo Gaming é gerar um arquivo `.desktop` que o Steam reconheça como jogo non-Steam:

```terminal
## Cria o atalho do GeForce Now apontando para o Edge
$ mkdir -p ~/.local/share/applications
$ cat > ~/.local/share/applications/geforcenow.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=GeForce Now
Comment=Cloud gaming via NVIDIA GeForce Now
Exec=flatpak run com.microsoft.Edge --new-window https://play.geforcenow.com
Icon=steamdeck-gaming-return
Categories=Game;
Terminal=false
EOF
```

Depois, no Steam (modo Desktop), vá em **Adicionar um jogo → Adicionar um jogo não-Steam**, selecione `GeForce Now` e confirme. No modo Gaming ele aparecerá na biblioteca, pronto para abrir com um toque.

:::nota
**Navegação no controle**: use o trackpad direito como mouse e `L2` como clique direito. O modo *Big Picture* do site do GFN também deixa a navegação mais amigável.
:::

## Xbox Cloud Gaming (xCloud) no Deck

O xCloud joga o catálogo do Game Pass Ultimate pelo navegador — sem comprar jogos individuais. O desafio é que a Microsoft detecta o Linux e degrada ou bloqueia o streaming. A solução da comunidade é **mascarar o Deck como Windows** alterando o user-agent, o que convence o servidor a entregar o stream completo.

A Microsoft publicou no Flathub uma variante do Edge já configurada com o user-agent e atalhos corretos para o Xbox Cloud:

```terminal
## Busca a variante do Edge para Xbox Cloud
$ flatpak search edge | grep -i xbox

Name                    Description                            Application ID         Version        Branch
Microsoft Edge (Xbox)   Edge optimized for Xbox Cloud Gaming   com.microsoft.Edge.xbox 135.0.3179.98 stable
```

```terminal
## Instala o Edge otimizado para xCloud
$ flatpak install --user -y com.microsoft.Edge.xbox

Looking for matches…
Required runtime for com.microsoft.Edge.xbox/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/23.08)
found in remote flathub
        ID                             Branch            Op  Remote   Download
 1. [✓] com.microsoft.Edge.xbox       stable            i   flathub  158.3 MB / 159.0 MB

Installation complete.
```

Em seguida, crie o atalho `.desktop` correspondente para o modo Gaming:

```terminal
## Atalho para o Xbox Cloud Gaming
$ cat > ~/.local/share/applications/xcloud.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=Xbox Cloud Gaming
Comment=Streaming via Xbox Cloud Gaming (Game Pass)
Exec=flatpak run com.microsoft.Edge.xbox --new-window https://www.xbox.com/play
Icon=steamdeck-gaming-return
Categories=Game;
Terminal=false
EOF
```

Adicione ao Steam como non-Steam game, abra e faça login com a conta Microsoft.

:::atencao
**Game Pass Ultimate é obrigatório** para o streaming em nuvem. Os planos "Core" ou "Console" não incluem xCloud. Confira o plano do seu contrato antes de tentar logar.
:::

## Limitações reais e quando cloud vale a pena

Cloud não é mágica — tem custos que você precisa aceitar antes de assinar qualquer serviço.

**Latência maior que o streaming local**. O Moonlight na rede doméstica fica em 5-20ms; o cloud adiciona o trajeto até o datacenter, no melhor caso ~30-45ms no total, passando de 80ms em conexões ruins. Competitive FPS sofre; RPG e estratégia mal percebem.

**Dependência total de internet**. Sem conexão estável de 15-25 Mbps (fibra ou 5G forte), o stream degrada para blocos e quedas de FPS. No metrô, no avião ou em Wi-Fi público congestionado, cloud simplesmente não existe.

**Compressão em movimento rápido**. Em cenas de ação acelerada, o codec sacrifica detalhe para manter o bitrate, gerando imagem "borrada" momentaneamente — mais perceptível em 800p do que sugere o número cru.

**Sem mods plenos e biblioteca limitada**. Você depende dos saves na nuvem do serviço, e mods pesados nem sempre carregam. O GFN, por exemplo, não suporta todo o catálogo da Steam.

A equação vira a favor do cloud quando o jogo **jamais rodaria localmente de forma satisfatória**:

- **Starfield** — o Deck sofre para 30 FPS no low; no GFN roda a 60 FPS no alto.
- **Alan Wake 2** — path tracing é impensável na Van Gogh; no Ultimate é nativo.
- **Cyberpunk 2077 com Ray Tracing Overdrive** — literalmente só existe em servidor.
- **Títulos com anti-cheat que bloqueiam o Deck** — via xCloud, o anti-cheat roda no Windows do datacenter.
- **Viagem sem PC gamer por perto** — o cloud transforma qualquer Wi-Fi decente num "PC de 50 TFLOPS".

:::perigo
**Cuidado com o limite de dados**: sessões a 1080p/60 consomem 6-10 GB por hora (o dobro em 4K/120). Em rede móvel com franquia, uma tarde de cloud pode estourar o plano do mês. Acompanhe o consumo no app da operadora.
:::

## Resumo

- Cloud gaming inverte a lógica do Deck: o servidor renderiza e o aparelho vira terminal de vídeo, superando os limites da APU Van Gogh
- GeForce Now é o serviço mais maduro no Deck, com três tiers (Free, Priority, Ultimate) no modelo "traga seus jogos"
- xCloud funciona via Microsoft Edge com user-agent mascarado como Windows e exige Game Pass Ultimate
- Boosteroid e Luna são alternativas válidas, mas com cobertura e consistência inferiores no Brasil
- A latência real fica entre 30-80ms, contra 5-20ms do streaming local — decisiva em jogos competitivos
- O cloud brilha para títulos impossíveis no hardware local, cobrando internet estável e consumo de dados

## Exercícios

1. Execute `flatpak search edge` no seu Steam Deck e anote os navegadores Chromium disponíveis. Explique por que um navegador Chromium (e não o Firefox) é recomendado para GFN e xCloud.

2. Meça a latência até um datacenter com `ping -c 10 play.geforcenow.com`. Com a régua de interpretação (<20ms ótimo, >60ms ruim), classifique sua conexão e diga se vale assinar um tier pago.

3. Compare os três tiers do GeForce Now e escolha o que faz sentido para *seu* uso, considerando que o Deck tem tela de 800p. Justifique se o Ultimate é (ou não) desperdício para quem só joga no Deck.

4. Crie o arquivo `~/.local/share/applications/geforcenow.desktop`, substituindo a URL pelo serviço de sua preferência (GFN ou xCloud). Adicione-o ao Steam como non-Steam game e confirme que ele aparece na biblioteca do modo Gaming.

5. **Desafio integrador**: Você quer jogar *Alan Wake 2* com ray tracing máximo em três contextos: (a) em casa com um PC gamer RTX 4070 na rede, (b) num hotel com Wi-Fi 100 Mbps sem PC por perto, (c) num ônibus sem internet. Para cada contexto, decida entre rodar local (Proton), streaming local (Moonlight/Sunshine) e cloud (GFN Ultimate), justificando por latência, bateria e conectividade. Identifique qual contexto torna o jogo *impossível* e por quê.
