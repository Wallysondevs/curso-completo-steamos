Uma instalação de emulação é um investimento de horas: você ajusta controles, baixa BIOS, nomeia ROMs, organiza saves. Perder tudo porque um cartão morreu ou uma atualização deu errado é evitável — desde que você entenda como o EmuDeck se atualiza, como migra de um armazenamento para outro e o que exatamente merece backup.

:::objetivos
- Atualizar o EmuDeck e os emuladores de forma segura
- Entender o que uma atualização pode quebrar (e por quê)
- Migrar a instalação entre SD card e SSD
- Definir uma estratégia de backup dos dados que realmente importam
- Restaurar saves e BIOS após reinstalação
:::

## Atualizando o EmuDeck e os emuladores

O EmuDeck tem um mecanismo próprio de atualização, acessível no Desktop Mode, que atualiza o próprio instalador, os scripts de configuração e os emuladores Flatpak e AppImage. A forma mais confiável é abrir o aplicativo e usar a opção de update embutida, em vez de baixar instalador novo.

```terminal
$ flatpak update -y org.libretro.RetroArch net.pcsx2.PCSX2 org.ppsspp.PPSSPP
Looking for updates...
Updating org.libretro.RetroArch...
Updating net.pcsx2.PCSX2...
Done.
```

Como a maioria dos emuladores chega via Flatpak, atualizá-los é, em essência, o mesmo `flatpak update` de qualquer aplicativo. O EmuDeck apenas empacota isso numa interface e, o que é mais importante, **regrava as configurações** depois, para que uma atualização do PCSX2 que mude a estrutura de config não deixe seus ajustes órfãos.

:::atencao
Atualizar um emulador pode quebrar uma configuração específica — um núcleo muda o formato do save state, um emulador altera o nome de uma opção. Antes de atualizar um emulador cujo save você valoriza, exporte os save states. A regra de ouro da comunidade retrô é: **atualize quando precisar, não porque apareceu uma notificação**.
:::

## O que uma atualização pode quebrar

O ponto de fragilidade está nos arquivos de configuração que o EmuDeck **gerou**: se uma atualização do emulador espera uma chave nova e o config antigo não a tem, o emulador ou reseta para o padrão (perdendo seus ajustes) ou se recusa a abrir. É por isso que o EmuDeck guarda e regrava esses arquivos num formato que ele controla.

```terminal
$ ls ~/Emulation/tools/configs
PCSX2  PPSSPP  Dolphin  ...
```

Nessa pasta vivem as cópias dos arquivos de config que o EmuDeck administra. Se algo quebrar, o update do EmuDeck reconstroi a partir daí. Entender que existe essa separação — o *seu* dado (ROMs, saves) versus o *config gerenciado* (que o EmuDeck pode regerar) — orienta toda a estratégia de backup: **o seu dado é insubstituível, o config não**.

## Migrando entre SD e SSD

Migrar é um subset do que a seção 3 mostrou ao mover ROMs. Além das ROMs, você pode querer mover também os saves e a pasta `bios`, mantendo os emuladores no SSD. O `rsync` é a ferramenta, com a ressalva de fechar os jogos antes.

```terminal
$ rsync -avP ~/Emulation/bios/ /run/media/deck/emudeck/Emulation/bios/
$ rsync -avP ~/Emulation/saves/ /run/media/deck/emudeck/Emulation/saves/
```

Depois de mover, os emuladores precisam saber o novo caminho. O EmuDeck lida com isso na reconfiguração (reabrir o instalador e redefinir o storage), mas alguns emuladores guardam caminhos absolutos em seus configs — vale conferir com um `grep` rápido se o caminho antigo ainda aparece.

```terminal
$ grep -rl "/home/deck/Emulation" ~/.var/app/*/config/ 2>/dev/null | head -5
```

Se o grep ainda apontar para `/home/deck/Emulation` depois de migrar para o cartão, é sinal de que há config referenciando o local antigo — candidato a erro quando o jogo tentar carregar um save que "não existe".

## O que merece backup

Nem tudo precisa ser copiado. O que é regenerável (emuladores, configs gerenciados, arte de capa baixável) não vale o espaço. O que é irreversível é: **roms/bios** (se você as possui legalmente e o dump deu trabalho), **saves** e, idealmente, o `shortcuts.vdf` e a pasta `grid` se você personalizou arte à mão.

| Pasta | Regenerável? | Backup? |
|---|---|---|
| `roms/` | não | sim |
| `bios/` | não (dump manual) | sim |
| `saves/` | não | sim |
| `tools/` e configs | sim | não |
| `grid/` e `shortcuts.vdf` | parcial | só se personalizado |

Uma automação simples com `tar` empacota o essencial num único arquivo, pronto para copiar para um NAS ou nuvem:

```terminal
$ tar czf ~/emudeck-backup-$(date +%Y%m%d).tar.gz \
    -C ~/Emulation bios roms saves
$ ls -lh ~/emudeck-backup-*.tar.gz
-rw-r--r-- 1 deck deck 8.4G Jan 15 10:00 emudeck-backup-20250115.tar.gz
```

O `-C ~/Emulation` muda o diretório base antes de empacotar, de modo que dentro do `.tar.gz` os caminhos comecem por `bios/`, `roms/` e `saves/` — o que facilita a restauração para qualquer destino.

## Restaurando após reinstalação

O caminho de volta é o inverso: instalar o EmuDeck do zero, e então despejar os dados de volta nos lugares certos. A ordem importa — instala primeiro, depois copia os dados, para que o EmuDeck já tenha criado a árvore `~/Emulation` com as permissões corretas.

```terminal
$ tar xzf ~/emudeck-backup-20250115.tar.gz -C ~/Emulation
$ # depois: rodar o SRM de novo para regenerar os atalhos
```

Restaurar os dados sobre a árvore recém-criada garante que bios, roms e saves caiam nas pastas certas. O passo final é sempre o SRM (seção 6) para regenerar os atalhos, já que o `shortcuts.vdf` apontava para a instalação antiga.

## Resumo

- Atualize emuladores quando precisar, não por notificação; configs são o ponto frágil.
- O EmuDeck guarda cópias dos configs que gerencia em `~/Emulation/tools/configs`.
- ROMs, bios e saves são insubstituíveis; configs e emuladores são regeneráveis.
- `rsync -avP` migra dados entre SD e SSD; cheque caminhos absolutos residuais com `grep`.
- `tar czf` cria um backup portátil com `bios`, `roms` e `saves`.
- A ordem de restauração é: instalar o EmuDeck, despejar os dados, rodar o SRM.

## Exercícios

1. Liste os Flatpaks de emulação instalados e rode `flatpak update --dry-run` (ou `flatpak update -y --dry-run`) para ver o que seria atualizado sem aplicar.
2. Faça um backup de teste do diretório `saves` com `tar` e inspecione o conteúdo do arquivo com `tar tzf`.
3. Use `grep -rl "/home/deck/Emulation" ~/.var/app/*/config/` e relate se algum emulador ainda referencia o caminho antigo.
4. Estime o tamanho do backup completo (roms + bios + saves) com `du -sh` de cada pasta e compare com o espaço disponível no destino.
5. **Desafio.** Escreva um pequeno script em `bash` que empacote automaticamente `bios`, `roms` e `saves` num arquivo com timestamp no nome e o copie para o cartão microSD, usando `rsync` para enviar. Teste e confira que o backup completo pode ser restaurado numa pasta temporária.
