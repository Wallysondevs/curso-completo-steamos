O Windows não chega ao Deck sozinho. Você precisa de uma imagem de instalação gravada num pendrive de forma que o firmware UEFI do Deck consiga iniciar por ela — e aí entram detalhes que fazem a diferença entre uma instalação limpa e uma luta contra erros de *secure boot* e TPM.

:::objetivos
- Baixar a imagem oficial do Windows 11 sem pagar por fontes duvidosas
- Gravar o pendrive com Rufus em modo UEFI+GPT
- Entender por que o Deck não tem TPM 2.0 habilitado por padrão
- Lidar com os requisitos de TPM e *secure boot* do Windows 11
- Verificar o pendrive antes de reiniciar

:::

## De onde baixar a imagem

Use a fonte oficial da Microsoft. A página de download do Windows 11 oferece a opção de baixar a ISO diretamente, e o Rufus pode inclusive fazer o download para você. Evite ISOs "modificadas" que circulam em fóruns: além do risco de malware, versões "lite" removem componentes que os drivers da Valve esperam encontrar.

```terminal
$ curl -L -o win11.iso https://www.microsoft.com/software-download/windows11
```

O download oficial gera uma ISO com hash verificável. Depois de baixar, confirme a integridade antes de gravar — um arquivo corrompido se manifesta como tela azul no meio da instalação, e é frustrante diagnosticar isso na hora errada.

:::info
O Windows 11 exige TPM 2.0 e *secure boot*, requisitos que o Steam Deck não cumpre do jeito padrão. A Valve habilita um TPM virtual (fTPM) no firmware em versões mais novas, mas o *secure boot* costuma estar desligado. O caminho pragmático é criar um pendrive que ignore esses requisitos — e o Rufus automatiza isso.
:::

## Gravando com Rufus no modo certo

O Rufus é a ferramenta de referência para criar esse pendrive num PC Windows. Os ajustes que importam para o Deck são o esquema de partição e o formato do alvo de boot.

1. Selecione o pendrive (8 GB ou mais).
2. Em **Boot selection**, aponte para a ISO do Windows 11.
3. Em **Partition scheme**, escolha **GPT**.
4. Em **Target system**, escolha **UEFI (non CSM)**.
5. Em **Image option**, marque **Extended Windows 11 installation** para desabilitar os checks de TPM e *secure boot*.

A imagem no pendrive é `install.wim`. Se o arquivo passar de 4 GB, o Rufus avisa que o sistema de arquivos FAT32 não comporta o arquivo, e oferece escrever em NTFS — mas UEFI não lê NTFS nativamente no boot. O Rufus resolve criando uma partição de boot FAT32 pequena + a partição NTFS com os arquivos. Aceite a sugestão.

```terminal
$ lsblk
NAME        MAJ:MIN RM   SIZE RO TYPE MOUNTPOINTS
sda           8:0    1  14.9G  0 disk
└─sda1        8:1    1  14.9G  0 part
```

Depois de gravar, ejete com segurança. No Linux, o pendrive costuma aparecer como `/dev/sda` (ou `sdb`), e o Rufus pré-formata tudo — não mexa nas partições criadas.

## Ventoy como alternativa

Se você testa imagens com frequência, o **Ventoy** é mais cômodo: você o instala uma vez no pendrive e, dali em diante, só copia ISOs para dentro dele, e o Ventoy oferece um menu no boot para escolher qual iniciar.

```terminal
$ sudo sh Ventoy2Disk.sh -i /dev/sda
```

O Ventoy também permite contornar os requisitos de TPM/secure boot via uma chave no menu (o *VTOY_WIN11_BYPASS_CHECK*), o que o torna popular justamente para instalar Windows 11 em máquinas como o Deck.

:::dica
Grave também o pendrive de recuperação do SteamOS antes de começar, se ainda não fez. Se a instalação do Windows sobrescrever o bootloader e você quiser voltar, o *recovery image* oficial da Valve é o caminho de restauração mais direto. Anote onde ele está.
:::

## Testando o pendrive e o alvo de boot

Antes de reiniciar para instalar, vale confirmar duas coisas: que o pendrive aparece no menu de boot e que você sabe como abri-lo. No Deck, segure [[Volume Down]] e ligue o aparelho, ou desligue, segure [[Volume Down]] e toque o botão de energia até ouvir o *chime* e solte — o menu de boot lista pendrives e o SSD interno.

| Item no menu | O que é |
|---|---|
| `EFI USB Device` | Seu pendrive UEFI |
| `NVMe` | SSD interno do Deck |

Se o pendrive não aparecer, repasse o esquema de partição (precisa ser GPT com uma partição de boot FAT32/UEFI). Pendrive gravado no modo errado (CSM/MBR) simplesmente não aparece na lista UEFI do Deck.

## Resumo

- Baixe a ISO oficial da Microsoft e confira o hash antes de gravar.
- No Rufus, use GPT + UEFI (non CSM) e a opção Extended para burlar TPM/secure boot.
- O Windows 11 pede TPM 2.0 e secure boot, que o Deck não cumpre por padrão.
- Ventoy permite copiar várias ISOs e contornar os checks via opção própria.
- O menu de boot do Deck abre segurando Volume Down ao ligar.

## Exercícios

1. Baixe a ISO do Windows 11 e grave num pendrive com Rufus usando GPT + UEFI. Descreva cada ajuste que você marcou e por quê.
2. Verifique o checksum SHA256 da ISO baixada e compare com o publicado pela Microsoft. O que um hash confere e o que ele **não** garante?
3. Instale o Ventoy num pendrive e copie duas ISOs para ele. Inicie o Deck pelo menu de boot e confirme que as duas aparecem.
4. Explique por que um pendrive gravado em MBR/CSM não aparece no menu de boot UEFI do Deck.
5. **Desafio.** Sem reinstalar, proponha uma forma de descobrir se o firmware do seu Deck tem fTPM habilitado — dica: procure na BIOS e relacione com o erro "This PC can't run Windows 11" que aparece na instalação.
