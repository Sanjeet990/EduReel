package com.edureel.app.ui.onboarding;

import android.os.Bundle;
import android.view.LayoutInflater;
import android.view.View;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.annotation.NonNull;
import androidx.annotation.Nullable;
import androidx.fragment.app.Fragment;
import com.google.android.flexbox.FlexboxLayout;
import com.edureel.app.R;
import java.util.HashSet;
import java.util.Set;
import java.util.ArrayList;

public class OnboardingInterestsFragment extends Fragment {

    private Set<String> selected = new HashSet<>();
    private java.util.List<String> subjects = new ArrayList<>();

    @Nullable
    @Override
    public View onCreateView(@NonNull LayoutInflater inflater, @Nullable ViewGroup container, @Nullable Bundle savedInstanceState) {
        return inflater.inflate(R.layout.fragment_onboarding_interests, container, false);
    }

    @Override
    public void onViewCreated(@NonNull View view, @Nullable Bundle savedInstanceState) {
        super.onViewCreated(view, savedInstanceState);
        
        FlexboxLayout flexboxLayout = view.findViewById(R.id.flexboxLayout);
        
        // Load from Metadata if available
        com.edureel.app.models.Metadata appMetadata = ((OnboardingActivity) getActivity()).appMetadata;
        if (appMetadata != null && appMetadata.getSubjects() != null) {
            for (com.edureel.app.models.MetadataSubject ms : appMetadata.getSubjects()) {
                String fullSubject = ms.getIcon() + " " + ms.getName();
                subjects.add(fullSubject);
            }
        }
        
        if (subjects.isEmpty()) {
            // Fallback
            String[] fallback = {"🔬 Science", "➕ Maths", "📜 History", "🌍 Geography", "💻 Coding", "📖 English", "🧠 GK", "⚗️ Chemistry", "🏛️ Civics", "🎨 Art", "💡 Physics"};
            subjects.addAll(java.util.Arrays.asList(fallback));
        }
        
        for (String subject : subjects) {
            TextView tv = (TextView) LayoutInflater.from(getContext()).inflate(R.layout.item_interest_chip, flexboxLayout, false);
            
            // Adjust margins for Flexbox
            FlexboxLayout.LayoutParams params = (FlexboxLayout.LayoutParams) tv.getLayoutParams();
            params.setMargins(16, 16, 16, 16);
            tv.setLayoutParams(params);
            
            tv.setText(subject);
            
            tv.setOnClickListener(v -> {
                if (selected.contains(subject)) {
                    selected.remove(subject);
                    tv.setBackgroundResource(R.drawable.bg_interest_chip_unselected);
                    tv.setTextColor(android.graphics.Color.parseColor("#666666"));
                } else {
                    selected.add(subject);
                    tv.setBackgroundResource(R.drawable.bg_interest_chip_selected);
                    tv.setTextColor(android.graphics.Color.parseColor("#B8A9FC"));
                }
            });
            
            flexboxLayout.addView(tv);
            
            // Check if it matches existing data (need to check if the text matches excluding emoji)
            java.util.List<String> existingSubjects = ((OnboardingActivity) getActivity()).selectedSubjects;
            if (existingSubjects != null) {
                boolean matches = false;
                for (String ext : existingSubjects) {
                    if (subject.contains(ext)) {
                        matches = true;
                        break;
                    }
                }
                
                if (matches) {
                    selected.add(subject);
                    tv.setBackgroundResource(R.drawable.bg_interest_chip_selected);
                    tv.setTextColor(android.graphics.Color.parseColor("#B8A9FC"));
                }
            }
        }

        view.findViewById(R.id.btnSubmit).setOnClickListener(v -> {
            if (!selected.isEmpty()) {
                ((OnboardingActivity) getActivity()).selectedSubjects = new ArrayList<>(selected);
                ((OnboardingActivity) getActivity()).nextPage();
            }
        });
    }
}
