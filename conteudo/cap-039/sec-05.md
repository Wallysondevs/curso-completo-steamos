Se o site parasse nas medalhas, você saberia *se* o jogo roda, mas não *como* fazer rodar. É nos tweaks da comunidade que o ProtonDB vira ferramenta — e a maioria dos ajustes se resume a três coisas: flags de lançamento que a Steam aceita, versões específicas do Proton (oficial, Experimental ou GE), e dependências instaladas pontualmente com `protontricks`. Esta seção cobre o arsenal padrão que aparece em report atrás de report.

:::objetivos
- Entender o que são flags de lançamento e como aplicá-las no deck
- Conhecer as flags mais comuns relatadas pela comunidade
- Distinguir Proton oficial, Proton Experimental e GE-Proton
- Usar `protontricks` para instalar dependências como Visual C++ e Media Foundation
- Saber quando uma flag resolve e quando o problema é mais profundo

:::

## Flags de lançamento: a porta de entrada

Uma flag de lançamento é um parâmetro que a Steam repassa ao Proton antes de iniciar o jogo. Você a configura na janela de propriedades do jogo, no campo "Launch Options". A sintaxe é uma lista de pares `NOME=valor` separados por espaços, onde `%command%` é o placeholder que será substituído pelo executável do jogo. O molde mais comum:

```text
NOME1=valor1 NOME2=valor2 %command%
```

As flags que mais aparecem nos reports do ProtonDB formam um pequeno vocabulário que você encontra repetidamente:

| Flag | Propósito |
|---|---|
| `PROTON_USE_WINED3D=1` | Troca DXVK por OpenGL (WineD3D) — útil em GPU Intel mais antigas |
| `PROTON_NO_ESYNC=1` | Desliga o eventfd synchronizer quando dá crash ou corrupção de save |
| `PROTON_NO_FSYNC=1` | Desliga o futex2 synchronizer (mais extremo, mas resolve certos hangs) |
| `PROTON_ENABLE_NVAPI=1` | Habilita suporte a tecnologias NVIDIA (DLSS, Reflex) |
| `gamemoderun %command%` | Ativa o perfil de performance do GameMode no Linux |
| `DXVK_ASYNC=1` | Compilação assíncrona de shaders (GE-Proton) — reduz stutter em primeiros minutos |
| `WINEDLLOVERRIDES="xaudio2_7=n,b"` | Sobrescreve a implementação nativa de uma DLL do Wine |
| `RADV_PERFTEST=gpl` | Ativa o pipeline de gráficos (GPL) do driver RADV — reduz stutter |

:::dica
Para achar a flag certa de um jogo, não adivinhe: vá nos reports do ProtonDB, filtre por Steam Deck e procure a que mais se repete nos relatos recentes. A comunidade já fez o trabalho de tentativa e erro por você.
:::

## As três famílias de Proton

Entender qual versão de Proton usar é tão importante quanto saber as flags, porque elas não são intercambiáveis — cada uma resolve um tipo de problema.

**Proton oficial** é o que vem com o Steam Deck. Simples, estável, testado pela Valve. É o que você usa por padrão e resolve 70% dos jogos. As versões são numeradas: Proton 7.0, 8.0, 9.0. Cada uma é uma base Wine diferente com backports de compatibilidade.

**Proton Experimental** é o *bleeding edge* da Valve. Versão atualizada quase diariamente com as correções mais recentes. Tem flags extras que o oficial não tem e é a primeira opção quando um jogo recém-lançado não funciona no estável.

**GE-Proton** (Glorious Eggroll) é a terceira via: compilado por um colaborador externo, inclui codecs proprietários (Media Foundation, WMF) que a Valve não pode distribuir por licenciamento. É a solução padrão para vídeos pretos, cutscenes mudas e certos anticheats de espaço de usuário. Requer instalação manual no deck (normalmente pelo ProtonUp-Qt, disponível na Discover).

```terminal
## GE-Proton resolve vídeos pretos com codec proprietário
$ flatpak run net.davidotek.pupgui2
## No ProtonUp-Qt, selecione "Add version", escolha GE-Proton e instale.
```

