package app.nextme.android

import android.Manifest
import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat
import androidx.core.content.ContextCompat
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.Worker
import androidx.work.WorkerParameters
import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Date
import java.util.Locale
import java.util.concurrent.TimeUnit

/**
 * Water reminders that work with the app closed: at most one notification per hour, 9:00–18:59,
 * only while today's logged water is under the goal. The page tells us the water and goal each time they change.
 */
object WaterReminder {
    private const val PREFS = "nextme_water"
    private const val CHANNEL = "water"
    private const val WORK = "nextme-water"

    private fun prefs(ctx: Context) = ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
    private fun today() = SimpleDateFormat("yyyy-MM-dd", Locale.US).format(Date())

    fun enabled(ctx: Context) = prefs(ctx).getBoolean("on", false)

    fun canNotify(ctx: Context) = Build.VERSION.SDK_INT < 33 ||
        ContextCompat.checkSelfPermission(ctx, Manifest.permission.POST_NOTIFICATIONS) == PackageManager.PERMISSION_GRANTED

    fun setState(ctx: Context, date: String, waterMl: Int, goalMl: Int, lang: String) {
        prefs(ctx).edit().putString("date", date).putInt("water", waterMl).putInt("goal", goalMl).putString("lang", lang).apply()
    }

    fun enable(ctx: Context) {
        prefs(ctx).edit().putBoolean("on", true).apply()
        createChannel(ctx)
        // 15 min is WorkManager's shortest period; the worker sends at most one reminder per clock hour.
        val req = PeriodicWorkRequestBuilder<WaterWorker>(15, TimeUnit.MINUTES).build()
        WorkManager.getInstance(ctx).enqueueUniquePeriodicWork(WORK, ExistingPeriodicWorkPolicy.KEEP, req)
    }

    fun disable(ctx: Context) {
        prefs(ctx).edit().putBoolean("on", false).apply()
        WorkManager.getInstance(ctx).cancelUniqueWork(WORK)
    }

    private fun createChannel(ctx: Context) {
        if (Build.VERSION.SDK_INT < 26) return
        val ro = prefs(ctx).getString("lang", "ro") == "ro"
        val ch = NotificationChannel(CHANNEL, if (ro) "Mementouri apă" else "Water reminders", NotificationManager.IMPORTANCE_DEFAULT)
        ctx.getSystemService(NotificationManager::class.java).createNotificationChannel(ch)
    }

    /** Called by the worker. Returns true when a reminder was shown. */
    fun check(ctx: Context): Boolean {
        val p = prefs(ctx)
        if (!p.getBoolean("on", false) || !canNotify(ctx)) return false
        val now = Calendar.getInstance()
        val h = now.get(Calendar.HOUR_OF_DAY)
        if (h < 9 || h > 18) return false
        val today = today()
        val water = if (p.getString("date", "") == today) p.getInt("water", 0) else 0
        val goal = p.getInt("goal", 2000)
        if (water >= goal) return false
        val stamp = "$today-$h"
        if (p.getString("last", "") == stamp) return false
        p.edit().putString("last", stamp).apply()

        val ro = p.getString("lang", "ro") == "ro"
        val left = String.format(Locale.US, "%.1f", (goal - water) / 1000.0)
        val open = PendingIntent.getActivity(ctx, 0, Intent(ctx, MainActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP),
            PendingIntent.FLAG_IMMUTABLE or PendingIntent.FLAG_UPDATE_CURRENT)
        createChannel(ctx)
        val n = NotificationCompat.Builder(ctx, CHANNEL)
            .setSmallIcon(android.R.drawable.ic_popup_reminder)
            .setContentTitle(if (ro) "Un pahar de apă? 💧" else "Time for a glass of water? 💧")
            .setContentText(if (ro) "Mai ai $left L până la obiectivul de azi." else "$left L to go for today’s goal.")
            .setContentIntent(open)
            .setAutoCancel(true)
            .build()
        return runCatching { NotificationManagerCompat.from(ctx).notify(1001, n); true }.getOrDefault(false)
    }
}

class WaterWorker(ctx: Context, params: WorkerParameters) : Worker(ctx, params) {
    override fun doWork(): Result { WaterReminder.check(applicationContext); return Result.success() }
}
