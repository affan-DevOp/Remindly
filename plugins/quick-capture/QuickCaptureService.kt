package com.remindly.app.overlay

import android.app.Notification
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.app.Service
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.content.IntentFilter
import android.os.Build
import android.os.IBinder
import android.provider.Settings
import android.view.WindowManager
import androidx.core.app.NotificationCompat
import com.remindly.app.MainActivity

class QuickCaptureService : Service() {

    companion object {
        const val ACTION_START = "ACTION_START"
        const val ACTION_STOP = "ACTION_STOP"
        const val ACTION_SHOW_BUTTON = "ACTION_SHOW_BUTTON"
        const val ACTION_HIDE_BUTTON = "ACTION_HIDE_BUTTON"

        const val CHANNEL_ID = "remindly_quick_capture"
        const val NOTIFICATION_ID = 9021

        var isRunning = false
            private set
    }

    private lateinit var windowManager: WindowManager
    private var floatingView: FloatingCaptureView? = null
    private var expandedView: ExpandedCaptureView? = null
    private var isScreenLocked = false

    private val screenReceiver = object : BroadcastReceiver() {
        override fun onReceive(context: Context, intent: Intent) {
            when (intent.action) {
                Intent.ACTION_SCREEN_OFF -> {
                    isScreenLocked = true
                    hideFloatingButton()
                    hideExpandedWindow()
                }
                Intent.ACTION_USER_PRESENT -> {
                    isScreenLocked = false
                    showFloatingButton()
                }
            }
        }
    }

    override fun onCreate() {
        super.onCreate()
        windowManager = getSystemService(Context.WINDOW_SERVICE) as WindowManager

        val filter = IntentFilter().apply {
            addAction(Intent.ACTION_SCREEN_OFF)
            addAction(Intent.ACTION_USER_PRESENT)
        }
        registerReceiver(screenReceiver, filter)
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val action = intent?.action ?: ACTION_START

        when (action) {
            ACTION_START -> {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) {
                    stopSelf()
                    return START_NOT_STICKY
                }
                startForeground(NOTIFICATION_ID, createNotification())
                isRunning = true
                showFloatingButton()
            }
            ACTION_STOP -> {
                hideFloatingButton()
                hideExpandedWindow()
                stopForeground(true)
                stopSelf()
                isRunning = false
            }
            ACTION_SHOW_BUTTON -> {
                showFloatingButton()
            }
            ACTION_HIDE_BUTTON -> {
                hideFloatingButton()
            }
        }

        return START_STICKY
    }

    private fun createNotification(): Notification {
        val nm = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Quick Capture Anywhere",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Persistent overlay button to capture reminders anywhere"
                setShowBadge(false)
            }
            nm.createNotificationChannel(channel)
        }

        val openApp = PendingIntent.getActivity(
            this,
            0,
            Intent(this, MainActivity::class.java),
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val stopIntent = Intent(this, QuickCaptureService::class.java).apply {
            action = ACTION_STOP
        }
        val pStop = PendingIntent.getService(
            this,
            1,
            stopIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        return NotificationCompat.Builder(this, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle("Remindly Quick Capture Active")
            .setContentText("Floating capture button is available across apps")
            .setPriority(NotificationCompat.PRIORITY_LOW)
            .setOngoing(true)
            .setContentIntent(openApp)
            .addAction(android.R.drawable.ic_menu_close_clear_cancel, "Stop", pStop)
            .build()
    }

    private fun showFloatingButton() {
        if (isScreenLocked || floatingView != null) return
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M && !Settings.canDrawOverlays(this)) return

        val view = FloatingCaptureView(this, windowManager) {
            showExpandedWindow()
        }
        try {
            windowManager.addView(view, view.layoutParams)
            floatingView = view
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun hideFloatingButton() {
        floatingView?.let {
            try {
                windowManager.removeView(it)
            } catch (e: Exception) {}
            floatingView = null
        }
    }

    private fun showExpandedWindow() {
        hideFloatingButton()
        if (expandedView != null) return

        val expView = ExpandedCaptureView(this, windowManager) {
            hideExpandedWindow()
            showFloatingButton()
        }
        try {
            windowManager.addView(expView, expView.layoutParams)
            expandedView = expView
        } catch (e: Exception) {
            e.printStackTrace()
            showFloatingButton()
        }
    }

    private fun hideExpandedWindow() {
        expandedView?.let {
            try {
                windowManager.removeView(it)
            } catch (e: Exception) {}
            expandedView = null
        }
    }

    override fun onDestroy() {
        super.onDestroy()
        isRunning = false
        try {
            unregisterReceiver(screenReceiver)
        } catch (e: Exception) {}
        hideFloatingButton()
        hideExpandedWindow()
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
