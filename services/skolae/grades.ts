import {
  GesAuthenticationToken,
  ProfileService,
} from "ges-api-react-native";

import { Grade, GradeScore, Period, PeriodGrades, Subject } from "../shared/grade";

export async function fetchSkolaeGradesForPeriod(
  session: GesAuthenticationToken,
  accountId: string,
  period: Period
): Promise<PeriodGrades> {
  try {
    const year = period.id ? period.id : new Date().getFullYear().toString();
    const grades = await ProfileService.getGrades(session, year);

    if (!grades || grades.length === 0) {
      return {
        createdByAccount: accountId,
        studentOverall: { value: 0, disabled: true },
        classAverage: { value: 0, disabled: true },
        subjects: []
      };
    }

    return mapSkolaeGradesToPeriod(grades, accountId);
  } catch (error) {
    throw new Error(`Failed to fetch Skolae grades: ${error}`);
  }
}

export async function fetchSkolaeGradePeriods(
  session: GesAuthenticationToken,
  accountId: string
): Promise<Period[]> {
  try {
    const years = await ProfileService.getYears(session);

    if (!years || years.length === 0) {
      return [];
    }

    return years.map((year: any) => {
      const yearValue = year.year || year;
      const currentYear = new Date().getFullYear();

      if (yearValue === currentYear) {
        return {
          name: `Année ${yearValue}`,
          id: yearValue.toString(),
          start: new Date(yearValue, 8, 1),
          end: new Date(yearValue + 1, 6, 31),
          createdByAccount: accountId
        };
      } else {
        return {
          name: `Année ${yearValue}`,
          id: yearValue.toString(),
          start: new Date(yearValue, 8, 1),
          end: new Date(yearValue + 1, 6, 31),
          createdByAccount: accountId
        };
      }
    });
  } catch (error) {
    throw new Error(`Failed to fetch Skolae grade periods: ${error}`);
  }
}

function mapSkolaeGradesToPeriod(gradesData: any[], accountId: string): PeriodGrades {
  const subjectsWithGrades = gradesData.filter((subject: any) =>
    subject.grades && subject.grades.length > 0
  );

  if (subjectsWithGrades.length === 0) {
    return {
      createdByAccount: accountId,
      studentOverall: { value: 0, disabled: true },
      classAverage: { value: 0, disabled: true },
      subjects: []
    };
  }

  const subjects: Subject[] = [];
  let totalStudentPoints = 0;
  let totalClassPoints = 0;
  let totalSubjects = 0;

  for (const subjectData of subjectsWithGrades) {
    const mappedSubject = mapSkolaeSubject(subjectData, accountId);
    subjects.push(mappedSubject);

    if (!mappedSubject.studentAverage.disabled) {
      totalStudentPoints += mappedSubject.studentAverage.value;
      totalSubjects++;
    }
    if (!mappedSubject.classAverage.disabled) {
      totalClassPoints += mappedSubject.classAverage.value;
    }
  }

  const studentOverall: GradeScore = {
    value: totalSubjects > 0 ? totalStudentPoints / totalSubjects : 0,
    disabled: totalSubjects === 0
  };

  const classAverage: GradeScore = {
    value: totalSubjects > 0 ? totalClassPoints / totalSubjects : 0,
    disabled: totalSubjects === 0
  };

  return {
    createdByAccount: accountId,
    studentOverall,
    classAverage,
    subjects
  };
}

function mapSkolaeSubject(subjectData: any, accountId: string): Subject {
  const subjectName = subjectData.course || "Matière inconnue";
  const subjectId = subjectData.rc_id?.toString() || subjectName;

  const mappedGrades = subjectData.grades.map((grade: any) => mapSkolaeGrade(grade, subjectData, accountId));

  let studentAverage: GradeScore;
  let classAverage: GradeScore;

  if (subjectData.average !== null && subjectData.average !== undefined) {
    studentAverage = {
      value: parseFloat(subjectData.average) || 0,
      disabled: false
    };
  } else {
    const validGrades = mappedGrades.filter((g: Grade) => g.studentScore && !g.studentScore.disabled);
    const totalPoints = validGrades.reduce((sum: number, grade: Grade) => {
      const score = grade.studentScore!.value;
      const outOf = grade.outOf.value;
      const coefficient = grade.coefficient;
      return sum + (score / outOf) * 20 * coefficient;
    }, 0);
    const totalCoefficients = validGrades.reduce((sum: number, grade: Grade) => sum + grade.coefficient, 0);

    studentAverage = {
      value: totalCoefficients > 0 ? totalPoints / totalCoefficients : 0,
      disabled: validGrades.length === 0
    };
  }

  if (subjectData.ccaverage !== null && subjectData.ccaverage !== undefined) {
    classAverage = {
      value: parseFloat(subjectData.ccaverage) || 0,
      disabled: false
    };
  } else {
    classAverage = {
      value: studentAverage.value,
      disabled: studentAverage.disabled
    };
  }

  return {
    id: subjectId,
    name: subjectName,
    studentAverage,
    classAverage,
    outOf: { value: 20 },
    grades: mappedGrades
  };
}

function mapSkolaeGrade(grade: any, subjectData: any, accountId: string): Grade {
  const subjectName = subjectData.course || "Matière inconnue";
  const subjectId = subjectData.rc_id?.toString() || subjectName;

  const studentScore = grade.mark !== undefined && grade.mark !== null ? {
    value: parseFloat(grade.mark) || 0,
    disabled: false
  } : undefined;

  return {
    id: grade.id?.toString() || `${grade.date || Date.now()}-${subjectName}`,
    subjectId: subjectId,
    subjectName: subjectName,
    description: grade.title || grade.description || "Évaluation",
    givenAt: new Date(grade.date || Date.now()),
    outOf: { value: parseFloat(grade.outOf) || 20 },
    coefficient: parseFloat(grade.coef || subjectData.coef) || 1,
    studentScore: studentScore,
    bonus: grade.bonus || false,
    optional: grade.optional || false,
    createdByAccount: accountId
  };
}

