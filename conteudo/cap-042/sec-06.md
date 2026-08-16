Um erro de launch que assusta quem vem do Windows é a caixa de diálogo "The following component(s) are required to run this program: Microsoft Visual C++ 2015-2022 Redistributable" — ou, pior, o código de erro cru apontando para `VCRUNTIME140.dll` ou `MSVCP140.dll`. Muitos jogos presumem que o runtime Visual C++ já está instalado e não o empacotam junto. No Linux, a instalação não é um instalador global: ela vive dentro do prefixo do jogo. Esta seção ensina a fechar essa lacuna.

:::objetivos
- Reconhecer o sintoma de runtime Visual C++ ausente
- Entender por que o runtime é instalado por prefixo, não globalmente
- Instalar `vcrun2022` com `protontricks`
- Verificar a presença das DLLs após a instalação
- Tratar outros runtimes comuns: DirectX e .NET
:::

## Por que o runtime some no Proton

No Windows, os redistribuíveis de Visual C++ são instalados uma única vez para o sistema inteiro e ficam em `C:\Windows\System32`. No Proton, cada jogo tem seu próprio `System32` dentro do prefixo. O Proton até embarca versões de runtime em partes, mas quando um jogo pede uma DLL específica que não foi empacotada, o processo morre na busca por ela.

O erro se manifesta de duas formas. Amigável: a caixa pedindo o redistribuível. Crua: um log com a DLL faltante:

```terminal
$ PROTON_LOG=1
$ grep -iE 'vcruntime|msvcp|not found|missing' ~/steam-<appid>.log | head
err:   module:import_dll Loading library VCRUNTIME140.dll (which is needed by L"C:\\...") failed
err:   module:import_dll Loading library MSVCP140.dll failed
```

A linha `import_dll ... failed` é o diagnóstico exato: o binário do jogo importa a DLL, o Proton procura no prefixo, não acha, e aborta. Sem essa DLL, o executável não chega nem à primeira instrução do jogo.

## Instalando o redistribuível no prefixo

A correção é instalar o runtime dentro do prefixo do jogo. O verbo `vcrun2022` do winetricks cobre a família 2015-2022 (elas compartilham o mesmo pacote redistribuível desde a 2015). Descubra o appid e aplique:

```terminal
$ protontricks -l | grep -iE 'your-game|405100'
Hades (405100)
$ protontricks 405100 vcrun2022
Executing wine /home/deck/.cache/protontricks/... vcrun2022
[..] Installing Microsoft Visual C++ 2015-2022 ...
[..] Installation successful
```

O `protontricks` baixa o instalador oficial da Microsoft, extrai e registra o runtime dentro de `compatdata/405100/pfx`. O processo pode pedir confirmação numa janela; siga os passos do instalador normalmente.

:::dica
Se o jogo é antigo e pede especificamente `VCRUNTIME140.dll` mas você já tem o `vcrun2022` instalado, a versão específica pode ter vindo sem a DLL 32-bit. Títulos 32-bit precisam da variante `x86`. O `protontricks 405100 vcrun2022` instala ambas; apenas confirme com o comando de verificação abaixo.
:::

## Verificando que a DLL chegou

Depois de instalar, confirme que os arquivos estão no `system32` do prefixo. O caminho tem duas camadas: a pasta `windows` (raiz do Windows) e o `system32` dentro dela.

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/405100/pfx/drive_c/windows/system32/ | grep -iE 'vcruntime|msvcp'
msvcp140.dll
msvcp140_1.dll
vcruntime140.dll
vcruntime140_1.dll
```

Ver as quatro DLLs presentes confirma o sucesso. Para títulos 32-bit, confira também a pasta `syswow64` (o equivalente ao `System32` de 32 bits no Windows real — a nomenclatura invertida é uma herança histórica):

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/405100/pfx/drive_c/windows/syswow64/ | grep -i vcruntime
vcruntime140.dll
```

:::nota
No Windows, os binários de 64 bits ficam em `System32` e os de 32 bits em `SysWOW64` — o nome parece trocado, mas o `WOW64` significa "Windows 32-bit on Windows 64-bit". O Proton replica essa estrutura fielmente, então não estranhe encontrar as DLLs de 32 bits em `syswow64`.
:::

## Outros runtimes que fazem falta

Visual C++ é o campeão, mas não é o único. Uma visão geral dos outros runtimes comuns e seus sintomas:

| Runtime | Sintoma | Verbo |
|---|---|---|
| DirectX 9 (D3DX) | `d3dx9_43.dll not found` | `d3dx9` |
| DirectX 10/11 auxiliar | `d3dx11_43.dll not found` | `d3dx11_43` |
| .NET Framework | Launcher não abre, aviso de `.NET` | `dotnet48` |
| XACT (áudio) | sem som em títulos antigos | `xact` |
| Media Foundation | cutscene preta | `mf-install` |

:::atencao
Erros de `d3dx*.dll` em jogos DirectX 9/11 costumam confundir: o DXVK traduz o Direct3D, mas **não** fornece as DLLs auxiliares de efeito (D3DX). São coisas diferentes. O DXVK cuida da renderização; a `d3dx9_43.dll` é uma biblioteca de helpers que alguns jogos importam para efeitos e fontes.
:::

## Uma instalação em lote, com cuidado

Se um título exige vários runtimes, você pode encadear a instalação num único comando passando os verbos de uma vez. O ideal é testar um por vez para identificar qual era o necessário, mas para acelerar uma reinstalação conhecida, o encadeamento funciona:

```terminal
$ protontricks 405100 vcrun2022 d3dx9 xact
[..] Installing vcrun2022 ... done
[..] Installing d3dx9 ... done
[..] Installing xact ... done
$ ls ~/.steam/steam/steamapps/compatdata/405100/pfx/drive_c/windows/system32/ | grep -iE 'd3dx|msvcp140|vcruntime'
d3dx9_43.dll
msvcp140.dll
vcruntime140.dll
```

O comando aplica os três verbos em sequência no mesmo prefixo, e a conferência final lista as DLLs resultantes lado a lado.

## Resumo

- Runtime Visual C++ ausente se manifesta como caixa de redistribuível ou `VCRUNTIME140.dll failed` no log.
- No Proton o runtime é instalado por prefixo, em `compatdata/<appid>/pfx`, nunca globalmente.
- `protontricks <appid> vcrun2022` instala a família 2015-2022 (32 e 64 bits).
- `system32` guarda DLLs 64-bit; `syswow64` guarda as 32-bit.
- `d3dx9` e `d3dx11_43` resolvem DLLs auxiliares do DirectX, distintas do DXVK.
- Encadear verbos (`vcrun2022 d3dx9 xact`) acelera reinstalações conhecidas.

## Exercícios

1. Ative `PROTON_LOG=1` num jogo que falha com erro de runtime e grep` por `import_dll ... failed` para capturar a DLL exata.
2. Rode `protontricks <appid> vcrun2022` e confirme as quatro DLLs (`msvcp140*` e `vcruntime140*`) em `system32`.
3. Compare `system32` com `syswow64` do mesmo prefixo usando `ls | grep -i vcruntime` e explique a diferença de arquitetura.
4. Instale `d3dx9` num título DirectX 9 e localize a `d3dx9_43.dll` resultante no prefixo.
5. **Desafio.** Um jogo pede `MSVCP140.dll` mas já tem o `vcrun2022` instalado. Investigue — pela arquitetura do executável (use `file` no `.exe` dentro de `steamapps/common`) — se o jogo é 32-bit ou 64-bit, e explique em qual pasta a DLL faltante deveria estar e por quê.
