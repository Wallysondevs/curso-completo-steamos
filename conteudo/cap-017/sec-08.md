A suspensão no Deck funciona bem quase sempre — até o dia em que não funciona. Você aperta o botão, a tela apaga, mas o LED de energia fica piscando e o aparelho não dorme. Ou pior: ele suspende, mas ao acordar exibe tela preta, jogo travado ou Wi-Fi que não volta. Esta seção monta um roteiro de diagnóstico, da causa mais provável à mais obscura, sempre partindo dos logs.

:::objetivos
- Diagnosticar falhas de retomada com os logs do systemd e do kernel
- Identificar as causas mais comuns de tela preta e travamento pós-suspensão
- Testar suspend/resume de forma controlada e reproduzível
- Aplicar correções progressivas: do por software ao por firmware
:::

## O teste controlado: reproduza primeiro

Diagnóstico sem reprodução é adivinhação. Antes de mexer em qualquer coisa, estabeleça se o problema é consistente. Um Deck que falha 1 em cada 20 retomadas tem causa diferente de um que falha sempre.

```terminal
$ systemctl suspend
```

Depois de acordar (ou de o aparelho ficar preso), colete o estado do último ciclo. O primeiro lugar a olhar é se a suspensão em si completou:

```terminal
$ journalctl -u systemd-suspend -b -0 -n 30
ago 12 23:41:07 steamdeck systemd[1]: Starting systemd-suspend.service - System Suspend...
ago 12 23:41:07 steamdeck systemd-sleep[4012]: Suspending system...
ago 12 23:41:12 steamdeck systemd-sleep[4012]: System resumed.
ago 12 23:41:12 steamdeck systemd[1]: systemd-suspend.service: Deactivated successfully.
```

Se o log termina em `Suspending system...` sem o `System resumed.` correspondente, o kernel **não voltou** — a máquina ficou presa em S3. Se ambos aparecem, a suspensão e a retomada do kernel funcionaram, e o problema está em **cima** (Gamescope, GPU, jogo), não embaixo.

## Tela preta na retomada: o caso clássico

O sintoma mais relatado é retomar para uma tela preta. O áudio pode voltar, o LED muda de cor, mas a imagem não aparece. Três causas disputam o posto de mais comum:

**A GPU não restaurou o estado.** O driver `amdgpu` precisa reconfigurar o display na volta. Se o Gamescope não repinta o framebuffer, a tela fica preta apesar de o sistema estar vivo.

**O backlight não religou.** O painel pode estar ativo, mas o brilho ficou em zero. Testar com uma lanterna contra a tela pode revelar a imagem "presente mas apagada" — um sintoma distinto que aponta para o backlight, não para a GPU.

**O jogo falhou ao descongelar.** Um processo que não responde ao *thaw* pode segurar o compositor. O resto do sistema está bem, mas a sessão gráfica fica travada.

```terminal
$ journalctl -b -0 -p 3 | grep -iE "amdgpu|drm|backlight|gamescope" | tail -15
ago 12 23:41:15 steamdeck kernel: [drm:amdgpu_device_resume [amdgpu]] *ERROR* amdgpu: resume failed
ago 12 23:41:15 steamdeck kernel: amdgpu 0000:04:00.0: amdgpu: GPU reset begin!
```

Aqui o log de prioridade `-p 3` (erros) revela o culpado: o driver `amdgpu` reportou `resume failed` e iniciou um *GPU reset*. Isso confirma que a falha é no subsistema gráfico na retomada, não na suspensão. O reset da GPU pode ser o próprio kernel se autorrecuperando — ou o prenúncio de um travamento.

:::dica
Antes de culpar o software, force uma retomada limpa segurando o botão de energia por 10 segundos (desligamento forçado) e religando. Se o problema desaparece após um reboot limpo mas reaparece após suspender novamente, você confirmou que ele é **específico da retomada**, não algo quebrado de forma permanente.
:::

## Wi-Fi e Bluetooth que não voltam

Outro clássico: o sistema retoma, mas o Wi-Fi está morto — o ícone mostra "desconectado" e nenhuma rede aparece. Isso quase sempre é o driver do rádio que não reidratou corretamente o hardware após S3.

```terminal
$ ip link show wlan0
3: wlan0: <NO-CARRIER,BROADCAST,MULTICAST,UP> mtu 1500 qdisc noqueue state DOWN mode DORMANT group default qlen 1000
```

`state DOWN` após a retomada é o sintoma: a interface não voltou ao ar. A correção de primeiro passo é derrubar e levantar o rádio inteiro via `rfkill`, forçando o driver a reinicializar:

```terminal
$ rfkill block wlan
$ sleep 2
$ rfkill unblock wlan
$ ip link show wlan0
3: wlan0: <BROADCAST,MULTICAST,UP,LOWER_UP> mtu 1500 qdisc noqueue state UP mode DORMANT group default qlen 1000
```

