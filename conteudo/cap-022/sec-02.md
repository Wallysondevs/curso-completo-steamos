Um tema global no KDE Plasma é um pacote que muda de uma vez só várias coisas que, por baixo, são configurações separadas: o esquema de cores, o tema da decoração de janelas, o papel de parede, os ícones e o estilo do cursor. Em vez de ajustar cada um individualmente, você aplica um pacote e o Plasma faz o resto. No Steam Deck, isso é a diferença entre ficar horas fuçando e transformar o visual em um comando.

:::objetivos
- Entender o que um Global Theme agrupa e como ele se relaciona com os módulos individuais
- Aplicar um tema global pela interface gráfica do System Settings
- Instalar temas a partir dos repositórios do KDE Store
- Aplicar um tema pela linha de comando com `lookandfeeltool`
- Corrigir problemas comuns após a troca de tema
:::

## O que um Global Theme carrega

Abrindo **Appearance & Style → Colors & Themes → Global Theme**, você vê uma galeria de pacotes como *Breeze*, *Breeze Dark* e *Breeze Twilight*. Cada um é um conjunto de referências para outros componentes. Quando você clica em "Aplicar", o Plasma escreve uma série de chaves em configurações separadas.

```terminal
$ lookandfeeltool -l
org.kde.breeze.desktop
org.kde.breezedark.desktop
org.kde.breezetwilight.desktop
```

O nome interno de cada tema segue o padrão `org.kde.<nome>.desktop`. Repare que não são apenas três: dependendo do que já foi instalado, a lista pode crescer. O `lookandfeeltool -l` lista os temas disponíveis; o nome interno é o identificador usado nos comandos que virão a seguir.

O tema global cuida da mesa de trabalho (o Shell do Plasma) e dos aplicativos Qt. Mas aplicativos **GTK** — como muitos utilitários GNOME que você pode instalar via Flatpak — não obedecem ao tema global do Plasma automaticamente. Para isso existe a página *Application Style* com a opção de configurar temas GTK, detalhada na seção 7 deste capítulo.

## Aplicando pela interface

Na galeria de temas globais, clicar em um tema abre uma janela com detalhes e um botão **Aplique**. O Plasma muda cores, decoração e cursor na hora. Se algo ficar estranho, dá para voltar em um clique para qualquer outro tema.

:::atencao
Temas globais baixados de fontes não confiáveis podem incluir código e até extensões de shell. O Plasma 6 mostra um aviso ao instalar temas de terceiros que instalam plasmoids ou elementos executáveis. Prefira temas bem avaliados no KDE Store e leia a descrição antes de instalar.
:::

## Aplicando pela linha de comando

O comando `lookandfeeltool` é o equivalente de terminal para a galeria de temas. Para aplicar o tema escuro padrão do SteamOS:

```terminal
$ lookandfeeltool -a org.kde.breezedark.desktop
```

O `-a` vem de *apply*. Não há saída em caso de sucesso — silêncio aqui é sinal bom. Para confirmar qual tema está ativo no momento:

```terminal
$ kreadconfig6 --file kdeglobals --group KDE --key LookAndFeelPackage
org.kde.breezedark.desktop
```

O resultado aparece por meio do `kreadconfig6`, que lê o arquivo `kdeglobals` (o mesmo que a seção 8 vai explorar em profundidade). O tema ativo fica gravado na chave `LookAndFeelPackage`, dentro do grupo `KDE`.

:::dica
Para alternar automaticamente entre tema claro e escuro conforme o horário, o KDE tem o tema *Breeze Twilight*. Ele não faz a troca sozinho, apenas serve de base; a automação de alternância por horário é feita pelo módulo *Night Color* ou por agendamento manual com `systemd`. Para uma solução rápida, um atalho de teclado que chama `lookandfeeltool -a` duas vezes resolve.
:::

## Instalando temas novos

Na própria galeria do System Settings há um botão **Obter novos temas...** que abre uma janela conectada ao KDE Store (store.kde.org). Você baixa e aplica sem sair do System Settings. Por trás, os pacotes vão para um diretório no seu home:

```terminal
$ ls ~/.local/share/plasma/look-and-feel/
org.kde.breeze.desktop      org.kde.breezedark.desktop
```

Cada tema global instalado vira uma pasta com esse nome interno. Remover a pasta é uma forma direta de desinstalar um tema que veio de terceiros e que você não quer mais. O tema ativo, claro, não deve ser apagado enquanto estiver em uso.

## Restaurando o padrão

Se um tema quebrou a aparência — janelas sem borda, fontes ilegíveis ou painel invisível — o caminho de volta é aplicar o Breeze Dark, que é o padrão do SteamOS no Modo Desktop:

```terminal
$ lookandfeeltool -a org.kde.breezedark.desktop
$ plasmashell --replace &
```

O segundo comando reinicia o shell do Plasma (`plasmashell`) sem reiniciar o deck inteiro. O parâmetro `--replace` derruba a instância atual e sobe uma nova, recarregando painel e desktop com o tema recém-aplicado. É o botão de "reiniciar a interface" que o SteamOS nem sempre expõe de forma óbvia.

:::perigo
`plasmashell --replace` encerra a sessão gráfica do Plasma momentaneamente. Se você rodar sem o `&`, o terminal fica preso ao processo e, ao fechá-lo, o shell pode morrer de novo. Execute sempre em segundo plano ou use o atalho `[[Ctrl+Alt+F2]]`/`[[Ctrl+Alt+F1]]` para alternar de TTY se a tela travar.
:::

## Resumo

- Um Global Theme agrupa cores, decoração de janelas, ícones, cursor e papel de parede numa aplicação só.
- O nome interno do tema segue o padrão `org.kde.<nome>.desktop`, listado com `lookandfeeltool -l`.
- `lookandfeeltool -a org.kde.breezedark.desktop` aplica um tema pela linha de comando, em silêncio quando dá certo.
- A chave `LookAndFeelPackage` em `kdeglobals` registra o tema ativo no momento.
- `plasmashell --replace &` reinicia a interface quando a troca de tema deixou o shell quebrado.
- Temas de terceiros ficam em `~/.local/share/plasma/look-and-feel/` e podem trazer código executável — cuidado com a fonte.

## Exercícios

1. Liste os temas globais disponíveis com `lookandfeeltool -l` e compare com a galeria do System Settings. Todos os temas da interface aparecem no terminal?
2. Aplique o tema Breeze Light com `lookandfeeltool -a org.kde.breeze.desktop`, observe a mudança e retorne ao Breeze Dark. Em cada passo, confira a chave ativa com `kreadconfig6`.
3. Verifique o conteúdo de `~/.local/share/plasma/look-and-feel/` com `ls` e explique o que cada pasta representa.
4. Abra a galeria do System Settings e clique em "Obter novos temas...", procure por um tema escuro bem avaliado e instale-o. Depois volte ao padrão e desinstale via remoção da pasta correspondente.
5. **Desafio.** Combine o que aprendeu: aplique um tema claro, reinicie o shell com `plasmashell --replace &` e confirme que a chave `LookAndFeelPackage` reflete o tema claro. Depois escreva um pequeno script `bash` que alterna entre claro e escuro a cada execução, usando `kreadconfig6` para descobrir o estado atual.