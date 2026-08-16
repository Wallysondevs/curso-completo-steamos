O Bottles parece simples na vitrine, mas o valor dele está na profundidade de configuração: escolher runner por garrafa, gerenciar dependências, ajustar variáveis de ambiente, montar backups e até clonar garrafas para testar mudanças sem risco. Nesta seção você percorre esse fluxo completo, do `flatpak install` à criação de uma garrafa funcional com dependências e backup.

:::objetivos
- Instalar o Bottles pelo Flatpak no SteamOS
- Criar e configurar uma garrafa com runner e ambiente corretos
- Instalar dependências e componentes dentro da garrafa
- Fazer backup e restauração de garrafas
- Rodar um executável dentro de uma garrafa via CLI

:::

## Instalando e preparando o ambiente

A instalação do Bottles é um `flatpak install` padrão, mas a primeira execução merece atenção: o assistente oferece baixar componentes iniciais e define onde as garrafas vão morar.

```terminal
$ flatpak install flathub com.usebottles.bottles
Looking for matches…
Required runtime for com.usebottles.bottles/x86_64/stable (runtime/org.gnome.Platform/x86_64/46) found in remote flathub
Do you want to install it? [Y/n]: y

 1. com.usebottles.bottles  x86_64  stable flathub

Proceed with these changes to the system installation? [Y/n]: y
```

Depois de abrir, o Bottles mostra a tela de boas-vindas e pede para você confirmar o diretório de dados. Diferente do Heroic, que separa jogos e prefixos, o Bottles centraliza tudo num único diretório dentro do sandbox, o que simplifica o backup: uma pasta, tudo dentro.

:::atencao
O Bottles baixa o runner `soda` na primeira garrafa de gaming que você cria. Esse download pode levar alguns minutos e consumir algumas centenas de megabytes. Não interrompa no meio — senão a garrafa fica pela metade e é melhor recriá-la do zero.
:::

## Criando a primeira garrafa

O fluxo de criação passa por três escolhas: nome, ambiente e runner.

```terminal
$ flatpak run com.usebottles.bottles -b "jogo-antigo" create 2>&1 | head -10
2025-01-12 19:21:03,110: Creating bottle jogo-antigo
2025-01-12 19:21:03,214: Environment: gaming
2025-01-12 19:21:03,318: Runner: soda-7.0
2025-01-12 19:21:18,902: Dependencies initialized
2025-01-12 19:21:18,903: Bottle ready
```

A saída mostra o processo: criação da garrafa, aplicação do ambiente `gaming`, seleção do runner `soda-7.0` e inicialização das dependências. Na interface, a mesma coisa acontece com botões e um passo a passo.

:::dica
Escolha nomes descritivos para as garrafas. O diretório no disco usa esse nome, então `jogo-antigo` é infinitamente melhor que `bottle-1` na hora de achar, limpar ou restaurar. Nomes com espaço são permitidos, mas evite caracteres especiais para não complicar comandos de terminal depois.
:::

## Instalando dependências

Com a garrafa criada, você parte para as dependências: runtimes, DLLs e componentes que o jogo ou programa espera. O Bottles agrupa isso na seção "Dependencies", com busca e instalação de um clique.

```terminal
$ flatpak run com.usebottles.bottles -b "jogo-antigo" dependencies --install "vcrun2013" 2>&1 | head -8
2025-01-12 19:25:41,230: Downloading vcrun2013
2025-01-12 19:25:44,019: Installing into jogo-antigo
2025-01-12 19:26:02,771: Done
```

Instalar `vcrun2013` (o runtime Visual C++ 2013) é um caso recorrente: muitos jogos antigos exigem essa versão específica, e sem ela o executável fecha silenciosamente na inicialização. O Bottles baixa o instalador oficial, roda-o dentro da garrafa e registra a dependência para que o backup e o histórico reflitam a mudança.

:::info
As dependências do Bottles, como no Lutris, vêm de um repositório comunitário mantido no GitHub. Os nomes seguem uma convenção (`vcrun2013`, `dotnet48`, `d3dx9`). Se você já conhece winetricks, vai reconhecer a maioria: o Bottles essencialmente empacota os verbos do winetricks com uma interface melhor.
:::

