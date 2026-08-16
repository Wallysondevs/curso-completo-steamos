Em agosto de 2018, a Valve lançou o **Steam Play**, e com ele o **Proton**. O anúncio foi discreto para o tamanho do que representava: o Steam para Linux passava a rodar jogos de Windows, de forma transparente, usando uma versão modificada do Wine. De repente, uma biblioteca de milhares de títulos — incluindo jogos que nunca teriam porte nativo para Linux — ficou jogável. O Proton é, junto com o Steam Deck, o movimento mais importante da Valve no ecossistema Linux. Sem ele, o SteamOS 3 não existiria como plataforma viável.

:::objetivos
- Entender o que é Proton, como ele se relaciona com Wine e por que foi criado
- Conhecer os componentes principais (DXVK, VKD3D, esync/fsync)
- Saber onde o Proton está instalado no SteamOS
- Usar `protontricks` para diagnosticar e ajustar prefixos Wine
- Identificar limitações do Proton (anti-cheat, codecs)
:::

## O problema que o Proton resolveu

Portar um jogo de Windows para Linux dá trabalho, e a maioria dos estúdios não vai fazê-lo porque o mercado Linux de desktop é pequeno. A Valve percebeu, na época das Steam Machines, que depender de portes nativos era um beco sem saída. Para que o SteamOS tivesse chance, o Linux precisava conseguir rodar jogos de Windows com performance aceitável e o mínimo de atrito possível.

O Proton é uma solução de compatibilidade que roda dentro do próprio Steam. Do ponto de vista do usuário, funciona assim: você instala um jogo Windows no Linux, e o Steam decide se usa o Proton (e qual versão). O jogo aparece como qualquer outro. Não há passo extra. Esse "funciona sem perguntar" foi a chave do sucesso.

## Proton não é só Wine

Wine (*Wine Is Not an Emulator*) é um projeto que traduz chamadas da API Windows para chamadas equivalentes no Linux — sem emular processador, sem máquina virtual. Existe desde 1993 e já era capaz de rodar muitos jogos, mas exigia configuração manual, *overrides* de DLL e paciência. O Proton empacotou o Wine com peças adicionais que transformaram a experiência:

| Componente | O que faz |
|---|---|
| Wine | Tradução de APIs Windows → Linux |
| DXVK | Traduz Direct3D 9/10/11 para Vulkan |
| VKD3D | Traduz Direct3D 12 para Vulkan |
| esync / fsync | Redução da sobrecarga de sincronização de threads |
| Mono | Substituição do .NET Framework |
| vkd3d-proton | Fork otimizado do VKD3D para jogos |

A mágica principal está nos tradutores gráficos: DXVK e VKD3D. Em vez de traduzir Direct3D para OpenGL (como o Wine fazia nativamente), eles traduzem para Vulkan, uma API gráfica moderna com excelente suporte no Linux. O resultado é desempenho frequentemente próximo do que o jogo teria no Windows — e às vezes melhor, porque o driver Vulkan no Linux pode ser mais eficiente que o driver DirectX no Windows.

## Onde o Proton mora no SteamOS

No SteamOS, o Proton não é um pacote do sistema: ele é instalado pelo próprio Steam como uma ferramenta de compatibilidade. As versões oficiais ficam dentro do diretório do Steam, e você pode adicionar versões customizadas (como o Proton GE) manualmente.

```terminal
$ ls ~/.steam/steam/steamapps/common/
Proton 8.0
Proton 9.0
Proton Experimental
Proton Hotfix
SteamLinuxRuntime_sniper
...
```

Cada pasta de versão contém o Wine modificado, o DXVK, o VKD3D e os scripts de inicialização. Para jogos com problemas, a Valve mantém o **Proton Experimental**, uma versão de ponta com correções recentes que ainda não migraram para a versão estável.

```terminal
$ ls ~/.steam/steam/steamapps/common/Proton\ 9.0/
dist
files
proton
proton_dist.tar.gz
version
$ cat ~/.steam/steam/steamapps/common/Proton\ 9.0/version
9.0
```

