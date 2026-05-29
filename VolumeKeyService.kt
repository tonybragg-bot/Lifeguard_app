package com.lifeguard.emergency

import android.accessibilityservice.AccessibilityService
import android.content.Intent
import android.view.KeyEvent
import android.view.accessibility.AccessibilityEvent

/**
 * Accessibility service that runs behind the lock screen and detects three
 * rapid volume presses to fire the SOS sequence. Volume keys are the most
 * reliable trigger on modern Android (power key is restricted).
 */
class VolumeKeyService : AccessibilityService() {

    private val pressTimes = ArrayDeque<Long>()

    override fun onKeyEvent(event: KeyEvent): Boolean {
        if (event.action != KeyEvent.ACTION_DOWN) return super.onKeyEvent(event)
        if (event.keyCode != KeyEvent.KEYCODE_VOLUME_UP &&
            event.keyCode != KeyEvent.KEYCODE_VOLUME_DOWN) return super.onKeyEvent(event)

        val settings = SecureStore.loadSettings(this)
        if (!settings.triggerEnabled) return super.onKeyEvent(event)

        val now = System.currentTimeMillis()
        while (pressTimes.isNotEmpty() && now - pressTimes.first() > settings.sensitivityMs) {
            pressTimes.removeFirst()
        }
        pressTimes.addLast(now)

        if (pressTimes.size >= 3) {
            pressTimes.clear()
            fireSos()
            return true // consume so volume UI doesn't show
        }
        return super.onKeyEvent(event)
    }

    private fun fireSos() {
        val i = Intent(this, EmergencyActivity::class.java).apply {
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
            putExtra(EmergencyActivity.EXTRA_AUTO_SOS, true)
        }
        startActivity(i)
    }

    override fun onAccessibilityEvent(event: AccessibilityEvent?) { /* not used */ }
    override fun onInterrupt() {}
}
