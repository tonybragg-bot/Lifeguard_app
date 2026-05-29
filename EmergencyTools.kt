package com.lifeguard.emergency

import android.Manifest
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.hardware.camera2.CameraManager
import android.media.AudioManager
import android.media.ToneGenerator
import android.net.ConnectivityManager
import android.net.Uri
import android.os.Looper
import android.telephony.SmsManager
import androidx.core.content.ContextCompat
import com.google.android.gms.location.LocationServices
import com.google.android.gms.location.LocationRequest
import com.google.android.gms.location.Priority
import com.google.android.gms.location.LocationCallback
import com.google.android.gms.location.LocationResult

/**
 * All on-device emergency actions: SMS (with offline queue), live GPS,
 * auto-call, loud alarm and flashlight SOS strobe.
 */
object EmergencyTools {

    fun hasSignal(ctx: Context): Boolean {
        val cm = ctx.getSystemService(Context.CONNECTIVITY_SERVICE) as ConnectivityManager
        return cm.activeNetwork != null
    }

    /** Sends an SMS now, or queues it for auto-send when signal returns. */
    fun sendOrQueueSms(ctx: Context, to: String, body: String) {
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.SEND_SMS)
            != PackageManager.PERMISSION_GRANTED) return
        if (!hasSignal(ctx)) { SecureStore.queue(ctx, to, body); return }
        try {
            val sms = ctx.getSystemService(SmsManager::class.java)
            val parts = sms.divideMessage(body)
            sms.sendMultipartTextMessage(to, null, parts, null, null)
        } catch (e: Exception) {
            SecureStore.queue(ctx, to, body)
        }
    }

    /** Flush queued messages — call from a connectivity BroadcastReceiver. */
    fun flushOutbox(ctx: Context) {
        if (!hasSignal(ctx)) return
        SecureStore.drainOutbox(ctx).forEach { (to, body) -> sendOrQueueSms(ctx, to, body) }
    }

    fun autoCall(ctx: Context, phone: String) {
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.CALL_PHONE)
            != PackageManager.PERMISSION_GRANTED) return
        val i = Intent(Intent.ACTION_CALL, Uri.parse("tel:$phone"))
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        ctx.startActivity(i)
    }

    /** One-shot fused location → Google Maps URL passed to callback. */
    fun getLocationUrl(ctx: Context, cb: (String?) -> Unit) {
        if (ContextCompat.checkSelfPermission(ctx, Manifest.permission.ACCESS_FINE_LOCATION)
            != PackageManager.PERMISSION_GRANTED) { cb(null); return }
        val client = LocationServices.getFusedLocationProviderClient(ctx)
        val req = LocationRequest.Builder(Priority.PRIORITY_HIGH_ACCURACY, 0).setMaxUpdates(1).build()
        client.requestLocationUpdates(req, object : LocationCallback() {
            override fun onLocationResult(r: LocationResult) {
                val l = r.lastLocation
                cb(l?.let { "https://maps.google.com/?q=${it.latitude},${it.longitude}" })
                client.removeLocationUpdates(this)
            }
        }, Looper.getMainLooper())
    }

    // --- Loud alarm / siren ---
    private var tone: ToneGenerator? = null
    fun startAlarm() {
        stopAlarm()
        tone = ToneGenerator(AudioManager.STREAM_ALARM, 100).also {
            it.startTone(ToneGenerator.TONE_CDMA_ALERT_CALL_GUARD, 8000)
        }
    }
    fun stopAlarm() { tone?.release(); tone = null }

    // --- Flashlight SOS strobe ---
    @Volatile private var strobing = false
    fun startStrobe(ctx: Context) {
        val cm = ctx.getSystemService(Context.CAMERA_SERVICE) as CameraManager
        val id = cm.cameraIdList.firstOrNull() ?: return
        strobing = true
        Thread {
            var on = false
            val end = System.currentTimeMillis() + 10_000
            while (strobing && System.currentTimeMillis() < end) {
                try { cm.setTorchMode(id, !on); on = !on; Thread.sleep(250) } catch (e: Exception) { break }
            }
            try { cm.setTorchMode(id, false) } catch (e: Exception) {}
        }.start()
    }
    fun stopStrobe() { strobing = false }
}
