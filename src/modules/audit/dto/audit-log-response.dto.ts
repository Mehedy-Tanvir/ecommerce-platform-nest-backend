import { ApiProperty } from '@nestjs/swagger';

export class AuditLogResponseDto {
  @ApiProperty({ description: 'Unique identifier of the audit log entry' })
  id: string;

  @ApiProperty({ description: 'Action performed (e.g. ORDER_CREATED)' })
  action: string;

  @ApiProperty({ description: 'Affected entity type (e.g. order, user)' })
  entity: string;

  @ApiProperty({
    description: 'Identifier of the affected entity',
    nullable: true,
  })
  entityId: string | null;

  @ApiProperty({
    description: 'Identifier of the user who performed the action',
    nullable: true,
  })
  userId: string | null;

  @ApiProperty({
    description: 'Additional metadata for the action',
    nullable: true,
  })
  metadata: Record<string, unknown> | null;

  @ApiProperty({ description: 'IP address of the request', nullable: true })
  ipAddress: string | null;

  @ApiProperty({ description: 'When the action occurred' })
  createdAt: Date;
}
