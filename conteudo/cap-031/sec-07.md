Ter o Flatseal e o `flatpak override` não resolve nada se você não olhar para cada app instalado com método. Auditoria é o ato sistemático de revisar permissões, decidir o mínimo necessário e documentar o que mudou. Sem isso, você vai mexendo ao acaso, quebra um app, não lembra o que fez e desiste — exatamente o oposto do objetivo.

Esta seção estabelece um fluxo repetível de auditoria, que você pode rodar em qualquer Steam Deck, e mostra como entender o estado de cada permissão antes e depois da sua intervenção.

:::objetivos
- Construir um roteiro de auditoria passo a passo para qualquer Flatpak
- Diferenciar o estado "herdado", "ligado" e "desligado" de uma permissão
- Usar `flatpak override --show` como fonte da verdade final
- Registrar as mudanças para reverter com segurança
:::

## O roteiro de auditoria

Auditar um app é um ciclo de cinco passos que se repete para cada Flatpak:

1. **Inventariar** — listar o que está instalado.
2. **Inspecionar** — ler as permissões atuais (herdadas + overrides).
3. **Decidir** — qual é o mínimo funcional deste app?
4. **Aplicar** — escrever os overrides (no Flatseal ou no terminal).
5. **Verificar** — reler e testar o app.

O passo 1 começa no terminal:

```terminal
$ flatpak list --app
Name                        Application ID                    Version        Branch
Firefox                     org.mozilla.firefox               128.0.2        stable
GIMP                        org.gimp.GIMP                     2.10.38        stable
Flatseal                    com.github.tchx84.Flatseal        2.3.0          stable
Steam                       com.valvesoftware.Steam           1.0.0.81       stable
```

Você tem a lista. Agora, para cada ID, o passo 2:

```terminal
$ flatpak override --show org.gimp.GIMP
[Context]
filesystems=~/.config/GIMP;xdg-pictures;xdg-download;
sockets=x11;wayland;
devices=dri;

[Environment]
```

Aqui ninguém alterou nada ainda: a saída mostra o estado herdado do pacote. Esse é o ponto de partida. A partir dele, você decide o passo 3 — no caso do GIMP, `x11` é necessário (GIMP 2.x), `dri` é necessário, e os filesystems são específicos e razoáveis. Talvez você queira adicionar `xdg-documents` se importa documentos com frequência.

## O estado de cada permissão

Toda permissão de Flatpak vive em um de três estados, e o Flatseal representa isso visualmente:

| Estado | Significado | Marca no `override --show` |
|---|---|---|
| Herdado | Vem do pacote, ninguém mexeu | aparece normalmente (`filesystems=home;`) |
| Ligado | Você forçou sim | aparece normalmente, mas veio do override |
| Desligado | Você forçou não | aparece com `!` (`!home`) ou valor vazio |

A distinção entre "herdado" e "ligado" não é visível num simples `--show`, porque os dois renderizam igual. Para separar, compare com `flatpak info -m` (que mostra só o pacote) — o que aparecer em `--show` e não estiver em `info -m` veio do seu override.

```terminal
$ flatpak info -m org.gimp.GIMP | grep filesystems
filesystems=~/.config/GIMP;xdg-pictures;xdg-download;
$ flatpak override --show org.gimp.GIMP | grep filesystems
filesystems=~/.config/GIMP;xdg-pictures;xdg-download;xdg-documents;
```

O `xdg-documents` a mais é a prova: alguém adicionou um override. O pacote tinha três tokens, o estado atual tem quatro.

## Aplicando e verificando no ciclo

Aplique as mudanças com o Flatseal (mais visual) ou no terminal (mais auditável). No terminal, o `--user` mantém tudo no seu escopo e evita pedir senha:

```terminal
$ flatpak override --user --socket=wayland --nosocket=x11 --nosocket=fallback-x11 org.gnome.Evince
$ flatpak override --show org.gnome.Evince | grep socket
sockets=!x11;wayland;
```

Depois, **sempre** teste o app. Abra, use por um minuto, execute a função principal. Se algo quebrou, o sintoma aparece rápido. E a reversão é uma linha:

```terminal
$ flatpak override --user --reset org.gnome.Evince
```

O `--reset` limpa **todos** os overrides do seu usuário para aquele app, devolvendo-o ao estado herdado do pacote. É o botão de pânico da auditoria.

:::atencao
`flatpak override --user --reset <id>` apaga **tudo** que você configurou para aquele app: filesystem, sockets, devices e env vars. Use com consciência — ele não é seletivo. Se você quer desfazer só uma coisa, use a negação inversa (ex.: `--filesystem=home` para re-adicionar o que negou com `--nofilesystem=home`).
:::

## Auditoria em lote

Auditar app por app manualmente funciona para meia dúzia, mas cansa com 30. Algumas automações de leitura ajudam a priorizar. Para listar todos os apps e suas permissões de uma vez:

```terminal
$ for app in $(flatpak list --app --columns=application); do
    echo "== $app ==";
    flatpak override --show "$app" | grep -E 'filesystems|sockets|devices' ;
  done
```

A saída empilha cada app com suas três linhas principais. Sua atenção vai direto para os outliers: o app com `filesystems=host`, o com `devices=all`, o com `system-bus`. São esses que você audita primeiro.

O Flatseal é o complemento natural: ele te deixa navegar a lista visualmente e ver, de relance, quais apps têm toggles "ligado" ou "desligado" (o código de cores e o estado do toggle indicam quem foi alterado). Use o terminal para o inventário em massa e a GUI para os ajustes finos.

:::dica
Guarde um registro do que você muda. Um arquivo simples em `~/lab/permissoes.md` com uma linha por app — `org.gimp.GIMP: +xdg-documents` ou `org.gnome.Evince: -x11 +wayland` — vale ouro quando, meses depois, você precisar entender por que um app está se comportando de um jeito específico.
:::

## Resumo

- Auditoria é um ciclo: inventariar, inspecionar, decidir, aplicar e verificar.
- Uma permissão pode estar herdada (do pacote), ligada (forçada sim) ou desligada (forçada não).
- A marca `!` (ex.: `!home`) indica negação; valor vazio indica env var desligada.
- Compare `flatpak override --show` com `flatpak info -m` para separar o que herdou do que você mudou.
- `flatpak override --user --reset <id>` limpa todos os seus overrides e é a reversão de emergência.
- Use `for` + `flatpak list` para auditar em lote e priorizar os outliers.

## Exercícios

1. Liste seus Flatpaks com `flatpak list --app` e escreva, para cada, uma linha resumindo as três permissões principais (filesystem, sockets, devices).
2. Use o loop `for` da seção para gerar o inventário em massa e identifique os dois apps mais permissivos da sua lista.
3. Para um app, aplique uma mudança no Flatseal e confirme no terminal com `flatpak override --show` que a mudança apareceu.
4. Compare `flatpak info -m <id>` com `flatpak override --show <id>` e liste exatamente o que veio de override seu.
5. **Desafio.** Audite o app `org.mozilla.firefox` (ou seu navegador Flatpak): decida o filesystem mínimo, os sockets necessários e os devices. Aplique as mudanças, teste navegação, download e upload, e documente tudo no `~/lab/permissoes.md`. Depois use `--reset` e compare o estado final com o inicial.