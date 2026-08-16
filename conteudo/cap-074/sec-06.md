A personalização visual do Deck não se resume a pixels: os **sons da interface** — o clique ao navegar, o "plim" ao confirmar, a música ambiente da home — também são substituíveis. O que um dia foi o plugin **Audio Loader** hoje é, na maioria das instalações, uma aba própria do CSS Loader. Saber onde esses áudios vivem e como são trocados fecha o círculo da customização e evita a frustração de baixar um "tema de som" e não ouvir nada.

:::objetivos
- Entender como o Audio Loader / aba de sons do CSS Loader substitui os áudios da interface
- Instalar e ativar um pacote de som da navegação
- Distinguir som de navegação de música ambiente da home
- Localizar os arquivos de áudio e a configuração em disco
- Diagnosticar por que um pacote de som não toca
:::

## De onde vêm os sons da interface

Os cliques e transições do modo Gaming não são gerados na hora: são arquivos de áudio embutidos no cliente Steam. Quando você navega pelo menu, o cliente dispara a reprodução de um desses arquivos nos momentos-chave. O Audio Loader substitui **o arquivo que toca em cada evento** por outro, escolhido pelo pacote instalado — deixando intactos o gatilho e a lógica de quando tocar.

A estrutura em disco deixa isso claro. Um pacote de som instalado é uma pasta com arquivos nomeados de forma a casar com os eventos:

```terminal
$ find ~/homebrew/sounds/Pixel\ UI -maxdepth 2 | head -20
/home/deck/homebrew/sounds/Pixel UI/pack.json
/home/deck/homebrew/sounds/Pixel UI/sounds/back.wav
/home/deck/homebrew/sounds/Pixel UI/sounds/confirm.wav
/home/deck/homebrew/sounds/Pixel UI/sounds/nav_up.wav
/home/deck/homebrew/sounds/Pixel UI/sounds/nav_down.wav
/home/deck/homebrew/sounds/Pixel UI/sounds/launch.wav
/home/deck/homebrew/sounds/Pixel UI/sounds/ambient_music.ogg
```

O `pack.json` é o manifesto do pacote, e a pasta `sounds/` traz um arquivo por evento. O nome de cada arquivo (`back`, `confirm`, `nav_up`, `launch`) é a chave que o carregador usa para saber quando tocar o quê. Trocar o pacote é, na prática, apontar esses nomes para outros arquivos.

## O manifesto de um pacote de som

Assim como o tema CSS tem `theme.json`, o pacote de áudio tem `pack.json`. Lendo um manifesto real:

```json
{
  "name": "Pixel UI",
  "author": "SomeAuthor",
  "version": "1.0.0",
  "format": 2,
  "sounds": {
    "back": "sounds/back.wav",
    "confirm": "sounds/confirm.wav",
    "nav_up": "sounds/nav_up.wav",
    "nav_down": "sounds/nav_down.wav",
    "launch": "sounds/launch.wav",
    "ambient_music": "sounds/ambient_music.ogg"
  }
}
```

O objeto `sounds` é o coração: mapeia cada **nome de evento** para o **caminho relativo** do arquivo. Dois formatos de evento importam para o usuário final. Os eventos de **navegação** (`nav_up`, `nav_down`, `back`, `confirm`) são efeitos curtos. O `ambient_music` é diferente: é uma faixa longa que toca em loop enquanto você está na home, e é desligada por padrão em muitos pacotes por consumir recurso e incomodar.

:::info
O campo `format` do `pack.json` existe porque o formato de manifesto do Audio Loader evoluiu. Pacotes antigos com `format: 1` usavam um mapeamento diferente e podem não carregar em instalações recentes. Se um pacote antigo não aparece na lista, a primeira hipótese é incompatibilidade de formato.
:::

## Instalando e ativando

O fluxo pelo painel é o mesmo dos temas: aba *Sounds* do CSS Loader, escolher o pacote, ativar. A ativação é exclusiva — apenas um pacote de som ativo por vez, porque dois pacotes tentariam responder ao mesmo evento ao mesmo tempo. Ao ativar um segundo, o primeiro é desativado automaticamente.

