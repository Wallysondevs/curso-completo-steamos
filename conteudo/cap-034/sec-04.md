A pergunta "OnlyOffice ou LibreOffice?" aparece em todo fórum de Linux, e não é diferente no Steam Deck. A resposta curta: o OnlyOffice foi projetado para abrir documentos do Microsoft Office com **fidelidade de layout quase idêntica**, enquanto o LibreOffice cobre um espectro mais amplo (Draw, Base, Math) com compatibilidade boa mas não perfeita em casos de borda. Esta seção é sobre instalar, testar e decidir.

:::objetivos
- Instalar o OnlyOffice Desktop Editors via Flatpak no SteamOS
- Comparar a renderização de um mesmo `.docx` no OnlyOffice e no LibreOffice
- Compreender por que compatibilidade com Office não é binária
- Escolher a suíte certa para cada tipo de documento
- Conhecer as limitações do OnlyOffice no Linux
:::

## Instalação e primeiras impressões

O OnlyOffice está no Flathub com o identificador `org.onlyoffice.desktopeditors`. A instalação é um `flatpak install` como qualquer outro, e o pacote é significativamente menor que o LibreOffice porque o OnlyOffice não inclui Draw, Base nem Math — são três aplicativos em vez de sete.

```terminal
$ flatpak install flathub org.onlyoffice.desktopeditors
Looking for matches…

 1) app/org.onlyoffice.desktopeditors/x86_64/stable

org.onlyoffice.desktopeditors permissions:
    ipc    network       cups      pulseaudio
    x11    dri           file access [1]

    [1] home, xdg-config/kdeglobals:ro

        ID                                    Branch    Op     Remote      Download
 1. [✓] org.onlyoffice.desktopeditors         stable    i      flathub     < 342,7 MB

Proceed with these changes to the system installation? [Y/n]: Y
```

Ao abrir, a interface impressiona: parece uma mistura do Microsoft Office com a barra de ferramentas em faixa (ribbon). Não há tempo de adaptação para quem vem do Office da Microsoft, porque os menus, ícones e até os nomes das opções são deliberadamente similares. O aplicativo abre `.docx`, `.xlsx` e `.pptx` como formatos **nativos**, e o `.odt`/`.ods` como formatos de interoperabilidade.

:::nota
O OnlyOffice nasceu de uma empresa russa (Ascensio System SIA, hoje sediada na Letônia) e mantém o código aberto sob licença AGPLv3. A versão desktop é a mesma que roda nos servidores de colaboração empresarial — o que significa que ela é testada contra um volume enorme de documentos do mundo real.
:::

## O teste de compatibilidade que faz diferença

Pegue um `.docx` complexo — aquele que o colega do RH montou no Word com tabelas mescladas, numeração de parágrafo multinível e caixas de texto flutuantes. Abra no OnlyOffice: o layout provavelmente estará idêntico. Abra o mesmo arquivo no LibreOffice Writer: em 90% dos casos também estará, mas naqueles 10% você verá uma quebra de página deslocada ou uma imagem sobrepondo texto.

A diferença tem raiz técnica. O OnlyOffice implementa um motor de renderização que lê o formato Office Open XML (`.docx`) como se fosse linguagem nativa, enquanto o LibreOffice traduz de OOXML para seu modelo interno (ODF) e de volta. Qualquer tradução bidirecional acumula perdas, especialmente em tabelas aninhadas e controles de conteúdo.

```terminal
## Salvar o mesmo documento nos dois editores e comparar tamanhos:
$ ls -lh doc-original.docx doc-libreoffice.docx doc-onlyoffice.docx
-rw-r--r-- 1 deck deck  82K jan 14 11:03 doc-original.docx
-rw-r--r-- 1 deck deck  79K jan 14 11:05 doc-libreoffice.docx
-rw-r--r-- 1 deck deck  82K jan 14 11:06 doc-onlyoffice.docx
```

O tamanho quase idêntico entre `doc-original.docx` e `doc-onlyoffice.docx` reflete o fato de que o OnlyOffice mexe o mínimo possível na estrutura do arquivo, reescrevendo apenas os trechos que você editou. O LibreOffice costuma reestruturar o XML interno ao salvar, o que pode reduzir o tamanho (comprimindo metadados) ou, em casos raros, introduzir leves diferenças de espaçamento.

## Quando usar cada um

