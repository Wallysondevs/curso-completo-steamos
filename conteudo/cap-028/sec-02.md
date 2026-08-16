A palavra "sandbox" é usada com frequência quando se fala de Flatpak, mas raramente se explica o que de fato acontece por baixo. Nesta seção você vai ver que a sandbox não é um recurso inventado pelo Flatpak: ela é uma montagem cuidadosa de três mecanismos do kernel Linux — *namespaces*, *cgroups* e controle de acesso a arquivos. Compreender esses três pilares transforma a sandbox de um conceito vago em algo que você consegue inspecionar com comandos.

:::objetivos
- Entender o papel dos *namespaces* no isolamento de processos
- Inspecionar a sandbox de um aplicativo Flatpak em execução
- Ler e interpretar as permissões declaradas por um aplicativo
- Distinguir as portas de entrada e saída de uma sandbox (`--socket`, `--filesystem`, `--device`)
- Reconhecer os limites do modelo de segurança

:::

## De onde vem o isolamento

Quando você roda um programa comum no terminal, ele entra no mesmo mundo que você: vê os mesmos processos com `ps`, lê os mesmos arquivos, abre a mesma conexão de rede. Para isolar um aplicativo, o kernel oferece a capacidade de criar "cópias" dessas visões — é isso que são os *namespaces*.

Um *namespace* é uma visão particular de um recurso do sistema. Existe um *namespace* de PID (a lista de processos), um de *mount* (a árvore de arquivos montados), um de rede, um de usuário, e por aí vai. Quando um processo é colocado num *namespace* novo, ele passa a enxergar apenas o que foi colocado ali dentro — não o mundo completo do host.

```terminal
$ flatpak run --command=sh org.mozilla.firefox
[📦 org.mozilla.firefox ~]$ ps aux
USER         PID %CPU %MEM    VSZ   RSS TTY      STAT START   TIME COMMAND
ada        1  0.0  0.0   3572  5120 ?        Ss   10:00   0:00 sh
ada       24  0.0  0.0   7744  4544 ?        R+   10:01   0:00 ps aux
```

Repare no PID: dentro da sandbox, o shell é o processo número **1**, e o `ps` é o 24. Do lado de fora, esses mesmos processos têm PIDs completamente diferentes (na casa dos milhares). Isso é o *namespace* de PID em ação: o aplicativo acredita que é o dono da máquina e que apenas dois processos existem. Ele não consegue ver — e portanto não consegue sinalizar ou inspecionar — os processos do seu desktop ou de outros aplicativos.

O mesmo raciocínio vale para o *namespace* de *mount*: dentro da sandbox, a árvore de arquivos é reconstruída do zero. O `/usr` que o aplicativo enxerga na verdade é uma combinação do runtime mais o aplicativo, não o `/usr` real do SteamOS.

## Os cgroups controlam recursos

Se *namespaces* controlam o que o aplicativo *vê*, os **cgroups** (control groups) controlam o que ele *usa*. Um cgroup é um grupo de processos ao qual o kernel impõe limites de CPU, memória, I/O de disco e outros recursos.

No Flatpak, cada aplicativo em execução é colocado num cgroup próprio. Isso significa que um aplicativo que entre num loop infinito ou vaze memória é contido — ele não consegue travar o resto do sistema consumindo toda a RAM, por exemplo. O cgroup age como uma parede de recursos, independente da parede de visibilidade dos *namespaces*.

```terminal
$ cat /proc/1234/cgroup
0::/user.slice/user-1000.slice/session.scope/app-org.mozilla.firefox-138338.scope
```

O caminho em `/proc/PID/cgroup` mostra a hierarquia do cgroup à qual o processo pertence. O trecho `app-org.mozilla.firefox-138338.scope` revela que o kernel criou um escopo dedicado para aquele aplicativo Flatpak. Tudo que esse aplicativo rodar — e seus eventuais processos filhos — fica preso dentro desse escopo.

Na prática, a combinação *namespaces* + *cgroups* é o que dá à sandbox do Flatpak a sua dupla natureza: o aplicativo não *vê* o resto do sistema, e não pode *sugar* os recursos do resto do sistema ao mesmo tempo.

## Lendo as permissões declaradas

A sandbox não deixa o aplicativo completamente surdo e mudo — muitos aplicativos precisam de som, de rede, de acesso a uma pasta específica. Essas necessidades são declaradas nos **metadados** do aplicativo, e você pode lê-las sem abrir o aplicativo.

```terminal
$ flatpak info --show-permissions org.mozilla.firefox
[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;
devices=dri;
filesystems=xdg-download;xdg-documents;xdg-pictures;

[Session Bus Policy]
org.freedesktop.FileManager1=talk
```

A saída é dividida em seções. `sockets` lista os "encanamentos" que o aplicativo pode abrir: `wayland` e `x11` são os servidores gráficos (sem eles, não há janela), `pulseaudio` é o som. `devices=dri` dá acesso direto à GPU para renderização acelerada. `filesystems` lista as pastas fora da sandbox que o aplicativo pode acessar — no caso, apenas as pastas padrão de Downloads, Documentos e Imagens.

