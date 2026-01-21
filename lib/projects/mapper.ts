import { Project } from "./types";

export function mapProject(data: any): Project {
    return {
        id: data.id,
        userId: data.user_id,
        name: data.name,
        description: data.description || null,
        isArchived: data.is_archived || false,
        createdAt: data.created_at,
        updatedAt: data.updated_at || data.created_at,
    };
}
