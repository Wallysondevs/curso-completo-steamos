Você está diante de uma área de trabalho KDE Plasma com quatro ícones e nenhuma barra de tarefas. Não é um bug: é o design intencional da Valve para reduzir a superfície de decisão a exatamente quatro caminhos. Cada ícone dispara um script bash que pode reescrever partições, apagar dados ou abrir um terminal de diagnóstico. Tocar no ícone errado aqui tem consequências reais e, em dois dos quatro casos, irreversíveis — esta seção apresenta cada opção com detalhes suficientes para você nunca confundi-las.

:::objetivos
- Identificar visualmente os quatro ícones e seus rótulos
- Compreender, em alto nível, qual script cada ícone dispara
- Saber quais operações tocam no disco e quais são somente leitura
- Decidir qual caminho usar com base no seu cenário
:::

## A anatomia da área de trabalho de recovery

A tela que você vê é uma sessão KDE Plasma 5 executada como `root` (usuário `deck` no recovery, com `sudo` sem senha). A área de trabalho tem fundo azul escuro com o logo da Valve e quatro ícones grandes, alinhados verticalmente, com rótulos em inglês — a Valve não localizou essa interface:

| Ícone | Rótulo | Script |
|---|---|---|
| Disco rígido com seta circular vermelha | **Reimage Steam Deck** | `/usr/bin/steamos-reimage` |
| Disco rígido com seta circular azul | **Reinstall SteamOS** | `/usr/bin/steamos-reinstall` |
| Pasta com X vermelho | **Clear local user data** | `/usr/bin/steamos-clear-user-data` |
| Janela de terminal preta | **Terminal with repair tools** | `/usr/bin/konsole` |

Cada script, exceto o terminal, mostra uma caixa de diálogo de confirmação antes de começar. Mas a confirmação é uma única tela: não há "tem certeza mesmo?" depois. Um toque duplo pode iniciar uma reimagem que apaga tudo — e você só descobre quando o Deck reinicia pedindo idioma.

```terminal
## dentro do Terminal with repair tools:
$ cat /usr/bin/steamos-reimage
#!/bin/bash
## Script de reimagem — apaga TODAS as partições e recria do zero
[...]
```

:::perigo
O ambiente de recovery roda como root e os scripts têm acesso total ao `/dev/nvme0n1`. Não há proteção de confirmação dupla. Antes de tocar em qualquer ícone, confirme mentalmente: "qual é o meu cenário e qual ícone corresponde a ele?"
:::

## Reimage Steam Deck — o reset absoluto

O ícone vermelho representa a operação mais destrutiva e completa. O script `steamos-reimage`:

1. Apaga todas as partições do SSD interno (`/dev/nvme0n1`).
2. Recria a tabela GPT do zero com o layout A/B padrão da Valve.
3. Formata cada partição com o sistema de arquivos correto.
4. Restaura a imagem do SteamOS para as partições de sistema.
5. Reinicia o Deck no assistente de primeira inicialização (OOBE).

Tempo típico: 15 a 35 minutos, dependendo da velocidade do SSD. Ao final, o Deck está como saiu da caixa — sem seus jogos, sem suas configurações, sem nenhum outro sistema operacional instalado. É o caminho para enviar o Deck para RMA, vendê-lo ou resolver um particionamento corrompido que nenhuma reinstalação conserta.

A seção 6 é dedicada inteiramente a essa operação.

## Reinstall SteamOS — o sistema novo com seus dados

O ícone azul executa `steamos-reinstall`. A diferença fundamental para a reimagem é que ele **não recria a tabela de partições**. Em vez disso:

1. Detecta o layout A/B existente.
2. Identifica qual das duas raízes está ativa.
3. Escreve a imagem do SteamOS na partição raiz inativa.
4. Atualiza o bootloader para apontar para a nova raiz.
5. Mantém `/home` intocada.

Tempo típico: 10 a 20 minutos. Seus jogos, saves locais e configurações devem sobreviver — a Valve qualifica com "tenta preservar" porque, se `/home` estiver corrompida, o script não faz milagre. A seção 7 cobre essa operação em profundidade.

:::dica
Se o Deck está com comportamento estranho após uma atualização (travamentos, regressão de driver), a reinstalação preservando dados é o primeiro ícone a tentar. A reimagem é o último.
:::

## Clear local user data — limpeza cirúrgica

O terceiro ícone é o meio-termo: não mexe no sistema, só nos seus dados. O `steamos-clear-user-data` reformata apenas a partição `/home`, apagando jogos instalados, saves locais, configurações do KDE e qualquer arquivo pessoal no Deck. O sistema continua intacto — mesma versão, mesmas partições de raiz, mesmo bootloader.