Se `rfkill` resolve, o problema está no estado do rádio após a retomada — um bug conhecido em certos drivers WiFi com S3. Se não resolve, pode ser o módulo do kernel do driver que precisa ser recarregado (`modprobe -r` seguido de `modprobe`).

:::atencao
Recarregar o módulo do driver Wi-Fi (`rmmod`/`modprobe`) interrompe qualquer conexão ativa e pode derrubar o NetworkManager. Faça isso fora de uma partida online e, se possível, com o modo avião ativado antes, para uma transição limpa.
:::

## Quando o sistema não dorme de jeito nenhum

Às vezes o sintoma é o oposto: você manda suspender, a tela pisca, mas o Deck continua acordado (ou suspende e acorda imediatamente). A suspeita número um são os inibidores — algo segurando `sleep block` ou `idle block`.

```terminal
$ systemd-inhibit --list
WHO            UID  USER PID  COMM          WHAT     MODE
Steam          1000 deck 1234 steam         sleep    block
```

Se um inibidor `sleep block` está ativo, o systemd recusa a suspensão. Encerre a aplicação que o segura (ou o processo indicado na coluna `PID`) e tente de novo. A segunda suspeita é um dispositivo de wakeup "gritando" — gerando interrupções contínuas que acordam o sistema na hora:

```terminal
$ cat /proc/acpi/wakeup | grep -i enabled
GPP0      S4    *enabled   pci:0000:00:01.0
XHC0      S4    *enabled   pci:0000:05:00.4
```

Desabilite temporariamente fontes suspeitas (especialmente USB, `XHC0`) e teste se a máquina permanece suspensa. Um hub USB defeituoso ou um cabo mal-encostado pode gerar o wakeup espúrio.

:::perigo
Não desabilite a fonte de wakeup do próprio botão de energia. Se você desligar o único *wake* que reinicia a CPU por comando físico, pode ficar sem uma forma fácil de acordar o Deck além de segurar o botão por 10 segundos (reset forçado) — que é um desligamento não-limpo e pode corromper o filesystem. Ao testar, deixe sempre pelo menos uma via de retorno.
:::

## A última cartada: atualizar firmware e kernel

Se nada acima resolve e o problema é reproduzível e específico da retomada, o caminho correto é reportar e aguardar correção — ou, se você estiver em condições de testar, atualizar. A Valve entrega correções de suspensão quase sempre via atualização de firmware (BIOS/coreboot) ou de kernel, porque são as camadas que implementam os estados ACPI e o driver `amdgpu`.

```terminal
$ steamos-update check
Checking for updates...
Your system is up to date.
```

O `steamos-update check` consulta os repositórios da Valve. Muitos bugs de retomada documentados no GitHub do SteamOS foram corrigidos por atualizações pontuais — antes de desmontar o aparelho ou reinstalar o sistema, confirme que você está na versão mais recente.

## Resumo

- Reproduza o problema com `systemctl suspend` e leia `journalctl -u systemd-suspend` antes de qualquer correção.
- Se o log termina em `Suspending system...` sem `System resumed.`, o kernel não voltou; se ambos existem, o problema está na sessão gráfica.
- Tela preta costuma ser falha do `amdgpu` ou do backlight na retomada; logs com `-p 3` revelam o driver culpado.
- Wi-Fi morto pós-retomada costuma se resolver com `rfkill block/unblock` ou recarga do módulo.
- Sistema que não dorme ou acorda sozinho: investigue `systemd-inhibit --list` e `/proc/acpi/wakeup`.

## Exercícios

1. Rode `systemctl suspend`, acorde, e registre as últimas 30 linhas de `journalctl -u systemd-suspend -b -0`. Verifique se `Suspending system...` e `System resumed.` estão presentes.
2. Force uma falha de Wi-Fi controlada: suspenda, e ao acordar rode `ip link show wlan0`. Se `state DOWN`, recupere com `rfkill block wlan` e `rfkill unblock wlan`.
3. Verifique inibidores ativos com `systemd-inhibit --list` imediatamente após uma tentativa de suspensão que "não pegou". Identifique quem segura o `block`.
4. Liste as fontes de wakeup habilitadas com `cat /proc/acpi/wakeup | grep -i enabled` e teste desabilitar uma fonte USB para eliminar wakeups espúrios.
5. **Desafio.** Reproduza o problema mais comum do seu Deck (ou simule um: suspenda durante um jogo 3D pesado) e produza um relatório de diagnóstico completo usando `journalctl -b -0 -p 3`, `systemd-inhibit --list` e `cat /proc/acpi/wakeup`. Aponte, com base nas evidências, a camada mais provável da falha: kernel, driver, compositor ou aplicação.