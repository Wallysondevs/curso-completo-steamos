Você já mede o consumo; agora a pergunta é o que **fazer** com isso no dia a dia para esticar a carga sem virar refém de configurações. A boa notícia é que os ganhos maiores vêm de decisões que você toma antes de jogar, não de micro-otimizações. Esta seção organiza a economia em camadas, da maior para a menor.

:::objetivos
- Priorizar as alavancas de economia por impacto real
- Ajustar brilho, taxa de quadros e limite de TDP
- Entender o custo do Wi-Fi, Bluetooth e da tela
- Usar o `tamedaemon` para reduzir ruído e consumo de ventoinha
- Montar uma rotina pessoal de economia que não atrapalha o uso

:::

## A pirâmide de economia

Antes de mexer em qualquer coisa, deixe claro onde está o dinheiro — no caso, os watts. A hierarquia do Steam Deck, já esboçada na seção de consumo, define a ordem de ataque:

```terminal
$ watch -n 2 'awk "{printf \"%.2f W\\n\", \$1/1000000}" /sys/class/power_supply/BAT1/power_now'
```

| Prioridade | Alavanca | Ganho típico |
|---|---|---|
| 1 | Limitar TDP da APU | grande (10+ W em jogos pesados) |
| 2 | Travar FPS (30/40) | grande, combinado ao TDP |
| 3 | Brilho da tela | médio (~1–3 W) |
| 4 | Wi-Fi / Bluetooth desligados | pequeno (fração de W) |
| 5 | Ventoinha / periféricos | pequeno |

A regra de ouro: **limitar a APU e o FPS** domina tudo. Quem abaixa só o brilho e apaga o Wi-Fi está colhendo centavos enquanto deixa as libras na mesa.

## FPS e TDP: a dupla que resolve

O SteamOS coloca os controles certos no menu de desempenho (o botão `...` durante o jogo). Travar a taxa de quadros reduz o trabalho da GPU, e limitar o TDP (*thermal design power*) põe um teto físico no consumo da APU. O efeito combinado é medido, não teórico:

```terminal
Every 2,0s: awk '{printf "%.2f W\n", $1/1000000}' /sys/class/power_supply/BAT1/power_now

22,10 W   <- limite de TDP alto, FPS destravado
12,40 W   <- TDP 8 W, FPS travado em 40
```

Cair de 22 W para 12 W quase dobra a autonomia daquele jogo, com perda de fluidez que muitos nem percebem — 40 FPS estáveis parecem melhores que 60 FPS oscilando e esquentando. Cada título tem seu ponto ideal; vale testar por uns minutos com o `watch` ligado.

:::dica
Para a bateria, o ganho de travar FPS não é só o frame a menos: menos trabalho de GPU significa menos watts **e** menos calor, e menos calor significa menos desgaste químico. É a alavanca que ataca consumo e longevidade ao mesmo tempo.
:::

## Brilho, rádios e coisas pequenas

Depois de acertar a APU, o que sobra é finura. O brilho vale a pena porque é contínuo: cada ponto a menos é um pouquinho de watt durante **todas** as horas de uso, então ao longo de uma sessão soma. Já o Wi-Fi e o Bluetooth, em jogos offline, custam tão pouco que desligá-los raramente compensa o incômodo — a menos que você queira economizar o absoluto máximo num voo.

```terminal
$ nmcli radio wifi off
$ nmcli radio wifi on
```

O `nmcli` desliga e religa o rádio Wi-Fi pelo terminal, útil em jogos offline longos. Para o Bluetooth, o caminho é outro serviço, mas o princípio é o mesmo: é economia de migalha em cima de migalha. Faça só se o cenário pedir o máximo absoluto.

:::atencao
Desligar Wi-Fi e Bluetooth não "estraga" nada e religa depois, mas em modo offline você perde sincronização de saves na nuvem e conquistas. Se o jogo usa checagem online, cortar a rede pode travar o próprio jogo. Pese a economia ridícula contra o risco de perder progresso.
:::

## A ventoinha no lugar certo

O ventilador em si consome pouco, mas a escolha da política de ventoinha afeta o calor — e calor é o vilão da longevidade que você conhece da seção de ciclos. O SteamOS traz um controle de ventoinha que, no modo desktop, pode ser ajustado via `tamedaemon`, um serviço da Valve para controlar a curva do cooler.

```terminal
$ systemctl status tamedaemon
● tamedaemon.service - SteamOS tamedaemon
     Active: active (running)
```

Ajustes mais finos passam por arquivos de configuração e opções específicas do daemon; no modo de jogo, a política de ventoinha é gerenciada pelo sistema. A lição aqui é conceitual: uma curva de ventoinha mais agressiva mantém a APU e a bateria mais frias ao custo de ruído — e, para saúde da célula, o frio vale o barulho.

:::nota
O `tamedaemon` (tame = "domar") é o serviço da Valve responsável por controlar a ventoinha do Deck de forma adaptativa. Não confunda com o daemon de energia: este aqui especificamente governa a rotação do cooler conforme a temperatura da APU e do ambiente.
:::

## Montando sua rotina

Economia que atrapalha ninguém sustenta. A rotina que de fato gruda é a que vive dentro do seu fluxo normal:

- **Antes de jogar longe da tomada:** trave FPS em 40 e ajuste o limite de TDP do título.
- **Durante:** brilho no mínimo confortável em ambiente escuro.
- **Ao terminar:** se for guardar sem usar por dias, deixe entre 40% e 60%, não 100%.
- **Ocasionalmente:** uma calibragem, como visto na seção anterior.

Nenhum desses passos exige sacrifício constante. A soma é uma autonomia visivelmente maior e uma célula que envelhece mais devagar — os dois objetivos deste capítulo andando juntos.

## Resumo

- A maior economia vem de limitar TDP e travark FPS, não do brilho ou dos rádios.
- Brilho menor rende ganho contínuo ao longo de toda a sessão, mas é secundário.
- Wi-Fi/Bluetooth custam migalha e podem custar save na nuvem se cortados.
- O `tamedaemon` governa a ventoinha; manter o aparelho frio protege a bateria.
- A rotina sustentável encaixa os ajustes no fluxo normal, sem sacrifício constante.

## Exercícios

1. Num jogo pesado, meça `power_now` com FPS destravado e depois travado em 40. Registre a diferença em watts.
2. Com o FPS travado, varie o limite de TDP e anote consumo e fluidez percebida em cada patamar. Qual é o ponto ideal do seu título favorito?
3. Rode uma sessão de 30 min com brilho máximo e outra com mínimo confortável; calcule o impacto em Wh usando `energy_now` inicial e final.
4. Desligue e religue o Wi-Fi com `nmcli radio wifi off/on` num jogo offline e meça se houve diferença relevante de consumo.
5. **Desafio.** Monte uma tabela comparando três configurações do mesmo jogo (padrão, FPS travado, FPS+TDP limitado) com potência média e autonomia estimada de cada uma. Conclua qual combinação você adotaria numa viagem longa e justifique com os números.
