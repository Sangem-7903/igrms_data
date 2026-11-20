// src/setupProxy.js
// The dev server forwards these paths to the two department servers, so the browser only talks to localhost:3000.
// Install once:  npm install http-proxy-middleware
const { createProxyMiddleware } = require("http-proxy-middleware");

console.log("setupProxy.js loaded");

// Keep the full original path (e.g. /SMSService/epds/getOTP) when forwarding.
// Newer versions of http-proxy-middleware strip the mount path, which makes the target answer 404.
const keepFullPath = (path, req) => req.originalUrl || path;

module.exports = function (app) {
  // Grievance APIs: dropdown lists + ComplaintDetails
  app.use(
    "/GrievanceServices",
    createProxyMiddleware({
      target: process.env.GRIEVANCE_TARGET || "http://pdsservices.telangana.gov.in",
      changeOrigin: true,
      pathRewrite: keepFullPath,
      logLevel: "info",
      logger: console,
    })
  );

  // OTP / SMS APIs: getOTP, verifyOTP, sendSMS (private network address: you must be on the department network / VPN)
  app.use(
    "/SMSService",
    createProxyMiddleware({
      target: process.env.SMS_TARGET || "http://10.160.19.152:8088",
      changeOrigin: true,
      pathRewrite: keepFullPath,
      logLevel: "info",
      logger: console,
    })
  );
};
