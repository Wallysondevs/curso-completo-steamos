Com as ferramentas e os conceitos na mão, a pergunta que sobra é prática: quando travar em 30, quando buscar 40, quando mirar 60? A resposta não é "o máximo que der" — depende do jogo, do painel e da sua tolerância a latência, bateria e calor. Esta seção fecha o capítulo com uma régua de decisão.

:::objetivos
- Escolher o alvo de FPS conforme o gênero do jogo
- Balancear fluidez, latência e consumo no Steam Deck
- Decidir entre 30, 40 e 60 FPS para títulos específicos
- Entender por que "deixar livre" às vezes é melhor que travar
:::

## O critério não é técnico, é humano

Trinta, 40 e 60 FPS são números, mas o que decide o alvo certo não é a GPU — é a experiência que você quer. O critério principal: **a que distância você percebe a latência?**

Em jogos de tiro em primeira pessoa (FPS), a latência entre mirar e ver é o fator crítico, e ali 60 FPS (ou mais) não é luxo — é jogabilidade. Em RPGs por turno, a diferença entre 30 e 60 é "bonito" e só; o jogo é perfeitamente jogável a 30, com o bônus de consumir metade da bateria. Em jogos de ação em terceira pessoa, 40 FPS a 40 Hz é o alvo que agrada o controle e poupa o Deck.

O impacto no clock da GPU é o termômetro objetivo da decisão:

```terminal
$ cat /sys/class/drm/card0/device/pp_dpm_sclk
0: 200Mhz
1: 300Mhz
2: 500Mhz
3: 700Mhz *
4: 900Mhz
5: 1100Mhz
6: 1300Mhz
7: 1500Mhz
8: 1600Mhz
```

Com um RPG leve travado em 30 FPS, o clock pode ficar no degrau de 700 MHz — menos da metade do máximo. Isso se traduz em 8–10 W de consumo total do pacote contra 20–25 W de um AAA sem limite.

:::exemplo
Um exemplo concreto no Deck OLED: *Elden Ring* a 30 FPS é jogável, mas a 40 FPS/40 Hz o *parry* fica mais reativo — e o jogo roda nesse teto sem sacrificar a qualidade gráfica. Já *Hades*, que é 2D e responde instantaneamente, pede 60 FPS — mas a GPU sobra, então o limite nem é necessário.
:::

## A régua de decisão

A decisão segue três perguntas, nesta ordem:

1. **O jogo responde instantaneamente?** Se sim, o teto mais alto que a GPU sustentar (60 ou 90). Se não, próxima pergunta.

2. **O jogo mantém 40 FPS estáveis com frame pacing bom?** Se sim, 40 FPS a 40 Hz é quase sempre a melhor escolha: 25 ms de latência, bom para a maioria dos gêneros, consumo moderado. Se não, próxima.

3. **O jogo ao menos mantém 30 FPS?** Se sim, 30 FPS com painel a 90 Hz (três ciclos por quadro) ou 60 Hz (dois ciclos) é a base segura. Se nem 30, é hora de baixar resolução e gráficos antes de pensar em FPS.

A tabela fica assim:

| Gênero | Recomendação | Observação |
|---|---|---|
| FPS competitivo | 60+ (ou VRR, sem limite) | Latência é tudo |
| Ação 3ª pessoa | 40 FPS / 40 Hz | Balanço latência × bateria |
| RPG, estratégia | 30 FPS / 60 ou 90 Hz | Fluidez suficiente |
| Plataforma 2D | 60 FPS | Jogos leves sobram |
| Corrida, esporte | 40–60 FPS | VRR bem-vindo se monitor |
| Visual novel, puzzle | 30 FPS | Economiza bateria ao máximo |

## Quando "deixar livre" é a resposta certa

Em títulos leves que sobram na GPU — *Stardew Valley*, *Celeste*, *Hollow Knight* — travar o FPS é contraproducente. A GPU já está no degrau de clock mais baixo, e um limite artificial não economiza mais nada. Pior: se o limite é menor que o máximo sustentável, você joga latência fora à toa.

