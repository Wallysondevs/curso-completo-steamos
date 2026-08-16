Nenhuma ferramenta é perfeita, e o Dolphin tem um conjunto de comportamentos que surpreendem negativamente quem nunca lidou com eles. Esta seção final cataloga os tropeços mais comuns — desde o painel lateral que some até a confusão entre links simbólicos e atalhos `.desktop` — e oferece diagnóstico e correção para cada um, sem precisar reinstalar nada.

:::objetivos
- Diagnosticar e corrigir o sumiço do painel lateral e da barra de ferramentas
- Entender a diferença entre link simbólico (arquivo `.desktop`) e atalho `.desktop` no Dolphin
- Recuperar abas fechadas acidentalmente
- Resolver o Dolphin que não abre ou abre com erro
- Entender por que algumas pastas não mostram o conteúdo (permissões, mounts e KIO)
:::

## Painéis e barras que sumiram

O cenário é clássico: alguém pressionou uma tecla que não devia, e de repente o painel lateral sumiu, ou a barra de ferramentas desapareceu, ou os menus evaporaram. A solução é sempre uma tecla de toggle.

| Sintoma | Tecla | O que faz |
|---|---|---|
| Painel lateral sumiu | `[[F9]]` | Alterna o painel Locais (esquerdo) |
| Painel de informação sumiu | `[[F11]]` | Alterna o painel de preview (direito) |
| Barra de menus sumiu | `[[Ctrl+M]]` | Alterna a barra de menu (Arquivo, Editar, Ver...) |
| Tudo sumiu menos a área central | `[[Ctrl+Shift+F]]` | Sai do modo de tela cheia (fullscreen) |

```terminal
$ dolphin ~/lab
## F9: o painel lateral aparece/desaparece
## F11: o painel de informação aparece/desaparece
## Ctrl+M: a barra de menu aparece/desaparece
## Ctrl+Shift+F: sai do modo de tela cheia
```

Se nenhum toggle funcionar, o problema pode estar no arquivo de configuração. Restaure os padrões:

```terminal
$ mv ~/.config/dolphinrc ~/.config/dolphinrc.defeito
$ dolphin ~/lab
## O Dolphin recria o dolphinrc com os padrões de fábrica
## Se o problema sumiu, o arquivo antigo estava corrompido
```

Esse é o "modo de segurança" do Dolphin. Se funcionar, você pode restaurar seletivamente as preferências copiando grupos do arquivo antigo para o novo.

## Links simbólicos vs atalhos .desktop

O Dolphin trata links simbólicos (criados com `ln -s`) e arquivos `.desktop` de forma radicalmente diferente, e essa diferença é fonte de confusão até para usuários experientes.

```terminal
$ cd ~/lab
$ ln -s ~/Downloads atalho-downloads
$ ls -la atalho-downloads
lrwxrwxrwx 1 deck deck 19 Apr 17 14:22 atalho-downloads -> /home/deck/Downloads
```

No Dolphin, `atalho-downloads` aparece com uma setinha no ícone, indicando que é um link simbólico. Duplo clique nele e você vai para `~/Downloads`, exatamente como esperado. Até aqui, sem surpresas.

A confusão começa com os arquivos `.desktop`. Se você criar um arquivo `meu-atalho.desktop` com:

```terminal
$ cat ~/lab/meu-atalho.desktop
[Desktop Entry]
Type=Link
URL=file:///home/deck/Downloads
Icon=folder
```

O Dolphin **não** mostra isso como um link para uma pasta. Ele mostra como um atalho de aplicativo, com o ícone de pasta e o nome "Downloads". Clicar nele **abre** a pasta `~/Downloads`, mas o comportamento não é idêntico ao do link simbólico: se você arrastar este atalho para outro lugar, ele é tratado como um arquivo `.desktop`, não como uma referência à pasta.

:::atencao
Arquivos `.desktop` com `Type=Link` são atalhos do padrão FreeDesktop, mas o Dolphin os renderiza como ícones de aplicativo, não como links de diretório. Para navegação entre pastas, sempre prefira `ln -s` (link simbólico). Reserve `.desktop` para atalhos de aplicativos e scripts.
:::

## Abas fechadas sem querer

Fechar uma aba com `[[Ctrl+W]]` e perceber um segundo depois que você precisava dela é um clássico. O Dolphin tem um recurso subestimado para isso: `[[Ctrl+Shift+T]]`, o "desfazer fechamento de aba".

```terminal
$ dolphin ~/lab
## Ctrl+T: abre uma nova aba, navegue até ~/Downloads
## Ctrl+T de novo: navegue até ~/.config
## Ctrl+W: fecha a aba ~/.config
## Ctrl+Shift+T: a aba ~/.config reaparece exatamente onde estava
```

Funciona como o "reopen closed tab" dos navegadores: a aba é restaurada com seu diretório, histórico e modo de visualização. Só funciona para a aba mais recentemente fechada, e o histórico de abas fechadas não sobrevive ao fechamento da janela.