## Configurações finas: runner, DXVK e variáveis

Cada garrafa tem uma tela de "Settings" que expõe o que o Lutris esconde. As três áreas que mais importam:

- **Runner** — trocar de `soda` para outra versão de Wine ou para um Wine vanilla.
- **Components** — ligar/desligar DXVK, VKD3D e a tradução de DirectX para Vulkan em tempo real.
- **Environment Variables** — injetar variáveis como `DXVK_ASYNC=1` ou `WINEDLLOVERRIDES`.

```terminal
$ flatpak run com.usebottles.bottles -b "jogo-antigo" config --get runner
soda-7.0
$ flatpak run com.usebottles.bottles -b "jogo-antigo" config --get dxvk
enabled
```

Consultar a configuração por CLI é útil para conferir, em scripts, se uma garrafa está como você deixou — ou para detectar quando algo reverteu uma mudança.

## Backup e clonagem

O recurso que torna o Bottles insubstituível para experimentação é o backup. Você exporta uma garrafa inteira para um arquivo, e pode restaurá-la num outro dispositivo — ou cloná-la para testar uma mudança arriscada.

```terminal
$ flatpak run com.usebottles.bottles -b "jogo-antigo" backup --output /tmp/jogo-antigo.bak 2>&1 | head -5
2025-01-12 19:30:12,110: Exporting jogo-antigo
2025-01-12 19:30:25,340: Backup written to /tmp/jogo-antigo.bak
```

O arquivo `.bak` resultante é um bundle comprimido da pasta da garrafa, incluindo registro, DLLs e aplicativos instalados. Restaurar é o caminho inverso: importar o `.bak` e ele recria a garrafa idêntica.

:::perigo
Antes de apagar uma garrafa, confirme o nome com `bottles --list`. `bottles -b nome delete` (ou o botão "Delete" na interface) remove a pasta inteira sem lixeira — e, com ela, todos os programas instalados dentro da garrafa. Faça backup antes se houver qualquer coisa que você queira reaproveitar.
:::

## Rodando algo dentro da garrafa

O objetivo final é lançar um executável. Na interface, você adiciona um programa à garrafa e clica em play. Pela CLI, aponta o executável com `-e`.

```terminal
$ flatpak run com.usebottles.bottles -b "jogo-antigo" -e "jogo.exe" run 2>&1 | head -6
2025-01-12 19:35:02,441: Launching jogo.exe in jogo-antigo
2025-01-12 19:35:03,118: Wine started
```

O Bottles resolve o caminho do executável dentro da garrafa, monta o ambiente e dispara o Wine com as configurações que você definiu. É o equivalente, em CLI, ao duplo clique no atalho da interface.

## Resumo

- O Bottles instala via `flatpak install flathub com.usebottles.bottles` e centraliza dados num diretório único.
- Criar uma garrafa passa por nome, ambiente (gaming/application/custom) e runner.
- Dependências são instaladas por nome (`vcrun2013`, `dotnet48`) e registradas no histórico da garrafa.
- Settings expõem runner, componentes DXVK/VKD3D e variáveis de ambiente por garrafa.
- Backup exporta a garrafa em `.bak`; restauração e clonagem permitem testar sem risco.
- Apagar uma garrafa remove a pasta sem lixeira — faça backup antes.

## Exercícios

1. Instale o Bottles e crie uma garrafa `gaming` chamada `teste-jogo`, observando o download do runner `soda`.
2. Instale duas dependências nessa garrafa (por exemplo, `vcrun2013` e `d3dx9`) e confira o histórico de mudanças.
3. Use `config --get runner` e `config --get dxvk` para conferir o estado da garrafa via CLI.
4. Faça um backup da garrafa com o comando `backup`, localize o arquivo `.bak` e depois apague a garrafa e restaure-a a partir do backup.
5. **Desafio.** Clone a garrafa `teste-jogo` para `teste-jogo-exp`, altere o runner ou uma variável de ambiente na cópia, e prove que a original continua intacta consultando as duas via `config --get`.
