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

    public interface OnVideoClickListener {
        void onVideoClick(Video video);
    }
    
    private OnVideoClickListener listener;
    
    public void setOnVideoClickListener(OnVideoClickListener listener) {
        this.listener = listener;
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        Video video = videos.get(position);
        holder.bind(video);
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onVideoClick(video);
        });
    }

    @Override
    public int getItemCount() {
        return videos.size();
    }

    class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvIcon, tvTitle, tvSubtitle;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvIcon = itemView.findViewById(R.id.tvIcon);
            tvTitle = itemView.findViewById(R.id.tvTitle);
            tvSubtitle = itemView.findViewById(R.id.tvSubtitle);
        }

        void bind(Video video) {
            tvTitle.setText(video.getTitle());
            String subject = video.getSubject() != null ? video.getSubject() : "General";
            String classLevel = (video.getTargetClass() != null && !video.getTargetClass().isEmpty()) 
                ? "Class " + video.getTargetClass().get(0) 
                : "";
            
            String subtitle = subject;
            if (!classLevel.isEmpty()) {
                subtitle += " • " + classLevel;
            }
            tvSubtitle.setText(subtitle);

            // Set emoji based on subject
            String icon = "🌙"; // default
            if (subject.toLowerCase().contains("math")) icon = "✏️";
            else if (subject.toLowerCase().contains("science")) icon = "🔬";
            else if (subject.toLowerCase().contains("code") || subject.toLowerCase().contains("computer")) icon = "💻";
            else if (subject.toLowerCase().contains("history")) icon = "📜";
            else if (subject.toLowerCase().contains("physics")) icon = "🌙";
            else if (subject.toLowerCase().contains("chemistry")) icon = "🧪";
            else if (subject.toLowerCase().contains("biology")) icon = "🧬";

            tvIcon.setText(icon);
        }
    }
}
