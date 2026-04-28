export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const SENHA_MIN_LENGTH = 6;
export const NOME_MIN_LENGTH = 2;

export function validateEmail(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'O e-mail é obrigatório';
  if (!EMAIL_REGEX.test(trimmed)) return 'E-mail inválido';
  return undefined;
}

export function validateSenha(senha: string): string | undefined {
  if (!senha) return 'A senha é obrigatória';
  if (senha.length < SENHA_MIN_LENGTH) {
    return `A senha deve ter no mínimo ${SENHA_MIN_LENGTH} caracteres`;
  }
  return undefined;
}

export function validateNome(nome: string): string | undefined {
  const trimmed = nome.trim();
  if (!trimmed) return 'O nome é obrigatório';
  if (trimmed.length < NOME_MIN_LENGTH) return 'Nome muito curto';
  return undefined;
}

export function validateConfirmaSenha(
  confirmaSenha: string,
  senha: string,
): string | undefined {
  if (!confirmaSenha) return 'Confirme sua senha';
  if (confirmaSenha !== senha) return 'As senhas não coincidem';
  return undefined;
}
