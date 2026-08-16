Você tem o emulador instalado, as chaves no lugar e o firmware carregado. Falta a parte mais importante: os jogos. Esta seção cobre como extrair cartuchos, cópias digitais, atualizações, DLCs e saves do seu próprio Switch — sempre pelo caminho legal. O formato NSP, o XCI, as diferenças entre dump de cartucho e de eShop, e como organizar tudo no Steam Deck.

:::objetivos
- Entender os formatos NSP, XCI, NCA e suas diferenças
- Extrair cartuchos físicos e jogos digitais com nxdumptool
- Copiar saves do Switch e convertê-los para o emulador
- Organizar ROMs, updates e DLCs na estrutura de pastas do Deck
:::

## NSP, XCI, NCA: o dicionário de formatos

Todo conteúdo do Switch é distribuído como arquivos NCA (Nintendo Content Archive) — contêineres criptografados que encapsulam código executável, assets, metadados e o ticket de licença. Esses NCAs são empacotados em dois formatos principais:

| Formato | Origem | O que contém |
|---|---|---|
| **NSP** (Nintendo Submission Package) | eShop, servidores CDN da Nintendo | O jogo base, podendo incluir atualizações e DLCs como NCAs separados |
| **XCI** (Gamecard Image) | Cartucho físico | Imagem completa do cartucho: jogo base, ícone, certificado, área de save |
| **NCA** (Nintendo Content Archive) | Interno de NSP/XCI | A unidade atômica: executável, assets, ticket, certificado |

Yuzu e Ryujinx leem NSP e XCI diretamente. Você não precisa extrair os NCAs manualmente — o emulador faz isso internamente.

:::info
XCI é preferível para arquivamento porque contém o cartucho íntegro, incluindo o certificado e a área de save inicial. NSP é mais compacto porque omite o container externo do cartucho, mas perde a assinatura do cartucho original.
:::

## Extraindo um cartucho físico com nxdumptool

O nxdumptool é um homebrew para Switch que faz dump completo de cartuchos, incluindo o certificado. Roda diretamente no console, via Hekate.

Etapas:
1. Injete Hekate e inicie o Atmosphere (CFW)
2. Abra o nxdumptool pelo Homebrew Menu (álbum + R)
3. Insira o cartucho físico
4. Selecione **Dump gamecard content → XCI dump**
5. Escolha o destino (SD card)
6. O dump leva de 5 a 20 minutos dependendo do tamanho do cartucho e da velocidade do SD

```terminal
$ ls -lh /run/media/mmcblk0p1/nxdumptool/XCI/
total 15G
-rw-r--r-- 1 ana ana 15G Mar 12 14:22 "Legend of Zelda, The - Tears of the Kingdom.xci"
```

Para jogos digitais (eShop), o nxdumptool também funciona — ele lê o título instalado na NAND ou no SD e gera um NSP:

```text
nxdumptool → Dump installed SD/eMMC → Nintendo Submission Package (NSP)
```

## Copiando saves do Switch para o emulador

Os saves do Switch ficam na NAND interna, criptografados. Para extraí-los, você usa o JKSV (homebrew gerenciador de saves):

1. Abra o JKSV via Homebrew Menu
2. Selecione o jogo na lista
3. Escolha **New → Export** para criar um backup
4. Os saves ficam em `sd:/JKSV/<jogo>/<nome_do_backup>/`

No Steam Deck, copie a pasta do save:

```terminal
$ cp -r /run/media/mmcblk0p1/JKSV/ZeldaTotK/backup_2024-03-12/ \
     ~/.local/share/yuzu/nand/user/save/0000000000000000/0100F2C0115B6000/
```

O diretório de destino no Yuzu é `nand/user/save/0000000000000000/<titleID>/`. O `<titleID>` é o identificador hexadecimal do jogo — você encontra na lista de títulos do JKSV ou no switchbrew.org.

:::atencao
O Ryujinx tem compatibilidade limitada com saves extraídos diretamente. Em muitos casos, você precisa usar o Checkpoint (outro homebrew) em vez do JKSV, ou converter o save com ferramentas como `sav-util`. Teste um jogo simples primeiro.
:::

## Organizando ROMs no Steam Deck

Antes de copiar os arquivos para o Deck, é útil verificar a integridade do dump com um hash:

```terminal
$ sha256sum "/run/media/mmcblk0p1/nxdumptool/XCI/Legend of Zelda, The - Tears of the Kingdom.xci"
a8f3c2d1e6b90745231456abc789def0123456789abcdef0123456789abcdef01  Legend of Zelda, The - Tears of the Kingdom.xci
```

Guarde esse hash — se o arquivo corromper durante a cópia para o Deck, você detecta a falha antes de perder tempo debugando um crash que, na verdade, é corrupção silenciosa do dump.

Uma estrutura de diretórios limpa evita dor de cabeça quando o catálogo cresce:

```text
~/roms/switch/
├── base/           # Jogos no formato NSP ou XCI
│   ├── Mario Kart 8 Deluxe.xci
│   ├── Super Mario Odyssey.nsp
│   └── ...
├── updates/        # Atualizações de jogo (NSP)
│   ├── Mario Kart 8 Deluxe [v3405056].nsp
│   └── ...
├── dlc/            # DLCs (NSP)
│   ├── Mario Kart 8 Deluxe DLC - Wave 1.nsp
│   └── ...
└── mods/           # Mods da comunidade
    ├── TOTK DynamicFPS/
    └── ...
```

No Yuzu, você instala updates e DLCs via **File → Install Files to NAND** — eles são mesclados ao jogo base na NAND virtual. No Ryujinx, o mesmo comando está em **File → Load Application from File**.

## Dumping de cartucho sem Switch desbloqueável

Se seu Switch não é vulnerável a Fusée Gelée e você não quer instalar modchip, a opção legal é usar o método de transferência local: o Switch transfere o save para outro Switch via Wi-Fi. Com um segundo Switch desbloqueado, você recebe o save e extrai com JKSV. Esse processo é trabalhoso e fora do escopo do Deck — mas é a via legal para quem tem Switch patched (V2, Lite, OLED) sem modchip.

## Resumo

- NSP é o formato de distribuição digital (eShop); XCI é a imagem completa do cartucho físico; ambos são legíveis por Yuzu e Ryujinx.
- nxdumptool extrai cartuchos como XCI e jogos digitais como NSP direto do console com CFW.
- JKSV exporta saves descriptografados que podem ser copiados para o diretório `nand/user/save/` do Yuzu.
- Organize ROMs em `base/`, `updates/`, `dlc/` e `mods/` — atualizações e DLCs são instalados na NAND virtual.
- Saves extraídos do Switch precisam ser colocados na pasta correta com o title ID hexadecimal do jogo.

## Exercícios

1. Faça o dump de um cartucho físico como XCI com nxdumptool. Compare o tamanho do arquivo com o tamanho reportado na caixa do jogo.
2. Extraia o save de um jogo com mais de 20 horas de progresso usando JKSV e copie para o Yuzu no Deck. O jogo reconhece o save?
3. Instale uma atualização de jogo (NSP) no Yuzu e verifique a versão na barra de título do emulador durante a execução.
4. Organize 5 jogos na estrutura `base/`, `updates/`, `dlc/` e configure os diretórios no emulador para apontar para cada pasta.
5. **Desafio.** Use `hactool` (ferramenta de linha de comando para manipular NCAs) no Deck para extrair o ícone de um NSP e convertê-lo em PNG. O ícone está no NCA do tipo "control".