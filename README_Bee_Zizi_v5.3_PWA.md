# Bee & Zizi — v5.3 PWA (Guia rápido)

## Instalação
1. Publique `index.html`, `style.css`, `app.js`, `manifest.webmanifest`, `sw.js` e a pasta `icons/` no GitHub Pages.
2. No celular, toque **Instalar / Adicionar à tela inicial** para ter experiência de app (ícone + splash).

## Personalização
- **Ícones**: troque PNGs em `/icons/` mantendo os nomes (192, 512 e maskable 512).
- **Cores**: ajuste `theme_color` / `background_color` no `manifest.webmanifest`.
- **Splash**: bloco `#splash` no `index.html` + CSS no final do `style.css`.
- **Cache**: edite a lista de arquivos em `sw.js`.

## Anotações
- A galeria suporta **24 fotos** e usa `loading="lazy"` nas miniaturas.
- Os temas (Claro, Romântico, Noite, Neon, Girassol) foram ajustados para **bom contraste**.
- O HUD (Moedinhas / Sequência / Conquistas) não corta textos em telas menores.
