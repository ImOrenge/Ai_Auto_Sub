export type Project = {
  id: string;
  userId: string;
  name: string;
  description?: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CreateProjectParams = {
  name: string;
  description?: string;
};

export type UpdateProjectParams = {
  name?: string;
  description?: string;
  isArchived?: boolean;
};
