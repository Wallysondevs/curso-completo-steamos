Entre todas as ferramentas comunitárias do Steam Deck, o **Decky Loader** é a mais transformadora. Ele injeta um carregador de plugins dentro do próprio Steam, permitindo adicionar botões, painéis e utilitários direto na interface do modo jogo — sem tocar em `/usr` e sem exigir jailbreak do modo leitura. Entender como ele se encaixa no sistema é o primeiro contato real com o "homebrew" do Deck.

:::objetivos
- Entender o que é e como funciona o Decky Loader
- Instalar o Decky Loader pelo instalador oficial
- Navegar pelo menu de plugins e instalar os essenciais
- Desinstalar o Decky Loader de forma limpa quando necessário
:::

## O que o Decky Loader é (e não é)

O Decky Loader não é um jogo, não é um emulador e não é um fork do SteamOS. É um **plugin loader**: um programa que se integra ao processo do Steam, abre um menu dentro da interface do modo jogo e hospeda dezenas de plugins escritos pela comunidade. Tudo roda sobre o Steam que você já tem, estendendo a UI em vez de substituí-la.

Por isso ele é seguro em relação ao modo leitura: o Decky instala seus arquivos dentro de `/home/deck`, não em `/usr`. Quando uma atualização do Steam (o cliente, não o sistema) chega, o Decky pode precisar de atualização para acompanhar a nova versão da UI, mas ele **não é apagado** pela atualização do sistema. Essa é a diferença prática entre ele e os pacotes via `pacman` que você viu na [seção anterior](#/cap-081/sec-03).

A comunidade por trás dele é grande e ativa no GitHub (`SteamDeckHomebrew`). Plugins populares incluem o **ProtonDB Badges** (mostra a classificação dos jogos), o **CSS Loader** (temas visuais para a interface), o **PowerTools** (ajuste fino de CPU/GPU/TDP) e o **Audio Loader** (músicas e efeitos sonoros).

## Instalando pelo script oficial

A instalação é feita com um único comando, mas ele merece leitura atenta. O instalador oficial é um script que você baixa e executa:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
```

:::atencao
`curl ... | sh` baixa um script da internet e o executa imediatamente, sem que você veja o conteúdo. É uma prática comum no mundo do homebrew, mas deveria sempre te fazer pausar. Se quiser auditar, baixe o script primeiro (`curl -LO ...`) e leia antes de executar (`sh install_release.sh`). Neste curso, ao usar `curl | sh` para ferramentas conhecidas, aceitamos a confiança na comunidade — mas o hábito de auditar scripts é o que separa um usuário cuidadoso de um descuidado.
:::

O instalador faz algumas coisas importantes: detecta se o Steam está rodando, baixa a versão correta do Decky para o seu canal (stable ou beta) e a instala em `~/.local/share/Steam/`. Ao final, pede que você reinicie o Steam ou o Deck.

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/install_release.sh | sh
  % Total    % Received % Xferd  Average Speed   Time    Time     Time  Current
                                 Dload  Upload   Total   Spent    Left  Speed
100  8123  100  8123    0     0  42319      0 --:--:-- --:--:-- --:--:-- 42402
...
Decky Loader installed successfully.
Please restart Steam (or the Deck) for changes to take effect.
```

Depois de reiniciar, o Deck aparece com um novo ícone de "plugue" no menu rápido (o botão `...`), de onde você gerencia todos os plugins.

## A árvore de arquivos do Decky

Diferente do `pacman`, que espalha arquivos em `/usr`, o Decky mantém tudo em um lugar só, dentro da sua home:

```terminal
$ find ~/homebrew -maxdepth 2 -type d | head -20
/home/deck/homebrew
/home/deck/homebrew/services
/home/deck/homebrew/plugins
/home/deck/homebrew/settings
/home/deck/homebrew/logs
```

O caminho `~/homebrew` é o coração do sistema. Dentro dele, `plugins/` guarda cada plugin instalado (um por subpasta), `settings/` contém as configurações, `services/` os serviços que rodam em segundo plano e `logs/` os registros de diagnóstico. Se algo quebra, este é o primeiro lugar a olhar.

```terminal
$ ls ~/homebrew/plugins/
ProtonDB Badges/
CSS Loader/
PowerTools/
Audio Loader/
```

Cada pasta de plugin segue uma convenção de nome — o mesmo que aparece na loja dentro do Deck. Quando você instala um plugin pelo menu, o Decky apenas descompacta uma nova pasta aqui.

## Instalando e gerenciando plugins

A gestão é feita inteiramente pela interface, mas vale conhecer os bastidores. No menu do Decky (botão `...` → ícone de plugue), você encontra uma "loja" com plugins de uma ou duas categorias principais: os **estáveis** e os **de desenvolvimento**. A diferença é o nível de testes — plugins estáveis passaram por revisão; os de desenvolvimento podem quebrar a cada atualização do Steam.

:::dica
Comece com plugins estáveis e populares antes de mergulhar nos de desenvolvimento. Um plugin mal-comportado pode derrubar o Steam, e a depuração envolve entender os logs em `~/homebrew/logs/`. Quando algo travar, desative todos os plugins e reative um a um — esse é o procedimento padrão de isolamento.
:::

Na linha de comando, você pode inspecionar a configuração de um plugin:

```terminal
$ cat ~/homebrew/settings/powertools.json
{
  "smt": true,
  "boost": false,
  "tdp_limit": "15000",
  "gpu_tdp_limit": "14000"
}
```

Plugins como o PowerTools salvam suas preferências em arquivos JSON dentro de `settings/`. Ler esses arquivos é uma forma de auditar o que está ativo sem navegar por menus — e de fazer backup da sua configuração antes de uma reinstalação.

## Desinstalando sem deixar rastro

Existem dois caminhos para remover o Decky. O mais simples é usar o menu dentro da interface (Configurações → Desinstalar Decky Loader). Por linha de comando, o instalador também aceita a flag de desinstalação:

```terminal
$ curl -L https://github.com/SteamDeckHomebrew/decky-installer/releases/latest/download/uninstall.sh | sh
```

Ambos removem os binários e o menu. Se quiser apagar também plugins e configurações, remova a pasta manualmente:

```terminal
$ rm -rf ~/homebrew
```

:::perigo
`rm -rf ~/homebrew` apaga todos os plugins, configurações e logs de uma vez, e não há lixeira. Só faça isso se tiver certeza de que não quer nada do que estava ali. Para uma remoção mais segura, renomeie a pasta primeiro (`mv ~/homebrew ~/homebrew.bak`) e veja se o Steam volta a funcionar normalmente antes de apagar em definitivo.
:::

## Resumo

- O Decky Loader é um plugin loader que injeta um menu de plugins no Steam, rodando dentro de `/home/deck`.
- Por instalar em `/home` e não em `/usr`, ele sobrevive às atualizações do sistema (embora possa exigir atualização quando o cliente Steam muda).
- A instalação oficial usa `curl -L <instalador> | sh`, seguido de reinício do Steam.
- Os arquivos vivem em `~/homebrew/`: `plugins/`, `settings/`, `services/` e `logs/`.
- Para isolar travamentos, desative todos os plugins e reative um a um; os logs estão em `~/homebrew/logs/`.
- A desinstalação pode ser feita pelo menu, pelo script, ou apagando `~/homebrew` (com cuidado).

## Exercícios

1. Instale o Decky Loader pelo script oficial e confirme que o ícone de plugue apareceu no menu rápido. Liste o conteúdo de `~/homebrew/` para ver a estrutura criada.
2. Instale dois plugins estáveis da loja (como ProtonDB Badges e CSS Loader) e verifique que cada um ganhou uma subpasta em `~/homebrew/plugins/`.
3. Aplique um tema com o CSS Loader e encontre o arquivo de configuração correspondente em `~/homebrew/settings/`. O que ele contém?
4. Desative todos os plugins, reinicie o Steam e reative um por um registrando o comportamento. Um plugin sozinho causa algum problema?
5. **Desafio.** Faça backup da pasta `~/homebrew/settings/` para `~/backups/decky/` com `cp -r`, desinstale o Decky Loader pelo script e reinstale. Qual configuração foi preservada e qual se perdeu? Proponha um script que restaure suas configurações de forma idempotente.