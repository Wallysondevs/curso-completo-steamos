Chegamos ao fim do capítulo — e ao fio condutor de toda a parte de emulação. Homebrew, traduções e ROM hacks formam uma comunidade viva há mais de trinta anos, sustentada por uma ética própria que mistura paixão, preservação e, sim, discussões espinhosas sobre direitos autorais. Entender essa cultura é tão importante quanto dominar o `flips`.

:::objetivos
- Mapear as comunidades e repositórios vivos de ROM hacking e homebrew
- Entender a posição legal dos patches (distribuir diff vs. distribuir o ROM)
- Aplicar a etiqueta da cena (créditos, pedidos de permission, não lucrar)
- Contribuir de volta: reportar bugs, traduzir READMEs, testar
- Consolidar o fluxo completo de emulação visto até aqui

:::

## Onde vive a comunidade

A cena se organiza em alguns polos que você deve conhecer de cor:

- **romhacking.net**: o arquivo histórico de hacks e traduções, com banco de dados pesquisável por sistema, gênero e status.
- **RetroAchievements**: a comunidade de conquistas (vista no capítulo 07), com fórum e servidor Discord.
- **itch.io**: casa de homebrew e jogos indie open-source, muitos com build Linux nativa.
- **GitHub/GitLab**: a maioria dos projetos de homebrew e ferramentas (incluindo o próprio Flips, emuladores e randomizers) vive aqui, com issues para bug reports.
- **Discord/forums dedicados**: cada hack famoso costuma ter seu servidor (ex.: comunidades de hacks de Pokémon e randomizers).

## A posição legal, resumida

O princípio que mantém a cena viva é o da **distribuição de patches, não de ROMs**:

- **Legalmente mais defensável**: distribuir um patch (arquivo de diferenças) não reproduz o jogo protegido — ele é inútil sem o ROM original que *você* possui.
- **Problemático**: distribuir o ROM já patcheado (que contém o material protegido) ou distribuir o ROM original completo.
- **Homebrew**: por ser original, é o caso mais limpo — os autores detêm os direitos e escolhem a licença.

Isso significa que, na prática, para usar um hack você precisa do ROM base, que por sua vez deveria vir de um cartucho/disco que você possui (dump próprio). A discussão sobre dead/abandonware é cinzenta e varia por jurisdição — a postura da comunidade é, em geral, incentivar o dump legal do seu próprio hardware.

## Etiqueta da cena

Existem normas não-escritas que todo novato deve respeitar:

- **Dê crédito**: se você divulgar um hack/tradução, cite autor e fonte. Muitos hacks têm anos de trabalho de graça embutidos.
- **Não lucre com o trabalho alheio**: revender ROMs patcheados ou homebrew de terceiros é a pior ofensa da cena.
- **Peça permissão para derivar**: quer fazer um hack em cima do hack de outro? Pergunte antes. Muitos autores liberam, outros pedem crédito ou licença específica.
- **Não "leak" patches em beta** sem autorização do autor.
- **Reporte bugs com evidência**: autor de hack não tem QA; seu bug report com save/seed ajuda demais.

## Contribuindo de volta

Não precisa ser programador para devolver valor à comunidade:

- **Testar** versões beta de hacks e reportar bugs.
- **Traduzir READMEs/documentação** de hacks para outras línguas (inclusive PT-BR).
- **Escrever guias** de como aplicar determinado hack no Steam Deck (a intersecção "emulação + Deck" ainda é carente de conteúdo).
- **Dumpar e preservar**: contribuir com dumps verificados e metadados para bancos como No-Intro.
- **Doar** para projetos de homebrew e ferramentas de código aberto que você usa.

## Consolidando o fluxo completo

Este capítulo fecha o arco da emulação. Reunindo tudo:

1. **Instale** os emuladores (EmuDeck/RetroArch) e as ferramentas (`flips`, `xdelta3`).
2. **Obtenha** os ROMs base (dump legal do seu hardware).
3. **Baixe** o patch/tradução/hack e leia o README (ROM base, ordem, pré-requisitos).
4. **Aplique** com a ferramenta certa, gerando novo arquivo, nunca sobrescrevendo.
5. **Organize** em `hacks/`, `traducoes/`, `homebrew/`, mantendo o ROM base intocado em `roms/`.
6. **Jogue** — e, se caçar conquistas, use o ROM original com hardcore.
7. **Devolva** à comunidade com bug reports, traduções e testes.

No Steam Deck, todo esse ciclo acontece num único aparelho portátil — o mesmo que roda seus AAAs — sem sacrificar nada da cena retrô. É o melhor dos dois mundos.

## Pontos-chave

- Comunidade vive em romhacking.net, itch.io, GitHub e Discords por hack.
- Distribua patches, não ROMs: o diff é legalmente mais defensável.
- Respeite créditos, permissão e não-lucro — a etiqueta sustenta a cena.
- Contribua testando, traduzindo e documentando.
- O fluxo completo do capítulo fecha o arco de emulação no Deck.

## Exercícios

1. Mapeie no romhacking.net 5 hacks/traduções que você quer jogar e anote o ROM base exigido por cada um.
2. Escreva um bug report de um hack (com seed/save, se aplicável) e poste no canal do projeto.
3. Traduza um README de hack/tradução para PT-BR e ofereça ao autor.
4. Faça dump legal de um cartucho/disco que você possui e valide o checksum contra No-Intro/Redump.
5. **Desafio.** Documente seu próprio fluxo completo de emulação no Deck num markdown, do dump ao jogo patcheado, e compartilhe na comunidade.
