Enquanto as animações são visuais, o áudio de interface do Steam Deck é igualmente personalizável — e é a parte que mais rapidamente anuncia seu gosto (ou o esgota, dependendo do som escolhido). Os sons de UI do deck são arquivos de áudio discretos, um por evento: navegação, confirmação, notificação e o som de boot. O Animation Changer os trata como um canal próprio, com regras de formato que não são as mesmas do vídeo.

:::objetivos
- Identificar os eventos de interface que têm som no Game Mode
- Compreender os formatos de áudio aceitos para sons de UI
- Inspecionar arquivos de áudio com `ffprobe`
- Trocar sons individuais e o pacote completo
:::

## Quais eventos soam

O Game Mode usa som de interface com parcimônia — nada de blips a cada movimento. Os eventos sonoros mais relevantes que o plugin controla:

- **Boot sound** — o som que acompanha a animação de boot, tocado ao ligar.
- **Navigation** — o clique sutil ao navegar entre itens do menu.
- **Select / confirm** — o som de confirmar uma seleção ou abrir um item.
- **Notification** — o aviso de notificação (amigos, downloads, convites).

Menos é mais aqui. Um som de navegação muito longo ou estridente, repetido 50 vezes por minuto, é a receita para cansar de usar o menu. A comunidade em geral escolhe sons de 50 a 300 milissegundos para os eventos de navegação e confirmação, reservando os mais longos para o boot e a notificação.

```terminal
$ ffprobe -v error -show_entries format=duration \
    -of default=noprint_wrappers=1 select.wav
duration=0.120000
```

A duração de `0.12` s (120 ms) para um som de confirmação está no ponto certo: perceptível, mas breve o suficiente para não se empilhar quando você navega rápido.

## Formatos de áudio aceitos

O canal de som do Steam Deck aceita mais formatos do que o canal de vídeo. A regra prática:

| Formato | Contêiner | Uso típico |
|---|---|---|
| WAV (PCM) | `.wav` | O mais compatível; sem compressão, arquivos maiores |
| MP3 | `.mp3` | Comum, com compressão; funciona na maioria das versões |
| OGG (Vorbis/Opus) | `.ogg` | Livre, leve; suporte varia entre releases |

O **WAV** é a aposta segura: PCM sem compressão, decodificado por tudo, sem dependência de codec. O custo é o tamanho — um WAV de 30 segundos pesa megabytes. Para sons curtos de navegação, isso é irrelevante; para um boot sound artístico mais longo, o MP3 ou OGG vale pelo peso.

```terminal
$ ffprobe -v error -show_entries stream=codec_name,sample_rate,channels \
    -of default=noprint_wrappers=1 select.wav
codec_name=pcm_s16le
sample_rate=44100
channels=2
```

O `ffprobe` revela o detalhe técnico: `pcm_s16le` (PCM 16-bit little-endian), 44100 Hz, estéreo. Esses são parâmetros-padrão que praticamente qualquer sistema reproduz. Se um som baixado não toca, confira aqui — um WAV em `pcm_s24le` ou com sample rate incomum é um suspeito clássico.

:::info
O áudio de interface do Game Mode toca no dispositivo de saída padrão. Se você usa fones Bluetooth, o som de boot pode não tocar no momento do boot porque o áudio ainda não foi roteado para o fone — ele sai pelo alto-falante. Isso é comportamento esperado, não defeito do tema.
:::

## Onde os sons são registrados

Os sons de UI seguem o mesmo padrão de configuração dos vídeos: o plugin escreve caminhos num arquivo que o SteamOS lê.

```json
{
  "sounds": {
    "boot": "/home/deck/homebrew/plugins/AnimationChanger/sounds/boot.mp3",
    "navigation": "/home/deck/homebrew/plugins/AnimationChanger/sounds/navigation.wav",
    "select": "/home/deck/homebrew/plugins/AnimationChanger/sounds/select.wav",
    "notification": "/home/deck/homebrew/plugins/AnimationChanger/sounds/notification.ogg"
  }
}
```

Cada evento aponta para um arquivo independente. O ponto de partida para resolver "mudo" é este: conferir se o caminho existe, se o arquivo é legível e se o formato bate com o suportado.

