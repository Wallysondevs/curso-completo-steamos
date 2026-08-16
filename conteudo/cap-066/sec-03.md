O Chrome transmite os eventos de gamepad para o site do GeForce NOW, mas quem decide o que cada botão faz é o Steam Input. Sem a configuração correta, o analógico direito pode não mover o mouse, os gatilhos podem não clicar e os botões traseiros ficam mudos. Esta seção conecta as duas pontas: o layout de controle que o Steam exporta e o que o GeForce NOW espera receber do outro lado do stream.

:::objetivos
- Configurar o layout ideal do Steam Input para o GeForce NOW
- Mapear teclas de atalho para funções comuns do streaming
- Usar os botões traseiros para atalhos extras
- Diagnosticar quando o gamepad não responde no GeForce NOW
- Entender como o Chrome expõe o gamepad via API HTML5
:::

## O layout Gamepad com Trackpad de Mouse

O GeForce NOW traduz comandos de mouse e teclado do Deck para o servidor remoto, que está rodando a versão PC do jogo. Como a maioria dos jogos no catálogo da NVIDIA é de PC (não console), eles esperam mouse + teclado, não gamepad. O template **Gamepad com Trackpad de Mouse** resolve isso mapeando o analógico esquerdo como WASD, o direito como mouse e os botões de face como teclas.

Para aplicar: clique com o botão direito no atalho do GeForce NOW na biblioteca Steam > **Gerenciar > Layout do controle** > procure por *Gamepad com Trackpad de Mouse* nos templates recomendados.

```terminal
$ ls ~/.steam/steam/config/controller_configs/geforce_now/
gamepad_mouse_template.vdf
```

O Steam salva o layout como um arquivo VDF. Você pode compartilhá-lo entre contas Steam exportando esse arquivo, ou fazer backup para não perder a configuração ao formatar o Deck.

A tabela abaixo mostra o mapeamento padrão deste template:

| Controle do Deck | O que envia ao GeForce NOW |
|---|---|
| Analógico esquerdo | WASD (movimento) |
| Analógico direito | Movimento do mouse |
| Botão A | Espaço (pular) |
| Botão B | Esc (menu) |
| Botão X | E (interagir) |
| Botão Y | R (recarregar) |
| D-pad | Setas direcionais |
| L1 / R1 | Clique esquerdo / direito do mouse |
| L2 / R2 | Clique esquerdo / direito (curso suave) |
| Touchpad direito | Mouse |
| Touchpad esquerdo | Radial menu (atalhos rápidos) |

:::dica
O touchpad esquerdo com radial menu é a funcionalidade mais subestimada desse layout. Você pode configurar de 4 a 12 fatias, cada uma disparando um atalho de teclado. Exemplo: fatia superior = `[[Alt+Tab]]` para alternar janelas, fatia inferior = `[[Alt+F4]]` para fechar algo, fatia esquerda = `[[Ctrl+S]]` para salvar.
:::

## Personalizando os botões traseiros

Os botões `L4`, `L5`, `R4` e `R5` ficam sem função no template padrão. Eles são o espaço extra que transforma o Deck num teclado disfarçado de gamepad. Dentro do editor de layout (no Steam Input), selecione **Botões traseiros** e atribua:

- **L4**: `[[Ctrl]]` — para comandos como `[[Ctrl+C]]` / `[[Ctrl+V]]`
- **R4**: `[[Shift]]` — para correr em jogos ou selecionar múltiplos itens
- **L5**: `[[F5]]` — quicksave universal em jogos de PC
- **R5**: `[[F9]]` — quickload ou abrir mapa, dependendo do jogo

```terminal
$ evtest --grab /dev/input/event5 2>&1 | head -5
Input device ID: bus 0x3 vendor 0x28de product 0x1205 version 0x111
```

