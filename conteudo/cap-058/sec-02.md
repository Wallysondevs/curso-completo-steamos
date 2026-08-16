Warpinator é a resposta do ecossistema Linux Mint para a pergunta "como eu troco um arquivo com o computador ao lado sem configurar nada?" Ele usa a rede local para descobrir outros dispositivos rodando Warpinator e permite arrastar arquivos entre eles por meio de um "código de grupo" compartilhado. No Steam Deck, ele vira um canhão de simplicidade para passar um ROM, um PDF ou uma ISO de um PC para o Deck (e vice-versa) em segundos.

:::objetivos
- Instalar o Warpinator no SteamOS via Flatpak
- Configurar um código de grupo compartilhado entre dispositivos
- Transferir arquivos nos dois sentidos e entender onde eles caem
- Resolver o problema clássico de "um lado não enxerga o outro"
- Conhecer limites (tamanho, permissões, firewall)
:::

## Instalação no SteamOS

O Warpinator chega como Flatpak pelo **Discover** (modo Desktop) ou pelo terminal:

```terminal
$ flatpak install flathub org.x.Warpinator
```

Instale nos *dois* lados: no Deck e no outro PC (no Linux via Flatpak/PPA; no Windows há build oficial na página do projeto). O Warpinator é agnóstico de sistema operacional — desde que todos tenham o mesmo código de grupo, eles se enxergam.

## O código de grupo

Este é o coração da ferramenta. Dispositivos com o **mesmo código de grupo** aparecem uns para os outros; os demais ficam invisíveis. Isso evita que qualquer pessoa na mesma rede (cafeteria, prédio) apareça na sua lista.

```terminal
# no Warpinator, aba "Preferências" → campo "Código do grupo"
Warpinator
```

Troque o padrão por algo que só você e seus dispositivos conheçam, por exemplo um jogo de palavras sem sentido: `deck-casa-2024`. Todos os seus aparelhos usam o mesmo.

## Transferindo um arquivo

1. Abra o Warpinator no Deck e no PC.
2. Aguarde os dois se descobrirem (segundos; se demorar, veja a seção de problemas abaixo).
3. Clique no dispositivo destino e arraste o arquivo para a janela, ou use o botão de enviar.
4. No destino, aceite a transferência (você pode configurar aceitação automática, mas o padrão pede confirmação).

```terminal
# onde o Warpinator guarda os arquivos recebidos (por padrão)
$ ls ~/Warpinator/
```

O diretório de destino é configurável nas preferências. Vale apontar para uma pasta que já é sua "área de entrada" (ex.: `~/Downloads` ou `~/Entrada`).

## Por que não se enxergam?

As causas mais comuns, em ordem de frequência:

- **Firewall** bloqueando a descoberta (multicast na porta 42000 e a transferência em si). Libere no Deck com `firewalld` ou desative temporariamente para testar.
- **Códigos de grupo diferentes.** Compare caractere a caractere, sensível a maiúsculas.
- **Rede com AP isolation** (comum em redes de convidados/hotel), que impede dispositivo-a-dispositivo.
- **Flatpak sem permissão de rede.** Confira com `flatpak override` ou no Flatseal se o app tem acesso à rede.

```terminal
# liberar a porta do Warpinator no firewalld (se estiver ativo)
$ sudo firewall-cmd --add-port=42000/tcp --permanent
$ sudo firewall-cmd --reload
```

## Limites e bom senso

Warpinator é ótimo para arquivos avulsos e lotes pequenos, mas não é um sistema de sincronização: ele copia, não espelha. Para transferências de dezenas de gigabytes ou sincronização contínua, vá de pendrive, rsync ou Syncthing (próximas seções).

## Pontos-chave

- Warpinator = transferência avulsa na rede local, rápida e sem fio.
- O **código de grupo** é o que controla quem te vê — use um valor próprio.
- Instale no Deck via Flatpak (`org.x.Warpinator`).
- Arquivos recebidos caem em `~/Warpinator/` por padrão (configurável).
- Firewall e AP isolation são os vilões clássicos da "invisibilidade".

## Exercícios

1. Instale o Warpinator no Deck e em outro dispositivo da sua rede.
2. Defina um código de grupo próprio e idêntico nos dois lados.
3. Transfira uma imagem (ex.: uma captura de tela) do Deck para o outro dispositivo e confirme a chegada.
4. Transfira um arquivo grande (1 GB+) e compare o tempo com uma cópia por pendrive.
5. **Desafio.** Mude o diretório de destino para `~/Entrada` e teste uma transferência no sentido inverso (PC → Deck).
