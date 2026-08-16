Se as Steam Machines foram o projeto que ensinou a Valve a não depender de terceiros para fazer hardware, o **Steam Deck** foi o projeto que usou todas essas lições de uma vez. Anunciado em julho de 2021 e lançado em fevereiro de 2022, o Deck não era um console: era um PC portátil rodando um Linux customizado, com uma camada de compatibilidade para rodar a biblioteca do Steam. E deu certo onde as Steam Machines falharam: teve preço competitivo, biblioteca imensa desde o dia um e um aparelho que a própria Valve fabricou.

:::objetivos
- Entender o que é o Steam Deck, seu hardware e seu posicionamento
- Conhecer o SteamOS 3.0, sua base Arch Linux e as diferenças para o 1.0
- Saber como o Deck combina camadas: Arch, KDE Plasma, Gamescope, Proton
- Identificar as três principais razões pelas quais o Deck vingou
:::

## O hardware que encaixou no momento

O Steam Deck já nasceu com a resposta que as Steam Machines não tinham: uma APU (processador com gráfico integrado) da AMD, arquitetura Zen 2 + RDNA 2, memória LPDDR5 unificada de 16 GB, tela de 7 polegadas a 1280×800. Não era o hardware mais potente do mercado — era o hardware certo para rodar a maioria dos jogos do Steam a 30–60 fps em uma tela portátil.

A escolha do x86-64 em vez de ARM foi crucial. Um ARM precisaria de tradução de instruções para rodar jogos Windows, o que mataria a performance. Com x86-64, o Proton "só" precisa traduzir as APIs — as instruções do processador rodam nativamente. Isso eliminou uma camada inteira de sobrecarga. O Deck roda jogos de Windows quase como um PC normal, porque é um PC normal.

## A arquitetura de software do Deck

O Steam Deck roda **SteamOS 3.0**, um sistema operacional baseado em Arch Linux — não em Debian, como nas versões anteriores. A troca foi estratégica: o Arch é *rolling release*, o que significa que pacotes, drivers e kernels são atualizados continuamente, sem esperar por uma nova "versão" do sistema. Para uma máquina de jogos, isso é crucial: um driver gráfico de seis meses atrás não é aceitável.

```terminal
$ cat /etc/os-release
NAME="SteamOS"
PRETTY_NAME="SteamOS 3.6.21"
BUILD_ID="20250325.1"
VARIANT="Steam Deck"
ID="steamos"
ID_LIKE="arch"
ANSI_COLOR="1;35"
```

Sobre o Arch, a Valve empilhou: **KDE Plasma** como ambiente de desktop (acessível pelo modo Desktop), o compositor **Gamescope** para gerenciar a tela e o Game Mode, o **Steam** rodando em Big Picture como interface padrão, e o Proton como camada de compatibilidade. Cada uma dessas peças é importante e será explorada em detalhes ao longo do curso.

```text
Camadas de software do Steam Deck (visão simplificada)
────────────────────────────────────────────────────────
┌─────────────────────────────────────────────────┐
│              Steam (Big Picture Mode)            │
├─────────────────────────────────────────────────┤
│         Proton / Steam Linux Runtime             │
├─────────────────────────────────────────────────┤
│   Gamescope (compositor de tela, Game Mode)      │
├─────────────────────────────────────────────────┤
│   KDE Plasma (modo Desktop) / Sway opcional      │
├─────────────────────────────────────────────────┤
│          Arch Linux (base rolling)               │
├─────────────────────────────────────────────────┤
│          Kernel Linux (com patches Valve)        │
├─────────────────────────────────────────────────┤
│              APU AMD (x86-64)                    │
└─────────────────────────────────────────────────┘
```

## Cromo, o fruto maduro do fracasso

Comparar o Deck com as Steam Machines (2015) é instrutivo porque mostra como as mesmas ideias fracassaram ou vingaram com timing e execução diferentes:

