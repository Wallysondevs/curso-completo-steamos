Quando algo para de funcionar, a primeira pergunta não é "como conserto", mas "qual é o estado agora". O `systemctl status` e seus irmãos de leitura (`is-active`, `is-enabled`, `is-failed`, `show`) respondem isso sem mudar nada no sistema — são comandos seguros, que só observam. Esta seção transforma a leitura de estado num hábito: antes de reiniciar qualquer coisa, você vai saber exatamente o que está acontecendo, com qual PID e por quê.

:::objetivos
- Interpretar por completo a saída do `systemctl status`
- Distinguir os estados possíveis de uma unidade com `is-active` e `is-failed`
- Verificar a política de boot com `is-enabled`
- Inspecionar propriedades com `systemctl show`
- Localizar serviços que falharam e o motivo do erro
:::

## Anatomia do systemctl status

O `status` é o comando mais valioso do capítulo inteiro. Ele junta, numa única tela, tudo o que as outras ferramentas mostram em separado. Vamos dissecar um caso real, o do Wi-Fi, que é gerido pelo `NetworkManager` no SteamOS:

```terminal
$ systemctl status NetworkManager --no-pager
● NetworkManager.service - Network Manager
     Loaded: loaded (/usr/lib/systemd/system/NetworkManager.service; enabled; preset: enabled)
     Active: active (running) since Wed 2025-01-15 09:12:30 -03; 4h 2min ago
       Docs: man:NetworkManager(8)
   Main PID: 833 (NetworkManager)
      Tasks: 12 (limit: 15323)
     Memory: 28.4M
        CPU: 1min 12.403s
     CGroup: /system.slice/NetworkManager.service
             └─833 /usr/bin/NetworkManager --no-daemon

Jan 15 09:12:30 steamdeck NetworkManager[833]: <info>  [startup] ...
Jan 15 09:12:31 steamdeck NetworkManager[833]: <info>  [device] manager ...
```

Cada bloco responde a uma pergunta. A linha `●` com a bolinha dá o veredito instantâneo de cor. `Loaded` diz onde está a definição e o estado de boot (aqui `enabled`, volta sozinho). `Active` dá o estado e há quanto tempo está assim — a duração ajuda a saber se acabou de reiniciar ou se está estável há horas. `Main PID` e `Tasks`/`Memory`/`CPU` são o custo de vida do serviço. `CGroup` mostra o grupo de processos e o comando exato. Por fim, as últimas dez linhas de log, já filtradas, dão a pista do que aconteceu.

