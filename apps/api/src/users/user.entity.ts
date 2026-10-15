import type { Role } from '@repo/shared';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Always stored in lowercase
  @Column({ type: 'varchar', length: 254, unique: true })
  email: string;

  // argon2id hash; never selected unless asked for explicitly
  @Column({ type: 'varchar', length: 255, select: false })
  passwordHash: string;

  @Column({
    type: 'enum',
    enum: ['admin', 'user'],
    enumName: 'user_role',
    default: 'user',
  })
  role: Role;

  // Inactive users cannot log in or refresh their tokens
  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt: Date;
}
