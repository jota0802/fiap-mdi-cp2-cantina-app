// Internacionalizacao do app — PT (default) / EN / ES.
// O dict abaixo cobre as strings mais visiveis: navegacao, saudacoes,
// botoes principais, validacoes, status de pedido e onboarding.
// Nao cobrimos cada microcopy do app; o helper t() faz fallback pra
// PT e depois pra propria chave caso a traducao nao exista.

export type Locale = 'pt' | 'en' | 'es';

export const LOCALES: readonly Locale[] = ['pt', 'en', 'es'] as const;

export const LOCALE_LABEL: Record<Locale, string> = {
  pt: 'Português',
  en: 'English',
  es: 'Español',
};

export const LOCALE_FLAG: Record<Locale, string> = {
  pt: '🇧🇷',
  en: '🇺🇸',
  es: '🇪🇸',
};

type Dict = Record<string, string>;

const pt: Dict = {
  // ─── Tabs ────────────────────────────────────────────
  'tab.home': 'Início',
  'tab.menu': 'Cardápio',
  'tab.orders': 'Pedidos',
  'tab.profile': 'Perfil',

  // ─── Saudação ────────────────────────────────────────
  'greeting.morning': 'Bom dia',
  'greeting.afternoon': 'Boa tarde',
  'greeting.evening': 'Boa noite',
  'greeting.guest': 'visitante',

  // ─── Status do pedido ────────────────────────────────
  'status.pendente': 'Preparando',
  'status.pronto': 'Pronto',
  'status.retirado': 'Retirado',
  'status.cancelado': 'Cancelado',

  // ─── Botões principais ───────────────────────────────
  'cta.add_to_cart': 'Adicionar ao carrinho',
  'cta.confirm_order': 'Confirmar pedido',
  'cta.cancel_order': 'Cancelar pedido',
  'cta.keep_order': 'Manter pedido',
  'cta.mark_picked_up': 'Marcar como retirado',
  'cta.reorder': 'Pedir de novo',
  'cta.view_orders': 'Ver meus pedidos',
  'cta.view_menu': 'Ver cardápio',
  'cta.next': 'Próximo',
  'cta.start': 'Começar',
  'cta.skip': 'Pular',
  'cta.save': 'Salvar',
  'cta.logout': 'Sair',

  // ─── Auth ────────────────────────────────────────────
  'auth.login_title': 'Entrar',
  'auth.signup_title': 'Criar conta',
  'auth.email': 'E-mail',
  'auth.password': 'Senha',
  'auth.password_confirm': 'Confirmar senha',
  'auth.name': 'Nome completo',
  'auth.have_account': 'Já tem conta? Entrar',
  'auth.no_account': 'Não tem conta? Cadastre-se',
  'auth.forgot_password': 'Esqueci minha senha',
  'auth.welcome_back': 'Bem-vindo de volta',
  'auth.create_account_subtitle': 'Cadastre-se em segundos',

  // ─── Validações ──────────────────────────────────────
  'validation.required': 'Este campo é obrigatório',
  'validation.email_invalid': 'E-mail inválido',
  'validation.email_taken': 'E-mail já cadastrado',
  'validation.password_short': 'Senha precisa ter ao menos 6 caracteres',
  'validation.password_mismatch': 'Senhas não conferem',
  'validation.name_short': 'Nome muito curto',
  'validation.credentials_invalid': 'E-mail ou senha incorretos',

  // ─── Empty states ────────────────────────────────────
  'empty.cart_title': 'Carrinho vazio',
  'empty.cart_subtitle': 'Adicione itens do cardápio pra começar',
  'empty.orders_title': 'Sem pedidos por aqui',
  'empty.orders_subtitle': 'Quando você fizer o primeiro, ele aparece aqui',
  'empty.search_title': 'Nada encontrado',
  'empty.search_subtitle': 'Tente outro termo ou categoria',
  'empty.favorites_title': 'Sem favoritos ainda',

  // ─── Perfil ──────────────────────────────────────────
  'profile.appearance': 'Aparência',
  'profile.dark_mode': 'Modo escuro',
  'profile.light_mode': 'Modo claro',
  'profile.language': 'Idioma',
  'profile.account': 'Conta',
  'profile.edit_profile': 'Editar perfil',
  'profile.about': 'Sobre o app',
  'profile.photo': 'Foto de perfil',
  'profile.take_photo': 'Tirar foto',
  'profile.choose_gallery': 'Escolher da galeria',
  'profile.remove_photo': 'Remover foto',

  // ─── Onboarding ──────────────────────────────────────
  'onboarding.slide1_title': 'Monte seu pedido',
  'onboarding.slide1_text':
    'Explore o cardápio completo e adicione seus favoritos. Busca em tempo real e filtros por categoria.',
  'onboarding.slide2_title': 'Confirme em segundos',
  'onboarding.slide2_text':
    'Revise no carrinho, confirme e receba uma senha única na hora. Sem fila, sem confusão.',
  'onboarding.slide3_title': 'Retire quando ficar pronto',
  'onboarding.slide3_text':
    'Notificação automática quando o pedido sai da cozinha. Mostre a senha no balcão e pegue tudo.',

  // ─── Confirmação ─────────────────────────────────────
  'confirmation.title': 'Sua senha está pronta',
  'confirmation.eyebrow': 'PEDIDO CONFIRMADO',
  'confirmation.show_at_counter': 'Apresente este número no balcão',
  'confirmation.your_password': 'SUA SENHA',
  'confirmation.notif_hint':
    'Você será notificado quando o pedido estiver pronto pra retirada.',

  // ─── Home ────────────────────────────────────────────
  'home.new_order': 'NOVO PEDIDO',
  'home.cart': 'Carrinho',
  'home.empty_cart': 'Vazio',
  'home.history': 'Histórico',
  'home.no_orders': 'Nenhum ainda',
  'home.featured': 'Destaques',
  'home.your_favorites': 'Seus favoritos',
  'home.recent_orders': 'Últimos pedidos',
  'home.see_all': 'Ver tudo',
  'home.suggestion': 'SUGESTÃO',
  'home.personalized': 'PERSONALIZADO',
  'home.alternative': 'ALTERNATIVA',

  // ─── Pedidos / detalhes ──────────────────────────────
  'orders.title': 'Pedidos',
  'orders.loading': 'Carregando seus pedidos',
  'orders.password_label': 'SENHA',
  'orders.total_label': 'TOTAL',
  'order.details_title': 'Pedido',
  'order.timeline_title': 'Linha do tempo',
  'order.cancel_confirm_title': 'Cancelar este pedido?',
  'order.cancel_confirm_message':
    'O pedido com a senha {senha} será cancelado e não poderá ser recuperado.',

  // ─── Genéricos ───────────────────────────────────────
  'common.error': 'Erro',
  'common.success': 'Sucesso',
  'common.loading': 'Carregando',
};

