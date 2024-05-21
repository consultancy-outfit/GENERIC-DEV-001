import { Header, applyDecorators } from '@nestjs/common';
import { ApiProduces } from '@nestjs/swagger';
import { FileContentTypes } from '@shared/constants';

export const ApiDownloadFile = (props: {
  fileName: string;
  fileType: FileContentTypes;
}) => {
  return applyDecorators(
    props.fileType
      ? ApiProduces(props.fileType)
      : ApiProduces(...Object.values(FileContentTypes)),
    Header('Content-Type', props.fileType),
    Header('Content-Disposition', `attachment; filename="${props.fileName}"`)
  );
};
