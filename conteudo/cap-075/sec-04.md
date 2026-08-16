O Steam Deck dorme e acorda dezenas de vezes por dia. Cada fechada de tampa e cada apertada no botão de energia passa por um mecanismo de suspensão que, no Linux, é bem menos trivial do que parece por fora. A animação de suspend — o vídeo mostrado quando o deck "dorme" e "acorda" — é amarrada a esse mecanismo, e entender o mecanismo é o que explica por que algumas animações simplesmente não aparecem.

:::objetivos
- Entender os estados de suspensão do Steam Deck (S3 e o modelo do hardware)
- Diferenciar a animação de "dormir" da animação de "acordar"
- Localizar e inspecionar a configuração de suspend
- Diagnosticar por que uma animação de suspend não dispara
:::

## Como o deck suspende

Quando você fecha a tampa sem sair do jogo, o Steam Deck não desliga os processos: ele congela o estado na RAM e corta a energia de quase tudo, mantendo só o necessário para restaurar. Esse é o estado **S3** (suspend-to-RAM), o modo padrão do hardware do deck. O processo é rápido — frações de segundo para dormir e outro tanto para acordar.

A animação de suspend aparece em dois momentos distintos e muitas vezes confundidos como um só:

- **Suspend (dormir):** o vídeo curto que confirma que o deck está entrando em suspensão. Costuma ser rápido, de 1 a 3 segundos.
- **Resume (acordar):** o vídeo mostrado quando a tela volta. Muitos temas usam o mesmo clipe, mas o plugin trata os dois como canais separados.

```terminal
$ cat /sys/power/state
freeze mem disk
```

O arquivo virtual `/sys/power/state` lista os estados de suspensão que o kernel suporta naquela máquina. `mem` é o suspend-to-RAM (S3), o que o deck usa. `freeze` é um estado mais raso e `disk` é a hibernação (que grava em disco e o Steam Deck não usa por padrão).

:::info
O Steam Deck não usa hibernação (S4) por padrão — ele usa suspensão em RAM (S3). Isso tem uma consequência: se a bateria chega a zero durante a suspensão, o estado é perdido e o deck faz um boot completo ao ser religado. É por isso que a animação de "acordar" às vezes não aparece: não houve resume, e sim um boot do zero.
:::

## A configuração de suspend

Assim como o boot, a animação de suspend é registrada em configuração que o plugin escreve e o SteamOS lê. O canal de suspend tem, tipicamente, dois campos: o vídeo de dormir e o de acordar.

```json
{
  "suspend": {
    "sleep": "/home/deck/homebrew/plugins/AnimationChanger/animations/sleep.webm",
    "resume": "/home/deck/homebrew/plugins/AnimationChanger/animations/resume.webm"
  }
}
```

A separação `sleep`/`resume` existe porque os dois eventos têm timing diferente. O `sleep` precisa ser exibido e finalizado **enquanto** o sistema ainda tem janela para desligar o vídeo antes de congelar a RAM. Um vídeo de dormir muito longo é cortado no meio — o hardware não espera.

O `resume`, por outro lado, tem todo o tempo do mundo: o sistema já está acordado, e o vídeo pode até ser mais elaborado.

:::atencao
Uma animação de `sleep` longa é o erro número um de quem monta o próprio tema. Se o vídeo de dormir tem 10 segundos, o que você vê na prática é 1 segundo dele e depois a tela apaga, porque a suspensão não espera o vídeo terminar. Mantenha o `sleep` com no máximo 2 a 3 segundos.
:::

## Formatos para suspend

O canal de suspend aceita, em geral, os mesmos formatos do boot — WebM/VP9 — mas a comunidade tem uma preferência clara por duas estratégias:

| Abordagem | Formato | Por quê |
|---|---|---|
| Vídeo curto | WebM (2–3 s) | Confirmação visual animada de dormir/acordar |
| Imagem estática | PNG | Custo mínimo, ideal para que o resume seja instantâneo |

