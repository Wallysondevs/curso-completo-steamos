Instalar um emulador de Switch no SteamOS é simples na superfície, mas cada caminho de instalação tem trade-offs reais que afetam atualizações, sandboxing e integração com o modo jogo. Esta seção cobre todos os métodos, do mais simples ao mais controlado, e deixa você com um emulador funcional pronto para receber firmware e chaves.

:::objetivos
- Instalar Yuzu e Ryujinx via Flatpak, EmuDeck e AppImage
- Entender as diferenças de sandboxing entre Flatpak e instalação nativa
- Configurar o diretório de dados e a estrutura de pastas de cada emulador
- Adicionar o emulador como atalho não Steam no modo jogo
:::

## Flatpak: o caminho oficial do Discover

O SteamOS oferece o Discover como loja gráfica, e ele é a interface para o Flatpak. Ambos Yuzu e Ryujinx têm (ou tiveram) builds Flatpak oficiais hospedadas no Flathub. O Flatpak isola o emulador do resto do sistema, o que é bom para segurança, mas introduz peculiaridades de acesso a arquivos.

```terminal
$ flatpak search yuzu
Yuzu Mainline  org.yuzu_emu.yuzu  0-1743  flathub
$ flatpak search ryujinx
Ryujinx        org.ryujinx.Ryujinx 1.1.1403  flathub
```

Para instalar:

```terminal
$ flatpak install flathub org.yuzu_emu.yuzu
$ flatpak install flathub org.ryujinx.Ryujinx
```

Após a instalação, o emulador aparece no menu Iniciar (KDE) e pode ser lançado. Mas atenção: o Flatpak confina o aplicativo. Por padrão, ele só enxerga `~/Downloads` e `~/Videos`. Seus ROMs provavelmente estão em outro lugar — no cartão microSD ou numa pasta dedicada.

```terminal
$ flatpak override org.yuzu_emu.yuzu --filesystem=/run/media/mmcblk0p1/roms
$ flatpak override org.yuzu_emu.yuzu --filesystem=~/roms
```

O comando `flatpak override` concede acesso permanente a diretórios fora do sandbox. Para Ryujinx, substitua `org.yuzu_emu.yuzu` por `org.ryujinx.Ryujinx`.

:::atencao
O Flatpak do Yuzu não está mais no Flathub oficialmente após a descontinuação do projeto. Ele pode estar disponível em repositórios de terceiros ou como flatpakref local. Verifique a procedência antes de instalar qualquer flatpak de fonte não oficial.
:::

## EmuDeck: o instalador tudo-em-um

EmuDeck é um script de instalação em lote que configura emuladores para o Steam Deck. Ele baixa, instala e configura Yuzu, Ryujinx e dezenas de outros emuladores com uma única execução. Também integra ao Steam ROM Manager, que gera atalhos com arte de capa no modo jogo.

```terminal
$ cd ~/Downloads
$ curl -L https://www.emudeck.com/EmuDeck.desktop -o EmuDeck.desktop
$ chmod +x EmuDeck.desktop
$ ./EmuDeck.desktop
```

Durante a instalação, o EmuDeck pergunta:
- Onde estão suas ROMs (cartão SD ou armazenamento interno)
- Qual front-end usar (EmulationStation DE, Pegasus ou Steam ROM Manager)
- Quais emuladores instalar (marque Yuzu e Ryujinx)
- Se quer configurar saves em nuvem e cheevos do RetroAchievements

O EmuDeck é a recomendação para quem quer tudo funcionando em 15 minutos. A desvantagem é que ele instala muita coisa — se você só quer emular Switch, o Flatpak individual é mais enxuto.

:::dica
Se você escolher o caminho EmuDeck, deixe a instalação padrão no cartão SD. Isso mantém os emuladores e configurações intactos mesmo se você precisar formatar o armazenamento interno do Deck.
:::

## AppImage e binário standalone

Se você prefere controle total sem sandboxing, Yuzu distribuía AppImages — um único arquivo executável com todas as dependências empacotadas. Basta baixar, marcar como executável e rodar:

```terminal
$ cd ~/Applications
$ wget https://github.com/yuzu-emu/yuzu-mainline/releases/download/mainline-0-1743/yuzu-20240202-x86_64.AppImage
$ chmod +x yuzu-20240202-x86_64.AppImage
$ ./yuzu-20240202-x86_64.AppImage
```

O Ryujinx também oferecia binários compilados como archive `.tar.gz` contendo o executável `Ryujinx` e suas bibliotecas. Ambos os métodos exigem que você gerencie atualizações manualmente.

Para Ryujinx via binário:

```terminal
$ cd ~/Applications
$ wget https://github.com/Ryujinx/release-channel-master/releases/download/1.1.1403/ryujinx-1.1.1403-linux_x64.tar.gz
$ tar xzf ryujinx-1.1.1403-linux_x64.tar.gz
$ cd publish
$ ./Ryujinx
```

## Estrutura de diretórios dentro do emulador

Independentemente do método de instalação, ambos os emuladores criam uma pasta de dados de usuário. No Yuzu, ela fica em `~/.local/share/yuzu/`; no Ryujinx, em `~/.config/Ryujinx/`.

```terminal
$ ls ~/.local/share/yuzu/
cache/  config/  dump/  keys/  load/  log/  nand/  screenshots/  sdcard/
$ ls ~/.config/Ryujinx/
bis/  games/  logs/  profiles/  sdcard/  Config.json  Ryujinx.conf
```

As pastas importantes para as próximas seções:
- `keys/` — onde as `prod.keys` e `title.keys` serão colocadas
- `nand/` (Yuzu) ou `bis/` (Ryujinx) — onde o firmware é instalado
- `sdcard/` — emula o cartão SD do Switch; mods e atualizações vão aqui

## Adicionando ao modo jogo

Para lançar os emuladores direto do modo jogo do Steam Deck, adicione-os como atalhos não Steam. No modo desktop, abra o Steam, clique em **Games → Add a Non-Steam Game to My Library**, procure o executável do emulador e adicione. Depois, no modo jogo, você pode configurar a arte da capa e o layout de controle via Steam Input.

Se você usa EmuDeck, o Steam ROM Manager faz isso automaticamente, inclusive separando atalhos por jogo com arte de capa individual — uma comodidade que justifica o uso do EmuDeck mesmo para quem só quer Switch.

## Resumo

- Yuzu e Ryujinx instalam-se via Flatpak (Discover), EmuDeck (script tudo-em-um) ou binário standalone.
- Flatpak isola o emulador; use `flatpak override` para liberar acesso a pastas de ROMs.
- EmuDeck configura tudo automaticamente e integra ao Steam ROM Manager, mas instala dezenas de emuladores.
- AppImage e binário standalone dão controle total, mas exigem atualização manual.
- Os dados de usuário ficam em `~/.local/share/yuzu/` e `~/.config/Ryujinx/`.

## Exercícios

1. Instale o Ryujinx via Flatpak. Execute e anote a versão exata que ele reporta em Help → About.
2. Inspecione as permissões do Flatpak com `flatpak info org.ryujinx.Ryujinx`. Quais diretórios ele acessa por padrão?
3. Crie a estrutura de pastas para ROMs: `~/roms/switch/`, `~/roms/switch/updates/` e `~/roms/switch/dlc/`. Configure o emulador para usar essas pastas.
4. Adicione o Ryujinx como atalho não Steam e teste o lançamento pelo modo jogo. O controle funciona sem configuração adicional?
5. **Desafio.** Compare os tempos de inicialização do Yuzu Flatpak vs Yuzu AppImage com `time`. O sandboxing do Flatpak adiciona latência mensurável?