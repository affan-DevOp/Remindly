import { NativeModules, Platform } from 'react-native';

const RemindlyQuickCapture = (NativeModules && NativeModules.RemindlyQuickCapture) || null;

export interface OverlayStatus {
  isSupported: boolean;
  canDrawOverlays: boolean;
  isRunning: boolean;
}

export class QuickCaptureOverlayService {
  /**
   * Quick Capture Anywhere relies on native Android WindowManager TYPE_APPLICATION_OVERLAY.
   */
  public isSupported(): boolean {
    return Platform.OS === 'android' && typeof RemindlyQuickCapture?.startOverlayService === 'function';
  }

  /**
   * Checks whether SYSTEM_ALERT_WINDOW (display over other apps) permission is granted.
   */
  public async canDrawOverlays(): Promise<boolean> {
    if (Platform.OS !== 'android' || !RemindlyQuickCapture?.canDrawOverlays) {
      return false;
    }
    try {
      return await RemindlyQuickCapture.canDrawOverlays();
    } catch (e) {
      console.warn('[QuickCaptureOverlay] canDrawOverlays check failed:', e);
      return false;
    }
  }

  /**
   * Launches Android's official system settings screen for Overlay permissions.
   */
  public async openOverlaySettings(): Promise<boolean> {
    if (Platform.OS !== 'android' || !RemindlyQuickCapture?.openOverlaySettings) {
      return false;
    }
    try {
      return await RemindlyQuickCapture.openOverlaySettings();
    } catch (e) {
      console.warn('[QuickCaptureOverlay] openOverlaySettings failed:', e);
      return false;
    }
  }

  /**
   * Starts the native Android floating overlay foreground service.
   */
  public async startOverlayService(): Promise<boolean> {
    if (Platform.OS !== 'android' || !RemindlyQuickCapture?.startOverlayService) {
      return false;
    }
    try {
      return await RemindlyQuickCapture.startOverlayService();
    } catch (e) {
      console.warn('[QuickCaptureOverlay] startOverlayService failed:', e);
      return false;
    }
  }

  /**
   * Stops the native Android floating overlay foreground service and removes views.
   */
  public async stopOverlayService(): Promise<boolean> {
    if (Platform.OS !== 'android' || !RemindlyQuickCapture?.stopOverlayService) {
      return false;
    }
    try {
      return await RemindlyQuickCapture.stopOverlayService();
    } catch (e) {
      console.warn('[QuickCaptureOverlay] stopOverlayService failed:', e);
      return false;
    }
  }

  /**
   * Queries whether the native overlay foreground service is currently running.
   */
  public async isOverlayServiceRunning(): Promise<boolean> {
    if (Platform.OS !== 'android' || !RemindlyQuickCapture?.isOverlayServiceRunning) {
      return false;
    }
    try {
      return await RemindlyQuickCapture.isOverlayServiceRunning();
    } catch (e) {
      return false;
    }
  }

  /**
   * Temporarily hides or shows the floating button without terminating the service.
   */
  public async setFloatingButtonVisible(visible: boolean): Promise<boolean> {
    if (Platform.OS !== 'android' || !RemindlyQuickCapture?.setFloatingButtonVisible) {
      return false;
    }
    try {
      return await RemindlyQuickCapture.setFloatingButtonVisible(visible);
    } catch (e) {
      return false;
    }
  }
}

export const quickCaptureOverlayService = new QuickCaptureOverlayService();