| Fator | Steam Machines (2015) | Steam Deck (2022) |
|---|---|---|
| Hardware | Fabricado por parceiros, fragmentado | Único, fabricado pela Valve |
| Sistema | SteamOS 1.0 (Debian, pacotes congelados) | SteamOS 3.0 (Arch, rolling) |
| Compatibilidade | Linux nativo (poucos jogos) | Proton (milhares de jogos) |
| Preço | US$ 449–2000+ | US$ 399–649 |
| Biblioteca | Dezenas de títulos | Dezenas de milhares |
| Controle | Steam Controller (experimental) | Integrado, herdado do Controller |

O Deck não foi um acerto por acidente. Ele foi a acumulação de cada lição: controle do hardware, sistema rolling, Proton maduro e preço subsidiado pela venda de jogos. A Valve vende o Deck a preço de custo ou abaixo dele porque cada Deck vendido é uma plataforma de compras do Steam — exatamente o modelo de console que a Microsoft e a Sony usam há décadas.

## O que o Deck representa para o SteamOS

O Steam Deck é, na prática, o que garantiu o futuro do SteamOS como projeto. Antes do Deck, o SteamOS era uma curiosidade — instalado por entusiastas, ignorado por desenvolvedores. Depois do Deck, o SteamOS virou alvo: estúdios começaram a testar seus jogos em Proton e corrigir bugs, benchmarks comparam performance no Deck, e a Valve mantém uma lista de títulos "Deck Verified".

Para o curso que você está fazendo, o Deck é a plataforma de referência. Quando falamos de SteamOS daqui para frente, falamos do sistema que roda no Deck. Você pode instalar o SteamOS 3 em outras máquinas, mas o alvo primário — onde a Valve concentra esforço — é o Deck e suas sucessoras.

:::dica
A lista de jogos "Deck Verified" (verificados para o Deck) pode ser acessada diretamente dentro do Steam, no Deck, filtrando a biblioteca por compatibilidade. Os níveis são: *Verified* (roda perfeitamente), *Playable* (roda, mas exige ajustes), *Unsupported* (não roda) e *Unknown* (não testado).
:::

## Um primeiro olhar dentro do Deck

O Steam Deck é um PC, e no modo Desktop você tem acesso a tudo. Vale a pena abrir um terminal e inspecionar o hardware com comandos que rodam em qualquer Linux — porque o Deck é, de fato, um Linux comum com camadas extras.

```terminal
$ uname -r
6.5.0-valve8-1-neptune-65-g6c1f357e1ed2
$ lscpu | head -6
Architecture:            x86_64
CPU(s):                  8
Model name:              AMD Custom APU 0405
Thread(s) per core:      2
Core(s) per socket:      4
$ free -h
               total        used        free      shared  buff/cache   available
Mem:            14Gi       3.2Gi       7.8Gi       0.5Gi       3.4Gi        10Gi
Swap:           8Gi          0B         8Gi
```

O kernel é uma versão customizada pela Valve: o sufixo `valve8-1-neptune` indica patches internos, em especial para o controle de ventoinha, gerenciamento térmico e suporte ao hardware específico da APU. O `lscpu` mostra 8 threads em 4 núcleos (configuração Zen 2 com SMT), e a memória livre revela que o Deck, mesmo em modo Desktop, mantém folga.

## Resumo

- Steam Deck (2022) é um PC portátil x86-64 com SteamOS 3, fabricado pela Valve.
- SteamOS 3 é baseado em Arch Linux (rolling), com KDE Plasma, Gamescope e Proton.
- O Deck vingou porque uniu preço competitivo, Proton maduro e hardware controlado.
- A lista "Deck Verified" orienta compatibilidade de jogos no Deck.
- O Deck é a plataforma de referência deste curso.

## Exercícios

1. Execute `cat /etc/os-release` no seu Deck e identifique o `BUILD_ID` e a variante.
2. Compare, em uma tabela, as diferenças entre SteamOS 1.0 (Debian) e SteamOS 3 (Arch).
3. Execute `lscpu` e `free -h` no seu Deck e explique cada linha da saída.
4. Explique por que a escolha de x86-64 (e não ARM) foi crucial para o sucesso do Deck.
5. **Desafio.** Navegue até a seção da loja Steam que lista os jogos verificados para o Deck e identifique três jogos "Unsupported" na sua biblioteca. Para cada um, pesquise no ProtonDB o motivo da incompatibilidade.