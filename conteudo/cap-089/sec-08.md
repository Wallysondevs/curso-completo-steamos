Toda personalização tem um preço oculto: a garantia. E, num aparelho que custa o de um item de alto valor, decidir ignorar a garantia sem entender o risco é apostar no escuro. Esta seção é o contraponto sóbrio do capítulo — antes de abrir a chave Phillips ou rodar o instalador do Decky, você vai entender exatamente o que cada ação faz com a cobertura da Valve, o que é reversível, e como documentar tudo para que, se algo der errado, você ainda tenha caminho de volta.

:::objetivos
- Distinguir o que anula a garantia do que é tolerado
- Entender a política de garantia da Valve no contexto de personalização
- Preparar um estado de recuperação completo antes de qualquer intervenção
- Documentar o processo para rastrear e reverter cada mudança
- Avaliar o custo-benefício de cada personalização antes de executá-la
:::

## O que a garantia cobre (e o que a anula)

A garantia da Valve cobre defeitos de fabricação — um analógico que drifta sozinho, um botão que nasceu morto, uma tela com pixels mortos de fábrica. Ela **não** cobre dano causado por você. A fronteira entre as duas coisas é o que importa, e aqui a regra prática é clara.

**Software (skins, Decky, CSS Loader):** não toca em hardware, então não anula a garantia por si só. Mas a Valve não oferece suporte se um plugin de terceiros quebrar o software — nesse caso a restauração é sua. O risco é de tempo, não de cobertura.

**Abertura do aparelho (botões, case):** nos EUA, o *Magnuson-Moss Warranty Act* e as leis de "direito de reparo" protegem a abertura em si, desde que o dano não decorra dela. Na prática, porém, **qualquer dano que você causar ao abrir — trinca, flex rasgado, parafuso espanado — não é coberto**, e provar que não foi você pode ser difícil. Em alguns países a simples presença de marcas de violação invalida a garantia.

:::atencao
O selo/violação e os parafusos marcam a abertura. Removê-los não é ilegal, mas em mercados com garantia "selada pela fabricante", a abertura pode ser usada como justificativa para negar um reparo posterior — mesmo de um defeito não relacionado. Leia a política de garantia do seu país antes de abrir.
:::

## Backup total antes de mexer no software

Personalizar software é reversível, mas só se você tiver como voltar. Antes de instalar Decky, CSS Loader ou qualquer skin, vale criar um snapshot completo do que é seu. O SteamOS já tem uma ferramenta de restauração embutida, e você pode complementá-la com a cópia dos seus dados.

```terminal
$ mkdir -p ~/lab/backup-total
$ cp -r ~/.steam ~/lab/backup-total/steam.bak
$ cp -r ~/.local/share/Steam ~/lab/backup-total/steam-local.bak 2>/dev/null
$ du -sh ~/lab/backup-total
1.8G	/home/ana/lab/backup-total
```

O `~/.steam` guarda a configuração do cliente (incluindo `userdata` e `shortcuts.vdf`), e `~/.local/share/Steam` guarda o cache local do cliente no modo desktop. Juntos, eles reconstroem seu ambiente de Steam depois de qualquer desastre de software.

:::info
O SteamOS oferece restauração de fábrica pela interface (Configurações → Sistema) e pela imagem de recuperação gravada num pendrive. A restauração de fábrica apaga tudo do usuário e reinstala o SO; o backup acima é o que você usa para não voltar ao zero depois disso. Os dois caminhos — backup de dados e imagem de recuperação — são complementares, não alternativos.
:::

## Pasta térmica e o custo real do shell swap

Quem troca o shell completo vai, quase inevitavelmente, remover o dissipador — e aí entra um detalhe que separa ajuste barato de conserto caro: a **pasta térmica**. Ela preenche a irregularidade entre o chip (APU) e a base do dissipador. Ao separar os dois, a pasta se rompe e perde eficiência; reutilizá-la é uma das causas mais comuns de superaquecimento pós-montagem.

