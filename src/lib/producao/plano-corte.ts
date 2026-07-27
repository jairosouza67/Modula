export interface Peca {
  id: string;
  largura: number;
  altura: number;
  osId?: string;
  rotacionavel?: boolean;
}

export interface PecaAlocada {
  peca: Peca;
  x: number;
  y: number;
  rotacionada: boolean;
}

export interface Chapa {
  id: string;
  largura: number;
  altura: number;
}

export interface ResultadoPlanoCorte {
  chapa: Chapa;
  alocadas: PecaAlocada[];
  restantes: Peca[];
  aproveitamento: number; // Porcentagem de 0 a 100
}

/**
 * Algoritmo Shelf First-Fit (2D Bin Packing) simples.
 * Ordena as peças por altura decrescente e as dispõe em prateleiras.
 */
export function binPacking2D(chapa: Chapa, pecas: Peca[]): ResultadoPlanoCorte {
  const alocadas: PecaAlocada[] = [];
  const restantes: Peca[] = [];

  // Ordena por altura decrescente (e largura decrescente em caso de empate)
  const pecasOrdenadas = [...pecas].sort((a, b) => {
    if (b.altura !== a.altura) {
      return b.altura - a.altura;
    }
    return b.largura - a.largura;
  });

  let currentX = 0;
  let currentY = 0;
  let currentShelfHeight = 0;

  for (const peca of pecasOrdenadas) {
    let w = peca.largura;
    let h = peca.altura;
    let rotacionada = false;

    // Se rotacionável e rotacionando ela se encaixa melhor na altura da prateleira,
    // ou se não cabe normalmente mas caberia rotacionada, faz o giro (simplificado).
    if (peca.rotacionavel) {
      if (h > chapa.altura || (w <= chapa.altura && h <= chapa.largura && h > w)) {
        w = peca.altura;
        h = peca.largura;
        rotacionada = true;
      }
    }

    // Se a peça for mais larga ou mais alta que a própria chapa, rejeita na hora
    if (w > chapa.largura || h > chapa.altura) {
      restantes.push(peca);
      continue;
    }

    // Verifica se cabe na prateleira atual (horizontalmente)
    if (currentX + w > chapa.largura) {
      // Não cabe, tenta ir para a próxima prateleira
      currentY += currentShelfHeight;
      currentX = 0;
      currentShelfHeight = 0; // será definida pela primeira peça desta prateleira
    }

    // Verifica se cabe na chapa (verticalmente)
    if (currentY + h > chapa.altura) {
      restantes.push(peca);
      continue;
    }

    // Se é a primeira peça da prateleira, define a altura da prateleira
    if (currentShelfHeight === 0) {
      currentShelfHeight = h;
    }

    // Só pra garantir que a peça não é mais alta que a prateleira (numa ordenação perfeita decrescente, não deveria ocorrer)
    if (h > currentShelfHeight) {
       currentShelfHeight = h;
    }

    // Aloca a peça
    alocadas.push({
      peca,
      x: currentX,
      y: currentY,
      rotacionada
    });

    currentX += w;
  }

  const areaChapa = chapa.largura * chapa.altura;
  const areaUtilizada = alocadas.reduce((acc, curr) => acc + (curr.peca.largura * curr.peca.altura), 0);
  const aproveitamento = areaChapa > 0 ? (areaUtilizada / areaChapa) * 100 : 0;

  return {
    chapa,
    alocadas,
    restantes,
    aproveitamento: Number(aproveitamento.toFixed(2))
  };
}
