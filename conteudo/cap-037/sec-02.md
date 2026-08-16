O coração do Proton é o Wine — mas não o Wine que você instala com `pacman -S wine`. É uma versão modificada, mantida pela Valve com dezenas de patches que ainda não chegaram ao upstream. Sem entender o que exatamente o Wine faz, você não consegue diagnosticar erros como "vcrun2019 ausente", "prefixo de 32 bits quebrado" ou "tela preta com áudio ativo". Esta seção explica a fundo a camada de compatibilidade que torna o impossível possível.

:::objetivos
- Entender como o Wine traduz chamadas da API Win32 para chamadas do Linux
- Inspecionar a versão do Wine empacotada dentro do Proton
- Compreender o conceito de prefixo Wine e como o Proton o utiliza
- Diferenciar o Wine vanilla do Wine modificado pela Valve
- Diagnosticar problemas básicos de prefixo usando ferramentas do Wine
:::

## Tradução, não emulação

Wine significa *Wine Is Not an Emulator*, e o nome é uma tese. Um emulador como o QEMU simula uma máquina inteira (processador, memória, dispositivos) por software, e roda o sistema operacional convidado dentro dela. O Wine não faz isso: ele executa o código do jogo diretamente no processador x86-64 do Steam Deck, nativamente, e traduz apenas as chamadas de API — as solicitações que o programa faz ao sistema operacional.

Quando um jogo chama `CreateFileW()`, o Wine converte o caminho Windows (`C:\Program Files\...`) para um caminho Linux (`~/.wine/drive_c/Program Files/...`), chama `open()` do Linux e devolve o resultado no formato que o jogo espera. Quando chama `Direct3DCreate9()`, o Wine intercepta e pode delegar ao DXVK (no caso do Proton). Tudo acontece em espaço de usuário, sem privilégios de kernel.

A consequência prática é que o desempenho não sofre a penalidade de um emulador: o código do jogo roda na velocidade nativa da CPU. O custo está na tradução das chamadas, e é por isso que certas operações — loops que chamam funções gráficas milhares de vezes por frame — se beneficiam de técnicas como *batching* no DXVK, que veremos na seção 3.

## Onde o Wine mora dentro do Proton

O Proton é um empacotamento. Dentro da pasta de cada versão (por exemplo, `Proton 9.0`), há duas árvores de Wine: uma para prefixos de 32 bits e outra para 64 bits. O executável principal está dentro de `dist/bin/wine`:

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/bin/ | head -12
msidb
msiexec
notepad
proton
regedit
regsvr32
rpcss
rundll32
start
uninstaller
wine
wine-preloader
```

Os nomes são familiares a qualquer usuário do Windows: `regedit` é o editor de registro, `msiexec` é o instalador MSI, `notepad` é o bloco de notas. O Proton expõe essas ferramentas para que você possa interagir com um prefixo Wine como se estivesse no Windows — desde que use o executável do Wine que vem com ele, não o Wine do sistema.

A versão exata do Wine empacotada pode ser verificada com o próprio binário:

```terminal
$ ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/bin/wine --version
wine-9.0 (Proton 9.0-4)
```

Repare que o Proton adiciona o próprio número à saída. É um Wine 9.0, mas com os patches da Valve aplicados sobre ele — e esses patches fazem toda a diferença.

## Prefixos: cada jogo no seu mundo

No Windows, todo programa compartilha um único diretório `C:\Windows`, um mesmo registro, as mesmas DLLs. No Wine, essa ideia de "instalação do Windows" é replicada para cada jogo (ou conjunto de jogos) através de um **prefixo** — uma pasta que contém uma árvore `C:` falsa, incluindo `windows/`, `windows/system32/` e `users/`.

O Proton cria um prefixo separado para cada jogo dentro do diretório `compatdata`:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/ | head -5
1086940
1245620
1462040
1896700
2194530
```

