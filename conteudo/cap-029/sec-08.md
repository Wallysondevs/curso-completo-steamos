Um dos grandes atrativos do Flatpak é o sandbox: cada aplicativo roda isolado do sistema, com permissões explícitas sobre o que pode acessar. Isso é ótimo para segurança, mas gera atritos na prática — um navegador que não consegue salvar um download, um editor que não acessa o cartão microSD, um cliente de torrent que não enxerga o disco externo. Saber diagnosticar e ajustar permissões é o que separa o usuário que desiste do Flatpak do que o domina.

O Discover mostra um resumo das permissões na página de detalhes, mas o controle fino acontece no terminal, com o comando `flatpak override`. Esta seção conecta os dois mundos.

:::objetivos
- Ler as permissões de um Flatpak no Discover e no terminal
- Entender o modelo de portais e pedidos de acesso em tempo de execução
- Ajustar permissões com `flatpak override` e `flatpak info --show-permissions`
- Diagnosticar erros comuns de sandbox (acesso a arquivos, rede, dispositivos)
:::

## O modelo de permissões Flatpak

Cada aplicativo Flatpak declara, em seus metadados, quais recursos do sistema ele deseja acessar. Essas declarações são lidas na instalação e usadas para montar o sandbox. O `bubblewrap` (ou `bwrap`) cria um ambiente isolado com namespaces de kernel: o aplicativo vê um sistema de arquivos próprio, uma rede possivelmente restrita e apenas os dispositivos que lhe foram concedidos.

As permissões são expressas em pares de chave/valor no arquivo `metadata` do Flatpak. Exemplos comuns:

| Permissão | O que concede |
|---|---|
| `--share=network` | Acesso à rede |
| `--socket=x11` | Acesso ao servidor gráfico X11 |
| `--socket=wayland` | Acesso ao compositor Wayland |
| `--socket=pulseaudio` | Acesso ao áudio (PulseAudio) |
| `--device=dri` | Acesso direto à GPU (renderização) |
| `--filesystem=home` | Acesso a todo o `$HOME` |
| `--filesystem=host` | Acesso a todo o sistema de arquivos |
| `--filesystem=~/Downloads` | Acesso só à pasta Downloads |
| `--talk-name=org.freedesktop.portal.*` | Uso dos portais (diálogos nativos) |

A lógica ideal é o **princípio do menor privilégio**: o aplicativo declara o mínimo necessário. O Firefox, por exemplo, não pede `--filesystem=host`; em vez disso, usa o **portal de arquivos** para que você escolha, num diálogo nativo, qual arquivo ou pasta permitir. Isso é muito mais restritivo — e mais seguro — do que dar acesso total.

## Lendo permissões

No Discover, a página de detalhes de um aplicativo instalado tem uma seção "Permissões" que exibe, em linguagem natural, as principais concessões: "Acesso à rede", "Acesso ao sistema de arquivos", "Acesso a dispositivos".

No terminal, a visão completa:

```terminal
$ flatpak info --show-permissions org.mozilla.firefox

[Context]
shared=network;ipc;
sockets=x11;wayland;pulseaudio;
devices=dri;
filesystems=~/Downloads;
persistent=.mozilla;

[Session Bus Policy]
org.mozilla.firefox.talk=org.freedesktop.portal.*
org.mozilla.firefox.own=org.mozilla.firefox.*

[System Bus Policy]
org.mozilla.firefox.talk=org.freedesktop.NetworkManager
```

A seção `[Context]` lista as permissões estáticas; as seções `[Session Bus Policy]` e `[System Bus Policy]` listam os nomes D-Bus que o aplicativo pode acessar. Os `org.freedesktop.portal.*` são os portais — a ponte segura para diálogos de abrir/salvar arquivo, captura de tela e impressão.

:::info
Os portais (`xdg-desktop-portal`) são a resposta do ecossistema Linux ao problema do sandbox: em vez de dar acesso total ao sistema de arquivos, o aplicativo pede a um serviço intermediário confiável que exiba o diálogo nativo de seleção de arquivo e devolva apenas o arquivo escolhido. É assim que um Flatpak restrito consegue abrir e salvar arquivos de forma segura.
:::

## Ajustando permissões com flatpak override

Quando um aplicativo não consegue fazer algo — salvar em determinada pasta, acessar um disco externo — a causa quase sempre é uma permissão ausente. O `flatpak override` ajusta permissões por aplicativo, sem alterar o pacote original.

Exemplo: você quer que um editor acesse a pasta Downloads e um disco montado em `/run/media/deck/meudisco`:

```terminal
$ flatpak override --user --filesystem=~/Downloads --filesystem=/run/media/deck/meudisco org.kde.kdenlive
```

O `--user` aplica a sobrescrita apenas ao seu usuário (não ao escopo de sistema). Para ver as sobrescritas aplicadas:

