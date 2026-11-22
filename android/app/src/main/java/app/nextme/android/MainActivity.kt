package app.nextme.android

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.net.Uri
import android.os.Bundle
import android.provider.MediaStore
import android.webkit.CookieManager
import android.webkit.GeolocationPermissions
import android.webkit.JavascriptInterface
import android.webkit.ValueCallback
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.ComponentActivity
import androidx.activity.OnBackPressedCallback
import androidx.activity.result.contract.ActivityResultContracts
import androidx.core.content.ContextCompat
import androidx.core.content.FileProvider
import androidx.health.connect.client.HealthConnectClient
import androidx.health.connect.client.PermissionController
import androidx.lifecycle.lifecycleScope
import kotlinx.coroutines.launch
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

/** NextMe for Android: the NextMe web app plus a Health Connect bridge exposed to the page as window.NextMeAndroid. */
class MainActivity : ComponentActivity() {
    private lateinit var web: WebView
    private val site = Uri.parse(BuildConfig.SITE_URL)

    private var fileCallback: ValueCallback<Array<Uri>>? = null
    private var photoUri: Uri? = null
    private var geoCallback: Pair<String, GeolocationPermissions.Callback>? = null

    private val healthPermissions = registerForActivityResult(PermissionController.createRequestPermissionResultContract()) { _ ->
        afterPermissions()
    }

    private val pickFile = registerForActivityResult(ActivityResultContracts.StartActivityForResult()) { res ->
        val data = res.data
        val uris: Array<Uri>? = when {
            res.resultCode != RESULT_OK -> null
            data?.data != null -> arrayOf(data.data!!)
            data?.clipData != null -> Array(data.clipData!!.itemCount) { data.clipData!!.getItemAt(it).uri }
            photoUri != null -> arrayOf(photoUri!!) // camera wrote to our file
            else -> null
        }
        fileCallback?.onReceiveValue(uris)
        fileCallback = null
    }

