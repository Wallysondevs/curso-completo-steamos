O sandbox do Flatpak é o que torna o modelo seguro: cada app declara (ou pede em runtime) apenas os acessos de que precisa. Mas declarações e necessidades mudam, e às vezes você quer conceder uma permissão extra a um app sem editar o pacote, ou negar um acesso que ele pede por padrão. É para isso que existe o `flatpak override` — uma camada de configuração por aplicativo que fica *fora* do pacote, no seu controle.

:::objetivos
- Entender como o `override` modifica permissões sem tocar no pacote
- Conceder acesso a caminhos do disco com `--filesystem`
- Aplicar overrides por usuário (`--user`) e por sistema
- Listar e remover overrides ativos
- Diferenciar override de `--show-permissions`

:::
## O override fica por cima do metadata

Quando um Flatpak é instalado, ele traz um arquivo de metadata declarando as permissões base. O `override` cria um arquivo separado — em `~/.local/share/flatpak/overrides/<ID>` para overrides de usuário — que o Flatpak lê por cima do metadata original. O pacote permanece intocado: uma atualização do app não apaga seu override, e você pode reverter tudo a qualquer momento.

O caso mais comum no Steam Deck é dar acesso a uma pasta que o app não enxerga por padrão. Por exemplo, deixar o GIMP ler a sua home inteira:

```terminal
$ flatpak override --user --filesystem=home org.gimp.GIMP
$ flatpak info --show-permissions org.gimp.GIMP | head -3
[Context]
shared=network;ipc;
sockets=x11;wayland;
```

O `--filesystem=home` libera `~/` para o app. Outros valores comuns: `--filesystem=~/Downloads`, `--filesystem=~/Videos`, `--filesystem=host` (o sistema inteiro, raramente desejável) e `--filesystem=~/.var/app/outro.app` (acesso aos dados de outro app).

:::nota
O `--filesystem=home` é um canivete largo: o app passa a ler e escrever em toda a sua pasta pessoal, incluindo documentos e chaves SSH. Prefira o caminho mais granular sempre que possível (`--filesystem=~/Downloads` em vez de `home`). O mesmo vale para `host`, que praticamente anula o sandbox.
:::

## Concedendo, negando e removendo

O `override` não apenas acrescenta — ele também pode *negar* permissões e *remover* configurações anteriores. As três operações compartilham a mesma sintaxe de flags:

```terminal
$ flatpak override --user --filesystem=~/Downloads org.gimp.GIMP
$ flatpak override --user --nofilesystem=~/Downloads org.gimp.GIMP
$ flatpak override --user --reset org.gimp.GIMP
```

O primeiro concede, o segundo nega (revoga um acesso específico), o terceiro apaga **todos** os overrides daquele app, devolvendo-o ao estado original do pacote. O `--reset` é a saída de emergência quando você não lembra o que mexeu.

Além de filesystem, dá para ajustar outras classes: `--socket=wayland`/`--nosocket=x11` (protocolos de janela), `--device=dri` (GPU), `--share=network` (rede), e `--env=VAR=valor` (variáveis de ambiente).

```terminal
$ flatpak override --user --env=GDK_SCALE=1.5 org.mozilla.firefox
```

Aqui um app com fontes pequenas numa tela de alta densidade ganha escala de 1.5× via variável de ambiente, sem abrir o pacote nem tocar no sistema.

## User versus system de novo

Assim como `install`, `list` e `remove`, o override respeita `--user` e `--system`, e a escolha muda onde a configuração fica:

| Flag | Arquivo de override | Prioridade |
|---|---|---|
| `--user` | `~/.local/share/flatpak/overrides/<ID>` | vence |
| `--system` | `/var/lib/flatpak/overrides/<ID>` (com sudo) | base |

Se o mesmo app tiver override nos dois níveis, o de usuário prevalece. Isso permite um fluxo comum: o admin configura um padrão seguro a nível de sistema, e cada usuário ajusta por cima sem permissão de root.

