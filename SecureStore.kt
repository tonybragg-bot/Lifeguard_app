package com.lifeguard.emergency

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import org.json.JSONArray
import org.json.JSONObject

/**
 * AES-256 encrypted, on-device only storage. No server, no network.
 * Backed by Android Keystore via EncryptedSharedPreferences.
 */
object SecureStore {
    private const val FILE = "lifeguard_secure_store"
    private const val K_PROFILE = "profile"
    private const val K_SETTINGS = "settings"
    private const val K_OUTBOX = "outbox"
    private const val K_SETUP = "setupComplete"

    private fun prefs(ctx: Context): SharedPreferences {
        val key = MasterKey.Builder(ctx)
            .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
            .build()
        return EncryptedSharedPreferences.create(
            ctx, FILE, key,
            EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
            EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
        )
    }

    fun loadProfile(ctx: Context): MedicalProfile =
        MedicalProfile.fromJson(prefs(ctx).getString(K_PROFILE, null))

    fun saveProfile(ctx: Context, p: MedicalProfile) =
        prefs(ctx).edit().putString(K_PROFILE, p.toJson()).apply()

    fun loadSettings(ctx: Context): AppSettings {
        val s = prefs(ctx).getString(K_SETTINGS, null) ?: return AppSettings()
        val o = JSONObject(s)
        return AppSettings(
            o.optString("pin", "1234"), o.optString("emergencyCode", "999"),
            o.optString("customMessage", "EMERGENCY: I need help."),
            o.optBoolean("triggerEnabled", true), o.optBoolean("smsEnabled", true),
            o.optBoolean("autoCallEnabled", true), o.optBoolean("alarmEnabled", true),
            o.optBoolean("flashlightEnabled", true), o.optBoolean("shareLocationEnabled", true),
            o.optLong("sensitivityMs", 1500), o.optBoolean("biometricLock", true)
        )
    }

    fun saveSettings(ctx: Context, s: AppSettings) {
        val o = JSONObject().apply {
            put("pin", s.pin); put("emergencyCode", s.emergencyCode)
            put("customMessage", s.customMessage); put("triggerEnabled", s.triggerEnabled)
            put("smsEnabled", s.smsEnabled); put("autoCallEnabled", s.autoCallEnabled)
            put("alarmEnabled", s.alarmEnabled); put("flashlightEnabled", s.flashlightEnabled)
            put("shareLocationEnabled", s.shareLocationEnabled)
            put("sensitivityMs", s.sensitivityMs); put("biometricLock", s.biometricLock)
        }
        prefs(ctx).edit().putString(K_SETTINGS, o.toString()).apply()
    }

    fun isSetupComplete(ctx: Context) = prefs(ctx).getBoolean(K_SETUP, false)
    fun markSetupComplete(ctx: Context) = prefs(ctx).edit().putBoolean(K_SETUP, true).apply()

    // --- Offline outbox: messages queued when there is no signal ---
    fun queue(ctx: Context, to: String, body: String) {
        val arr = JSONArray(prefs(ctx).getString(K_OUTBOX, "[]"))
        arr.put(JSONObject().apply { put("to", to); put("body", body); put("ts", System.currentTimeMillis()) })
        prefs(ctx).edit().putString(K_OUTBOX, arr.toString()).apply()
    }

    fun drainOutbox(ctx: Context): List<Pair<String, String>> {
        val arr = JSONArray(prefs(ctx).getString(K_OUTBOX, "[]"))
        val out = ArrayList<Pair<String, String>>()
        for (i in 0 until arr.length()) {
            val o = arr.getJSONObject(i); out.add(o.getString("to") to o.getString("body"))
        }
        prefs(ctx).edit().putString(K_OUTBOX, "[]").apply()
        return out
    }
}
