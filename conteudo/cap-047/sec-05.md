A diferença entre emular no Deck e emular num PC comum não está nos emuladores — está no controle. O Steam Deck tem analógicos, touchpads, giroscópio e quatro botões traseiros, e o EmuDeck escreve uma camada inteira de mapeamento para que cada emulador "fale" esse dialeto sem você configurar nada. Entender essa camada é entender por que o EmuDeck é mais do que um instalador de programas.

:::objetivos
- Entender o modelo de controle do EmuDeck (Steam Input + convenções internas)
- Conhecer as hotkeys globais e as específicas do RetroArch
- Ajustar mapeamento de botões para um console específico
- Configurar save states e fast-forward durante o jogo
- Reconhecer quando o problema é do emulador e não do controle
:::

## A camada Steam Input por trás de tudo

No SteamOS, todo input passa pelo **Steam Input**, que traduz eventos físicos (um stick, um botão) em eventos virtuais (teclado, mouse, gamepad) antes de entregá-los ao jogo. O EmuDeck aproveita isso de duas formas: primeiro, criando um **layout de controle** no Steam voltado para cada emulador; segundo, escrevendo **arquivos de config internos** que já nascem sabendo qual botão do Deck corresponde a qual botão do console.

O resultado é que, ao abrir um jogo de SNES pela biblioteca, o `A` do Deck já está mapeado para o `B` do SNES e o `B` para o `A` — a inversão clássica entre o layout ocidental e o japonês. Quem já passou horas remapeando sabe o valor disso.

```terminal
$ ls ~/.steam/steam/controller_base/templates
EmuDeck - Steam Deck Controller.vdf
```

O arquivo `.vdf` (Valve Data Format) é o template de controle que o EmuDeck registra. É ele que o Steam aplica quando você abre um atalho de emulador gerado pelo SRM. Sem esse template, cada jogo abriria com o layout genérico e os botões traseiros ficariam mortos.

## As hotkeys globais

As *hotkeys* são combinações de botão que invocam ações do emulador durante o jogo — salvar estado, acelerar, abrir menu — sem sair do jogo e sem teclado. O EmuDeck padroniza um conjunto que funciona em quase todos os emuladores que ele instala, usando o botão `Select` (ou `L3`) como modificador.

| Combinação | Ação |
|---|---|
| `Select` + `Start` | Sai do emulador |
| `Select` + `R1` | Save state no slot atual |
| `Select` + `L1` | Carrega save state |
| `Select` + `D-pad` direita | Avança slot de save |
| `Select` + `D-pad` esquerda | Volta slot de save |
| `Select` + `R2` | Fast-forward (turbo) |
| `Select` + `X` | Abre o menu do RetroArch |

Essa tabela é a espinha dorsal do uso diário. Ela evita a dependência de teclado e funciona de forma razoavelmente uniforme entre RetroArch, PPSSPP, PCSX2 e Dolphin — com pequenas variações de slot e de menu que o EmuDeck documenta.

:::dica
Memorize primeiro as três hotkeys que você mais vai usar: salvar (`Select+R1`), carregar (`Select+L1`) e sair (`Select+Start`). Com elas, você joga dezenas de horas sem nunca abrir um teclado nem tocar em uma configuração. O fast-forward (`Select+R2`) é o grande prazer de quem revisita RPGs antigos — diálogos e travessias lentas viram segundos.
:::

## Ajustando o mapeamento de botões

Por mais boa que seja a configuração padrão, sempre há um console cujo layout pede ajuste — ou um jogo que adoraria ter um botão traseiro disparando uma macro. No RetroArch, o mapeamento vive em dois lugares: o mapeamento do **RetroPad** (o gamepad abstrato do RetroArch) e o mapeamento por núcleo.

```terminal
$ cat ~/.var/app/org.libretro.RetroArch/config/retroarch/retroarch.cfg | grep -E "input_player1_[abxy]_btn"
input_player1_a_btn = "1"
input_player1_b_btn = "0"
input_player1_x_btn = "3"
input_player1_y_btn = "2"
```

