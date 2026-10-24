import { OmniTask, ProfileKey, TaskSource } from '../../types/task';

export type OverlayKey =
  | 'quick'
  | 'reminder'
  | 'detail'
  | 'onboarding'
  | 'account'
  | 'permission_explainer'
  | null;

export interface ConfirmationConfig {
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  isDestructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

export interface SelectorOption {
  label: string;
  detail?: string;
  value: string;
  selected?: boolean;
  accentColor?: string;
  icon?: any;
}

export interface SelectorConfig {
  title: string;
  subtitle?: string;
  options: SelectorOption[];
  onSelect: (value: string) => void;
  onClose: () => void;
}

export interface SnackbarState {
  id: string;
  message: string;
  icon?: 'check' | 'clock' | 'trash' | 'info';
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
}
