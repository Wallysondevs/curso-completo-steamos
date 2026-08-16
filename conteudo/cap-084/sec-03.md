Ninguém perde dados no momento em que abre o aparelho — perde no momento em que abre *sem ter feito backup*. Trocar o SSD significa ou reinstalar o sistema do zero (perdendo tudo que está instalado) ou clonar a unidade antiga para a nova. Ambas as rotas começam pelo mesmo lugar: preservar o que importa e ter um caminho de volta. Backup não é burocracia; é a diferença entre um contratempo e um desastre.

:::objetivos
- Identificar o que vale a pena preservar antes de trocar o SSD
- Criar a mídia de recuperação do SteamOS com o Recovery Image
- Clonar a unidade antiga para a nova com `dd`
- Planejar uma reinstalação limpa como alternativa ao clone
- Restaurar jogos e saves a partir do backup
:::

## O que você pode perder (e o que não pode)

O Steam Deck guarda dados em camadas. Os **jogos instalados** são recuperáveis — baixar de novo custa só tempo e banda. Os **saves**, dependendo do jogo, podem estar só no Steam Cloud, mas muitos títulos não sincronizam, e esses são insubstituíveis. Configurações do SteamOS, layouts do Steam Input e o conteúdo do modo Desktop em `/home/deck` entram na categoria "chato de reconstruir". Priorize na ordem: saves, configurações, jogos.

```terminal
$ du -sh /home/deck/* 2>/dev/null | sort -hr | head
38G  /home/deck/.local/share/Steam
4.1G /home/deck/.var
2.0G /home/deck/.local/share/Steam/steamapps/common
260M /home/deck/.config
```

O `du` revela onde o espaço realmente está. Os jogos ficam sob `.local/share/Steam/steamapps`, e é ali que vive a maior parte dos gigabytes. O `.config` e o `.var` (dados de Flatpaks) são pequenos, mas concentram configurações que levam tempo para refazer.

## Criando a mídia de recuperação

Antes de qualquer coisa, baixe a **imagem de recuperação do SteamOS** e grave num pendrive de ao menos 8 GB. Ela é um sistema Linux live que reinstala o SteamOS do zero, reimagea o disco e também serve como "plano B" se a clonagem falhar. Sem ela, um SSD novo fica inutilizável até você conseguir outro computador para gravar a mídia.

```terminal
$ lsblk -d -o NAME,SIZE,MODEL
NAME     SIZE MODEL
sda     14.9G SanDisk Ultra USB 3.0
nvme0n1 476.9G KINGSTON OM3PDP3512B-A01
```

Identifique seu pendrive pelo `lsblk` **antes** de gravar. Grave com um `dd` apontando para o dispositivo inteiro (não para uma partição). Troque `/dev/sda` pelo nome real do seu pendrive.

:::perigo
`dd` com o alvo errado destrói o conteúdo de qualquer disco sem pedir confirmação. Confirme o `of=` três vezes antes de executar — gravar a imagem por cima do seu SSD atual apaga o sistema inteiro. Sempre desmonte o pendrive antes (`sudo umount /dev/sda1` ou caminho equivalente).
:::

```terminal
$ xz -dc steamdeck-recovery-4.img.bz2 | sudo dd of=/dev/sda bs=4M status=progress conv=fsync
2385+1 registros de entrada
2385+1 registros de saída
```

O comando descomprime a imagem em voo e a grava no pendrive com `status=progress` para acompanhar o avanço. O `conv=fsync` força a escrita para o disco antes de terminar, evitando um pendrive "corrompido" por desligar cedo demais.

## Clonando com dd: o caminho sem reinstalar

Clonar copia setor a setor a unidade antiga para a nova, levando sistema, jogos e configurações juntos. Requer um leitor externo de NVMe USB para conectar a unidade nova enquanto a antiga ainda está dentro do Deck — ou o caminho inverso. A regra de ouro: a unidade de **destino não pode ser menor** que a fonte, mesmo que a fonte esteja mais vazia.

```terminal
$ sudo dd if=/dev/nvme0n1 of=/dev/sda bs=4M status=progress conv=fsync
122104+0 registros de entrada
122104+0 registros de saída
512110190592 bytes (512 GB) copiados, 3215 s, 1.6 GB/s
```

Aqui `if=` é o SSD interno e `of=` o SSD novo no leitor externo. Copiar 512 GB leva da ordem de uma hora. Se o alvo for maior que a fonte, sobram gigabytes não alocados, que você expande depois com uma ferramenta de particionamento — assunto retomado na seção de troca.

:::dica
Para economizar tempo, drene o SSD antes de clonar: desinstale jogos que você não quer levar ou mova-os para o microSD. `dd` copia os setores inteiros, inclusive o espaço "vazio" que ainda contém dados apagados — quanto mais você esvazia de verdade, mais rápida e enxuta fica a imagem.
:::

## Reinstalação limpa como alternativa

A reinstalação limpa grava o SteamOS novinho no SSD e é o caminho quando você **não** tem leitor de NVMe ou prefere começar do zero. O custo é rebaixar os jogos e refazer configurações. O fluxo é o mesmo de um Deck novo: boot pelo pendrive de recuperação, escolher "Reimage Steam Deck", confirmar e aguardar.

```terminal
$ sudo flatpak list > ~/flatpaks.txt
$ cat ~/flatpaks.txt
Nome        ID do aplicativo        Versão
Firefox     org.mozilla.firefox     126.0
Heroic      com.heroicgameslauncher.hgl 2.14.1
```

Antes de reinstalar, exporte o inventário do que você tinha. `flatpak list` gera a relação dos aplicativos de Desktop — reconduzí-los depois é questão de rodar `flatpak install` para cada `ID do aplicativo`. O mesmo vale para pacotes e atalhos: liste-os para não depender da memória.

## Resumo

- Saves que não sincronizam com o Steam Cloud são insubstituíveis e devem ser o foco do backup.
- A mídia de recuperação do SteamOS (pendrive ≥8 GB) é o "plano B" obrigatório antes de abrir o aparelho.
- Clonar com `dd` preserva sistema e jogos, mas exige um leitor de NVMe USB e destino de tamanho igual ou maior.
- Reinstalar limpo é o caminho sem hardware extra, ao custo de rebaixar jogos e refazer configurações.
- `du` localiza o peso dos dados, `flatpak list` inventaria aplicativos e `dd` com `conv=fsync` evita mídia corrompida.

## Exercícios

1. Rode `du -sh /home/deck/* 2>/dev/null | sort -hr | head` e anote os cinco maiores consumidores de espaço do seu Deck.
2. Verifique quais jogos sincronizam saves com a Steam Cloud na interface do Steam. Liste três que **não** sincronizam e que você precisaria copiar manualmente.
3. Exporte sua lista de Flatpaks com `flatpak list > ~/flatpaks.txt` e confirme que o arquivo foi criado legível.
4. Identifique seu pendrive com `lsblk -d -o NAME,SIZE,MODEL` e, **sem rodar**, monte o comando `dd` correto para gravar a imagem de recuperação nele, explicando cada flag.
5. **Desafio.** Explique a diferença entre clonar o disco inteiro com `dd` e copiar arquivos com `rsync -a`. Por que `rsync` não substitui o `dd` quando o objetivo é ter um disco que inicializa, e em que cenário `rsync` é preferível?
