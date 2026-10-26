package dev.vidro.launcher;

import android.app.Activity;
import android.app.SearchManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.database.Cursor;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
import android.media.tv.TvContract;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Base64;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Tela inicial: a interface é a página em assets/index.html; aqui ficam só as pontes com o sistema. */
public class MainActivity extends Activity {
    private WebView web;
    private static final String READ_EPG = "com.android.providers.tv.permission.READ_EPG_DATA";
    private final Map<String, String> iconCache = new HashMap<>();
    private final Map<String, String> bannerCache = new HashMap<>();
    private final List<String> watchNextIntents = new ArrayList<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        web = new WebView(this);
        web.setBackgroundColor(0xFF080A14);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(true);
        web.addJavascriptInterface(new Bridge(), "TV");
        web.loadUrl("file:///android_asset/index.html");
        setContentView(web);
        web.requestFocus();
        if (checkSelfPermission(READ_EPG) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{READ_EPG}, 1);
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.setSystemUiVisibility(View.SYSTEM_UI_FLAG_FULLSCREEN | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                | View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        web.evaluateJavascript("window.onTvResume && onTvResume()", null);
    }

    @Override
    public void onBackPressed() {
        // é a tela inicial: voltar não sai dela
    }

    private void start(Intent i) {
        if (i == null) return;
        i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
        runOnUiThread(() -> {
            try {
                startActivity(i);
            } catch (ActivityNotFoundException | SecurityException ignored) {
            }
        });
    }

