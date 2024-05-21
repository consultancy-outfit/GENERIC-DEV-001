import { applyDecorators, SetMetadata, UseInterceptors } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import {
  AnyFilesInterceptor,
  FileFieldsInterceptor,
  FileInterceptor,
} from '@nestjs/platform-express';
import { ApiConsumes } from '@nestjs/swagger';
import { InvalidFileFormatException } from '../exceptions/invalid-file-format.exception';
import { FileExtender } from '../interceptors/file-extender.interceptor';
/**
 * @description ApiFormData specifies Content-Type as 'multipart/form-data'
 */
export const ApiFormData = ({
  single,
  fieldName,
  fieldNames,
  multiple,
  maxCount = 10,
  fileType,
  fileTypes,
  errorMessage,
  required,
}: {
  single?: boolean;
  fieldName?: string;
  fieldNames?: string[];
  multiple?: boolean;
  maxCount?: number;
  fileType?: string;
  fileTypes?: string[];
  errorMessage?: string;
  required?: boolean;
}) => {
  // let fields;

  if (single && fieldName) {
    return applyDecorators(
      ApiConsumes('multipart/form-data'),
      SetMetadata('isExtended', true),
      SetMetadata('isRequired', required),
      SetMetadata('isSingle', true),
      SetMetadata('fieldName', fieldName),
      UseInterceptors(
        FileInterceptor(fieldName, {
          fileFilter(req, file, callback) {
            if (
              (required === false && !file) ||
              !(
                file.mimetype.match(
                  RegExp(`(${fileType || fileTypes?.join('|')})`, 'i')
                ) ||
                file?.originalname
                  ?.split('.')?.[1]
                  ?.match(RegExp(`(${fileType || fileTypes?.join('|')})`, 'i'))
              )
            ) {
              const message =
                errorMessage == null || errorMessage == ''
                  ? 'Invalid file format provided'
                  : errorMessage;
              callback(new InvalidFileFormatException(message), false);
            }
            callback(null, true);
          },
        }),
        new FileExtender(new Reflector())
      )
    );
  } else if (single && fieldNames) {
    return applyDecorators(
      ApiConsumes('multipart/form-data'),
      SetMetadata('isExtended', true),
      SetMetadata('isRequired', required),
      SetMetadata('isSingle', true),
      SetMetadata('fieldNames', fieldNames),
      UseInterceptors(
        FileFieldsInterceptor(
          fieldNames.map((fieldName) => ({ name: fieldName, maxCount: 1 })),
          {
            fileFilter(req, file, callback) {
              if (
                (required === false && !file) ||
                !(
                  file.mimetype.match(
                    RegExp(`(${fileType || fileTypes?.join('|')})`, 'i')
                  ) ||
                  file?.originalname
                    ?.split('.')?.[1]
                    ?.match(
                      RegExp(`(${fileType || fileTypes?.join('|')})`, 'i')
                    )
                )
              ) {
                const message =
                  errorMessage == null || errorMessage == ''
                    ? 'Invalid file format provided'
                    : errorMessage;
                callback(new InvalidFileFormatException(message), false);
              }
              callback(null, true);
            },
          }
        ),
        new FileExtender(new Reflector())
      )
    );
  } else if (multiple && fieldName) {
    return applyDecorators(
      ApiConsumes('multipart/form-data'),
      SetMetadata('isExtended', true),
      SetMetadata('isRequired', required),
      SetMetadata('isMultiple', true),
      SetMetadata('fieldName', fieldName),
      UseInterceptors(
        FileFieldsInterceptor([{ name: fieldName, maxCount: maxCount }], {
          fileFilter(req, file, callback) {
            if (
              !(
                (required === false && !file) ||
                file.mimetype.match(
                  RegExp(`(${fileType || fileTypes?.join('|')})`, 'i')
                ) ||
                file?.originalname
                  ?.split('.')?.[1]
                  ?.match(RegExp(`(${fileType || fileTypes?.join('|')})`, 'i'))
              )
            ) {
              callback(new InvalidFileFormatException(errorMessage), false);
            }
            callback(null, true);
          },
        }),
        new FileExtender(new Reflector())
      )
    );
  } else if (multiple && fieldNames) {
    return applyDecorators(
      ApiConsumes('multipart/form-data'),
      SetMetadata('isExtended', true),
      SetMetadata('isRequired', required),
      SetMetadata('isMultiple', true),
      SetMetadata('fieldNames', fieldNames),
      UseInterceptors(
        FileFieldsInterceptor(
          fieldNames.map((fieldName) => ({
            name: fieldName,
            maxCount: maxCount,
          })),
          {
            fileFilter(req, file, callback) {
              if (
                !(
                  (required === false && !file) ||
                  file.mimetype.match(
                    RegExp(`(${fileType || fileTypes?.join('|')})`, 'i')
                  )
                )
              ) {
                callback(new InvalidFileFormatException(errorMessage), false);
              }
              callback(null, true);
            },
          }
        ),
        new FileExtender(new Reflector())
      )
    );
  } else {
    return applyDecorators(
      ApiConsumes('multipart/form-data'),
      SetMetadata('isExtended', true),
      SetMetadata('isRequired', required),
      UseInterceptors(
        AnyFilesInterceptor({
          fileFilter(req, file, callback) {
            if (
              !(
                (required === false && !file) ||
                file.mimetype.match(
                  RegExp(`(${fileType || fileTypes?.join('|')})`, 'i')
                )
              )
            ) {
              callback(new InvalidFileFormatException(errorMessage), false);
            }
            callback(null, true);
          },
        }),
        new FileExtender(new Reflector())
      )
    );
  }
};