```terminal
$ ls -la /home/deck/homebrew/plugins/AnimationChanger/sounds/
-rw-r--r-- 1 deck deck  44100 Mar  1 12:00 boot.mp3
-rw-r--r-- 1 deck deck     882 Mar  1 12:00 navigation.wav
-rw-r--r-- 1 deck deck    1323 Mar  1 12:00 select.wav
-rw-r--r-- 1 deck deck   22050 Mar  1 12:00 notification.ogg
```

Repare nos tamanhos: os sons de navegação e seleção (curtos, WAV) têm menos de 1,5 KB, enquanto o boot e a notificação (longos, comprimidos) passam de 20 KB. O tamanho do arquivo, mesmo sem abrir o áudio, já conta a história de duração e formato.

## Testando um som antes de aplicar

Nada de reiniciar o deck para ouvir se um som ficou bom. Você pode reproduzir qualquer candidato direto do terminal:

```terminal
$ pw-play /home/deck/homebrew/plugins/AnimationChanger/sounds/select.wav
```

O `pw-play` é parte do Stack PipeWire, o servidor de áudio do SteamOS. Ele reproduz o arquivo no dispositivo padrão sem precisar abrir editor nenhum. É o jeito mais rápido de audicionar trinta sons de navegação em sequência e escolher o que menos cansa.

```terminal
$ for f in ~/Downloads/sons-candidatos/*.wav; do
    echo "== $f"; pw-play "$f"; sleep 1; done
```

O loop acima toca cada candidato por vez, com uma pausa entre eles. Vinte segundos de "audição" poupam horas de trocar-e-reiniciar pelo plugin.

:::atencao
Há uma diferença entre o som tocado pelo `pw-play` (na sessão desktop, roteado pelo PipeWire) e o som tocado pelo Game Mode no boot. O boot sound sai antes de a sessão de áudio estar totalmente pronta; se ele "engole" o início, é normal. Teste o som final sempre no evento real, não apenas no `pw-play` da área de trabalho.
:::

## Volume e limites

O som de UI do deck respeita o volume do sistema, mas o boot sound tem uma peculiaridade: ele toca antes de o volume do usuário ser aplicado em alguns fluxos. O resultado é um boot sound que soa mais alto ou mais baixo do que você esperava do volume configurado.

```terminal
$ pactl list sinks short
41	alsa_output.pci-0000_04_00.6.analog-stereo	PipeWire	s16le 2ch 44100Hz	SUSPENDED
```

O `pactl list sinks short` lista os dispositivos de saída (sinks) do áudio. O `SUSPENDED` na última coluna indica que o sink está em economia de energia porque nada tocou recentemente — detalhe que explica por que às vezes há um "pop" ou um atraso no primeiro som após um silêncio longo.

## Resumo

- Os eventos sonoros do Game Mode são discretos: boot, navigation, select/confirm e notification.
- WAV (PCM) é o formato mais compatível; MP3 e OGG funcionam mas com variação entre releases.
- Sons de navegação/confirmação curtos (50–300 ms) evitam fadiga; boot e notificação podem ser mais longos.
- `ffprobe` revela codec, sample rate e canais de um arquivo de áudio.
- `pw-play` (PipeWire) permite audicionar um som direto do terminal sem reiniciar o deck.

## Exercícios

1. Liste os sons atuais do seu deck executando `ls -la` na pasta de sons do Animation Changer e descreva, pelo tamanho, quais são curtos e quais são longos.
2. Use `ffprobe` para obter codec, sample rate e canais de um som de navegação. Ele está em WAV PCM? É estéreo?
3. Baixe três sons de confirmação diferentes e audicione-os com `pw-play`, um após o outro, escolhendo o menos cansativo para uso frequente.
4. Aplique um boot sound novo pelo plugin e reinicie o deck. O som tocou no volume que você esperava? Compare com o volume configurado no sistema.
5. **Desafio.** Converta um som de navegação em OGG para WAV com `ffmpeg`, ajustando o sample rate para 44100 Hz e garantindo PCM 16-bit. Valide com `ffprobe` e explique por que essa conversão elimina dúvidas de compatibilidade.