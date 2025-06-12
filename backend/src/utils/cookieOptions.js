// Cookie options constant for reuse
export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production", // set true in production
  sameSite: "lax",
  maxAge: 24 * 60 * 60 * 1000, // 24 hours
};
