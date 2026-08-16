Passar horas ajustando fontes, cores, cursores e decoração de janelas é um investimento de tempo que você não quer repetir se reinstalar o SteamOS, trocar de SSD ou resetar as configurações. O Plasma grava tudo em arquivos de texto dentro de `~/.config`, e saber quais salvar — e como restaurar — é o que separa quem personaliza de quem perde a personalização.

:::objetivos
- Mapear os arquivos de configuração do Plasma em `~/.config` e entender o papel de cada um
- Inspecionar chaves de configuração com `kreadconfig6` e `grep`
- Criar um backup seletivo das configurações do KDE
- Restaurar configurações de aparência em um Deck recém-instalado ou com sessão limpa
- Entender os limites da restauração entre versões diferentes do Plasma
:::

## O arquivo-rei: `kdeglobals`

Toda configuração visual que atravessa mais de um aplicativo do KDE passa por `~/.config/kdeglobals`. É um arquivo no formato INI clássico, com grupos entre colchetes e pares `chave=valor`. Abra-o e você vai reconhecer quase todas as chaves que este capítulo mexeu:

```terminal
$ cat ~/.config/kdeglobals
[General]
ColorScheme=BreezeDark
Name=Breeze Dark
shrinkOverriddenColorScheme=
widgetStyle=Breeze
fixed=Hack,10,-1,5,50,0,0,0,0,0,Regular
font=Noto Sans,10,-1,5,50,0,0,0,0,0,Regular
menuFont=Noto Sans,10,-1,5,50,0,0,0,0,0,Regular
smallestReadableFont=Noto Sans,8,-1,5,50,0,0,0,0,0,Regular
toolBarFont=Noto Sans,9,-1,5,50,0,0,0,0,0,Regular

[Icons]
Theme=breeze

[KDE]
LookAndFeelPackage=org.kde.breezedark.desktop

[WM]
activeFont=Noto Sans,10,-1,5,75,0,0,0,0,0,Bold
```

O grupo `[General]` concentra cores, fontes e widget style. O `[Icons]` guarda o tema de ícones. O `[KDE]` registra o Global Theme ativo. E o `[WM]` (Window Manager) guarda a fonte da barra de título — que, por ter peso 75 (bold), se destaca.

`kreadconfig6` é a ferramenta oficial para ler qualquer chave desse arquivo sem precisar fazer `grep`:

```terminal
$ kreadconfig6 --file kdeglobals --group General --key ColorScheme
BreezeDark
$ kreadconfig6 --file kdeglobals --group Icons --key Theme
breeze
$ kreadconfig6 --file kdeglobals --group KDE --key LookAndFeelPackage
org.kde.breezedark.desktop
```

A vantagem sobre o `grep` é que o `kreadconfig6` entende o formato INI com sobreposição de arquivos: se houver um `kdeglobals` em `/etc/xdg/` e outro no home, o `kreadconfig6` aplica a ordem de precedência correta, enquanto o `grep` no arquivo do home só vê uma camada.

## Outros arquivos de configuração essenciais

Nem tudo mora no `kdeglobals`. Os ajustes de decoração de janelas e comportamento do KWin estão em `~/.config/kwinrc`:

```terminal
$ grep -v '^#' ~/.config/kwinrc | grep -v '^$'
[org.kde.kdecoration2]
ButtonsOnLeft=CHM
ButtonsOnRight=IAX
BorderSize=Normal
```

O `~/.config/breezestyleconfig` guarda as preferências do widget style Breeze (transparência, sombras). O `~/.config/plasmashellrc` armazena o layout do painel e a posição dos widgets — mexer nele sem cuidado pode desconfigurar seu desktop.

```terminal
$ ls ~/.config/*rc ~/.config/*globals ~/.config/breezestyleconfig 2>/dev/null
~/.config/breezestyleconfig  ~/.config/kdeglobals  ~/.config/kwinrc  ~/.config/plasmashellrc
```

## Fazendo backup seletivo

Para levar sua aparência para outro Deck ou se precaver contra perda, um backup seletivo pesa menos que copiar `~/.config` inteiro:

```terminal
$ mkdir -p ~/backup-kde-config
$ cp ~/.config/kdeglobals ~/backup-kde-config/
$ cp ~/.config/kwinrc ~/backup-kde-config/
$ cp ~/.config/breezestyleconfig ~/backup-kde-config/
$ cp ~/.config/plasmashellrc ~/backup-kde-config/
$ cp -r ~/.local/share/aurorae ~/backup-kde-config/aurorae 2>/dev/null
$ cp -r ~/.local/share/color-schemes ~/backup-kde-config/color-schemes 2>/dev/null
$ cp -r ~/.local/share/icons ~/backup-kde-config/icons 2>/dev/null
$ cp -r ~/.local/share/plasma/look-and-feel ~/backup-kde-config/look-and-feel 2>/dev/null
```

