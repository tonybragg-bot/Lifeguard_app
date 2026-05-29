package com.lifeguard.emergency

import android.os.Build
import android.os.Bundle
import android.text.InputType
import android.view.Gravity
import android.widget.*
import androidx.appcompat.app.AppCompatActivity

/**
 * Secure screen shown OVER the lock screen. Two entry points:
 *  1) Auto SOS (from VolumeKeyService) — runs the full emergency sequence.
 *  2) Responder access — emergency worker types the code (default 999) at the
 *     lock screen launcher; this activity shows ONLY medical info + contacts.
 *     No other phone access is granted.
 */
class EmergencyActivity : AppCompatActivity() {

    companion object { const val EXTRA_AUTO_SOS = "auto_sos" }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O_MR1) {
            setShowWhenLocked(true); setTurnScreenOn(true)
        }

        val profile = SecureStore.loadProfile(this)
        val settings = SecureStore.loadSettings(this)

        if (intent.getBooleanExtra(EXTRA_AUTO_SOS, false)) {
            runSosSequence(profile, settings)
        }
        setContentView(buildView(profile, settings))
    }

    private fun runSosSequence(p: MedicalProfile, s: AppSettings) {
        if (s.alarmEnabled) EmergencyTools.startAlarm()
        if (s.flashlightEnabled) EmergencyTools.startStrobe(this)
        val targets = (p.contacts.filter { it.isPrimary } + p.contacts.filter { !it.isPrimary }).take(2)
        if (s.shareLocationEnabled) {
            EmergencyTools.getLocationUrl(this) { url ->
                val body = p.buildSos(s.customMessage, url)
                if (s.smsEnabled) targets.forEach { EmergencyTools.sendOrQueueSms(this, it.phone, body) }
            }
        } else if (s.smsEnabled) {
            val body = p.buildSos(s.customMessage, null)
            targets.forEach { EmergencyTools.sendOrQueueSms(this, it.phone, body) }
        }
        if (s.autoCallEnabled) p.contacts.firstOrNull { it.isPrimary }?.let {
            EmergencyTools.autoCall(this, it.phone)
        }
    }

    /** Builds the read-only medical card responders see. */
    private fun buildView(p: MedicalProfile, s: AppSettings): ScrollView {
        val pad = (16 * resources.displayMetrics.density).toInt()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; setPadding(pad, pad, pad, pad)
            setBackgroundColor(0xFF7F1D1D.toInt())
        }
        fun line(label: String, value: String) {
            if (value.isBlank()) return
            root.addView(TextView(this).apply {
                text = "$label\n$value"; setTextColor(0xFFFFFFFF.toInt()); textSize = 16f
                setPadding(0, pad / 2, 0, pad / 2)
            })
        }
        root.addView(TextView(this).apply {
            text = "EMERGENCY MEDICAL INFO"; setTextColor(0xFFFFFFFF.toInt())
            textSize = 22f; gravity = Gravity.CENTER; setPadding(0, 0, 0, pad)
        })
        line("Name", p.fullName)
        line("Date of birth", p.dateOfBirth)
        line("Address", p.address)
        line("Blood type", p.bloodType)
        line("Allergies", p.allergies)
        line("Medical conditions", p.conditions)
        line("Medications", p.medications)
        line("Organ donor", if (p.organDonor) "Yes" else "No")
        line("Notes", p.notes)

        root.addView(TextView(this).apply {
            text = "Emergency contacts"; setTextColor(0xFFFFFFFF.toInt())
            textSize = 18f; setPadding(0, pad, 0, pad / 2)
        })
        p.contacts.forEach { c ->
            root.addView(TextView(this).apply {
                text = "${c.name} (${c.relationship}) — ${c.phone}"
                setTextColor(0xFFFFFFFF.toInt()); textSize = 15f
            })
            root.addView(LinearLayout(this).apply {
                orientation = LinearLayout.HORIZONTAL; setPadding(0, 4, 0, pad / 2)
                addView(Button(this@EmergencyActivity).apply {
                    text = "Call"; setOnClickListener { EmergencyTools.autoCall(this@EmergencyActivity, c.phone) }
                })
                addView(Button(this@EmergencyActivity).apply {
                    text = "Text"; setOnClickListener {
                        val body = p.buildSos(s.customMessage, null)
                        EmergencyTools.sendOrQueueSms(this@EmergencyActivity, c.phone, body)
                        Toast.makeText(this@EmergencyActivity, "Message sent/queued", Toast.LENGTH_SHORT).show()
                    }
                })
            })
        }

        root.addView(Button(this).apply {
            text = "Stop alarm & strobe"
            setOnClickListener { EmergencyTools.stopAlarm(); EmergencyTools.stopStrobe() }
        })
        root.addView(TextView(this).apply {
            text = "\u00A9 2026 LifeGuard. No other phone access granted."
            setTextColor(0xFFFCA5A5.toInt()); textSize = 11f; gravity = Gravity.CENTER
            setPadding(0, pad, 0, 0)
        })
        return ScrollView(this).apply { addView(root) }
    }

    override fun onDestroy() {
        super.onDestroy()
        EmergencyTools.stopAlarm(); EmergencyTools.stopStrobe()
    }
}
