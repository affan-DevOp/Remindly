package com.remindly.app.overlay

import android.content.Intent
import android.net.Uri
import android.os.Build
import android.provider.Settings
import androidx.core.content.ContextCompat
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod

class QuickCaptureModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "RemindlyQuickCapture"

    @ReactMethod
    fun canDrawOverlays(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                promise.resolve(Settings.canDrawOverlays(reactContext))
            } else {
                promise.resolve(true)
            }
        } catch (e: Exception) {
            promise.reject("ERR_OVERLAY_CHECK", e.message, e)
        }
    }

    @ReactMethod
    fun openOverlaySettings(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                val intent = Intent(
                    Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                    Uri.parse("package:${reactContext.packageName}")
                ).apply {
                    flags = Intent.FLAG_ACTIVITY_NEW_TASK
                }
                reactContext.startActivity(intent)
                promise.resolve(true)
            } else {
                promise.resolve(false)
            }
        } catch (e: Exception) {
            promise.reject("ERR_OPEN_SETTINGS", e.message, e)
        }
    }

    @ReactMethod
    fun startOverlayService(promise: Promise) {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(reactContext)) {
                promise.reject("ERR_PERMISSION_DENIED", "SYSTEM_ALERT_WINDOW permission is not granted.")
                return
            }
            val intent = Intent(reactContext, QuickCaptureService::class.java).apply {
                action = QuickCaptureService.ACTION_START
            }
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                ContextCompat.startForegroundService(reactContext, intent)
            } else {
                reactContext.startService(intent)
            }
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_START_SERVICE", e.message, e)
        }
    }

    @ReactMethod
    fun stopOverlayService(promise: Promise) {
        try {
            val intent = Intent(reactContext, QuickCaptureService::class.java).apply {
                action = QuickCaptureService.ACTION_STOP
            }
            reactContext.stopService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_STOP_SERVICE", e.message, e)
        }
    }

    @ReactMethod
    fun isOverlayServiceRunning(promise: Promise) {
        promise.resolve(QuickCaptureService.isRunning)
    }

    @ReactMethod
    fun setFloatingButtonVisible(visible: Boolean, promise: Promise) {
        try {
            val intent = Intent(reactContext, QuickCaptureService::class.java).apply {
                action = if (visible) QuickCaptureService.ACTION_SHOW_BUTTON else QuickCaptureService.ACTION_HIDE_BUTTON
            }
            reactContext.startService(intent)
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("ERR_VISIBILITY", e.message, e)
        }
    }
}
