Depois de entender o que é Flatpak, a sandbox, os runtimes, o Flathub e a relação com os jogos, falta um passo: ir além. Nesta seção final, você vai aprender a compilar e instalar um aplicativo Flatpak a partir do código-fonte (usando o SDK e o `flatpak-builder`), entender o que é um manifest, e descobrir como contribuir e onde encontrar a documentação oficial. É o salto de consumidor para criador.

:::objetivos
- Compreender o papel do SDK e do `flatpak-builder` no desenvolvimento
- Ler e entender a estrutura de um arquivo manifest
- Compilar e instalar um aplicativo Flatpak a partir do código-fonte
- Configurar um ambiente de desenvolvimento no SteamOS
- Conhecer a documentação oficial e os canais de contribuição

:::

## SDK, manifest e flatpak-builder

Até aqui você foi um consumidor de Flatpaks. Para criar um, existem três peças: o **SDK** (o runtime de desenvolvimento, com compiladores), o **manifest** (um arquivo YAML que descreve como compilar), e o **flatpak-builder** (a ferramenta que lê o manifest e produz o `.flatpak`).

O SDK é a mesma coisa que o runtime, mais as ferramentas de build. O `org.freedesktop.Sdk` traz `gcc`, `make`, `pkg-config`, `cmake` — tudo que um build precisa. Se o aplicativo usa GTK, você usa o `org.gnome.Sdk`; se usa Qt, o `org.kde.Sdk`.

```terminal
$ flatpak install flathub org.freedesktop.Sdk//24.08
$ flatpak install flathub org.kde.Sdk//6.7
```

Os dois caracteres `//` separam o ID da branch. `org.freedesktop.Sdk//24.08` significa "o SDK Freedesktop, branch 24.08". Instalar o SDK é o primeiro passo — e note que ele é grande (o SDK do KDE passa de 1,5 GB), então faça isso num Steam Deck com espaço de sobra, ou num desktop.

O manifest descreve o build. Um manifest mínimo para um aplicativo "hello world" em C seria:

```yaml
app-id: org.example.Hello
runtime: org.freedesktop.Platform
runtime-version: '24.08'
sdk: org.freedesktop.Sdk
command: hello

modules:
  - name: hello
    sources:
      - type: git
        url: https://github.com/example/hello.git
```

Cada campo tem um papel: `app-id` é o identificador único (domínio reverso), `runtime` e `sdk` apontam para a base, `command` é o binário que o Flatpak executa ao rodar o aplicativo, e `modules` lista os componentes a compilar, cada um com suas `sources` (fonte do código).

## Compilando o primeiro Flatpak

Com o manifest escrito num arquivo (`org.example.Hello.yaml`), o build segue dois passos: compilar e depois "finalizar" o pacote.

```terminal
$ flatpak-builder build-dir org.example.Hello.yaml --force-clean
Downloading sources
Starting build of org.example.Hello
Building module hello in /home/ana/lab/build-dir/...
Compiling hello.c...
Installing into /app...
```

O `flatpak-builder` baixa as fontes, compila dentro de um ambiente isolado (o SDK numa sandbox), e instala o resultado num diretório de staging (`build-dir`). O `--force-clean` apaga o diretório de build antes de começar, garantindo um build limpo.

O segundo passo empacota o resultado num arquivo instalável. Para rodar o aplicativo direto do build (sem empacotar), use `flatpak-builder --run`:

```terminal
$ flatpak-builder --run build-dir org.example.Hello.yaml hello
Hello, world!
```

O `--run` executa o comando (`hello`) dentro do ambiente do build, sem instalar nada permanentemente. É o loop de desenvolvimento rápido: edita, recompila, roda, repete.

Finalmente, para instalar de verdade, exporte para um repositório local e instale:

```terminal
$ flatpak-builder --repo=my-repo build-dir org.example.Hello.yaml --force-clean
$ flatpak --user remote-add --no-gpg-verify my-repo my-repo
$ flatpak --user install my-repo org.example.Hello
```

Aqui, `--repo=my-repo` cria um repositório OSTree local, `remote-add` o adiciona como fonte, e `install` instala o aplicativo a partir dele. Após esses passos, `org.example.Hello` aparece em `flatpak list`.

:::nota
O `--no-gpg-verify` desativa a verificação de assinatura, o que só é aceitável num repositório local seu, para testes. Nunca desative a verificação num repositório remoto real.
:::

## Como um app vira um Flatpak no Flathub

