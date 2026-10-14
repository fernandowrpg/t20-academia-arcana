"""Gera a imagem do mapa da Academia a partir do seu PDF do Manual do Arcano.

A arte é da Jambô Editora e não vai para o repositório: cada mestre gera a
própria cópia a partir do livro que possui.

Uso:
    pip install pymupdf pillow
    python tools/extrair-mapa.py "caminho/Manual do Arcano.pdf" [pagina-do-pdf]

A página padrão é a 94 do PDF (p. 93 do livro). A imagem vai para
assets/mapas/academia-arcana.webp, o caminho usado pela cena do módulo.
"""

import sys
from pathlib import Path

import pymupdf
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "assets" / "mapas" / "academia-arcana.webp"
LARGURA, ALTURA = 1275, 1650


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)
    pdf = pymupdf.open(sys.argv[1])
    pagina = int(sys.argv[2]) if len(sys.argv) > 2 else 94
    pix = pdf[pagina - 1].get_pixmap(dpi=150)
    if (pix.width, pix.height) != (LARGURA, ALTURA):
        print(f"Aviso: a imagem saiu com {pix.width}x{pix.height}; a cena espera {LARGURA}x{ALTURA} e os pinos podem ficar fora do lugar.")
    DESTINO.parent.mkdir(parents=True, exist_ok=True)
    imagem = Image.frombytes("RGB", (pix.width, pix.height), pix.samples)
    imagem.save(DESTINO, "WEBP", quality=88)
    print(f"Mapa salvo em {DESTINO.relative_to(RAIZ)} ({pix.width}x{pix.height}).")


if __name__ == "__main__":
    main()
