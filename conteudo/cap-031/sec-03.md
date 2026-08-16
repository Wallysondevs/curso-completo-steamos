Depois do acesso a arquivos, as permissões mais decisivas de um Flatpak são os **sockets** — os soquetes que ligam o app ao mundo fora da caixa. Rede, som, sessão gráfica e o barramento D-Bus são todos representados como soquetes no modelo de permissões do Flatpak. Aqui a coisa fica menos óbvia, porque o nome técnico (`network`, `wayland`, `pulseaudio`, `system-bus`) esconde consequências reais de privacidade e isolamento.

No SteamOS, onde o sistema usa Wayland por padrão e uma sessão D-Bus movimentada, entender esses quatro tipos de socket é a diferença entre um app isolado de verdade e um app que só *parece* isolado.

:::objetivos
- Mapear os soquetes que um Flatpak pode pedir: `network`, `wayland`, `x11`, `pulseaudio`, `system-bus`, `session-bus`
- Entender quando negar o acesso de rede é seguro e quando quebra o app
- Explicar o papel do D-Bus e por que o `system-bus` é particularmente sensível
- Auditar sockets com `flatpak override --show` e no Flatseal
:::

## Sockets são portas de saída

Um soquete no Flatpak funciona como uma tomada entre o sandbox e o host. Sem ele, o processo lá dentro não tem como alcançar o recurso correspondente. Com ele, o recurso fica disponível — e, importante, isso vale nos dois sentidos (o app alcança o serviço, e o serviço pode, em certa medida, alcançar o app).

Os soquetes mais comuns:

| Socket | Recurso que expõe |
|---|---|
| `network` | Acesso à rede (internet e local) |
| `wayland` | Servidor gráfico Wayland |
| `x11` | Servidor gráfico X11 (Xorg/XWayland) |
| `fallback-x11` | X11 via XWayland quando Wayland não está disponível |
| `pulseaudio` | Servidor de som PulseAudio/PipeWire |
| `session-bus` | D-Bus da sessão do usuário |
| `system-bus` | D-Bus do sistema (poucos apps deveriam pedir) |
| `ssh-auth` | Agente SSH do usuário |

A leitura no `flatpak override --show` é direta:

```terminal
$ flatpak override --show org.mozilla.firefox | grep sockets
sockets=x11;wayland;network;pulseaudio;
```

O Firefox pede `x11` e `wayland` (cobre os dois servidores gráficos), `network` (navegador sem rede não existe) e `pulseaudio` (som). Nenhum D-Bus aí — é um conjunto razoável para um navegador.

## Rede: quando negar e quando ceder

O socket `network` é binário: ou o app fala com a rede, ou não fala nada. Não há granularidade "só local, não internet" no modelo básico (para isso existe o **Portal** de rede, que veremos na seção sobre o Portal XDG).

Negar rede é a forma mais barata de matar a telemetria, o rastreamento e o upload involuntário de um app que não deveria falar com ninguém — um editor offline, um visualizador de fotos, um utilitário de notas. Se o app funciona perfeitamente sem internet, não há por que dar o socket `network`.

Mas a negativa tem um efeito colateral que muita gente descobre na prática:

```terminal
$ flatpak override --user --nosocket=network org.example.OfflineEditor
$ flatpak run org.example.OfflineEditor
```

O app simplesmente não abre a conexão. Para a maioria dos apps offline, isso é inócuo. Para um que carrega fontes, ícones ou faz checagem de atualização, pode aparecer um erro de rede no console. A regra: negue, teste, e só reative se algo de fato depender de rede.

:::dica
Antes de negar `network`, use `flatpak override --show` para ver se o app já é offline por padrão. Alguns pacotes já vêm sem `network` — nesse caso você não precisa fazer nada, e tentar forçar pode não ter efeito visível.
:::

## D-Bus: o barramento que liga tudo

O D-Bus é o sistema de mensagens entre processos do Linux de mesa. Aplicativos conversam entre si e com o sistema através dele: notificações, compartilhamento de tela, abrir arquivo com outro app, status da bateria. Existem dois barramentos:

