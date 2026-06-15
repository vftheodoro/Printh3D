import { apiSuccess } from "@/lib/api-response";

export async function POST() {
  const response = apiSuccess({ loggedOut: true });
  response.cookies.set({
    name: "admin_token",
    value: "",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    expires: new Date(0),
  });
  return response;
}
