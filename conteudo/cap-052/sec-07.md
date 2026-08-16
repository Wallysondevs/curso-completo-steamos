O núcleo MAME do RetroArch é um port direto do MAME *standalone*, mas seu comportamento dentro do ecossistema libretro tem nuances que um arquivo `mame.ini` resolve e um *Core Option* não alcança. Configurar o MAME corretamente no Steam Deck significa alinhar: onde estão as ROMs, como o núcleo as encontra, qual o diretório de saves, e como os controles do Deck são mapeados para a tecla `Tab` que abre o menu interno do MAME.

:::objetivos
- Instalar e ativar o núcleo MAME (current) no RetroArch
- Definir os diretórios de ROM, save e BIOS para o núcleo MAME
- Editar e entender as seções principais do mame.ini
- Mapear o menu interno do MAME para o Steam Deck
- Resolver conflitos entre Core Options do RetroArch e do MAME interno
:::

## Instalando e carregando o núcleo

O RetroArch oferece pelo menos dois núcleos com "MAME" no nome: um com versão fixa e um rolling. O recomendado é o núcleo que carrega a versão *current* com patch libretro. A instalação é via *Online Updater*:

```terminal
$ # No RetroArch:
$ # Main Menu > Online Updater > Core Downloader > Arcade > MAME (Current)
```

Após a instalação, carregue o núcleo uma vez para que ele crie a estrutura de diretórios esperada. O núcleo procura automaticamente a pasta `system/mame/` e, dentro dela, arquivos como `mame.ini`.

## O arquivo mame.ini e seus caminhos

O `mame.ini` é o centro de comando do MAME. O núcleo libretro procura esse arquivo em `system/mame/mame.ini` (ou `saves/mame/mame.ini`), e as opções definidas nele se aplicam a **todos** os jogos carregados. O lugar certo, dentro do flatpak, é:

```terminal
$ mkdir -p ~/.var/app/org.libretro.RetroArch/config/retroarch/system/mame
$ cat ~/.var/app/org.libretro.RetroArch/config/retroarch/system/mame/mame.ini
rompath      $HOME/lab/arcade
samplepath   $HOME/lab/arcade/samples
cfg_directory $HOME/.var/app/.../system/mame/cfg
nvram_directory $HOME/.var/app/.../system/mame/nvram
```

A linha mais importante é `rompath`. Ela diz onde o MAME procura os `.zip` dos jogos. Pode ser um único diretório ou vários, separados por ponto e vírgula (`;`).

```terminal
$ # Exemplo com dois diretórios:
$ grep rompath ~/.var/app/org.libretro.RetroArch/config/retroarch/system/mame/mame.ini
rompath $HOME/lab/arcade;$HOME/lab/arcade/mame
```

:::dica
No Steam Deck, colocar as ROMs em `~/lab/arcade` (e não no diretório padrão do RetroArch) facilita sincronizar a coleção entre dispositivos e evita perder arquivos ao reinstalar o flatpak.
:::

## O menu interno do MAME (acessível por Tab)

O MAME tem um menu de serviço próprio, acessível pela tecla `Tab`, que é completamente independente do menu do RetroArch. Nele você configura controles, *dip switches*, BIOS, região e outras opções que vão ser salvas em arquivos `.cfg` por jogo.

O problema no Steam Deck: o MAME espera um teclado, e o Deck não tem. A solução é mapear a tecla `Tab` para um botão ou combo de gamepad.

```terminal
$ # RetroArch > Settings > Input > Hotkeys > Menu Toggle (Gamepad Combo)
$ # OU
$ # Quick Menu > Controls > Port 1 Controls > User 1 Button X > Tab
```

Mapear `Tab` como um botão de teclado no controle do Deck garante acesso ao menu de serviço do MAME a qualquer momento, sem teclado externo.

:::atencao
O mapeamento de `Tab` no RetroArch **não** persiste automaticamente entre núcleos. Se você configurou `Tab` para um botão enquanto usava o FBNeo, precisa configurar de novo para o MAME. Use *Core Overrides* para isolar os mapeamentos.
:::

## Separando as Core Options do mame.ini

Um ponto de atrito: o RetroArch tem *Core Options* (acessíveis em *Quick Menu > Options*) que **se sobrepõem** a algumas configurações do `mame.ini`. Por exemplo, a opção *Boot to BIOS* no RetroArch e `skip_gameinfo` no `mame.ini` fazem coisas parecidas com nomes diferentes.

A regra prática: configure **caminhos e preferências globais** no `mame.ini`; configure **opções de jogo e aparência** nas *Core Options* do RetroArch, e deixe **controles e região** no menu `Tab` por jogo.

```ini
# ~/.../system/mame/mame.ini
# Opções seguras de manter no ini:
skip_gameinfo        1
skip_warnings        1
writeconfig          0
```

A linha `writeconfig 0` é uma proteção: o MAME não sobrescreve o `mame.ini` com as opções da última sessão, evitando surpresas.

## Erros comuns e o que o log diz

Quando o MAME não encontra uma ROM, ele não mostra uma caixa de diálogo — ele escreve no log e fecha (no RetroArch, volta ao menu). O padrão mais comum:

```terminal
$ flatpak run org.libretro.RetroArch --verbose 2>&1 | grep -iE "error|not found|missing"
[libretro ERROR] mame: sf2.zip not found in rompath
[libretro ERROR] mame: check that $HOME/lab/arcade exists
```

Três causas concentram 90% dos casos: `rompath` apontando para um diretório que não existe, permissão de leitura negada no diretório de ROMs, ou o `.zip` está lá mas o CRC não bate.

```terminal
$ # Verifique o rompath ativo:
$ grep rompath ~/.var/app/org.libretro.RetroArch/config/retroarch/system/mame/mame.ini
$ # Confira se o arquivo está legível:
$ ls -l ~/lab/arcade/sf2.zip
```

## Resumo

- O núcleo MAME se instala via *Online Updater* e procura configuração em `system/mame/mame.ini`.
- O `rompath` é o campo mais importante do `mame.ini` — define onde o núcleo procura romsets.
- O menu interno do MAME (`Tab`) controla *dip switches*, BIOS, região e mapeamento por jogo.
- Mapeie `Tab` para um botão do Steam Deck para acessar o menu de serviço sem teclado.
- *Core Options* do RetroArch, `mame.ini` e menu `Tab` formam três camadas de configuração que não devem se sobrepor.

## Exercícios

1. Crie um `mame.ini` no diretório correto, defina `rompath` e carregue um jogo CPS-1 — confirme no log que o núcleo encontrou o arquivo.
2. Com o jogo rodando, pressione `Tab` e explore o menu de *dip switches*; altere a dificuldade e confirme que o jogo refletiu a mudança.
3. Adicione um segundo diretório ao `rompath` (separado por `;`) e verifique se o núcleo encontra ROMs nos dois caminhos.
4. Habilite `skip_gameinfo` e `skip_warnings` no `mame.ini` e descreva a diferença no fluxo de carregamento em relação ao padrão.
5. **Desafio.** Explique por que copiar o `mame.ini` do MAME standalone para o RetroArch não funciona sem ajustes — e identifique pelo menos duas opções que precisam ser desligadas ou alteradas na migração.