A mesma lógica vale com VRR num monitor externo: se a GPU entrega entre 50 e 90 FPS de forma estável, e o monitor tem faixa VRR de 48–144, travar é opcional. O VRR cuida do tearing, e a GPU não satura — o frame pacing fica naturalmente bom sem teto. Nesse caso, o limite vira desperdício de fluidez.

Para confirmar que o monitor externo está operando em modo VRR com um jogo rodando:

```terminal
$ xrandr --prop | grep -A5 vrr
	vrr_capable: 1
		range: (0, 1)
	vrr_enabled: 1
```

O `vrr_enabled: 1` indica que o gamescope ativou o modo variável naquele display. Se estiver `0`, o VRR está anunciado mas não em uso — comum quando o jogo está em modo de janela ou o cabo não transporta o sinal.

:::nota
"Deixar livre" não significa desligar tudo. Deixar o VRR ativo, garantir que o V-Sync do jogo esteja desligado (ele conflita com VRR) e monitorar a temperatura são boas práticas que acompanham o freio solto.
:::

## HDR, OLED e a cereja visual

No Steam Deck OLED, o painel não só aceita 90 Hz como suporta HDR. HDR e VRR podem coexistir, mas o HDR exige uma cadeia de cor que o gamescope precisa orquestrar. Na prática, ativar HDR num jogo compatível não muda os alvos de FPS — 40 Hz continua funcionando, e o painel mantém o HDR ativo.

O que muda é a percepção: o contraste do OLED faz 30 FPS parecerem "menos lentos" do que num LCD, porque o tempo de resposta do pixel é instantâneo. Um LCD leva milissegundos para trocar de cor; um OLED troca na ordem de microssegundos, então o *motion blur* natural do painel simplesmente some, e o frame pacing precisa ser ainda mais firme, porque qualquer oscilação fica escancarada no OLED.

```terminal
$ journalctl -u gamescope | grep -i hdr
jan 15 19:01:00 steamdeck gamescope[781]: [gamescope] HDR output: enabled
jan 15 19:01:00 steamdeck gamescope[781]: [gamescope] HDR layer: ST2084, luminances: 0.001 - 1000 nits
```

O log confirma que o gamescope está entregando saída HDR com a curva ST2084 (a EOTF padrão do HDR10). O Deck OLED reporta um pico de luminância de 1000 nits nesse exemplo — o valor real varia conforme o nível de brilho configurado.

## Resumo

- A escolha entre 30, 40 e 60 FPS depende do gênero, não só da GPU.
- 30 FPS serve para RPG, estratégia e jogos lentos; economiza bateria radicalmente.
- 40 FPS a 40 Hz é o alvo doce do Deck: latência de 25 ms, bom para ação moderada.
- 60 FPS (ou mais) é para jogos de tiro competitivo e jogos leves que sobram.
- Em títulos leves ou com VRR estável, travar traz pouco benefício — "deixar livre" é a resposta.
- O painel OLED exige frame pacing mais firme porque não tem o motion blur natural do LCD.

## Exercícios

1. Classifique três jogos do seu catálogo nas categorias da tabela de gêneros e defina o alvo de FPS para cada um.
2. Rode um RPG por 15 minutos a 30 FPS e depois a 40 FPS. Anote a diferença de consumo percebido (ventoinha, bateria) e de fluidez.
3. Num jogo de plataforma 2D, deixe o FPS livre e monitore o clock com `pp_dpm_sclk`. Há espaço para limitar ganhando algo?
4. Ative o HDR num jogo compatível do Deck OLED e verifique no `journalctl` do gamescope se a saída HDR está ativa.
5. **Desafio.** Crie uma "receita" pessoal: para o seu jogo mais jogado, determine o alvo de FPS ideal, o refresh rate, se VRR ou não, e justifique cada escolha com frame time, latência e consumo — usando os dados e comandos deste capítulo.