    private val notifyPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
        if (ok) WaterReminder.enable(this) else WaterReminder.disable(this)
        notifyWater()
    }

    private fun notifyWater() {
        val on = WaterReminder.enabled(this) && WaterReminder.canNotify(this)
        runOnUiThread { web.evaluateJavascript("window.dispatchEvent(new CustomEvent('nextme-water',{detail:{on:$on}}))", null) }
    }

    private val locationPermission = registerForActivityResult(ActivityResultContracts.RequestPermission()) { ok ->
        geoCallback?.let { (origin, cb) -> cb.invoke(origin, ok, false) }
        geoCallback = null
    }

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        web = WebView(this)
        setContentView(web)
        CookieManager.getInstance().setAcceptCookie(true)
        web.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            databaseEnabled = true
            setGeolocationEnabled(true)
            userAgentString = "$userAgentString NextMeAndroid/${BuildConfig.VERSION_NAME}"
        }
        web.setBackgroundColor(0xFF000000.toInt())
        web.addJavascriptInterface(Bridge(), "NextMeAndroid")
        web.webViewClient = object : WebViewClient() {
            // Only NextMe pages load inside the app; every other link opens in the browser.
            override fun shouldOverrideUrlLoading(view: WebView, req: WebResourceRequest): Boolean {
                if (req.url.host == site.host) return false
                runCatching { startActivity(Intent(Intent.ACTION_VIEW, req.url)) }
                return true
            }
        }
        web.webChromeClient = object : WebChromeClient() {
            override fun onShowFileChooser(view: WebView, cb: ValueCallback<Array<Uri>>, params: FileChooserParams): Boolean {
                fileCallback?.onReceiveValue(null)
                fileCallback = cb
                photoUri = null
                val pick = params.createIntent()
                val extras = mutableListOf<Intent>()
                runCatching {
                    val dir = File(cacheDir, "photos").apply { mkdirs() }
                    val f = File.createTempFile("photo", ".jpg", dir)
                    photoUri = FileProvider.getUriForFile(this@MainActivity, "$packageName.files", f)
                    extras += Intent(MediaStore.ACTION_IMAGE_CAPTURE).putExtra(MediaStore.EXTRA_OUTPUT, photoUri)
                        .addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION)
                }
                val chooser = if (params.isCaptureEnabled && extras.isNotEmpty()) extras[0]
                else Intent.createChooser(pick, null).putExtra(Intent.EXTRA_INITIAL_INTENTS, extras.toTypedArray())
                return try { pickFile.launch(chooser); true } catch (e: Exception) { fileCallback = null; false }
            }

            override fun onGeolocationPermissionsShowPrompt(origin: String, callback: GeolocationPermissions.Callback) {
                if (Uri.parse(origin).host != site.host) return callback.invoke(origin, false, false)
                if (ContextCompat.checkSelfPermission(this@MainActivity, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                    callback.invoke(origin, true, false)
                } else {
                    geoCallback = origin to callback
                    locationPermission.launch(Manifest.permission.ACCESS_COARSE_LOCATION)
                }
            }
        }
        onBackPressedDispatcher.addCallback(this, object : OnBackPressedCallback(true) {
            override fun handleOnBackPressed() {
                if (web.canGoBack()) web.goBack() else finish()
            }
        })
        if (savedInstanceState != null) web.restoreState(savedInstanceState) else web.loadUrl(BuildConfig.SITE_URL)
    }

    override fun onSaveInstanceState(outState: Bundle) {
        super.onSaveInstanceState(outState)
        web.saveState(outState)
    }

    override fun onResume() {
        super.onResume()
        // Fresh numbers every time the app comes to the front.
        if (HealthSync.syncUrl(this) != null) lifecycleScope.launch { HealthSync.syncNow(this@MainActivity); notifyPage() }
    }

    private fun afterPermissions() {
        lifecycleScope.launch {
            SyncWorker.schedule(this@MainActivity)
            HealthSync.syncNow(this@MainActivity)
            notifyPage()
        }
    }

    private suspend fun statusJson(): String {
        val granted = runCatching { HealthSync.granted(this) }.getOrDefault(emptySet())
        return JSONObject()
            .put("version", BuildConfig.VERSION_NAME)
            .put("available", HealthSync.availability(this))
            .put("connected", HealthSync.syncUrl(this) != null)
            .put("granted", JSONArray(granted.map { it.substringAfterLast('.') }))
            .put("background", HealthSync.BACKGROUND in granted)
            .put("lastResult", HealthSync.lastResult(this))
            .put("lastAt", HealthSync.lastAt(this))
            .toString()
    }

    private suspend fun notifyPage() {
        val s = statusJson()
        runOnUiThread { web.evaluateJavascript("window.dispatchEvent(new CustomEvent('nextme-health',{detail:$s}))", null) }
    }

    /** Methods callable from the NextMe page. They run on a background thread, so UI work is posted. */
    inner class Bridge {
        @JavascriptInterface
        fun status() { lifecycleScope.launch { notifyPage() } }

        @JavascriptInterface
        fun connect(url: String) {
            if (!url.startsWith(BuildConfig.SITE_URL + "/api/sync/")) return
            HealthSync.setSyncUrl(this@MainActivity, url)
            runOnUiThread {
                when (HealthSync.availability(this@MainActivity)) {
                    0 -> healthPermissions.launch(HealthSync.PERMISSIONS)
                    else -> openHealthConnect()
                }
            }
        }

        @JavascriptInterface
        fun syncNow() { lifecycleScope.launch { HealthSync.syncNow(this@MainActivity); notifyPage() } }

        @JavascriptInterface
        fun disconnect() {
            HealthSync.setSyncUrl(this@MainActivity, null)
            SyncWorker.cancel(this@MainActivity)
            lifecycleScope.launch { notifyPage() }
        }

        /** Water reminders, shown by the system even when the app is closed. */
        @JavascriptInterface
        fun waterRemindersOn(): Boolean = WaterReminder.enabled(this@MainActivity) && WaterReminder.canNotify(this@MainActivity)

        @JavascriptInterface
        fun enableWaterReminders() {
            runOnUiThread {
                if (WaterReminder.canNotify(this@MainActivity)) { WaterReminder.enable(this@MainActivity); notifyWater() }
                else notifyPermission.launch(Manifest.permission.POST_NOTIFICATIONS)
            }
        }

        @JavascriptInterface
        fun disableWaterReminders() { WaterReminder.disable(this@MainActivity); notifyWater() }

        @JavascriptInterface
        fun setWater(date: String, waterMl: Int, goalMl: Int, lang: String) {
            WaterReminder.setState(this@MainActivity, date, waterMl, goalMl, lang)
        }

        @JavascriptInterface
        fun openHealthConnect() { runOnUiThread { this@MainActivity.openHealthConnect() } }
    }

    private fun openHealthConnect() {
        val intent = if (HealthSync.availability(this) == 0) Intent(HealthConnectClient.ACTION_HEALTH_CONNECT_SETTINGS)
        else Intent(Intent.ACTION_VIEW, Uri.parse("market://details?id=com.google.android.apps.healthdata&url=healthconnect%3A%2F%2Fonboarding"))
        runCatching { startActivity(intent) }.onFailure {
            runCatching { startActivity(Intent(Intent.ACTION_VIEW, Uri.parse("https://play.google.com/store/apps/details?id=com.google.android.apps.healthdata"))) }
        }
    }
}
