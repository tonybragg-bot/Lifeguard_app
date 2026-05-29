package com.lifeguard.emergency

import org.json.JSONArray
import org.json.JSONObject

/** Single emergency contact, imported from the phone address book. */
data class EmergencyContact(
    val name: String,
    val relationship: String,
    val phone: String,
    val isPrimary: Boolean
) {
    fun toJson(): JSONObject = JSONObject().apply {
        put("name", name); put("relationship", relationship)
        put("phone", phone); put("isPrimary", isPrimary)
    }
    companion object {
        fun fromJson(o: JSONObject) = EmergencyContact(
            o.optString("name"), o.optString("relationship"),
            o.optString("phone"), o.optBoolean("isPrimary")
        )
    }
}

/** The user's medical/ICE profile. Stored AES-256 encrypted on device only. */
data class MedicalProfile(
    var fullName: String = "",
    var dateOfBirth: String = "",
    var address: String = "",
    var bloodType: String = "",
    var conditions: String = "",
    var allergies: String = "",
    var medications: String = "",
    var organDonor: Boolean = false,
    var notes: String = "",
    var contacts: MutableList<EmergencyContact> = mutableListOf()
) {
    fun toJson(): String = JSONObject().apply {
        put("fullName", fullName); put("dateOfBirth", dateOfBirth)
        put("address", address); put("bloodType", bloodType)
        put("conditions", conditions); put("allergies", allergies)
        put("medications", medications); put("organDonor", organDonor)
        put("notes", notes)
        put("contacts", JSONArray().apply { contacts.forEach { put(it.toJson()) } })
    }.toString()

    /** Builds the SOS message body, optionally appending a live Google Maps link. */
    fun buildSos(custom: String, locationUrl: String?): String {
        val parts = mutableListOf("EMERGENCY: $fullName needs help.", custom)
        if (bloodType.isNotBlank()) parts.add("Blood Type: $bloodType.")
        if (conditions.isNotBlank()) parts.add("Conditions: $conditions.")
        if (allergies.isNotBlank()) parts.add("Allergies: $allergies.")
        parts.add(if (locationUrl != null) "Location: $locationUrl" else "Location: unavailable")
        return parts.filter { it.isNotBlank() }.joinToString(" ")
    }

    companion object {
        fun fromJson(s: String?): MedicalProfile {
            if (s.isNullOrBlank()) return MedicalProfile()
            val o = JSONObject(s)
            val list = mutableListOf<EmergencyContact>()
            val arr = o.optJSONArray("contacts") ?: JSONArray()
            for (i in 0 until arr.length()) list.add(EmergencyContact.fromJson(arr.getJSONObject(i)))
            return MedicalProfile(
                o.optString("fullName"), o.optString("dateOfBirth"), o.optString("address"),
                o.optString("bloodType"), o.optString("conditions"), o.optString("allergies"),
                o.optString("medications"), o.optBoolean("organDonor"), o.optString("notes"), list
            )
        }
    }
}

/** Feature toggles & codes — user editable, persisted encrypted. */
data class AppSettings(
    var pin: String = "1234",
    var emergencyCode: String = "999",
    var customMessage: String = "EMERGENCY: I need help.",
    var triggerEnabled: Boolean = true,
    var smsEnabled: Boolean = true,
    var autoCallEnabled: Boolean = true,
    var alarmEnabled: Boolean = true,
    var flashlightEnabled: Boolean = true,
    var shareLocationEnabled: Boolean = true,
    var sensitivityMs: Long = 1500,
    var biometricLock: Boolean = true
)
