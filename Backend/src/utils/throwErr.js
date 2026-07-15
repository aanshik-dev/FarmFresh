const throwErr = (code, msg = "Internal Server Error", success = false) => {
  const newErr = new Error(msg);
  newErr.statusCode = code;
  newErr.success = success;
  throw newErr;
};

export default throwErr;
