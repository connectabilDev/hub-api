export enum SessionStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

export interface MentoringSessionProps {
  id: string;
  mentorId: string;
  menteeId: string;
  topic: string;
  description?: string;
  scheduledAt: Date;
  duration: number;
  status: SessionStatus;
  meetingUrl?: string;
  notes?: string;
  rating?: number;
  feedback?: string;
  completedAt?: Date;
}

export class MentoringSession {
  public readonly id: string;
  public readonly mentorId: string;
  public readonly menteeId: string;
  public readonly topic: string;
  public readonly description?: string;
  public readonly scheduledAt: Date;
  public readonly duration: number;
  public readonly status: SessionStatus;
  public readonly meetingUrl?: string;
  public readonly notes?: string;
  public readonly rating?: number;
  public readonly feedback?: string;
  public readonly completedAt?: Date;

  constructor(props: MentoringSessionProps) {
    this.id = props.id;
    this.mentorId = props.mentorId;
    this.menteeId = props.menteeId;
    this.topic = props.topic;
    this.description = props.description;
    this.scheduledAt = props.scheduledAt;
    this.duration = props.duration;
    this.status = props.status;
    this.meetingUrl = props.meetingUrl;
    this.notes = props.notes;
    this.rating = props.rating;
    this.feedback = props.feedback;
    this.completedAt = props.completedAt;
  }

  static create(
    props: Omit<MentoringSessionProps, 'id' | 'status'>,
  ): MentoringSession {
    return new MentoringSession({
      ...props,
      id: crypto.randomUUID(),
      status: SessionStatus.SCHEDULED,
    });
  }

  isScheduled(): boolean {
    return this.status === SessionStatus.SCHEDULED;
  }

  isInProgress(): boolean {
    return this.status === SessionStatus.IN_PROGRESS;
  }

  isCompleted(): boolean {
    return this.status === SessionStatus.COMPLETED;
  }

  isCancelled(): boolean {
    return this.status === SessionStatus.CANCELLED;
  }

  isNoShow(): boolean {
    return this.status === SessionStatus.NO_SHOW;
  }

  isPast(): boolean {
    return this.scheduledAt < new Date();
  }

  isUpcoming(): boolean {
    return this.scheduledAt > new Date();
  }
}
