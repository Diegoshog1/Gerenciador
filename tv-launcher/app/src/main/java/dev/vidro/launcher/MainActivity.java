package dev.vidro.launcher;

import android.app.Activity;
import android.app.SearchManager;
import android.content.ActivityNotFoundException;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.content.pm.ResolveInfo;
import android.graphics.Bitmap;
import android.graphics.Canvas;
import android.graphics.drawable.Drawable;
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
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** Tela inicial: a interface é a página em assets/index.html; aqui ficam só as pontes com o sistema. */
public class MainActivity extends Activity {
    private WebView web;
    private final Map<String, String> iconCache = new HashMap<>();

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

    private String iconFor(ResolveInfo ri, PackageManager pm) {
        String pkg = ri.activityInfo.packageName;
        String cached = iconCache.get(pkg);
        if (cached != null) return cached;
        Drawable d = ri.loadIcon(pm);
        Bitmap b = Bitmap.createBitmap(144, 144, Bitmap.Config.ARGB_8888);
        Canvas c = new Canvas(b);
        d.setBounds(0, 0, 144, 144);
        d.draw(c);
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        b.compress(Bitmap.CompressFormat.PNG, 100, out);
        String uri = "data:image/png;base64," + Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP);
        iconCache.put(pkg, uri);
        return uri;
    }

    private class Bridge {
        @JavascriptInterface
        public String apps() {
            PackageManager pm = getPackageManager();
            Map<String, ResolveInfo> found = new LinkedHashMap<>();
            for (String cat : new String[]{Intent.CATEGORY_LEANBACK_LAUNCHER, Intent.CATEGORY_LAUNCHER}) {
                List<ResolveInfo> list = pm.queryIntentActivities(new Intent(Intent.ACTION_MAIN).addCategory(cat), 0);
                for (ResolveInfo ri : list) {
                    String pkg = ri.activityInfo.packageName;
                    if (!pkg.equals(getPackageName()) && !found.containsKey(pkg)) found.put(pkg, ri);
                }
            }
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
