// Validação client-side de CPF/CNPJ/e-mail pra dar feedback em tempo real nos formulários de
// cadastro, sem precisar de round-trip ao servidor só pra descobrir que o dígito verificador
// não bate. Servidor continua sendo a fonte de verdade (essa validação é só UX).

export function validarCpf(valor: string): boolean {
  const s = (valor || '').replace(/\D/g, '');
  if (s.length !== 11 || /^(\d)\1+$/.test(s)) return false;

  let soma = 0;
  for (let i = 0; i < 9; i++) soma += parseInt(s[i], 10) * (10 - i);
  let resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  if (resto !== parseInt(s[9], 10)) return false;

  soma = 0;
  for (let i = 0; i < 10; i++) soma += parseInt(s[i], 10) * (11 - i);
  resto = (soma * 10) % 11;
  if (resto === 10) resto = 0;
  return resto === parseInt(s[10], 10);
}

export function validarCnpj(valor: string): boolean {
  const s = (valor || '').replace(/\D/g, '');
  if (s.length !== 14 || /^(\d)\1+$/.test(s)) return false;

  const calcularDv = (pesos: number[]): number => {
    const soma = pesos.reduce((acc, peso, i) => acc + parseInt(s[i], 10) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
  };

  if (calcularDv([5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) !== parseInt(s[12], 10)) return false;
  return calcularDv([6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]) === parseInt(s[13], 10);
}

// Aceita vazio (campo opcional em alguns formulários) — quem exige preenchimento valida isso
// separadamente. Só reclama se tiver algo digitado e não for um CPF/CNPJ válido.
export function validarCpfCnpj(valor: string): boolean {
  const digitos = (valor || '').replace(/\D/g, '');
  if (!digitos) return true;
  if (digitos.length === 11) return validarCpf(digitos);
  if (digitos.length === 14) return validarCnpj(digitos);
  return false;
}

export function validarEmail(valor: string): boolean {
  if (!valor) return true;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(valor);
}