O que não está listado aqui é, por definição, proibido. O Firefox não pode, por padrão, ler seu `~/.ssh` ou suas outras pastas — apenas as três liberadas. Esse princípio de "tudo negado, exceto o que é concedido" é o coração do modelo de segurança.

:::nota
As permissões com `xdg-` (como `xdg-download`) são os diretórios padronizados do freedesktop: Downloads, Documentos, Imagens, Música, Vídeos. Eles existem para que o aplicativo consiga operar de forma previsível sem que você precise liberar o `/home` inteiro.
:::

## Portas de entrada e saída

Pense na sandbox como uma sala com algumas portas. Cada porta tem nome e pode ser aberta ou fechada. As principais portas que você vai ver ao mexer com Flatpak são:

| Porta | O que controla |
|---|---|
| `--socket=wayland` | Acesso ao servidor gráfico Wayland (janelas) |
| `--socket=x11` | Acesso ao servidor X11 legado (janelas) |
| `--socket=pulseaudio` | Acesso ao som |
| `--socket=network` | Acesso à rede |
| `--device=dri` | Acesso direto à GPU |
| `--filesystem=home` | Acesso à sua pasta pessoal inteira |

Você pode ajustar essas portas na hora de rodar, sem alterar o aplicativo de forma permanente. Por exemplo, para rodar um aplicativo com acesso a uma pasta que ele normalmente não enxerga:

```terminal
$ flatpak run --filesystem=/home/ana/projetos org.mozilla.firefox
```

Aqui o Firefox é iniciado com acesso extra à pasta `~/projetos`. Isso é útil para casos pontuais — abrir um arquivo local sem liberar o `/home` inteiro permanentemente. O contrário também vale: `flatpak override` muda as permissões de forma persistente, e o Flatseal, um aplicativo popular, oferece essa interface gráfica.

:::dica
Antes de liberar qualquer permissão, pergunte-se se o aplicativo *precisa* dela. Cada porta aberta amplia a superfície de ataque. Um editor de texto não precisa de `--socket=network`; um navegador, por outro lado, não funciona sem rede. Libere o mínimo necessário para a tarefa.
:::

## Os limites da sandbox

Seria injusto vender a sandbox como uma fortaleza impenetrável. Ela é uma camada de contenção excellent para reduzir riscos, mas tem limites conhecidos. O mais importante é que a sandbox isola contra *erros e acessos não autorizados de aplicativos*, não contra código especialmente escrito para escapar de *namespaces*. Vulgaridades de escape de container existem e, de tempos em tempos, aparecem no noticiário de segurança.

Outro ponto: a sandbox protege o *sistema* do aplicativo, não necessariamente o *usuário* de si mesmo. Se um aplicativo tem `--filesystem=home`, um bug nele pode apagar seus arquivos pessoais — a sandbox não impede isso, porque você autorizou o acesso.

```terminal
$ flatpak info --show-permissions org.mozilla.firefox | grep filesystems
filesystems=xdg-download;xdg-documents;xdg-pictures;
```

Compare com um aplicativo que pede acesso total:

```terminal
$ flatpak info --show-permissions net.poedit.Poedit | grep filesystems
filesystems=host;
```

O `filesystems=host` no Poedit é a forma de dizer "acesso a todo o sistema de arquivos do host". É uma porta escancarada — o aplicativo vê tudo. Isso não torna o Poedit malicioso; muitas vezes é a única forma de um aplicativo de tradução funcionar, já que ele abre arquivos de projetos espalhados pelo disco. Mas deixa claro que a sandbox é *tão forte quanto as permissões que você concede*.

## Resumo

- *Namespaces* criam visões isoladas de processos, arquivos e rede para cada aplicativo.
- *cgroups* limitam os recursos (CPU, memória) que um aplicativo pode consumir.
- `flatpak info --show-permissions` lista exatamente o que cada aplicativo pode acessar.
- Permissões são concedidas por "portas": `--socket`, `--filesystem`, `--device`.
- A sandbox contém erros e acessos indevidos, mas não é uma muralha absoluta contra escapes.

## Exercícios

1. Liste as permissões do seu navegador com `flatpak info --show-permissions org.mozilla.firefox` e traduza, em linguagem simples, cada linha da seção `[Context]`.
2. Abra um shell dentro da sandbox com `flatpak run --command=sh org.mozilla.firefox` e rode `ps aux` e `ls /`. Compare o que você vê com o que vê fora (`ps aux` no terminal normal). Que diferenças confirmam o *namespace* de PID?
3. Rode um aplicativo Flatpak e localize seu PID com `flatpak ps`. Depois inspecione `cat /proc/PID/cgroup` e identifique o trecho que corresponde ao aplicativo.
4. Teste o bloqueio padrão: tente `flatpak run --command=sh` e, de dentro, `cat /home/ana/.ssh/id_rsa`. O que acontece? Depois repita com `flatpak run --filesystem=home --command=sh` e compare.
5. **Desafio.** Use `flatpak override --user --show org.gnome.Calculator` para ver se há permissões personalizadas aplicadas. Pesquise o que `--nofilesystem` faz e proponha um comando que revogue o acesso à rede de um aplicativo específico.