```terminal
$ flatpak override --show org.kde.kdenlive
[Context]
filesystems=~/Downloads;/run/media/deck/meudisco;
```

E para reverter, remova tudo:

```terminal
$ flatpak override --reset org.kde.kdenlive
```

O `--reset` limpa todas as sobrescritas e volta às permissões declaradas pelo pacote.

:::perigo
Conceder `--filesystem=host` a um aplicativo desconhecido dá a ele acesso de leitura/escrita a todo o sistema de arquivos, derrubando a principal proteção do sandbox. Só faça isso para aplicativos em que você confia plenamente, e prefira sempre caminhos específicos (`~/Downloads`, `~/Documents`) em vez de `host`.
:::

## Diagnosticando erros comuns de sandbox

Os sintomas de permissão insuficiente costumam ser silenciosos ou pouco claros. Alguns padrões:

**"Não consigo salvar meu arquivo"** — o aplicativo abre mas, ao salvar, nada acontece ou mostra "permissão negada". Causa provável: falta `--filesystem` para a pasta de destino.

**"O aplicativo não vê meu cartão SD"** — aplicativos Flatpak só enxergam `/run/media/` se tiverem `--filesystem=/run/media` ou `--filesystem=host`. Por padrão, quase nenhum tem.

**"A webcam não funciona"** — falta `--device=all` ou o acesso via portal de captura não está configurado.

**Diagnóstico em tempo real:** rode o aplicativo pelo terminal para ver as mensagens de erro do sandbox:

```terminal
$ flatpak run org.kde.kdenlive
Gtk-Message: 14:22:31.123: Failed to load module "canberra-gtk-module"
error: Cannot open file "/run/media/deck/meudisco/projeto.kdenlive": Permission denied
```

A mensagem `Permission denied` num caminho fora do sandbox é o sinal clássico. Conceda a permissão e tente de novo.

:::dica
Para descobrir rapidamente o que um aplicativo está tentando acessar e sendo bloqueado, use o monitor do kernel: em um terminal, rode `sudo dmesg -w | grep -i denied` enquanto reproduz o problema no aplicativo. Muitos bloqueios de sandbox geram mensagens de denied no log do kernel (para operações que chegam a nível de syscall).
:::

## Permissões dinâmicas vs. estáticas

Há duas fontes de permissão em jogo, e isso confunde:

- **Permissões estáticas** — declaradas no `metadata` do pacote, visíveis em `flatpak info --show-permissions`. São "pré-concedidas" na instalação.

- **Permissões dinâmicas** — concedidas em tempo de execução via portais, com consentimento do usuário (o diálogo "Aplicativo deseja acessar sua pasta Fotos"). Não aparecem no `metadata` porque dependem da interação.

Um aplicativo pode funcionar perfeitamente sem `--filesystem=home` porque usa portais para tudo. Outro pode declarar `--filesystem=home` por preguiça do empacotador e funcionar "de qualquer jeito". O Flatpak moderno está migrando para o modelo de portais, mas a transição é gradual.

## Resumo

- Flatpaks rodam em sandbox com permissões declaradas no `metadata`, aplicadas pelo bubblewrap na instalação.
- O Discover mostra um resumo de permissões; `flatpak info --show-permissions` mostra a lista completa.
- Portais (`xdg-desktop-portal`) permitem acesso a arquivos e dispositivos por consentimento em tempo de execução, sem abrir o sandbox.
- `flatpak override` ajusta permissões por aplicativo; `--reset` reverte às permissões originais.
- `Permission denied` em caminhos fora do sandbox é o sintoma mais comum de permissão insuficiente.

## Exercícios

1. Escolha três aplicativos instalados e leia as permissões de cada um com `flatpak info --show-permissions`. Compare: qual é o mais restritivo e qual é o mais permissivo?
2. No Discover, abra a página de detalhes de um desses aplicativos e veja as permissões exibidas. Elas batem com o terminal? Há alguma permissão que o Discover omite?
3. Conceda a um editor de texto (`org.kde.kate`) acesso à pasta Downloads com `flatpak override --user --filesystem=~/Downloads org.kde.kate`. Confirme com `flatpak override --show`, teste salvar um arquivo lá, e depois reverta com `--reset`.
4. Tente reproduzir o erro "cartão SD invisível": abra um aplicativo Flatpak de arquivos (ex.: `org.kde.dolphin` em Flatpak) e veja se ele enxerga `/run/media/`. Se não, conceda `--filesystem=/run/media` e teste de novo.
5. **Desafio.** Instale um aplicativo que usa portais (ex.: `org.gnome.Evince` ou um leitor de PDF). Abra um PDF que está fora das pastas padrão e observe se o diálogo de seleção de arquivo aparece (portal funcionando) ou se o aplicativo falha. Depois, remova a permissão `--filesystem` correspondente com `--unset` e verifique se o aplicativo continua funcionando só com portais. Documente o que um portal concede que uma permissão estática não consegue substituir.