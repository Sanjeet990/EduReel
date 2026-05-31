package com.edureel.app.ui.profile;

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
import com.edureel.app.ui.feed.SavedFeedActivity;

import java.util.ArrayList;
import java.util.List;

public class SavedReelsAdapter extends RecyclerView.Adapter<SavedReelsAdapter.ViewHolder> {

    private List<Video> videos = new ArrayList<>();

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
            // Fix Windows backslashes
            thumbUrl = thumbUrl.replace("\\", "/");
            
            if (thumbUrl.startsWith("/hls")) {
                thumbUrl = "http://192.168.29.15:5000" + thumbUrl;
            } else if (thumbUrl.contains("localhost") || thumbUrl.contains("127.0.0.1")) {
                thumbUrl = thumbUrl.replace("localhost", "192.168.29.15")
                                   .replace("127.0.0.1", "192.168.29.15");
            }
        }

        Glide.with(holder.itemView.getContext())
                .load(thumbUrl)
                .placeholder(android.R.color.darker_gray)
                .error(android.R.color.holo_red_dark)
                .into(holder.ivThumbnail);

        holder.itemView.setOnClickListener(v -> {
            Intent intent = new Intent(v.getContext(), SavedFeedActivity.class);
            intent.putExtra("START_INDEX", position);
            v.getContext().startActivity(intent);
        });
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
