Depois do arquivo `.odt` de teste que você criou na seção anterior, é hora de levar o Writer a sério. O LibreOffice Writer — que no Steam Deck se comporta exatamente como num notebook Linux qualquer — cobre desde cartas e currículos até artigos acadêmicos com sumário automático e controle de alterações. Esta seção é um mergulho prático: você vai configurar, escrever, formatar e exportar.

:::objetivos
- Navegar pela interface do Writer no modo desktop do Steam Deck
- Configurar autocorreção e idioma para português brasileiro
- Dominar estilos de parágrafo em vez de formatação manual
- Exportar para PDF com índice e links preservados
- Criar um modelo de documento reutilizável
:::

## Um editor de texto que não é um bloco de notas

O Writer abre com uma página em branco, uma régua horizontal e duas barras de ferramentas — a padrão (Novo, Abrir, Salvar) e a de formatação (fonte, tamanho, estilo). A primeira coisa a ajustar para o teclado físico conectado ao dock é o atalho `[[Ctrl+F2]]` para o dicionário de sinônimos e `[[F7]]` para o corretor ortográfico, que dependem do idioma estar correto.

Abra o Writer, vá em **Ferramentas → Opções → Configurações de Idioma → Idiomas**. No campo "Idiomas de documento — Ocidental", escolha `Português (Brasil)`. Se essa opção não aparecer, é porque o pacote de localização do LibreOffice para português ainda não foi baixado. Instale-o separadamente:

```terminal
$ flatpak install flathub org.libreoffice.LibreOffice.Locale
Looking for matches…

 1) flathub app/org.libreoffice.LibreOffice.Locale/x86_64/stable
 2) flathub app/org.libreoffice.LibreOffice.Locale/x86_64/testing

Which do you want to use (0 to abort)? [0-2]: 1
```

Depois da instalação, reinicie o Writer: o corretor ortográfico em português já vai funcionar via `[[F7]]`.

:::dica
No Deck com tela de 7 ou 7,4 polegadas, a barra lateral de estilos (`[[F11]]`) ocupa espaço precioso. Deixe-a flutuante em vez de ancorada: clique com o botão direito na barra de título dela e escolha "Desencaixar". Quando estiver no monitor externo, ancore de volta.
:::

## A diferença entre formatar e aplicar um estilo

Quem nunca usou um editor de texto "de verdade" tende a selecionar um parágrafo e mudar fonte, tamanho e negrito manualmente, repetindo a operação para cada título. No Writer (e em qualquer suíte de escritório moderna), você quer o oposto: **aplicar um estilo de parágrafo**, que é um nome ("Título 1", "Corpo de texto") com um pacote de propriedades visuais atrelado.

Pressione `[[F11]]` para abrir o painel de Estilos. Os três mais importantes para um documento comum são:

| Estilo | Quando usar |
|---|---|
| **Título 1** | Nome do capítulo ou seção principal |
| **Título 2** | Subtítulo dentro do capítulo |
| **Corpo de texto** | Parágrafos normais de prosa |

Crie um documento de teste com dois títulos e alguns parágrafos. Depois vá em **Inserir → Índices e Sumários → Índice Geral** e marque "Protegido contra alterações manuais" para evitar que alguém edite o sumário sem querer. O sumário aparece automaticamente com os títulos e números de página.

A beleza do estilo é esta: se você decidir que "Título 1" deve usar fonte Liberation Sans tamanho 18 em vez de 16, muda uma vez no painel de estilos e **todos** os títulos do documento mudam juntos. Se tivesse formatado manualmente, teria que percorrer o documento inteiro.

## Exportar para PDF que não se desmonta

Todo mundo que abre um `.docx` seu em outro computador pode ver as coisas desalinhadas, fontes trocadas ou numeração de páginas quebrada. O PDF resolve isso: ele é uma fotografia fiel do documento, com todas as fontes incorporadas. No Writer, o atalho `[[Ctrl+P]]` oferece "Imprimir em arquivo", mas o caminho mais rico é **Arquivo → Exportar como → Exportar como PDF**.

Na janela de opções de PDF, três abas importam:

- **Geral**: marque "Criar arquivo PDF com tags (PDF/UA)" para acessibilidade.
- **Links**: marque "Exportar marcadores como marcadores de PDF" — isso transforma seu sumário em índice navegável no leitor de PDF.
- **Segurança**: defina uma senha de abertura se o documento for sigiloso.

```terminal
$ ls -lh ~/Documents/relatorio.pdf
-rw-r--r-- 1 deck deck 247K jan 14 10:33 /home/deck/Documents/relatorio.pdf
```

O arquivo gerado abre no Okular (visualizador padrão do KDE), no Evince ou em qualquer leitor de PDF do Windows e do macOS exatamente como você o vê no Deck. Fontes não se perdem porque são embutidas no próprio PDF.

:::atencao
Ao salvar documentos como `.docx` para enviar a colegas que usam Microsoft Office, a formatação de tabelas complexas e certas fontes podem divergir. Sempre exporte uma cópia extra em PDF como garantia de fidelidade visual. E não envie o `.odt` nativo esperando que o destinatário saiba abri-lo — a menos que você saiba que ele também usa LibreOffice.
:::

## Modelo de documento: escreva o esqueleto uma vez

Se você escreve relatórios mensais ou artigos com o mesmo cabeçalho e as mesmas seções, vale criar um **modelo** (`.ott`). No Writer, abra um documento novo, configure os estilos como quiser, insira os campos fixos (logotipo, data, numeração) e salve como **Arquivo → Modelos → Salvar como modelo**.

Quando precisar de um documento novo baseado nele, vá em **Arquivo → Novo → Modelos**, selecione o seu e pronto: o Writer cria uma cópia com o conteúdo do modelo, sem sobrescrever o original. É o mesmo conceito de *template* que desenvolvedores usam em frameworks web, só que aplicado a documentos.

```terminal
$ ls ~/.var/app/org.libreoffice.LibreOffice/data/user/template/
relatorio-mensal.ott   artigo-academico.ott
```

O caminho acima está dentro da sandbox do Flatpak — é onde o LibreOffice guarda configurações e modelos. Você não precisa mexer nele diretamente; a interface do Writer já faz a gestão.

## Resumo

- O LibreOffice Writer no Steam Deck funciona como num notebook; teclado físico e monitor externo são ideais.
- O pacote `org.libreoffice.LibreOffice.Locale` adiciona dicionário e interface em português brasileiro.
- Estilos de parágrafo (`[[F11]]`) eliminam a formatação manual repetitiva e permitem gerar sumário automático.
- A exportação para PDF embute fontes e preserva o sumário como índice navegável.
- Modelos `.ott` são o modo profissional de reaproveitar estrutura e formatação.

## Exercícios

1. Abra o Writer e configure o idioma para Português (Brasil). Digite um parágrafo com erro de ortografia proposital e pressione `[[F7]]` para verificar se o dicionário está ativo.
2. Crie um documento de três páginas com dois estilos de título, sumário automático e pelo menos uma imagem inserida. Exporte como PDF e abra no Okular para conferir o resultado.
3. Altere a fonte do estilo "Título 1" e observe se todas as ocorrências mudaram automaticamente. Depois, reverta a alteração.
4. Salve o documento do exercício 2 como `.docx` e compare o tamanho do arquivo com o `.odt` original: `ls -lh`.
5. **Desafio.** Crie um modelo `.ott` com cabeçalho, rodapé numerado e dois estilos de parágrafo personalizados. Gere um documento novo a partir dele e confira se o conteúdo do modelo não foi sobrescrito.