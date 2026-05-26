function formatError<T extends FormatErrorParams>(
  passed: T[],
): FormatErrorOutput {
  return {
    timestamp: new Date().toISOString(),
    errors: passed.map(({ path, message }) => ({
      path,
      message,
      pathString: path.join("."),
    })),
  };
}

type FormatErrorParams = {
  path: PropertyKey[];
  message: string;
};

type FormatErrorOutput = {
  timestamp: string;
  errors: {
    path: PropertyKey[];
    message: string;
    pathString: string;
  }[];
};

export default formatError;
