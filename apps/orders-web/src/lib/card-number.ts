import valid from 'card-validator';

export function formatCardNumber(digits: string): string {
  if (!digits) {
    return '';
  }

  const { card } = valid.number(digits);
  const gaps = card?.gaps ?? [4, 8, 12];
  const formatted: string[] = [];

  for (let index = 0; index < digits.length; index += 1) {
    if (gaps.includes(index)) {
      formatted.push(' ');
    }
    formatted.push(digits[index]!);
  }

  return formatted.join('');
}

function getCardNumberMaxLength(digits: string): number {
  const { card } = valid.number(digits);
  return card ? Math.max(...card.lengths) : 19;
}

export function parseCardNumberInput(raw: string, currentDigits: string): string {
  const digits = raw.replace(/\D/g, '');

  if (!digits) {
    return '';
  }

  const validation = valid.number(digits);

  if (!validation.isPotentiallyValid) {
    return currentDigits;
  }

  return digits.slice(0, getCardNumberMaxLength(digits));
}

export function isValidCardNumber(digits: string): boolean {
  return valid.number(digits).isValid;
}
