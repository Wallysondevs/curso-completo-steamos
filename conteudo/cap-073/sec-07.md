Tudo funciona até parar de funcionar. O Decky injeta código numa interface que não foi projetada para ser estendida — quando a Valve atualiza o Steam Client, quando um plugin entra em loop, ou quando o backend morre silenciosamente, o sintoma é sempre o mesmo: o Menu Rápido não responde, ou a aba do Decky some, ou o Game Mode inteiro trava. Diagnosticar requer ler os logs certos, isolar o plugin ofensor e restaurar o sistema sem reinstalar do zero.

:::objetivos
- Localizar e interpretar os logs do Decky Loader e de cada plugin
- Usar `journalctl` para inspecionar o serviço `plugin_loader`
- Diagnosticar travamentos do Game Mode causados por plugins
- Isolar o plugin culpado testando com metade dos plugins de cada vez
- Diferenciar um crash do Decky de um crash do Steam Client
:::

## A hierarquia dos logs

O Decky produz logs em duas camadas. A primeira é o **journal do systemd**, que registra a saúde do serviço `plugin_loader` — se ele subiu, se morreu, se reiniciou. A segunda são os **arquivos de log por plugin**, dentro de `~/homebrew/logs/`, que registram o que cada backend fez.

```terminal
$ journalctl --user -u plugin_loader --since "30 min ago" --no-pager
Apr 20 18:02:11 steamdeck systemd[1291]: Started Plugin Loader.
Apr 20 18:02:12 steamdeck plugin_loader[2912]: [loader] Scanning plugins in /home/deck/homebrew/plugins
Apr 20 18:02:12 steamdeck plugin_loader[2912]: [loader] Loaded: SDH-AnimationChanger (v1.2.0)
Apr 20 18:02:12 steamdeck plugin_loader[2912]: [loader] Loaded: PluginOK (v0.9.1)
Apr 20 18:02:20 steamdeck plugin_loader[2912]: [loader] Frontend injection complete
```

Esse log mostra a inicialização normal: o loader escaneia `~/homebrew/plugins/`, carrega cada um, e injeta o frontend. Se um plugin falha ao carregar, é aqui que a linha de erro aparece.

Já o log de cada plugin é o diário de bordo do backend:

```terminal
$ tail ~/homebrew/logs/SDH-AnimationChanger/plugin.log
[18:02:12] INFO: Plugin loaded (v1.2.0)
[18:02:14] INFO: Settings loaded from /home/deck/homebrew/settings/SDH-AnimationChanger/settings.json
[18:04:30] ERROR: Failed to read animation file: Permission denied
[18:04:31] WARN: Falling back to default animation
```

O plugin tentou ler um arquivo de animação e recebeu `Permission denied`. A linha `ERROR` é a pista. Se o plugin tentasse o impossível em loop — algo assim — o log cresceria rapidamente e o backend travaria.

```terminal
$ du -sh ~/homebrew/logs/*/
40K     /home/deck/homebrew/logs/SDH-AnimationChanger/
4.0K    /home/deck/homebrew/logs/PluginOK/
```

Logs com tamanho anômalo (megabytes) costumam indicar loop de erro — um plugin que tenta, falha, loga e tenta de novo, sem backoff.

## O plugin_loader morreu: leia o journal

Quando a aba do Decky some e `systemctl --user status plugin_loader` mostra `failed`, o journal explica por quê:

```terminal
$ journalctl --user -u plugin_loader --since "1 hour ago" -p 3 --no-pager
Apr 20 18:02:12 steamdeck plugin_loader[2912]: SyntaxError: invalid syntax (PluginBroken, line 15)
Apr 20 18:02:13 steamdeck systemd[1291]: plugin_loader.service: Main process exited, code=exited, status=1/FAILURE
Apr 20 18:02:18 steamdeck systemd[1291]: plugin_loader.service: Scheduled restart job, restart counter is at 1.
Apr 20 18:02:25 steamdeck systemd[1291]: plugin_loader.service: Start request repeated too quickly.
Apr 20 18:02:25 steamdeck systemd[1291]: plugin_loader.service: Failed with result 'exit-code'.
```

A flag `-p 3` filtra apenas mensagens de erro (prioridade emerg, alert, crit, error). Na saída, a causa raiz é clara: `SyntaxError` no `PluginBroken`, linha 15. O serviço tentou reiniciar, mas como o problema é determinístico (o erro de sintaxe não se resolve sozinho), o systemd viu a tentativa repetida e desistiu.

A solução imedita é desativar o plugin ofensor (seção 6) e reiniciar o serviço. Para descobrir qual plugin é o ofensor quando o journal não deixa claro, vá ao arquivo de log específico:

```terminal
$ grep -lr "ERROR\|FATAL\|Traceback" ~/homebrew/logs/*/plugin.log
/home/deck/homebrew/logs/PluginBroken/plugin.log
```

:::info
A flag `-p` do `journalctl` usa os níveis de syslog (0=emerg, 1=alert, 2=crit, 3=error, 4=warning, 5=notice, 6=info, 7=debug). Filtrar por `-p 3` mostra apenas mensagens de nível 3 (error) ou mais grave, o que normalmente isola o que de fato quebrou sem poluir a saída com mensagens de inicialização. Para ver tudo que um plugin específico logou, combine: `journalctl --user -u plugin_loader --since "1 hour ago" -p 6 --no-pager`.
:::

## Game Mode travou: é o Steam ou é o Decky?

