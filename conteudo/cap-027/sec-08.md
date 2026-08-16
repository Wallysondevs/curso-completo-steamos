O arquivo `~/.config/kglobalshortcutsrc` é a fonte da verdade dos atalhos do Plasma — mas lê-lo cru é confuso, e editá-lo à mão causa mais problemas do que resolve. Esta seção mostra como ler o arquivo corretamente, modificar com segurança e aproveitar o `kwriteconfig6` para fazer mudanças cirúrgicas sem quebrar nada.

:::objetivos
- Interpretar a estrutura do arquivo `kglobalshortcutsrc`
- Diferenciar tecla padrão, tecla atual e rótulo em cada linha
- Editar atalhos com `kwriteconfig6` de forma idempotente
- Fazer backup e validar mudanças antes de aplicar
:::

## Anatomia de uma linha de atalho

Cada entrada de atalho no Plasma é uma linha no formato:

```
NomeDaAcao=TeclaPadrão,TeclaAtual,Rótulo
```

Os três campos separados por vírgula têm papel distinto, e entender isso evita 90% da confusão. O primeiro campo é a tecla de fábrica (o padrão do Plasma); o segundo é a tecla que vale **agora** (o que você customizou); o terceiro é um nome amigável exibido na interface gráfica.

```terminal
$ grep 'Window Close' ~/.config/kglobalshortcutsrc
Window Close=Alt+F4,Alt+F4,Close Window
```

Nesta linha, os dois primeiros campos são idênticos (`Alt+F4`), o que significa que **ninguém mudou** esse atalho. Quando diferirem, o primeiro mostra o original e o segundo a personalização — e é aí que a leitura fica útil para diagnóstico.

```terminal
$ grep 'Window Close' ~/.config/kglobalshortcutsrc
Window Close=Alt+F4,Ctrl+Shift+Q,Close Window
```

Nesta segunda linha, o atalho foi remapeado de [[Alt+F4]] para [[Ctrl+Shift+Q]]. O rótulo (`Close Window`) continua igual, porque descreve a ação, não a tecla. Ver essas duas versões lado a lado é a forma mais rápida de descobrir se alguém (ou um conflito) alterou um atalho importante.

:::nota
O arquivo é dividido em seções `[grupo]` no estilo INI, e o mesmo grupo pode aparecer mais de uma vez (como `[kwin]` em lugares diferentes) porque alguns componentes do Plasma escrevem suas entradas em blocos separados. Use `grep -n '^\[kwin\]'` para localizar todas as ocorrências da seção antes de assumir que só existe uma.
:::

## Como o arquivo é organizado

Para ler o arquivo inteiro de forma útil, agrupe por componente:

```terminal
$ grep -E '^\[.*\]' ~/.config/kglobalshortcutsrc
[plasmashell]
[kwin]
[ksmserver]
[krunner]
[yakuake]
[org.kde.dolphin.desktop]
[custom]
```

Cada grupo corresponde a um dono de atalhos — o mesmo conceito que você viu nos componentes do D-Bus. A seção `[custom]` é a que recebe os atalhos customizados que você criar. A seção `[ksmserver]` gerencia atalhos de sessão (logout, bloqueio de tela).

```terminal
$ grep -A5 '^\[ksmserver\]' ~/.config/kglobalshortcutsrc
[ksmserver]
Lock Session=Meta+L,Ctrl+Alt+L,Lock Session
Log Out=Ctrl+Alt+Delete,Ctrl+Alt+Delete,Log Out
```

Esta amostra mostra dois atalhos de sessão. Repare que `Lock Session` tem tecla padrão `Meta+L` mas tecla atual `Ctrl+Alt+L` — ou seja, foi remapeado. E `Log Out` usa a clássica [[Ctrl+Alt+Delete]], herdada da tradição Windows/KDE.

## Editando com kwriteconfig6 (a forma segura)

