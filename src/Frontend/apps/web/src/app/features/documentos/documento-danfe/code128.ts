// Tabela padrão Code 128 (ISO/IEC 15417) — cada string é o padrão de módulos (1 = barra
// preta, 0 = espaço) de um símbolo. Índices 0-102 = valores de dado, 103 = START A,
// 104 = START B, 105 = START C, 106 = STOP. Usamos só o Code Set C (pares de dígitos), que é
// o padrão usado no código de barras do DANFE por ser só numérico e mais compacto.
const BARS: string[] = [
  '11011001100', '11001101100', '11001100110', '10010011000', '10010001100',
  '10001001100', '10011001000', '10011000100', '10001100100', '11001001000',
  '11001000100', '11000100100', '10110011100', '10011011100', '10011001110',
  '10111001100', '10011101100', '10011100110', '11001110010', '11001011100',
  '11001001110', '11011100100', '11001110100', '11101101110', '11101001100',
  '11100101100', '11100100110', '11101100100', '11100110100', '11100110010',
  '11011011000', '11011000110', '11000110110', '10100011000', '10001011000',
  '10001000110', '10110001000', '10001101000', '10001100010', '11010001000',
  '11000101000', '11000100010', '10110111000', '10110001110', '10001101110',
  '10111011000', '10111000110', '10001110110', '11101110110', '11010001110',
  '11000101110', '11011101000', '11011100010', '11011101110', '11101011000',
  '11101000110', '11100010110', '11101101000', '11101100010', '11100011010',
  '11101111010', '11001000010', '11110001010', '10100110000', '10100001100',
  '10010110000', '10010000110', '10000101100', '10000100110', '10110010000',
  '10110000100', '10011010000', '10011000010', '10000110100', '10000110010',
  '11000010010', '11001010000', '11110111010', '11000010100', '10001111010',
  '10100111100', '10010111100', '10010011110', '10111100100', '10011110100',
  '10011110010', '11110100100', '11110010100', '11110010010', '11011011110',
  '11011110110', '11110110110', '10101111000', '10100011110', '10001011110',
  '10111101000', '10111100010', '11110101000', '11110100010', '10111011110',
  '10111101110', '11101011110', '11110101110',
  '11010000100', // 103: START A
  '11010010000', // 104: START B
  '11010011100', // 105: START C
  '1100011101011', // 106: STOP (13 módulos, os demais têm 11)
];

const START_C = 105;
const STOP = 106;

/**
 * Gera o padrão de módulos (string de '1'/'0') de um código de barras Code 128, Code Set C,
 * pra uma chave de acesso de NF-e (44 dígitos, sempre par — Code C exige isso porque agrupa
 * de 2 em 2). Inclui start, checksum e stop — pronto pra desenhar barra a barra.
 */
export function code128CModules(digits: string): string {
  if (!/^\d+$/.test(digits) || digits.length % 2 !== 0) {
    throw new Error('Code128C exige uma string numérica de comprimento par.');
  }

  const values: number[] = [START_C];
  for (let i = 0; i < digits.length; i += 2) {
    values.push(Number(digits.slice(i, i + 2)));
  }

  let checksum = values[0];
  for (let i = 1; i < values.length; i++) {
    checksum += values[i] * i;
  }
  const checkValue = checksum % 103;

  const symbols = [...values, checkValue, STOP];
  return symbols.map(v => BARS[v]).join('');
}

/** Converte o padrão de módulos em retângulos (x, largura) só das barras pretas — mais barato de desenhar que 1 elemento por módulo. */
export function modulesToBars(modules: string, moduleWidth: number): { x: number; width: number }[] {
  const bars: { x: number; width: number }[] = [];
  let i = 0;
  while (i < modules.length) {
    if (modules[i] === '1') {
      let j = i;
      while (j < modules.length && modules[j] === '1') j++;
      bars.push({ x: i * moduleWidth, width: (j - i) * moduleWidth });
      i = j;
    } else {
      i++;
    }
  }
  return bars;
}
