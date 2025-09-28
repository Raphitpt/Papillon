import { getDateRangeOfWeek } from "@/database/useHomework";
import { Course, CourseDay, CourseType, CourseStatus } from "../shared/timetable";
import {
  GesAuthenticationToken,
  TimetableService,
} from "ges-api-react-native";

export async function fetchSkolaeTimetable(
  session: GesAuthenticationToken,
  accountId: string,
  weekNumber: number,
  _forceRefresh?: boolean
): Promise<CourseDay[]> {
  const { start, end } = getDateRangeOfWeek(weekNumber);
  try {
    const planning = await TimetableService.getTimetable(session, start, end);

    if (!planning || planning.length === 0) {
      return [];
    }

    return mapSkolaeCoursesToDays(planning, accountId);
  } catch (error) {
    throw new Error(`Failed to fetch Skolae timetable: ${error}`);
  }
}

function mapSkolaeCoursesToDays(planning: any[], accountId: string): CourseDay[] {
  const dayMap: Record<string, Course[]> = {};

  for (const event of planning) {
    const course = mapSkolaeEvent(event, accountId);
    if (course) {
      const dayKey = course.from.toISOString().split("T")[0];
      dayMap[dayKey] = dayMap[dayKey] || [];
      dayMap[dayKey].push(course);
    }
  }

  for (const day in dayMap) {
    dayMap[day].sort((a, b) => a.from.getTime() - b.from.getTime());
  }

  return Object.entries(dayMap).map(([day, courses]) => ({
    date: new Date(day),
    courses
  }));
}

function mapSkolaeEvent(event: any, accountId: string): Course | null {
  try {
    const startDate = new Date(event.start_date);
    const endDate = new Date(event.end_date);

    const room = event.rooms && event.rooms.length > 0
      ? event.rooms.map((r: any) => r.name || r.code || "").filter(Boolean).join(", ")
      : undefined;

    let courseType = CourseType.LESSON;
    if (event.type) {
      const typeStr = event.type.toLowerCase();
      if (typeStr.includes("td") || typeStr.includes("tp")) {
        courseType = CourseType.ACTIVITY;
      }
    }
    return {
      subject: event.name || "Cours",
      id: event.reservation_id?.toString() || `${event.start_date}-${event.name}`,
      type: courseType,
      from: startDate,
      to: endDate,
      additionalInfo: event.comment || undefined,
      room: room,
      teacher: event.teacher || undefined,
      group: event.discipline.student_group_name,
      status: mapSkolaeStatus(event.state),
      createdByAccount: accountId,
    };
  } catch (error) {
    console.error("Error mapping Skolae event:", error, event);
    return null;
  }
}

function mapSkolaeStatus(state: string): CourseStatus | undefined {
  if (!state) return undefined;

  switch (state.toUpperCase()) {
    case "CANCELLED":
    case "CANCELED":
      return CourseStatus.CANCELED;
    default:
      return undefined;
  }
}