Lembre-se: no Modo Jogo, os botões traseiros funcionam porque o Steam Input está rodando e interceptando os eventos do controlador. Se você abrir o GeForce NOW pelo Modo Desktop sem o Steam em primeiro plano, `L4`/`L5`/`R4`/`R5` não disparam nada — o [kernel não os vê como botões independentes](#/cap-001/sec-05).

## O que fazer quando o controle não responde

Os três problemas mais comuns e suas soluções:

**Problema 1: o cursor do mouse não aparece.** O GeForce NOW detecta se há um mouse físico conectado, e se achar que não, pode esconder o cursor. Solução: no editor de layout do Steam Input, vá em **Trackpads > Touchpad direito > Configurações** e marque **Sempre mostrar cursor**.

**Problema 2: o analógico esquerdo não move o personagem.** O servidor remoto está esperando entrada de gamepad (XInput), não WASD. No GeForce NOW, abra as configurações (ícone de engrenagem) e em **Controles** alterne o modo de *Gamepad* para *Teclado e mouse*. O comportamento varia por jogo.

**Problema 3: duplo clique acidental.** O touchpad direito registra um clique ao toque (tap-to-click). No calor do jogo, você move o cursor e dispara um clique indesejado. Solução: no editor do Steam Input, desabilite **Clique ao tocar** no touchpad direito, mantendo apenas o clique físico (pressão).

```terminal
$ chromium --enable-features=UsePreferredIntervalForVideo \
  --disable-features=UseGpuSchedulerDfs \
  "https://play.geforcenow.com"
```

As flags `--enable-features` e `--disable-features` ajustam o comportamento do Chromium com vídeos. A primeira melhora a sincronização de frame; a segunda desabilita um escalonador de GPU que pode causar microstutter em streams. Elas não são obrigatórias, mas alguns usuários relatam melhora perceptível com elas.

:::atencao
Se você alternar entre Modo Desktop e Modo Jogo várias vezes, o Steam pode "esquecer" o layout do controle associado ao atalho. Isso é um bug conhecido do SteamOS 3.6. A correção: no Modo Jogo, abra o layout de controle ([[Steam]] > Configurações do controle) e reaplique o template — leva 5 segundos e resolve até a próxima reinicialização.
:::

## O que o Chrome entrega ao GeForce NOW

O site do GeForce NOW acessa o gamepad pela [Gamepad API](https://www.w3.org/TR/gamepad/) do navegador — um padrão W3C que expõe eixos e botões ao JavaScript. O Steam Input traduz os eventos do controlador físico do Deck para eventos que o Chrome entende.

```terminal
$ flatpak run com.google.Chrome "chrome://flags/#enable-gamepad-trigger-rumble" 2>&1 | grep -i gamepad
```

A página `chrome://flags` permite habilitar ou desabilitar comportamentos experimentais. A flag `Gamepad Trigger Rumble` controla se os gatilhos vibram em resposta a eventos de força — útil em jogos de corrida. No Deck, a vibração dos gatilhos funciona via Steam Input, não via Gamepad API, então essa flag tem efeito limitado.

## Resumo

- O template **Gamepad com Trackpad de Mouse** mapeia o Deck para WASD + mouse, que é o que a maioria dos jogos PC no GeForce NOW espera.
- Os botões traseiros podem ser configurados como teclas modificadoras (Ctrl, Shift) ou atalhos (F5 quicksave, F9 quickload).
- Quando o controle falha, verifique a visibilidade do cursor, o modo de entrada (gamepad vs teclado) e o tap-to-click do touchpad.
- A Gamepad API do Chrome é a ponte entre o Steam Input e o GeForce NOW.
- O Steam pode perder a associação do layout após várias trocas entre modos; reaplicar o template corrige.

## Exercícios

1. Aplique o template **Gamepad com Trackpad de Mouse** ao atalho do GeForce NOW. Inicie um jogo gratuito (ex.: *Fortnite* via GeForce NOW) e teste cada controle.
2. Configure o touchpad esquerdo como radial menu com 4 opções: `[[Alt+Tab]]`, `[[Alt+F4]]`, `[[Ctrl+S]]` e `[[Esc]]`. Teste cada atalho.
3. Atribua `[[Shift]]` ao `R4` e `[[Ctrl]]` ao `L4`. Num jogo de tiro, `[[Shift]]` faz correr e `[[Ctrl]]` faz agachar? Se não, investigue as configurações de teclado do jogo remoto.
4. No Modo Desktop, feche o Steam e abra o GeForce NOW pelo script `geforcenow.sh`. Os botões traseiros funcionam? Por quê?
5. **Desafio.** Crie dois layouts de controle separados para o mesmo atalho: um para jogos de tiro (WASD + mouse) e outro para jogos de plataforma (gamepad puro, com analógico esquerdo e botões de face mapeados como gamepad). Use **Exportar layout** e **Importar layout** no editor do Steam Input para alternar entre eles.