A seção `[Environment]` dos metadados do Flatpak é discreta: duas ou três variáveis que parecem inofensivas. Mas variáveis de ambiente dentro de um sandbox são como chaves mestras: elas decidem onde o app procura configuração, qual backend de renderização usa, para onde manda logs e, em casos extremos, quais bibliotecas carrega. Nenhuma outra permissão tem tanto alcance com tão poucas linhas quanto as `env` vars.

No SteamOS, onde o sistema e o usuário compartilham o mesmo hardware gráfico e a mesma sessão de som, uma variável maliciosa pode abrir portas que os soquetes e o filesystem não conseguiriam sozinhos.

:::objetivos
- Ler e interpretar a seção `[Environment]` dos metadados Flatpak
- Identificar variáveis que afetam renderização, caminhos de busca e bibliotecas
- Adicionar, modificar e remover variáveis com `flatpak override --env` e `--unset-env`
- Auditar o impacto de cada variável no comportamento do sandbox
:::

## Onde as env vars aparecem

As variáveis de ambiente são declaradas no bloco `[Environment]` dos metadados do pacote e aparecem na saída completa do `flatpak override --show`. Exemplo:

```terminal
$ flatpak override --show org.gnome.Evince
[Context]
filesystems=home;
sockets=x11;wayland;

[Environment]
DCONF_USER_CONFIG_DIR=.config/dconf
GSETTINGS_BACKEND=keyfile
```

A segunda seção define duas variáveis: `DCONF_USER_CONFIG_DIR` (redireciona onde o dconf guarda configurações) e `GSETTINGS_BACKEND` (força o backend de configuração do GLib para arquivo, não D-Bus). Elas são injetadas no sandbox antes do app iniciar.

No Flatseal, as env vars ficam na seção **Environment** (a última do painel). Clica-se em "Add variable" para adicionar, e cada linha tem nome e valor editáveis. O toggle ao lado de cada variável permite desligá-la (equivalente a `--unset-env`).

## Por que variáveis de ambiente são perigosas

Uma env var pode alterar dramaticamente como um programa se comporta. Considere:

- `LD_PRELOAD` — injeta uma biblioteca compartilhada antes de qualquer outra. É o caminho clássico de hooking, usado tanto para depuração quanto para malware.
- `LD_LIBRARY_PATH` — altera onde o linker dinâmico procura bibliotecas. Um app poderia carregar `.so` de um local inesperado.
- `QT_QPA_PLATFORM` — força o backend gráfico do Qt (`wayland`, `xcb`, `offscreen`). Um valor malicioso poderia desabilitar a renderização ou forçar X11.
- `DISPLAY` — define qual servidor X usar. Um app com X11 poderia apontar para um servidor remoto.
- `DBUS_SESSION_BUS_ADDRESS` — define o endereço do D-Bus. Redirecionar isso poderia interceptar mensagens.

Nenhuma dessas variáveis deveria ser sobrescrita por um Flatpak sem um motivo claro. O problema é que o formato permite: qualquer mantenedor pode declarar qualquer variável.

```terminal
$ flatpak info -m org.some.App | grep -A5 '\[Environment\]'
[Environment]
LD_PRELOAD=/app/lib/libinject.so
```

Se você vê `LD_PRELOAD` ou `LD_LIBRARY_PATH` nos metadados, investigue imediatamente. Essas variáveis têm poder de modificar o comportamento do processo em nível de linker.

## Adicionando, modificando e removendo variáveis

O `flatpak override` tem duas flags para env vars: `--env=NOME=VALOR` (adiciona ou modifica) e `--unset-env=NOME` (remove). Exemplo prático — forçar um app Qt a usar Wayland puro:

```terminal
$ flatpak override --user --env=QT_QPA_PLATFORM=wayland org.example.QtApp
$ flatpak override --show org.example.QtApp | grep -A3 Environment
[Environment]
QT_QPA_PLATFORM=wayland
```

