O Steam Deck sai da caixa pronto para jogar, mas é raro manter o aparelho nesse estado por muito tempo. Um cabo USB-C curto demais, um dock que não alimenta direito ou uma tela sem proteção mudam a experiência do portátil para pior — e, em alguns casos, custam caro. Acessórios não são vaidade: eles resolvem problemas reais de ergonomia, conectividade e durabilidade, e a maioria tem impacto direto e mensurável no sistema que você já sabe inspecionar.

:::objetivos
- Entender por que acessórios afetam ergonomia, conectividade e durabilidade
- Identificar os pontos de desgaste físico do Steam Deck
- Reconhecer o USB-C como elo central de praticamente todo acessório
- Classificar acessórios entre "essencial", "útil" e "dispensável"
- Inspecionar o que o sistema enxerga ao conectar cada acessório
:::

## O Deck é um PC, e PCs pedem companhia

Um console fechado esconde suas entradas e te limita ao que o fabricante vende. O Steam Deck, por ser um PC x86_64 com SteamOS, expõe uma porta USB-C honesta e um slot microSD, e aceita periféricos USB e Bluetooth como qualquer Linux. Isso é uma vantagem dupla: o leque de acessórios compatíveis é imenso, e você consegue **verificar** cada um deles com as mesmas ferramentas que já usaria num desktop.

A desvantagem é que compatibilidade não é garantida. Um cabo que funciona num notebook pode não carregar o Deck na potência certa; um dock barato pode anunciar DisplayPort alt-mode e entregar só dados. Por isso este capítulo inteiro gira em torno de uma ideia: **confie no que o sistema reporta, não no que a embalagem promete**.

```terminal
$ lsusb | head -6
Bus 004 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 003 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 002 Device 001: ID 1d6b:0003 Linux Foundation 3.0 root hub
Bus 001 Device 001: ID 1d6b:0002 Linux Foundation 2.0 root hub
Bus 001 Device 002: ID 28de:1205 Valve Software Steam Deck
```

A listagem acima mostra o Deck em estado puro, sem nada plugado além do próprio controlador embutido (`28de:1205`). Cada acessório que você conectar vai aparecer aqui, com o `VID:PID` do fabricante — a assinatura que permite saber, sem abrir caixa nenhuma, o que de fato foi reconhecido.

## Os três problemas que acessórios resolvem

Todo acessório que vale dinheiro ataca uma destas três frentes — ou é dispensável.

**Ergonomia.** O Deck pesa cerca de 669 g (LCD) e chega a 640 g no OLED. Segurá-lo por uma hora cansa os pulsos, e os analógicos simétricos no topo nem sempre caem bem em mãos menores. Grips, cases com apoio e suportes de mesa existem para redistribuir esse peso.

**Conectividade.** Uma única porta USB-C faz tudo, mas não faz tudo ao mesmo tempo sem um intermediário. Dock, hub e cabos com DisplayPort alt-mode resolvem a limitação de ter só um conector.

**Durabilidade.** A tela é o componente mais caro e frágil do aparelho; o conector USB-C e o slot microSD também sofrem com uso repetido. Películas, cases e protetores de porta são a camada mais barata de seguro que existe.

```terminal
$ cat /sys/class/power_supply/BAT1/energy_full
25320000
$ cat /sys/class/power_supply/BAT1/energy_full_design
40000000
```

Aqui, `energy_full` (25,3 Wh) já está bem abaixo de `energy_full_design` (40 Wh) — sinal de desgaste da bateria após muitos ciclos. O ponto é: a escolha do carregador e do dock afeta diretamente a saúde dessa bateria no longo prazo. Um acessório "só de alimentação" é, na prática, um acessório de durabilidade.

:::nota
A bateria do Steam Deck é nominal de 40 Wh no LCD e 50 Wh no OLED. `energy_full` caindo é normal com o tempo, mas a velocidade dessa queda depende de como você carrega. Manter o aparelho sempre a 100% sob carga, em ambiente quente, acelera a degradação — e o dock entra nessa conta.
:::

## Uma hierarquia útil de compra

