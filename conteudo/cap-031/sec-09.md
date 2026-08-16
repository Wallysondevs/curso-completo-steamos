Você já domina o vocabulário das permissões. Agora é hora de consolidar: reunir os comandos essenciais num mapa mental que funcione no dia a dia, conhecer os erros que todo mundo comete e saber para onde ir quando o Flatseal não for suficiente. Esta seção fecha o capítulo transformando conhecimento disperso em reflexo.

No SteamOS, onde um Deck é ao mesmo tempo console e computador, esse reflexo importa dobrado: você instala jogos, emuladores e utilitários vindos de fontes variadas, e a diferença entre um sistema limpo e um pantanal de permissões soltas é você quem faz.

:::objetivos
- Consolidar os comandos `flatpak override`, `flatpak info` e `flatpak list` usados ao longo do capítulo
- Reconhecer os cinco erros mais comuns ao gerenciar permissões Flatpak
- Identificar as limitações do Flatseal e quando ir para o terminal
- Aplicar uma rotina de manutenção permissiva contínua
:::

## O mapa dos comandos

O capítulo inteiro orbita três comandos do `flatpak` e uma GUI. Vale fixar o que cada um faz:

| Comando | O que revela ou faz |
|---|---|
| `flatpak list --app` | Lista os apps instalados |
| `flatpak info -m <id>` | Mostra os **metadados brutos do pacote** (o que o mantenedor declarou) |
| `flatpak override --show <id>` | Mostra o **estado final** (pacote + sistemas + usuário) |
| `flatpak override --user <flags> <id>` | Escreve um override no escopo do usuário |
| `flatpak override --user --reset <id>` | Apaga todos os seus overrides daquele app |

A distinção mais repetida do capítulo — pacote versus override — se resume a um par de comandos:

```terminal
$ flatpak info -m org.gimp.GIMP | grep filesystems
filesystems=~/.config/GIMP;xdg-pictures;xdg-download;
$ flatpak override --show org.gimp.GIMP | grep filesystems
filesystems=~/.config/GIMP;xdg-pictures;xdg-download;xdg-documents;
```

A diferença entre as duas saídas (`+xdg-documents`) é exatamente a camada que você adicionou. Esse reflexo de "comparar as duas saídas" resolve 90% das dúvidas de auditoria sem abrir o Flatseal.

Os três comandos de consulta completam o triângulo da leitura:

```terminal
$ flatpak list --app --columns=application,installation
Application ID                Installation
org.mozilla.firefox           system
org.gimp.GIMP                 system
com.github.tchx84.Flatseal    user

$ flatpak info -m org.gimp.GIMP | head -20
[Context]
filesystems=~/.config/GIMP;xdg-pictures;xdg-download;
sockets=x11;wayland;
devices=dri;

[Environment]
```

`list` dá o inventário, `info -m` mostra o que o pacote declarou, e `override --show` mostra o que vale de fato. Dominar esses três é dominar a auditoria.

## Os cinco erros que todo mundo comete

**1. Confundir `home` com leitura segura.** `filesystems=home` é leitura **e escrita** na sua pasta pessoal inteira. Não é "inocente".

**2. Negar `dri` por excesso de zelo.** Você lê que "menos permissão é sempre melhor", nega `dri` de um app gráfico e ele desaba em software rendering, sugando a bateria do Deck. `dri` é necessário para aceleração — não entre nessa lista de "permissão a remover".

**3. Não testar depois de aplicar.** O override não avisa nada. Você nega uma permissão, fecha, esquece, e três dias depois o app "não salva mais". Sempre abra e use o app depois de cada mudança.

**4. Usar `--system` por costume.** No SteamOS, o `--system` pede senha e mexe em camada que a Valve gerencia. Prefira `--user`, que é seu, reversível e não interfere no sistema imutável.

**5. Acumular overrides sem documentar.** Um ano depois você tem vinte apps com overrides não registrados e nenhuma memória do porquê. O `~/lab/permissoes.md` da seção anterior é o antídoto.

:::atencao
O erro 2 merece reforço porque é o mais "bem intencionado". Gente que acabou de aprender sobre endurecimento vê `devices=dri` e acha que é permissão a cortar. Não é: `dri` é a porta de acesso à GPU, e sem ele seu navegador vira uma apresentação de slides. Corte `all`, corte `input`, corte `system-bus` — deixe `dri` e `shm`.
:::

## Quando o Flatseal não dá conta

O Flatseal cobre permissões de contexto (filesystem, sockets, devices, session bus, environment). Mas existem coisas que ele não faz, e é aí que o terminal assume:

- **Overrides globais** (sem ID de app) — o Flatseal é por app.
- **Comparar pacote vs. override** — o Flatseal mostra o estado final, não a origem.
- **Auditoria em lote** — o loop `for` sobre `flatpak list` não tem equivalente visual.
- **Portais e comportamento runtime** — o Flatseal não liga/desliga portais; isso é runtime.

Nenhuma dessas limitações é defeito. O Flatseal é uma GUI para a camada de overrides, e faz isso bem. O terminal é a ferramenta completa, e saber quando trocar de uma para outra é parte da maturidade aqui.

## Manutenção permissiva contínua

Endurecer uma vez e nunca mais olhar é como limpar a casa uma vez na vida. Permissões mudam: atualizações de app podem trazer novas permissões no pacote, novos apps chegam, e apps que você não usa mais deveriam sair.

Uma rotina mensal de dez minutos:

```terminal
$ flatpak list --app --columns=application
$ flatpak uninstall --unused
$ for app in $(flatpak list --app --columns=application); do
    echo "== $app =="; flatpak override --show "$app" | grep -E 'filesystems|sockets|devices'; done
```

O `flatpak uninstall --unused` remove runtimes órfãos que ficam acumulados após desinstalações. O loop re-exibe o estado de tudo, para você detectar mudanças introduzidas por atualizações. Se algo novo apareceu num app que você já tinha auditado, é hora de rever a decisão.

:::dica
Acompanhar atualizações que mudam permissões é chato manualmente. Uma heurística simples: rode o loop de auditoria **depois de toda atualização grande de sistema** do Deck (a Valve empurra atualizações de base regularmente) e depois de instalar qualquer app novo. Duas rotinas, cobertura total.
:::

## Resumo

- O capítulo orbita `flatpak list`, `flatpak info -m` e `flatpak override`, com o Flatseal como GUI por cima.
- Comparar `info -m` (pacote) com `override --show` (estado final) responde a maioria das dúvidas de auditoria.
- Cinco erros frequentes: tratar `home` como seguro, negar `dri`, não testar, usar `--system` sem necessidade e não documentar.
- O Flatseal não faz overrides globais, comparação de origem, auditoria em lote nem controle de portais.
- Manutenção contínua: `flatpak uninstall --unused` e re-auditoria após atualizações e novas instalações.

## Exercícios

1. Centralize num arquivo `~/lab/permissoes.md` o mapa de comandos da tabela acima, com um exemplo real de cada um na sua máquina.
2. Rode `flatpak uninstall --unused` e registre quantos runtimes órfãos foram liberados.
3. Execute o loop de auditoria em lote e compare o resultado com a sua última varredura (se já fez uma). Alguma permissão mudou?
4. Para um app, reproduza o "comparar pacote vs. override" com `info -m` e `override --show`, e escreva em uma frase o que veio de onde.
5. **Desafio.** Monte uma rotina mensal completa em um único script shell (`~/lab/audita-flatpaks.sh`) que: liste os apps, mostre as três permissões principais de cada, execute `uninstall --unused` e grave tudo num log datado. Rode-o e interprete a saída.