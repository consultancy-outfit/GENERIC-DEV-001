import { Logger } from '@nestjs/common';

export const exitHandler = (
  server,
  options = { coredump: false, timeout: 500 }
) => {
  const exit = (code) => {
    options.coredump ? process.abort() : process.exit(code);
  };

  return (code: number, reason: string) => (err: Error) => {
    if (err && code) {
      const processLogger = new Logger('GatewayAfterException');
      processLogger.error(reason + ': ' + err.message);
    } else {
      server.close(exit);
      setTimeout(exit, options.timeout).unref();
    }
  };
};
