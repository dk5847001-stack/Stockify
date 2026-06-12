export const sendSuccess = (res, statusCode, payload) => {
  return res.status(statusCode).json({
    success: true,
    ...payload
  });
};
