package app.nextme.android

import android.content.Context
import androidx.work.Constraints
import androidx.work.CoroutineWorker
import androidx.work.ExistingPeriodicWorkPolicy
import androidx.work.NetworkType
import androidx.work.PeriodicWorkRequestBuilder
import androidx.work.WorkManager
import androidx.work.WorkerParameters
import java.util.concurrent.TimeUnit

/** Hourly background sync. Needs the Health Connect "read in background" permission; otherwise sync runs when the app opens. */
class SyncWorker(ctx: Context, params: WorkerParameters) : CoroutineWorker(ctx, params) {
    override suspend fun doWork(): Result {
        val r = HealthSync.syncNow(applicationContext)
        return if (r.startsWith("error:")) Result.retry() else Result.success()
    }

    companion object {
        fun schedule(ctx: Context) {
            val req = PeriodicWorkRequestBuilder<SyncWorker>(1, TimeUnit.HOURS)
                .setConstraints(Constraints.Builder().setRequiredNetworkType(NetworkType.CONNECTED).build())
                .build()
            WorkManager.getInstance(ctx).enqueueUniquePeriodicWork("nextme-sync", ExistingPeriodicWorkPolicy.KEEP, req)
        }

        fun cancel(ctx: Context) = WorkManager.getInstance(ctx).cancelUniqueWork("nextme-sync")
    }
}
