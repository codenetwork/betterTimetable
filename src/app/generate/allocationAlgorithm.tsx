/*

Hello there! Below is the algorithm used to select 1 of each activity for each unit
Note - The output does need to be returned in the format shown underneath the printed timetable:

{ 
  IFB104: { 
    unitName: "IFB104 Building IT Systems",
    courses: {
        "id": "fb51748f-709c-4d45-b7ec-2d9023460118",
        "unitCode": "IFB104",
        "unitName": "IFB104 Building IT Systems",
        "classType": "Lecture (Week 1-13) - On Campus Class (Internal Mode)",
        "activity": "LEC",
        "day": "MON",
        "time": "02:00pm - 04:00pm",
        "room": "GP Z411",
        "teachingStaff": "Laurianne Sitbon"
    }
  },
  IFB105: { 
    unitName: "IFB105 Database Management",
    courses: {
    ...
  },

*/






// Define the structure for an individual course
interface Course {
  id: string;
  unitCode: string;
  unitName: string;
  classType: string;
  activity: string; // e.g., "LEC", "TUT", etc.
  day: string;      // e.g., "MON", "TUE", etc.
  time: string;     // e.g., "02:00pm - 04:00pm"
  room: string;
  teachingStaff: string;
}

// Define the structure for unit data, including the unit name and its courses
interface UnitData {
  unitName: string;
  courses: Course[]; // List of courses under this unit
}

// Define the course list as a mapping from unit codes to unit data
interface CourseList {
  [unitCode: string]: UnitData;
}

// Define the structure for scheduled times to keep track of occupied time slots
interface ScheduledTime {
  start: Date;
  end: Date;
  unitCode: string;
  activity: string;
}

// Define the structure for tracking scheduled times per day
interface CourseTimes {
  [day: string]: ScheduledTime[]; // e.g., MON: [{...}, {...}]
}

// Define the structure for the filtered course list (the final schedule)
interface FilteredCourseList {
  [unitCode: string]: {
    unitName: string;
    courses: Course[];
  };
}

// Helper function to convert 12-hour time to 24-hour time format
const convertTo24Hour = (time12h: string): string => {
  const match = time12h.trim().match(/^(\d{1,2}):(\d{2})(am|pm)$/i);
  if (!match) {
    throw new Error(`Invalid time format: ${time12h}`);
  }

  let [, hourStr, minuteStr, modifier] = match;
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minuteStr, 10);

  if (modifier.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  } else if (modifier.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  const hoursStr = hours.toString().padStart(2, "0");
  const minutesStr = minutes.toString().padStart(2, "0");

  return `${hoursStr}:${minutesStr}:00`;
};









// Main function to filter the course list and build a conflict-free schedule
export default function filterCourseList(
  courseList: CourseList,
  start: string,
  end: string,
  days: string[],
  classesPerDay: number,
  backToBack: boolean
): FilteredCourseList | null {
  // Print the input values
  console.log(`Start Time: ${start}`);
  console.log(`End Time: ${end}`);
  console.log(`Days: ${days.join(", ")}`);
  console.log(`Classes Per Day: ${classesPerDay}`);
  console.log(`Back to Back Classes: ${backToBack}`);

  // Transform the course list into an array of units with their activities and courses
  const units = Object.entries(courseList).map(([unitCode, unitData]) => {
    // Group courses by activity type (e.g., group all lectures together)
    const activityGroups = unitData.courses.reduce((groups, course) => {
      // Initialize the group if it doesn't exist, then add the course to it
      (groups[course.activity] ||= []).push(course);
      return groups;
    }, {} as Record<string, Course[]>);

    // Return the unit with its activities and corresponding courses
    return {
      unitCode,
      unitName: unitData.unitName,
      activities: Object.entries(activityGroups).map(
        ([activityType, courses]) => ({
          activityType,
          courses,
        })
      ),
    };
  });

  // Alternative sorting: Schedule units with more options first
  units.sort((unitA, unitB) => {
    const optionsA = unitA.activities.reduce(
      (acc, activity) => acc * activity.courses.length,
      1
    );
    const optionsB = unitB.activities.reduce(
      (acc, activity) => acc * activity.courses.length,
      1
    );
    return optionsB - optionsA; // Note the reversal here
  });


  // Initialize course times to keep track of scheduled times per day
  const scheduledTimesPerDay: CourseTimes = {
    MON: [],
    TUE: [],
    WED: [],
    THU: [],
    FRI: [],
  };

  // Initialize the result object to store the final schedule
  const finalSchedule: FilteredCourseList = {};

  // Start scheduling units recursively
  const schedulingSuccess = scheduleUnits(
    0,
    units,
    scheduledTimesPerDay,
    finalSchedule
  );

  // Return the final schedule if successful, otherwise return null
  if (schedulingSuccess) {
    console.log("Here is the final timetable.", finalSchedule);

    return finalSchedule;
  } else {
    console.warn("Unable to find a conflict-free schedule.");
    return null;
  }
}






// Recursive function to schedule units and their activities
const scheduleUnits = (
  unitIndex: number,
  units: {
    unitCode: string;
    unitName: string;
    activities: {
      activityType: string;
      courses: Course[];
    }[];
  }[],
  scheduledTimesPerDay: CourseTimes,
  finalSchedule: FilteredCourseList
): boolean => {
  // Base case: all units have been scheduled
  if (unitIndex >= units.length) {
    return true;
  }

  // Get the current unit to schedule
  const currentUnit = units[unitIndex];

  // Initialize the schedule for the current unit
  finalSchedule[currentUnit.unitCode] = {
    unitName: currentUnit.unitName,
    courses: [],
  };

  // Sort activities by the number of available timeslots (fewer options first)
  currentUnit.activities.sort(
    (activityA, activityB) => activityA.courses.length - activityB.courses.length
  );

  // Recursive function to schedule activities within the current unit
  const scheduleActivities = (activityIndex: number): boolean => {
    // Base case: all activities for this unit have been scheduled
    if (activityIndex >= currentUnit.activities.length) {
      // Move on to schedule the next unit
      return scheduleUnits(
        unitIndex + 1,
        units,
        scheduledTimesPerDay,
        finalSchedule
      );
    }
  
    const activity = currentUnit.activities[activityIndex];
  
    // Try each course option for the current activity
    for (const course of activity.courses) {
      // Convert course times
      const [startTimeStr, endTimeStr] = course.time.split(" - ");
      const startTime = new Date(
        `1970-01-01T${convertTo24Hour(startTimeStr)}`
      );
      const endTime = new Date(`1970-01-01T${convertTo24Hour(endTimeStr)}`);
  
      const scheduledTimes = scheduledTimesPerDay[course.day];
  
      // Check for time conflicts
      let hasConflict = false;
      for (const scheduled of scheduledTimes) {
        if (
          (startTime < scheduled.end && endTime > scheduled.start)
        ) {
          hasConflict = true;
          break;
        }
      }
  
      if (!hasConflict) {
        // No conflict; tentatively schedule the course
        finalSchedule[currentUnit.unitCode].courses.push(course);
        scheduledTimes.push({
          start: startTime,
          end: endTime,
          unitCode: currentUnit.unitCode,
          activity: course.activity,
        });
  
        // Attempt to schedule the next activity
        if (scheduleActivities(activityIndex + 1)) {
          return true;
        }
  
        // Backtracking: remove the tentatively scheduled course and time
        finalSchedule[currentUnit.unitCode].courses.pop();
        scheduledTimes.pop();
      }
    }
  
    // Unable to schedule this activity without conflicts
    return false;
  };
  

  // Start scheduling activities for the current unit
  return scheduleActivities(0);
};
