O KDE Connect faz pelo que o Warpinator não faz: ele liga o Deck ao seu *celular* (e a outros PCs) num laço estreito, permitindo não só trocar arquivos, mas também ver notificações do celular no Deck, responder mensagens, usar o celular como touchpad, compartilhar a área de transferência e controlar mídia. Como o modo Desktop do SteamOS é KDE Plasma, o KDE Connect se sente em casa.

:::objetivos
- Instalar e parear o KDE Connect entre Deck e celular/PC
- Transferir arquivos nos dois sentidos
- Usar área de transferência compartilhada e resposta a notificações
- Resolver pareamento que não completa
- Entender permissões de plugin (no Android e no Flatpak)
:::

## Instalação

No Deck, o KDE Connect já costuma vir integrado ao Plasma (ícone nas configurações do sistema), mas também existe como Flatpak. No **celular**, instale o app **KDE Connect** na loja (F-Droid ou Play Store/App Store). Ambos os lados precisam estar na **mesma rede Wi-Fi**.

```terminal
# no Deck, se preferir o Flatpak
$ flatpak install flathub org.kde.kdeconnect
```

## Pareamento

O pareamento é o aperto de mão inicial que autoriza a comunicação:

1. Abra o KDE Connect no Deck (ou Configurações → KDE Connect) e no celular.
2. O celular deve aparecer na lista de "Dispositivos disponíveis" do Deck (e vice-versa).
3. Clique em parear; aceite o pedido que surge no celular.
4. Confirme a chave. Depois disso, as permissões de cada plugin (notificações, arquivos, clipboard) podem ser ligadas/desligadas individualmente.

```terminal
# listar dispositivos pareados via CLI (kdeconnect-cli)
$ kdeconnect-cli -l
- Celular: 12ab34cd56ef (pareado e alcançável)
```

## Transferindo arquivos

Com o pareamento feito, há duas rotas:

- **Via "Compartilhar arquivo"**: no menu do dispositivo pareado, escolha "Enviar arquivos" e selecione. No celular, os arquivos caem em Downloads.
- **Via "Compartilhar" do celular**: no Android, qualquer app com "Compartilhar" → "KDE Connect" envia direto ao Deck (caem na pasta padrão do plugin de arquivos).

```terminal
# enviar um arquivo para o dispositivo pelo terminal
$ kdeconnect-cli --share /caminho/arquivo.png -d 12ab34cd56ef
```

## Além dos arquivos: por que vale integrar

- **Notificações do celular no Deck**: você vê quem te chamou sem tirar o Deck da mão.
- **Clipboard compartilhado**: copia no celular, cola no Deck (e vice-versa).
- **Controle remoto**: celular como touchpad/teclado para o Deck (útil quando ele está na TV).
- **Controle de mídia**: pausa/avança o que toca no Deck pelo celular.

Cada um desses é um plugin que pode ser desativado nas configurações do pareamento — mantenha só o que usa.

## Problemas comuns

- **Não aparece na lista**: mesmo Wi-Fi? É rede convidado (AP isolation)? Firewall do Deck bloqueando a porta 1716? Reinicie o app nos dois lados.
- **Pareamento não completa**: aceite o pedido no celular manualmente; às vezes o Android esconde a notificação.
- **Flatpak sem acesso**: o Flatpak do KDE Connect pode ter permissões restritas — use o empacotamento nativo do Plasma ou ajuste no Flatseal.

```terminal
# liberar a porta do KDE Connect no firewalld
$ sudo firewall-cmd --add-port=1714-1764/tcp --add-port=1714-1764/udp --permanent
$ sudo firewall-cmd --reload
```

## Pontos-chave

- KDE Connect liga Deck ↔ celular/PC com muito mais que arquivos (notificações, clipboard, controle).
- Pareamento é manual e confirma a chave nos dois lados.
- Arquivos caem no diretório de Downloads do receptor por padrão.
- Cada recurso é um plugin que pode ser isolado.
- Ambos os lados precisam estar na mesma rede sem AP isolation.

## Exercícios

1. Instale o KDE Connect no celular e pareie com o Deck.
2. Envie uma foto do celular para o Deck e localize o arquivo recebido.
3. Copie um texto no celular e cole no bloco de notas do Deck (clipboard compartilhado).
4. Ative e depois desative o plugin de notificações, observando a diferença.
5. **Desafio.** Use o celular como touchpad para controlar o Deck na TV e ajuste a sensibilidade.