Do terminal, você confirma o pacote ativo e inspeciona o formato dos arquivos:

```terminal
$ file ~/homebrew/sounds/Pixel\ UI/sounds/*.wav
/home/deck/homebrew/sounds/Pixel UI/sounds/back.wav:         RIFF (little-endian) data, WAVE audio, mono 22050 Hz
/home/deck/homebrew/sounds/Pixel UI/sounds/confirm.wav:      RIFF (little-endian) data, WAVE audio, mono 22050 Hz
$ file ~/homebrew/sounds/Pixel\ UI/sounds/ambient_music.ogg
/home/deck/homebrew/sounds/Pixel UI/sounds/ambient_music.ogg: Ogg data, Vorbis audio, stereo, 44100 Hz
```

O `file` lê o cabeçalho e revela o formato sem depender da extensão. Sons de navegação costumam ser WAV mono em taxa baixa (22 kHz) — leves o suficiente para tocar rápido. A música ambiente é Ogg Vorbis (mais comprimida, adequada a faixas longas). Essa diferença de formato é deliberada: efeitos curtos priorizam latência; música prioriza tamanho.

## Por que um pacote de som não toca

O sintoma mais relatado é o silêncio total mesmo com o pacote ativo. As causas, em ordem de probabilidade:

| Causa | Como confirmar |
|---|---|
| Volume da interface zerado | Checar o volume de UI nas configurações do Steam |
| Pacote com formato incompatível (`format` antigo) | Ler o `format` no `pack.json` |
| Nomes de evento errados no manifesto | Comparar as chaves com o padrão do carregador |
| O pacote só contém `ambient_music` (desativado) | Ver se há arquivos de navegação em `sounds/` |

A última causa é traiçoeira: muitos "pacotes de som" na comunidade são, na verdade, **só música ambiente** — trocam a trilha da home, sem nenhum efeito de navegação. Se o nome do pacote fala em "vibe" ou "music", desconfie.

```terminal
$ ls ~/homebrew/sounds/Chill\ Music/sounds/
ambient_music.ogg
```

Se a pasta `sounds/` contém apenas `ambient_music.ogg`, o pacote não vai mudar os cliques de navegação — porque não há arquivos para esses eventos. É o tipo de expectativa que se alinha antes de instalar.

:::dica
Para ter feedback imediato se o pacote funciona, ative-o e navegue com o direcional pelos menus. Os eventos `nav_up` e `nav_down` disparam a cada pressão; se você não os ouvir, o problema está no pacote ou no volume da UI, não em uma configuração escondida.
:::

## Resumo

- Os sons da interface são arquivos embutidos no cliente Steam, disparados por eventos de navegação.
- Um pacote de áudio é uma pasta com `pack.json` (manifesto) e `sounds/` com um arquivo por evento.
- Efeitos de navegação usam WAV mono de baixa taxa; música ambiente usa Ogg Vorbis comprimido.
- Só um pacote de som fica ativo por vez; pacotes com `format` antigo podem não carregar.
- Um pacote que só tem `ambient_music.ogg` muda só a trilha da home, não os cliques.

## Exercícios

1. Liste `~/homebrew/sounds/` e identifique os pacotes instalados. Quantos há e quantos contêm arquivos de navegação em `sounds/`?
2. Use `file` nos arquivos de um pacote e descreva os formatos encontrados. Qual evento usa Ogg e por quê?
3. Leia o `pack.json` de um pacote e anote o campo `format` e as chaves do objeto `sounds`.
4. Ative um pacote de som e teste os eventos `nav_up` e `nav_down` com o direcional. Eles tocam? Se não, siga a tabela de causas e identifique a mais provável.
5. **Desafio.** Um amigo baixou um pacote "Chill Music" e reclama que "os cliques não mudaram". Usando apenas o terminal, verifique a estrutura do pacote e escreva a resposta que você daria, justificando com o conteúdo da pasta `sounds/`.
