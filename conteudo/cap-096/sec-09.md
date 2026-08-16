Tudo o que o capítulo mostrou até aqui foi leitura e comando sobre unidades que outros escreveram. Esta seção inverte o papel: você cria a sua. Escrever um serviço próprio — e um timer que o dispara — amarra todos os conceitos anteriores num único exercício, ao mesmo tempo que ensina o ciclo de editar, recarregar e depurar que vale para qualquer unit do sistema.

:::objetivos
- Escrever um arquivo de unidade `.service` completo e correto
- Instalá-lo em `/etc/systemd/system` e ativá-lo com `daemon-reload`
- Sobrescrever uma unidade existente sem editar o arquivo original (drop-in)
- Depurar falhas de um serviço próprio com `journalctl` e `systemd-analyze verify`
- Consolidar o capítulo num serviço + timer integrados
:::

## Onde suas unidades devem viver

O systemd procura unidades em camadas ordenadas, da mais específica para a mais genérica. As três que importam:

| Caminho | Quem põe ali | Prioridade |
|---|---|---|
| `/etc/systemd/system/` | O administrador (você) | **Mais alta** |
| `/run/systemd/system/` | Gerado em runtime | Média |
| `/usr/lib/systemd/system/` | Pacotes da distribuição | Mais baixa |

A regra é simples: arquivos *seus* vão em `/etc/systemd/system/`, e eles **sobream** unidades de mesmo nome vindas de `/usr/lib` (que é onde a Valve e o pacman colocam as do SteamOS). Isso é crucial no Deck: como a raiz é somente-leitura e atualizada por imagem, você nunca deve editar `/usr/lib/systemd/system` — suas sobreposições vivem em `/etc`, que sobrevive às atualizações.

```terminal
$ systemctl cat sshd 2>/dev/null | head -1
# /usr/lib/systemd/system/sshd.service
```

O `systemctl cat` mostra o caminho real e a prioridade: se houver uma versão sua em `/etc`, é ela que aparece primeiro e vence.

## Um serviço que registra a temperatura

Vamos criar algo útil no contexto do Deck: um serviço que registra a temperatura atual do APU no journal. Primeiro o script executor:

```bash
#!/usr/bin/env bash
## /usr/local/bin/registra-temp.sh
temp=$(cat /sys/class/hwmon/hwmon*/temp1_input 2>/dev/null | head -1)
if [ -n "$temp" ]; then
    echo "Temperatura do APU: $(( temp / 1000 )) C"
else
    echo "Sensor de temperatura não encontrado"
    exit 1
fi
```

Depois o arquivo de unidade:

```ini
## /etc/systemd/system/registra-temp.service
[Unit]
Description=Registra a temperatura do APU no journal
After=multi-user.target

[Service]
Type=oneshot
ExecStart=/usr/local/bin/registra-temp.sh

[Install]
WantedBy=multi-user.target
```

Duas escolhas importam aqui. `Type=oneshot` diz que o serviço executa e termina (não fica rodando em segundo plano) — apropriado para uma tarefa pontual. `WantedBy=multi-user.target` faz o `enable` criar o symlink certo para subir no boot. Vamos instalar:

```terminal
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now registra-temp.service
Created symlink /etc/systemd/system/multi-user.target.wants/registra-temp.service → /etc/systemd/system/registra-temp.service.
$ systemctl status registra-temp.service --no-pager
● registra-temp.service - Registra a temperatura do APU no journal
     Loaded: loaded (/etc/systemd/system/registra-temp.service; enabled)
     Active: inactive (dead)

$ journalctl -u registra-temp.service --no-pager
Jan 15 15:04:10 steamdeck systemd[1]: Starting Registra a temperatura do APU no journal...
Jan 15 15:04:10 steamdeck registra-temp.sh[24891]: Temperatura do APU: 52 C
Jan 15 15:04:10 steamdeck systemd[1]: registra-temp.service: Deactivated successfully.
```

O `Active: inactive (dead)` não é erro: para um `oneshot`, terminar com sucesso é exatamente o comportamento esperado. O log mostra o ciclo completo — inicia, executa o script (52 °C), desativa. Repare que o journal capturou a saída do `echo` automaticamente, sem você configurar nada.

## Depurando uma unidade que não anda

Metade do trabalho de escrever uma unidade é descobrir por que ela falha. O primeiro passo é `systemctl status` para o veredito, seguido do journal:

```terminal
$ systemctl status registra-temp.service --no-pager
● registra-temp.service - Registra a temperatura do APU no journal
     Loaded: loaded (/etc/systemd/system/registra-temp.service; enabled)
     Active: failed (Result: exit-code) since Wed 2025-01-15 15:10:00 -03; 1min ago
   Main PID: 24950 (code=exited, status=1/FAILURE)
```

O `Result: exit-code` e o `status=1/FAILURE` apontam para o script terminando com código 1 — que é justamente o `exit 1` que colocamos para o caso de sensor ausente. Para conferir se o problema é a unidade ou o script, rode o mesmo comando manualmente. E antes de instalar, use o verificador estático:

```terminal
$ systemd-analyze verify /etc/systemd/system/registra-temp.service
```

