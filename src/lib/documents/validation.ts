export type DocumentType = "cpf" | "cnpj";

const onlyDigits = (value: string): string => value.replace(/\D/g, "");

export const maskDocument = (value: string, documentType: DocumentType): string => {
  const digits = onlyDigits(value);
  if (documentType === "cpf") {
    return digits
      .slice(0, 11)
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d)/, "$1.$2")
      .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
  }

  return digits
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, "$1.$2")
    .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
    .replace(/\.(\d{3})(\d)/, ".$1/$2")
    .replace(/(\d{4})(\d)/, "$1-$2");
};

export const normalizeDocument = (value: string): string => onlyDigits(value);

const validateCpf = (cpf: string): boolean => {
  const digits = onlyDigits(cpf);
  if (digits.length !== 11 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const calcDigit = (base: string, factor: number): number => {
    let total = 0;
    for (let index = 0; index < base.length; index += 1) {
      total += Number(base[index]) * (factor - index);
    }
    const remainder = (total * 10) % 11;
    return remainder === 10 ? 0 : remainder;
  };

  const firstDigit = calcDigit(digits.slice(0, 9), 10);
  const secondDigit = calcDigit(digits.slice(0, 10), 11);

  return firstDigit === Number(digits[9]) && secondDigit === Number(digits[10]);
};

const validateCnpj = (cnpj: string): boolean => {
  const digits = onlyDigits(cnpj);
  if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) {
    return false;
  }

  const calcDigit = (base: string, weights: number[]): number => {
    const total = base
      .split("")
      .reduce((sum, digit, index) => sum + Number(digit) * weights[index], 0);
    const remainder = total % 11;
    return remainder < 2 ? 0 : 11 - remainder;
  };

  const firstDigit = calcDigit(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
  const secondDigit = calcDigit(digits.slice(0, 13), [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);

  return firstDigit === Number(digits[12]) && secondDigit === Number(digits[13]);
};

export const isValidDocument = (value: string, documentType: DocumentType): boolean => {
  if (documentType === "cpf") {
    return validateCpf(value);
  }

  return validateCnpj(value);
};
