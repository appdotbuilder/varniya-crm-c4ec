
import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { usersTable } from '../db/schema';
import { getUsers } from '../handlers/get_users';

describe('getUsers', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return all users when no role filter is provided', async () => {
    // Create test users with different roles
    await db.insert(usersTable).values([
      {
        name: 'John Sales',
        email: 'john@example.com',
        role: 'sales'
      },
      {
        name: 'Jane Agent',
        email: 'jane@example.com',
        role: 'sales_agent'
      },
      {
        name: 'Bob Marketing',
        email: 'bob@example.com',
        role: 'marketing'
      }
    ]).execute();

    const result = await getUsers();

    expect(result).toHaveLength(3);
    expect(result.map(u => u.name)).toContain('John Sales');
    expect(result.map(u => u.name)).toContain('Jane Agent');
    expect(result.map(u => u.name)).toContain('Bob Marketing');
  });

  it('should filter users by role when role is provided', async () => {
    // Create test users with different roles
    await db.insert(usersTable).values([
      {
        name: 'John Sales',
        email: 'john@example.com',
        role: 'sales'
      },
      {
        name: 'Jane Agent',
        email: 'jane@example.com',
        role: 'sales_agent'
      },
      {
        name: 'Bob Agent',
        email: 'bob@example.com',
        role: 'sales_agent'
      },
      {
        name: 'Alice Marketing',
        email: 'alice@example.com',
        role: 'marketing'
      }
    ]).execute();

    const result = await getUsers('sales_agent');

    expect(result).toHaveLength(2);
    expect(result.map(u => u.name)).toContain('Jane Agent');
    expect(result.map(u => u.name)).toContain('Bob Agent');
    expect(result.every(u => u.role === 'sales_agent')).toBe(true);
  });

  it('should return empty array when no users match the role filter', async () => {
    // Create test users without operations role
    await db.insert(usersTable).values([
      {
        name: 'John Sales',
        email: 'john@example.com',
        role: 'sales'
      },
      {
        name: 'Jane Agent',
        email: 'jane@example.com',
        role: 'sales_agent'
      }
    ]).execute();

    const result = await getUsers('operations');

    expect(result).toHaveLength(0);
  });

  it('should return user with all expected fields', async () => {
    await db.insert(usersTable).values({
      name: 'Test User',
      email: 'test@example.com',
      role: 'sales',
      active: true
    }).execute();

    const result = await getUsers();

    expect(result).toHaveLength(1);
    const user = result[0];
    expect(user.id).toBeDefined();
    expect(user.name).toBe('Test User');
    expect(user.email).toBe('test@example.com');
    expect(user.role).toBe('sales');
    expect(user.active).toBe(true);
    expect(user.created_at).toBeInstanceOf(Date);
  });

  it('should include inactive users in results', async () => {
    await db.insert(usersTable).values([
      {
        name: 'Active User',
        email: 'active@example.com',
        role: 'sales',
        active: true
      },
      {
        name: 'Inactive User',
        email: 'inactive@example.com',
        role: 'sales',
        active: false
      }
    ]).execute();

    const result = await getUsers('sales');

    expect(result).toHaveLength(2);
    expect(result.map(u => u.name)).toContain('Active User');
    expect(result.map(u => u.name)).toContain('Inactive User');
  });
});
