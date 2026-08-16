Há duas formas de resolver problema com o Proton: mudar *como* ele traduz, ou mexer *dentro* do mundo Windows que ele cria para cada jogo. Esse mundo é o **prefixo** — a árvore `drive_c` isolada em `compatdata/<appid>/pfx` que já apareceu nas seções anteriores. Dominar o prefixo te dá um poder enorme: instalar runtimes, trocar DLLs e ajustar o registro, tudo sem afetar os outros jogos. Esta seção é a porta de entrada para esse território.

:::objetivos
- Entender a estrutura de um prefixo Wine/Proton
- Localizar e navegar pelo `pfx` de qualquer jogo pelo appid
- Usar o `protontricks` para gerenciar componentes
- Listar aplicativos e versão do prefixo com `protontricks -l`
- Diferenciar a instalação por appid da instalação global
:::

## O que é um prefixo, afinal

Cada jogo Windows espera um ambiente semelhante a uma instalação real do Windows: um diretório `C:`, uma pasta de sistema com DLLs, e um registro. O Proton não cria isso uma vez e compartilha — ele cria **um prefixo isolado por jogo**, dentro de `compatdata/<appid>/pfx`. O isolamento é o motivo de um runtime instalado num jogo não "vazar" para outro.

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/405100/pfx/
drive_c/   system.reg   user.reg   userdef.reg   update_timestamp
$ ls ~/.steam/steam/steamapps/compatdata/405100/pfx/drive_c/
Program Files/   Program Files (x86)/   users/   windows/
```

O `drive_c` mapeia o `C:` do Windows. Os arquivos `.reg` armazenam o registro do Windows em texto plano — você pode, inclusive, grep` neles. `users/` guarda o perfil do usuário fictício do Wine (o `steamuser`, interno ao Proton).

:::nota
Por dentro, `steamuser` é o usuário do Wine, não o seu usuário `deck` do sistema. É por isso que caminhos como `C:\users\steamuser\Documents` aparecem nos guias de save de jogos rodando em Proton.
:::

## Descobrindo o appid de forma confiável

Antes de tudo, você precisa do appid. Duas formas complementares já foram vistas; aqui vai uma terceira, via `protontricks -l`, que lista todos os prefixos existentes junto com o nome do jogo:

```terminal
$ protontricks -l
Found the following games:
Non-Steam shortcut: Protontest                    (1234567890)
Hades (405100)
A Short Hike (656350)
...
```

A saída cruza appid e nome, resolvendo a ambiguidade. O `Non-Steam shortcut` tem um appid sintético (`1234567890`) atribuído pelo Steam a jogos adicionados manualmente — útil para gerenciar prefixos de jogos de fora da Steam.

:::dica
Para achar o appid **exato** de um jogo em execução, rode `ps aux | grep -i proton | grep -v grep` e olhe o caminho do prefixo: o diretório logo após `compatdata/` é o appid.
:::

## Rodando protontricks por jogo

O `protontricks` é um wrapper que chama o `winetricks` apontando para o prefixo certo, sem precisar lidar com variáveis de ambiente. O padrão geral é:

```terminal
$ protontricks <appid> <comando>
$ protontricks 405100 --gui
```

O `--gui` abre a interface gráfica do winetricks dentro daquele prefixo, de onde você instala componentes (`vcrun`, `d3dx`, `dotnet`) um a um. No terminal, você pode instalar direto:

```terminal
$ protontricks 405100 vcrun2022
Executing mkdir -p /home/deck/.steam/steam/steamapps/compatdata/405100
Executing wine /home/deck/.cache/protontricks/... ~vcrun2022
[..] installing Microsoft Visual C++ Redistributable ...
[..] Done.
```

Aqui o `vcrun2022` instala o runtime Visual C++ da Microsoft dentro do prefixo, algo que muitos jogos esperam que já exista. Quando falta, o sintoma é o erro de aplicação do tipo `api-ms-win-crt-runtime-l1-1-0.dll` ou a caixa de erro de C++ — detalhado na [seção de runtime C++](#/cap-042/sec-06).

## Instalando DLLs e runtimes essenciais

O `protontricks` aceita qualquer verb do `winetricks`. Os mais pedidos em Proton:

| Verbo | O que instala | Quando usar |
|---|---|---|
| `vcrun2022` | Runtime Visual C++ 2015-2022 | Erro de `vcruntime140.dll` ou `msvcp140.dll` |
| `d3dx9` / `d3dx11_43` | DLLs auxiliares do DirectX | Jogos antigos pedindo `d3dx*.dll` |
| `dotnet48` | .NET Framework 4.8 | Launchers e jogos em .NET |
| `xact` | Áudio XACT | Falta de som em títulos antigos |
| `mf-install` | Media Foundation | Cutscenes pretas (seção anterior) |

:::atencao
Instale runtimes **só no prefixo do jogo que pede**. Instalar `.NET` ou `vcrun` globalmente (em todos os prefixos) consome espaço e pode até conflitar com o que o Proton já injeta por padrão. A regra de ouro é: falha específica → verb específico → prefixo específico.
:::

## Uma sessão completa de recuperação

Veja o fluxo inteiro de quem recupera um jogo que pede runtime ausente: descobre o appid, confere o prefixo, instala o componente, testa.

```terminal
$ protontricks -l | grep -i hades
Hades (405100)
$ protontricks 405100 vcrun2022
[..] installation complete
$ ls ~/.steam/steam/steamapps/compatdata/405100/pfx/drive_c/windows/system32/ | grep -i msvcp
msvcp140.dll
msvcp140_1.dll
msvcp140_2.dll
```

O `grep msvcp` confirma que as DLLs de runtime C++ agora existem no `system32` do prefixo do Hades. A partir daqui, o jogo que exibia o erro de falta de `msvcp140.dll` tem o que precisa para abrir.

## Resumo

- O prefixo é um "Windows mini" isolado por jogo, em `compatdata/<appid>/pfx/drive_c`.
- `drive_c` mapeia o `C:`; os arquivos `.reg` guardam o registro em texto.
- `protontricks -l` lista appid + nome de todos os prefixos existentes.
- `protontricks <appid> <verb>` instala runtimes/DLLs só naquele jogo.
- `vcrun2022`, `d3dx9`, `dotnet48` e `xact` cobrem a maioria das faltas de runtime.
- Instale sempre no prefixo específico, nunca globalmente.

## Exercícios

1. Rode `protontricks -l` e anote o appid de três jogos seus, incluindo qualquer Non-Steam shortcut.
2. Navegue até um `pfx` e liste `drive_c/windows/system32/`, contando quantas DLLs existem; compare com o `system32` de outro jogo.
3. Use `grep -i 'program files' ~/.steam/steam/steamapps/compatdata/<appid>/pfx/user.reg` para ver como o registro aponta para as pastas do `drive_c`.
4. Abra `protontricks <appid> --gui` e liste os componentes já instalados naquele prefixo, sem alterar nada.
5. **Desafio.** Um jogo pede `d3dx9_43.dll`. Instale com `protontricks <appid> d3dx9`, confirme a DLL no `system32`, rode o jogo e registre se o erro sumiu. Depois explique por que esse mesmo arquivo não apareceria no prefixo de um jogo diferente.