Esse conjunto cobre todas as personalizações abordadas neste capítulo: cores, fontes, cursores, decoração, ícones, temas globais e estilo de widget. Copie a pasta `~/backup-kde-config` para um pendrive ou para a nuvem e você tem o "kit de restauração visual" do seu Deck.

:::dica
Para automação, um script `restore-kde-config.sh` que copia os arquivos de volta e depois roda `plasmashell --replace &` fecha o ciclo. A única linha que varia entre máquinas é o caminho de origem do backup — o resto é idêntico.
:::

## Restaurando em um Deck limpo

Na restauração, a ordem importa: primeiro copie os arquivos, depois recarregue o Plasma:

```terminal
$ cp ~/backup-kde-config/kdeglobals ~/.config/
$ cp ~/backup-kde-config/kwinrc ~/.config/
$ cp ~/backup-kde-config/breezestyleconfig ~/.config/
$ cp -r ~/backup-kde-config/aurorae ~/.local/share/ 2>/dev/null
$ cp -r ~/backup-kde-config/color-schemes ~/.local/share/ 2>/dev/null
$ plasmashell --replace &
```

Copiar os arquivos primeiro e reiniciar o shell depois garante que tudo seja lido de uma vez, minimizando inconsistências parciais.

:::atencao
Arquivos de configuração do Plasma 5 tem estrutura ligeiramente diferente dos do Plasma 6. Se você está vindo de um SteamOS antigo (baseado em 22.04 com Plasma 5.27) para o SteamOS 3.6 (Plasma 6), algumas chaves podem ser ignoradas ou renomeadas. Sempre verifique o conteúdo copiado com `kreadconfig6` para confirmar que as chaves principais (`ColorScheme`, `LookAndFeelPackage`, `widgetStyle`) foram reconhecidas.
:::

## O que *não* vai no backup

Os arquivos em `~/.cache/` são regeneráveis e não devem ser copiados. `~/.config/session/` contém o estado da sessão salva (janelas abertas, posições) e copiá-lo entre máquinas com resoluções diferentes pode causar janelas posicionadas fora da tela. E o `~/.local/share/plasma/plasmoids/` contém widgets baixados — eles podem ser reinstalados, e copiá-los à força pode trazer versões incompatíveis com o Plasma 6.

## Resumo

- `~/.config/kdeglobals` é o arquivo central: cores, fontes, widget style, ícones e LookAndFeel estão todos ali.
- `kreadconfig6` lê qualquer chave do `kdeglobals` com a precedência correta de arquivos.
- `kwinrc`, `breezestyleconfig` e `plasmashellrc` guardam decoração de janelas, transparência e layout do painel, respectivamente.
- Um backup seletivo pesa pouco e cobre todo o investimento de personalização visual do capítulo.
- Na restauração, copie os arquivos primeiro e depois recarregue o shell com `plasmashell --replace &`.
- Configurações entre Plasma 5 e 6 podem divergir; sempre verifique as chaves principais com `kreadconfig6` após migrar.

## Exercícios

1. Execute `kreadconfig6 --file kdeglobals --group General --key ColorScheme` e compare com o que aparece em `grep ColorScheme ~/.config/kdeglobals`. O resultado é o mesmo? Por quê?
2. Crie um backup seletivo das configurações do KDE em `~/backup-kde-config/` e verifique que todos os arquivos listados foram copiados com `ls -la`.
3. Mude o esquema de cores para BreezeLight e recarregue o plasma. Depois restaure seu backup e confirme com `kreadconfig6` que as configurações voltaram ao estado anterior.
4. Inspecione `~/.config/plasmashellrc` e identifique duas chaves que você reconhece do layout do seu desktop. Altere uma delas, recarregue o plasma e veja o que muda.
5. **Desafio.** Crie um repositório Git em `~/.config/` (apenas dos arquivos do KDE, via `.gitignore` seletivo) e faça um commit inicial. Troque cores, fontes e decoração, faça um segundo commit e use `git diff` para ver exatamente o que cada ajuste modificou. O Git é uma ferramenta melhor de backup de configuração do que uma cópia de pasta? Discuta.