package com.edureel.app.ui.explore;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;
import com.edureel.app.models.MetadataSubject;

import java.util.ArrayList;
import java.util.List;

public class SubjectAdapter extends RecyclerView.Adapter<SubjectAdapter.ViewHolder> {
    private List<MetadataSubject> subjects = new ArrayList<>();

    public void setSubjects(List<MetadataSubject> subjects) {
        this.subjects = subjects;
        notifyDataSetChanged();
    }

    @NonNull
    @Override
    public ViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_explore_subject, parent, false);
        return new ViewHolder(view);
    }

    public interface OnSubjectClickListener {
        void onSubjectClick(MetadataSubject subject);
    }
    
    private OnSubjectClickListener listener;
    
    public void setOnSubjectClickListener(OnSubjectClickListener listener) {
        this.listener = listener;
    }

    @Override
    public void onBindViewHolder(@NonNull ViewHolder holder, int position) {
        MetadataSubject subject = subjects.get(position);
        holder.bind(subject);
        holder.itemView.setOnClickListener(v -> {
            if (listener != null) listener.onSubjectClick(subject);
        });
    }

    @Override
    public int getItemCount() {
        return subjects.size();
    }

    static class ViewHolder extends RecyclerView.ViewHolder {
        TextView tvIcon, tvName, tvCount;

        ViewHolder(@NonNull View itemView) {
            super(itemView);
            tvIcon = itemView.findViewById(R.id.tvIcon);
            tvName = itemView.findViewById(R.id.tvName);
            tvCount = itemView.findViewById(R.id.tvCount);
        }

        void bind(MetadataSubject subject) {
            tvIcon.setText(subject.getIcon() != null ? subject.getIcon() : "📚");
            tvName.setText(subject.getName());
            tvCount.setText(subject.getCount() + " reels");
            
            // Optional: colorize name based on subject. For simplicity using one color from XML unless specified.
        }
    }
}
