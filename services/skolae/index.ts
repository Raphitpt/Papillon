import { Capabilities, SchoolServicePlugin } from "@/services/shared/types";
import { Auth, Services } from "@/stores/account/types";
import { GesAuthenticationToken } from "ges-api-react-native";
import { refreshSkolaeAccount } from "@/services/skolae/refresh";
import { CourseDay } from "@/services/shared/timetable";
import { Period, PeriodGrades } from "@/services/shared/grade";
import { error } from "@/utils/logger/logger";
import { fetchSkolaeTimetable } from "@/services/skolae/timetable";
import { fetchSkolaeGradesForPeriod, fetchSkolaeGradePeriods } from "@/services/skolae/grades";

export class Skolae implements SchoolServicePlugin {
  displayName = "Skolae";
  service = Services.SKOLAE;
  capabilities: Capabilities[] = [
    Capabilities.REFRESH,
    Capabilities.TIMETABLE,
    Capabilities.GRADES,
    Capabilities.NEWS,
  ];
  session: GesAuthenticationToken | undefined;
  authData: Auth = {};

  constructor(public accountId: string) {}

  async refreshAccount(credentials: Auth): Promise<Skolae> {
    const refresh = (await refreshSkolaeAccount(this.accountId, credentials))
    this.authData = refresh.auth
    this.session = refresh.session


    return this;
  }

  async getWeeklyTimetable(weekNumber: number, forceRefresh?: boolean): Promise<CourseDay[]> {
    if (this.session) {
      return fetchSkolaeTimetable(this.session, this.accountId, weekNumber, forceRefresh);
    }

    error("Session is not valid", "Skolae.getWeeklyTimetable");
  }

  async getGradesForPeriod(period: Period): Promise<PeriodGrades> {
    if (this.session) {
      return fetchSkolaeGradesForPeriod(this.session, this.accountId, period);
    }

    error("Session is not valid", "Skolae.getGradesForPeriod");
  }

  async getGradesPeriods(): Promise<Period[]> {
    if (this.session) {
      return fetchSkolaeGradePeriods(this.session, this.accountId);
    }

    error("Session is not valid", "Skolae.getGradesPeriods");
  }
}