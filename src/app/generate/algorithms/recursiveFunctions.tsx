import { parseCourseTime } from "./helperFunctions";


/// ----------------------------------------------------------------------------------------------------- ///
/// 
///                                      INTERFACES
///             these are used to provide structure to our data for type safety
///
/// ----------------------------------------------------------------------------------------------------- ///






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






/// ----------------------------------------------------------------------------------------------------- ///
/// 
///                                      RECURSIVE FUNCTIONS
///                     these are used to allocate timeslots without clashes
///
/// ----------------------------------------------------------------------------------------------------- ///


export default function scheduleUnits(
  unitIndex: number,
  units: Array<{
    unitCode: string;
    unitName: string;
    activities: {
      activityType: string;
      courses: Course[];
    }[];
  }>,
  scheduledTimesPerDay: CourseTimes,
  finalSchedule: FilteredCourseList
): boolean {
  //// Recursive function to schedule units and their activities
  ///
  /// inputs:
  ///   unitIndex: number - The index of the unit to schedule
  ///   units: Array<Unit> - The array of units to schedule
  ///   scheduledTimesPerDay: CourseTimes - The times already scheduled
  ///   finalSchedule: FilteredCourseList - The accumulating final schedule
  /// outputs:
  ///   boolean - Returns true if scheduling was successful, false otherwise
  ///

  // Base case: all units have been scheduled
  if (unitIndex >= units.length) {
    return true;
  }

  // Get the current unit to schedule
  const currentUnit = units[unitIndex];

  // Initialize the schedule for the current unit
  initializeUnitSchedule(currentUnit, finalSchedule);

  // Sort activities to prioritize those with fewer options
  sortActivitiesByCourseOptions(currentUnit.activities);

  // Start scheduling activities for the current unit
  return scheduleActivities(
    0,
    currentUnit,
    units,
    unitIndex,
    scheduledTimesPerDay,
    finalSchedule
  );
}




function initializeUnitSchedule(
  currentUnit: {
    unitCode: string;
    unitName: string;
    activities: {
      activityType: string;
      courses: Course[];
    }[];
  },
  finalSchedule: FilteredCourseList
): void {
  //// Function to initialize the schedule for a unit
  ///
  /// inputs:
  ///   currentUnit: Unit - The current unit being scheduled
  ///   finalSchedule: FilteredCourseList - The accumulating final schedule
  /// outputs:
  ///   void
  ///

  finalSchedule[currentUnit.unitCode] = {
    unitName: currentUnit.unitName,
    courses: [],
  };
}


function sortActivitiesByCourseOptions(
  activities: Array<{
    activityType: string;
    courses: Course[];
  }>
): void {
  //// Function to sort activities by the number of available course options
  ///
  /// inputs:
  ///   activities: Array<Activity> - The list of activities to sort
  /// outputs:
  ///   void (the activities array is sorted in place)
  ///

  activities.sort(
    (activityA, activityB) => activityA.courses.length - activityB.courses.length
  );
}



