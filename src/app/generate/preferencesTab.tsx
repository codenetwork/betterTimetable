"use client";

import React, { useState } from "react";

// Define the structure for user preferences data
interface PreferencesData {
  start: string;          // Preferred start time (e.g., "9AM")
  end: string;            // Preferred end time (e.g., "5PM")
  days: string[];         // Preferred days of the week (e.g., ["MON", "TUE", "WED"])
  classesPerDay: number;  // Maximum number of classes per day
  backToBack: boolean;    // Preference for back-to-back classes
}

// Define the props for the Preferences component
interface PreferencesProps {
  preferences: PreferencesData;   // Current preferences data
  setPreferences: React.Dispatch<React.SetStateAction<PreferencesData>>; // Function to update preferences
  setTab: React.Dispatch<React.SetStateAction<"units" | "preferences" | "timetable">>; // Function to change the current tab
}

// Preferences component allows users to set their scheduling preferences
const Preferences: React.FC<PreferencesProps> = ({
  preferences,
  setPreferences,
  setTab,
}) => {
  // Local state variables to manage form inputs
  const [start, setStart] = useState(preferences.start);                      // Start time input
  const [end, setEnd] = useState(preferences.end);                            // End time input
  const [days, setDays] = useState(preferences.days.join(", "));              // Days input as a comma-separated string
  const [classesPerDay, setClassesPerDay] = useState(preferences.classesPerDay); // Classes per day input
  const [backToBack, setBackToBack] = useState(preferences.backToBack);       // Back-to-back classes checkbox

  // Function to handle saving the preferences and navigating to the timetable tab
  const handleSavePreferences = () => {
    // Update the preferences state in the parent component
    setPreferences({
      start,
      end,
      days: days.split(",").map((day) => day.trim().toUpperCase()), // Convert days input to an array of uppercase strings
      classesPerDay,
      backToBack,
    });
    setTab("timetable"); // Navigate to the timetable tab
  };

  return (
    <>
      {/* Page Title */}
      <h2 className="text-3xl mb-4">Set Your Preferences</h2>

      {/* Preferences Form */}
      <p>Preferences go here!</p>

      {/* Navigation buttons */}
      <div className="mt-6 flex space-x-4">
        {/* Back Button to return to the Units tab */}
        <button
          onClick={() => setTab("units")}
          className="px-6 py-2 text-white rounded-full bg-blue-1000 hover:bg-blue-1100"
        >
          Back
        </button>

        {/* Next Button to save preferences and proceed to the Timetable tab */}
        <button
          onClick={handleSavePreferences}
          className="px-6 py-2 text-white rounded-full bg-blue-1000 hover:bg-blue-1100"
        >
          Next
        </button>
      </div>
    </>
  );
};

export default Preferences;