Essas quatro linhas definem qual botão físico do Deck vira qual botão lógico do RetroPad. Os números (`0`, `1`, `2`, `3`) são os índices dos botões conforme o driver SDL os reporta. Para jogos que se beneficiam da inversão A/B, basta trocar os valores entre `input_player1_a_btn` e `input_player1_b_btn`.

:::atencao
Editar o `retroarch.cfg` à mão funciona, mas o RetroArch regrava esse arquivo quando você mexe na configuração pela interface, e pode sobrescrever seu ajuste. O caminho seguro é usar o menu do RetroArch (`Settings → Input → Port 1 Controls`) e deixar ele gravar sozinho — ou fazer o mapeamento por núcleo, que tem precedência e não é sobrescrito pelo global.
:::

## Botões traseiros e giroscópio

Os quatro botões traseiros (`L4`, `R4`, `L5`, `R5`) e o giroscópio são território exclusivo do Steam Input — nenhum emulador os "vê" diretamente, porque eles não existem no protocolo de gamepad padrão. É o template `.vdf` que os converte em algo útil: tipicamente, os traseiros viram macros de save/load state, e o giroscópio vira mouse para jogos de tiro ou apontador para o Wii.

```terminal
$ grep -o '"bindings".*' ~/.steam/steam/controller_base/templates/EmuDeck\ -\ Steam\ Deck\ Controller.vdf | head -1
```

Para mexer nesse nível, o caminho é a interface do Steam (em Game Mode, editar o layout do controle), não um arquivo de config. O EmuDeck entrega um padrão sensato; refinar é tarefa de quem quer o máximo — e a seção 9 volta a esse tema pela via do terminal.

## Quando o controle "não funciona"

O sintoma mais comum é: o jogo abre, mas nada responde — ou o analógico esquerdo controla o mouse em vez do personagem. Quase sempre a causa é o **layout errado aplicado ao atalho** no Steam, não um defeito do emulador. O atalho gerado pelo SRM precisa estar associado ao template do EmuDeck; se você abriu o emulador "na mão", em Desktop Mode, o Steam Input pode nem estar ativo.

```terminal
$ ls /dev/input/js* 2>/dev/null
/dev/input/js0
```

A presença de `/dev/input/js0` indica que o driver `joydev` reconheceu um joystick no nível do sistema. Se o arquivo não existe mesmo com o Deck ligado, o problema é de dispositivo; se existe e o jogo ignora, o problema é de mapeamento — o que aponta de volta para o Steam Input e para o layout do atalho.

## Resumo

- O Steam Input traduz os controles do Deck antes de entregá-los ao emulador.
- O template `.vdf` do EmuDeck aplica o mapeamento padrão a cada atalho.
- As hotkeys usam `Select` como modificador: save/load state, sair, fast-forward e menu.
- O RetroPad do RetroArch mapeia botões físicos a botões lógicos no `retroarch.cfg`.
- Os botões traseiros e o giroscópio só existem via Steam Input, não pelo protocolo de gamepad.
- Controle "morto" quase sempre é layout errado no atalho, não defeito de hardware.

## Exercícios

1. Com um jogo aberto no RetroArch, teste cada hotkey da tabela (`Select+R1`, `Select+L1`, `Select+Start`, `Select+R2`) e anote o resultado de cada uma.
2. No menu do RetroArch, navegue até `Settings → Input → Port 1 Controls` e identifique a linha que corresponde ao botão `A` do RetroPad.
3. Use `grep` no `retroarch.cfg` para listar todos os campos `input_player1_*_btn` e relacione-os aos botões físicos do Deck.
4. No Game Mode, abra o layout de controle de um atalho de emulador e descreva o que os botões traseiros `L4`/`R4` fazem no padrão do EmuDeck.
5. **Desafio.** Inverta o mapeamento A/B de um núcleo específico (não global) usando o menu "Core Input Remapping" do RetroArch, salve-o, e prove que a mudança persiste entre sessões enquanto o mapeamento global continua intacto.