Para remover uma variável que o pacote declara:

```terminal
$ flatpak override --user --unset-env=DCONF_USER_CONFIG_DIR org.gnome.Evince
$ flatpak override --show org.gnome.Evince | grep -A3 Environment
[Environment]
DCONF_USER_CONFIG_DIR=
```

A variável aparece com valor vazio — foi "desligada" pelo override, mas a entrada ainda consta. É assim que o Flatseal exibe o toggle como desligado: a variável existe nos metadados, mas está negada.

:::dica
Use `flatpak override --user --unset-env=VARIAVEL <id>` para variáveis que o pacote herdou mas que você não quer. Para variáveis que você **adicionou** e depois quer sumir de vez, `flatpak override --user --reset <id>` limpa todos os seus overrides — isso inclui env vars, filesystem e sockets. Quer granularidade? Remova uma a uma.
:::

## Variáveis de ambiente legítimas

Nem toda env var é suspeita. Muitas são necessárias para o funcionamento correto do app dentro do sandbox:

- `GIO_MODULE_DIR` — onde o GLib encontra módulos de I/O (necessário para portais).
- `GST_PLUGIN_SYSTEM_PATH` — onde o GStreamer procura plugins (áudio/vídeo).
- `PYTHONPATH` — onde o Python busca módulos.
- `GI_TYPELIB_PATH` — onde o GObject Introspection acha definições de tipo.

Essas variáveis são definidas pelo Flatpak runtime ou pelo próprio app, e mexer nelas sem saber o que está fazendo costuma quebrar o funcionamento. A regra: se a variável aponta para dentro de `/app/` ou `/usr/` (caminhos do sandbox), é provavelmente de infraestrutura e deve ser deixada em paz.

## O fluxo do Flatseal para variáveis

Na seção Environment do Flatseal:

1. Leia as variáveis herdadas (toggle no estado "herdado").
2. Identifique qualquer variável que aponte para fora do sandbox ou que mexa no comportamento do linker.
3. Se necessário, desligue com o toggle.
4. Se você precisar injetar uma variável própria (ex.: `QT_QPA_PLATFORM=wayland` para forçar Wayland), clique em "Add variable" e preencha nome e valor.

Uma variável adicionada por você aparece com toggle "ligado". Uma variável herdada que você desligou aparece com toggle "desligado". O Flatseal grava cada ação como `--env` ou `--unset-env` correspondente.

## Resumo

- A seção `[Environment]` injeta variáveis de ambiente dentro do sandbox antes da execução do app.
- `LD_PRELOAD` e `LD_LIBRARY_PATH` são as mais perigosas — alteram o comportamento do linker.
- Variáveis como `QT_QPA_PLATFORM`, `DISPLAY`, `DBUS_SESSION_BUS_ADDRESS` afetam renderização e comunicação.
- `flatpak override --env=NOME=VALOR` adiciona ou modifica; `--unset-env=NOME` remove.
- O Flatseal exibe cada variável com toggle e permite adicionar novas.
- Variáveis que apontam para `/app/` ou `/usr/` dentro do sandbox são geralmente de infraestrutura e devem ser preservadas.

## Exercícios

1. Rode `flatpak override --show <id>` para três apps e extraia a seção `[Environment]` de cada um.
2. Adicione `QT_QPA_PLATFORM=wayland` a um app Qt com `flatpak override --user --env=QT_QPA_PLATFORM=wayland <id>` e confirme com `--show`.
3. Remova uma variável herdada com `--unset-env` e verifique que ela aparece com valor vazio na saída.
4. No Flatseal, vá em Environment de um app e compare o que você vê com a saída do `flatpk override --show`. Cada variável bate?
5. **Desafio.** Pesquise o que a variável `LD_PRELOAD` faz em nível de linker dinâmico. Depois, rode `flatpak override --show` em todos os seus Flatpaks e verifique se algum declara `LD_PRELOAD`. Se encontrar, investigue por que aquele app precisa dela.