import { toTitleCase } from '@shared/utils';
import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
  isNotEmpty,
} from 'class-validator';

export enum Comparison {
  EQUAL_TO = 'EQUAL_TO',
  NOT_EQUAL_TO = 'NOT_EQUAL_TO',
  LESSER_THAN = 'LESSER_THAN',
  LESSER_THAN_OR_EQUAL_TO = 'LESSER_THAN_OR_EQUAL_TO',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUAL_TO = 'GREATER_THAN_OR_EQUAL_TO',
}

export function ComparedWith(
  property: string,
  compareFn: Comparison | ((a: any, b: any) => boolean),
  validationOptions?: ValidationOptions
) {
  let validatorFn: (a, b) => boolean;
  switch (compareFn) {
    case Comparison.EQUAL_TO:
      validatorFn = (a, b) => a === b;
      break;
    case Comparison.NOT_EQUAL_TO:
      validatorFn = (a, b) => a !== b;
      break;
    case Comparison.LESSER_THAN:
      validatorFn = (a, b) => a < b;
      break;
    case Comparison.LESSER_THAN_OR_EQUAL_TO:
      validatorFn = (a, b) => a <= b;
      break;
    case Comparison.GREATER_THAN:
      validatorFn = (a, b) => a > b;
      break;
    case Comparison.GREATER_THAN_OR_EQUAL_TO:
      validatorFn = (a, b) => a >= b;
      break;
    default:
      validatorFn = compareFn;
  }
  return function (object: unknown, propertyName: string) {
    let properties: string[];
    let all;
    if (property.includes('||')) {
      all = false;
      properties = property.split('||')?.map((prop) => prop?.trim());
    } else if (property.includes('&&')) {
      all = true;
      properties = property.split('&&')?.map((prop) => prop?.trim());
    }

    registerDecorator({
      name: 'comparedWith',
      target: object.constructor,
      propertyName: propertyName,
      constraints: properties ? [...properties, all] : [property, all],
      options: {
        ...(typeof compareFn == 'string' && {
          message: ({ constraints, property, object }) => {
            let props = constraints
              ?.slice(0, -1)
              ?.filter((prop) => isNotEmpty(object[prop]));
            if (!props.length && constraints?.slice(0, -1)?.length) {
              props = constraints?.slice(0, -1);
            }
            return `${toTitleCase(property)} should be ${compareFn
              .replace(/_/g, ' ')
              .toLowerCase()}${
              props.length
                ? ` ${props
                    ?.map((c) => toTitleCase(c))
                    ?.join(all ? ' and ' : ' or ')}`
                : ''
            }`.replace('be not', 'not be');
          },
        }),
        ...validationOptions,
      },
      validator: {
        validate(value: any, args: ValidationArguments) {
          const properties = args.constraints;
          const propValues = properties?.slice(0, -1).reduce((props, prop) => {
            if (args.object[prop] != null && args.object[prop] != undefined) {
              return [...props, args.object[prop]];
            }
            return props;
          }, []);
          if (properties.at(-1) == undefined) {
            return validatorFn(value, propValues[0]);
          } else if (properties.at(-1) == true) {
            return propValues.every((propVal) => validatorFn(value, propVal));
          } else if (properties.at(-1) == false) {
            return propValues.some((propVal) => validatorFn(value, propVal));
          }
        },
      },
    });
  };
}
