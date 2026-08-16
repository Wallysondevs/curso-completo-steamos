O mangohud é o coração do overlay de desempenho do SteamOS, e o dono do `fps_limit` que controla o teto de quadros na linha de comando. Dominar a variável `MANGOHUD_CONFIG` abre um leque de controle — limite de FPS, gráfico de frame time, percentis — que o menu do Modo Jogo condensa mas não expõe por inteiro.

:::objetivos
- Instalar e verificar o mangohud no SteamOS
- Configurar o limite de FPS via `MANGOHUD_CONFIG`
- Combinar `fps_limit` com métricas de frame time e 1% low
- Persistir configurações no arquivo do mangohud
:::

## O que é e o que ele faz

O mangohud é um "vulkan layer" — um interceptador que se insere entre o jogo e a Vulkan, exigindo acesso ao pipeline de renderização para desenhar o overlay e impor o teto de quadros. Ele nasceu da comunidade Linux e virou padrão de fato: é o que o SteamOS usa quando você liga o overlay de desempenho no Modo Jogo.

Como é uma layer Vulkan, funciona com a esmagadora maioria dos títulos rodando via Proton (que traduz DirectX para Vulkan) e com jogos Vulkan nativos. Títulos que usam OpenGL dependem de suporte específico, que varia.

```terminal
$ mangohud --version
MangoHud version 0.7.2
```

Se o comando responde com uma versão, o mangohud está instalado e no caminho. No SteamOS ele já vem de fábrica; numa distro comum, instala-se pelo gerenciador de pacotes, mas no deck você normalmente já tem tudo.

## A variável MANGOHUD_CONFIG

A sintaxe de `MANGOHUD_CONFIG` é uma lista de pares `chave=valor` separados por vírgula. O par que nos interessa agora é `fps_limit`, mas ele raramente é usado sozinho — combinar com métricas visíveis é o que torna o ajuste útil.

```terminal
$ MANGOHUD_CONFIG=fps_limit=40,fps=1,frame_timing=1 mangohud %command%
```

Nesse exemplo, além de travar em 40 FPS, o overlay mostra os FPS atuais (`fps=1`) e o gráfico de frame time (`frame_timing=1`). Com o gráfico visível junto do teto, você enxerga na hora se o limite está produzindo o ritmo constante esperado.

:::dica
O `fps_limit` aceita valores fracionários e decimais, como `fps_limit=40.5`, embora na prática quase ninguém precise de meio frame. Mais útil é lembrar que ele aceita os divisores do seu painel: numa tela de 60 Hz, use 60 ou 30; num Deck OLED, 90, 45, 40 ou 30.
:::

## Métricas de estabilidade

O teto de FPS é só metade da história; a outra metade é saber se o ritmo está firme. Dois parâmetros cobrem isso no mangohud:

```terminal
$ MANGOHUD_CONFIG=fps_limit=45,fps=1,frametime=1,frame_timing=1 mangohud %command%
```

- `fps=1` mostra o FPS atual e a média.
- `frametime=1` mostra o frame time em milissegundos.
- `frame_timing=1` desenha o gráfico histórico, onde os picos aparecem como espinhos.

Olhar o `frametime` numérico durante uma cena pesada revela, sem gráfico, se o valor se mantém perto do alvo (22,2 ms para 45 FPS) ou se dispara em momentos de carregamento. O gráfico, porém, registra o histórico e é melhor para achar o instante exato do engasgo.

## Persistindo a configuração

Digitar a variável a cada lançamento cansa; o mangohud lê um arquivo de configuração quando existe. No SteamOS, o local padrão é `~/.config/MangoHud/MangoHud.conf`. Edite com seu editor preferido:

```terminal
$ mkdir -p ~/.config/MangoHud
$ cat > ~/.config/MangoHud/MangoHud.conf <<'EOF'
fps_limit=40
fps=1
frame_timing=1
frametime=1
EOF
$ cat ~/.config/MangoHud/MangoHud.conf
fps_limit=40
fps=1
frame_timing=1
frametime=1
```

Com o arquivo no lugar, o mangohud aplica as opções por padrão, dispensando a variável. Para sobrescrever pontualmente num único jogo, a variável `MANGOHUD_CONFIG` continua valendo e tem precedência sobre o arquivo.

:::atencao
Não confunda `MANGOHUD_CONFIG` (opções separadas por vírgula) com o formato do `MangoHud.conf` (uma opção por linha). São sintaxes diferentes. Uma vírgula a mais na variável de ambiente costuma gerar parâmetro ignorado silenciosamente.
:::

## Resumo

- O mangohud é uma layer Vulkan que o SteamOS usa para o overlay e para o limitador de FPS.
- `MANGOHUD_CONFIG=fps_limit=40 mangohud %command%` aplica um teto de 40 FPS na hora.
- `fps`, `frametime` e `frame_timing` somam a medição de estabilidade ao limite.
- O arquivo `~/.config/MangoHud/MangoHud.conf` persiste as opções com uma por linha.
- A variável de ambiente tem precedência sobre o arquivo de configuração.
- O `fps_limit` funciona melhor quando casa com os divisores do refresh rate do painel.

## Exercícios

1. Rode `mangohud --version` e confirme a versão instalada no seu Deck.
2. Lance um jogo com `MANGOHUD_CONFIG=fps_limit=40,fps=1,frametime=1 mangohud %command%` e anote o frame time exibido durante um minuto de jogo.
3. Compare o mesmo jogo com `fps_limit` em 30 e depois em 40: o frame time numérico bate, respectivamente, com 33,3 ms e 25 ms?
4. Crie `~/.config/MangoHud/MangoHud.conf` com `fps_limit=40` e `frame_timing=1`, e verifique que o limite vale sem usar a variável.
5. **Desafio.** Combine `fps_limit` com `frame_timing=1` num jogo que faz *streaming* intenso de mundo aberto, identifique no gráfico os picos de carregamento e proponha um ajuste (limite ou configuração de jogo) que reduza esses espinhos.
