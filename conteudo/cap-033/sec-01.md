No Steam Deck, o navegador é mais do que um jeito de ler sites: ele é a porta de entrada para uma camada inteira de serviços que não têm aplicativo nativo no SteamOS — Xbox Cloud Gaming, GeForce NOW, web apps como o Google Docs ou o Figma. Tudo isso roda dentro de uma janela do navegador, então a escolha entre Firefox e Chrome não é só uma questão de gosto: afeta privacidade, desempenho e compatibilidade com sites que exigem codecs específicos.

:::objetivos
- Entender por que o navegador é central no ecossistema do Deck
- Instalar Firefox e Chrome via Flatpak no seu equipamento
- Comparar os dois navegadores quanto a privacidade, codecs e integração
- Reconhecer as limitações de um navegador rodando no modo desktop do SteamOS
:::

## Por que o navegador é a porta de entrada no Deck

O SteamOS é um sistema imutável: o diretório raiz é somente leitura e todo software de terceiros chega empacotado como Flatpak, rodando isolado do resto do sistema. A consequência prática é que poucas empresas publicam builds nativas para o Deck. Muita coisa que em um notebook você instalaria como um aplicativo — um editor de planilhas, um cliente de streaming, até jogos por streaming — acaba existindo no Deck apenas na forma de um site.

É por isso que a experiência de navegação importa tanto. O Xbox Cloud Gaming roda no navegador por design, o GeForce NOW também, e o modo desktop do Deck depende do navegador para tarefas triviais como baixar um binário, ler documentação ou acessar o painel de um servidor caseiro. Quem domina o navegador domina a parte "computador de verdade" do aparelho.

:::info
O modo desktop do SteamOS é um KDE Plasma rodando sobre Arch Linux (SteamOS 3) ou sobre Ubuntu (SteamOS 3.6, base Noble). O navegador que você instala de dentro do desktop vive no mesmo mundo dos jogos: ele não é removido nem bloqueado por nenhuma atualização de sistema, mas também não sobrevive a um *factory reset* do console.
:::

## Instalando Firefox

O Firefox vem disponível no repositório Flathub, o que significa que ele pode ser instalado sem adicionar repositórios externos. No Deck, o navegador de referência sugerido pela própria Valve é justamente o Firefox, porque ele é 100% software livre e não depende dos codecs proprietários que o Chrome embute.

```terminal
$ flatpak install org.mozilla.firefox
Looking for matches…
Found ref ‘app/org.mozilla.firefox/x86_64/stable’ in remote ‘flathub’ (system).
Required runtime for org.mozilla.firefox/x86_64/stable (runtime/org.mozilla.firefox.BaseApp/x86_64/23.08) found in remote flathub
Do you want to install it? [Y/n]: Y
Installing… 19%
```

O instalador pergunta antes de baixar porque o Flatpak resolve dependências automaticamente. O runtime `org.mozilla.firefox.BaseApp` é um ambiente mínimo que o Firefox precisa para rodar; ele é baixado uma única vez e reaproveitado por qualquer atualização futura.

Para lançar o navegador:

```terminal
$ flatpak run org.mozilla.firefox
```

Na primeira execução o Firefox pede para importar dados de outro navegador e criar um perfil. A partir daí ele aparece no menu de aplicativos do KDE, então você não precisa abrir o terminal toda vez — o comando `flatpak run` é só a forma canônica de lançar qualquer Flatpak.

## Instalando Chrome

O Chrome não está no Flathub oficial. Ele é distribuído pelo Google como um pacote `.deb`, e quem mantém o empacotamento Flatpak é a comunidade. Para instalar é preciso adicionar o repositório mantido pela Flathub ou usar o Flatpak já com o `com.google.Chrome` disponível em repositórios de terceiros. No SteamOS atualizado o caminho mais simples é instalar o Chromium, o navegador de código aberto que serve de base ao Chrome.

```terminal
$ flatpak install com.google.Chrome
Looking for matches…
Found ref ‘app/com.google.Chrome/x86_64/stable’ in remote ‘flathub’ (system).
Required runtime for org.freedesktop.Platform/x86_64/23.08 found in remote flathub
Do you want to install it? [Y/n]: Y
```

A diferença que importa aqui não está no instalador, mas no que cada navegador traz embutido. O Chrome vem com o codec Widevine para DRM, o que o torna capaz de reproduzir conteúdo protegido — Netflix, Spotify web, serviços de streaming — sem configuração extra. O Firefox tenta fazer o mesmo via a biblioteca Widevine baixada sob demanda, mas é comum precisar habilitá-la manualmente.

:::atencao
Não instale Chrome e Chromium ao mesmo tempo se o objetivo é só ver um vídeo com DRM. Os perfis são separados, ocupam espaço duas vezes e os dois navegadores competem pela mesma biblioteca Widevine. Escolha um para ser seu navegador "de conteúdo" e use o outro apenas para testes.
:::

## Comparando os dois

| Critério | Firefox | Chrome/Chromium |
|---|---|---|
| Software livre | Sim, integral | Parcial (Chrome não é) |
| Codecs proprietários | Sob demanda | Embutidos |
| DRM (Widevine) | Manual, às vezes trava | Funciona de fábrica |
| Consumo de RAM | Menor | Maior |
| Telemetria | Mínima, desativável | Coleta por padrão |
| Preferência da Valve | Indicado | Não indicado |

Nenhum dos dois é "melhor" no abstrato. O Firefox ganha em privacidade e leveza, o Chrome ganha em compatibilidade de conteúdo fechado. No Deck, onde a RAM é compartilhada com o jogo rodando em segundo plano, a leveza do Firefox conta pontos; mas se sua rotina é ver Netflix no modo desktop, o Chrome resolve de primeira.

## Resumo

- No Deck, o navegador substitui aplicativos que não têm build nativa, como streaming de jogos e web apps.
- O SteamOS é imutável, então Firefox e Chrome chegam como Flatpak, isolados do sistema.
- Firefox é o navegador de referência sugerido: livre, leve e com telemetria mínima.
- Chrome embute codecs e Widevine, reproduzindo DRM e conteúdo protegido sem fricção.
- `flatpak run org.mozilla.firefox` e `flatpak run com.google.Chrome` lançam os navegadores pelo terminal.

## Exercícios

1. Instale o Firefox com `flatpak install org.mozilla.firefox` e confirme a versão exata com `flatpak info org.mozilla.firefox`.
2. Liste todos os Flatpaks de navegador disponíveis no seu repositório com `flatpak search browser` e identifique pelo menos três aplicações.
3. Abra o Firefox e acesse o site do Xbox Cloud Gaming. Anote se o conteúdo carregou e, se não, qual erro de codec apareceu.
4. Compare o consumo de memória dos dois navegadores abertos na mesma página usando `flatpak ps` para achar os processos.
5. **Desafio.** Instale o Chrome, reproduza um vídeo com DRM e depois repita o teste no Firefox. Explique, com base na tabela da seção, por que o resultado difere e proponha uma configuração de Firefox que chegue perto do comportamento do Chrome.
