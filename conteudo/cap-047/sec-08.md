Emulação é um território fértil para falhas silenciosas: o jogo abre e fecha na hora, a tela fica preta, o áudio estoura, o controle some. Quase nenhum desses problemas se resolve no chute — eles se resolvem lendo o que o programa registrou. Esta seção ensina a colher logs, interpretar mensagens e separar "falta de BIOS" de "emulador quebrado".

:::objetivos
- Localizar os logs dos emuladores e do EmuDeck
- Usar `journalctl` para inspecionar a sessão do Flatpak
- Diagnosticar os sintomas mais comuns (tela preta, crash, sem áudio)
- Validar se a BIOS está no lugar certo e com o nome correto
- Correlacionar uma mensagem de erro com a causa raiz
:::

## Onde os logs vivem

Cada camada do conjunto registra em um lugar diferente. O EmuDeck em si escreve logs de instalação e de configuração; os emuladores Flatpak escrevem na própria sandbox (o diretório `~/.var/app/`); e o sistema registra tudo no journal do systemd, acessível via `journalctl`.

```terminal
$ ls ~/var/log/EmuDeck/ 2>/dev/null || ls ~/Emulation/tools/launchers/ | grep -i log
EmuDeck.log
```

O log de instalação do EmuDeck é o primeiro lugar a olhar quando algo falha ainda na configuração (não no jogo). Para os emuladores, o log costuma estar dentro do diretório de dados do Flatpak:

```terminal
$ find ~/.var/app/org.libretro.RetroArch -name "*.log" 2>/dev/null | head -5
~/.var/app/org.libretro.RetroArch/config/retroarch/retroarch.log
```

O RetroArch, por exemplo, mantém um `retroarch.log` persistente que registra cada load de núcleo, cada ROM aberta e cada erro de BIOS. É o documento mais valioso para diagnosticar jogos que não abrem.

## Lendo o journal do Flatpak

Como os emuladores Flatpak rodam como processos monitorados, o `journalctl` captura sua saída padrão e de erro. Filtrar pelo nome do aplicativo Flatpak é o jeito mais rápido de ver o que aconteceu no último crash:

```terminal
$ journalctl --user -b -u app-org.libretro.RetroArch* -n 40 --no-pager
```

A unidade `app-org.libretro.RetroArch*` é criada pelo Flatpak quando o app é iniciado; o `-b` limita ao boot atual e `-n 40` traz as últimas quarenta linhas. Quando um jogo fecha sozinho, essa saída costuma conter a mensagem final — a pista decisiva.

```terminal
$ journalctl --user -b | grep -i -E "retroarch|dolphin|pcsx2" | grep -i -E "error|fail|segfault" | tail -20
```

Esse comando composto filtra, no boot atual, qualquer linha dos três emuladores que mencione erro, falha ou *segfault* (violação de acesso à memória). Um `Segmentation fault` costuma indicar núcleo incompatível ou ROM corrompida, não falta de BIOS — a distinção que orienta todo o diagnóstico.

## Os sintomas mais comuns

Três sintomas concentram a maioria dos chamados de socorro na comunidade, e cada um aponta para uma causa típica.

**Tela preta ao abrir o jogo.** Na maioria das vezes é BIOS ausente ou com nome errado — o emulador inicia e trava antes de desenhar qualquer coisa. Confira `~/Emulation/bios` e o `retroarch.log`; a mensagem que importa é algo como `[libretro ERROR] Firmware: missing required firmware: gba_bios.bin`.

**O jogo fecha na hora.** Crash imediato costuma ser núcleo/ROM incompatíveis (especialmente arcade, com ROM set versionado) ou um config corrompido após atualização. O `journalctl` vai mostrar a exceção final.

**Sem áudio, ou áudio estourado.** Frequência de amostragem errada, ou o pipewire do SteamOS e o emulador em desacordo. Geralmente se resolve no settings do emulador (audio backend/latência), e o log registra falhas de buffer.

```terminal
$ grep -i -E "bios|firmware|missing" ~/.var/app/org.libretro.RetroArch/config/retroarch/retroarch.log | tail -15
```

Essa varredura filtra as linhas do log que falam de BIOS, firmware ou arquivo ausente — um atalho direto para a causa mais comum de tela preta.

## Validando a BIOS de forma metódica

Em vez de só "olhar" a pasta, valide três coisas do arquivo de BIOS: **presença**, **nome exato** e **tamanho plausível**. Um arquivo de BIOS legítimo raramente tem zero bytes ou um nome com espaços trocados.

```terminal
$ ls -l ~/Emulation/bios/
-rw-r--r-- 1 deck deck    16384 Jan 10 09:00 gba_bios.bin
-rw-r--r-- 1 deck deck   524288 Jan 10 09:00 scph1001.bin
-rw-r--r-- 1 deck deck       0 Jan 10 09:00 dc_boot.bin
```

O `dc_boot.bin` com zero bytes é uma bandeira vermelha — o download ou dump falhou, e o emulador de Dreamcast vai reclamar de BIOS mesmo com o arquivo "presente". Tamanho é a primeira checagem barata antes de culpar o emulador.

:::dica
O RetroArch tem um verificador de firmware embutido: em `Settings → Core` ou no menu `Information → Core Information`, ele lista as BIOS esperadas pelo núcleo ativo e marca quais estão presentes e com o hash correto. Essa tela vale mais que qualquer `ls`, porque confronta o CRC do arquivo, não só o nome.
:::

## Correlacionando erro com causa

O erro do diagnóstico não é o comando — é a leitura. Uma linha como `missing required firmware: gba_bios.bin` não deixa dúvida. Mas mensagens vagas como `Failed to open file` exigem triangulação: o arquivo existe? O caminho está certo? O núcleo certo foi carregado?

```terminal
$ file ~/Emulation/roms/gba/meu-jogo.gba
meu-jogo.gba: Game Boy Advance ROM image, format 16 Mbit
```

O `file` identifica o tipo real do arquivo pelos bytes, ignorando a extensão. Uma ROM renomeada com extensão errada (`.gba` num arquivo que na verdade é `.gbc`) é diagnosticada aqui em um segundo — e explica por que o núcleo "certo" não abre o jogo. Essa é a checagem que fecha o ciclo da maioria dos problemas.

## Resumo

- O EmuDeck loga a instalação; cada Flatpak loga em `~/.var/app/`; o systemd loga no journal.
- `journalctl --user -b -u app-<flatpak>*` mostra a saída do último crash do emulador.
- Tela preta normalmente é BIOS ausente/nome errado; crash imediato é núcleo/ROM incompatível.
- O `retroarch.log` registra cada load e mensagem de firmware ausente.
- Tamanho zero em BIOS é falha de dump; o verificador do RetroArch confere hash, não só nome.
- `file` revela o formato real de uma ROM independente da extensão.

## Exercícios

1. Localize o `retroarch.log` e mostre as últimas 20 linhas com `tail -n 20`.
2. Rode `journalctl --user -b | grep -i retroarch | tail -20` e identifique ao menos uma linha de informação não-crítica.
3. Use `file` em três ROMs de consoles diferentes e confirme que o tipo detectado casa com a extensão.
4. Liste `~/Emulation/bios` com `ls -l` e sinalize qualquer arquivo de tamanho zero ou nome suspeito.
5. **Desafio.** Provoque um erro controlado: tente abrir uma ROM num núcleo errado (ou remova temporariamente uma BIOS) e capture a mensagem de erro no `journalctl`. Depois restaure e explique, pela mensagem, qual era a causa exata e como você chegou a ela.