O ciclo típico no deck: comece pelo Proton oficial; se falhar, teste o Experimental; se ainda falhar com sintoma de codec, pule para o GE-Proton. Esse roteiro é exatamente o que os reports melhores descrevem.

## `protontricks`: a chave inglesa

Às vezes nem flag nem Proton resolvem, e o jogo precisa de uma dependência do ecossistema Windows: Visual C++ redistribuível, .NET Framework, fontes TrueType, Media Foundation. É aí que entra o `protontricks` — um wrapper sobre o `winetricks` que opera dentro do prefixo Wine de um jogo específico.

```terminal
$ protontricks 1145360 vcrun2019
------------------------------------------------------
Running /usr/bin/wine cmd.exe /c echo '%AppData%'
[...]
Executing wine vc_redist.x64.exe within /home/deck/.local/share/Steam/steamapps/compatdata/1145360/pfx
------------------------------------------------------
Installation completed successfully
```

O número `1145360` é o AppID; `vcrun2019` é o componente que ele instala. O comando localiza automaticamente o prefixo do jogo em `compatdata/<appid>/pfx` e roda o instalador lá dentro.

:::perigo
`protontricks` modifica arquivos do prefixo Wine. Se você rodar o comando errado (AppID trocado, componente errado), pode corromper o prefixo de outro jogo e fazer ambos pararem de funcionar. Confira o AppID na URL da Steam Store antes de executar. Se algo quebrar, você pode recriar o prefixo apagando `compatdata/<appid>` — o jogo gera um novo na próxima inicialização, mas você perde saves locais não sincronizados.
:::

A lista de componentes mais pedidos nos reports segue um padrão:

```terminal
$ protontricks 1145360 vcrun2019    ## Visual C++ 2019
$ protontricks 1145360 dotnet48     ## .NET Framework 4.8
$ protontricks 1145360 corefonts    ## Fontes TrueType da Microsoft
$ protontricks 1145360 mf-install   ## Media Foundation (codecs de vídeo)
```

Para saber quais componentes existem e são instaláveis, `protontricks --list` mostra tudo, inclusive com descrições curtas.

## Quando a flag é sintoma, não solução

Uma flag como `PROTON_NO_ESYNC=1` resolve o sintoma (o jogo para de crashar), mas a causa é um bug no esync que pode ser corrigido numa versão futura do Proton. Reports bons documentam a flag, mas também mencionam se ela ainda é necessária na versão atual. Vá nos reports mais novos e veja se alguém diz "removi a flag e continuou funcionando" — isso é sinal de que o bug foi consertado e você pode limpar as launch options.

## Resumo

- Flags de lançamento vão no campo "Launch Options" da Steam com a sintaxe `FLAG=valor %command%`.
- As mais comuns: `PROTON_USE_WINED3D`, `PROTON_NO_ESYNC`, `gamemoderun`, `DXVK_ASYNC`.
- Proton oficial cobre a maioria, Experimental traz correções frescas, GE-Proton adiciona codecs proprietários.
- `protontricks <appid> <componente>` instala dependências Windows dentro do prefixo do jogo.
- Componentes mais pedidos: `vcrun2019`, `dotnet48`, `corefonts`, `mf-install`.
- Verifique nos reports se uma flag ainda é necessária — bugs corrigidos dispensam o workaround.

## Exercícios

1. Crie uma launch option fictícia para um jogo que exige três das flags da tabela e explique o papel de cada uma.
2. No seu deck, localize o ProtonUp-Qt na Discover (se ainda não instalado) e, sem instalar nada agora, identifique as versões de GE-Proton disponíveis.
3. Abra um prefixo de jogo real com `protontricks --gui` (interface gráfica) e navegue até "Select the default wineprefix" para listar os componentes já instalados.
4. Leia cinco reports de um jogo `Gold` e anote todas as flags e componentes mencionados. Monte uma "receita combinada".
5. **Desafio.** Pegue um jogo que você já tem no deck e que precise de uma das dependências listadas. Instale o componente com `protontricks`, teste o jogo e documente os passos e o resultado, verificando se a flag ou dependência realmente fez diferença.