As quatro famílias do Proton — Stable, Experimental, GE e Hotfix — não são rivais, mas camadas de um mesmo mecanismo de compatibilidade. Nos bastidores, componentes como Wine, DXVK e VKD3D-Proton são os mesmos em todas elas; o que muda é a versão de cada peça e a agilidade com que cada família as incorpora. Entender essa anatomia é o que separa quem "troca de versão por tentativa e erro" de quem escolhe com critério.

:::objetivos
- Mapear os componentes internos que compõem o Proton
- Entender o papel de Wine, DXVK e VKD3D-Proton na tradução de APIs
- Compreender a relação entre o Proton e o Wine upstream
- Saber onde a Valve publica o código e as notas de cada versão
:::

## Quem faz o quê dentro do Proton

O Proton não é um software único — é um empacotamento de vários projetos:

| Componente | Papel |
|---|---|
| **Wine** | Traduz chamadas da API do Windows (Win32) para chamadas do Linux |
| **DXVK** | Converte DirectX 9/10/11 em chamadas Vulkan, com alto desempenho |
| **VKD3D-Proton** | Converte DirectX 12 em Vulkan |
| **dxvk-nvapi / various shims** | Permitem que features específicas (NVIDIA Reflex, etc.) continuem funcionando |

O Proton da Valve pega todos esses componentes, aplica seus patches, e os empacota numa "ferramenta de compatibilidade" registrada no arquivo `compatibilitytool.vdf`:

```terminal
$ cat ~/.steam/steam/steamapps/common/Proton\ 9.0/compatibilitytool.vdf
```

O arquivo em KeyValues declara o nome interno (`proton_9.0`), os parâmetros de spawn e o comando usado pelo Steam Play para inicializar o jogo. É por ele que o Steam aprende a listar a versão no menu de compatibilidade.

## Wine, DXVK e VKD3D-Proton

A tradução acontece em camadas. O Wine resolve as chamadas de sistema e bibliotecas do Windows; o DXVK e o VKD3D-Proton resolvem a parte gráfica pesada, traduzindo Direct3D para Vulkan. Essa separação importa porque, às vezes, o problema está numa camada e não na outra.

```terminal
$ journalctl -u steam --since "1 hour ago" | grep -i -E "dxvk|vkd3d"
Mar 18 15:30:02 steamdeck steam[984]: proton: DXVK version 2.3.1 in Proton 9.0-4
Mar 18 15:30:02 steamdeck steam[984]: proton: VKD3D-Proton version 2.12 in Proton 9.0-4
```

Quando um jogo DirectX 11 regride, a suspeita recai sobre o DXVK; quando é DirectX 12, sobre o VKD3D-Proton. Saber ler essas versões ajuda a decidir se vale a pena subir para o Experimental (que costuma trazer DXVK/VKD3D mais novos) ou usar o GE (que às vezes inclui builds de desenvolvimento não liberados).

Os binários desses componentes ficam dentro da pasta da versão, por baixo de `files/`:

```terminal
$ find ~/.steam/steam/steamapps/common/Proton\ 9.0/files -maxdepth 2 -iname "*dxvk*" -o -iname "*vkd3d*" | head
.../files/lib/wine/dxvk/d3d11.dll
.../files/lib/wine/dxvk/dxgi.dll
.../files/lib/wine/vkd3d-proton/d3d12.dll
```

As DLLs `d3d11.dll` e `dxgi.dll` são as sobreposições do DXVK que substituem as versões originais do Windows, e `d3d12.dll` é a do VKD3D-Proton. É o mecanismo real de tradução: quando o jogo carrega `d3d12.dll`, carrega na verdade a implementação Vulkan da Valve.

## O Proton e o Wine upstream

Parte das melhorias do Proton retorna ao Wine *upstream*, o projeto de onde tudo descende. A Valve é uma das maiores contribuidoras do Wine moderno. Na prática:

- Correções de API genéricas sobem para o Wine upstream
- Workarounds específicos de jogos ficam como patches locais da Valve
- O GE adiciona ainda mais patches comunitários por cima

Essa hierarquia explica por que o Proton está sempre "à frente" do Wine puro para jogos: ele herda tudo do upstream e ainda soma os patches de jogos que a Valve mantém.

:::info
O código-fonte de todas as versões do Proton está no GitHub oficial `ValveSoftware/Proton`. O repositório segue o mesmo versionamento das builds: cada tag (`proton-9.0-4`, por exemplo) corresponde a uma release publicada. As notas de alteração (changelog) ficam na página de releases, e é o melhor lugar para confirmar se um bug específico foi corrigido.
:::

:::dica
Se você quer saber qual DXVK e qual VKD3D-Proton estão numa build sem ler o changelog, basta olhar dentro da pasta da versão. O comando `find ~/.steam/steam/steamapps/common/Proton\ 9.0/files -name "*.dll" -path "*dxvk*" -exec strings {} \; | grep -i "dxvk.*[0-9]+\.[0-9]" | head -1` extrai a string de versão direto da DLL compilada. É um truque útil quando o `journalctl` não registrou a versão ou quando você quer verificar uma build GE recém-instalada.
:::

## O ciclo completo em uma imagem mental

Para fechar, imagine a "linha do tempo" de uma correção:

1. Um jogador reporta que *Jogo X* quebrou após um update de driver
2. Um engenheiro (ou a comunidade, via GE) propõe um patch
3. O patch vai para o **Experimental** e é validado em massa
4. Se estável, é promovido à próxima **Stable** numerada
5. Se a correção é urgente, vira **Hotfix** antes disso
6. Melhorias genéricas sobem para o Wine **upstream**

Cada família ocupa um degrau dessa escada, e é por isso que elas coexistem em vez de competir.

## Resumo

- O Proton é um empacotamento de Wine, DXVK e VKD3D-Proton, mais os patches próprios da Valve.
- O `compatibilitytool.vdf` declara a ferramenta ao Steam e a torna selecionável no menu.
- DXVK traduz DirectX 9/10/11 e VKD3D-Proton traduz DirectX 12, ambos para Vulkan.
- Parte das correções do Proton retorna ao Wine upstream, do qual o Proton descende.
- Stable, Experimental, GE e Hotfix são degraus de um mesmo ciclo de desenvolvimento.
- O código-fonte e o changelog ficam no GitHub oficial `ValveSoftware/Proton`.

## Exercícios

1. Leia o `compatibilitytool.vdf` da sua versão Stable (`cat ~/.steam/steam/steamapps/common/Proton\ 9.0/compatibilitytool.vdf`) e identifique o nome interno e o comando de spawn.
2. Verifique as versões de DXVK e VKD3D-Proton em uso com `journalctl -u steam` e anote-as. Depois compare com as versões do Proton Experimental, se estiver instalado.
3. Acesse a página de releases do `ValveSoftware/Proton` no GitHub e localize a tag correspondente à sua build Stable. Leia o changelog e relacione pelo menos uma mudança com um jogo que você conhece.
4. Descubra a versão do Wine embutida no seu Proton pesquisando dentro da pasta (`grep -r "wine-" ~/.steam/steam/steamapps/common/Proton\ 9.0/version*` ou lendo o changelog). Explique por que ela é diferente da versão do Wine instalada separadamente, se houver.
5. **Desafio.** Monte uma tabela comparativa das quatro famílias usando somente o terminal: para cada pasta `Proton*`, capture o `cat version`, a data de modificação (`ls -ld`) e a versão do DXVK/VKD3D disponível nos logs. Com esses dados, escreva em uma frase como cada família se posiciona no ciclo de desenvolvimento que você aprendeu aqui.