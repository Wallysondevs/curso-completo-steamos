Tanto o Lutris quanto o Heroic criam prefixos Wine para você, mas quase sempre de forma automática e escondida. O Bottles inverte esse jogo: nele o prefixo é a estrela. Você cria, nomeia, escolhe o "ambiente" (gaming, aplicação, custom) e controla dependências, versões de runner e até backups — tudo com granularidade que as outras ferramentas não expõem. Se você já se sentiu limitado pelo "prefixo que o launcher decidiu criar", o Bottles é a saída.

:::objetivos
- Entender o conceito de garrafa (bottle) como um prefixo Wine gerenciado
- Distinguir os ambientes gaming, application e custom
- Reconhecer templates e receitas de instalação
- Saber quando usar o Bottles em vez de Lutris ou Heroic
- Identificar onde as garrafas ficam no disco
:::

## Um prefixo Wine com nome e dono

No fundo, uma garrafa (bottle) é um prefixo Wine — aquela pasta que simula um `C:` de Windows — mas envolto numa camada de gestão. Em vez de `~/.wine` anônimo ou de prefixos espalhados, cada garrafa tem um nome, um tipo e um conjunto de configurações versionadas.

A diferença prática é enorme. Num prefixo comum, se você instala uma biblioteca errada, muitas vezes a solução é apagar tudo e recomeçar. No Bottles, você duplica a garrafa, testa a mudança numa cópia e volta atrás se der errado. É uma ferramenta de experimentação, não só de execução.

```terminal
$ flatpak info com.usebottles.bottles | head -4

Bottles - Run Windows software on Linux

          ID: com.usebottles.bottles
         Ref: app/com.usebottles.bottles/x86_64/stable
```

O ID do Flatpak é `com.usebottles.bottles`. Note o `usebottles` no meio, que distingue o projeto oficial de forks. Assim como os outros, ele roda totalmente sandboxado, e as garrafas ficam dentro do diretório de dados do Flatpak.

## Ambientes: gaming, application e custom

Ao criar uma garrafa, o Bottles pergunta qual o **ambiente**. É a primeira decisão e molda tudo que vem depois.

- **Gaming** — prepara o prefixo para jogos: habilita DXVK, VKD3D, esync/fsync e demais otimizações típicas do Proton.
- **Application** — pensado para programas de desktop Windows (um editor, um utilitário de banco), sem as otimizações de jogo.
- **Custom** — folha em branco: você define tudo manualmente, e o Bottles não presume nada.

```terminal
$ bottles --help 2>&1 | head -20
usage: bottles [-h] [-v] [-l] [-e EXECUTABLE] [-b BOTTLE] ...

Bottles 2022.8.14

positional arguments:
  command            bottle command to run

options:
  -h, --help         show this help message and exit
  -v, --version      show program's version number and exit
  -l, --list         list all your bottles
  -e, --executable   executable to launch in a bottle
  -b, --bottle       target bottle name
```

O CLI já deixa claro o modelo mental: `-l` lista garrafas, `-b` escolhe uma, `-e` aponta o executável que vai rodar dentro dela. Tudo gira em torno da garrafa — não do jogo, nem da loja.

:::nota
O termo "bottle" é uma metáfora para o sandbox: cada garrafa isola uma instalação Windows completa, com seu próprio registro, suas DLLs e seu `Program Files`. Graças ao Wine, duas garrafas não se contaminam, o que permite ter versões diferentes da mesma biblioteca em jogos diferentes sem conflito.
:::

## Templates e receitas

O Bottles também tem a noção de **templates** (modelos): conjuntos pré-definidos de dependências para uma tarefa. Um template de "gaming" já vem com os runtimes comuns de jogos; um template de "application" traz fontes e componentes de interface que programas de escritório esperam.

Você pode baixar **dependências** individuais (um runtime VC++, o .NET, fontes Microsoft) ou aplicar **installers** de aplicativos conhecidos com um clique — o Bottles mantém uma lista de instaladores de jogos e programas da comunidade, semelhante em espírito aos scripts do Lutris, mas mais focada em "componentes e programas" do que em "jogo completo".

:::dica
Como o Bottles é mais granular, ele é o lugar certo para construir um prefixo "de referência" que depois você aponta para o Lutris ou o Heroic usarem. Você cria a garrafa no Bottles, ajusta dependências, faz backup e então referencia essa garrafa como prefixo externo no seu launcher favorito.
:::

## Quando o Bottles resolve o que os outros não resolvem

O caso clássico do Bottles é o programa Windows que não é um jogo de loja: um contador, um editor antigo, uma ferramenta interna do trabalho. Lutris e Heroic não têm interface boa para isso; o Bottles foi projetado exatamente para isso.

Outro caso é quando um jogo instalado pelo Heroic quase roda, mas falta uma dependência específica. Em vez de mexer num prefixo escondido, você abre esse prefixo no Bottles como garrafa externa, adiciona a dependência e continua.

:::exemplo
Ana tentou rodar um jogo indie antigo que precisava de um runtime VC++ 2013 específico. O Heroic criou o prefixo, mas o jogo fechava na tela de título. Abrindo o prefixo no Bottles, ela instalou a dependência exata, ativou o modo "virtual desktop" para resolver um problema de resolução e o jogo rodou. Sem o Bottles, a alternativa seria recriar o prefixo do zero à mão.
:::

## A anatomia das garrafas no disco

Entender onde as garrafas vivem facilita backup e limpeza.

```terminal
$ bottles --list
Name             Environment  Runner
-----------------------------------------
jogo-antigo      gaming       soda-7.0
contabilidade    application  wine-9.0
$ ls ~/.var/app/com.usebottles.bottles/data/bottles/bottles/
jogo-antigo  contabilidade
```

Duas observações da saída. Primeiro, o runner `soda` é o Wine otimizado mantido pela comunidade do Bottles, um primo do Proton feito para esse ecossistema. Segundo, cada garrafa é uma pasta com nome legível em vez de um hash — o que torna o backup trivial: copiar uma pasta é copiar uma garrafa inteira, com registro, DLLs e tudo.

## Resumo

- Uma bottle é um prefixo Wine com nome, tipo e configuração gerenciados pelo Bottles.
- Os ambientes gaming, application e custom definem o nível de otimização e presunção.
- Templates e dependências permitem construir prefixos de referência com granularidade fina.
- O `soda` é o runner Wine otimizado mantido pela comunidade do Bottles.
- Garrafas ficam em `~/.var/app/com.usebottles.bottles/data/bottles/bottles/`, uma pasta por garrafa.
- O Bottles complementa Lutris/Heroic em programas desktop e prefixos que precisam de ajuste fino.

## Exercícios

1. Instale o Bottles pelo Flatpak e confirme com `flatpak info com.usebottles.bottles`.
2. Crie uma garrafa de ambiente "gaming" e outra de "application". Compare as dependências padrão de cada uma na tela de detalhes.
3. Explore `bottles --list` e `bottles --help` e relacione cada opção ao que a interface faz.
4. Abra uma garrafa existente (ou crie uma nova) e instale uma dependência individual, como um runtime VC++. Observe o log de instalação.
5. **Desafio.** Crie uma garrafa "custom" vazia, instale manualmente um runtime .NET e depois exporte o backup da garrafa. Localize o arquivo de backup no disco e explique o que ele contém.
