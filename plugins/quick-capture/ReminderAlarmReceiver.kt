package com.remindly.app.overlay

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.os.Build
import android.net.Uri
import androidx.core.app.NotificationCompat
import com.remindly.app.MainActivity

class ReminderAlarmReceiver : BroadcastReceiver() {
    companion object {
        const val CHANNEL_STANDARD = "remindly_standard"
        const val CHANNEL_URGENT = "remindly_urgent"
        const val EXTRA_TASK_ID = "EXTRA_TASK_ID"
        const val EXTRA_TASK_TITLE = "EXTRA_TASK_TITLE"
        const val EXTRA_IS_URGENT = "EXTRA_IS_URGENT"
    }

    override fun onReceive(context: Context, intent: Intent) {
        val taskId = intent.getStringExtra(EXTRA_TASK_ID) ?: return
        val taskTitle = intent.getStringExtra(EXTRA_TASK_TITLE) ?: "Reminder due"
        val isUrgent = intent.getBooleanExtra(EXTRA_IS_URGENT, false)
        val occurrenceId = intent.getStringExtra("occurrenceId") ?: return
        val settings = mutableMapOf<String, String>()
        var stage = "Due"
        try {
          QuickCaptureDatabaseHelper.getDatabase(context).use { db ->
            db.rawQuery("SELECT status FROM tasks WHERE id = ?", arrayOf(taskId)).use { task ->
              if (!task.moveToFirst() || task.getString(0) != "scheduled") return
            }
            db.rawQuery("SELECT status, os_notification_id, stage_label FROM reminder_occurrences WHERE id = ?", arrayOf(occurrenceId)).use { row ->
              // JS reconciliation takes ownership when the app resumes. Old native alarms then do nothing.
              if (!row.moveToFirst() || row.getString(0) != "scheduled" || row.getString(1) != "native:$occurrenceId") return
              stage = row.getString(2)
            }
            db.rawQuery("SELECT key, value FROM app_settings", null).use { rows ->
              while (rows.moveToNext()) settings[rows.getString(0)] = rows.getString(1)
            }
            if (stage.startsWith("+") && settings["persistent_followups_enabled"] == "0") return
            db.execSQL("UPDATE reminder_occurrences SET status = 'completed' WHERE id = ?", arrayOf(occurrenceId))
          }
        } catch (error: Exception) { return }

        val nm = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

        val sound = settings["notifications_sound_enabled"] != "0"
        val vibration = settings["notifications_vibration_enabled"] != "0"
        val base = if (isUrgent && stage == "Due") CHANNEL_URGENT else CHANNEL_STANDARD
        val channelId = base + (if (sound) "" else "_silent") + (if (vibration) "" else "_no_vibration")
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val name = if (isUrgent) "Important Deadline Alerts" else "Standard Reminders"
            val channel = NotificationChannel(
                channelId,
                name,
                if (isUrgent) NotificationManager.IMPORTANCE_HIGH else NotificationManager.IMPORTANCE_DEFAULT
            )
            if (!sound) channel.setSound(null, null)
            channel.enableVibration(vibration)
            nm.createNotificationChannel(channel)
        }

        val openIntent = Intent(context, MainActivity::class.java).apply {
            action = Intent.ACTION_VIEW
            data = Uri.parse("remindly://task?taskId=${Uri.encode(taskId)}")
            flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
            putExtra("taskId", taskId)
        }
        val pOpen = PendingIntent.getActivity(
            context,
            taskId.hashCode(),
            openIntent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notif = NotificationCompat.Builder(context, channelId)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(if (settings["lock_screen_privacy"] == "1") "Remindly Reminder" else taskTitle)
            .setContentText(if (settings["lock_screen_privacy"] == "1") "You have a scheduled commitment." else "Reminder ($stage)")
            .setSilent(!sound && !vibration)
            .setPriority(if (isUrgent) NotificationCompat.PRIORITY_HIGH else NotificationCompat.PRIORITY_DEFAULT)
            .setCategory(NotificationCompat.CATEGORY_REMINDER)
            .setAutoCancel(true)
            .setContentIntent(pOpen)
            .build()

        nm.notify(occurrenceId.hashCode(), notif)
    }
}
