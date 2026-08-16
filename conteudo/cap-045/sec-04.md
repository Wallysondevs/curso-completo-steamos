Se você só lembrar de uma ferramenta deste capítulo, que seja o ProtonTricks. Ele é o canivete suíço do Proton: instala runtimes ausentes, executa comandos dentro do prefixo, abre o `winecfg`, o `regedit` e resolve uma constelação de problemas que, de outra forma, exigiriam navegação manual por dezenas de pastas.

:::objetivos
- Instalar o ProtonTricks via Flatpak no SteamOS
- Navegar pela interface gráfica e linha de comando do `protontricks`
- Instalar componentes ausentes (DirectX, .NET, Visual C++ Runtimes) em prefixos específicos
- Executar comandos arbitrários dentro do Wine de um jogo
- Diagnosticar prefixos corrompidos e restaurá-los
:::

## Instalação e primeiro contato

O ProtonTricks está no Flathub e é instalado como qualquer Flatpak:

```terminal
$ flatpak install flathub com.github.Matoking.protontricks
$ flatpak run com.github.Matoking.protontricks --gui
```

A interface gráfica lista todos os jogos Steam instalados com seus AppIDs. Clicar em um jogo abre o menu de ações: "Select the default wineprefix", "Install an application", "Run winecfg", "Run regedit" e "Run a command shell".

Para quem prefere terminal — e neste capítulo você verá que o terminal é quase sempre mais rápido — o comando equivalente é:

```terminal
$ protontricks --gui    ## interface gráfica
$ protontricks -l        ## lista todos os jogos instalados
```

A lista é longa. Filtre com `grep`:

```terminal
$ protontricks -l | grep -i witcher
Found the following games:
292030 - The Witcher 3: Wild Hunt
499450 - The Witcher 3: Wild Hunt - Game of the Year Edition
```

O número à esquerda é o AppID. Toda operação com `protontricks` usa esse número como referência.

## Instalando componentes e runtimes

Este é o caso de uso mais frequente. Um jogo abre e fecha sem mensagem de erro, ou reclama de "MSVCP140.dll" ou "XINPUT1_3.dll" ausente. O ProtonTricks resolve instalando o componente correto:

```terminal
$ protontricks 292030 d3dx9 d3dcompiler_43 vcrun2022
```

A sintaxe é: `protontricks <AppID> <componente1> <componente2> ...`. O comando acima instala DirectX 9, o compilador de shader D3D e o Visual C++ 2022 no prefixo do The Witcher 3.

Os componentes mais requisitados:

