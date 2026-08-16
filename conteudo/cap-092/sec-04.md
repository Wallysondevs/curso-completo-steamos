Quando o reset de fábrica não é suficiente — ou quando o sistema sequer inicia — a imagem de recuperação do SteamOS é a ferramenta definitiva. Ela é um sistema Linux live que arranca de um pendrive USB e oferece três modos de operação: reinstalar preservando `/home`, reinstalar apagando tudo, ou cair num terminal para particionamento e recuperação manual. Dominar essa ferramenta significa nunca ficar com o aparelho emparedado.

:::objetivos
- Obter a imagem de recuperação oficial da Valve
- Gravar corretamente a imagem num pendrive USB-C
- Inicializar pelo pendrive e escolher o modo de reinstalação adequado
- Concluir a reinstalação e validar o sistema resultante
:::

## Obtendo a imagem de recuperação

A Valve distribui a imagem oficialmente em `help.steampowered.com`. A página traz o link de download da ISO para cada modelo (LCD, OLED) e instruções oficiais de gravação. O arquivo tem cerca de 3 GB e é uma imagem de disco completa — não um instalador convencional.

```terminal
$ curl -L -o ~/Downloads/steamdeck-recovery-3.6.20.img.bz2 \
  https://steamdeck-images.steamos.com/recovery/steamdeck-recovery-3.6.20.img.bz2
$ sha256sum ~/Downloads/steamdeck-recovery-3.6.20.img.bz2
```

O hash oficial está na página de download. Conferir o `sha256sum` garante que o arquivo não foi corrompido ou adulterado durante a transferência — passo ignorado por muitos, mas essencial quando o que está em jogo é a reinstalação do sistema inteiro.

:::atencao
Use apenas a imagem oficial da Valve. Imagens de terceiros podem conter modificações ou malware. O domínio `steamos.com` e `help.steampowered.com` são as únicas fontes confiáveis para o download.
:::

## Gravando a imagem no pendrive

A imagem está comprimida com `bzip2`. Depois de descomprimir, é preciso gravá-la diretamente no dispositivo do pendrive (ex: `/dev/sda`), e não numa partição (`/dev/sda1`). Gravar na partição em vez do dispositivo é o erro mais comum — o pendrive não será bootável.

```terminal
$ bzip2 -d steamdeck-recovery-3.6.20.img.bz2
$ sudo dd if=steamdeck-recovery-3.6.20.img of=/dev/sda bs=4M status=progress conv=fsync
```

O `bs=4M` acelera a gravação, `status=progress` mostra o avanço e `conv=fsync` garante que tudo seja escrito antes de terminar. Identifique o dispositivo correto com `lsblk` antes de executar o `dd`: gravar no dispositivo errado é destrutivo e irreversível.

```terminal
$ lsblk -o NAME,SIZE,TYPE,MOUNTPOINTS
NAME        SIZE TYPE MOUNTPOINTS
sda        14.8G disk
├─sda1     14.8G part
```

O pendrive aparecerá como `sda` ou `sdb` (sem `nvme` no nome). Confirme o tamanho (tipicamente 8 GB ou mais) e que não está montado em nenhum ponto crítico antes de sobrescrever.

:::dica
Depois de gravar a imagem, o pendrive não aparecerá mais como armazenamento comum — ele se torna bootável. Para reutilizá-lo como armazenamento normal depois, basta recriar a tabela de partições com `sudo parted /dev/sda mklabel gpt` e formatar.
:::

## Inicializando pelo pendrive

Com o Steam Deck desligado, segure o botão de volume para baixo (`Vol -`) e pressione o botão de liga/desliga. Solte o de liga/desliga, mantendo o `Vol -` até aparecer o menu de boot. Selecione o pendrive (aparece como `EFI USB Device`) e pressione A.

```terminal
Welcome to the Steam Deck Recovery Image
  - Reinstall SteamOS (keep /home)
  - Reimage SteamOS (wipe everything)
  - Rescue (terminal)
```