Sem saída = sem erros de sintaxe detectados. Erros de caminho, seção malformada e diretivas desconhecidas aparecem aqui antes de você poluir o sistema. É uma verificação barata que evita loops de "edita, reinicia, falha, edita".

:::atencao
Ao depurar, não edite e recarregue às cegas: primeiro rode o script manualmente (fora do systemd) para isolar se o erro é do script ou da unidade. Depois `systemd-analyze verify`. Só então `daemon-reload` e `restart`. Essa ordem elimina variáveis e economiza minutos.
:::

## Sobrescrevendo sem editar: drop-ins

Muitas vezes você não quer (nem pode) reescrever uma unidade inteira — só precisa mudar uma linha. O sistema de **drop-in** resolve isso: você cria um diretório `<unidade>.d/` e dentro dele um arquivo `.conf` que declara apenas a sobreposição.

```terminal
$ sudo mkdir -p /etc/systemd/system/sshd.service.d/
$ cat /etc/systemd/system/sshd.service.d/override.conf
[Service]
ExecStart=
ExecStart=/usr/sbin/sshd -D -p 2222
```

O primeiro `ExecStart=` (vazio) zera a diretiva herdada; o segundo escreve a nova. O resultado: o mesmo `sshd`, agora escutando na porta 2222, sem tocar no arquivo original do pacote.

```terminal
$ sudo systemctl daemon-reload
$ systemctl cat sshd | tail -5
# /etc/systemd/system/sshd.service.d/override.conf
[Service]
ExecStart=
ExecStart=/usr/sbin/sshd -D -p 2222
```

O `systemctl cat` agora mostra as duas camadas: o arquivo original e, por cima, o drop-in. Isso é o padrão correto para personalizar qualquer serviço do SteamOS, da porta do SSH ao timeout de um processo — suas mudanças sobrevivem às atualizações porque vivem em `/etc`.

:::dica
Para reverter uma mudança de montagem, use `systemctl revert sshd`, que desativa todos os drop-ins da unidade e restaura a configuração original do pacote. Para ver só a visão final (já mesclada), `systemctl cat` resolve os drop-ins na ordem certa.
:::

## Fechando: serviço + timer

O capítulo prometeu juntar tudo. Transforme o serviço pontual num par agendado: um timer que dispara o `registra-temp` a cada hora, criando um histórico de temperatura que você pode consultar depois. Crie o `.timer` de mesmo nome:

```ini
## /etc/systemd/system/registra-temp.timer
[Unit]
Description=Dispara o registra-temp a cada hora

[Timer]
OnCalendar=hourly
Persistent=true

[Install]
WantedBy=timers.target
```

E ative o *timer* (não o serviço, que agora é um `oneshot` invocado):

```terminal
$ sudo systemctl daemon-reload
$ sudo systemctl enable --now registra-temp.timer
$ systemctl list-timers registra-temp.timer --no-pager
NEXT                        LEFT        LAST                        PASSED  UNIT                  ACTIVATES
Wed 2025-01-15 16:00:00 -03 18min left  Wed 2025-01-15 15:00:00 -03 41min   registra-temp.timer   registra-temp.service
```

Agora você tem um sistema completo e autoral: um serviço `oneshot` que mede temperatura, um timer que o dispara de hora em hora com `Persistent=true`, logs rastreáveis no journal e uma sobreposição via drop-in que você aprendeu a fazer sem quebrar o pacote. É, em miniatura, tudo o que o systemd existe para fazer.

## Resumo

- Unidades suas vivem em `/etc/systemd/system/` e sobream as do pacote em `/usr/lib` — essencial num sistema de raiz somente-leitura como o SteamOS.
- `Type=oneshot` modela tarefas pontuais; `WantedBy=` define onde o `enable` cria o symlink.
- Depure na ordem: rode o script manualmente, `systemd-analyze verify`, `daemon-reload`, `restart`.
- Drop-ins em `<unidade>.d/*.conf` sobrescrevem diretivas sem editar o arquivo original; `systemctl revert` desfaz.
- Um `.timer` + `.service` de mesmo nome materializam o agendamento: o timer dorme, o serviço executa e termina.

## Exercícios

1. Crie o serviço `registra-temp.service` completo (script + unidade), instale em `/etc/systemd/system`, rode `daemon-reload` e `enable --now`, e confirme a execução no `journalctl -u`.
2. Adicione uma diretiva `Environment=` ao serviço que deixe o caminho do sensor configurável (ex.: `SENSOR_PATH`), e altere o script para lê-la.
3. Investigue uma falha proposital: aponte `ExecStart` para um binário inexistente, recarregue, tente iniciar e leia o `status` para explicar o `Result: exit-code`.
4. Crie um drop-in para o `registra-temp.service` que mude apenas a descrição (`Description=`) e confirme com `systemctl cat` que a sobreposição aparece.
5. **Desafio.** Construa o par completo `registra-temp.timer` + `registra-temp.service` com agendamento `OnCalendar=hourly` e `Persistent=true`. Depois use o `journalctl --since "2 hours ago"` para confirmar o histórico de medições e escreva um mini-relatório das temperaturas máxima e mínima observadas.