Faxina pontual resolve o problema de hoje, mas o espaço volta a encher. A diferença entre quem vive com o Deck tranquilo e quem vive deletando coisas em pânico é a automação: regras que monitoram o disco, alertam quando ele cruza o limite e limpam o lixo previsível antes que ele vire crise. Esta seção monta esse sistema no SteamOS, usando `journalctl`, agendadores e scripts.

:::objetivos
- Monitorar o espaço com alertas quando o disco cruza um limite
- Entender onde o SteamOS guarda logs e como evitar que engordem
- Criar um script de limpeza automatizado e seguro
- Agendar a execução com `systemd-timer` (o cron do systemd)
- Limpar o journal do systemd e configurar seu tamanho máximo
:::

## Monitorando com limite e alerta

O primeiro passo da automação é saber *quando* agir. Um script que roda periodicamente e avisa quando a home passa de um percentual crítico evita a surpresa do "disco cheio" no meio de um download:

```bash
#!/usr/bin/env bash
# ~/bin/checa-disco.sh
USO=$(df /home --output=pcent | tail -1 | tr -dc '0-9')
LIMITE=85

if [ "$USO" -ge "$LIMITE" ]; then
    echo "ATENÇÃO: /home está com ${USO}% de uso" >&2
    du -sh ~/.local/share/Steam/steamapps/shadercache \
          ~/.local/share/Steam/steamapps/compatdata ~/Downloads
fi
```

O comando `df --output=pcent` entrega só o percentual, limpo de caracteres extras pelo `tr -dc '0-9'`. Quando o percentual passa de 85, o script imprime um alerta e lista os suspeitos habituais.

## Logs: o que o systemd acumula

O systemd (o init do SteamOS) registra tudo num arquivo de journal binário. Sem limite, esse journal cresce indefinidamente:

```terminal
$ journalctl --disk-usage
Archived and active journals take up 512.0M in the file system.
```

Meio gigabyte de logs é comum. Para limitar para, digamos, 100 MB:

```terminal
$ sudo journalctl --vacuum-size=100M
Vacuuming done, freed 412.0M of archived journals from /var/log/journal/.
```

Para tornar o limite permanente, edite o arquivo de configuração:

```ini
## /etc/systemd/journald.conf
[Journal]
SystemMaxUse=100M
```

Após editar, reinicie o serviço:

```terminal
$ sudo systemctl restart systemd-journald
```

:::nota
No SteamOS, o sistema é imutável, e `/etc/systemd/journald.conf` pode viver na partição somente leitura. Se a edição não persistir entre reinicializações, use um drop-in em `/etc/systemd/journald.conf.d/10-limite.conf` — drop-ins costumam sobreviver na área gravável.
:::

## Script de limpeza automatizado

Reúna as limpezas seguras num único script. A regra de ouro: só apagar o que é **regenerável** (shader cache, caches de pipeline, logs) e nunca o que é **único** (saves, configurações, ROMs):

```bash
#!/usr/bin/env bash
# ~/bin/limpa-disco.sh
# Limpa caches regeneráveis. NUNCA toca em saves nem bibliotecas.

echo "== Shader cache =="
du -sh ~/.local/share/Steam/steamapps/shadercache
rm -rf ~/.local/share/Steam/steamapps/shadercache/*

echo "== Cache de pipeline DirectX dentro dos prefixos =="
find ~/.local/share/Steam/steamapps/compatdata \
    -name '*.tpipelinecache' -delete 2>/dev/null
find ~/.local/share/Steam/steamapps/compatdata \
    -name '*.dxgi-cache' -delete 2>/dev/null

echo "== Downloads com mais de 180 dias =="
find ~/Downloads -maxdepth 1 -type f -mtime +180 -delete

echo "== Lixeira =="
rm -rf ~/.local/share/Trash/files/* ~/.local/share/Trash/info/*

echo "== Journal (se tiver sudo) =="
sudo -n journalctl --vacuum-size=100M 2>/dev/null || true
```

O `exporta` final usa `sudo -n` (não-interativo): se o sudo exigir senha, o comando falha silenciosamente graças ao `|| true`, sem travar o script.

