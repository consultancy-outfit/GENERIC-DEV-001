import { ApiSingleFile } from '@gateway/decorators';

export class ProfileImageDto {
  @ApiSingleFile({ required: false })
  profileImage: any;
}

export class CoverImageDto {
  @ApiSingleFile({ required: false })
  coverImage: any;
}
