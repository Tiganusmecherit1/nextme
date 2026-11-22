plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

// Release signing: CI provides NM_KEYSTORE (path) + NM_KEY_PASSWORD. Without them the APK is debug-signed.
val keystorePath: String? = System.getenv("NM_KEYSTORE")
val keyPassword: String? = System.getenv("NM_KEY_PASSWORD")

android {
    namespace = "app.nextme.android"
    compileSdk = 35

    defaultConfig {
        applicationId = "app.nextme.android"
        minSdk = 26
        targetSdk = 35
        versionCode = (System.getenv("NM_VERSION_CODE") ?: "1").toInt()
        versionName = "1.0." + (System.getenv("NM_VERSION_CODE") ?: "0")
        buildConfigField("String", "SITE_URL", "\"https://nextme.nexusnode.workers.dev\"")
    }

    signingConfigs {
        create("release") {
            if (keystorePath != null && keyPassword != null) {
                storeFile = file(keystorePath)
                storePassword = keyPassword
                keyAlias = "nextme"
                this.keyPassword = keyPassword
                storeType = "pkcs12"
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            signingConfig = if (keystorePath != null && keyPassword != null) signingConfigs.getByName("release") else signingConfigs.getByName("debug")
        }
    }

    buildFeatures { buildConfig = true }
    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }
    kotlinOptions { jvmTarget = "17" }
}

dependencies {
    implementation("androidx.health.connect:connect-client:1.1.0")
    implementation("androidx.work:work-runtime-ktx:2.9.1")
    implementation("androidx.activity:activity-ktx:1.9.3")
    implementation("androidx.lifecycle:lifecycle-runtime-ktx:2.8.7")
    implementation("androidx.core:core-ktx:1.13.1")
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.9.0")
}
