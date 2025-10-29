export enum Role {
  User = 'User',
  Officer = 'Officer',
  Admin = 'Admin',
}

export interface User {
  username: string;
  role: Role;
}

export enum TicketStatus {
  Open = 'Open',
  Scheduled = 'Scheduled',
  InProgress = 'In Progress',
  Completed = 'Completed',
  Closed = 'Closed',
}

export enum TicketPriority {
    Low = 'Low',
    Medium = 'Medium',
    High = 'High',
}

export interface Review {
  attitude: number;
  attitudeComment: string;
  neatness: number;
  neatnessComment: string;
  quality: number;
  qualityComment: string;
  speed: number;
  speedComment: string;
  communication: number;
  communicationComment: string;
  reviewedAt: Date;
}

export interface Attachment {
  id: string;
  name: string;
  url: string;
}

export interface Ticket {
  id: string;
  title: string;
  reporterName: string;
  unit: string;
  category: string;
  subCategory: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  createdAt: Date;
  scheduledAt?: Date | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
  assignedOfficer?: string;
  attachments?: Attachment[];
  review?: Review;
}
