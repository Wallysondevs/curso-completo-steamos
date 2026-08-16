Instalar Windows num Steam Deck é uma decisão com custo real: você troca a experiência integrada do SteamOS — suspensão instantânea, TDP por jogo, Proton — por compatibilidade total com anti-cheat e jogos do Game Pass. Antes de formatar qualquer coisa, é preciso escolher onde o Windows vai morar, porque isso define o trabalho de recuperação e o risco de perder seus saves.

:::objetivos
- Avaliar os três destinos possíveis para o Windows no Deck
- Entender as limitações de cada opção em desempenho e praticidade
- Identificar o que o Windows perde em relação ao SteamOS
- Reconhecer os riscos de sobrescrever o bootloader do SteamOS
- Planejar a instalação com base no tamanho do seu SSD
:::

## Os três lugares onde o Windows pode viver

Não existe uma única forma "correta" de rodar Windows no Deck. Existem três, cada uma com um compromisso diferente.

| Destino | Vantagem | Desvantagem |
|---|---|---|
| Dual boot no SSD interno | Melhor desempenho, os dois sistemas no hardware mais rápido | Consome espaço do SSD, exige gerenciar boot |
| Substituir o SteamOS | SSD inteiro para o Windows | Perde o SteamOS de vez |
| microSD externo | Não toca no SSD, reversível em segundos | Mais lento, desgasta o cartão, boot mais frágil |

O dual boot no SSD interno é o caminho mais comum para quem quer o melhor dos dois mundos. O Windows num microSD funciona — e muita gente usa para testar antes de se comprometer —, mas o cartão tem latência e IOPS bem abaixo de um NVMe, e o Windows faz leituras e gravações constantes que encurtam a vida útil de um cartão comum.

:::atencao
O Windows **não** foi feito para rodar a partir de um microSD de forma instalada. A Microsoft bloqueia oficialmente a instalação em cartões e pen drives (o chamado *Windows To Go* foi descontinuado), e mesmo que você force, a experiência é engessada e propensa a corromper. Trate o microSD como teste, não como solução definitiva.
:::

## O que você perde ao sair do SteamOS

É bom ter clareza do custo antes de começar. O SteamOS foi desenhado para o hardware específico do Deck, e parte dessa integração não tem equivalente no Windows da Microsoft.

A **suspensão/resumo instantâneo** — você aperta o botão de energia e o jogo congela, como num console — depende de drivers e do kernel que o SteamOS controla. No Windows, suspender é mais lento e, em muitos jogos, causa travamento na volta.

O ajuste fino de **TDP, clocks e FSR por jogo** que a interface do Steam oferece exige software de terceiros no Windows (é exatamente o papel do SteamDeckTools, que veremos nas seções finais deste capítulo). E o **Proton** — a camada que faz jogos de Windows rodarem no Linux — deixa de existir: no Windows, você roda os jogos nativamente, o que é vantagem para quem usa anti-cheat, mas some com o "tudo integrado" do modo Gaming.

Nada disso é motivo para não instalar. É motivo para decidir com consciência: se o que falta para você é jogar *Call of Duty*, *Fortnite* ou títulos do Game Pass que o anti-cheat bloqueia no Linux, o Windows é a resposta certa.

## Escolhendo pelo tamanho do SSD

O SSD interno do Deck é o bem mais escasso da operação. Antes de particionar, descubra do que você dispõe.

```terminal
$ lsblk -d -o NAME,SIZE,MODEL
NAME SIZE MODEL
nvme0n1 931.5G KINGSTON SNV2S1000G
```

Um Deck com SSD de 64 GB (os primeiros modelos) não tem espaço para um dual boot confortável: o Windows 11 pede ~32 GB só de sistema, e atualizações o empurram para 60 GB ou mais. Nesse caso a saída realista é trocar o SSD por um maior ou usar o microSD. Com 256 GB ou mais, reservar de 80 a 120 GB para o Windows é o ponto de equilíbrio: espaço para o sistema, alguns jogos e a folga que as atualizações exigem.

O modelo que você tem muda também o tipo de partição e a disponibilidade de atualização de BIOS — assunto para as próximas seções.

## Descobrindo qual modelo você tem

Antes de decidir o destino, confirme qual Deck está na sua mão, porque LCD e OLED diferem em Wi-Fi, APU e até no modo como o firmware se comporta diante de um segundo sistema.

```terminal
$ cat /proc/cpuinfo | grep "model name" | head -1
model name      : AMD Custom APU 0405
$ sudo dmidecode -s system-product-name
Jupiter
```

O "AMD Custom APU 0405" é a Aerith, presente no LCD; o OLED usa a Sephiroth (APU 0405 em silício similar, mas com mudanças no controlador de memória). A diferença mais prática para quem vai instalar Windows está no chip de rede, não no codinome — o LCD traz Qualcomm (Wi-Fi 5) e o OLED traz Mediatek (Wi-Fi 6/6E), e os drivers são incompatíveis entre si.

O tamanho do SSD responde a primeira metade da pergunta; o modelo responde a segunda. Juntando as duas informações você já sabe se o dual boot é confortável e quais drivers vai baixar na seção 3.

```terminal
$ df -h /home
Filesystem      Size  Used Avail Use% Mounted on
/dev/nvme0n1p8  955G  342G  613G  36% /home
```

Com `home` em `/dev/nvme0n1p8`, a coluna `Avail` (613G livres) é o orçamento que o Windows e seus jogos disputarão com o que você já tem instalado no SteamOS.

## Resumo

- Windows no Deck pode ir no SSD (dual boot ou substituição total) ou num microSD para teste.
- Dual boot no SSD interno entrega o melhor desempenho preservando o SteamOS.
- microSD é reversível, mas lento e frágil; Windows To Go foi descontinuado.
- Ao sair do SteamOS você perde suspensão instantânea, TDP por jogo e o Proton.
- SSDs de 64 GB não comportam um dual boot confortável de Windows 11.

## Exercícios

1. Rode `lsblk -d -o NAME,SIZE,MODEL` no terminal do Deck e anote a capacidade real do seu SSD. Qual das três opções de destino é viável para você?
2. Liste os jogos que você quer jogar e marque quais usam anti-cheat incompatível com Proton (pesquise o status atual em sites como ProtonDB). Isso justifica o Windows para você?
3. Compare, em prosa, o que acontece com seus saves em nuvem se você usar dual boot versus microSD — considere que o cartão pode falhar.
4. Acesse o site oficial de drivers da Valve (Help → Steam Deck → Windows Resources) e anote a lista de drivers disponíveis antes de prosseguir.
5. **Desafio.** Calcule quanto espaço um Windows 11 "respirável" precisa no seu caso: some ~32 GB de sistema, o tamanho de dois jogos que você quer e a folga de 20% para atualizações. O número cabe no seu SSD atual?