:::info
O Proton GE (*Glorious Eggroll*) é uma versão comunitária que inclui patches e codecs que a Valve não pode distribuir por questões de licenciamento (codecs de mídia proprietários, por exemplo). Não substitui o Proton oficial, mas resolve jogos específicos com vídeos que não tocam.
:::

## Diagnosticando e ajustando com protontricks

Cada jogo rodando via Proton ganha um **prefixo Wine** isolado — uma árvore de diretório que simula um "C:" do Windows e guarda as DLLs, configurações de registro e saves específicos daquele jogo. Esses prefixos ficam em `~/.steam/steam/steamapps/compatdata/`, nomeados pelo AppID do jogo.

```terminal
$ ls ~/.steam/steam/steamapps/compatdata/ | head -5
1234560
1238840
1245620
1307090
1328350
```

A ferramenta `protontricks` permite inspecionar e modificar esses prefixos com comodidade, sem precisar mexer diretamente no Wine. Ela é um *wrapper* do `winetricks` adaptado para o ambiente Proton.

```terminal
$ protontricks -l | head -10
1234560  (Game A)
1238840  (Game B)
1245620  (SuperGame)
1307090  (TitleName)
1328350  (OldGame)
...
```

Com `protontricks <appid> shell`, você abre um terminal dentro do prefixo do jogo, onde comandos como `winecfg` ou `regedit` operam sobre o ambiente Windows simulado daquele título específico. Com `protontricks <appid> <verb>`, você instala componentes extras (fonts, DLLs, runtimes) sem precisar conhecer a sintaxe do `winetricks`.

:::atencao
Mexer no prefixo Wine de um jogo pode quebrá-lo. A vantagem do Proton é justamente que você não precisa fazer isso. Só recorra a `protontricks` quando o jogo não rodar e você souber exatamente qual componente falta — nunca mexa por curiosidade.
:::

## O que o Proton (ainda) não resolve

O maior obstáculo do Proton é o **anti-cheat em nível de kernel**. Softwares como Easy Anti-Cheat e BattlEye funcionam carregando um driver no kernel do Windows, que não tem equivalente no Linux. Ambos oferecem suporte ao Proton (via modo *userspace*), mas a decisão final é do desenvolvedor do jogo. Títulos como *Fortnite*, *Destiny 2* e *Call of Duty* bloqueiam ativamente o Proton mesmo quando a camada técnica permitiria rodá-los.

O segundo obstáculo são codecs de vídeo proprietários. Muitos jogos usam WMVs ou codecs que a Valve não pode redistribuir, e as cutscenes ficam mudas. O Proton GE resolve parte disso com codecs adicionais, mas é uma guerra de gato e rato.

O terceiro obstáculo é o **VR**. Embora o SteamVR rode no Linux, o suporte do Valve Index no SteamOS é experimental, e a maioria dos jogos de VR não foi testada com Proton. Esse tema será aprofundado [na seção sobre Valve Index](#/cap-003/sec-07).

## Resumo

- Proton (2018) é uma versão modificada do Wine integrada ao Steam, com DXVK e VKD3D.
- Traduzir DirectX para Vulkan (em vez de OpenGL) trouxe performance competitiva.
- Cada jogo tem um prefixo Wine isolado em `~/.steam/steam/steamapps/compatdata/`.
- `protontricks` permite inspecionar e ajustar prefixos sem manipular o Wine manualmente.
- Anti-cheat em modo kernel e codecs proprietários são os principais obstáculos restantes.

## Exercícios

1. Liste as versões de Proton instaladas no seu SteamOS: `ls ~/.steam/steam/steamapps/common/ | grep Proton`.
2. Encontre o prefixo Wine de um jogo específico consultando `~/.../compatdata/` e o `protontricks -l`. Assumindo que ele seja o AppID 730, explore `ls ~/.steam/steam/steamapps/compatdata/730/pfx/drive_c/`.
3. Execute `protontricks --version` e, em seguida, liste os prefixos disponíveis com `protontricks -l`.
4. Explique, em um parágrafo, por que DXVK traduzir Direct3D para Vulkan é mais eficiente que traduzir para OpenGL.
5. **Desafio.** Pesquise o ProtonDB para um jogo que você possui, veja a nota de compatibilidade e, se houver dicas da comunidade, experimente uma delas — registrando o que funcionou e o que não funcionou.