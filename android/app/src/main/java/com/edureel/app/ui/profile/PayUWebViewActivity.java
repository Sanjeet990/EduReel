package com.edureel.app.ui.profile;

import android.annotation.SuppressLint;
import android.os.Bundle;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;

import java.io.UnsupportedEncodingException;
import java.net.URLEncoder;

public class PayUWebViewActivity extends AppCompatActivity {
    private WebView webView;

    @SuppressLint("SetJavaScriptEnabled")
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        webView = new WebView(this);
        setContentView(webView);

        WebSettings webSettings = webView.getSettings();
        webSettings.setJavaScriptEnabled(true);
        webSettings.setDomStorageEnabled(true);

        webView.setWebChromeClient(new WebChromeClient());
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.contains("payment-success")) {
                    android.widget.Toast.makeText(PayUWebViewActivity.this, "Payment Successful!", android.widget.Toast.LENGTH_SHORT).show();
                    finish();
                    return true;
                } else if (url.contains("payment-failure")) {
                    android.widget.Toast.makeText(PayUWebViewActivity.this, "Payment Failed", android.widget.Toast.LENGTH_SHORT).show();
                    finish();
                    return true;
                } else if (url.contains("payu-callback")) {
                    return false; // Let POST happen
                }
                
                // Handle UPI and other intent schemes (e.g., upi://, intent://)
                if (url.startsWith("http://") || url.startsWith("https://")) {
                    return super.shouldOverrideUrlLoading(view, url);
                }
                
                try {
                    android.content.Intent intent = android.content.Intent.parseUri(url, android.content.Intent.URI_INTENT_SCHEME);
                    try {
                        startActivity(intent);
                        return true;
                    } catch (android.content.ActivityNotFoundException e) {
                        // Fallback if the app isn't installed
                        String fallbackUrl = intent.getStringExtra("browser_fallback_url");
                        if (fallbackUrl != null) {
                            view.loadUrl(fallbackUrl);
                            return true;
                        } else {
                            android.widget.Toast.makeText(PayUWebViewActivity.this, "No app installed to handle this payment method", android.widget.Toast.LENGTH_LONG).show();
                            return true;
                        }
                    }
                } catch (Exception e) {
                    android.widget.Toast.makeText(PayUWebViewActivity.this, "Error opening payment app", android.widget.Toast.LENGTH_SHORT).show();
                    return true;
                }
            }
        });

        String txnid = getIntent().getStringExtra("txnid");
        String hash = getIntent().getStringExtra("hash");
        String key = getIntent().getStringExtra("key");
        String amount = getIntent().getStringExtra("amount");
        String productinfo = getIntent().getStringExtra("productinfo");
        String firstname = getIntent().getStringExtra("firstname");
        String email = getIntent().getStringExtra("email");
        String phone = getIntent().getStringExtra("phone");
        String surl = getIntent().getStringExtra("surl");
        String furl = getIntent().getStringExtra("furl");
        String udf1 = getIntent().getStringExtra("udf1");
        String udf2 = getIntent().getStringExtra("udf2");

        try {
            String postData = "key=" + URLEncoder.encode(key, "UTF-8")
                    + "&txnid=" + URLEncoder.encode(txnid, "UTF-8")
                    + "&amount=" + URLEncoder.encode(amount, "UTF-8")
                    + "&productinfo=" + URLEncoder.encode(productinfo, "UTF-8")
                    + "&firstname=" + URLEncoder.encode(firstname, "UTF-8")
                    + "&email=" + URLEncoder.encode(email, "UTF-8")
                    + "&phone=" + URLEncoder.encode(phone, "UTF-8")
                    + "&surl=" + URLEncoder.encode(surl, "UTF-8")
                    + "&furl=" + URLEncoder.encode(furl, "UTF-8")
                    + "&udf1=" + URLEncoder.encode(udf1, "UTF-8")
                    + "&udf2=" + URLEncoder.encode(udf2, "UTF-8")
                    + "&hash=" + URLEncoder.encode(hash, "UTF-8");

            webView.postUrl("https://secure.payu.in/_payment", postData.getBytes());
        } catch (UnsupportedEncodingException e) {
            e.printStackTrace();
        }
    }
}