A tela inicial do recovery oferece três rotas. A primeira reinstala o sistema preservando a partição `/home` — útil quando o problema está no sistema base mas os dados do usuário estão intactos. A segunda apaga tudo e recria as partições do zero, equivalente a uma reinstalação completa de fábrica. A terceira abre um terminal com ferramentas de diagnóstico e particionamento.

## Escolhendo o modo de reinstalação

O modo "Reinstall SteamOS" (keep /home) é mais rápido e preserva jogos e configurações, mas só funciona se `/home` estiver íntegro. O modo "Reimage SteamOS" é a rota nuclear: recria a tabela de partições e todos os sistemas de arquivos, voltando a exatamente o layout de fábrica.

```terminal
# Este é o script aproximado que o modo "Reimage" executa por baixo:
$ sudo parted -s /dev/nvme0n1 mklabel gpt
$ sudo sgdisk /dev/nvme0n1 -R /path/to/partition-table.bin
$ sudo mkfs.ext4 -F /dev/nvme0n1p9
```

O script interno recria as partições 1-9 conforme o layout padrão e restaura as imagens de sistema nas partições A/B (4/5 e 7/8). A escolha entre "Reinstall" e "Reimage" depende da gravidade: se `/home` está corrompido ou se houve troca de SSD, vá de "Reimage" e depois restaure seu backup.

:::atencao
O modo "Reimage" apaga **todas** as partições, incluindo as de boot e recovery antigas. É a rota mais segura para eliminar problemas persistentes, mas também a mais demorada e a que exige backup completo prévio.
:::

## Validando a reinstalação

Após a reinstalação, o sistema reinicia na tela de configuração inicial. Antes de logar e começar a instalar jogos, valide a saúde do sistema com alguns comandos rápidos.

```terminal
$ lsblk /dev/nvme0n1
NAME        MAJ:MIN RM  SIZE RO TYPE MOUNTPOINTS
nvme0n1     259:0    0  512G  0 disk
├─nvme0n1p1 259:1    0   64M  0 part
├─nvme0n1p2 259:2    0   32M  0 part
├─nvme0n1p3 259:3    0   32M  0 part
├─nvme0n1p4 259:4    0    5G  0 part
├─nvme0n1p5 259:5    0    5G  0 part
├─nvme0n1p6 259:6    0  256M  0 part /efi
├─nvme0n1p7 259:7    0    5G  0 part /
├─nvme0n1p8 259:8    0    5G  0 part /var
└─nvme0n1p9 259:9    0  462G  0 part /home
```

As 9 partições devem estar presentes e os pontos de montagem (`/efi`, `/`, `/var`, `/home`) atribuídos. Se alguma estiver faltando, a reinstalação pode não ter concluído corretamente — tente novamente ou vá para o modo "Rescue" da próxima seção.

## Resumo

- Baixe a imagem de recuperação oficial em `help.steampowered.com` e confira o `sha256sum`.
- Descomprima com `bzip2 -d` e grave no dispositivo (não na partição) com `dd`.
- Inicie pelo pendrive segurando `Vol -` ao ligar.
- Escolha "Reinstall" (mantém `/home`) para problemas de sistema, ou "Reimage" (apaga tudo) para troca de SSD e corrupções graves.
- Valide as 9 partições com `lsblk` após a reinstalação antes de logar.

## Exercícios

1. Acesse `help.steampowered.com` e localize a página de download da imagem de recuperação mais recente. Anote a versão.
2. Identifique um pendrive no seu sistema com `lsblk` e explique por que gravar em `/dev/sda` e não em `/dev/sda1`.
3. Descreva a diferença entre os modos "Reinstall" e "Reimage" e dê um cenário de uso para cada.
4. Execute `lsblk /dev/nvme0n1` no seu Steam Deck e confirme se as 9 partições padrão estão presentes.
5. **Desafio.** Proponha um procedimento de emergência para um Steam Deck que falhou na reinstalação e não monta `/home`: o que você faria no terminal "Rescue" para diagnosticar e corrigir?