:::atencao
Override de sistema exige `sudo`, e o `--system` é o padrão quando você não passa nenhuma flag. Quem digita `flatpak override --filesystem=home org.gimp.GIMP` sem o `--user` vai esbarrar em um erro de permissão ou, pior, aplicar uma mudança global sem querer. Acostume-se a escrever o `--user` explicitamente.
:::

## Auditando o que você mudou

Para ver os overrides ativos de um app:

```terminal
$ flatpak override --show org.gimp.GIMP
[Context]
filesystems=home;

[Environment]
GDK_SCALE=1.5;
```

Isso mostra apenas o que veio dos arquivos de override — a diferença entre este comando e o `flatpak info --show-permissions`, que mostra o metadata *efetivo* (original + override). Os dois juntos contam a história completa: o que o pacote pediu e o que você ajustou por cima.

:::dica
Se um app começar a se comportar de forma estranha depois de você mexer em permissões, rode `flatpak override --user --reset <ID>` e reinicie o app. Em 90% dos casos o comportamento volta ao normal, confirmando que o override era o culpado.
:::

## Overrides não são globais

Uma tentação comum é querer "liberar a home para todos os apps de uma vez". O `override` por padrão age sobre um único ID; ele não tem uma flag direta de "aplicar isso a tudo". Isso é proposital: um override global é um risco de segurança grande, porque anula o sandbox de todos os apps de uma só tacada.

Se você realmente precisa do mesmo ajuste em vários apps, o caminho honesto é um loop no shell:

```terminal
$ for app in org.gimp.GIMP org.inkscape.Inkscape; do
>   flatpak override --user --filesystem=~/Imagens "$app"
> done
```

Cada app recebe o override individualmente, e você mantém controle fino de quem acessa o quê. A alternativa "rápida" de editar o arquivo de override do system à mão existe, mas foge do que o CLI oferece de forma estável e pode ser sobrescrita em atualizações do próprio Flatpak.

:::exemplo
Cenário real no Steam Deck: você quer que o GIMP e o Inkscape, usados para editar screenshots que o Steam salva em `~/Pictures`, consigam abrir essas imagens. Em vez de liberar `--filesystem=home` para os dois, você aplica `--filesystem=~/Pictures` em cada um. Os dois apps ganham exatamente o que precisam, e nada mais.
:::

## Resumo

- `flatpak override` cria uma camada de permissões por app, fora do pacote, que sobrevive a atualizações.
- `--filesystem=home` libera a pasta pessoal; caminhos granulares (como `~/Downloads`) são mais seguros.
- `--nofilesystem=...` nega um acesso, e `--reset` apaga todos os overrides de um app.
- Overrides `--user` vencem `--system`; sem flag, o `--system` (com sudo) é o padrão.
- `flatpak override --show <ID>` lista só os overrides; `info --show-permissions` mostra o metadata efetivo.

## Exercícios

1. Conceda ao GIMP acesso à sua pasta Downloads: `flatpak override --user --filesystem=~/Downloads org.gimp.GIMP` e confirme com `flatpak override --show`.
2. Negue a permissão recém-concedida com `--nofilesystem=~/Downloads` e verifique que ela sumiu do `override --show`.
3. Defina uma variável de ambiente em um app (ex.: `GLIBC_TUNABLES=glibc.malloc.tcache_count=0` num jogo) via `--env=`, depois remova com `--reset`.
4. Compare `flatpak override --show <ID>` com `flatpak info --show-permissions <ID>` e explique em prosa o que cada um revela.
5. **Desafio.** Sem consultar a documentação, descubra — experimentando com `override --help` — como negar o acesso à rede de um app (`--nosocket` ou `--unshare=network`?) e aplique num app de teste. Depois verifique com `flatpak info --show-permissions` se a negação apareceu no bloco de contexto.