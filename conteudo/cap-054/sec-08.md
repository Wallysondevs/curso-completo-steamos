Começou com três ROMs e dez patches. Em seis meses, tem trezentos ROMs, patches de todas as versões, traduções em andamento, e um monte de homebrew que você nem lembra o que é. A disciplina de organização é a parte menos glamorosa do hobby, mas é a que faz a diferença entre "abrir e jogar" e "passar meia hora procurando".

:::objetivos
- Estruturar diretórios para ROMs, patches, homebrew e ferramentas
- Nomear ROMs de forma consistente e rastreável
- Versionar patches e manter um changelog próprio
- Fazer backup e sincronizar entre Deck e PC
- Ferramentas de gerenciamento de ROM library (RomVault, ClrMamePro)
:::

## A estrutura de diretórios

Uma estrutura limpa escala e evita confusão. O EmuDeck dá o pontapé inicial com `~/Emulation/roms/`, mas você pode (e deve) ir além:

```terminal
~/Emulation/
├── roms/                  # ROMs originais (base, intocados)
│   ├── gba/
│   ├── snes/
│   └── psx/
├── hacks/                 # ROMs já patcheados (saída dos patches)
│   ├── gba/
│   └── snes/
├── homebrew/              # Homebrew de consoles e demos
│   ├── gb/
│   └── wii/
├── traducoes/             # ROMs só com tradução (para referência)
│   ├── gba/
│   └── sfc/
├── patches/               # Arquivos de patch (IPS, UPS, BPS, XDelta)
│   ├── gba/
│   ├── snes/
│   └── psx/
├── bios/                  # Bios files (já existente no EmuDeck)
├── saves/                 # Saves (já existente)
└── ferramentas/           # flips, xdelta, randomizers
```

Por que separar `roms/` de `hacks/`? Porque o `roms/` contém as bases intocadas (que você usará para reaplicar patches quando novas versões saírem), enquanto `hacks/` é o que você joga no dia a dia. Se um hack corromper o save, você volta ao ROM base, reaplica o patch atualizado e segue.

## Nomenclatura consistente

Adote uma convenção e siga à risca. Uma sugestão baseada no padrão No-Intro + informações extras:

```terminal
NomeDoJogo (Região) (Revisão) [Modificador]
```

Exemplos:

```terminal
Super Metroid (USA).sfc
Super Metroid - Redux (hack).sfc
Super Metroid - PT-BR (tradução).sfc
Super Metroid - Redux PT-BR (hack+tradução).sfc
```

Para patches, mantenha o nome do arquivo de patch com a versão e a data:

```terminal
~/Emulation/patches/snes/
metroid-redux-v3.2-202503.bps
metroid-redux-v3.2-202503-readme.txt
```

## Versionando seus patches

O autor do hack lança a versão 2.0, você aplica no ROM, joga 20 horas... e descobre um bug que foi corrigido na 2.1. Para não ter que recomeçar, mantenha:

1. **O ROM base** sempre intacto.
2. **O patch** em cada versão (guarde a v2.0 mesmo depois de baixar a 2.1).
3. **Um changelog** mínimo: versão, data, hash do ROM de saída.

```terminal
# ~/Emulation/hacks/gba/Pokemon Emerald Final.changelog
v3.0 (2025-01-15) sha1=abc123... — primeiro aplicado
v3.1 (2025-03-02) sha1=def456... — correção de crash no Elite Four
```

## Backup e sincronização

ROMs, hacks e saves vivem em arquivos que você passou horas organizando. Perder isso é perder tempo. Estratégias:

- **rsync para NAS/PC**: o SteamOS tem `rsync`, basta um destino acessível por rede ou pendrive.

```terminal
$ rsync -av ~/Emulation/ /run/media/deck/BACKUP/Emulation/
```

- **Syncthing**: sincroniza pastas entre Deck e PC sem nuvem, ponto a ponto, criptografado.

```terminal
$ flatpak install flathub com.github.zocker_160.Syncthing
```

Configure para sincronizar `~/Emulation/saves` (pequeno, muda muito) com o PC. Para ROMs (grande, muda pouco), prefira backups periódicos com rsync.

## RomVault, ClrMamePro e gestão de biblioteca

Para quem acumula milhares de ROMs, ferramentas de gestão de biblioteca são o equivalente do Calibre para ROMs. Elas verificam checksums contra bancos (No-Intro, Redump), renomeiam e organizam:

- **RomVault** (Windows, roda com Wine/Proton no Deck): interface gráfica, suporte a múltiplos bancos, verifica e corrige.
- **ClrMamePro** (Windows, funciona sob Wine): mais antigo, mais técnico, mas ainda usado.
- **Igir** (Node.js, nativo em Linux): moderno, linha de comando, valida contra No-Intro e Redump:

```terminal
$ npx igir copy extract test --dat No-Intro*.dat --input ~/Downloads --output ~/Emulation/roms
```

No Deck, rodar Igir é mais prático que depender de Wine para ferramentas Windows.

## Pontos-chave

- Separe `roms/` (bases intocadas) de `hacks/` (já patcheados).
- Adote convenção de nomenclatura No-Intro + modificador.
- Mantenha patches versionados e changelog mínimo.
- rsync/Syncthing para backup e sincronização de saves e ROMs.
- Igir (ou RomVault via Proton) para validar e organizar bibliotecas grandes.

## Exercícios

1. Crie a estrutura completa `~/Emulation/{roms,hacks,homebrew,traducoes,patches,ferramentas}`.
2. Renomeie 10 ROMs seguindo a convenção No-Intro e adicione o sufixo de modificador quando cabível.
3. Configure um backup semanal das pastas `saves/` e `patches/` com rsync para um pendrive.
4. Instale o Syncthing e sincronize `~/Emulation/saves` com outro dispositivo.
5. **Desafio.** Use o Igir para validar seus ROMs contra um `.dat` No-Intro e documente quantos arquivos não passaram.