:::dica
O `status` mostra o *tail* dos logs automaticamente. Se você quer os logs completos, ele imprime uma sugestão no fim ("You can use journalctl -u..."). Aceite a dica — ela já vem com a unidade certa preenchida. Mais em [a seção sobre journalctl](#/cap-096/sec-05).
:::

## Estados de alto nível

Para respostas de uma linha só, o `systemd` oferece comandos de estado que retornam apenas um valor — perfeitos para scripts e para um olhar rápido:

```terminal
$ systemctl is-active NetworkManager
active
$ systemctl is-enabled NetworkManager
enabled
$ systemctl is-failed NetworkManager
active
```

Repare no detalhe sutil e traiçoeiro: `is-failed` não imprime `no`, imprime o estado (no caso, `active`, que significa "não está falhando"). Ele também devolve um código de saída que você pode testar num script (`0` se não falhou, não-zero se falhou). O `is-active` resume-se a `active`, `inactive`, `activating` ou `failed`; o `is-enabled` a `enabled`, `disabled`, `static`, `masked` ou `enabled-runtime`.

O estado `failed` merece atenção especial. Ele aparece quando o processo principal de um serviço terminou com erro e não conseguiu se manter de pé. Para achar *todos* os que fracassaram de uma vez:

```terminal
$ systemctl --failed --no-pager
  UNIT           LOAD   ACTIVE SUB    DESCRIPTION
● foo.service    loaded failed failed Meu serviço de teste

LOAD   = Reflects whether the unit definition was properly loaded.
ACTIVE = The high-level unit activation state, i.e. generalization of SUB.
SUB    = The low-level unit activation state, values depend on unit type.

1 loaded units listed.
```

Um serviço que já mostrou `failed` mantém esse estado gravado até ser reiniciado (ou até `systemctl reset-failed`). Isso é útil: mesmo que o processo tenha morrido, você continua vendo a marca do acidente ao listar os falhados.

:::atencao
`failed` é um estado pegajoso. Depois de corrigir e religar um serviço, o `systemctl --failed` pode continuar a listá-lo se você apenas matou o processo na mão. Rode `systemctl reset-failed` (ou reinicie o serviço via `systemctl restart`) para limpar a marca antiga e não se enganar achando que ainda está quebrado.
:::

## Inspecionando propriedades com show

O `status` é curado; o `show` é bruto. Enquanto o primeiro escolhe as dez linhas mais relevantes, o segundo despeja *todas* as propriedades do objeto unit no formato `Chave=Valor`. É o comando para quando você precisa de um dado exato — o caminho do binário, o usuário do serviço, o tempo desde o boot:

```terminal
$ systemctl show NetworkManager -p ExecStart -p User -p Restart
ExecStart={ path=/usr/bin/NetworkManager ; argv[]=/usr/bin/NetworkManager --no-daemon ; ignore_errors=no ; start_time=[n/a] ; stop_time=[n/a] ; pid=0 ; code=(null) ; status=0/0 }
User=
Restart=on-failure
$ systemctl show NetworkManager -p ActiveEnterTimestamp
ActiveEnterTimestamp=Wed 2025-01-15 09:12:30 -03
```

Com `-p` você pede uma propriedade específica; sem ele, vem um inventário gigantesco. As três do exemplo respondem a perguntas frequentes: o que exatamente é executado (`ExecStart`), como qual usuário (`User`, vazio = root) e qual a política de reinício após falha (`Restart=on-failure`, ou seja, o `systemd` religa se o processo cair com erro).

O `show` também serve para descobrir o tipo e a árvore de dependências de qualquer unidade, o que amarra esta seção à próxima:

```terminal
$ systemctl show sshd -p Type -p WantedBy
Type=notify
WantedBy=multi-user.target
```

`Type=notify` diz que o serviço avisa o `systemd` quando está pronto (em vez de só bifurcar e sumir), e `WantedBy=multi-user.target` indica em que target ele será puxado no boot. Agora você tem a caixa de ferramentas completa para *ler* — o próximo passo é *agir*.

## Resumo

- `systemctl status` concentra estado, PID, uso de recursos, caminho da unidade e as últimas linhas de log.
- `is-active`, `is-enabled` e `is-failed` devolvem respostas de uma linha e códigos de saída usáveis em scripts.
- `systemctl --failed` lista todas as unidades que falharam; `reset-failed` limpa as marcas antigas.
- `systemctl show -p Chave` expõe propriedades cruas como `ExecStart`, `User`, `Restart` e `Type`.
- O estado `failed` é pegajoso e só some ao reiniciar o serviço ou rodar `reset-failed`.

## Exercícios

1. Rode `systemctl status` de um serviço ativo e identifique, textualmente, cada bloco da saída (bolinha, Loaded, Active, Main PID, CGroup).
2. Execute `systemctl is-active`, `is-enabled` e `is-failed` para o mesmo serviço e explique a diferença de significado entre os três.
3. Liste os serviços com falha com `systemctl --failed` e, se houver algum, leia as últimas linhas do log no `status` para achar o motivo.
4. Use `systemctl show <serviço> -p ExecStart -p User` e escreva uma frase descrevendo o que aquele serviço executa e como qual usuário.
5. **Desafio.** Escreva um pequeno script `saude.sh` que percorra uma lista de serviços (ex.: `NetworkManager`, `sshd`, `docker`) e imprima, para cada um, o resultado de `is-active` e `is-enabled` lado a lado, terminando com `systemctl --failed`.
