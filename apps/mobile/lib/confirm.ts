import { Alert } from 'react-native';

type ConfirmarOpts = {
  titulo: string;
  mensagem: string;
  confirmText?: string;
  cancelText?: string;
  destrutivo?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
};

export function confirmar({
  titulo,
  mensagem,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  destrutivo = false,
  onConfirm,
  onCancel,
}: ConfirmarOpts) {
  Alert.alert(titulo, mensagem, [
    { text: cancelText, style: 'cancel', onPress: onCancel },
    {
      text: confirmText,
      style: destrutivo ? 'destructive' : 'default',
      onPress: onConfirm,
    },
  ]);
}
