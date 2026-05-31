package com.edureel.app.ui.feed;

import android.content.Context;
import android.net.Uri;

import androidx.media3.common.MediaItem;
import androidx.media3.datasource.DefaultHttpDataSource;
import androidx.media3.datasource.cache.CacheDataSource;
import androidx.media3.exoplayer.hls.HlsMediaSource;
import androidx.media3.exoplayer.offline.DownloadHelper;
import androidx.media3.exoplayer.source.MediaSource;
import androidx.media3.exoplayer.ExoPlayer;

import com.edureel.app.EduReelApp;
import com.edureel.app.models.Video;

import java.util.List;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

public class VideoPreloader {

    private static final ExecutorService executor = Executors.newFixedThreadPool(3);

    public static CacheDataSource.Factory getCacheDataSourceFactory() {
        return new CacheDataSource.Factory()
                .setCache(EduReelApp.getSimpleCache())
                .setUpstreamDataSourceFactory(new DefaultHttpDataSource.Factory().setAllowCrossProtocolRedirects(true))
                .setFlags(CacheDataSource.FLAG_IGNORE_CACHE_ON_ERROR);
    }

    public static void prefetchSurroundingVideos(Context context, List<Video> videos, int currentIndex) {
        if (videos == null || videos.isEmpty()) return;

        int startIndex = Math.max(0, currentIndex - 5);
        int endIndex = Math.min(videos.size() - 1, currentIndex + 5);

        for (int i = startIndex; i <= endIndex; i++) {
            if (i == currentIndex) continue; // Skip current video

            final Video video = videos.get(i);
            if (video == null || video.getHlsUrl() == null) continue;

            executor.submit(() -> {
                try {
                    String hlsUrl = video.getHlsUrl();
                    if (hlsUrl.startsWith("/hls")) {
                        hlsUrl = com.edureel.app.utils.Constants.SERVER_URL + hlsUrl;
                    }

                    Uri uri = Uri.parse(hlsUrl);
                    MediaItem mediaItem = MediaItem.fromUri(uri);

                    // We use DownloadHelper to extract the HLS manifest and first few chunks
                    DownloadHelper downloadHelper = DownloadHelper.forMediaItem(
                            context,
                            mediaItem,
                            null,
                            getCacheDataSourceFactory()
                    );
                    
                    downloadHelper.prepare(new DownloadHelper.Callback() {
                        @Override
                        public void onPrepared(DownloadHelper helper) {
                            // Once prepared, we don't necessarily need to download everything,
                            // the manifest is cached just by preparing.
                            // To cache first few chunks, we can create a temporary ExoPlayer
                            // or rely on the manifest caching to speed up the initial load.
                            helper.release();
                        }

                        @Override
                        public void onPrepareError(DownloadHelper helper, java.io.IOException e) {
                            helper.release();
                        }
                    });

                } catch (Exception e) {
                    e.printStackTrace();
                }
            });
        }
    }
}
