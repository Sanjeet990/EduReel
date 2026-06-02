const ffmpeg = require('fluent-ffmpeg');
const path = require('path');
const fs = require('fs');
const Video = require('../models/videoModel');

// Use relative paths to avoid space issues in Windows
const hlsBaseDir = 'public/hls';
if (!fs.existsSync(hlsBaseDir)) {
    fs.mkdirSync(hlsBaseDir, { recursive: true });
}

const transcode = async (videoId, rawFilePath) => {
    const timestamp = Date.now().toString();
    const outputDir = path.join(hlsBaseDir, videoId, timestamp).replace(/\\/g, '/');
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    const resolutions = [
        { label: '240p', height: 240, bitrate: '300k' },
        { label: '480p', height: 480, bitrate: '1000k' },
        { label: '720p', height: 720, bitrate: '2500k' }
    ];

    try {
        const playlists = [];

        for (const res of resolutions) {
            const resDir = path.join(outputDir, res.label).replace(/\\/g, '/');
            if (!fs.existsSync(resDir)) {
                fs.mkdirSync(resDir);
            }

            const playlistName = 'playlist.m3u8';
            const playlistPath = path.posix.join(resDir, playlistName);
            const segmentFilename = path.posix.join(resDir, 'seg%03d.m4s');
            const safeRawFilePath = rawFilePath.replace(/\\/g, '/');

            await new Promise((resolve, reject) => {
                ffmpeg(safeRawFilePath)
                    .outputOptions([
                        '-vf', `scale=-2:${res.height}`,
                        '-c:v', 'libx264',
                        '-preset', 'ultrafast',
                        '-crf', '23',
                        '-c:a', 'aac',
                        '-b:a', '128k',
                        '-maxrate', res.bitrate,
                        '-bufsize', res.bitrate,
                        '-hls_time', '1',
                        '-hls_playlist_type', 'vod',
                        '-hls_segment_type', 'fmp4',
                        '-hls_flags', 'independent_segments',
                        '-hls_segment_filename', segmentFilename
                    ])
                    .output(playlistPath)
                    .on('end', () => {
                        playlists.push({
                            label: res.label,
                            playlistUrl: `/hls/${videoId}/${timestamp}/${res.label}/${playlistName}`
                        });
                        resolve();
                    })
                    .on('error', (err) => {
                        reject(err);
                    })
                    .run();
            });
        }

        // Generate Master Playlist
        const masterPlaylistPath = path.join(outputDir, 'master.m3u8').replace(/\\/g, '/');
        let masterContent = '#EXTM3U\n#EXT-X-VERSION:7\n';
        resolutions.forEach((res, index) => {
            masterContent += `#EXT-X-STREAM-INF:BANDWIDTH=${parseInt(res.bitrate) * 1000},RESOLUTION=${Math.round(res.height * 16 / 9)}x${res.height}\n`;
            masterContent += `${res.label}/playlist.m3u8\n`;
        });
        fs.writeFileSync(masterPlaylistPath, masterContent);

        // Generate Thumbnail (extract frame at 1s)
        const thumbFilename = 'thumb.jpg';
        const safeRawFilePathForThumb = rawFilePath.replace(/\\/g, '/');
        const safeOutputDirForThumb = outputDir.replace(/\\/g, '/');

        await new Promise((resolve, reject) => {
            ffmpeg(safeRawFilePathForThumb)
                .screenshots({
                    timestamps: [1],
                    filename: thumbFilename,
                    folder: safeOutputDirForThumb,
                    size: '?x720'
                })
                .on('end', () => resolve())
                .on('error', (err) => {
                    // Fallback or ignore
                    console.error("Thumbnail error:", err);
                    resolve();
                });
        });

        // Update DB
        await Video.findByIdAndUpdate(videoId, {
            status: 'ready',
            hlsUrl: `/hls/${videoId}/${timestamp}/master.m3u8`,
            thumbnailUrl: `/hls/${videoId}/${timestamp}/${thumbFilename}`,
            resolutions: playlists
        });

        // Delete raw file
        fs.unlinkSync(rawFilePath);

    } catch (error) {
        console.error(`Transcoding failed for video ${videoId}:`, error);
        await Video.findByIdAndUpdate(videoId, { status: 'failed' });
    }
};

module.exports = { transcode };
