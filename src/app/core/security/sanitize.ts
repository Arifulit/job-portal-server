import xss from "xss-clean";
import mongoSanitize from "express-mongo-sanitize";

// Combined middleware
export const sanitizeMiddleware = [
  mongoSanitize(),  // Prevent NoSQL injection
  xss()             // Prevent XSS attacks
];
