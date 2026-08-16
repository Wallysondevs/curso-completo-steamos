Sem firmware e chaves criptográficas, um emulador de Nintendo Switch não sai da tela preta. O firmware contém o sistema operacional do console — o microkernel Horizon, seus drivers e serviços, o applet do menu HOME. As chaves descriptografam os arquivos de jogo (NSP/XCI) e o próprio firmware. Esta seção explica o que cada arquivo faz, como obtê-lo legalmente e onde colocá-lo.

:::objetivos
- Entender a função de `prod.keys`, `title.keys` e do firmware no emulador
- Extrair firmware e chaves de um console Switch real com Hekate e Lockpick_RCM
- Organizar os arquivos nos diretórios corretos de Yuzu e Ryujinx
- Verificar que o emulador reconheceu firmware e chaves
:::

## O que cada arquivo faz

O Switch protege seus conteúdos com criptografia. Cada jogo, atualização e DLC é um arquivo NSP (Nintendo Submission Package) ou XCI (cartucho dump) criptografado com chaves que só o console original conhece. O emulador precisa dessas chaves para decifrar os arquivos e executar o código.

| Arquivo | O que contém | Obrigatório? |
|---|---|---|
| `prod.keys` | Chaves de produção: master keys, header keys, ticket keys. Derivadas do hardware do console. | Sim — sem elas nada abre |
| `title.keys` | Chaves específicas de cada título. Usadas para descriptografar o conteúdo individual. | Recomendado — sem elas, alguns jogos falham na inicialização |
| Firmware (.zip) | O sistema operacional Horizon: kernel, módulos, serviços de sistema, fontes, applets, Mii, teclado virtual | Sim — sem firmware o emulador não inicializa nenhum jogo |

A `prod.keys` é um arquivo de texto simples com pares `chave = valor`:

```text
master_key_00 = 0F1A2B3C4D5E6F708192A3B4C5D6E7F8
master_key_01 = 1A2B3C4D5E6F708192A3B4C5D6E7F809
header_key = AABBCCDDEEFF00112233445566778899
aes_kek_generation_source = 00112233445566778899AABBCCDDEEFF
```

A `title.keys` segue o mesmo formato, mas cada entrada é associada a um title ID (identificador hexadecimal de 16 caracteres do jogo):

```text
0100000000010000 = 00112233445566778899AABBCCDDEEFF
01006F8002326000 = FFEEDDCCBBAA99887766554433221100
```

:::perigo
Baixar `prod.keys` ou firmware da internet é violação de copyright, mesmo que você possua o console original. A única forma legal de obter esses arquivos é extraí-los do seu próprio Switch com ferramentas como Hekate e Lockpick_RCM. Esta seção assume que você está fazendo o dump do seu console.
:::

## Extraindo do seu Switch: pré-requisitos

Para extrair firmware e chaves você precisa de:
- Um Nintendo Switch vulnerável ao exploit Fusée Gelée (modelos V1 até meados de 2018) **ou** um Switch com modchip instalado (qualquer modelo)
- Um cartão microSD formatado em FAT32
- Um payload injector ou um PC com USB-C para enviar o payload (RCM loader, TegraRcmGUI no Windows, fusee-launcher no Linux)

No Steam Deck, você pode usar o `fusee-launcher.py` para enviar o payload via USB:

```terminal
$ git clone https://github.com/nh32/fusee-launcher
$ cd fusee-launcher
$ sudo python3 fusee-launcher.py --payload /caminho/para/hekate_ctcaer.bin
```

## Extraindo as chaves com Lockpick_RCM

Lockpick_RCM é um payload que extrai todas as chaves do console direto do hardware, sem inicializar o Horizon OS. Isso é importante porque ele obtém as chaves antes de qualquer trava do sistema operacional.

Etapas no Switch:
1. Coloque o Switch em modo RCM (Recovery Mode) com um jig no trilho direito ou usando AutoRCM
2. Injete o payload `Lockpick_RCM.bin`
3. Na interface do Lockpick, selecione **Dump from SysNAND**
4. As chaves são salvas em `sd:/switch/prod.keys` e `sd:/switch/title.keys`

Transfira esses arquivos para o Steam Deck:

