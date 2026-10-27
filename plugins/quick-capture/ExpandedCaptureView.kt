package com.remindly.app.overlay

import android.app.AlarmManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.os.Build
import android.view.Gravity
import android.view.KeyEvent
import android.view.MotionEvent
import android.view.View
import android.view.WindowManager
import android.view.inputmethod.InputMethodManager
import android.widget.*
import java.util.Calendar
import java.util.Locale
import java.util.TimeZone

class ExpandedCaptureView(
    context: Context,
    private val windowManager: WindowManager,
    private val onDismiss: () -> Unit
) : FrameLayout(context) {

    val layoutParams = WindowManager.LayoutParams().apply {
        type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        flags = WindowManager.LayoutParams.FLAG_NOT_TOUCH_MODAL or
                WindowManager.LayoutParams.FLAG_WATCH_OUTSIDE_TOUCH
        format = android.graphics.PixelFormat.TRANSLUCENT
        gravity = Gravity.CENTER
        width = (resources.displayMetrics.widthPixels * 0.90).toInt()
        height = WindowManager.LayoutParams.WRAP_CONTENT
        softInputMode = WindowManager.LayoutParams.SOFT_INPUT_ADJUST_RESIZE or
                WindowManager.LayoutParams.SOFT_INPUT_STATE_VISIBLE
    }

    private var selectedDeadline = "today"
    private var selectedProfile = "Standard"

    init {
        val density = resources.displayMetrics.density
        isFocusable = true
        isFocusableInTouchMode = true

        val card = LinearLayout(context).apply {
            orientation = LinearLayout.VERTICAL
            val pad = (18 * density).toInt()
            setPadding(pad, pad, pad, pad)
            background = GradientDrawable().apply {
                cornerRadius = 20 * density
                setColor(Color.parseColor("#1E1B15"))
                setStroke((1 * density).toInt(), Color.parseColor("#3A3428"))
            }
            elevation = 16 * density
        }

        // Header Row: Dot + Eyebrow + Close Button
        val header = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        val dot = View(context).apply {
            val s = (8 * density).toInt()
            layoutParams = LinearLayout.LayoutParams(s, s).apply {
                rightMargin = (8 * density).toInt()
            }
            background = GradientDrawable().apply {
                shape = GradientDrawable.OVAL
                setColor(Color.parseColor("#DDF24B"))
            }
        }
        header.addView(dot)

        val eyebrow = TextView(context).apply {
            text = "QUICK CAPTURE ANYWHERE"
            setTextColor(Color.parseColor("#8C867A"))
            textSize = 10f
            setTypeface(null, android.graphics.Typeface.BOLD)
            letterSpacing = 0.08f
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        header.addView(eyebrow)

        val closeBtn = TextView(context).apply {
            text = "✕"
            setTextColor(Color.parseColor("#8C867A"))
            textSize = 16f
            val p = (6 * density).toInt()
            setPadding(p, p, p, p)
            setOnClickListener { onDismiss() }
        }
        header.addView(closeBtn)
        card.addView(header)

        // Subtitle
        val sub = TextView(context).apply {
            text = "Capture a reminder instantly from any app."
            setTextColor(Color.parseColor("#B0A89C"))
            textSize = 12f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = (4 * density).toInt()
                bottomMargin = (12 * density).toInt()
            }
        }
        card.addView(sub)

        // Title Input Field
        val titleInput = EditText(context).apply {
            hint = "What do you need to remember?"
            setHintTextColor(Color.parseColor("#6B655B"))
            setTextColor(Color.WHITE)
            textSize = 15f
            val p12 = (12 * density).toInt()
            setPadding(p12, p12, p12, p12)
            background = GradientDrawable().apply {
                cornerRadius = 14 * density
                setColor(Color.parseColor("#28241D"))
                setStroke((1 * density).toInt(), Color.parseColor("#3A3428"))
            }
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (14 * density).toInt()
            }
        }
        card.addView(titleInput)

        // Deadline Section Label
        val deadlineLabel = TextView(context).apply {
            text = "WHEN SHOULD WE NUDGE YOU?"
            setTextColor(Color.parseColor("#8C867A"))
            textSize = 9f
            setTypeface(null, android.graphics.Typeface.BOLD)
            letterSpacing = 0.08f
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.WRAP_CONTENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (6 * density).toInt()
            }
        }
        card.addView(deadlineLabel)

        // Deadline Buttons (Today, Tomorrow, Inbox)
        val deadlineRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                bottomMargin = (14 * density).toInt()
            }
        }

        val btnToday = createChoiceButton(context, "Today", true)
        val btnTomorrow = createChoiceButton(context, "Tomorrow", false)
        val btnInbox = createChoiceButton(context, "Inbox", false)

        btnToday.setOnClickListener {
            selectedDeadline = "today"
            updateButtonStyles(listOf(btnToday, btnTomorrow, btnInbox), 0)
        }
        btnTomorrow.setOnClickListener {
            selectedDeadline = "tomorrow"
            updateButtonStyles(listOf(btnToday, btnTomorrow, btnInbox), 1)
        }
        btnInbox.setOnClickListener {
            selectedDeadline = "inbox"
            updateButtonStyles(listOf(btnToday, btnTomorrow, btnInbox), 2)
        }

        deadlineRow.addView(btnToday)
        deadlineRow.addView(btnTomorrow)
        deadlineRow.addView(btnInbox)
        card.addView(deadlineRow)

        // Actions Row: Cancel & Save
        val actionRow = LinearLayout(context).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.END
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT
            ).apply {
                topMargin = (6 * density).toInt()
            }
        }

        val cancelBtn = Button(context).apply {
            text = "Cancel"
            setTextColor(Color.parseColor("#8C867A"))
            setBackgroundColor(Color.TRANSPARENT)
            textSize = 13f
            setOnClickListener { onDismiss() }
        }
        actionRow.addView(cancelBtn)

        val saveBtn = Button(context).apply {
            text = "Save Reminder"
            setTextColor(Color.BLACK)
            textSize = 13f
            setTypeface(null, android.graphics.Typeface.BOLD)
            val pVert = (10 * density).toInt()
            val pHoriz = (18 * density).toInt()
            setPadding(pHoriz, pVert, pHoriz, pVert)
            background = GradientDrawable().apply {
                cornerRadius = 12 * density
                setColor(Color.parseColor("#DDF24B"))
            }
            setOnClickListener {
                val title = titleInput.text.toString().trim()
                if (title.isBlank()) {
                    Toast.makeText(context, "Please enter a reminder title", Toast.LENGTH_SHORT).show()
                    return@setOnClickListener
                }

                val taskId = QuickCaptureDatabaseHelper.saveReminder(
                    context,
                    title,
                    selectedDeadline,
                    selectedProfile
                )

                if (taskId != null) {
                    try { scheduleAlarmIfNeeded(context, taskId, title, selectedDeadline) }
                    catch (error: Exception) { Toast.makeText(context, "Saved. Open Remindly to finish scheduling alerts.", Toast.LENGTH_LONG).show() }
                    Toast.makeText(context, "Reminder saved to Remindly", Toast.LENGTH_SHORT).show()
                    onDismiss()
                } else {
                    Toast.makeText(context, "Could not save reminder", Toast.LENGTH_SHORT).show()
                }
            }
        }
        actionRow.addView(saveBtn)
        card.addView(actionRow)

        addView(card, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.WRAP_CONTENT))

        post {
            titleInput.requestFocus()
            val imm = context.getSystemService(Context.INPUT_METHOD_SERVICE) as? InputMethodManager
            imm?.showSoftInput(titleInput, InputMethodManager.SHOW_IMPLICIT)
        }
    }

    private fun scheduleAlarmIfNeeded(context: Context, taskId: String, title: String, deadline: String) {
        if (deadline == "inbox") return
        val am = context.getSystemService(Context.ALARM_SERVICE) as? AlarmManager ?: return
        val format = java.text.SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.US).apply {
            timeZone = TimeZone.getTimeZone("UTC")
        }
        QuickCaptureDatabaseHelper.getDatabase(context).use { db ->
            val settings = mutableMapOf<String, String>()
            db.rawQuery("SELECT key, value FROM app_settings", null).use { values ->
                while (values.moveToNext()) settings[values.getString(0)] = values.getString(1)
            }
            var dueMillis: Long? = null
            db.rawQuery("SELECT due_at_utc FROM tasks WHERE id = ?", arrayOf(taskId)).use { task ->
                if (task.moveToFirst() && !task.isNull(0)) dueMillis = format.parse(task.getString(0))?.time
            }
            db.rawQuery("SELECT id, trigger_at_utc, stage_label FROM reminder_occurrences WHERE task_id = ? AND status = 'pending'", arrayOf(taskId)).use { rows ->
                while (rows.moveToNext()) {
                    val occurrenceId = rows.getString(0)
                    val stage = rows.getString(2)
                    if (stage.startsWith("+") && settings["persistent_followups_enabled"] == "0") continue
                    var triggerMillis = format.parse(rows.getString(1))?.time ?: continue
                    if (stage != "Due" && settings["quiet_hours_enabled"] != "0") {
                        fun clockMinutes(value: String): Int {
                            val parts = value.split(":")
                            return (parts[0].toIntOrNull() ?: 0) * 60 + (parts.getOrNull(1)?.toIntOrNull() ?: 0)
                        }
                        val start = clockMinutes(settings["quiet_hours_start"] ?: "22:00")
                        val end = clockMinutes(settings["quiet_hours_end"] ?: "08:00")
                        val local = Calendar.getInstance().apply { timeInMillis = triggerMillis }
                        val current = local.get(Calendar.HOUR_OF_DAY) * 60 + local.get(Calendar.MINUTE)
                        val quiet = if (start > end) current >= start || current < end else current >= start && current < end
                        if (quiet) {
                            local.set(Calendar.HOUR_OF_DAY, end / 60)
                            local.set(Calendar.MINUTE, end % 60)
                            local.set(Calendar.SECOND, 0)
                            local.set(Calendar.MILLISECOND, 0)
                            if (local.timeInMillis <= triggerMillis) local.add(Calendar.DAY_OF_YEAR, 1)
                            if (dueMillis == null || local.timeInMillis < dueMillis!!) triggerMillis = local.timeInMillis
                        }
                    }
                    val intent = Intent(context, ReminderAlarmReceiver::class.java).apply {
                        putExtra(ReminderAlarmReceiver.EXTRA_TASK_ID, taskId)
                        putExtra(ReminderAlarmReceiver.EXTRA_TASK_TITLE, title)
                        putExtra(ReminderAlarmReceiver.EXTRA_IS_URGENT, selectedProfile == "Important")
                        putExtra("occurrenceId", occurrenceId)
                    }
                    val pending = PendingIntent.getBroadcast(context, occurrenceId.hashCode(), intent,
                        PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE)
                    try {
                        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                            am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, triggerMillis, pending)
                        } else {
                            am.setExact(AlarmManager.RTC_WAKEUP, triggerMillis, pending)
                        }
                    } catch (error: SecurityException) {
                        am.set(AlarmManager.RTC_WAKEUP, triggerMillis, pending)
                    }
                    db.execSQL("UPDATE reminder_occurrences SET status = 'scheduled', os_notification_id = ? WHERE id = ?",
                        arrayOf("native:$occurrenceId", occurrenceId))
                }
            }
        }
    }

    private fun createChoiceButton(context: Context, label: String, isActive: Boolean): TextView {
        val density = context.resources.displayMetrics.density
        return TextView(context).apply {
            text = label
            textSize = 12f
            gravity = Gravity.CENTER
            setTypeface(null, android.graphics.Typeface.BOLD)
            val pVert = (8 * density).toInt()
            val pHoriz = (12 * density).toInt()
            setPadding(pHoriz, pVert, pHoriz, pVert)
            val lp = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f).apply {
                rightMargin = (6 * density).toInt()
            }
            layoutParams = lp
            applyButtonStyle(this, isActive)
        }
    }

    private fun updateButtonStyles(buttons: List<TextView>, activeIdx: Int) {
        buttons.forEachIndexed { i, btn ->
            applyButtonStyle(btn, i == activeIdx)
        }
    }

    private fun applyButtonStyle(tv: TextView, active: Boolean) {
        val density = context.resources.displayMetrics.density
        tv.setTextColor(if (active) Color.BLACK else Color.parseColor("#D1C7B7"))
        tv.background = GradientDrawable().apply {
            cornerRadius = 10 * density
            setColor(if (active) Color.parseColor("#DDF24B") else Color.parseColor("#28241D"))
            setStroke((1 * density).toInt(), if (active) Color.parseColor("#DDF24B") else Color.parseColor("#3A3428"))
        }
    }

    override fun dispatchKeyEvent(event: KeyEvent): Boolean {
        if (event.keyCode == KeyEvent.KEYCODE_BACK && event.action == KeyEvent.ACTION_UP) {
            onDismiss()
            return true
        }
        return super.dispatchKeyEvent(event)
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        if (event.action == MotionEvent.ACTION_OUTSIDE) {
            onDismiss()
            return true
        }
        return super.onTouchEvent(event)
    }
}