const en: Dict = {
  'tab.home': 'Home',
  'tab.menu': 'Menu',
  'tab.orders': 'Orders',
  'tab.profile': 'Profile',

  'greeting.morning': 'Good morning',
  'greeting.afternoon': 'Good afternoon',
  'greeting.evening': 'Good evening',
  'greeting.guest': 'guest',

  'status.pendente': 'Preparing',
  'status.pronto': 'Ready',
  'status.retirado': 'Picked up',
  'status.cancelado': 'Cancelled',

  'cta.add_to_cart': 'Add to cart',
  'cta.confirm_order': 'Confirm order',
  'cta.cancel_order': 'Cancel order',
  'cta.keep_order': 'Keep order',
  'cta.mark_picked_up': 'Mark as picked up',
  'cta.reorder': 'Order again',
  'cta.view_orders': 'View my orders',
  'cta.view_menu': 'View menu',
  'cta.next': 'Next',
  'cta.start': 'Get started',
  'cta.skip': 'Skip',
  'cta.save': 'Save',
  'cta.logout': 'Sign out',

  'auth.login_title': 'Sign in',
  'auth.signup_title': 'Create account',
  'auth.email': 'Email',
  'auth.password': 'Password',
  'auth.password_confirm': 'Confirm password',
  'auth.name': 'Full name',
  'auth.have_account': 'Already have an account? Sign in',
  'auth.no_account': "Don't have an account? Sign up",
  'auth.forgot_password': 'Forgot password',
  'auth.welcome_back': 'Welcome back',
  'auth.create_account_subtitle': 'Sign up in seconds',

  'validation.required': 'This field is required',
  'validation.email_invalid': 'Invalid email',
  'validation.email_taken': 'Email already in use',
  'validation.password_short': 'Password must be at least 6 characters',
  'validation.password_mismatch': "Passwords don't match",
  'validation.name_short': 'Name too short',
  'validation.credentials_invalid': 'Invalid email or password',

  'empty.cart_title': 'Cart is empty',
  'empty.cart_subtitle': 'Add items from the menu to get started',
  'empty.orders_title': 'No orders yet',
  'empty.orders_subtitle': "When you place one, it'll show up here",
  'empty.search_title': 'Nothing found',
  'empty.search_subtitle': 'Try a different term or category',
  'empty.favorites_title': 'No favorites yet',

  'profile.appearance': 'Appearance',
  'profile.dark_mode': 'Dark mode',
  'profile.light_mode': 'Light mode',
  'profile.language': 'Language',
  'profile.account': 'Account',
  'profile.edit_profile': 'Edit profile',
  'profile.about': 'About the app',
  'profile.photo': 'Profile photo',
  'profile.take_photo': 'Take photo',
  'profile.choose_gallery': 'Choose from gallery',
  'profile.remove_photo': 'Remove photo',

  'onboarding.slide1_title': 'Build your order',
  'onboarding.slide1_text':
    'Browse the full menu and save favorites. Real-time search and category filters included.',
  'onboarding.slide2_title': 'Confirm in seconds',
  'onboarding.slide2_text':
    'Review your cart, confirm, and get a unique pickup code instantly. No queue, no fuss.',
  'onboarding.slide3_title': 'Pick up when ready',
  'onboarding.slide3_text':
    'Get notified the moment your order leaves the kitchen. Show your code at the counter.',

  'confirmation.title': 'Your code is ready',
  'confirmation.eyebrow': 'ORDER CONFIRMED',
  'confirmation.show_at_counter': 'Show this number at the counter',
  'confirmation.your_password': 'YOUR CODE',
  'confirmation.notif_hint':
    "You'll be notified the moment your order is ready for pickup.",

  'home.new_order': 'NEW ORDER',
  'home.cart': 'Cart',
  'home.empty_cart': 'Empty',
  'home.history': 'History',
  'home.no_orders': 'None yet',
  'home.featured': 'Featured',
  'home.your_favorites': 'Your favorites',
  'home.recent_orders': 'Recent orders',
  'home.see_all': 'See all',
  'home.suggestion': 'SUGGESTION',
  'home.personalized': 'PERSONALIZED',
  'home.alternative': 'ALTERNATIVE',

  'orders.title': 'Orders',
  'orders.loading': 'Loading your orders',
  'orders.password_label': 'CODE',
  'orders.total_label': 'TOTAL',
  'order.details_title': 'Order',
  'order.timeline_title': 'Timeline',
  'order.cancel_confirm_title': 'Cancel this order?',
  'order.cancel_confirm_message':
    'The order with code {senha} will be cancelled and cannot be restored.',

  'common.error': 'Error',
  'common.success': 'Success',
  'common.loading': 'Loading',
};

