package com.remindly.app.overlay

import android.content.Context
import android.content.res.Configuration
import android.graphics.Color
import android.graphics.drawable.GradientDrawable
import android.view.Gravity
import android.view.MotionEvent
import android.view.View
import android.view.ViewConfiguration
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.TextView
import kotlin.math.roundToInt

class FloatingCaptureView(
    context: Context,
    private val windowManager: WindowManager,
    private val onTap: () -> Unit
) : FrameLayout(context) {
    private val density = resources.displayMetrics.density
    private val bubbleSize = dp(52)
    private val tabWidth = dp(12)
    private val preferences = context.getSharedPreferences("remindly_overlay_position", Context.MODE_PRIVATE)
    private var dockLeft = preferences.getBoolean("dock_left", false)
    private val touchSlop = ViewConfiguration.get(context).scaledTouchSlop
    private var initialY = 0
    private var initialTouchX = 0f
    private var initialTouchY = 0f
    private var dragging = false

    val layoutParams = WindowManager.LayoutParams().apply {
        type = WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY
        flags = WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE or WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS
        format = android.graphics.PixelFormat.TRANSLUCENT
        gravity = Gravity.TOP or Gravity.START
        width = tabWidth
        height = bubbleSize
        x = if (dockLeft) 0 else resources.displayMetrics.widthPixels - tabWidth
        y = dp(preferences.getFloat("dock_y_dp", 300f).roundToInt())
    }

    private val brandMark = TextView(context).apply {
        text = "O"
        setTextColor(Color.parseColor("#DDF24B"))
        textSize = 20f
        gravity = Gravity.CENTER
        setTypeface(null, android.graphics.Typeface.BOLD)
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }
    private val edgeMark = View(context).apply {
        background = GradientDrawable().apply {
            cornerRadius = dp(2).toFloat()
            setColor(Color.parseColor("#DDF24B"))
        }
        importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    }

    init {
        isClickable = true
        contentDescription = "Remindly quick capture. Tap to open; drag to reposition."
        addView(brandMark, LayoutParams(LayoutParams.MATCH_PARENT, LayoutParams.MATCH_PARENT))
        addView(edgeMark, LayoutParams(dp(3), dp(28), Gravity.CENTER))
        showDockedAppearance()
    }

    private fun dp(value: Int) = (value * density).roundToInt()

    private fun clampedY(value: Int): Int {
        // Keep the handle clear of status and navigation gesture areas.
        val bottom = (resources.displayMetrics.heightPixels - bubbleSize - dp(48)).coerceAtLeast(dp(24))
        return value.coerceIn(dp(24), bottom)
    }

    private fun showDockedAppearance() {
        layoutParams.width = tabWidth
        background = GradientDrawable().apply {
            cornerRadius = dp(6).toFloat()
            setColor(Color.parseColor("#1E1B15"))
        }
        brandMark.visibility = View.GONE
        edgeMark.visibility = View.VISIBLE
        alpha = 0.45f
        elevation = 0f
    }

    private fun showDraggingAppearance() {
        layoutParams.width = bubbleSize
        background = GradientDrawable().apply {
            shape = GradientDrawable.OVAL
            setColor(Color.parseColor("#1E1B15"))
            setStroke(dp(2), Color.parseColor("#DDF24B"))
        }
        brandMark.visibility = View.VISIBLE
        edgeMark.visibility = View.GONE
        alpha = 1f
        elevation = dp(8).toFloat()
    }

    private fun updateWindow() {
        if (!isAttachedToWindow) return
        try { windowManager.updateViewLayout(this, layoutParams) }
        catch (_: IllegalArgumentException) { /* Service removed the view during a gesture. */ }
    }

    private fun dockToEdge(savePosition: Boolean) {
        showDockedAppearance()
        layoutParams.x = if (dockLeft) 0 else (resources.displayMetrics.widthPixels - tabWidth).coerceAtLeast(0)
        layoutParams.y = clampedY(layoutParams.y)
        updateWindow()
        if (savePosition) {
            preferences.edit().putBoolean("dock_left", dockLeft)
                .putFloat("dock_y_dp", layoutParams.y / density).apply()
        }
    }

    override fun onAttachedToWindow() {
        super.onAttachedToWindow()
        dockToEdge(false)
    }

    override fun onConfigurationChanged(newConfig: Configuration) {
        super.onConfigurationChanged(newConfig)
        post { dockToEdge(false) }
    }

    override fun performClick(): Boolean {
        super.performClick()
        onTap()
        return true
    }

    override fun onTouchEvent(event: MotionEvent): Boolean {
        when (event.actionMasked) {
            MotionEvent.ACTION_DOWN -> {
                initialY = layoutParams.y
                initialTouchX = event.rawX
                initialTouchY = event.rawY
                dragging = false
                alpha = 1f
            }
            MotionEvent.ACTION_MOVE -> {
                val dx = event.rawX - initialTouchX
                val dy = event.rawY - initialTouchY
                if (!dragging && Math.hypot(dx.toDouble(), dy.toDouble()) > touchSlop) {
                    dragging = true
                    showDraggingAppearance()
                }
                if (dragging) {
                    layoutParams.x = (event.rawX - bubbleSize / 2f).roundToInt()
                        .coerceIn(0, (resources.displayMetrics.widthPixels - bubbleSize).coerceAtLeast(0))
                    layoutParams.y = clampedY(initialY + dy.roundToInt())
                    updateWindow()
                }
            }
            MotionEvent.ACTION_UP -> {
                if (dragging) {
                    dockLeft = layoutParams.x + bubbleSize / 2 < resources.displayMetrics.widthPixels / 2
                    dockToEdge(true)
                } else {
                    alpha = 0.45f
                    performClick()
                }
                dragging = false
            }
            MotionEvent.ACTION_CANCEL -> {
                dockToEdge(false)
                dragging = false
            }
            else -> return super.onTouchEvent(event)
        }
        return true
    }
}