    private static String toDataUri(Drawable d, int w, int h) {
        Bitmap b = Bitmap.createBitmap(w, h, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        d.setBounds(0, 0, w, h);
        d.draw(c);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        return "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
    }

    /** Apps que aparecem na lista de apps da TV, por pacote. */
    private Map<String, ResolveInfo> launchables(PackageManager pm) {
        Map<String, ResolveInfo> found = new LinkedHashMap<>();
        for (String cat : new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER}) {
            List<ResolveInfo> list = pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(cat), 0);
            for (ResolveInfo ri : list) {
                String pkg = ri.activityInfo.packageName;
                if (!pkg.equals(getPackageName()) && !found.containsKey(pkg)) found.put(pkg, ri);
            }
        }
        return found;
    }

    private static String labelOf(PackageManager pm, String pkg) {
        try {
            return pm.getApplicationLabel(pm.getApplicationInfo(pkg, 0)).toString();
        } catch (Exception e) {
            return "";
        }
    }

    private String iconFor(ResolveInfo ri, PackageManager pm) {
        String pkg = ri.activityInfo.packageName;
        String cached = iconCache.get(pkg);
        if (cached != null) return cached;
        String uri = toDataUri(ri.loadIcon(pm), 144, 144);
        iconCache.put(pkg, uri);
        return uri;
    }

    private class Bridge {
        @JavascriptInterface
        public String apps() {
            PackageManager pm = getPackageManager();
            Map<String, ResolveInfo> found = launchables(pm);
            JSONArray arr = new JSONArray();
            try {
                for (ResolveInfo ri : found.values()) {
                    JSONObject o = new JSONObject();
                    o.put("pkg", ri.activityInfo.packageName);
                    o.put("label", ri.loadLabel(pm).toString());
                    o.put("icon", iconFor(ri, pm));
                    arr.put(o);
                }
            } catch (Exception ignored) {
            }
            return arr.toString();
        }

        /** Fila "Continuar assistindo" do Android TV (só aparece o que a TV deixar ler). */
        @JavascriptInterface
        public String watchNext() {
            JSONArray arr = new JSONArray();
            List<String> intents = new ArrayList<>();
            String[] cols = {
                    TvContract.WatchNextPrograms.COLUMN_TITLE,
                    TvContract.WatchNextPrograms.COLUMN_EPISODE_TITLE,
                    TvContract.WatchNextPrograms.COLUMN_SEASON_DISPLAY_NUMBER,
                    TvContract.WatchNextPrograms.COLUMN_EPISODE_DISPLAY_NUMBER,
                    TvContract.WatchNextPrograms.COLUMN_POSTER_ART_URI,
                    TvContract.WatchNextPrograms.COLUMN_THUMBNAIL_URI,
                    TvContract.WatchNextPrograms.COLUMN_LAST_PLAYBACK_POSITION_MILLIS,
                    TvContract.WatchNextPrograms.COLUMN_DURATION_MILLIS,
                    TvContract.WatchNextPrograms.COLUMN_INTENT_URI,
                    TvContract.WatchNextPrograms.COLUMN_PACKAGE_NAME,
            };
            PackageManager pm = getPackageManager();
            try (Cursor c = getContentResolver().query(TvContract.WatchNextPrograms.CONTENT_URI, cols, null, null,
                    TvContract.WatchNextPrograms.COLUMN_LAST_ENGAGEMENT_TIME_UTC_MILLIS + " DESC")) {
                while (c != null && c.moveToNext() && arr.length() < 12) {
                    String intent = c.getString(8);
                    if (intent == null) continue;
                    JSONObject o = new JSONObject();
                    o.put("title", c.getString(0));
                    o.put("episode", c.getString(1));
                    o.put("season", c.getString(2));
                    o.put("number", c.getString(3));
                    o.put("image", c.getString(5) != null ? c.getString(5) : c.getString(4));
                    o.put("position", c.getLong(6));
                    o.put("duration", c.getLong(7));
                    o.put("app", labelOf(pm, c.getString(9)));
                    o.put("i", intents.size());
                    intents.add(intent);
                    arr.put(o);
                }
            } catch (Exception ignored) {
                // sem permissão ou sem provedor de TV: a página cai para "usados recentemente"
            }
            synchronized (watchNextIntents) {
                watchNextIntents.clear();
                watchNextIntents.addAll(intents);
            }
            return arr.toString();
        }

        @JavascriptInterface
        public void openWatchNext(int i) {
            String uri;
            synchronized (watchNextIntents) {
                if (i < 0 || i >= watchNextIntents.size()) return;
                uri = watchNextIntents.get(i);
            }
            try {
                start(Intent.parseUri(uri, Intent.URI_INTENT_SCHEME));
            } catch (Exception ignored) {
            }
        }

        /** Apps usados nos últimos 14 dias (precisa de: appops set dev.vidro.launcher GET_USAGE_STATS allow). */
        @JavascriptInterface
        public String recents() {
            JSONArray arr = new JSONArray();
            try {
                UsageStatsManager um = (UsageStatsManager) getSystemService(USAGE_STATS_SERVICE);
                long now = System.currentTimeMillis();
                List<UsageStats> stats = um.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, now - 14L * 24 * 3600 * 1000, now);
                Map<String, Long> last = new HashMap<>();
                for (UsageStats u : stats) {
                    if (u.getTotalTimeInForeground() > 0) last.merge(u.getPackageName(), u.getLastTimeUsed(), Long::max);
                }
                PackageManager pm = getPackageManager();
                Map<String, ResolveInfo> apps = launchables(pm);
                List<String> pkgs = new ArrayList<>(last.keySet());
                pkgs.removeIf(p -> !apps.containsKey(p) || p.contains("launcher") || p.equals("com.android.tv.settings"));
                pkgs.sort((a, b) -> Long.compare(last.get(b), last.get(a)));
                for (String pkg : pkgs.subList(0, Math.min(8, pkgs.size()))) {
                    ResolveInfo ri = apps.get(pkg);
                    String banner = bannerCache.get(pkg);
                    if (banner == null) {
                        Drawable d = ri.activityInfo.loadBanner(pm);
                        if (d == null) d = ri.activityInfo.applicationInfo.loadBanner(pm);
                        banner = d != null ? toDataUri(d, 320, 180) : "";
                        bannerCache.put(pkg, banner);
                    }
                    JSONObject o = new JSONObject();
                    o.put("pkg", pkg);
                    o.put("label", ri.loadLabel(pm).toString());
                    o.put("banner", !banner.isEmpty());
                    o.put("image", banner.isEmpty() ? iconFor(ri, pm) : banner);
                    o.put("lastUsed", last.get(pkg));
                    arr.put(o);
                }
            } catch (Exception ignored) {
            }
            return arr.toString();
        }

        @JavascriptInterface
        public void launch(String pkg) {
            PackageManager pm = getPackageManager();
            Intent i = pm.getLeanbackLaunchIntentForPackage(pkg);
            if (i == null) i = pm.getLaunchIntentForPackage(pkg);
            start(i);
        }

        @JavascriptInterface
        public void settings() {
            start(new Intent(Settings.ACTION_SETTINGS));
        }

        @JavascriptInterface
        public void inputs() {
            Intent i = new Intent("com.android.tv.action.VIEW_INPUTS");
            if (getPackageManager().resolveActivity(i, 0) == null) i = new Intent(Settings.ACTION_SETTINGS);
            start(i);
        }

        @JavascriptInterface
        public void search() {
            Intent i = new Intent(SearchManager.INTENT_ACTION_GLOBAL_SEARCH);
            if (getPackageManager().resolveActivity(i, 0) == null) i = new Intent(Intent.ACTION_ASSIST);
            start(i);
        }
    }
}
