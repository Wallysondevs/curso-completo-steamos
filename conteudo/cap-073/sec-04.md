Instalar o Decky Loader é só a metade. A outra metade é o que transforma o carregador num ecossistema: a loja de plugins, o **Plugin Browser**. É por ela que você descobre e instala centenas de extensões sem sair do Game Mode. Por baixo da interface bonita, porém, a loja é apenas um catálogo de URLs que apontam para repositórios — e entender isso permite instalar plugins que não estão na loja oficial, criar espelhos e auditar o que você está prestes a baixar.

:::objetivos
- Navegar no Plugin Browser do Decky e entender suas seções
- Instalar, desinstalar e gerenciar plugins pela loja
- Instalar um plugin a partir de uma URL direta
- Entender o que é um "store" e como o Decky resolve os catálogos
- Auditar um plugin antes de instalá-lo
:::

## A loja vista de dentro

Com o Decky instalado e o Game Mode aberto, pressione `...` para abrir o Menu Rápido, toque no ícone do Decky e depois no ícone de engrenagem ou na opção de loja. A interface padrão abre o **Plugin Browser**, organizado em abas:

| Aba | O que mostra |
|---|---|
| **Instalados** | Plugins já baixados, com estado ativo/inativo |
| **Loja** | Catálogo de plugins disponíveis para instalar |
| **Configurações** | Preferências do próprio Decky Loader |

Na aba Loja, cada card traz nome, autor, uma breve descrição e, ao tocar, uma tela de detalhe com botão **Instalar**. A busca filtra por nome e por tags — as mesmas `publish.tags` que vimos no `plugin.json` da seção 3.

A instalação pela loja segue um fluxo em duas etapas que vale a pena enxergar em código. O que acontece por baixo é equivalente a:

```terminal
$ git clone --depth 1 https://github.com/autor/meu-plugin.git ~/homebrew/plugins/meu-plugin
$ cd ~/homebrew/plugins/meu-plugin
$ pnpm install && pnpm run build
```

O Decky baixa o código do plugin para `~/homebrew/plugins/<nome>/`, instala as dependências do frontend, compila o `dist/index.js` e dispara o ciclo de carregamento. É por isso que a primeira instalação de um plugin pode demorar alguns segundos a mais — há uma etapa de build (compilação) ali dentro.

## O catálogo não é mágico: é uma URL

O ponto mais importante desta seção: **a loja não tem os plugins dentro dela**. Ela carrega uma lista de "stores" — catálogos — e cada catálogo é, no fim, um repositório ou um JSON remoto que descreve os plugins com suas URLs de download.

```terminal
$ cat ~/homebrew/settings/decky.json
{
  "default_store": "https://plugin.steamdeckhomebrew.sh",
  "stores": {
    "steamdeckhomebrew": "https://plugin.steamdeckhomebrew.sh"
  }
}
```

O `decky.json` guarda qual loja está ativa e a lista de stores conhecidas. O valor `plugin.steamdeckhomebrew.sh` é o catálogo oficial mantido pela comunidade SteamDeckHomebrew. Tocar "Configurações" e depois "instalar por URL" adiciona um store novo, ou instala um plugin apontando diretamente para o repositório dele.

:::nota
O domínio `plugin.steamdeckhomebrew.sh` é a loja padrão. Existem mirrors não-oficiais mantidos pela comunidade para contornar bloqueios de rede ou para testes. Use mirrors apenas se souber exatamente o que está fazendo — um mirror malicioso pode servir um "plugin" que é, na verdade, um cavalo de troia.
:::

## Instalar por URL direta

Para plugins que não estão na loja oficial — versões beta, forks, ou plugins de autores que ainda não publicaram — o caminho é instalar pela URL do repositório git:

1. Entre em Configurações → Instalar por URL.
2. Cole a URL, por exemplo `https://github.com/algum-dev/meu-plugin-teste`.
3. O Decky clona o repositório, compila e instala, igual à loja.

