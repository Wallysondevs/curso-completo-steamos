Um dos problemas mais frustrantes do Proton não é um crash: é ver a introdução do jogo virar uma tela preta ou verde enquanto o áudio segue normal. Isso é o sintoma clássico de **FMV** (Full Motion Video) — as cutscenes pré-renderizadas em codecs como WMV, MPEG e, principalmente, o Media Foundation (MF) da Microsoft. O motivo é político e técnico ao mesmo tempo: vários codecs desses formatos são patenteados, e a Valve não pode embarcá-los no Proton oficial. Esta seção explica como destravar os vídeos.

:::objetivos
- Entender por que FMVs falham no Proton e não em outros jogos
- Reconhecer o sintoma de codec ausente no log
- Aplicar o Proton GE como solução imediata para codecs
- Instalar o Media Foundation manualmente com `protontricks`
- Verificar e remover codecs quebrados no prefixo
:::

## O buraco do Media Foundation

O Proton oficial, por questões legais, não inclui os codecs de vídeo proprietários que muitos jogos pré-renderizados usam. Quando o jogo toca uma cutscene nesses formatos, o Proton tenta chamar o Media Foundation, não encontra, e você recebe uma tela preta/verde com áudio. O resto do jogo funciona perfeitamente, o que confunde o diagnóstico.

O Proton GE resolve isso de raiz: ele compila os codecs com o suporte a formatos patenteados, então as cutscenes simplesmente tocam. Essa é a solução mais rápida e cobre a grande maioria dos títulos.

:::info
GloriousEggroll mantém o Proton GE como um projeto independente, sem as restrições legais que a Valve precisa respeitar ao distribuir comercialmente. Por isso ele pode embarcar o que o Proton oficial não pode. É seguro, mas fora do suporte oficial da Valve.
:::

## Reconhecendo o sintoma no log

Antes de instalar qualquer coisa, confirme que é mesmo problema de codec. Ative o log e procure pelas menções a `mfplat`, `Media Foundation` ou falhas de `CreateVideoDecoder`:

```terminal
$ PROTON_LOG=1
$ grep -iE 'mfplat|media foundation|wmf|video decod' ~/steam-<appid>.log | head
warn:  stub mfplat.dll.MFCreateMediaSession
err:   Failed to create video decoder
fixme: mfplat:mfplat_wine_media_source_init stub
```

As linhas `stub` em `mfplat.dll` são o retrato do problema: a função existe no Proton (para o jogo não quebrar na hora de chamar), mas é um *stub* — um esqueleto que não faz nada de útil. O vídeo simplesmente não é decodificado.

## A solução rápida: Proton GE

Pelo ProtonUp-Qt (disponível na Discover do modo desktop), instale a versão mais recente do GE-Proton e selecione-a no jogo. O processo em terminal, se você preferir, começa confirmando o que já está instalado:

```terminal
$ ls ~/.steam/steam/compatibilitytools.d/ 2>/dev/null || ls ~/.steam/root/compatibilitytools.d/ 2>/dev/null
GE-Proton9-16/
$ ls ~/.steam/steam/compatibilitytools.d/GE-Proton9-16/
proton  toolmanifest.vdf  ...
```

A pasta `compatibilitytools.d` é onde ficam as ferramentas de compatibilidade de terceiros. Depois de instalar, um menu suspenso em Propriedades → Compatibilidade passa a listar o `GE-Proton9-16` ao lado dos Proton oficiais. Selecione, rode o jogo e teste a cutscene.

:::dica
Depois de trocar para um Proton diferente, o prefixo do jogo costuma ser **recriado** quando a versão é incompatível. Seus saves ficam nas pastas do jogo (ncloud, Documents), mas ajustes do prefixo somem. Faça a troca antes de mexer em outros detalhes do prefixo.
:::

## A solução manual: Media Foundation via protontricks

Se o GE não for uma opção (ou você quiser manter o Proton oficial), dá para instalar o Media Foundation diretamente no prefixo do jogo usando o `protontricks`. Primeiro descubra o appid, depois rode o instalador:

```terminal
$ protontricks 405100 mf-install
Running mf-install on prefix for app 405100
[..] Installing Media Foundation and codecs ...
[..] Done.
```

O comando `mf-install` é um atalho que aplica o script de instalação do Media Foundation e dos codecs no prefixo especificado. O número `405100` é o appid que você aprendeu a descobrir na [primeira seção](#/cap-042/sec-01).

:::atencao
`protontricks` precisa do prefixo já criado — ou seja, o jogo tem que ter sido lançado pelo menos uma vez com aquele Proton. Se você rodar `mf-install` antes do primeiro launch, o comando avisa que o prefixo não existe. Lance o jogo uma vez (mesmo que falhe na cutscene) e só então instale os codecs.
:::

## Conferindo e revertendo

Depois de aplicar o `mf-install`, vale confirmar o que mudou dentro do prefixo e, se algo piorou, reverter para o estado limpo:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/405100/pfx/drive_c/windows/system32/ | grep -i mf
mf.dll
mfplat.dll
mfreadwrite.dll
...
$ protontricks 405100 --gui
```

O primeiro comando confirma que as DLLs do Media Foundation agora existem no `system32` do prefixo. O segundo abre a interface gráfica do `protontricks`, de onde você instala ou remove componentes individuais (`winetricks`) caso precise afinar a instalação.

Se a instalação quebrar o jogo (raro, mas possível), a saída limpa é deletar o prefixo e deixar o Proton recriá-lo no próximo launch:

```terminal
$ rm -rf ~/.steam/steam/steamapps/compatdata/405100
```

:::perigo
`rm -rf` no prefixo apaga também qualquer ajuste que você tenha feito ali dentro (dlls, configs, saves guardados no `drive_c`). Antes de apagar, confirme que os saves não vivem dentro do prefixo — costumam ficar no diretório principal do jogo ou na nuvem, mas alguns títulos os colocam em `drive_c/users/steamuser/Documents`.
:::

## Resumo

- FMVs falham por codecs patenteados que o Proton oficial não pode distribuir.
- O sintoma é cutscene preta/verde com áudio, jogo funcionando no resto.
- No log, funções `stub` em `mfplat.dll` indicam codec ausente.
- Proton GE embarca os codecs e resolve a maioria dos casos sem mexer em nada.
- `protontricks <appid> mf-install` instala o Media Foundation manualmente no prefixo.
- Apagar o prefixo em `compatdata/` força o Proton a recriá-lo do zero.

## Exercícios

1. Num jogo com cutscene, ative `PROTON_LOG=1` e grep` por `mfplat` no log para confirmar o codec ausente.
2. Instale o Proton GE via ProtonUp-Qt e teste a mesma cutscene. Registre se o problema sumiu sem outras mudanças.
3. No Proton oficial, execute `protontricks <appid> mf-install` e confira com `ls .../pfx/drive_c/windows/system32 | grep -i mf` que as DLLs apareceram.
4. Abra o `protontricks <appid> --gui` e navegue até os componentes instalados para ver o que o `mf-install` registrou.
5. **Desafio.** Crie um cenário de reversão: instale os codecs, verifique que funcionam, depois apague o prefixo e comprove que o Proton recria um `pfx` limpo no próximo launch — observando, pelo log, se a cutscene volta a falhar.