A boa prática é **sempre** limpar a pasta velha (álcool isopropílico e lenço sem fiapo) e aplicar pasta nova em quantidade correta — um ponto do tamanho de um grão de ervilha, espalhado pela pressão do dissipador.

```terminal
$ sensors 2>/dev/null | grep -i "temp1\|Composite" | head -4
Composite:    +39.9°C  (high = +81.8°C)
temp1:        +42.0°C  (crit = +105.0°C)
```

Se, após o shell swap com dissipador remontado, a temperatura ociosa subir de forma consistente em relação ao "antes" (anotado na [seção sobre cases](#/cap-089/sec-06)), é sinal quase certo de pasta térmica mal aplicada ou dissipador mal assentado.

## Documentando para poder reverter

A diferença entre um entusiasta e alguém que se arrepende está na documentação. Para cada mudança, anote: o que foi feito, quando, com qual versão, e como desfazer. Um registro disciplinado transforma "meu Steam Deck quebrou depois de eu mexer" em "sei exatamente o que reverter".

```terminal
$ cat ~/lab/personalizacao.log
2025-02-10  skins: instalado Decky Loader v3.1.2, CSS Loader v2.1.0
2025-02-10  skins: ativado perfil "limpo" antes de atualizar o Steam
2025-02-12  fisico: trocados botões A/B/X/Y (kit eXtremeRate, cor preta)
2025-02-12  fisico: pasta térmica reaplicada após abrir o dissipador
```

Um `log` simples, mantido no `~/lab`, é o suficiente. Registre sempre a versão do Steam vigente (`steam -version`) junto de cada mudança de software — é a informação que resolve 90% dos "que skin quebrou com essa atualização?".

## A pergunta que deve vir antes de tudo

Antes de cada intervenção, faça a mesma pergunta: **"se isso der errado, qual é o pior cenário, e consigo voltar?"**. A resposta ordena suas decisões com uma clareza que nenhuma lista de ferramentas dá.

- Skin de software: pior caso é um menu ilegível até desativar a skin. Reversível. **Baixo risco.**
- Troca de botões: pior caso é um flex rasgado ou parafuso espanado. Parcialmente reversível, exige conserto. **Risco médio.**
- Shell swap completo: pior caso é tela trincada ou bateria perfurada. Custo de reparo alto, pode inviabilizar a garantia. **Risco alto.**

A personalização é legítima e, na maioria dos casos, segura. O que esta seção quer cravar é que o risco verdadeiro nunca é o ato em si — é fazer sem saber qual é o pior cenário e sem o caminho de volta preparado.

## Resumo

- A garantia cobre defeitos de fabricação, não danos que você mesmo causou ao abrir o aparelho.
- Skins e plugins de software não anulam a garantia, mas a Valve não dá suporte a software de terceiros.
- Abrir o aparelho pode ser usado como justificativa para negar reparos em mercados de garantia selada.
- Backup de `~/.steam` e `~/.local/share/Steam` reconstroi o ambiente após uma restauração de fábrica.
- Reaplicar pasta térmica corretamente é obrigatório sempre que o dissipador for removido.
- Um `log` de personalização com versões e "como desfazer" é o que permite reverter qualquer mudança.

## Exercícios

1. Localize a política de garantia da Valve para o seu país e anote em uma frase o que ela diz sobre danos causados pelo usuário.
2. Faça o backup total (`~/.steam` e `~/.local/share/Steam`) em `~/lab/backup-total` e confirme o tamanho com `du -sh`.
3. Inicie um `personalizacao.log` no `~/lab` registrando o estado atual: modelo, `steam -version` e canal do cliente.
4. Para cada uma das três categorias (skin, botões, shell swap), escreva o pior cenário e o caminho de reversão, no estilo da tabela desta seção.
5. **Desafio.** O SteamOS exige `sudo` para algumas operações de recuperação. Investigue como a imagem de recuperação da Valve é criada num pendrive e explique onde o seu backup de dados se encaixaria antes de uma restauração de fábrica.