| Situação | Melhor escolha |
|---|---|
| Documento que será editado em ida e volta com usuários do Word | OnlyOffice |
| Documento acadêmico com sumário, índice remissivo e bibliografia | LibreOffice Writer |
| Planilha com macros VBA | Nenhum dos dois — o Deck não roda VBA |
| Preencher um formulário `.docx` do governo ou banco | OnlyOffice |
| Editar um PDF preexistente | LibreOffice Draw (abre páginas como objetos) |
| Montar apresentação com transições complexas | LibreOffice Impress |

O OnlyOffice não tem equivalente ao Draw do LibreOffice, o que significa que no Deck você **precisa** do LibreOffice para abrir e editar PDFs como documentos, ou para criar diagramas técnicos. Por outro lado, o OnlyOffice exporta direto para `.pdf` e `.pdf/A` com qualidade excelente e sem depender de configuração adicional — é um caminho de um clique.

:::atencao
O OnlyOffice Desktop Editors no Linux **não inclui suporte a fontes do Windows** (Calibri, Cambria) por padrão. Se um `.docx` usa essas fontes e você não as tem instaladas, o texto é renderizado com métricas ligeiramente diferentes, e parágrafos podem mudar de linha. Instale o pacote `ttf-mscorefonts-installer` (via `apt` no Ubuntu, ou baixe manualmente as fontes para `~/.fonts/`) para minimizar a diferença.
:::

## Dá para ter os dois instalados

Sim, e é o cenário recomendado. Os flatpaks ocupam diretórios separados e não entram em conflito. O espaço total em disco (cerca de 2 GB para o LibreOffice mais ~400 MB para o OnlyOffice, fora os runtimes compartilhados) é insignificante no SSD do Deck. A única questão é escolher qual abrir por padrão para cada extensão: clique com botão direito num `.docx` no Dolphin (o gerenciador de arquivos do KDE), vá em **Abrir com → Outro aplicativo**, selecione o preferido e marque "Lembrar".

```terminal
$ flatpak list | grep -E 'office|onlyoffice'
LibreOffice	org.libreoffice.LibreOffice	stable	system
OnlyOffice	org.onlyoffice.desktopeditors	stable	system
```

Ambos coexistem sem atritos. O Dolphin mostra ícones de arquivo pelo último aplicativo associado, mas o menu de contexto resolve na hora da abertura.

:::dica
Se você trabalha com documentos que circulam numa equipe mista (alguns no Office 365, outros no LibreOffice), adote a regra: edite e revise no OnlyOffice para manter a compatibilidade visual; quando o documento estiver "pronto para arquivar", salve uma cópia de longa duração em `.odt` e outra em `.pdf`. O `.odt` garante que você consiga reabri-lo daqui a dez anos num LibreOffice qualquer, e o `.pdf` congela a aparência.
:::

## Resumo

- OnlyOffice no Deck é instalado via `flatpak install flathub org.onlyoffice.desktopeditors` e ocupa menos espaço que o LibreOffice.
- A renderização de `.docx` é mais fiel no OnlyOffice porque ele trata OOXML como formato nativo, sem tradução interna.
- O LibreOffice cobre Draw, Base e Math, que o OnlyOffice não oferece.
- Os dois flatpaks coexistem; você pode definir o aplicativo padrão por extensão no Dolphin.
- Fontes do Windows (Calibri, Cambria) precisam ser instaladas à parte para fidelidade total com documentos do Word.

## Exercícios

1. Instale o OnlyOffice e compare a abertura de um `.docx` complexo (que tenha tabelas e imagens) nos dois editores. Anote as diferenças visuais que encontrar.
2. Crie um documento simples no OnlyOffice, salve como `.docx` e abra no LibreOffice Writer. Depois faça o inverso (`.odt` aberto no OnlyOffice). As duas direções se comportaram igual?
3. No Dolphin, associe `.docx` ao OnlyOffice e `.odt` ao LibreOffice. Depois dê duplo clique em cada tipo e confirme que o aplicativo correto abriu.
4. Exporte o mesmo documento de teste como PDF nos dois editores e compare os arquivos com `diff` (se forem texto) ou com o tamanho em bytes.
5. **Desafio.** Encontre um `.docx` público que use controles de conteúdo (content controls) do Word — aqueles campos de formulário com caixa de seleção e lista suspensa. Abra no OnlyOffice e no LibreOffice. Qual dos dois preservou a interatividade dos controles? Houve perda de dados?