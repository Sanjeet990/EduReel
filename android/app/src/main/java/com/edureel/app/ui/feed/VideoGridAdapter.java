package com.edureel.app.ui.feed;

import android.content.Intent;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.edureel.app.R;
import com.edureel.app.models.Video;

import java.util.ArrayList;
import java.util.List;

public class VideoGridAdapter extends RecyclerView.Adapter<VideoGridAdapter.ViewHolder> {

    private List<Video> videos = new ArrayList<>();
    private OnVideoClickListener listener;

    public interface OnVideoClickListener {
        void onVideoClick(Video video);
    }

    public VideoGridAdapter(OnVideoClickListener listener) {
        this.listener = listener;
    }

    public void setVideos(List<Video> videos) {
        this.videos = videos;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_saved_reel, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Video video = videos.get(position);
        
        String thumbUrl = video.getThumbnailUrl();
        if (thumbUrl != null) {
            thumbUrl = thumbUrl.replace("\\", "/");
            if (thumbUrl.startsWith("/hls")) {
                thumbUrl = com.edureel.app.utils.Constants.SERVER_URL + thumbUrl;
            } else if (thumbUrl.contains("localhost") || thumbUrl.contains("127.0.0.1")) {
                thumbUrl = thumbUrl.replace("localhost", com.edureel.app.utils.Constants.SERVER_IP)
                                   .replace("127.0.0.1", com.edureel.app.utils.Constants.SERVER_IP);
            }
        }

        Glide.with(holder.itemView.getContext())
                .load(thumbUrl)
                .placeholder(android.R.color.darker_gray)
                .error(android.R.color.holo_red_dark)
                .into(holder.ivThumbnail);

        View cardContainer = holder.itemView.findViewById(R.id.cardContainer);
        if (cardContainer != null) {
            cardContainer.setOnClickListener(v -> {
                if (listener != null) listener.onVideoClick(video);
            });
        } else {
            holder.itemView.setOnClickListener(v -> {
                if (listener != null) listener.onVideoClick(video);
            });
        }
    }

    @Override
    public int getItemCount() {
        return videos.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        ImageView ivThumbnail;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            ivThumbnail = itemView.findViewById(R.id.ivThumbnail);
        }
    }
}
