export enum EnrollmentStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  SUSPENDED = 'suspended',
}

export interface CourseEnrollmentProps {
  id: string;
  courseId: string;
  studentId: string;
  professorId: string;
  status: EnrollmentStatus;
  enrolledAt: Date;
  completedAt?: Date;
  progress: number;
  grade?: number;
}

export class CourseEnrollment {
  public readonly id: string;
  public readonly courseId: string;
  public readonly studentId: string;
  public readonly professorId: string;
  public readonly status: EnrollmentStatus;
  public readonly enrolledAt: Date;
  public readonly completedAt?: Date;
  public readonly progress: number;
  public readonly grade?: number;

  constructor(props: CourseEnrollmentProps) {
    this.id = props.id;
    this.courseId = props.courseId;
    this.studentId = props.studentId;
    this.professorId = props.professorId;
    this.status = props.status;
    this.enrolledAt = props.enrolledAt;
    this.completedAt = props.completedAt;
    this.progress = props.progress;
    this.grade = props.grade;
  }

  static create(
    props: Omit<
      CourseEnrollmentProps,
      'id' | 'enrolledAt' | 'progress' | 'status'
    >,
  ): CourseEnrollment {
    return new CourseEnrollment({
      ...props,
      id: crypto.randomUUID(),
      enrolledAt: new Date(),
      progress: 0,
      status: EnrollmentStatus.PENDING,
    });
  }

  isPending(): boolean {
    return this.status === EnrollmentStatus.PENDING;
  }

  isActive(): boolean {
    return this.status === EnrollmentStatus.ACTIVE;
  }

  isCompleted(): boolean {
    return this.status === EnrollmentStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === EnrollmentStatus.CANCELLED;
  }

  isSuspended(): boolean {
    return this.status === EnrollmentStatus.SUSPENDED;
  }
}
