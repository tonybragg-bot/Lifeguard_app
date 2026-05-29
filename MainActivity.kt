package com.lifeguard.emergency

import android.Manifest
import android.content.Intent
import android.os.Bundle
import android.provider.Settings
import android.widget.*
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import java.util.concurrent.Executors

/**
 * Owner-facing app: request permissions, enable the accessibility trigger,
 * edit the encrypted medical profile and contacts, toggle features.
 * Editing is gated behind a biometric prompt when enabled.
 */
class MainActivity : AppCompatActivity() {

    private val perms = arrayOf(
        Manifest.permission.SEND_SMS, Manifest.permission.CALL_PHONE,
        Manifest.permission.READ_CONTACTS, Manifest.permission.ACCESS_FINE_LOCATION,
        Manifest.permission.CAMERA
    )

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        ActivityCompat.requestPermissions(this, perms, 1)

        val pad = (20 * resources.displayMetrics.density).toInt()
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL; setPadding(pad, pad, pad, pad)
        }
        root.addView(TextView(this).apply { text = "LifeGuard Emergency"; textSize = 24f })
        root.addView(TextView(this).apply {
            text = "Lock-screen medical & SOS — encrypted on-device, no server."
            textSize = 13f; setPadding(0, 8, 0, 24)
        })

        root.addView(Button(this).apply {
            text = "Enable triple-press trigger (Accessibility)"
            setOnClickListener { startActivity(Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS)) }
        })
        root.addView(Button(this).apply {
            text = "Allow display over lock screen"
            setOnClickListener { startActivity(Intent(Settings.ACTION_MANAGE_OVERLAY_PERMISSION)) }
        })
        root.addView(Button(this).apply {
            text = "Edit medical info (biometric)"
            setOnClickListener { requireBiometric { Toast.makeText(this@MainActivity, "Open edit form", Toast.LENGTH_SHORT).show() } }
        })
        root.addView(Button(this).apply {
            text = "Preview emergency screen"
            setOnClickListener { startActivity(Intent(this@MainActivity, EmergencyActivity::class.java)) }
        })
        root.addView(TextView(this).apply {
            text = "\n\u00A9 2026 LifeGuard. All rights reserved."; textSize = 11f
        })
        setContentView(ScrollView(this).apply { addView(root) })

        if (!SecureStore.isSetupComplete(this)) {
            // seed defaults on first run; a full wizard mirrors the web prototype
            SecureStore.saveSettings(this, AppSettings())
            SecureStore.markSetupComplete(this)
        }
    }

    private fun requireBiometric(onSuccess: () -> Unit) {
        val settings = SecureStore.loadSettings(this)
        if (!settings.biometricLock) { onSuccess(); return }
        val prompt = BiometricPrompt(this, Executors.newSingleThreadExecutor(),
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(r: BiometricPrompt.AuthenticationResult) {
                    runOnUiThread { onSuccess() }
                }
            })
        prompt.authenticate(
            BiometricPrompt.PromptInfo.Builder()
                .setTitle("Unlock to edit medical info")
                .setNegativeButtonText("Cancel").build()
        )
    }
}
