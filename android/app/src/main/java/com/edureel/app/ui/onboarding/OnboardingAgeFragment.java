package com.edureel.app.ui.onboarding;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.LinearLayout;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.edureel.app.R;

public class OnboardingAgeFragment extends Fragment {

    private String[] ages = {"Under 13", "13-17", "18-22", "23+"};
    private TextView[] views = new TextView[4];
    private int selectedIndex = -1;

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_onboarding_age, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        LinearLayout llOptions = view.findViewById(R.id.llOptions);
        
        for (int i = 0; i < ages.length; i++) {
            TextView tv = (TextView) LayoutInflater.from(getContext()).inflate(R.layout.item_onboarding_option, llOptions, false);
            tv.setText(ages[i]);
            
            final int index = i;
            tv.setOnClickListener(v -> selectOption(index));
            
            llOptions.addView(tv);
            views[i] = tv;
            
            // Check if it matches existing data
            String existingAge = ((OnboardingActivity) getActivity()).selectedAgeGroup;
            if (existingAge != null && existingAge.equals(ages[i])) {
                selectOption(i);
            }
        }

        view.findViewById(R.id.btnContinue).setOnClickListener(v -> {
            if (selectedIndex != -1) {
                ((OnboardingActivity) getActivity()).selectedAgeGroup = ages[selectedIndex];
                ((OnboardingActivity) getActivity()).nextPage();
            }
        });
    }

    private void selectOption(int index) {
        if (selectedIndex != -1) {
            views[selectedIndex].setBackgroundResource(R.drawable.bg_onboarding_card_unselected);
        }
        selectedIndex = index;
        views[selectedIndex].setBackgroundResource(R.drawable.bg_onboarding_card_selected);
    }
}
