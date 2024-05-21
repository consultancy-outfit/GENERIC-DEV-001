export const transformValue = function (doc, ret: { [key: string]: any }) {
  delete ret._id;
};
