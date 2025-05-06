import { SetMetadata } from '@nestjs/common';

export const TeamRoles = (...roles: string[]) => SetMetadata('teamRoles', roles);