Editar o arquivo com um editor de texto funciona, mas é frágil: um espaço errado ou uma vírgula perdida corrompe a entrada, e o Plasma pode ignorá-la silenciosamente. A forma robusta é usar o `kwriteconfig6`, que escreve no formato correto sempre:

```terminal
$ kwriteconfig6 --file kglobalshortcutsrc --group kwin --key "Window Close" "Alt+F4,Ctrl+Shift+Q,Close Window"
```

O comando escreve o valor exatamente como `kwriteconfig6` grava, garantindo sintaxe válida. Para **ler** um valor de volta e confirmar a mudança:

```terminal
$ kreadconfig6 --file kglobalshortcutsrc --group kwin --key "Window Close"
Ctrl+Shift+Q
```

`kwriteconfig6` e `kreadconfig6` são um par: um escreve, o outro lê. Usar os dois em sequência é a forma mais segura de validar uma edição sem depender de `grep` manual.

:::atencao
`kwriteconfig6` sobrescreve a entrada inteira. Se você esquecer o rótulo ou errar os campos, perde o valor anterior — por isso **sempre** leia o valor com `kreadconfig6` (ou `grep`) antes de escrever, e guarde a linha original num arquivo de backup.
:::

## Backup e validação de mudanças

Antes de qualquer edição em lote, faça backup do arquivo:

```terminal
$ cp ~/.config/kglobalshortcutsrc ~/.config/kglobalshortcutsrc.bak
$ diff ~/.config/kglobalshortcutsrc ~/.config/kglobalshortcutsrc.bak
```

O `diff` sem saída confirma que o backup está idêntico. Depois de editar, o mesmo `diff` (na ordem inversa) mostra exatamente o que mudou:

```terminal
$ diff ~/.config/kglobalshortcutsrc.bak ~/.config/kglobalshortcutsrc
1c1
< Window Close=Alt+F4,Alt+F4,Close Window
---
> Window Close=Alt+F4,Ctrl+Shift+Q,Close Window
```

A saída do `diff` mostra a linha antiga (precedida de `<`) e a nova (precedida de `>`). É a forma mais confiável de auditar uma mudança — e de reverter com `cp ~/.config/kglobalshortcutsrc.bak ~/.config/kglobalshortcutsrc` se algo sair errado.

:::dica
Alguns atalhos só são aplicados após reiniciar o KWin ou refazer o login. Se uma mudança no `kglobalshortcutsrc` não "pegar" na hora, force o Plasma a reler encerrando e relançando o shell: `kquitapp5 plasmashell && kstart5 plasmashell`. Para atalhos do KWin especificamente, reinicie a sessão.
:::

## Resumo

- Cada linha de atalho tem o formato `Acao=TeclaPadrão,TeclaAtual,Rótulo`.
- Campos de tecla iguais significam "nunca customizado"; diferentes revelam remapeamento.
- O arquivo é dividido em seções `[grupo]`, uma por dono de atalhos (kwin, plasmashell, custom...).
- `kwriteconfig6` escreve e `kreadconfig6` lê valores no formato correto, sem risco de sintaxe.
- Sempre leia o valor antes de editar e faça backup com `cp` + valide com `diff`.
- Mudanças podem exigir `kquitapp5 plasmashell && kstart5 plasmashell` para surtir efeito.

## Exercícios

1. Use `grep -E '^\[.*\]' ~/.config/kglobalshortcutsrc` para listar todos os grupos do arquivo.
2. Encontre uma entrada onde os dois primeiros campos diferem e explique qual era a tecla original e qual é a atual.
3. Leia o valor de "Window Close" com `kreadconfig6` e registre o resultado.
4. Faça backup do arquivo, mude um atalho com `kwriteconfig6` e valide a mudança com `diff`.
5. **Desafio.** Crie uma entrada `[custom]` do zero com `kwriteconfig6`, associe-a a um comando real, e valide de ponta a ponta usando `kreadconfig6` + `qdbus ...shortcutNames`.
