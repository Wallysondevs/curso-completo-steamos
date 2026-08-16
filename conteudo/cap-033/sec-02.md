O Firefox no Flatpak do SteamOS já chega com a maioria das proteções ativadas, mas o modelo de sandbox do Flatpak adiciona uma camada extra que nem todo mundo conhece: o navegador não vê o sistema de arquivos hospedeiro por padrão. Isso é uma faca de dois gumes — protege contra malware, mas dificulta salvar um arquivo na pasta de um jogo. Entender essas duas camadas de isolamento, a do Flatpak e a do próprio navegador, é o que separa um Firefox funcional de um Firefox que bloqueia sites legítimos sem você saber por quê.

:::objetivos
- Configurar o Firefox dentro da sandbox Flatpak com as permissões certas
- Ajustar o Enhanced Tracking Protection para o uso no Deck
- Entender como o DNS-over-HTTPS funciona no Flatpak
- Identificar os diretórios que o Firefox consegue acessar sem pedir ajuda
:::

## A sandbox do Flatpak e como ela afeta o navegador

Quando você instala o Firefox via Flatpak, ele roda com um conjunto mínimo de permissões. Por padrão, o navegador vê apenas o diretório `~/Downloads`, o diretório temporário e a rede. Não vê a raiz do sistema, não lê arquivos em `~/.config`, não acessa a pasta do Steam.

```terminal
$ flatpak info --show-permissions org.mozilla.firefox

[Context]
shared=network;ipc;

[Session Bus Policy]
org.freedesktop.secrets=talk
org.freedesktop.Notifications=talk
org.a11y.Bus=talk

[Environment]
MOZ_ENABLE_WAYLAND=1

[File System]
xdg-download:rw
xdg-run/speech-dispatcher:ro
```

A saída mostra que `xdg-download` (que no Deck mapeia para `~/Downloads`) é o único diretório com permissão de leitura e escrita (`:rw`). Qualquer outra pasta dentro do `~/`, como `~/Documents` ou `~/lab`, é invisível para o navegador. Isso é por design: se um site malicioso explorar uma vulnerabilidade do Firefox, ele não conseguirá ler os arquivos do SteamOS — mesmo os de usuário.

## Ajustes de privacidade dentro do Firefox

O Firefox vem com o **Enhanced Tracking Protection** ativado no modo padrão. Dentro das configurações (`about:preferences#privacy`), o Deck se beneficia do modo **Estrito**, que bloqueia rastreadores em todas as janelas, inclusive as anônimas.

```terminal
$ flatpak run org.mozilla.firefox about:preferences#privacy
```

No `about:preferences#privacy` você encontra três configurações que valem o clique:

- **DNS over HTTPS**: por padrão o Firefox no Flatpak herda o DNS do sistema, mas você pode forçar o Cloudflare ou NextDNS. Isso impede que seu provedor de internet veja quais domínios o Deck acessa.
- **Cookies e dados de sites**: configurar para "apagar cookies ao fechar" evita acúmulo no SSD de 64 GB, que é um problema real nos Decks de entrada.
- **Telemetria**: desmarque "Permitir que o Firefox envie dados técnicos". A coleta é pequena, mas no Deck cada thread conta.

:::dica
Use `about:profiles` para criar um perfil separado chamado `deck-gaming`. Assim, os cookies do Xbox Cloud Gaming e do GeForce NOW não se misturam com os da sua conta bancária. Para alternar entre perfis, lance o Firefox com `flatpak run org.mozilla.firefox -P deck-gaming`.
:::

## Habilitando o Widevine de forma confiável

O Firefox Flatpak tenta baixar o Widevine automaticamente na primeira vez que você acessa um site com DRM, mas a lógica de download às vezes falha silenciosamente. Para forçar:

```terminal
$ flatpak run --command=sh org.mozilla.firefox -c \
  'ls ~/.var/app/org.mozilla.firefox/.mozilla/firefox/*.default*/gmp-widevinecdm/'
```

Se o diretório não existir ou estiver vazio, abra `about:addons`, clique em **Plugins** e ative manualmente o Widevine Content Decryption Module. Se ele não aparecer na lista, o Firefox baixa depois do próximo reinício — ou você pode instalar o pacote `ffmpeg-full` dentro do sandbox, embora no Deck o Flatpak não suporte essa injeção.

:::atencao
Nunca copie um `libwidevinecdm.so` manualmente de uma instalação do Chrome para o Firefox Flatpak. A sandbox impede que a biblioteca acesse os sockets do DRM, e o pior: você pode quebrar a assinatura do Flatpak, o que trava futuras atualizações automáticas.
:::

## Onde os arquivos realmente ficam

O Firefox Flatpak não grava no `~/.mozilla` tradicional. Todos os dados — perfil, extensões, favoritos — vão para:

```terminal
$ ls -la ~/.var/app/org.mozilla.firefox/.mozilla/firefox/
total 24
drwxr-xr-x 4 deck deck 4096 May 12 14:22 .
drwxr-xr-x 3 deck deck 4096 May 12 14:21 ..
drwxr-xr-x 9 deck deck 4096 May 12 14:30 x9k3m2q.default-release
-rw-r--r-- 1 deck deck   94 May 12 14:22 profiles.ini
```

Cada perfil ganha uma subpasta com nome aleatório (aqui, `x9k3m2q.default-release`). O `profiles.ini` aponta para o perfil padrão. Isso importa porque, se você quiser fazer backup dos favoritos antes de um reset de fábrica, é esse diretório que deve ser copiado para um pendrive — e não `~/.mozilla`, que no SteamOS nem existe fora da sandbox.

## Resumo

- O Firefox Flatpak só enxerga `~/Downloads` por padrão; o resto do sistema de arquivos está bloqueado pela sandbox.
- O Enhanced Tracking Protection no modo Estrito bloqueia rastreadores em todas as janelas.
- O DNS-over-HTTPS impede que o provedor veja os domínios acessados, útil quando o Deck está no Wi-Fi de um hotel.
- O Widevine pode falhar silenciosamente no Flatpak; `about:addons` → Plugins é o lugar para verificá-lo.
- Os dados reais do perfil ficam em `~/.var/app/org.mozilla.firefox/.mozilla/firefox/`.

## Exercícios

1. Liste as permissões do Firefox Flatpak com `flatpak info --show-permissions org.mozilla.firefox` e explique o que cada linha significa.
2. Crie um perfil separado chamado `deck-cloud` usando `about:profiles` e configure-o como padrão para os próximos lançamentos.
3. Acesse um site com DRM (Netflix, Prime Video) no Firefox. Se não funcionar, vá até `about:addons` → Plugins e diagnostique o motivo.
4. Faça um backup do diretório `~/.var/app/org.mozilla.firefox/.mozilla/firefox/` para um pendrive com `cp -r`.
5. **Desafio.** Configure o DNS-over-HTTPS para usar NextDNS com perfil de bloqueio de anúncios. Depois, acesse `https://dnsleaktest.com` e confirme que seu IP não vazou — compare com o resultado sem o DoH ativado.