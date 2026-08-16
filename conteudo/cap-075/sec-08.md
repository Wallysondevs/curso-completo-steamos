Você passou uma tarde escolhendo temas, testou dezenas de animações e montou a configuração perfeita. Uma atualização do SteamOS, uma reinstalação do Decky ou uma troca de SSD — e tudo some. O que separa o incômodo de cinco minutos do desastre de uma tarde é o backup. Esta seção mostra como preservar temas, sons e a configuração de forma que qualquer perda vire uma restauração mecânica.

:::objetivos
- Identificar exatamente o que precisa ser copiado para uma restauração completa
- Empacotar temas e configuração com `tar`
- Automatizar o backup com um script e `systemd timer`
- Restaurar a coleção após reinstalação ou atualização
:::

## O que precisa entrar no backup

Na seção 6, separamos dados (vídeos e sons) de configuração (escolhas). O backup completo precisa dos dois, e de mais um item esquecido com frequência: os próprios arquivos autorais que você criou na seção 7.

| Item | Caminho | Por que incluir |
|---|---|---|
| Animações baixadas | `~/homebrew/plugins/AnimationChanger/animations/` | Reprocesso custoso |
| Sons baixados | `~/homebrew/plugins/AnimationChanger/sounds/` | Idem |
| Configuração de temas | `~/homebrew/plugins/AnimationChanger/*.json` e `~/.config/AnimationChanger.json` | Suas escolhas |
| Animações autorais | onde você salvou os `.webm` que criou | Irreproduzíveis |
| Fonte dos autorais | arquivos-projeto (PNG/MP4 de origem) | Para reeditar no futuro |

A maioria das pessoas faz backup só dos vídeos baixados e esquece a configuração e as fontes. O resultado: rebaixou tudo, mas não lembra qual tema estava ativo, e não consegue reeditar a animação autoral porque o projeto-fonte se foi.

```terminal
$ find ~/homebrew/plugins/AnimationChanger ~/.config -maxdepth 2 \
    -name '*.webm' -o -name '*.mp4' -o -name '*.wav' -o -name '*.mp3' \
    -o -name '*.ogg' -o -name '*nimation*.json' 2>/dev/null | head -30
```

Esse `find` varre os locais relevantes e lista tudo que casa com os padrões de mídia e configuração. É um ótimo ponto de partida para *ver* o alcance do seu backup antes de empacotar.

## Empacotando com `tar`

O jeito mais simples e robusto de preservar a coleção é um único arquivo `tar`:

```terminal
$ tar czf ~/backup-animation-$(date +%Y%m%d).tar.gz \
    -C ~/homebrew/plugins AnimationChanger/animations AnimationChanger/sounds \
    -C ~/.config AnimationChanger.json 2>/dev/null
```

O `-c` cria, `-z` comprime com gzip, `-f` define o arquivo de saída. O `$(date +%Y%m%d)` embute a data no nome, então cada execução gera um snapshot distinto em vez de sobrescrever o anterior. O `-C` muda o diretório de trabalho relativo para cada grupo de caminhos.

```terminal
$ ls -lh ~/backup-animation-*.tar.gz
-rw-r--r-- 1 deck deck 84M Mar  1 12:00 backup-animation-20260301.tar.gz
```

O arquivo de 84 MB é o custo de ter sua coleção inteira preservada. Para confirmar o conteúdo sem extrair:

```terminal
$ tar tzf ~/backup-animation-20260301.tar.gz | head
AnimationChanger/animations/deck_startup.webm
AnimationChanger/animations/sleep.webm
AnimationChanger/animations/resume.webm
AnimationChanger/sounds/boot.mp3
...
```

O `tar tzf` lista o conteúdo do arquivo comprimido. Se você vê a estrutura esperada, o backup está íntegro.

:::dica
Guarde o `.tar.gz` fora do deck — no seu PC, num NAS ou em armazenamento na nuvem. Um backup que mora no mesmo SSD que ele protege não protege nada: uma troca de SSD ou corrupção de disco leva os dois juntos.
:::

## Automatizando com um systemd timer

Backup só tem valor se existir quando você precisar, e "eu faço de vez em quando" não é confiável. O `systemd` resolve isso com um par de unidades: um serviço que executa o backup e um timer que o agenda.

