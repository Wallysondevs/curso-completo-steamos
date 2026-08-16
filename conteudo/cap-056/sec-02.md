A formatação é o momento em que tudo pode dar errado se você pular uma etapa. Nesta seção você vai formatar o cartão do jeito da Valve — via Modo Jogo — e do jeito manual, via Modo Desktop com `mkfs.ext4`. O objetivo é um cartão pronto para receber jogos, com o sistema de arquivos certo e a flag `casefold` ativa, que é o que faz os jogos Proton se comportarem como esperado.

:::objetivos
- Formatar o microSD pelo Modo Jogo (interface Steam)
- Formatar pelo terminal com `mkfs.ext4` incluindo `casefold`
- Adicionar um rótulo (label) ao volume para identificação
- Confirmar o resultado com `lsblk` e `blkid`
- Aplicar o checklist de segurança antes de formatar
:::

## Antes de formatar: o checklist

Formatação destrói todos os dados. Antes de qualquer comando, percorra esta lista:

1. **Confirme o dispositivo correto** com `lsblk`. O cartão é `mmcblk0` (ou `mmcblk1`), nunca `nvme0n1` (SSD interno).
2. **Faça backup** de qualquer dado que ainda exista no cartão e que você queira manter.
3. **Desmonte o cartão** se ele estiver montado (a formatação exige isso):
   ```terminal
   $ sudo umount /run/media/deck/SD
   ```

:::perigo
Digitar `mkfs.ext4 /dev/nvme0n1pX` no SSD interno do Deck apaga o SteamOS inteiro, com todos os seus jogos e saves. O cartão **sempre** aparece como `mmcblk*`, não como `nvme*`. Se você vir `nvme` no comando que está prestes a executar, pare imediatamente.
:::

## Formatando pelo Modo Jogo

O caminho mais simples, para a maioria dos usuários:

1. No Modo Jogo, pressione o botão Steam e abra **Configurações**.
2. Vá em **Armazenamento**.
3. Insira o cartão microSD no slot inferior (padrão-gravação voltado para a tela).
4. Selecione o cartão na lista de dispositivos e escolha **Formatar cartão SD**.
5. Confirme. O Steam formata em ext4 com case-folding e o monta automaticamente.

Pronto — após alguns segundos, o cartão aparece como destino de instalação de jogos, e você pode definir se será o local padrão de instalação.

:::info
A formatação do Modo Jogo usa `casefold` por padrão, por isso jogos que assumem sistema sem distinção de maiúsculas funcionam sem ajustes. É a razão principal para preferir este caminho quando você não tem um motivo técnico para formatar manualmente.
:::

## Formatando pelo terminal (ext4 com casefold)

Se você precisa do controle total — ou quer rótulo customizado, tamanho de bloco específico ou simplesmente prefere o terminal — use `mkfs.ext4`. A flag que reproduz o comportamento do Modo Jogo é `casefold`:

```terminal
## Apenas um disco (cartão inteiro, sem tabela de partição)
$ sudo mkfs.ext4 -L SD -O casefold /dev/mmcblk0

## Ou com uma partição já criada
$ sudo mkfs.ext4 -L SD -O casefold /dev/mmcblk0p1
```

O que cada parte faz:

- `-L SD`: define o rótulo do volume como `SD` (você pode escolher outro nome).
- `-O casefold`: ativa a feature `casefold`, permitindo que o diretório trate maiúsculas/minúsculas como equivalentes.
- `/dev/mmcblk0` ou `/dev/mmcblk0p1`: o alvo — cartão inteiro ou uma partição.

Para ativar o case-folding num diretório específico depois de formatado:

```terminal
## Habilitar casefolding num diretório (exige montar sem a opção contrária)
$ sudo chattr +F /run/media/deck/SD/compatdata
```

:::dica
O SteamOS formata o cartão pelo Modo Jogo rotulando-o como `primary` ou `sd` conforme o contexto. Se você formatar manualmente com `-L`, escolha um rótulo curto e sem espaços para evitar problemas de caminho em scripts.
:::

## Confirmando o resultado

Depois de formatar, verifique o sistema de arquivos e o rótulo:

```terminal
$ lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT
NAME        SIZE FSTYPE LABEL MOUNTPOINT
mmcblk0   119.1G
└─mmcblk0p1 119.1G ext4   SD    /run/media/deck/SD

$ sudo blkid /dev/mmcblk0p1
/dev/mmcblk0p1: LABEL="SD" UUID="..." TYPE="ext4"
```

A linha `TYPE="ext4"` e o `LABEL="SD"` confirmam o sucesso. Para checar se o casefold está ativo no superbloco:

```terminal
$ sudo tune2fs -l /dev/mmcblk0p1 | grep -i casefold
Filesystem features: ... casefold ...
```

## Pontos-chave

- Formatação é destrutiva: confirme o dispositivo (`mmcblk*`, nunca `nvme*`) e faça backup antes.
- Modo Jogo formata em ext4 com case-folding automaticamente — ideal para a maioria.
- `sudo mkfs.ext4 -L SD -O casefold /dev/mmcblk0p1` reproduz isso manualmente.
- `chattr +F` habilita case-folding num diretório específico.
- Confirme com `lsblk`, `blkid` e `tune2fs -l | grep casefold`.

## Exercícios

1. Rode `lsblk -o NAME,SIZE,FSTYPE,LABEL,MOUNTPOINT` e identifique com precisão o dispositivo `mmcblk*` do cartão.
2. Formate (num cartão descartável) com `sudo mkfs.ext4 -L TESTE -O casefold /dev/mmcblk0p1` e confirme com `blkid`.
3. Verifique a presença da feature `casefold` com `sudo tune2fs -l`.
4. Monte o cartão e use `chattr +F` num diretório de teste; confirme com `lsattr`.
5. **Desafio.** Compare o tempo de formatação de um cartão com e sem a flag `casefold` e observe se há diferença perceptível.