O sintoma mais temido: o Game Mode congela — você aperta `...`, o Steam, `B`, e nada responde. A tela está congelada mas o sistema não reiniciou sozinho. A pergunta é: o Steam Client travou, ou um frontend do Decky travou e derrubou o Steam junto?

O jeito mais direto de descobrir é entrar por SSH de outro dispositivo ou acessar um TTY ([[Ctrl+Alt+F2]]) e verificar o que está vivo:

```terminal
$ pgrep -la steam
2910 /home/deck/.local/share/Steam/steam.sh
$ systemctl --user status plugin_loader
● plugin_loader.service - Plugin Loader
   Active: failed (Result: exit-code)
```

Se o Steam ainda está rodando mas o `plugin_loader` está `failed`, o Decky morreu mas o Steam continua — a tela congelada pode ser o frontend do Steam aguardando uma resposta do backend que nunca chegará. Nesse caso, apenas desativar os plugins e reiniciar o serviço resolve:

```terminal
$ mv ~/homebrew/plugins/*/ ~/homebrew/plugins-disabled/
$ systemctl --user restart plugin_loader
```

Se nem o Steam está rodando (`pgrep -la steam` volta vazio), o crash foi do Steam Client diretamente — plugins podem ter contribuído como gatilho, mas o culpado primário é o cliente da Valve. O cenário é diferente e tratado na seção 8.

## Isolando o plugin ofensor: bissecção

O método mais eficiente para achar qual plugin quebra o sistema não é desativar um a um — é cortar o conjunto pela metade, iterativamente.

Passo a passo com 8 plugins:

```terminal
$ ls ~/homebrew/plugins/
A/  B/  C/  D/  E/  F/  G/  H/
```

1. Mova A, B, C, D para `~/homebrew/plugins-disabled/` e reinicie. Se o problema sumiu, o culpado está entre A, B, C, D; se persistiu, está entre E, F, G, H.
2. Suponha que o culpado está entre A, B, C, D. Restaure-os. Agora mova A, B para fora e reinicie. Se sumiu, está em A ou B; senão, em C ou D.
3. Na terceira iteração, você tem 2 suspeitos. Mova um deles.

Com essa técnica, o número máximo de iterações para N plugins é `ceil(log2(N))`. Com 32 plugins, 5 iterações. Com 64, 6. É a diferença entre 10 minutos e uma tarde inteira de teste.

```terminal
$ for d in A B C D; do mv ~/homebrew/plugins/$d ~/homebrew/plugins-disabled/; done
$ systemctl --user restart plugin_loader
```

## Sinais sutis de que um plugin está doente

Nem todo plugin quebra de forma espetacular. Existem sinais mais discretos de que algo está errado:

| Sintoma | Possível causa |
|---|---|
| Ícone do Decky aparece mas a lista de plugins demora 10+ segundos para carregar | Backend de algum plugin está em loop |
| Plugins funcionam mas a bateria drena 20% mais rápido que o normal | Plugin faz polling em loop sem `sleep` |
| O `plugin.log` de um plugin específico cresce 1 MB por hora | Erro em loop com logging desenfreado |
| Ao abrir o Decky, o Steam Client consome 1 núcleo a 100% | Frontend do plugin renderiza em loop (bug no React) |

O `top` ou `htop` no Desktop Mode é aliado:

```terminal
$ htop
  PID  USER  PRI  NI  VIRT   RES   CPU% MEM%
 2910  deck   20   0  5.2G  1.1G   2.3  8.1  steam
 2912  deck   20   0   98M   45M  98.7  1.4  python main.py (PluginLoop)
```

Um processo Python de plugin consumindo 98% de CPU é diagnóstico fechado: o backend está em loop infinito. Desative o plugin e reporte ao autor.

## Resumo

- O Decky tem dois níveis de log: `journalctl --user -u plugin_loader` para o serviço, e `~/homebrew/logs/<plugin>/plugin.log` para cada backend.
- Erros de sintaxe no `main.py` de qualquer plugin matam o loader inteiro; o journal mostra qual e onde.
- Se o Game Mode trava, verifique via SSH/TTY se é o Steam que morreu ou apenas o Decky; o tratamento difere.
- A bissecção encontra o plugin ofensor em `ceil(log2(N))` iterações, movendo metade dos plugins para fora de cada vez.
- Sinais sutis (CPU alta, log crescendo, atraso na interface) indicam plugins doentes que ainda não "quebraram", mas vão quebrar.

## Exercícios

1. Rode `journalctl --user -u plugin_loader --since "1 hour ago"` e interprete cada linha: o serviço reiniciou alguma vez? Algum plugin teve erro?
2. Escolha um plugin, introduza um erro de sintaxe no `main.py` (por exemplo, remova um `)`), reinicie o serviço e observe o journal. Depois corrija o erro e restaure.
3. Use `du -sh ~/homebrew/logs/*/` para listar o tamanho dos logs. Existe algum plugin com log anormalmente grande? Se sim, inspecione o conteúdo com `tail`.
4. Simule uma bissecção: numere 16 plugins hipotéticos de 1 a 16 e, supondo que o nº 13 é o defeituoso, trace os passos da bissecção (quais metades você move a cada iteração) até isolar o 13. Conte quantos ciclos foram.
5. **Desafio.** Conecte-se via SSH ao deck com o Game Mode aberto, identifique o PID do backend de um plugin específico com `ps aux | grep`, e mate-o com `kill -9`. O que acontece na interface? O serviço `plugin_loader` recria o processo? Compare com desativar normalmente pela interface.