```ini
; ~/.config/systemd/user/animation-backup.service
[Unit]
Description=Backup Animation Changer themes

[Service]
Type=oneshot
ExecStart=/home/deck/bin/backup-animation.sh
```

```ini
; ~/.config/systemd/user/animation-backup.timer
[Unit]
Description=Weekly Animation Changer backup

[Timer]
OnCalendar=weekly
Persistent=true

[Install]
WantedBy=timers.target
```

O script `backup-animation.sh` contém o `tar` da seção anterior. O timer roda semanalmente (`OnCalendar=weekly`), e o `Persistent=true` garante que, se o deck estava desligado na hora marcada, o backup dispara assim que ele liga.

```terminal
$ systemctl --user enable --now animation-backup.timer
$ systemctl --user list-timers | grep animation
NEXT                         LEFT            LAST PASSED UNIT
Sat 2026-03-07 00:00:00 BRST 6 days left     n/a  n/a    animation-backup.timer
```

O `list-timers` confirma o agendamento: aqui, o próximo disparo é no sábado seguinte. A partir daí, o backup acontece sozinho, sem você lembrar.

:::info
Unidades `--user` rodam como o seu usuário e sobrevivem ao ciclo de vida da sessão — desde que o logging persistente do usuário esteja ativo. No SteamOS, isso funciona bem para timers leves como este. Para um backup que precise de `sudo` (caminhos do sistema), você usaria uma unidade de sistema em `/etc/systemd/system/` — mas aqui tudo está sob `~/`, então o escopo de usuário basta.
:::

## Restaurando a coleção

Restaurar é o backup ao contrário. Depois de reinstalar ou de um reset, reinsira o Decky Loader e o Animation Changer (seção 2), e então:

```terminal
$ tar xzf ~/backup-animation-20260301.tar.gz \
    -C ~/homebrew/plugins AnimationChanger/animations AnimationChanger/sounds
$ cp ~/backup-animation-20260301/AnimationChanger.json ~/.config/ 2>/dev/null
```

O `tar xzf` extrai os vídeos e sons de volta para as pastas do plugin. Depois, a configuração volta para o lugar. Reabra o Game Mode (ou reinicie o deck) e a coleção estará como antes.

Um detalhe importante: a restauração **não** recupera as animações autorais se elas não entraram no backup. Volte à tabela do início: fontes e projetos autorais precisam estar inclusos no `tar` ou em um backup separado.

:::atencao
Após uma atualização grande do SteamOS, o formato de configuração do plugin pode ter mudado. Se a restauração da configuração fizer o plugin se comportar estranho, apague o `.json` restaurado e reconfigure os temas na interface — preservando os vídeos e sons, que continuam válidos independente do formato de configuração.
:::

## Resumo

- O backup completo cobre dados (vídeos/sons), configuração (escolhas) e fontes autorais.
- `tar czf` empacota e comprime a coleção em um único arquivo com data no nome.
- `tar tzf` lista o conteúdo para validar o backup sem extrair.
- Um par serviço + timer do `systemd --user` agenda o backup semanal automaticamente.
- Guarde o backup fora do deck; um backup no mesmo SSD não protege contra perda de disco.

## Exercícios

1. Gere um backup completo com `tar czf` e liste seu conteúdo com `tar tzf`. A estrutura dentro do arquivo está correta?
2. Crie as unidades `animation-backup.service` e `.timer`, habilite o timer, e confirme com `systemctl --user list-timers` que ele está agendado.
3. Teste a restauração num cenário controlado: renomeie `deck_startup.webm`, extraia do backup, e confirme que a animação volta a funcionar no boot.
4. Copie o `.tar.gz` para outro dispositivo (PC, NAS ou pendrive). Se o deck quebrar hoje, o que exatamente você conseguiria recuperar a partir desse arquivo?
5. **Desafio.** Estenda o backup para incluir as animações autorais e suas fontes, criando uma estrutura de diretórios própria (`~/backup/autoral/`). Ajuste o script e o timer para que tudo entre num único snapshot versionado (com data), e documente o conteúdo num `README` dentro do próprio backup.