```terminal
$ mkdir -p ~/.local/share/yuzu/keys
$ mkdir -p ~/.config/Ryujinx/system
$ cp /run/media/mmcblk0p1/switch/prod.keys ~/.local/share/yuzu/keys/
$ cp /run/media/mmcblk0p1/switch/title.keys ~/.local/share/yuzu/keys/
$ cp /run/media/mmcblk0p1/switch/prod.keys ~/.config/Ryujinx/system/
$ cp /run/media/mmcblk0p1/switch/title.keys ~/.config/Ryujinx/system/
```

:::nota
O Ryujinx procura `prod.keys` em `~/.config/Ryujinx/system/`. O Yuzu procura em `~/.local/share/yuzu/keys/`. Se colocar no diretório errado, o emulador não reclama — simplesmente não abre nenhum jogo.
:::

## Extraindo o firmware com Hekate e TegraExplorer

O firmware é o sistema operacional completo do Switch. Para extrair:

1. Injete o payload `hekate_ctcaer.bin`
2. No menu do Hekate, vá em **Payloads** e selecione `TegraExplorer.bin`
3. No TegraExplorer, vá em **FirmwareDump** → **Dump sysMMC firmware**
4. O firmware é salvo como um arquivo `.zip` no cartão SD

No Yuzu, o firmware é instalado via interface gráfica: **File → Install Files to NAND** e selecione o `.zip`. No Ryujinx: **Tools → Install Firmware** → selecione o `.zip`.

```terminal
$ ls -lh ~/.local/share/yuzu/nand/system/Contents/registered/
total 250M
-rw-r--r-- 1 ana ana   1M Feb 10 12:34 0100000000000001.nca
-rw-r--r-- 1 ana ana  10M Feb 10 12:34 0100000000000002.nca
-rw-r--r-- 1 ana ana  24M Feb 10 12:34 0100000000000003.nca
...
```

## Verificando que tudo funciona

Abra o Yuzu. Se houver firmware e chaves corretos, o emulador mostra a versão do firmware e a pasta do sistema na barra de status inferior. Outra forma de verificar:

```terminal
$ ls ~/.local/share/yuzu/keys/
prod.keys  title.keys
$ ls ~/.local/share/yuzu/nand/system/Contents/registered/ | wc -l
196
$ grep -c "master_key" ~/.local/share/yuzu/keys/prod.keys
18
```

No Ryujinx, vá em **File → Open Ryujinx Folder** e confira `system/prod.keys` e `bis/system/Contents/registered/`. A versão do firmware aparece no canto inferior direito da janela principal.

Se o firmware está instalado e as chaves estão no lugar, o emulador consegue abrir a tela inicial do Switch virtual — mesmo sem nenhum jogo. É o teste de fumaça antes de prosseguir.

## Resumo

- `prod.keys` contém as chaves mestras de criptografia extraídas do hardware do Switch; `title.keys` contém chaves por título.
- O firmware é o sistema operacional Horizon completo, instalado na NAND virtual do emulador.
- A extração legal exige um Switch vulnerável a Fusée Gelée ou com modchip, mais Hekate e Lockpick_RCM.
- Arquivos baixados da internet violam copyright — mesmo com console próprio.
- Yuzu e Ryujinx usam diretórios diferentes para chaves e firmware; confira antes de copiar.

## Exercícios

1. Extraia as `prod.keys` do seu Switch com Lockpick_RCM e conte quantas chaves o arquivo contém usando `grep -c "=" prod.keys`.
2. Instale o firmware no Yuzu e anote a versão exata que aparece na barra de status (ex.: 17.0.1). Essa é a versão mais recente que seu Switch suporta?
3. Mova temporariamente a `prod.keys` para outro diretório e tente abrir um jogo no Yuzu. Qual é a mensagem de erro exata?
4. Compare os arquivos `prod.keys` extraídos da SysNAND e da EmuNAND do seu Switch. Eles diferem? Se sim, em quais entradas?
5. **Desafio.** Use `strings` e `hexdump` para inspecionar um arquivo `.nca` do firmware. Identifique o magic number nos primeiros 4 bytes (deveria ser `NCA3` ou `NCA2`). Explique por que sem a chave `header_key` o emulador não consegue nem ler o cabeçalho.