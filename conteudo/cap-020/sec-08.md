No Steam Deck, a tecla `[[Meta]]` (a que tem o logotipo do Steam/Plasma entre os analógicos) abre o menu. Mas o Plasma registra dezenas de outros atalhos — e permite que você crie seus próprios. Conhecer os atalhos globais é a diferença entre navegar o desktop com fluência e ficar catando ícones com o trackpad. E, mais importante, é o que permite lançar aplicativos e scripts com um toque, mesmo em modo Big Picture.

:::objetivos
- Listar os atalhos globais padrão do Plasma no SteamOS
- Usar o KRunner como launcher universal
- Criar atalhos globais personalizados para comandos e scripts
- Mapear atalhos usando o módulo de configuração do Plasma
- Registrar atalhos via ferramentas de linha de comando
:::

## O KRunner: o canivete suíço

Antes de mergulhar nos atalhos, é preciso apresentar o **KRunner**. Ele é o lançador que aparece quando você aperta `[[Alt+Espaço]]` ou `[[Alt+F2]]` no Plasma: uma barra flutuante que aceita comandos, cálculos, busca de arquivos e até conversão de unidades. É diferente do Kickoff porque não tem árvore de categorias — é uma caixa de texto pura, pensada para quem sabe o que quer.

O KRunner aparece no topo da tela e, no Steam Deck, é atingível por `[[Alt+F2]]` com um teclado conectado ou pelo atalho virtual configurável. Sua força está nos **plugins**:

```terminal
$ ls /usr/share/kservices5/krunner/ 2>/dev/null | head -10
plasma-runner-calculator.desktop
plasma-runner-command.desktop
plasma-runner-locations.desktop
plasma-runner-recentdocuments.desktop
plasma-runner-services.desktop
plasma-runner-shell.desktop
plasma-runner-windows.desktop
```

Cada `.desktop` ali registra um plugin que o KRunner carrega, e cada um entende um tipo de entrada: comandos, contas matemáticas, lugares, documentos recentes, serviços. O resultado é que você digita `42*7` e o KRunner devolve `294` sem abrir calculadora nenhuma.

## Atalhos globais padrão

Os atalhos mais úteis do Plasma no SteamOS, que funcionam em qualquer lugar (não só dentro de um aplicativo específico):

| Atalho | Ação |
|---|---|
| `[[Meta]]` | Abrir/fechar o Kickoff |
| `[[Alt+F2]]` ou `[[Alt+Espaço]]` | Abrir o KRunner |
| `[[Meta+W]]` | Overview (expor janelas) |
| `[[Ctrl+F1]]` a `[[F4]]` | Ir para área de trabalho 1 a 4 |
| `[[Ctrl+Alt+Seta]]` | Navegar entre áreas de trabalho |
| `[[Print]]` | Captura de tela (Spectacle) |
| `[[Ctrl+Alt+T]]` | Abrir terminal (Konsole) |
| `[[Ctrl+Alt+L]]` | Bloquear tela |
| `[[Alt+Tab]]` | Alternar entre janelas abertas |

A lista completa está no módulo de atalhos do `systemsettings`:

```terminal
$ systemsettings kcm_keys
```

Abre a tela de **Atalhos** diretamente. Dentro dela, o grupo **KWin** contém os atalhos de janelas; o grupo **Plasma** contém os do shell (abrir menu, KRunner); e o grupo **Atalhos personalizados** é onde você cria os seus.

## Criando atalhos personalizados

A criação de um atalho global que executa um comando arbitrário segue um roteiro que funciona igual tanto pela interface quanto por arquivo. Pela interface: Preferências → Atalhos → Atalhos personalizados → Novo → Atalho global → Comando/URL.

Pelo arquivo, os atalhos personalizados são salvos em `~/.config/kglobalshortcutsrc`. Mas o formato espera um binding para uma **ação registrada** do KDE, não um comando solto. Para registrar um comando como ação global, o caminho mais limpo é criar um arquivo `.desktop` associado e então mapear o atalho:

