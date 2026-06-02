package com.edureel.app.ui.profile;

import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.TextView;

import androidx.annotation.NonNull;
import androidx.recyclerview.widget.RecyclerView;

import com.edureel.app.R;
import com.edureel.app.models.Plan;

import java.util.List;

public class PlanAdapter extends RecyclerView.Adapter<PlanAdapter.PlanViewHolder> {
    private List<Plan> plans;
    private OnPlanClickListener listener;

    public interface OnPlanClickListener {
        void onBuyClick(Plan plan);
    }

    public PlanAdapter(List<Plan> plans, OnPlanClickListener listener) {
        this.plans = plans;
        this.listener = listener;
    }

    @NonNull
    @Override
    public PlanViewHolder onCreateViewHolder(@NonNull ViewGroup parent, int viewType) {
        View view = LayoutInflater.from(parent.getContext()).inflate(R.layout.item_plan, parent, false);
        return new PlanViewHolder(view);
    }

    @Override
    public void onBindViewHolder(@NonNull PlanViewHolder holder, int position) {
        Plan plan = plans.get(position);
        holder.tvPlanName.setText(plan.getName());
        holder.tvPlanPrice.setText("₹ " + plan.getPrice() + " / " + plan.getDurationDays() + " days");

        if (plan.getFeatures() != null && !plan.getFeatures().isEmpty()) {
            StringBuilder sb = new StringBuilder();
            for (String feature : plan.getFeatures()) {
                sb.append("• ").append(feature).append("\n");
            }
            holder.tvPlanFeatures.setText(sb.toString().trim());
        }

        holder.btnBuyPlan.setOnClickListener(v -> listener.onBuyClick(plan));
    }

    @Override
    public int getItemCount() {
        return plans != null ? plans.size() : 0;
    }

    static class PlanViewHolder extends RecyclerView.ViewHolder {
        TextView tvPlanName, tvPlanPrice, tvPlanFeatures;
        Button btnBuyPlan;

        public PlanViewHolder(@NonNull View itemView) {
            super(itemView);
            tvPlanName = itemView.findViewById(R.id.tvPlanName);
            tvPlanPrice = itemView.findViewById(R.id.tvPlanPrice);
            tvPlanFeatures = itemView.findViewById(R.id.tvPlanFeatures);
            btnBuyPlan = itemView.findViewById(R.id.btnBuyPlan);
        }
    }
}
