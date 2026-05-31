package com.edureel.app;

import android.app.Application;
import androidx.media3.database.StandaloneDatabaseProvider;
import androidx.media3.datasource.cache.LeastRecentlyUsedCacheEvictor;
import androidx.media3.datasource.cache.SimpleCache;
import java.io.File;

public class EduReelApp extends Application {

    private static SimpleCache simpleCache;

    @Override
    public void onCreate() {
        super.onCreate();
        
        // 100MB Cache for Video Segments
        LeastRecentlyUsedCacheEvictor evictor = new LeastRecentlyUsedCacheEvictor(100 * 1024 * 1024);
        StandaloneDatabaseProvider databaseProvider = new StandaloneDatabaseProvider(this);
        
        File cacheDir = new File(getCacheDir(), "media_cache");
        simpleCache = new SimpleCache(cacheDir, evictor, databaseProvider);
    }

    public static SimpleCache getSimpleCache() {
        return simpleCache;
    }
}
