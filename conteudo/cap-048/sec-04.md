O RetroArch tem uma configuração global que vale para tudo, mas a graça do "canivete suíço" está em poder ajustar cada núcleo — e até cada jogo — de forma independente. É o sistema de **overrides**: camadas de configuração que se sobrepõem sem quebrar a base. Sem ele, você ficaria preso entre ter de mudar o controle a cada jogo ou aceitar uma configuração média que não serve bem para nada.

:::objetivos
- Entender a hierarquia entre configuração global, override de núcleo e override de jogo
- Criar e salvar um *core override* para um emulador
- Reverter ou apagar um override problemático
- Ajustar controles de forma granular por núcleo
- Usar a remapeação (*remap*) separada do override de configuração
:::

## A hierarquia em três camadas

Toda vez que o RetroArch vai aplicar uma opção, ele consulta três níveis de configuração, do mais específico ao mais geral. Se um nível não define a chave, vale o de cima.

```text
1. Override do jogo       (um único arquivo de ROM)
2. Override do núcleo     (vale para todo o emulador)
3. Configuração global    (retroarch.cfg, vale para tudo)
```

O que está embaixo vence. Um valor definido no override do jogo sobrepõe o do núcleo, que por sua vez sobrepõe o global.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/config/
snes9x/                      genesis_plus_gx/
beetle_psx/                  retroarch.cfg
```

Cada subpasta dentro de `config/` leva o nome do core e guarda os overrides daquele núcleo (arquivos `.cfg`). O `retroarch.cfg` ali dentro não é o global — é o override gerado quando você salva no nível "do menu inteiro".

## Criando um core override

O fluxo é simples: carregue um jogo com o core desejado, abra o *Quick Menu* (o menu rápido), ajuste o que quiser e salve. O RetroArch pergunta **onde** salvar.

```terminal
$ cat ~/.var/app/org.libretro.RetroArch/config/retroarch/config/snes9x/snes9x.cfg
video_shader_enable = "true"
video_smooth = "false"
input_overlay_enable = "false"
```

Repare que o override só contém as chaves **que você mudou** — o resto continua vindo do global. Isso mantém o arquivo pequeno e evita que uma mudança futura no global seja "congelada" num override antigo.

:::dica
No *Quick Menu*, a opção *Overrides > Save Core Overrides* grava para o núcleo inteiro, enquanto *Save Game Overrides* grava só para aquele jogo. Escolha o nível certo de primeira para não espalhar ajustes onde não deve.
:::

## Overrides de controle e remapping

Existem dois jeitos de mudar botões, e é comum confundi-los. O **override de configuração** guarda a definição de *input* (qual botão físico vira qual função global). O **remap** (remapeação) altera qual função do core cada botão físico aciona, e fica num arquivo separado, de extensão `.rmp`.

```terminal
$ ls ~/.var/app/org.libretro.RetroArch/config/retroarch/config/remaps/
snes9x/
  Super\ Mario\ World.rmp
```

A diferença prática: o remap por jogo é ótimo para quando um jogo usa layout diferente do resto. O controle global do deck, por outro lado, é ajustado no menu *Settings > Input* e vale para o RetroArch inteiro.

```terminal
$ cat config/remaps/snes9x/Super\ Mario\ World.rmp | head -8
input_libretro_device_p1 = "1"
input_player1_a = "0"
input_player1_b = "1"
input_player1_y = "3"
input_player1_x = "2"
```

No arquivo `.rmp` acima, os números mapeiam cada botão físico do deck para a função correspondente no core. Repare na primeira linha: `input_libretro_device_p1` define o *tipo* de dispositivo — um gamepad (`1`) ou um pad de console exótico. É justamente o que permite que o RetroArch apresente um controle de N64 virtual a um jogo de Wii, por exemplo. O remap lida com a identidade do controle; o override de configuração lida com o resto do comportamento.

:::atencao
Mudar botões em *Settings > Input > Port 1 Controls* altera o mapeamento **global** e afeta todos os cores. Para ajustar só um emulador, faça o remap dentro do *Quick Menu > Controls* com o jogo aberto.
:::

## Quando um override vira problema

Override é conveniente até o dia em que ele guarda uma configuração ruim e você não lembra onde a fez. O sintoma clássico: o jogo abre com um shader quebrado ou com botão trocado mesmo depois de você "arrumar" o global.

A limpeza passa por dois caminhos. O mais seguro é usar o menu: *Quick Menu > Overrides > Load/Remove Override File*, que deixa você carregar ou apagar o override ativo para o núcleo ou para o jogo. O mais direto é apagar o arquivo `.cfg` correspondente no disco.

```terminal
$ rm ~/.var/app/org.libretro.RetroArch/config/retroarch/config/snes9x/snes9x.cfg
```

Depois de apagar, o núcleo volta a herdar a configuração global — que pode ser exatamente o que você quer quando o override envelheceu.

:::dica
Antes de editar ou apagar overrides, renomeie o arquivo em vez de deletar (ex.: `snes9x.cfg.old`). Assim dá para desfazer a limpeza se perceber que o override guardava algo importante.
:::

## Resumo

- A configuração do RetroArch é por camadas: jogo > núcleo > global; o mais específico vence.
- Overrides de núcleo ficam em `config/<core>/<core>.cfg` e contêm só as chaves alteradas.
- *Save Core Overrides* grava para o emulador; *Save Game Overrides* para um jogo só.
- Remap (`.rmp`) altera botões por jogo/núcleo, separado do override de configuração.
- Apagar o `.cfg` do override faz o núcleo voltar a herdar o global.

## Exercícios

1. Carregue um jogo de SNES, abra o *Quick Menu*, mude uma opção e salve como core override. Depois abra o `.cfg` gerado e veja quantas linhas ele tem.
2. Crie um remap para um jogo cujo layout de botões difere do padrão do core e confirme a criação do `.rmp`.
3. Compare uma opção definida no global, no core override e no game override para confirmar qual valor vence em cada cenário.
4. "Quebre" de propósito um override mudando uma tecla e depois restaure usando *Remove Override File*.
5. **Desafio.** Configure um core override para o `beetle_psx` que ligue um shader, mude o mapeamento de controle e ajuste o aspect ratio — depois explique a diferença entre o que ficou no override e o que só existe porque você ainda não salvou.
