export enum ApplicationStatus {
  SUBMITTED = 'submitted',
  UNDER_REVIEW = 'under_review',
  SHORTLISTED = 'shortlisted',
  INTERVIEW_SCHEDULED = 'interview_scheduled',
  INTERVIEWED = 'interviewed',
  OFFERED = 'offered',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
  WITHDRAWN = 'withdrawn',
}

export interface JobApplicationProps {
  id: string;
  jobId: string;
  candidateId: string;
  employerId: string;
  status: ApplicationStatus;
  coverLetter?: string;
  resumeUrl?: string;
  portfolioUrl?: string;
  appliedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  interviewDate?: Date;
  offerDetails?: string;
  rejectionReason?: string;
  notes?: string;
}

export class JobApplication {
  public readonly id: string;
  public readonly jobId: string;
  public readonly candidateId: string;
  public readonly employerId: string;
  public readonly status: ApplicationStatus;
  public readonly coverLetter?: string;
  public readonly resumeUrl?: string;
  public readonly portfolioUrl?: string;
  public readonly appliedAt: Date;
  public readonly reviewedAt?: Date;
  public readonly reviewedBy?: string;
  public readonly interviewDate?: Date;
  public readonly offerDetails?: string;
  public readonly rejectionReason?: string;
  public readonly notes?: string;

  constructor(props: JobApplicationProps) {
    this.id = props.id;
    this.jobId = props.jobId;
    this.candidateId = props.candidateId;
    this.employerId = props.employerId;
    this.status = props.status;
    this.coverLetter = props.coverLetter;
    this.resumeUrl = props.resumeUrl;
    this.portfolioUrl = props.portfolioUrl;
    this.appliedAt = props.appliedAt;
    this.reviewedAt = props.reviewedAt;
    this.reviewedBy = props.reviewedBy;
    this.interviewDate = props.interviewDate;
    this.offerDetails = props.offerDetails;
    this.rejectionReason = props.rejectionReason;
    this.notes = props.notes;
  }

  static create(
    props: Omit<JobApplicationProps, 'id' | 'appliedAt' | 'status'>,
  ): JobApplication {
    return new JobApplication({
      ...props,
      id: crypto.randomUUID(),
      appliedAt: new Date(),
      status: ApplicationStatus.SUBMITTED,
    });
  }

  isSubmitted(): boolean {
    return this.status === ApplicationStatus.SUBMITTED;
  }

  isUnderReview(): boolean {
    return this.status === ApplicationStatus.UNDER_REVIEW;
  }

  isShortlisted(): boolean {
    return this.status === ApplicationStatus.SHORTLISTED;
  }

  hasInterview(): boolean {
    return (
      this.status === ApplicationStatus.INTERVIEW_SCHEDULED ||
      this.status === ApplicationStatus.INTERVIEWED
    );
  }

  hasOffer(): boolean {
    return this.status === ApplicationStatus.OFFERED;
  }

  isAccepted(): boolean {
    return this.status === ApplicationStatus.ACCEPTED;
  }

  isRejected(): boolean {
    return this.status === ApplicationStatus.REJECTED;
  }

  isWithdrawn(): boolean {
    return this.status === ApplicationStatus.WITHDRAWN;
  }

  isActive(): boolean {
    return ![
      ApplicationStatus.ACCEPTED,
      ApplicationStatus.REJECTED,
      ApplicationStatus.WITHDRAWN,
    ].includes(this.status);
  }
}
