package com.edureel.app.ui.explore;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.ImageView;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;
import com.bumptech.glide.Glide;
import com.edureel.app.R;
import com.edureel.app.models.Video;
import java.util.ArrayList;
import java.util.List;

public class ExploreAdapter extends RecyclerView.Adapter<ExploreAdapter.ViewHolder> {
    private List<Video> videos = new ArrayList<>();

    public void setVideos(List<Video> videos) {
        this.videos = videos;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_explore_video, parent, false);
        return new ViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        holder.bind(videos.get(position));
    }

    @Override
    public int getItemCount() {
        return videos.size();
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        ImageView ivThumbnail;
        TextView tvTitle, tvSubject, tvViews;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            ivThumbnail = itemView.findViewById(R.id.ivThumbnail);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvSubject = itemView.findViewById(R.id.tvSubject);
            tvViews = itemView.findViewById(R.id.tvViews);
        }

        void bind(Video video) {
            tvTitle.setText(video.getTitle());
            tvSubject.setText(video.getSubject() != null ? video.getSubject() : "");
            
            int views = video.getViewCount();
            tvViews.setText(views > 1000 ? String.format("%.1fk views", views / 1000f) : views + " views");

            String url = video.getThumbnailUrl();
            if (url != null && url.startsWith("/uploads")) {
                url = "http://192.168.29.15:5000" + url;
            }
            if (url != null) {
                Glide.with(itemView).load(url).into(ivThumbnail);
            }
        }
    }
}
