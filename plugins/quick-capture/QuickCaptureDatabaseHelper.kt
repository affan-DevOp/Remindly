package com.remindly.app.overlay

import android.content.ContentValues
import android.content.Context
import android.database.sqlite.SQLiteDatabase
import java.text.SimpleDateFormat
import java.util.*
import java.io.File

object QuickCaptureDatabaseHelper {
    private const val DB_NAME = "remindly.db"

    fun getDatabase(context: Context): SQLiteDatabase {
        val expoFile = File(context.filesDir, "SQLite/$DB_NAME")
        val dbFile = if (expoFile.exists()) expoFile else context.getDatabasePath(DB_NAME)
        return SQLiteDatabase.openDatabase(dbFile.path, null, SQLiteDatabase.OPEN_READWRITE).apply {
            setForeignKeyConstraintsEnabled(true)
        }
    }

    fun saveReminder(
        context: Context,
        title: String,
        deadlineMode: String, // "today", "tomorrow", "inbox"
        profile: String       // "Simple", "Standard", "Important", "Persistent"
    ): String? {
        var db: SQLiteDatabase? = null
        return try {
            db = getDatabase(context)
            db.beginTransaction()
            val settings = mutableMapOf<String, String>()
            db.rawQuery("SELECT key, value FROM app_settings", null).use { rows ->
                while (rows.moveToNext()) settings[rows.getString(0)] = rows.getString(1)
            }
            val userId = if (settings["user_is_logged_in"] == "1") settings["user_email"].orEmpty().ifBlank { "local_guest" } else "local_guest"

            val taskId = UUID.randomUUID().toString()
            val now = Date()
            val isoFormat = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
                timeZone = TimeZone.getTimeZone("UTC")
            }
            val nowIso = isoFormat.format(now)

            var dueAtUtc: String? = null
            var dueLocalDate: String? = null
            var dueLocalTime: String? = null
            var duePrecision = "none"
            var status = "inbox"

            val cal = Calendar.getInstance()
            if (deadlineMode == "today") {
                cal.time = now
                cal.set(Calendar.HOUR_OF_DAY, 18)
                cal.set(Calendar.MINUTE, 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                if (cal.timeInMillis <= now.time) {
                    cal.time = Date(now.time + 60 * 60 * 1000)
                }
                val due = cal.time
                dueAtUtc = isoFormat.format(due)
                val df = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                val tf = SimpleDateFormat("HH:mm", Locale.US)
                dueLocalDate = df.format(due)
                dueLocalTime = tf.format(due)
                duePrecision = "datetime"
                status = "scheduled"
            } else if (deadlineMode == "tomorrow") {
                cal.time = now
                cal.add(Calendar.DAY_OF_YEAR, 1)
                val defaultTime = (settings["default_date_only_time"] ?: "09:00").split(":")
                cal.set(Calendar.HOUR_OF_DAY, defaultTime[0].toIntOrNull() ?: 9)
                cal.set(Calendar.MINUTE, defaultTime.getOrNull(1)?.take(2)?.toIntOrNull() ?: 0)
                cal.set(Calendar.SECOND, 0)
                cal.set(Calendar.MILLISECOND, 0)
                val due = cal.time
                dueAtUtc = isoFormat.format(due)
                val df = SimpleDateFormat("yyyy-MM-dd", Locale.US)
                val tf = SimpleDateFormat("HH:mm", Locale.US)
                dueLocalDate = df.format(due)
                dueLocalTime = tf.format(due)
                duePrecision = "datetime"
                status = "scheduled"
            }

            val profileId = when (profile) {
                "Simple" -> "builtin_simple"
                "Important" -> "builtin_important"
                "Persistent" -> "builtin_persistent"
                else -> "builtin_standard"
            }

            // 1. Insert into tasks
            val taskValues = ContentValues().apply {
                put("id", taskId)
                put("user_id", userId)
                put("title", title.trim())
                put("notes", "Captured via Remindly Quick Capture Anywhere")
                put("status", status)
                put("priority", if (profile == "Important") "important" else "normal")
                put("due_precision", duePrecision)
                put("due_at_utc", dueAtUtc)
                put("due_local_date", dueLocalDate)
                put("due_local_time", dueLocalTime)
                put("due_timezone", TimeZone.getDefault().id)
                put("reminder_profile_id", profileId)
                put("created_at_utc", nowIso)
                put("updated_at_utc", nowIso)
            }
            db.insertOrThrow("tasks", null, taskValues)

            // 2. Insert into task_sources
            val sourceValues = ContentValues().apply {
                put("id", "source-$taskId")
                put("task_id", taskId)
                put("source_app_label", "Quick Capture Anywhere")
                put("source_app_package", context.packageName)
                put("source_url", null as String?)
                put("source_excerpt", title.trim())
                put("sender_label", null as String?)
                put("subject", null as String?)
                put("created_at_utc", nowIso)
            }
            db.insertOrThrow("task_sources", null, sourceValues)

            // Use the same seeded profile stages and record format as the JS repository.
            if (dueAtUtc != null) {
              db.rawQuery("SELECT id, offset_minutes FROM profile_stages WHERE profile_id = ? AND enabled = 1 ORDER BY sort_order", arrayOf(profileId)).use { stages ->
                while (stages.moveToNext()) {
                  val stageId = stages.getString(0)
                  val offset = stages.getInt(1)
                  val triggerMillis = cal.timeInMillis + offset * 60000L
                  val occurrenceId = "occ-$taskId-$stageId-$triggerMillis"
                  val label = when {
                    offset == 0 -> "Due"
                    offset < 0 && -offset % 60 == 0 -> "${offset / 60}h"
                    offset < 0 -> "${offset}m"
                    else -> "+${offset}m"
                  }
                  val occValues = ContentValues().apply {
                    put("id", occurrenceId)
                    put("task_id", taskId)
                    put("profile_stage_id", stageId)
                    put("trigger_at_utc", isoFormat.format(Date(triggerMillis)))
                    put("stage_label", label)
                    put("status", if (triggerMillis > now.time) "pending" else "skipped")
                    putNull("os_notification_id")
                    put("schedule_attempt_count", 0)
                    put("created_at_utc", nowIso)
                    put("updated_at_utc", nowIso)
                }
                  db.insertOrThrow("reminder_occurrences", null, occValues)
                }
              }
            }

            db.setTransactionSuccessful()
            taskId
        } catch (e: Exception) {
            e.printStackTrace()
            null
        } finally {
            if (db?.inTransaction() == true) db.endTransaction()
            db?.close()
        }
    }
}