Tempo típico: 2 a 5 minutos. É a operação para quando você quer emprestar o Deck, devolver um aparelho de substituição, ou simplesmente começar do zero sem ter que baixar e gravar imagem de recovery. A seção 8 detalha essa opção.

## Terminal with repair tools — acesso direto

O quarto ícone é um atalho para o Konsole, o terminal do KDE. Nenhum script é disparado; você tem um shell de root com acesso a `fdisk`, `fsck`, `mount`, `chroot`, `gdisk`, `parted`, `btrfs` (suporte experimental) e tudo mais que um administrador Linux precisa para diagnosticar e reparar manualmente.

```terminal
deck@steamdeck-recovery ~ $ sudo fdisk -l /dev/nvme0n1
Disk /dev/nvme0n1: 953.87 GiB, 1024209543168 bytes, 2000409264 sectors
[...]
deck@steamdeck-recovery ~ $ sudo fsck -n /dev/nvme0n1p8
fsck from util-linux 2.39.3
e2fsck 1.47.0 (5-Feb-2023)
/home: clean, 184726/58982400 files, 8945621/235903744 blocks
```

O terminal é para quem quer diagnosticar antes de apagar. Se o `fsck` no `/home` reportar erros, você pode tentar repará-los antes de partir para o Clear local user data. A seção 9 explora as possibilidades do terminal.

Os quatro scripts que os ícones disparam são arquivos de texto legíveis e vivem todos em `/usr/bin`:

```terminal
deck@steamdeck-recovery ~ $ ls -l /usr/bin/steamos-*
-rwxr-xr-x 1 root root 5379 Feb 20 10:00 /usr/bin/steamos-clear-user-data
-rwxr-xr-x 1 root root 8270 Feb 20 10:00 /usr/bin/steamos-reimage
-rwxr-xr-x 1 root root 6124 Feb 20 10:00 /usr/bin/steamos-reinstall
```

Poder lê-los antes de executá-los é uma vantagem do SteamOS sobre sistemas fechados: nada aqui é caixa-preta. Se um comando destrutivo o preocupa, abra o arquivo e veja exatamente o que ele fará ao seu disco.

## Como escolher entre os quatro

A decisão se resume a duas perguntas: *meu particionamento está íntegro?* e *meus dados são importantes?*. A tabela a seguir cobre os cenários mais comuns:

| Cenário | Ícone recomendado |
|---|---|
| Deck vai ser vendido ou enviado para RMA | **Reimage** |
| Sistema não inicia, mas `/home` está intacta | **Reinstall** |
| Quero apagar meus dados, mantendo o sistema | **Clear local user data** |
| Não sei qual é o problema | **Terminal** (diagnostique primeiro) |
| Dual-boot corrompeu partições | **Reimage** |
| Atualização quebrou Wi-Fi/som/driver | **Reinstall** |

A regra de ouro: comece com o terminal se há dúvida. Um `fsck` e um `lsblk` custam dois minutos e podem evitar uma reimagem de meia hora. Só avance para Reimage ou Clear local user data quando tiver certeza de que os dados já não importam ou já foram copiados.

## Resumo

- A área de trabalho de recovery tem quatro ícones que disparam scripts de sistema: Reimage (vermelho), Reinstall (azul), Clear user data (pasta) e Terminal (console).
- Todos os scripts rodam como root, com acesso total ao `/dev/nvme0n1` e uma única confirmação.
- Reimage destrói e recria partições; Reinstall reescreve o sistema mantendo `/home`; Clear apaga só `/home`; Terminal não faz nada automaticamente.
- A escolha depende de duas perguntas: particionamento está íntegro? Dados são importantes?
- Na dúvida, vá pelo Terminal primeiro: um diagnóstico rápido pode poupar uma operação destrutiva.

## Exercícios

1. Inicialize o desktop de recovery e anote os quatro ícones visíveis, incluindo os textos em inglês. Por que a Valve optou por não traduzi-los?
2. Abra o Terminal with repair tools e examine o conteúdo do script `/usr/bin/steamos-reinstall` com `cat`. Ele é escrito em qual linguagem? Quantas linhas tem aproximadamente?
3. Classifique cada um dos quatro ícones como "destrutivo" ou "não destrutivo" (com relação aos dados do usuário) e justifique cada classificação.
4. Descreva um cenário em que nem Reimage, nem Reinstall, nem Clear user data seriam suficientes — e o Terminal seria o único caminho viável.
5. **Desafio.** Simule (sem executar de verdade) o que aconteceria se você iniciasse uma Reimagem e, no meio, o pendrive fosse removido acidentalmente. Qual seria o estado do SSD ao reiniciar e como você procederia?