```bash
cat > ~/.local/share/applications/meu-atalho.desktop <<'EOF'
[Desktop Entry]
Type=Application
Name=Meu Atalho
Exec=/home/deck/lab/monitor.sh
Icon=utilities-terminal
X-DBUS-StartupType=None
Terminal=false
NoDisplay=true
EOF
```

A chave `NoDisplay=true` esconde esse atalho do menu Kickoff (para não poluir a lista), mas ainda permite mapeá-lo como atalho global. Depois, abra `systemsettings kcm_keys` e, no grupo de atalhos personalizados, aponte para o comando definido.

:::dica
Para scripts que você quer disparar com atalho sem abrir uma janela de terminal, use `NoDisplay=true` para esconder do menu e `Terminal=false` para não abrir janela. Se o script precisar de saída visível (como um `echo` de confirmação), use um `notify-send` para disparar uma notificação do Plasma em vez de abrir terminal.
:::

## Investigando atalhos pela linha de comando

O arquivo `~/.config/kglobalshortcutsrc` é onde o Plasma guarda todos os mapeamentos, e você pode inspecioná-lo:

```terminal
$ grep -i "krunner\|overview\|menu" ~/.config/kglobalshortcutsrc | head -10
```

Cada linha associa um identificador de ação a uma combinação de teclas. O formato é:

```ini
[kwin]
Overview=Meta+W,none,Expose
Switch to Desktop 1=Ctrl+F1,none,Switch to Desktop 1
```

Há três valores separados por vírgula: a tecla padrão, a tecla alternativa e o nome descritivo. Se você editar esse arquivo e quiser aplicar sem reiniciar, recarregue a sessão do KGlobalAccel:

```terminal
$ qdbus org.kde.kglobalaccel /kglobalaccel org.kde.KGlobalAccel.reloadConfig
```

Esse `reloadConfig` faz o daemon de atalhos globais reler o arquivo e aplicar os novos bindings.

:::atencao
Editar `kglobalshortcutsrc` e chamar `reloadConfig` é ideal para scripts que replicam configuração entre máquinas, mas cuidado: um binding que conflita com outro (duas ações reivindicando a mesma tecla) pode fazer com que uma das duas deixe de funcionar silenciosamente. Sempre teste após aplicar.
:::

## Resumo

- O KRunner (`[[Alt+F2]]` ou `[[Alt+Espaço]]`) é o launcher universal do Plasma: comandos, cálculos, arquivos, unidades.
- Os plugins do KRunner vivem em `/usr/share/kservices5/krunner/` e cada um adiciona uma capacidade de busca.
- Atalhos padrão cobrem Kickoff, KRunner, Overview, áreas de trabalho e terminal.
- Atalhos personalizados são criados via `systemsettings kcm_keys`; o mapeamento fica em `~/.config/kglobalshortcutsrc`.
- `qdbus org.kde.kglobalaccel /kglobalaccel org.kde.KGlobalAccel.reloadConfig` recarrega atalhos sem reiniciar o shell.

## Exercícios

1. Abra o KRunner com `[[Alt+Espaço]]` e teste: digite `=42*7`, o caminho de uma pasta e uma unidade (`=180cm to in`).
2. Liste os plugins do KRunner com `ls /usr/share/kservices5/krunner/` e identifique três capacidades além de comandos.
3. Crie um script que dispare uma notificação com `notify-send "Teste" "Atalho funcionou"` e mapeie-o como atalho global.
4. Inspecione seu `kglobalshortcutsrc` e encontre o binding da ação "Overview" no grupo KWin.
5. **Desafio.** Crie dois atalhos personalizados que executem o mesmo script (um com `Terminal=true`, outro com `Terminal=false`) e explique a diferença de comportamento quando cada um é disparado.