Antes de gastar, vale classificar. A ordem abaixo reflete o que mais resolve problema por real investido:

| Camada | Acessório | Por quê |
|---|---|---|
| Essencial | Fonte/cabo USB-C PD 45 W sobressalente | Carga confiável em qualquer lugar |
| Essencial | Película de tela | Protege o componente mais caro |
| Muito útil | Dock ou hub com HDMI e PD | Transforma o Deck em desktop |
| Útil | Case rígido ou grip | Ergonomia e transporte |
| Útil | microSD classe A2 | Expansão barata de armazenamento |
| Dispensável | Aqui entram 90% dos "must have" de YouTube | Marketing |

O que define a fronteira entre "útil" e "dispensável" é o **uso real** que você dá ao aparelho. Quem joga 90% no sofá com o Deck carregado não precisa de dock; quem usa o Deck como estação de trabalho no modo Desktop precisa.

```terminal
$ df -h /run/media/deck | tail -1
/dev/mmcblk0p1  256G  81G  176G  32% /run/media/deck/mmcblk0p1
```

Esse `df` mostra um microSD de 256 GB montado com 32% de uso — prova concreta de que o cartão resolveu um problema real de espaço. É exatamente assim que você decide o próximo acessório: identifica a dor, resolve, e confirma no sistema que a dor sumiu.

:::dica
Antes de comprar qualquer acessório, passe uma semana anotando o que te incomoda no uso diário. Quem compra acessório "porque todo o mundo tem" acumula gaveta. Quem compra para resolver uma dor específica — bateria que não dura na viagem, tela que vive suja, pulso que dói — acerta mais e gasta menos.
:::

## Como este capítulo está organizado

As próximas seções seguem a ordem da hierarquia acima. Você vai ver docks e saída de vídeo em detalhe, depois energia e Power Delivery, armazenamento externo e microSD, proteção física (cases, grips e películas), periféricos de entrada, áudio, e por fim uma montagem completa com análise de custo. Em todas, o fio condutor é o mesmo: o acessório certo se comprova com um comando.

```terminal
$ uname -r
6.5.0-valve37-1-neptune-65
$ cat /etc/os-release | head -2
NAME="SteamOS"
VERSION_ID="3.6"
```

Este é o ambiente de referência do capítulo: SteamOS 3.6, kernel `6.5.0-valve37-1-neptune-65`. Todos os blocos de terminal deste capítulo assumem essa base, com usuário `deck` e host `steamdeck`.

## Resumo

- O Steam Deck é um PC aberto: aceita periféricos USB e Bluetooth como qualquer Linux, mas compatibilidade não é garantida.
- Acessórios resolvem três frentes: ergonomia, conectividade e durabilidade — e dispensáveis atacam nenhuma.
- O USB-C é o elo central; praticamente todo acessório passa por ele.
- Classifique acessórios em essencial, útil e dispensável antes de comprar, pelo uso real.
- `lsusb`, `/sys/class/power_supply/` e `df` são as formas de comprovar que um acessório funciona de verdade.

## Exercícios

1. Liste os acessórios que você já possui para o Deck e classifique cada um nas três frentes (ergonomia, conectividade, durabilidade). Algum não se encaixa em nenhuma?
2. Com o Deck sem nenhum periférico, rode `lsusb` e anote os dispositivos base. Identifique qual entrada é o controlador embutido da Valve.
3. Leia `cat /sys/class/power_supply/BAT1/energy_full` e `cat /sys/class/power_supply/BAT1/energy_full_design`. Calcule a porcentagem de saúde da sua bateria.
4. Monte, por escrito, sua lista de desejos hierarquizada (essencial, útil, dispensável) usando a tabela da seção como ponto de partida e justificando cada item com uma dor real.
5. **Desafio.** Conecte o único acessório que você considera essencial, rode `lsusb` e capture a mudança na listagem. Depois, com `dmesg | tail -30`, leia a mensagem que o kernel gerou ao detectar o dispositivo e explique o que ela revela sobre o acessório (VID, PID e claim de driver).
