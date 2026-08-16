A Epic Games Store distribui títulos pesados (Cyberpunk 2077, Alan Wake 2, Kingdom Hearts) e brindes semanais, mas nunca lançou um cliente nativo para Linux. O Heroic Games Launcher preenche essa lacuna com um cliente open-source que conversa diretamente com a API da Epic e da GOG, gerencia prefixos Wine/Proton e integra tudo no Game Mode.

:::objetivos
- Autenticar na Epic Games Store via Heroic sem o cliente oficial
- Navegar pela biblioteca da Epic e instalar jogos no Steam Deck
- Entender o papel do Legendary (CLI) como backend do Heroic
- Configurar versões do Proton e Wine-GE por jogo
- Resolver problemas comuns de login e autenticação na Epic
:::

## Por que a Epic não tem cliente Linux

A Epic Games Store existe desde 2018 e, apesar dos pedidos da comunidade e do investimento da empresa no Unreal Engine para Linux, o launcher oficial nunca saiu para o sistema. Tim Sweeney, CEO da Epic, já declarou publicamente que não vê mercado suficiente. A boa notícia: a API da Epic é relativamente aberta, e o projeto Legendary reverteu a engenharia dela.

O Legendary é um cliente de linha de comando que fala o protocolo da Epic. Com ele, você faz login, lista sua biblioteca, baixa, instala, atualiza e desinstala jogos — tudo sem o launcher oficial. O Heroic é a interface gráfica que consome o Legendary (e também o GOGDL para a GOG), oferecendo uma experiência comparável à da Steam.

```terminal
$ legendary auth
[cli] INFO: Login to Epic Games ...
[WebView] Opening Epic Games login page ...
[cli] INFO: Authentication successful.
$ legendary list-games
Available games:
  * Alan Wake 2 (bc4b4e4f4a9c4e4f8b3d5a1c7e8f2a3b)
  * Celeste (e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0)
```

A saída mostra o `app_name` (slug) e o `app_id` (hash). O Heroic usa esses mesmos identificadores internamente.

:::info
O Legendary é mantido pela comunidade e não é afiliado à Epic Games. A Epic pode, em teoria, bloquear o acesso via API a qualquer momento — mas, na prática, o Legendary existe há anos sem interferência. Para mitigar riscos, mantenha seus instaladores offline quando possível.
:::

## Instalando jogos da Epic pelo Heroic

No Heroic, depois de fazer login com sua conta Epic, a biblioteca aparece completa. Cada jogo tem um botão **Install** que abre um assistente com opções importantes:

- **Pasta de instalação** — padrão `~/Games/Heroic/`, mas você pode apontar para o microSD
- **Versão do Wine/Proton** — escolha entre Proton (da Steam), Wine-GE (community builds) ou Proton-GE
- **Prefix folder** — onde o prefixo Wine será criado (padrão ao lado do jogo)
- **Args de inicialização** — flags como `-windowed`, `-dx11`, úteis para compatibilidade

```terminal
$ ls ~/Games/Heroic/
AlanWake2/      Celeste/        Hades/
$ ls ~/Games/Heroic/AlanWake2/
AlanWake2.exe   Engine/         Data/
```

O Heroic detecta automaticamente o Proton instalado pela Steam e o oferece como opção. Se você usa Proton Experimental ou GE-Proton, o Heroic os lista na dropdown de seleção.

