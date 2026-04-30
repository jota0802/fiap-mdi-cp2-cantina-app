// Regras de validacao puras. Retornam ValidationError com chave i18n
// (e variaveis opcionais) em vez de string literal — o consumer
// traduz com t(error.key, error.vars).

export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SENHA_MIN_LENGTH = 6;
export const NOME_MIN_LENGTH = 2;

export type ValidationError = {
  key: string;
  vars?: Record<string, string | number>;
};

export type ValidationResult = ValidationError | undefined;

export function validateEmail(email: string): ValidationResult {
  const trimmed = email.trim();
  if (!trimmed) return { key: 'validation.email_required' };
  if (!EMAIL_REGEX.test(trimmed)) return { key: 'validation.email_invalid' };
  return undefined;
}

export function validateSenha(senha: string): ValidationResult {
  if (!senha) return { key: 'validation.password_required' };
  if (senha.length < SENHA_MIN_LENGTH) {
    return {
      key: 'validation.password_too_short',
      vars: { count: SENHA_MIN_LENGTH },
    };
  }
  return undefined;
}

export function validateNome(nome: string): ValidationResult {
  const trimmed = nome.trim();
  if (!trimmed) return { key: 'validation.name_required' };
  if (trimmed.length < NOME_MIN_LENGTH) return { key: 'validation.name_short' };
  return undefined;
}

export function validateConfirmaSenha(
  confirmaSenha: string,
  senha: string,
): ValidationResult {
  if (!confirmaSenha) return { key: 'validation.confirm_password_required' };
  if (confirmaSenha !== senha) return { key: 'validation.passwords_mismatch' };
  return undefined;
}