const es: Dict = {
  'tab.home': 'Inicio',
  'tab.menu': 'Menú',
  'tab.orders': 'Pedidos',
  'tab.profile': 'Perfil',

  'greeting.morning': 'Buenos días',
  'greeting.afternoon': 'Buenas tardes',
  'greeting.evening': 'Buenas noches',
  'greeting.guest': 'visitante',

  'status.pendente': 'Preparando',
  'status.pronto': 'Listo',
  'status.retirado': 'Retirado',
  'status.cancelado': 'Cancelado',

  'cta.add_to_cart': 'Añadir al carrito',
  'cta.confirm_order': 'Confirmar pedido',
  'cta.cancel_order': 'Cancelar pedido',
  'cta.keep_order': 'Mantener pedido',
  'cta.mark_picked_up': 'Marcar como retirado',
  'cta.reorder': 'Pedir de nuevo',
  'cta.view_orders': 'Ver mis pedidos',
  'cta.view_menu': 'Ver menú',
  'cta.next': 'Siguiente',
  'cta.start': 'Empezar',
  'cta.skip': 'Saltar',
  'cta.save': 'Guardar',
  'cta.logout': 'Cerrar sesión',

  'auth.login_title': 'Iniciar sesión',
  'auth.signup_title': 'Crear cuenta',
  'auth.email': 'Correo',
  'auth.password': 'Contraseña',
  'auth.password_confirm': 'Confirmar contraseña',
  'auth.name': 'Nombre completo',
  'auth.have_account': '¿Ya tienes cuenta? Iniciar sesión',
  'auth.no_account': '¿No tienes cuenta? Regístrate',
  'auth.forgot_password': 'Olvidé mi contraseña',
  'auth.welcome_back': 'Bienvenido de vuelta',
  'auth.create_account_subtitle': 'Regístrate en segundos',

  'validation.required': 'Este campo es obligatorio',
  'validation.email_invalid': 'Correo inválido',
  'validation.email_taken': 'Correo ya registrado',
  'validation.password_short': 'La contraseña debe tener al menos 6 caracteres',
  'validation.password_mismatch': 'Las contraseñas no coinciden',
  'validation.name_short': 'Nombre muy corto',
  'validation.credentials_invalid': 'Correo o contraseña incorrectos',

  'empty.cart_title': 'Carrito vacío',
  'empty.cart_subtitle': 'Añade artículos del menú para empezar',
  'empty.orders_title': 'Sin pedidos aún',
  'empty.orders_subtitle': 'Cuando hagas el primero, aparecerá aquí',
  'empty.search_title': 'Nada encontrado',
  'empty.search_subtitle': 'Prueba otro término o categoría',
  'empty.favorites_title': 'Sin favoritos aún',

  'profile.appearance': 'Apariencia',
  'profile.dark_mode': 'Modo oscuro',
  'profile.light_mode': 'Modo claro',
  'profile.language': 'Idioma',
  'profile.account': 'Cuenta',
  'profile.edit_profile': 'Editar perfil',
  'profile.about': 'Sobre la app',
  'profile.photo': 'Foto de perfil',
  'profile.take_photo': 'Tomar foto',
  'profile.choose_gallery': 'Elegir de la galería',
  'profile.remove_photo': 'Quitar foto',

  'onboarding.slide1_title': 'Arma tu pedido',
  'onboarding.slide1_text':
    'Explora el menú completo y guarda tus favoritos. Búsqueda en tiempo real y filtros por categoría.',
  'onboarding.slide2_title': 'Confirma en segundos',
  'onboarding.slide2_text':
    'Revisa el carrito, confirma y recibe un código único al instante. Sin filas, sin lío.',
  'onboarding.slide3_title': 'Retira cuando esté listo',
  'onboarding.slide3_text':
    'Notificación automática cuando tu pedido sale de la cocina. Muestra el código en el mostrador.',

  'confirmation.title': 'Tu código está listo',
  'confirmation.eyebrow': 'PEDIDO CONFIRMADO',
  'confirmation.show_at_counter': 'Muestra este número en el mostrador',
  'confirmation.your_password': 'TU CÓDIGO',
  'confirmation.notif_hint':
    'Recibirás una notificación cuando el pedido esté listo para retirar.',

  'home.new_order': 'NUEVO PEDIDO',
  'home.cart': 'Carrito',
  'home.empty_cart': 'Vacío',
  'home.history': 'Historial',
  'home.no_orders': 'Ninguno aún',
  'home.featured': 'Destacados',
  'home.your_favorites': 'Tus favoritos',
  'home.recent_orders': 'Pedidos recientes',
  'home.see_all': 'Ver todo',
  'home.suggestion': 'SUGERENCIA',
  'home.personalized': 'PERSONALIZADO',
  'home.alternative': 'ALTERNATIVA',

  'orders.title': 'Pedidos',
  'orders.loading': 'Cargando tus pedidos',
  'orders.password_label': 'CÓDIGO',
  'orders.total_label': 'TOTAL',
  'order.details_title': 'Pedido',
  'order.timeline_title': 'Cronología',
  'order.cancel_confirm_title': '¿Cancelar este pedido?',
  'order.cancel_confirm_message':
    'El pedido con código {senha} se cancelará y no podrá recuperarse.',

  'common.error': 'Error',
  'common.success': 'Éxito',
  'common.loading': 'Cargando',
};

const dictionaries: Record<Locale, Dict> = { pt, en, es };

/**
 * Traduz uma chave para o locale informado. Faz fallback pra PT se a
 * chave nao existe no idioma alvo e, em ultimo caso, retorna a propria
 * chave (facilita debug — strings nao traduzidas viram visiveis).
 */
export function translate(locale: Locale, key: string): string {
  return dictionaries[locale][key] ?? dictionaries.pt[key] ?? key;
}

/**
 * Substitui placeholders {var} pelo valor correspondente no objeto vars.
 */
export function interpolate(
  template: string,
  vars: Record<string, string | number>,
): string {
  let out = template;
  for (const [k, v] of Object.entries(vars)) {
    out = out.split(`{${k}}`).join(String(v));
  }
  return out;
}