A imagem estática é especialmente popular para o `resume`: ela aparece instantaneamente assim que a tela liga, sem esperar a decodificação de um vídeo. Num deck que acorda 30 vezes por dia, essa diferença acumula.

```terminal
$ ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1 sleep.webm
duration=2.500000
```

Aqui o `ffprobe` reporta a duração total do vídeo (`2.5` segundos). Para o `sleep`, esse número está dentro do saudável. Um `9.8` aqui seria um alerta vermelho.

## Por que a animação de suspend some

Três causas respondem por quase todos os casos de "a animação de suspend não aparece mais":

1. **O vídeo de dormir é longo demais** — cortado antes de completar (já vimos).
2. **A bateria zerou durante o sono** — não houve resume, houve boot completo. A animação de suspend não é chamada.
3. **Atualização do SteamOS** — mudou o formato de configuração e o plugin ainda escreve no formato antigo. A animação fica órfã.

Para o caso 2, dá para confirmar olhando o log do kernel no momento do "acordar":

```terminal
$ journalctl -b -1 --no-pager | grep -iE 'suspend|resume|PM: suspend'
PM: suspend entry (deep)
PM: suspend exit
```

O `journalctl -b -1` lê o log do boot **anterior**. Se você vê `suspend entry`/`suspend exit` registrados, houve um ciclo de suspensão real. Se não há essa linha mas a máquina voltou do zero, você estava na situação "bateria zerou".

:::dica
Para acompanhar em tempo real o que o kernel faz ao suspender e acordar, deixe um `journalctl -f` rodando em outro terminal (ou via SSH) e feche a tampa. As mensagens de `PM:` (power management) aparecem ao vivo e mostram cada etapa.
:::

## Testando suspensão sem fechar a tampa

Você não precisa fechar a tampa física do deck para testar a animação de suspend. O `systemd` expõe o comando direto:

```terminal
$ systemctl suspend
```

Ele desencadeia exatamente o mesmo caminho da tampa ou do botão de energia. O risco é óbvio: a tela apaga e o deck dorme de verdade. Para testar o `resume`, qualquer tecla ou o botão de energia acorda a máquina.

```terminal
$ cat /sys/class/power_supply/*/status
Charging
```

Esse segundo comando, rodado **antes** de suspender, confirma que a bateria está carregando ou cheia — reduzindo a chance de o teste virar um boot completo por bateria vazia no meio do caminho.

## Resumo

- O Steam Deck usa suspend-to-RAM (S3), visível como `mem` em `cat /sys/power/state`.
- Suspend e resume são canais separados no plugin; o vídeo de dormir deve ser curto (≤3 s).
- O resume não tem pressa de timing; imagens estáticas são populares por serem instantâneas.
- Bateria zerada durante o sono resulta em boot completo, não em resume — a animação não aparece.
- `systemctl suspend` aciona a suspensão por software para testes; `journalctl -b -1` confirma o ciclo.

## Exercícios

1. Rode `cat /sys/power/state` e identifique os estados de suspensão suportados pelo seu hardware. Qual deles o Steam Deck usa por padrão e por quê?
2. Use `ffprobe` para obter a duração da animação de suspensão atual. Ela está dentro do limite saudável para o canal de dormir? Justifique.
3. Aplique um tema e teste a suspensão com `systemctl suspend`. Depois confirme, via `journalctl -b -1`, se houve um ciclo de suspend/resume real.
4. Compare o tempo até a tela responder entre uma animação de resume em vídeo e uma em imagem estática. Qual foi mais rápida e por que isso acontece?
5. **Desafio.** Deixe a bateria do deck cair abaixo de 5% durante a suspensão (ou simule desligando o aparelho em sono). Ligue-o de novo e descreva, com base no log, se o que ocorreu foi um resume ou um boot completo — e relacione isso ao sumiço da animação de acordar.