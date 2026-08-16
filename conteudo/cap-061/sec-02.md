Shader cache é o ladrão silencioso do seu SSD. Ele não pede licença, não emite notificação e cresce a cada jogo instalado — inclusive os que você não joga há meses. O pior: o SteamOS baixa shaders *de fundo*, então mesmo depois de uma limpeza, ele volta a preencher o cache assim que você se conecta à internet. Nesta seção você vai entender o que é shader cache, por que ele existe e como domá-lo.

:::objetivos
- Entender por que shaders são pré-compilados no Deck
- Localizar as pastas de shader cache e medir seu tamanho
- Desabilitar ou restringir o pre-cache por título no Steam
- Limpar o cache de forma segura sem quebrar jogos
- Distinguir shader cache Vulkan do cache DXVK e de transcodificação de vídeo
:::

## Por que shaders são compilados antes de jogar

GPUs executam shaders — pequenos programas que decidem a cor de cada pixel, a posição de cada vértice, o reflexo de cada superfície. Shaders são escritos em linguagens como HLSL (DirectX) ou GLSL, mas a GPU só entende binário nativo. No PC, essa compilação acontece durante o jogo: o driver da NVIDIA/AMD compila no primeiro frame e isso gera os famosos *stutters* (travadinhas) quando uma cena nova aparece.

O Steam Deck usa uma GPU AMD RDNA 2 integrada com drivers Mesa/Vulkan, e aqui a Valve foi esperta: em vez de compilar durante a partida, o Steam entrega os shaders **pré-compilados** pelo servidor, no formato exato do seu hardware. O resultado é um jogo liso desde o primeiro frame — mas o preço é ocupar gigabytes de disco.

```terminal
$ du -sh ~/.local/share/Steam/steamapps/shadercache
12G   shadercache
```

Doze gigabytes é um número típico para uma biblioteca de 20 a 30 jogos. Com 100 jogos instalados, esse número pode chegar a 30 GB ou mais.

## Onde o shader cache vive e como medi-lo

O Steam guarda o cache em duas pastas distintas:

| Pasta | Conteúdo |
|---|---|
| `steamapps/shadercache` | Cache principal, organizado por AppID do jogo |
| `steamapps/common/*/ShaderCache` | Cache local, por diretório de jogo (alguns títulos) |

Dentro de `shadercache`, cada jogo ganha uma pasta com seu AppID numérico:

```terminal
$ ls ~/.local/share/Steam/steamapps/shadercache | head -5
1085660
1245620
730
570
```

Você descobre qual AppID corresponde a qual jogo olhando para `steamapps/common`, onde as pastas de jogos trazem o nome legível. Para associar um número a um título, o `appmanifest` resolve:

```terminal
$ grep -l '"730"' ~/.local/share/Steam/steamapps/appmanifest_*.acf
/home/deck/.local/share/Steam/steamapps/appmanifest_730.acf
## 730 = Counter-Strike 2

$ du -sh ~/.local/share/Steam/steamapps/shadercache/730
2.3G   shadercache/730
```

## Como desabilitar ou restringir o pre-cache

A primeira linha de defesa é a interface do Steam. Vá em **Steam → Settings → Downloads** e desabilite `Allow background processing of pre-cached shaders`. Isso impede que o Steam baixe shaders no modo Big Picture, mas não desliga o cache que já existe.

Para granularidade por jogo, a interface do Steam no modo Desktop permite desabilitar o pre-cache de títulos individuais: vá na biblioteca, clique com botão direito no jogo, Properties, e desmarque `Enable Shader Pre-Caching` na aba Updates.

:::dica
Desabilitar o shader cache globalmente no Deck provoca micro-stutters perceptíveis. Melhor que desligar tudo é fazer uma limpeza seletiva: mantenha o cache dos 5 a 10 jogos que você realmente joga no momento e remova o resto.
:::

## Limpando o cache com segurança

O cache é regenerável — se você apagar tudo, o Steam baixa de novo na próxima inicialização (ou compila localmente durante o jogo). Portanto, apagar shader cache **não quebra jogo nenhum**, só reintroduz as travadinhas do primeiro frame até recompilar.

Para limpar o cache de um jogo específico:

```terminal
$ rm -rf ~/.local/share/Steam/steamapps/shadercache/730
```

Para limpar tudo de uma vez:

```terminal
$ du -sh ~/.local/share/Steam/steamapps/shadercache
12G

$ rm -rf ~/.local/share/Steam/steamapps/shadercache/*

$ du -sh ~/.local/share/Steam/steamapps/shadercache
76K
```

:::nota
O Steam recria o diretório `shadercache` automaticamente quando inicia. Você não precisa se preocupar em "recriar a estrutura correta". O que importa é que o conteúdo foi embora.
:::

## Outros caches que valem atenção

O shader cache Vulkan é o maior, mas não o único cache de GPU que cresce. O DXVK (que traduz DirectX 9/10/11 para Vulkan) mantém seu próprio cache de estado:

```terminal
$ du -sh ~/.cache/dxvk-cache 2>/dev/null
$ du -sh ~/.local/share/dxvk-cache 2>/dev/null
```

A localização varia conforme a instalação (Proton, Proton GE, Lutris). Já o cache de transcodificação do Steam, usado para vídeos de fundo de loja e biblioteca, fica em `.steam/steam/steamapps/shadercache` e também pode ser limpo.

## Resumo

- Shader cache existe para eliminar stutters de compilação em tempo real na GPU integrada do Deck.
- O diretório `steamapps/shadercache` é a maior fonte; organiza-se por AppID.
- Apagar o cache é seguro — o Steam rebaixa ou recompila conforme necessário.
- Desabilitar o pre-cache por título evita re-baixar shaders de jogos que você não joga mais.
- Cache DXVK e cache de transcodificação também ocupam espaço e podem ser limpos.

## Exercícios

1. Meça o tamanho total do shader cache com `du -sh ~/.local/share/Steam/steamapps/shadercache`.
2. Liste os cinco AppIDs com maior cache de shader e identifique os jogos correspondentes pelos `appmanifest_*.acf`.
3. Limpe o shader cache de um jogo que você não joga há mais de três meses e confirme quanto espaço foi liberado.
4. Desabilite o pre-cache via interface do Steam para um título específico e observe se ele volta a baixar shaders na próxima inicialização.
5. **Desafio.** Compare o tamanho do cache DXVK (`~/.cache/dxvk-cache`) com o shader cache Vulkan. Execute um jogo por 10 minutos com ambos limpos e meça quanto cada cache cresceu após a sessão.