```terminal
$ cd ~/homebrew/plugins/
$ git clone https://github.com/algum-dev/meu-plugin-teste
$ ls
meu-plugin-teste/  SDH-AnimationChanger/  ...
```

O resultado no disco é indistinguível de um plugin vindo da loja — a única diferença é que aquele plugin não está atrelado a um catálogo, então não recebe atualização automática pelo fluxo da loja. Você terá que atualizá-lo manualmente (seção 6).

## Auditar antes de instalar

Porque instalar um plugin é baixar e executar código, o hábito de auditar vem antes da confiança. Antes de tocar em Instalar, três checagens de 30 segundos eliminam a maior parte do risco:

1. **De onde vem?** A loja do plugin aponta para o repositório original do autor, ou para um forks obscuro com histórico suspeito?
2. **O que está no `plugin.json`?** A flag `_root` aparece? Se um plugin de "tema de anime" pede root, desconfie.
3. **O que o código faz?** Abra o `main.py` no GitHub e procure por chamadas de rede para domínios estranhos, leitura de arquivos sensíveis ou `os.system`/`subprocess` com comandos não documentados.

```terminal
$ curl -s https://raw.githubusercontent.com/algum-dev/meu-plugin-teste/main/plugin.json
{
  "name": "Meu Plugin Teste",
  "author": "algum-dev",
  "flags": [],
  "api_version": 1
}
$ curl -s https://raw.githubusercontent.com/algum-dev/meu-plugin-teste/main/main.py | grep -nE "subprocess|os\.system|requests|urllib"
```

O segundo comando é um filtro grosseiro mas eficaz: lista as linhas do backend que fazem chamadas de sistema (`subprocess`, `os.system`) ou de rede (`requests`, `urllib`). Nenhuma delas é ilegítima por si só — um plugin de monitoramento de rede, por exemplo, precisa delas —, mas cada ocorrência merece uma justificativa que faça sentido para o propósito do plugin.

:::atencao
A loja do Decky é curada pela comunidade, mas a curadoria tem limites: revisão não é garantia de segurança, e plugins podem ser atualizados depois de revisados para incluir código novo. Auditar uma vez não dispensa re-auditar quando o plugin for atualizado, especialmente se o autor mudar o código sem mudar a versão.
:::

## Resumo

- O Plugin Browser organiza plugins em Instalados, Loja e Configurações; a instalação baixa, compila e carrega o plugin em `~/homebrew/plugins/`.
- A loja é um catálogo remoto, não um repositório físico de código; a URL padrão oficial é `plugin.steamdeckhomebrew.sh`.
- Instalar por URL direta clona um repositório git para `~/homebrew/plugins/` e pulsa o fluxo de build.
- Auditar antes de instalar: verificar origem, ler `plugin.json` (flag `_root`) e inspecionar `main.py` por chamadas de sistema/rede.
- Plugins instalados por URL direta não recebem atualização pelo fluxo da loja; exigem atualização manual.

## Exercícios

1. Abra a loja do Decky e encontre três plugins que você usaria no dia a dia. Anote o autor e a descrição de cada um.
2. Escolha um plugin da loja, localize o repositório dele no GitHub (o card geralmente tem o link) e baixe o `plugin.json` com `curl`. Ele contém a flag `_root`?
3. Use o comando `grep` do texto para auditar o `main.py` de um plugin: quantas chamadas de rede e de sistema ele faz? Cada uma tem justificativa plausível?
4. Instale um plugin por URL direta a partir de um repositório de teste. Compare com um plugin da loja: o que muda no fluxo de atualização?
5. **Desafio.** Localize o arquivo `decky.json` em `~/homebrew/settings/` e leia a lista de stores. Explique o que aconteceria se você apontasse `default_store` para um servidor que você controla — e por que isso é ao mesmo tempo poderoso (testes) e perigoso (segurança).