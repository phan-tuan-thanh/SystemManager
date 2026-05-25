import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@ValidatorConstraint({ name: 'IsValidEnvironment', async: true })
@Injectable()
export class IsValidEnvironmentConstraint implements ValidatorConstraintInterface {
  constructor(private readonly prisma: PrismaService) {}

  async validate(value: any): Promise<boolean> {
    if (typeof value !== 'string' || !value) return false;
    const env = await this.prisma.environmentConfig.findUnique({
      where: { code: value.toUpperCase() },
      select: { is_active: true },
    });
    return !!env && env.is_active;
  }

  defaultMessage(args: ValidationArguments): string {
    return `'${args.value}' is not a valid or active environment code`;
  }
}

export function IsValidEnvironment(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsValidEnvironmentConstraint,
    });
  };
}