| Componente | O que resolve |
|---|---|
| `d3dx9` | Jogos DirectX 9 com erros gráficos ou tela preta |
| `d3dcompiler_43` | Falta de compilador de shader (jogos Unity antigos) |
| `vcrun2022` | Erro "MSVCP140.dll / VCRUNTIME140.dll not found" |
| `vcrun2019` | O mesmo, para runtime 2015-2019 |
| `dotnet48` | Jogos que exigem .NET Framework 4.8 |
| `dotnet472` | Ferramentas de modding que precisam de .NET 4.7.2 |
| `xact` | Áudio ausente em jogos Xbox 360 portados |
| `physx` | Jogos com NVIDIA PhysX (Borderlands 2, Mirror's Edge) |
| `lavfilters` | Codecs de vídeo para cutscenes (jogos japoneses, FMV) |
| `quartz` | Reprodução de vídeos WMV/MPEG (Fallout 3, Oblivion) |
| `mf-install` | Media Foundation (cutscenes em jogos como Resident Evil) |

Um caso real: GTA IV não reproduz as cutscenes porque depende de codecs Windows Media. A solução é conhecida:

```terminal
$ protontricks 12210 quartz wmp11 devenum
## Instalando quartz... OK
## Instalando wmp11... OK  
## Instalando devenum... OK
## Agora o jogo reproduz as cutscenes.
```

:::nota
O `mf-install` (Media Foundation) não é um componente oficial do Winetricks, mas um script mantido pela comunidade. Ele é instalado separadamente e aparece no ProtonTricks como "Install Media Foundation". Se as cutscenes de Resident Evil ou Street Fighter não rodam, é a primeira coisa a tentar.
:::

## Executando comandos no prefixo

A flag `-c` ou `--command` executa qualquer comando dentro do Wine do prefixo. Isso abre possibilidades que vão muito além de instalar runtimes:

```terminal
$ protontricks -c 'wine control' 292030
## Abre o Painel de Controle do Windows dentro do prefixo

$ protontricks -c 'wine uninstaller' 292030
## Abre o "Adicionar ou Remover Programas" do Windows

$ protontricks -c "wine 'C:\Program Files\MyTool\tool.exe'" 292030
## Executa um programa específico instalado no prefixo
```

Para um shell interativo (cmd.exe do Wine), use:

```terminal
$ protontricks 292030 shell
Microsoft Windows 6.1.7601 (Proton 9.0)

C:\>dir "Program Files (x86)\Steam\steamapps\common"
 Volume in drive C has no label.
 Volume Serial Number is 1234-ABCD

 Directory of C:\Program Files (x86)\Steam\steamapps\common

The Witcher 3     <DIR>
[...]

C:\>exit
```

Esse shell é extremamente útil para verificar se arquivos de mod foram copiados para o lugar certo, testar executáveis e rodar instaladores .exe que exigem interação.

## `winecfg` e `regedit` pelo ProtonTricks

O `winecfg` permite ajustar a versão do Windows emulada (Windows 7, 10, etc.) e configurar bibliotecas (substituir DLLs do Wine por nativas). O `regedit` acessa o registro do prefixo:

```terminal
$ protontricks 292030 winecfg
## Abre janela de configuração do Wine para este prefixo

$ protontricks 292030 regedit
## Abre o Editor de Registro do prefixo
```

No `winecfg`, a aba "Libraries" é a mais relevante para mods: você pode forçar o Wine a usar uma DLL nativa em vez da implementação embutida. Por exemplo, se um mod precisa da `dinput8.dll` nativa, adicione `dinput8` como "native, then builtin" no `winecfg`.

## Diagnóstico e reparo de prefixos

Um prefixo corrompido manifesta-se de várias formas: o jogo não abre, abre e fecha silenciosamente, ou o ProtonTricks não lista o AppID. Antes de reinstalar tudo, tente:

```terminal
## 1. Verificar a integridade dos arquivos do prefixo
$ ls -la ~/.steam/steam/steamapps/compatdata/292030/pfx/*.reg
-rw-r--r-- 1 deck deck 1.2M Mar 15 14:22 system.reg
-rw-r--r-- 1 deck deck 892K Mar 15 14:22 user.reg
-rw-r--r-- 1 deck deck  16K Mar 15 14:22 userdef.reg

## 2. Fazer backup do prefixo antes de qualquer intervenção
$ cp -r ~/.steam/steam/steamapps/compatdata/292030 ~/backups/prefix-witcher3-$(date +%Y%m%d)

## 3. Regenerar o prefixo (atenção: perde saves locais!)
$ rm -rf ~/.steam/steam/steamapps/compatdata/292030
## Na próxima inicialização, o Proton recriará o prefixo
```

:::perigo
Apagar o prefixo remove saves locais, configurações e mods instalados manualmente. Muitos jogos salvam na nuvem Steam, mas nem todos. Faça backup antes de deletar: `cp -r compatdata/<AppID> ~/backups/`. Depois que o Proton recriar o prefixo, você pode copiar seletivamente os saves de volta de `drive_c/users/steamuser/Documents/My Games/`.
:::

## Resumo

- O ProtonTricks é a ferramenta central para instalar runtimes, abrir shells e configurar prefixos Wine no Deck.
- Instale componentes com `protontricks <AppID> <componente>`; os mais comuns são `d3dx9`, `vcrun2022`, `dotnet48`.
- `protontricks <AppID> shell` abre um cmd.exe interativo dentro do prefixo.
- `protontricks <AppID> winecfg` e `regedit` permitem ajustar bibliotecas e registro.
- Sempre faça backup do prefixo com `cp -r` antes de qualquer intervenção destrutiva.

## Exercícios

1. Liste todos os jogos instalados com `protontricks -l` e identifique três que aparecem com AppIDs diferentes do que você esperava.
2. Instale `vcrun2022` e `d3dx9` no prefixo de um jogo que você sabe que precisa desses runtimes. Teste antes e depois.
3. Abra um `shell` dentro do prefixo de um jogo, navegue até a pasta do jogo e execute `dir *.exe`. Quantos executáveis o jogo tem?
4. Use `winecfg` para alterar a versão do Windows emulada de um prefixo de Windows 7 para Windows 10. O jogo ainda funciona?
5. **Desafio.** Corrompa intencionalmente um prefixo (renomeie `system.reg`), observe o comportamento e restaure-o a partir do backup. Documente o que acontece com saves locais e configurações.