function scheduleActivities(
  activityIndex: number,
  currentUnit: {
    unitCode: string;
    unitName: string;
    activities: {
      activityType: string;
      courses: Course[];
    }[];
  },
  units: Array<{
    unitCode: string;
    unitName: string;
    activities: {
      activityType: string;
      courses: Course[];
    }[];
  }>,
  unitIndex: number,
  scheduledTimesPerDay: CourseTimes,
  finalSchedule: FilteredCourseList
): boolean {
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
  //// Recursive function to schedule activities within a unit
  ///
  /// inputs:
  ///   activityIndex: number - The index of the activity to schedule
  ///   currentUnit: Unit - The current unit being scheduled
  ///   units: Array<Unit> - The array of all units
  ///   unitIndex: number - The index of the current unit
  ///   scheduledTimesPerDay: CourseTimes - The times already scheduled
  ///   finalSchedule: FilteredCourseList - The accumulating final schedule
  /// outputs:
  ///   boolean - Returns true if scheduling was successful, false otherwise
  ///


  const activity = currentUnit.activities[activityIndex];

  // Try each course option for the current activity
  for (const course of activity.courses) {
    // Parse course times
    const { startTime, endTime } = parseCourseTimes(course.time);

    const scheduledTimes = scheduledTimesPerDay[course.day];

    // Check for time conflicts
    if (!hasTimeConflict(scheduledTimes, startTime, endTime)) {
      // Tentatively schedule the course
      scheduleCourse(
        currentUnit.unitCode,
        course,
        startTime,
        endTime,
        scheduledTimes,
        finalSchedule
      );

      // Attempt to schedule the next activity
      if (
        scheduleActivities(
          activityIndex + 1,
          currentUnit,
          units,
          unitIndex,
          scheduledTimesPerDay,
          finalSchedule
        )
      ) {
        return true;
      }

      // Backtracking: remove the tentatively scheduled course and time
      unscheduleCourse(
        currentUnit.unitCode,
        scheduledTimes,
        finalSchedule
      );
    }
  }

  // Unable to schedule this activity without conflicts
  return false;
}



function parseCourseTimes(
  timeRange: string
): { startTime: Date; endTime: Date } {
  //// Function to parse start and end times from a time string
  ///
  /// inputs:
  ///   timeRange: string - A string representing the time range (e.g., "9:00am - 10:30am")
  /// outputs:
  ///   { startTime: Date; endTime: Date } - The parsed start and end times as Date objects
  ///

  const [startTimeStr, endTimeStr] = timeRange.split(" - ");
  const startTime = parseCourseTime(startTimeStr);
  const endTime = parseCourseTime(endTimeStr);
  return { startTime, endTime };
}



function hasTimeConflict(
  scheduledTimes: Array<{
    start: Date;
    end: Date;
    unitCode: string;
    activity: string;
  }>,
  startTime: Date,
  endTime: Date
): boolean {
  //// Function to check for time conflicts on a given day
  ///
  /// inputs:
  ///   scheduledTimes: Array<{ start: Date; end: Date; unitCode: string; activity: string }>
  ///   startTime: Date - The start time of the course to schedule
  ///   endTime: Date - The end time of the course to schedule
  /// outputs:
  ///   boolean - Returns true if there is a conflict, false otherwise
  ///

  for (const scheduled of scheduledTimes) {
    if (startTime < scheduled.end && endTime > scheduled.start) {
      return true;
    }
  }
  return false;
}



function scheduleCourse(
  unitCode: string,
  course: Course,
  startTime: Date,
  endTime: Date,
  scheduledTimes: Array<{
    start: Date;
    end: Date;
    unitCode: string;
    activity: string;
  }>,
  finalSchedule: FilteredCourseList
): void {
  //// Function to tentatively schedule a course
  ///
  /// inputs:
  ///   unitCode: string - The code of the unit
  ///   course: Course - The course to schedule
  ///   startTime: Date - The start time of the course
  ///   endTime: Date - The end time of the course
  ///   scheduledTimes: Array<ScheduledTime> - The array of scheduled times for the day
  ///   finalSchedule: FilteredCourseList - The accumulating final schedule
  /// outputs:
  ///   void
  ///

  finalSchedule[unitCode].courses.push(course);
  scheduledTimes.push({
    start: startTime,
    end: endTime,
    unitCode: unitCode,
    activity: course.activity,
  });
}



function unscheduleCourse(
  unitCode: string,
  scheduledTimes: Array<{
    start: Date;
    end: Date;
    unitCode: string;
    activity: string;
  }>,
  finalSchedule: FilteredCourseList
): void {
  //// Function to remove a tentatively scheduled course during backtracking
  ///
  /// inputs:
  ///   unitCode: string - The code of the unit
  ///   scheduledTimes: Array<ScheduledTime> - The array of scheduled times for the day
  ///   finalSchedule: FilteredCourseList - The accumulating final schedule
  /// outputs:
  ///   void
  ///

  finalSchedule[unitCode].courses.pop();
  scheduledTimes.pop();
}



