package app.nextme.android

import android.content.Context
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.permission.HealthPermission
import androidx.health.connect.client.records.HeartRateRecord
import androidx.health.connect.client.records.RestingHeartRateRecord
import androidx.health.connect.client.records.StepsRecord
import androidx.health.connect.client.request.AggregateRequest
import androidx.health.connect.client.time.TimeRangeFilter
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import org.json.JSONObject
import java.net.HttpURLConnection
import java.net.URL
import java.time.Instant
import java.time.LocalDate
import java.time.ZoneId

/** Reads daily totals from Health Connect and sends them to the user's private NextMe sync link. */
object HealthSync {
    const val BACKGROUND = "android.permission.health.READ_HEALTH_DATA_IN_BACKGROUND"

    val PERMISSIONS: Set<String> = setOf(
        HealthPermission.getReadPermission(StepsRecord::class),
        HealthPermission.getReadPermission(HeartRateRecord::class),
        HealthPermission.getReadPermission(RestingHeartRateRecord::class),
        BACKGROUND,
    )
    private val STEPS = HealthPermission.getReadPermission(StepsRecord::class)

    private fun prefs(ctx: Context) = ctx.getSharedPreferences("nextme", Context.MODE_PRIVATE)
    fun syncUrl(ctx: Context): String? = prefs(ctx).getString("sync_url", null)
    fun setSyncUrl(ctx: Context, url: String?) = prefs(ctx).edit().apply { if (url == null) remove("sync_url") else putString("sync_url", url) }.apply()
    fun lastResult(ctx: Context): String = prefs(ctx).getString("last_result", "") ?: ""
    fun lastAt(ctx: Context): Long = prefs(ctx).getLong("last_at", 0)
    private fun record(ctx: Context, result: String) = prefs(ctx).edit().putString("last_result", result).putLong("last_at", System.currentTimeMillis()).apply()

    /** 0 = available, 1 = not installed / unsupported, 2 = Health Connect needs an update. */
    fun availability(ctx: Context): Int = when (HealthConnectClient.getSdkStatus(ctx)) {
        HealthConnectClient.SDK_AVAILABLE -> 0
        HealthConnectClient.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED -> 2
        else -> 1
    }

    suspend fun granted(ctx: Context): Set<String> =
        if (availability(ctx) != 0) emptySet() else HealthConnectClient.getOrCreate(ctx).permissionController.getGrantedPermissions()

    /** Sends today and yesterday. Returns "ok", "no_link", "no_permission", "unavailable", "revoked" or "error:<msg>". */
    suspend fun syncNow(ctx: Context): String = withContext(Dispatchers.IO) {
        val url = syncUrl(ctx) ?: return@withContext "no_link"
        if (availability(ctx) != 0) return@withContext "unavailable"
        val client = HealthConnectClient.getOrCreate(ctx)
        val granted = client.permissionController.getGrantedPermissions()
        if (STEPS !in granted) return@withContext "no_permission".also { record(ctx, it) }
        val zone = ZoneId.systemDefault()
        val today = LocalDate.now(zone)
        var result = "ok"
        for (day in listOf(today.minusDays(1), today)) {
            try {
                val body = readDay(client, granted, day, zone)
                val code = post(url, body)
                if (code == 401) { setSyncUrl(ctx, null); result = "revoked"; break }
                if (code !in 200..299) result = "error:http_$code"
            } catch (e: SecurityException) {
                result = "no_permission"
            } catch (e: Exception) {
                result = "error:" + (e.message ?: e.javaClass.simpleName).take(80)
            }
        }
        record(ctx, result)
        result
    }

    private suspend fun readDay(client: HealthConnectClient, granted: Set<String>, day: LocalDate, zone: ZoneId): JSONObject {
        val start = day.atStartOfDay(zone).toInstant()
        val end = minOf(day.plusDays(1).atStartOfDay(zone).toInstant(), Instant.now())
        val range = TimeRangeFilter.between(start, end)
        val out = JSONObject().put("date", day.toString()).put("source", "health_connect")
        // Aggregates are de-duplicated by Health Connect when both phone and watch record steps.
        val steps = client.aggregate(AggregateRequest(setOf(StepsRecord.COUNT_TOTAL), range))[StepsRecord.COUNT_TOTAL]
        out.put("steps", steps ?: 0L)
        if (HealthPermission.getReadPermission(HeartRateRecord::class) in granted) {
            val hr = client.aggregate(AggregateRequest(setOf(HeartRateRecord.BPM_AVG, HeartRateRecord.BPM_MAX), range))
            hr[HeartRateRecord.BPM_AVG]?.let { out.put("hr_avg", it) }
            hr[HeartRateRecord.BPM_MAX]?.let { out.put("hr_max", it) }
        }
        if (HealthPermission.getReadPermission(RestingHeartRateRecord::class) in granted) {
            client.aggregate(AggregateRequest(setOf(RestingHeartRateRecord.BPM_AVG), range))[RestingHeartRateRecord.BPM_AVG]
                ?.let { out.put("resting_hr", it) }
        }
        return out
    }

    private fun post(url: String, body: JSONObject): Int {
        val c = URL(url).openConnection() as HttpURLConnection
        return try {
            c.requestMethod = "POST"
            c.connectTimeout = 15000
            c.readTimeout = 15000
            c.doOutput = true
            c.setRequestProperty("content-type", "application/json; charset=utf-8")
            c.outputStream.use { it.write(body.toString().toByteArray()) }
            c.responseCode
        } finally {
            c.disconnect()
        }
    }
}