Saber compilar localmente é a base; publicar no Flathub é o passo seguinte (e opcional). O fluxo do Flathub é centrado no Git: você envia o manifest para o repositório [flathub/](https://github.com/flathub) no GitHub, e a infraestrutura do Flathub compila e publica o aplicativo automaticamente.

O processo, em resumo:

1. Escreva o manifest (`*.yaml` ou `*.json`) e teste localmente com `flatpak-builder`.
2. Crie um fork do repositório `flathub/flathub` no GitHub.
3. Adicione sua pasta com o manifest e abra um *pull request*.
4. Os revisores do Flathub verificam o manifest, testam o build na infraestrutura, e aprovam.
5. O aplicativo é publicado e fica disponível para todos os usuários do Flathub.

A revisão humana é uma característica importante do Flathub: mantenedores experientes checam permissões, fontes de download e qualidade do pacote antes de publicar. É uma camada de confiança que protege toda a comunidade.

```terminal
$ flatpak install flathub org.example.Hello
Required runtime for org.example.Hello/x86_64/stable (runtime/org.freedesktop.Platform/x86_64/24.08) found in system installation
Installing in system:
org.example.Hello/x86_64/stable
```

Depois de publicado, qualquer usuário (inclusive você, no Steam Deck) instala com um único comando. É a mesma experiência que você viveu nas seções anteriores, vista de trás para frente.

## Onde aprender mais

A documentação oficial do Flatpak é excelente e é o ponto de partida para aprofundar. Os recursos essenciais:

| Recurso | URL | O que contém |
|---|---|---|
| Documentação oficial | [docs.flatpak.org](https://docs.flatpak.org) | Guias, referência de comandos, manifest |
| Manual do flatpak-builder | [docs.flatpak.org/en/latest/flatpak-builder](https://docs.flatpak.org/en/latest/flatpak-builder.html) | Referência completa do manifest YAML |
| Flatpak runtimes | [docs.flatpak.org/en/latest/available-runtimes](https://docs.flatpak.org/en/latest/available-runtimes.html) | Lista de runtimes e SDKs |
| Flathub | [flathub.org](https://flathub.org) | Loja e portal de submissão |

Para tirar dúvidas, os canais da comunidade são o fórum do Flathub e o Discourse do Flatpak. A comunidade é ativa e responde rápido — especialmente a perguntas bem formuladas com o erro completo e o manifest anexado.

:::dica
A melhor forma de aprender a escrever manifests é ler manifestos reais. Vá ao [github.com/flathub](https://github.com/flathub), escolha um aplicativo que você usa, abra o `*.yaml` dele e estude. Você vai reconhecer os campos que viu aqui (`app-id`, `runtime`, `modules`, `sources`) aplicados em projetos reais, com todas as complexidades do mundo real.
:::

## O ambiente de desenvolvimento no Steam Deck

Um aviso honesto: o Steam Deck é um ótimo *alvo* para Flatpak, mas não é a máquina ideal para *desenvolver* Flatpaks. As restrições de espaço (modelo 64 GB), a CPU limitada e o teclado virtual do desktop mode tornam a compilação lenta e desconfortável para trabalho sério.

Se você quiser mesmo assim experimentar, a dica é instalar os SDKs num cartão SD ou num drive externo, e usar um editor leve. O fluxo básico funciona normalmente — o Steam Deck roda a mesma pilha de ferramentas de qualquer PC Linux.

```terminal
$ flatpak install flathub org.freedesktop.Sdk//24.08
$ flatpak install flathub org.kde.Sdk//6.7
$ du -sh /var/lib/flatpak/runtime/org.freedesktop.Sdk/
1.7G    /var/lib/flatpak/runtime/org.freedesktop.Sdk/
```

Repare no tamanho: o SDK sozinho ocupa 1,7 GB, e o SDK do KDE adiciona mais. Num Steam Deck de 512 GB ou 1 TB isso é tolerável; num de 64 GB, é inviável. A recomendação prática: desenvolva num desktop, teste no deck.

## Contribuindo de volta

O ecossistema Flatpak é aberto, e contribuir não requer ser um programador experiente. As formas mais comuns de contribuir:

- **Empacotar um aplicativo** que ainda não está no Flathub.
- **Manter um aplicativo existente** (atualizar versões, corrigir manifests).
- **Reportar bugs** de aplicativos com comportamento incorreto na sandbox.
- **Melhorar a documentação** do Flatpak e do Flathub.

O primeiro passo mais acessível é o empacotamento de um aplicativo pequeno que você usa e que não está no Flathub. Muitos mantenedores começaram exatamente assim: notaram que faltava o aplicativo X, escreveram o manifest, e hoje são os responsáveis por ele no Flathub.

## Resumo

- O SDK (runtime + ferramentas de build), o manifest (YAML) e o `flatpak-builder` são as três peças para criar Flatpaks.
- `flatpak-builder` compila num diretório isolado; `--run` executa sem instalar e `--repo` exporta para um repositório local.
- O Flathub publica aplicativos via Git: você envia o manifest num *pull request* e a infraestrutura compila e distribui.
- A documentação oficial (docs.flatpak.org) e os manifests de exemplo no github.com/flathub são os melhores recursos de aprendizado.
- O Steam Deck é um ótimo alvo, mas o desenvolvimento confortável pede um desktop com mais espaço e CPU.

## Exercícios

1. Instale o SDK do Freedesktop com `flatpak install flathub org.freedesktop.Sdk//24.08` e verifique o espaço com `flatpak info --show-size org.freedesktop.Sdk`.
2. Escreva um manifest mínimo como o do exemplo, compile com `flatpak-builder` e rode com `--run`. Documente o que cada campo do manifest faz.
3. Baixe um manifest real do [github.com/flathub](https://github.com/flathub), de um aplicativo que você conhece, e identifique os campos `app-id`, `runtime`, `command` e `modules`.
4. Exporte seu build para um repositório local com `--repo`, adicione como remote e instale com `flatpak --user install`. Confirme com `flatpak list`.
5. **Desafio.** Modele o fluxo completo do Flathub sem publicar: crie um repositório Git local, coloque o manifest, simule a revisão verificando manualmente as permissões (`flatpak info --show-permissions`). Escreva, em um parágrafo, o que um revisor do Flathub checaria antes de aprovar seu aplicativo.