## Dolphin não abre ou abre com erro

Quando o Dolphin não abre — ou abre e fecha imediatamente — o diagnóstico começa pela linha de comando, onde as mensagens de erro aparecem:

```terminal
$ dolphin
kf.kio.core: Malformed JSON protocol file for protocol "smb" ,  ""
kf.kio.gui: Failed to load the KIO plugin "thumbnail"  ( "Cannot load library /usr/lib/qt/plugins/kf6/kio/thumbnail.so" )
$ dolphin ~/lab
## Se abrir normalmente, o problema está na pasta inicial
## Se não abrir de jeito nenhum, o problema é outro
```

Mensagens de "Malformed JSON protocol file" indicam um arquivo de protocolo KIO corrompido em `/usr/share/kio/servicemenus/`. Mensagens "Cannot load library" apontam para plugins quebrados após uma atualização de sistema. O comando mágico nesses casos:

```terminal
$ kbuildsycoca5 --noincremental
$ sudo pacman -S --overwrite '*' kio kio-extras dolphin
```

O `kbuildsycoca5 --noincremental` força a reconstrução completa do cache. O `pacman -S --overwrite '*'` reinstala os pacotes do Dolphin e KIO, sobrescrevendo qualquer arquivo que tenha sido corrompido.

:::atencao
O `--overwrite '*'` do pacman sobrescreve arquivos protegidos. Use-o apenas quando tiver certeza de que os pacotes do KDE estão corrompidos e nunca como rotina. Na dúvida, execute primeiro sem `--overwrite` e veja se o pacman reporta conflitos.
:::

## Pastas que não mostram conteúdo

Você abre uma pasta no Dolphin e ela aparece vazia, mas o terminal mostra arquivos lá dentro. As causas mais comuns:

1. **Permissões**: o diretório não tem permissão de leitura (`r`) para seu usuário.
2. **Arquivos ocultos**: arquivos com `.` no início do nome estão invisíveis (`[[Ctrl+H]]` alterna).
3. **Filtro ativo**: você digitou algo sem perceber e o filtro está ocultando arquivos.
4. **Mount desmontado**: a pasta era um ponto de montagem e o sistema de arquivos sumiu.

```terminal
$ ls -la ~/Downloads
## Se os arquivos aparecem aqui e não no Dolphin, pressione Ctrl+H
## Se Ctrl+H não resolve, verifique se há texto no campo de filtro (canto inferior direito)
## Se o filtro está vazio, verifique permissões: ls -ld ~/Downloads
drwx------ 2 root root 4096 Apr 17 14:22 /home/deck/Downloads
## Se root for o dono e deck não tiver permissão, o Dolphin mostra a pasta vazia
```

No último caso, o Dolphin mostra a pasta, mas não lista o conteúdo porque o usuário `deck` não tem permissão de leitura. A correção: `sudo chown deck:deck ~/Downloads` ou `sudo chmod a+r ~/Downloads`.

## Resumo

- Painéis e barras que somem são recuperados com toggles: `[[F9]]` (painel lateral), `[[F11]]` (preview), `[[Ctrl+M]]` (menu), `[[Ctrl+Shift+F]]` (fullscreen).
- Links simbólicos (`ln -s`) e atalhos `.desktop` (`Type=Link`) são diferentes: o primeiro é tratado como arquivo de sistema de arquivos, o segundo como atalho de aplicativo.
- `[[Ctrl+Shift+T]]` restaura a aba mais recentemente fechada, com diretório e histórico intactos.
- Dolphin que não abre: diagnostique pela linha de comando, reconstrua o cache com `kbuildsycoca5 --noincremental` e, se necessário, reinstale os pacotes.
- Pastas vazias no Dolphin com arquivos no terminal: verifique `[[Ctrl+H]]`, filtro ativo e permissões com `ls -ld`.

## Exercícios

1. Pressione `[[F9]]`, `[[F11]]` e `[[Ctrl+M]]` sequencialmente até que todos os painéis e menus sumam. Depois restaure cada um com suas respectivas teclas.
2. Crie um link simbólico (`ln -s ~/Downloads ~/lab/meu-link`) e um atalho `.desktop` (`Type=Link`) apontando para o mesmo destino. Compare o comportamento dos dois no Dolphin ao clicar e ao arrastar.
3. Abra três abas, feche a do meio com `[[Ctrl+W]]`, depois restaure-a com `[[Ctrl+Shift+T]]`. O diretório e o histórico voltaram?
4. Force um erro: renomeie `~/.config/dolphinrc` para `~/.config/dolphinrc.bak` e abra o Dolphin. Ele recriou o arquivo? Restaure o backup depois do teste.
5. **Desafio.** Crie um diretório com permissão `000` (`chmod 000 teste-sem-acesso`), abra-o no Dolphin e observe o comportamento. Depois abra o mesmo diretório com `ls -la` no terminal. Corrija com `chmod 755 teste-sem-acesso` e explique por que o Dolphin agiu de forma diferente do `ls`.