:::dica
Jogos da Epic que usam Easy Anti-Cheat (EAC) ou BattlEye podem falhar no Linux, assim como na Steam. Consulte o [Are We Anti-Cheat Yet?](https://areweanticheatyet.com) para saber o status de cada título. O Heroic não faz milagre com anti-cheats de kernel.
:::

## Sincronização de cloud saves

O Legendary suporta cloud saves da Epic via linha de comando. O Heroic expõe essa funcionalidade na interface: na página do jogo, há um toggle **Enable Cloud Saves**. Quando ativado, o Heroic sincroniza antes de lançar e depois de fechar o jogo.

```terminal
$ legendary list-saves
Available saves:
  * Celeste (e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0)
  * Hades (a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6)
$ legendary sync-saves e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0
[cli] INFO: Downloading cloud saves ...
[cli] INFO: Saves synced to /home/deck/Games/Heroic/Celeste/saves/
```

Por baixo, o Legendary baixa os saves para o diretório de instalação do jogo. O Heroic gerencia isso automaticamente, mas é bom saber o comando manual caso a sincronização automática falhe.

## Jogos grátis semanais e resgate

A Epic distribui jogos grátis toda quinta-feira. O Heroic não tem loja embutida — você precisa resgatar os jogos pelo site da Epic (via navegador) e depois eles aparecem na biblioteca do Heroic automaticamente.

Para facilitar, você pode usar o próprio Legendary para resgatar jogos grátis da semana sem abrir navegador:

```terminal
$ legendary list-free
Free games this week:
  * Furi (app_slug: furi)
  * Dungeons 3 (app_slug: dungeons3)
$ legendary buy furi
[cli] INFO: Claiming free game 'Furi' ...
[cli] INFO: Game claimed successfully!
```

O comando `legendary buy` para jogos gratuitos só os adiciona à conta — não cobra nada.

:::atencao
O resgate via `legendary buy` funciona para jogos com preço zero. Para jogos pagos, você precisa comprar pelo site oficial ou pelo launcher da Epic em outra máquina. O Heroic e o Legendary não processam pagamentos.
:::

## Quando o jogo não funciona

Jogos da Epic usam as mesmas tecnologias que os da Steam, então a maioria funciona com Proton. Mas alguns exigem ajustes:

| Problema | Solução |
|---|---|
| Tela preta ao abrir | Adicione `-dx11` ou `-windowed` nos args de inicialização |
| Crash com D3D12 | Force `PROTON_USE_WINED3D=1` nas variáveis de ambiente |
| Cutscenes sem vídeo | Instale `mf-install` no prefixo via `protontricks` |
| Controle não funciona | Desative o Steam Input para esse jogo e use o controle nativo |
| Erro de login "CAPTCHA" | Faça login pelo navegador e cole o código de autorização |

Para jogos particularmente teimosos, o Heroic permite selecionar versões específicas do Wine-GE ou Kron4ek vanilla builds — builds comunitárias que incluem patches ainda não integrados ao Proton oficial.

```terminal
$ ls ~/.config/heroic/tools/wine/
Wine-GE-8-25/  Proton-GE-9-12/  Wine-GE-8-26/
```

## Resumo

- O Heroic Games Launcher usa o Legendary como backend para acessar a API da Epic Games Store
- `legendary auth` autentica, `legendary list-games` mostra a biblioteca e `legendary sync-saves` gerencia saves na nuvem
- Cada jogo instalado pelo Heroic ganha um prefixo Wine isolado com versão do Proton configurável
- Jogos grátis semanais podem ser resgatados com `legendary buy <slug>` sem abrir navegador
- Anti-cheats de kernel (EAC, BattlEye) continuam sendo o maior obstáculo, assim como na Steam

## Exercícios

1. Instale o Heroic pelo Discover (Flatpak). Faça login na Epic e liste sua biblioteca. Quantos jogos você tem?
2. Instale um jogo leve da sua biblioteca Epic (ex.: Celeste, Inside) e execute-o com Proton Experimental. Funcionou de primeira?
3. No terminal, use `legendary list-saves` e depois `legendary sync-saves <slug>` para baixar os cloud saves de um jogo. Verifique o diretório de destino.
4. Resgate o jogo grátis da semana com `legendary list-free` e `legendary buy`. Depois confirme no Heroic que ele aparece na biblioteca.
5. **Desafio.** Escolha um jogo da Epic que apresente problemas (tela preta, crash, sem vídeo). Diagnostique a causa usando logs do Heroic (`~/.config/heroic/logs/`) e o ProtonDB. Aplique a correção e documente os passos em um script de instalação que configure o prefixo automaticamente.