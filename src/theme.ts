// Same palette as the admin dashboard (Minimal theme, green primary).

export const colors = {
  primary: '#00A76F',
  primaryDark: '#007867',
  primaryLighter: '#C8FAD6',
  info: '#00B8D9',
  infoLighter: '#CAFDF5',
  infoDark: '#006C9C',
  success: '#22C55E',
  successLighter: '#D3FCD2',
  successDark: '#118D57',
  warning: '#FFAB00',
  warningLighter: '#FFF5CC',
  warningDark: '#B76E00',
  error: '#FF5630',
  errorLighter: '#FFE9D5',
  errorDark: '#B71D18',
  text: '#1C252E',
  textSecondary: '#637381',
  textDisabled: '#919EAB',
  divider: 'rgba(145, 158, 171, 0.24)',
  background: '#F4F6F8',
  paper: '#FFFFFF',
  neutral: '#F4F6F8',
  white: '#FFFFFF',
};

export type Tone = 'default' | 'primary' | 'info' | 'success' | 'warning' | 'error';

/** Soft background + text colour pairs used by labels and icon tiles. */
export const tones: Record<Tone, { bg: string; fg: string; main: string }> = {
  default: { bg: 'rgba(145, 158, 171, 0.16)', fg: colors.textSecondary, main: colors.textSecondary },
  primary: { bg: colors.primaryLighter, fg: colors.primaryDark, main: colors.primary },
  info: { bg: colors.infoLighter, fg: colors.infoDark, main: colors.info },
  success: { bg: colors.successLighter, fg: colors.successDark, main: colors.success },
  warning: { bg: colors.warningLighter, fg: colors.warningDark, main: colors.warning },
  error: { bg: colors.errorLighter, fg: colors.errorDark, main: colors.error },
};

export const radius = { sm: 8, md: 12, lg: 16 };