Cada número é o `appid` do jogo no Steam — o mesmo que aparece na URL da loja (`store.steampowered.com/app/1086940`). Dentro da pasta do prefixo, a estrutura replica um Windows minimalista:

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/1086940/pfx/
dosdevices/
drive_c/
system.reg
user.reg
userdef.reg
win.ini
```

Os arquivos `.reg` formam o registro do Windows daquele prefixo. `drive_c/` contém a árvore `C:` virtual. Isso significa que instalar um mod, um launcher ou uma dependência como o Visual C++ Runtime afeta **apenas aquele jogo**, sem contaminar os outros. É um isolamento sem containers: leve, rápido e específico.

:::dica
Se um prefixo corromper — travamentos, erros estranhos, tela preta — você pode apagá-lo e deixar o Proton recriar tudo na próxima execução. Para isso, feche o Steam, renomeie a pasta do appid em `compatdata/` (ex.: `1086940` → `1086940.bak`) e abra o jogo de novo. O Proton refaz o prefixo do zero. Se o erro sumir, você pode apagar o `.bak`.
:::

## Wine vanilla vs. Wine do Proton

O Wine "vanilla" (upstream) é mantido pelo projeto WineHQ e empacotado pelas distribuições. O Wine do Proton é compilado com patches que ainda não foram aceitos upstream ou que são específicos para o Steam Runtime e para jogos. As diferenças principais:

| Área | Wine vanilla | Wine do Proton |
|---|---|---|
| Direct3D | Traduz D3D para OpenGL (wined3d) | Delega ao DXVK (Vulkan) por padrão |
| Áudio | Suporte básico via winepulse.drv | Integração com FAudio e PulseAudio otimizada |
| Steamworks | Sem suporte nativo | Patches para Steam API e Steam Input |
| Fullscreen | Comportamento variável | Patches para modo fullscreen virtual (VDX) |
| Anti-cheat | Limitado | Integração experimental com EAC/BattlEye via user-space |
| Codecs de mídia | Depende de codecs do sistema | Empacota codecs via Steam Runtime |

O resultado visível: jogos que funcionam no Proton frequentemente falham no Wine vanilla porque dependem de um desses patches. E o inverso também acontece — em casos raros, o Wine vanilla roda algo que o Proton quebrou por conta de uma modificação ainda instável.

```terminal
$ winetricks --version
20250102-next - sha256sum: 9c1b2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2
```

O `winetricks` é um script auxiliar para instalar bibliotecas e componentes do Windows dentro de um prefixo (como `vcrun2022`, `d3dx9`, `dotnet48`). No contexto do Proton, ele é menos usado porque o próprio Proton já lida com a maioria das dependências através do Steam Runtime. Mas, em cenários de diagnóstico, pode ser útil para testar se uma DLL específica resolve o problema.

:::atencao
Rodar `winetricks` num prefixo do Proton sem cuidado pode quebrar a configuração que o Proton montou. O `winetricks` espera um Wine "normal" e pode sobrescrever DLLs que o Proton já patcheou. Só use em prefixos isolados para teste, nunca no prefixo principal de um jogo que você quer preservar.
:::

## O registro e a configuração do Wine

O Wine armazena configurações no registro do prefixo, acessível via `wine regedit`. Para o Proton, isso é delegado a arquivos `.reg` que o Steam manipula. Mas você pode inspecionar o estado:

```terminal
$ WINEPREFIX=~/.steam/steam/steamapps/compatdata/1086940/pfx \
  ~/.steam/steam/steamapps/common/Proton\ 9.0/dist/bin/wine regedit /E - 2>/dev/null | head -8

Windows Registry Editor Version 5.00

[HKEY_LOCAL_MACHINE\Software]
[HKEY_LOCAL_MACHINE\Software\Microsoft]
[HKEY_LOCAL_MACHINE\Software\Microsoft\Windows]
```

A variável `WINEPREFIX` diz ao Wine qual prefixo usar. Se ela não for definida, o Wine usa `~/.wine`, que é o prefixo padrão — e que **não** é usado pelo Proton. Essa é outra fonte comum de confusão: ao rodar `wine` na linha de comando sem `WINEPREFIX`, você está usando um prefixo diferente do que o Steam criou.

## Resumo

- Wine traduz chamadas da API Win32 para chamadas nativas do Linux; não é emulador, é tradutor.
- Cada versão do Proton contém seu próprio Wine compilado com patches da Valve e da CodeWeavers.
- Prefixos Wine são instalações isoladas do Windows; o Proton cria um por jogo em `compatdata/<appid>/pfx/`.
- O Wine do Proton difere do Wine vanilla em gráficos (DXVK), áudio (FAudio), Steamworks e fullscreen.
- `winetricks` e `wine regedit` são ferramentas de diagnóstico, mas devem ser usadas com cautela em prefixos do Proton.

## Exercícios

1. Localize o binário do Wine dentro de uma versão do Proton instalada e rode `<caminho>/wine --version`. Compare o número com o do `proton --version` da seção 1.
2. Liste os primeiros 5 diretórios em `~/.steam/steam/steamapps/compatdata/`. Para um deles, verifique se o prefixo tem a estrutura esperada (`pfx/drive_c`, `pfx/system.reg`, etc.).
3. Usando `WINEPREFIX`, exporte o registro de um prefixo de jogo com `regedit /E -`. Identifique duas chaves que indicam que o registro é de uma instalação Windows.
4. Rode `winetricks --version` e confirme se o script está instalado. Se não estiver, descreva como você o instalaria pelo gerenciador de pacotes do SteamOS.
5. **Desafio.** O Proton cria prefixos automaticamente. Pesquise (ou experimente com cautela) o que acontece quando você define `STEAM_COMPAT_DATA_PATH` manualmente e abre um jogo com o Proton pela linha de comando. Explique a relação entre essa variável e `compatdata/`.