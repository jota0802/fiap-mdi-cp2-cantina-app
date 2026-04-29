import { Alert, Platform } from 'react-native';

type ConfirmarOpts = {
  titulo: string;
  mensagem: string;
  confirmText?: string;
  cancelText?: string;
  destrutivo?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

/**
 * Confirmação cross-platform. No iOS/Android usa Alert.alert nativo.
 * No web RN-Web ignora o Alert com múltiplos botões — caímos no window.confirm.
 */
export function confirmar({
  titulo,
  mensagem,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destrutivo = false,
  onConfirm,
  onCancel,
}: ConfirmarOpts) {
  if (Platform.OS === 'web') {
    const ok =
      typeof window !== 'undefined' && window.confirm(`${titulo}\n\n${mensagem}`);
    if (ok) onConfirm();
    else onCancel?.();
    return;
  }

  Alert.alert(titulo, mensagem, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    {
      text: confirmText,
      style: destrutivo ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