- **session-bus** — o barramento da sua sessão gráfica, onde apps de usuário trocam mensagens.
- **system-bus** — o barramento dos serviços de sistema, onde moram coisas como gerenciamento de energia, rede e PolicyKit (o que pede sua senha/política de privilégio).

O `session-bus` é relativamente comum e necessário para muitos apps de desktop. O `system-bus` é o perigoso: através dele um app pode tentar acionar serviços privilegiados do sistema. É raro um app de usuário **precisar** dele — e quando o pedido aparece, merece escrutínio.

```terminal
$ flatpak override --show org.gnome.Software | grep -Ei 'bus|socket'
sockets=x11;wayland;system-bus;session-bus;
```

Aqui o GNOME Software (a loja) pede os dois barramentos. Faz sentido: ele precisa falar com serviços de sistema para instalar pacotes e gerenciar repositórios. Um editor de texto pedindo `system-bus` seria um sinal de alerta.

:::atencao
Não confunda `session-bus` com `system-bus`. O segundo é muito mais sensível. Se um app que não deveria mexer no sistema pede `system-bus`, trate como suspeito até provar o contrário — e considere negá-lo com `flatpak override --user --nosocket=system-bus <id>` para ver se o app continua funcionando.
:::

## Som e SSH: os soquetes esquecidos

Dois soquetes costumam passar despercebido porque ninguém pensa neles como risco. O `pulseaudio` (que no SteamOS, com PipeWire, é exposto como interface Pulse) dá ao app acesso ao seu áudio — e, por extensão, o serve de gravação, já que a mesma tomada serve para tocar e capturar. Um app com `pulseaudio` pode, em tese, capturar o microfone se o sistema permitir.

O `ssh-auth` é ainda mais delicado: expõe o **agente SSH** do usuário dentro do sandbox. Isso significa que o app pode usar suas chaves SSH carregadas para autenticar em servidores remotos sem re-digitá-las. Nenhum app de usuário comum precisa disso a ponto de valer o risco.

Auditar os dois é rápido:

```terminal
$ flatpak override --show org.gnome.Console | grep -Ei 'pulse|ssh'
sockets=x11;wayland;pulseaudio;
```

O terminal pede `pulseaudio` (para o sino/beep) mas, felizmente, não pede `ssh-auth`. Se você encontrar um app com `ssh-auth`, negue imediatamente e observe se ele ainda funciona — a vasta maioria não precisa.

## Resumo

- Sockets são as tomadas entre o sandbox e o host; cada um expõe um recurso externo.
- `network` é binário; negar matar telemetria e upload, mas pode quebrar apps que dependem de conexão.
- `session-bus` liga o app ao D-Bus da sessão; `system-bus` liga a serviços privilegiados do sistema e é muito mais sensível.
- `pulseaudio` dá acesso a reprodução e captura de áudio; `ssh-auth` expõe o agente SSH com suas chaves.
- `flatpak override --user --nosocket=<socket> <id>` nega um socket; verifique com `--show`.
- O Flatseal agrupa todos esses controles na seção "Sockets", com toggle por recurso.

## Exercícios

1. Rode `flatpak override --show <id>` para cinco apps e monte uma tabela: quais pedem `network`, `x11`, `wayland`, `system-bus`.
2. Identifique todos os apps com `system-bus` na sua lista. Para cada um, explique (ou pesquise) por que ele precisaria de acesso ao barramento do sistema.
3. Negue `network` de um app offline com `flatpak override --user --nosocket=network <id>` e abra o app. Ele funcionou normalmente?
4. Procure apps com `ssh-auth` ou `pulseaudio`. Decida se cada um justifica o acesso e, se não, registre o comando exato que você usaria para remover.
5. **Desafio.** Compare a seção "Sockets" do Flatseal com a saída de `flatpak override --show` para o mesmo app. Marque cada socket como "ligado", "desligado" ou "herdado" e explique a diferença de estado para o `wayland` versus o `x11`.
