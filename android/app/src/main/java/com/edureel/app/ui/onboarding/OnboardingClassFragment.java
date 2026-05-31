package com.edureel.app.ui.onboarding;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.GridLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.edureel.app.R;

public class OnboardingClassFragment extends Fragment {

    private java.util.List<String> classes = new java.util.ArrayList<>();
    private java.util.List<Integer> classLevels = new java.util.ArrayList<>();
    private java.util.List<TextView> views = new java.util.ArrayList<>();
    private int selectedIndex = -1;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_onboarding_class, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        GridLayout gridLayout = view.findViewById(R.id.gridLayout);
        
        com.edureel.app.models.Metadata appMetadata = ((OnboardingActivity) getActivity()).appMetadata;
        if (appMetadata != null && appMetadata.getClasses() != null) {
            for (com.edureel.app.models.MetadataClass mc : appMetadata.getClasses()) {
                classes.add(mc.getName());
                classLevels.add(mc.getValue());
            }
        }
        
        if (classes.isEmpty()) {
            classes.addAll(java.util.Arrays.asList("6th", "7th", "8th", "9th", "10th", "11-12"));
            classLevels.addAll(java.util.Arrays.asList(6, 7, 8, 9, 10, 11));
        }
        
        for (int i = 0; i < classes.size(); i++) {
            TextView tv = (TextView) LayoutInflater.from(getContext()).inflate(R.layout.item_onboarding_option, gridLayout, false);
            
            GridLayout.LayoutParams params = (GridLayout.LayoutParams) tv.getLayoutParams();
            params.width = 0;
            params.columnSpec = GridLayout.spec(GridLayout.UNDEFINED, 1f);
            params.setMargins(12, 12, 12, 12);
            tv.setLayoutParams(params);
            
            tv.setText(classes.get(i));
            tv.setTextAlignment(View.TEXT_ALIGNMENT_CENTER);
            
            final int index = i;
            tv.setOnClickListener(v -> selectOption(index));
            
            gridLayout.addView(tv);
            views.add(tv);

            // Check if it matches existing data
            int existingClass = ((OnboardingActivity) getActivity()).selectedClassLevel;
            if (existingClass == classLevels.get(i)) {
                selectOption(i);
            }
        }

        view.findViewById(R.id.btnContinue).setOnClickListener(v -> {
            if (selectedIndex != -1) {
                ((OnboardingActivity) getActivity()).selectedClassLevel = classLevels.get(selectedIndex);
                ((OnboardingActivity) getActivity()).nextPage();
            }
        });
    }

    private void selectOption(int index) {
        if (selectedIndex != -1) {
            views.get(selectedIndex).setBackgroundResource(R.drawable.bg_onboarding_card_unselected);
        }
        selectedIndex = index;
        views.get(selectedIndex).setBackgroundResource(R.drawable.bg_onboarding_card_selected);
    }
}
