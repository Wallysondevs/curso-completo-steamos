Proxy é um intermediário: em vez de o seu Deck falar diretamente com a internet, ele pede ao proxy que busque o conteúdo e devolva. Empresas, escolas e certos tipos de VPN exigem proxy para acessar a rede corporativa. No Modo Desktop, o KDE expõe uma configuração de proxy que afeta o navegador e aplicativos gráficos, mas o terminal e o Steam em si costumam ignorá-la. Esta seção mostra onde configurar, como testar e quais pontos cegos existem.

:::objetivos
- Configurar proxy HTTP/HTTPS e SOCKS no painel de rede do KDE
- Entender as variáveis de ambiente `http_proxy`, `https_proxy` e `no_proxy`
- Testar se o proxy está funcionando com `curl` e `wget`
- Reconhecer as limitações do proxy GUI em relação ao terminal
:::

## Onde configurar na interface do KDE

Dentro de System Settings → Rede → Proxy, há três modos: **Sem proxy**, **Usar a configuração de proxy do sistema** e **Usar configuração de proxy manual**. É o último que você seleciona quando a sua rede exige um endereço específico.

Os campos são diretos:

| Campo | Exemplo de valor |
|---|---|
| Proxy HTTP | `http://proxy.empresa.br:3128` |
| Proxy HTTPS | `http://proxy.empresa.br:3128` |
| Proxy FTP | `http://proxy.empresa.br:3128` |
| Proxy SOCKS | `socks://proxy.empresa.br:1080` |
| Ignorar proxy para | `localhost,127.0.0.1,.empresa.br` |

O último campo, "Ignorar proxy para", lista endereços que devem ser acessados **diretamente**, sem intermediário. É onde você coloca `localhost` e o domínio interno da empresa, que não existem na internet pública.

:::info
O proxy SOCKS opera em nível mais baixo que o HTTP, encaminhando qualquer tipo de tráfego TCP sem inspecioná-lo. É o preferido para tunelamento leve, enquanto o proxy HTTP tradicional só lida com tráfego web.
:::

## O vão entre GUI e terminal

A configuração que você define no painel do KDE é aplicada ao ambiente gráfico: o navegador (Firefox), o Discover e outros aplicativos KDE que usam as bibliotecas do Plasma a obedecem. Mas se você abrir o Konsole e rodar `curl` ou `wget`, eles não sabem que o proxy existe. Isso ocorre porque o terminal lê **variáveis de ambiente**, e a GUI do KDE não as define automaticamente.

Para o terminal usar o mesmo proxy, você exporta as variáveis manualmente — ou dentro de um script, ou no `~/.bashrc`:

```terminal
$ export http_proxy="http://proxy.empresa.br:3128"
$ export https_proxy="http://proxy.empresa.br:3128"
$ export no_proxy="localhost,127.0.0.1,.empresa.br"
```

A convenção é usar `http_proxy` com o mesmo valor para ambas as variáveis (já que `https_proxy` também passa por um proxy HTTP comum, via método `CONNECT`). Com essas variáveis no ar, `curl`, `wget`, `git` e boa parte das ferramentas de linha passam pelo proxy.

:::atencao
O comando `export` definido no terminal morre assim que você fechar a janela. Para tornar permanente, adicione as três linhas ao arquivo `~/.bashrc` e recarregue com `source ~/.bashrc`. Mas cuidado: se você levar o Deck para fora da empresa, essas variáveis vão causar erros de conexão, e você precisará removê-las ou comentá-las.
:::

## Testando com curl

O `curl` é o termômetro mais rápido para saber se o proxy funciona. Tente acessar um site com a flag `-v` (verbose), que mostra cada etapa da conexão:

```terminal
$ curl -v http://exemplo.com 2>&1 | head -20
*   Trying 192.168.1.200:3128...
* Connected to proxy.empresa.br (192.168.1.200) port 3128
> GET http://exemplo.com HTTP/1.1
> Host: exemplo.com
> Proxy-Connection: Keep-Alive
< HTTP/1.1 200 OK
< Date: Wed, 05 Jun 2024 21:35:00 GMT
...
```

A linha `Connected to proxy.empresa.br (192.168.1.200) port 3128` prova que o `curl` está conversando com o proxy, não diretamente com o servidor. Se você não exportar as variáveis e rodar `curl -v`, verá o IP público do destino, não o do proxy.

O `wget` também obedece `http_proxy`, mas o teste mais direto é com a saída de debug:

```terminal
$ wget -d http://exemplo.com 2>&1 | grep -i proxy
DEBUG output created by Wget 1.21.4 on linux-gnu.
Registered proxy http://proxy.empresa.br:3128
Resolving proxy.empresa.br (proxy.empresa.br)...
```

## Limitações e alternativas

Nem tudo no SteamOS passa pelo proxy da GUI. O próprio cliente Steam, os jogos, o `flatpak` e muitos comandos de sistema ignoram a configuração do KDE. Para aplicações que exigem proxy mas não suportam variáveis de ambiente, a saída é usar um túnel SOCKS local com `ssh -D`:

```terminal
$ ssh -D 1080 -N usuario@servidor-proxy
```

Esse comando cria um proxy SOCKS na porta `1080` do Deck, e qualquer programa que saiba usar SOCKS pode apontar para `socks://localhost:1080`. O navegador Firefox, por exemplo, tem sua própria seção de proxy nas preferências e pode usar esse túnel independentemente do que o KDE configurou.

:::dica
Para navegadores, uma alternativa confiável é a extensão FoxyProxy, que alterna perfis de proxy baseando-se em padrões de URL — útil quando você quer apenas algumas abas passando pelo proxy corporativo e outras indo direto.
:::

## Resumo

- O painel System Settings → Rede → Proxy do KDE configura proxies HTTP, HTTPS e SOCKS para o ambiente gráfico.
- Aplicativos de terminal (`curl`, `wget`, `git`) ignoram a GUI e exigem `export http_proxy`/`https_proxy`/`no_proxy`.
- `curl -v` e `wget -d` mostram a conexão com o proxy na saída, confirmando o intermediário.
- O cliente Steam e muitos jogos não passam pelo proxy do sistema; use SOCKS local (`ssh -D`) como alternativa.

## Exercícios

1. Abra System Settings → Rede → Proxy e configure um proxy HTTP falso (ex.: `http://localhost:9999`) e tente navegar — o que acontece e por quê?
2. Exporte `http_proxy` e `https_proxy` com o mesmo valor falso e rode `curl -v http://exemplo.com`; interprete a mensagem de erro.
3. Teste a exceção: defina `no_proxy="exemplo.com"` e `http_proxy="http://localhost:9999"` e veja se `curl http://exemplo.com` tenta usar o proxy ou não.
4. Adicione as variáveis ao `~/.bashrc` e recarregue com `source ~/.bashrc`; depois abra um novo terminal e confirme com `env | grep -i proxy`.
5. **Desafio.** Crie um túnel SOCKS com `ssh -D 1080 -N usuario@servidor` e configure o Firefox para usar `socks://localhost:1080`; compare o IP público antes e depois.