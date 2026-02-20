# Imagens: descricao, local e prompt

## UI principal

- nome_arquivo: `welcome-bg.jpg`
- caminho_exato: `frontend/public/images/ui/welcome-bg.jpg`
- onde_usa: pagina `Welcome` (`/`)
- descricao_visual: fundo cinematografico de restaurante sofisticado, noturno, luz quente, profundidade
- prompt_sugerido: `Ultra realistic fine dining restaurant interior at night, warm amber lighting, cinematic depth, elegant tables, no people in focus, no text, 16:9, premium atmosphere, soft bokeh`

- nome_arquivo: `salao-bg.jpg`
- caminho_exato: `frontend/public/images/ui/salao-bg.jpg`
- onde_usa: pagina `Salao` (`/salao`)
- descricao_visual: salao elegante em perspectiva, clima operacional de servico
- prompt_sugerido: `Luxurious restaurant dining hall perspective view, polished wood, warm lighting, service ambiance, high detail, no text, no logo, 16:9`

- nome_arquivo: `cozinha-bg.jpg`
- caminho_exato: `frontend/public/images/ui/cozinha-bg.jpg`
- onde_usa: pagina `Cozinha` (`/cozinha`)
- descricao_visual: cozinha profissional premium, estações em inox, clima operacional elegante, profundidade cinematografica
- prompt_sugerido: `High-end professional restaurant kitchen interior, brushed steel counters, warm practical lights, cinematic depth, clean and premium atmosphere, no text, 16:9`

- nome_arquivo: `ticket-placeholder.png`
- caminho_exato: `frontend/public/images/ui/ticket-placeholder.png`
- onde_usa: fallback visual dos cards de ticket na pagina `Cozinha`
- descricao_visual: composicao clean com prato/ticket gastronômico neutro, sem marca ou texto
- prompt_sugerido: `Minimal gourmet ticket placeholder image, neutral culinary composition, soft warm light, clean background, no text, square`

- nome_arquivo: `sidebar-logo.png`
- caminho_exato: `frontend/public/images/ui/sidebar-logo.png`
- onde_usa: header e bloco de pilares
- descricao_visual: emblema/brasao quadrado Maison Doree
- prompt_sugerido: `Minimal elegant restaurant crest logo, golden monogram style, dark transparent background, square composition, no extra text`

- nome_arquivo: `empty-plate.png`
- caminho_exato: `frontend/public/images/ui/empty-plate.png`
- onde_usa: fallback de imagem em `Cardapio`
- descricao_visual: prato branco vazio em mesa neutra, estilo clean
- prompt_sugerido: `Top view empty white porcelain plate on neutral linen table, soft studio lighting, clean composition, no text`

## Pratos seed (CRUD)

- nome_arquivo: `filet-boeuf-rossini.jpg`
- caminho_exato: `frontend/public/images/dishes/filet-boeuf-rossini.jpg`
- onde_usa: prato `Filet de Boeuf Rossini`
- descricao_visual: filet alto com molho brilhante e apresentacao gourmet
- prompt_sugerido: `Gourmet beef fillet rossini plated in fine dining style, dramatic warm lighting, realistic food photography, shallow depth of field`

- nome_arquivo: `saumon-oseille.jpg`
- caminho_exato: `frontend/public/images/dishes/saumon-oseille.jpg`
- onde_usa: prato `Saumon a l'Oseille`
- descricao_visual: salmao selado com molho verde sofisticado
- prompt_sugerido: `Seared salmon with sorrel sauce on elegant plate, restaurant presentation, warm cinematic light, realistic texture`

- nome_arquivo: `soupe-oignon.jpg`
- caminho_exato: `frontend/public/images/dishes/soupe-oignon.jpg`
- onde_usa: prato `Soupe a l'Oignon`
- descricao_visual: sopa de cebola gratinada com queijo dourado
- prompt_sugerido: `French onion soup gratinee in rustic bowl, melted golden cheese crust, close-up food photography, warm tones`

- nome_arquivo: `fondant-chocolat.jpg`
- caminho_exato: `frontend/public/images/dishes/fondant-chocolat.jpg`
- onde_usa: prato `Fondant au Chocolat`
- descricao_visual: sobremesa de chocolate com calda e acabamento premium
- prompt_sugerido: `Chocolate fondant dessert plated in fine dining style, glossy sauce, high realism, moody warm light`

- nome_arquivo: `plateau-fromages.jpg`
- caminho_exato: `frontend/public/images/dishes/plateau-fromages.jpg`
- onde_usa: prato `Plateau de Fromages`
- descricao_visual: selecao de queijos artesanais com garnish
- prompt_sugerido: `Artisanal cheese platter with garnish, premium restaurant styling, natural warm light, realistic details`

## Upload dinamico

- pasta_destino_upload: `frontend/public/images/uploads/`
- origem_upload_api: endpoint `POST /api/dishes/upload-image`
- observacao: imagens enviadas no modal de prato serao gravadas aqui via volume Docker compartilhado.
