
import { db } from '../db';
import { usersTable } from '../db/schema';
import { type User } from '../schema';
import { eq } from 'drizzle-orm';

export async function getUsers(role?: string): Promise<User[]> {
  try {
    if (role) {
      const results = await db.select()
        .from(usersTable)
        .where(eq(usersTable.role, role as any))
        .execute();
      return results;
    } else {
      const results = await db.select()
        .from(usersTable)
        .execute();
      return results;
    }
  } catch (error) {
    console.error('Failed to fetch users:', error);
    throw error;
  }
}
