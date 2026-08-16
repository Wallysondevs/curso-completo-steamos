Homebrew não é um hack: é software novo, criado do zero por fãs, para rodar em hardware que os fabricantes não planejavam abrir. Do homebrew de Game Boy dos anos 2000 aos jogos indie modernos para consoles retrô, o Steam Deck roda praticamente tudo isso via emulação — e às vezes nem precisa de emulador.

:::objetivos
- Entender o que define homebrew e como ele se distribui
- Rodar homebrew de consoles retrô (ROMs homebrew) nos emuladores
- Rodar homebrew de consoles modernos (Switch, Wii) que exigem firmware desbloqueado
- Descobrir homebrew nativo para Linux/SteamOS que roda direto no Deck
- Instalar e atualizar homebrew de forma limpa

:::

## O que é (e o que não é) homebrew

Homebrew é software original. Não deriva de um ROM comercial, não é uma tradução e não depende de patch sobre material protegido. Isso o torna legalmente muito mais limpo que ROM hacks — a maioria dos projetos homebrew é de código aberto e distribuída livremente.

Categorias comuns:

- **Jogos originais**: títulos completos para Game Boy, GBA, NES, SNES, Mega Drive, etc. (muitos premiados, como *Goodboy Galaxy* no GBA ou o renascimento da cena NES).
- **Utilitários**: ferramentas de backup, gerenciadores de save, música (trackers).
- **Emuladores dentro do console**: rodar um emulador de um sistema dentro de outro (ex.: emulador de Game Boy rodando no DS).
- **Demos**: intros da demoscene — arte audiovisual técnica.

## Homebrew de consoles retrô no Deck

Homebrew para consoles antigos normalmente é distribuído como um ROM normal (`.gb`, `.gba`, `.nes`, `.sfc`) que você joga num emulador qualquer. Basta colocar na pasta de ROMs correspondente:

```terminal
$ ls ~/Emulation/roms/gb/
Goodboy\ Galaxy\ \(homebrew\).gb
Micro\ Mages\ \(homebrew\).nes    # na verdade NES, pasta nes/
```

Alguns homebrew de NES usam mappers incomuns ou recursos além do hardware padrão; emuladores modernos (Mesen, FCEUX via libretro) lidam bem. Se um homebrew não carregar, cheque se o core do RetroArch está atualizado e se o mapper é suportado.

## Homebrew de consoles modernos

Para consoles que exigem firmware desbloqueado (Switch, 3DS, Wii, PSP), o homebrew roda no console físico — mas nada impede de usar um emulador no Deck:

- **Wii/GameCube**: homebrew (`.dol`, `.elf`) roda no Dolphin diretamente, sem precisar de console.
- **PSP**: homebrew (`.pbp`, `.prx`) roda no PPSSPP.
- **DS**: homebrew (`.nds`) roda no melonDS/DeSmuME.
- **Switch**: homebrew roda no Ryujinx emulando o ambiente, mas o ecossistema de homebrew de Switch (com Homebrew Menu) depende mais do console físico — no emulador, o suporte a homebrew é mais limitado.

No Dolphin, carregar um `.dol`:

```terminal
$ dolphin-emu-nogui -e ~/homebrew/minha-demo.dol
```

## Homebrew nativo para SteamOS/Linux

O Steam Deck é um PC Linux, então uma parcela da cena homebrew nem precisa de emulador: jogos e apps de código aberto compilados para Linux rodam nativamente. Isso inclui:

- **Jogos open-source**: *SuperTux*, *0 A.D.*, *OpenTTD*, *Battle for Wesnoth*, *Cataclysm: Dark Days Ahead*.
- **Engines reconstruídas**: reimplementações de antigos jogos (ex.: *OpenRCT2* para RollerCoaster Tycoon, *OpenMW* para Morrowind) — tecnicamente "homebrew" no sentido de software comunitário original.
- **Ports de jogos retrô**: *Cave Story*, *VVVVVV* (open-source), *OpenLara* (Tomb Raider), *SonicFanGames*.

Instalar via Flatpak/Discover é o caminho limpo:

```terminal
$ flatpak install flathub org.openttd.OpenTTD
$ flatpak install flathub org.wesnoth.Wesnoth
```

## Homebrew de comunidade via itch.io

O itch.io concentra uma explosão de homebrew e jogos indie de código aberto, com builds Linux nativas para muitos títulos. Muitos têm versão AppImage ou tar.gz que rodam direto no Deck, sem Steam:

```terminal
$ chmod +x meu-jogo.AppImage && ./meu-jogo.AppImage
```

Isso é o equivalente moderno da cena homebrew dos cartuchos: desenvolvedores independentes distribuindo livremente, e o Deck consumindo sem fricção.

## Mantendo tudo limpo

Homebrew tende a se acumular. Organize:

```terminal
~/Emulation/homebrew/        # homebrew de consoles (ROMs, dol, nds, etc.)
~/Games/                     # homebrew e indies nativos Linux
```

Mantenha um `README` por projeto com a fonte, a versão e a URL de onde baixou — homebrew atualiza com frequência e você vai querer reencontrar o repositório.

## Pontos-chave

- Homebrew é software original, distinto de ROM hacks e traduções.
- Consoles retrô: homebrew chega como ROM normal e roda em qualquer emulador.
- Consoles modernos: `.dol`/`.elf` (Dolphin), `.pbp` (PPSSPP), `.nds` (melonDS).
- SteamOS: homebrew/indie nativo Linux roda sem emulador, via Flatpak/AppImage.
- itch.io e projetos open-source são os repositórios vivos da cena.

## Exercícios

1. Baixe um homebrew de Game Boy e rode no RetroArch (core Gambatte/mGBA), confirmando o carregamento.
2. Rode uma demo `.dol` de GameCube no Dolphin e observe o comportamento.
3. Instale um jogo open-source (ex.: OpenTTD) via Flatpak e configure o controle via Steam Input.
4. Use uma engine reconstruída (OpenMW ou OpenRCT2) apontando para os dados do jogo original.
5. **Desafio.** Monte um catálogo de 5 homebrews de plataformas diferentes e padronize a organização em `~/Emulation/homebrew` com README por projeto.
