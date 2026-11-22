package app.nextme.android

import android.app.Activity
import android.os.Bundle
import android.widget.ScrollView
import android.widget.TextView

/** Shown by Health Connect when the user asks why NextMe wants health data. */
class PrivacyActivity : Activity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        val ro = resources.configuration.locales[0].language == "ro"
        val text = if (ro)
            "NextMe citește din Health Connect doar pașii, pulsul și pulsul în repaus.\n\n" +
                "Le folosește ca să-ți arate progresul zilnic în aplicație. Trimite doar totalurile pe zi în contul tău NextMe, " +
                "prin linkul tău privat. Nu vindem și nu dăm datele nimănui.\n\n" +
                "Poți opri accesul oricând din Health Connect sau din NextMe → Profil → Ceas și telefon → Oprește sincronizarea. " +
                "Dacă ștergi contul din Profil, se șterg și datele de pe server.\n\n" +
                "NextMe oferă informații generale, nu sfat medical."
        else
            "NextMe reads only steps, heart rate and resting heart rate from Health Connect.\n\n" +
                "It uses them to show your daily progress in the app. It sends only daily totals to your NextMe account, " +
                "through your private link. We never sell or share this data.\n\n" +
                "You can stop access any time in Health Connect or in NextMe → Profile → Watch & phone → Turn off sync. " +
                "Deleting your account in Profile also deletes the data on the server.\n\n" +
                "NextMe gives general information, not medical advice."
        val tv = TextView(this).apply {
            setText(text)
            textSize = 16f
            setTextColor(0xFFFFFFFF.toInt())
            setPadding(48, 96, 48, 48)
        }
        setContentView(ScrollView(this).apply { setBackgroundColor(0xFF000000.toInt()); addView(tv) })
    }
}