## Onde o SteamOS acumula logs além do journal

O journal do systemd é o maior acumulador, mas o Steam e o Proton também escrevem arquivos de log que crescem sem limite. Os principais:

```terminal
$ ls -lh ~/.local/share/Steam/logs/ 2>/dev/null
total 420M
-rw-r--r-- 1 deck deck 210M Ago 15 21:00 console-linux.txt
-rw-r--r-- 1 deck deck 180M Ago 15 21:00 content_log.txt
-rw-r--r-- 1 deck deck  30M Ago 15 21:00 bootstrap_log.txt
```

O `console-linux.txt` é o mais perigoso: captura toda saída do Steam, inclusive erros de jogos, e em máquinas que rodam muitos títulos problemáticos passa de 1 GB. Ele é regenerado a cada reinício do Steam, então é seguro apagar ou truncar:

```terminal
$ : > ~/.local/share/Steam/logs/console-linux.txt
```

O `: > arquivo` trunca o arquivo para zero sem apagá-lo (mantém as permissões e evita que o Steam recrie do zero). Para os logs do Proton, cada jogo grava no próprio prefixo, em `compatdata/<AppID>/pfx/console.log` — estes também são seguros de limpar, mas só quando o Steam está fechado.

## Agendando com systemd timer

O moderno substituto do cron no SteamOS é o `systemd-timer`. Em vez de um único arquivo crontab, você cria um *serviço* (o que rodar) e um *timer* (quando rodar):

```ini
## ~/.config/systemd/user/limpa-disco.service
[Unit]
Description=Limpeza automatizada de disco do Deck

[Service]
Type=oneshot
ExecStart=/home/deck/bin/limpa-disco.sh
```

```ini
## ~/.config/systemd/user/limpa-disco.timer
[Unit]
Description=Roda limpa-disco toda semana

[Timer]
OnCalendar=weekly
Persistent=true

[Install]
WantedBy=timers.target
```

Ative e verifique:

```terminal
$ systemctl --user daemon-reload
$ systemctl --user enable --now limpa-disco.timer
$ systemctl --user list-timers
NEXT                          LEFT       LAST  PASSED  UNIT
Mon 2024-08-19 07:00:00 UTC   6 days     n/a   n/a     limpa-disco.timer
```

O `Persistent=true` garante que, se o Deck esteve desligado na hora marcada, o timer dispara na próxima vez que ligar — essencial num aparelho que passa dias em suspensão.

:::atencao
Timers de usuário (`systemd --user`) só rodam enquanto você está logado no modo Desktop. No Game Mode, a sessão de usuário também existe, mas o comportamento varia. Para garantir execução independente de sessão, use um timer de sistema em `/etc/systemd/system/` com `sudo`. A troca exige copiar o `ExecStart` para um caminho global e mudar `--user` por `sudo systemctl`.
:::

## Resumo

- Alertar ao cruzar um limite (ex.: 85%) evita surpresas; `df --output=pcent` entrega o número limpo.
- O journal do systemd cresce sem limite; `journalctl --vacuum-size` faz a limpeza pontual e `SystemMaxUse` fixa o teto.
- Um script de limpeza deve apagar só caches regeneráveis, nunca saves ou bibliotecas.
- `systemd-timer` é o agendador moderno; `OnCalendar=weekly` com `Persistent=true` é o padrão ideal para o Deck.
- `sudo -n ... || true` permite que o script rode sem travar quando o sudo não tem senha.

## Exercícios

1. Rode `df /home --output=pcent` e crie um script `checa-disco.sh` que avisa quando passar de 85%.
2. Verifique o tamanho do journal com `journalctl --disk-usage` e reduza-o com `--vacuum-size=100M`.
3. Escreva um `limpa-disco.sh` que apague shader cache, caches de pipeline e Downloads antigos — sem tocar em saves.
4. Crie um `systemd-timer` de usuário para rodar `limpa-disco.sh` semanalmente e confirme com `list-timers`.
5. **Desafio.** Instale o timer como serviço de sistema (via `sudo`), reinicie o Deck e confirme com `journalctl -u limpa-disco` que a limpeza rodou mesmo sem abrir o modo Desktop.