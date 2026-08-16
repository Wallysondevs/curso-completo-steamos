Quando o Steam Deck liga e algo quebra, a tentação é reinstalar o sistema inteiro de imediato. Quase sempre é desperdício: a maioria dos problemas comuns tem causa única e solução de minutos, desde que você siga uma ordem de investigação em vez de sair chutando. Esta seção monta o método que as outras oito do capítulo vão aplicar uma a uma — identificar o sintoma, localizar a camada culpada e só então agir.

:::objetivos
- Fixar uma ordem de diagnóstico que evita reinstalações desnecessárias
- Distinguir sintoma de causa ao relatar um problema
- Reproduzir a falha de forma controlada antes de mudar qualquer coisa
- Saber qual ferramenta consultar em cada camada do sistema
:::

## Sintoma não é causa

Dizer "o Steam Deck não liga" não ajuda ninguém, nem a você. É um sintoma composto que pode ter uma dúzia de causas diferentes: TV sem o canal certo, cabo HDMI ruim, sistema travado antes do GRUB, inicialização interrompida no meio. O primeiro trabalho do diagnóstico é transformar o sintoma em uma família de causas verificáveis.

Uma boa regra é responder três perguntas antes de tocar em qualquer configuração:

- **Quando** começou? Depois de uma atualização, de instalar um Flatpak, de derrubar a máquina no chão?
- **Até onde** o sistema chega? Botão liga a ventoinha? Aparece o logo? Entra no menu do GRUB? Chega na área de trabalho?
- **Muda** se você trocar uma variável? Com o carregador plugado, com um dock, sem HDMI?

```terminal
$ uptime -s
2024-12-03 14:22:01
```

`uptime -s` mostra quando o sistema iniciou. Se ele diz que o sistema subiu às 14:22 mas você apertou o botão às 14:20, você sabe que houve um boot limpo; se mostra hora de dias atrás, a máquina não reiniciou de fato e o problema pode ser suspensão, não inicialização.

## A ordem do mais barato ao mais caro

Diagnóstico bom vai do esforço mínimo ao máximo, e deixa as ações destrutivas por último. A ordem que este capítulo segue é:

1. **Observar e reproduzir** — confirmar a falha, anotar o sintoma exato.
2. **Ler os logs** — `journalctl`, `dmesg`, mensagens do boot.
3. **Testar o mínimo viável** — kernel anterior no GRUB, modo failsafe, sem HDMI.
4. **Isolar a camada** — é firmware? kernel? driver? usuário?
5. **Reparar** — reconfigurar, desinstalar, reinstalar o pacote específico.
6. **Restaurar** — só no fim, a opção nuclear de fábrica ou reinstalação.

:::atencao
Nunca comece pela restauração de fábrica. Ela apaga tudo o que você tem no aparelho e, na maioria dos casos, não corrige a causa — apenas volta o sistema a um estado que irá quebrar de novo quando a causa reaparecer. Reinstalar é o último recurso, não o primeiro reflexo.
:::

## Reproduzir antes de mudar

Um problema que você não consegue reproduzir é impossível de consertar de forma confiável. Antes de aplicar qualquer "correção que vi num vídeo", tente disparar a falha de novo de propósito e observe se o comportamento é sempre o mesmo.

```terminal
$ journalctl -b -1 -p err --no-pager
Dec 02 18:41:03 steamdeck kernel: nouveau 0000:01:00.0: fifo: SCHED_ERROR 0a [CTXSW_TIMEOUT]
Dec 02 18:41:03 steamdeck systemd-coredump[812]: Process 774 (gamescope) dumped core.
```

A flag `-b -1` pede o log do boot **anterior**, o que é essencial porque um problema grave costuma reiniciar a máquina e você precisa ver o que aconteceu na sessão que morreu. A flag `-p err` filtra só por prioridade de erro ou pior. Reparou que a saída mostra uma falha de GPU (`nouveau`) seguida de um *core dump* do `gamescope`, o compositor do modo jogo: isso já aponta a camada culpada sem trocar uma vírgula do sistema.

## Onde cada camada se esconde

Saber *onde* olhar é metade do diagnóstico. Cada camada tem sua ferramenta própria, e misturá-las gera conclusão errada.

| Camada | Pergunta típica | Ferramenta |
|---|---|---|
| Hardware/firmware | o aparelho liga? o dock funciona? | inspeção física, `lsusb`, `dmesg` |
| Boot / GRUB | o kernel chega a carregar? | menu do GRUB, parametros de kernel |
| Kernel | o driver carregou? | `dmesg`, `lsmod` |
| Inicialização (systemd) | qual serviço falhou? | `systemctl --failed`, `journalctl` |
| Usuário/interface | o Plasma subiu? o Steam abriu? | logs do `gamescope`, `~/.local/share` |

:::dica
Guarde uma ordem fixa mental: **`dmesg` para o que o kernel viu, `systemctl --failed` para o que a inicialização quebrou, `journalctl` para a narrativa completa com horários.** Esses três respondem a 90% dos casos antes de você abrir uma aba de busca.
:::

## Resumo

- Sintoma não é causa; converter o sintoma em perguntas respondíveis é o primeiro passo.
- A ordem correta vai do barato ao caro, deixando reinstalação por último.
- Reproduzir a falha de forma controlada precede qualquer correção.
- `journalctl -b -1 -p err` revela a causa do boot anterior que morreu.
- `dmesg`, `systemctl --failed` e `journalctl` cobrem kernel, inicialização e narrativa completa.
- A camada culpada determina a ferramenta certa; misturar camadas leva a conclusão errada.

## Exercícios

1. Rode `uptime -s`, `uptime -p` e `who -b` e compare as três respostas. Elas batem entre si?
2. Liste os serviços que falharam em algum boot recente com `systemctl --failed` e, para o primeiro da lista, leia seus últimos erros com `journalctl -u <servico>`.
3. Revisite o boot anterior inteiro com `journalctl -b -1 -p err --no-pager` e classifique cada linha: ela é de hardware, kernel, serviço ou interface?
4. Provocar uma falha leve e inofensiva (por exemplo, tentar usar um comando com permissão errada) e localize o registro dela no `journalctl` em tempo real.
5. **Desafio.** Sem consultar a seção 7, elabore um "formulário de sintoma" de quatro perguntas que, respondidas, permitam a um colega localizar a camada culpada de um problema que você nunca viu. Teste o formulário contra três falhas hipotéticas diferentes.
