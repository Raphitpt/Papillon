import { Auth } from "@/stores/account/types";
import { GesAPI, GesAuthenticationToken } from "ges-api-react-native";

export async function refreshSkolaeAccount(
  accountId: string,
  credentials: Auth
): Promise<{ auth: Auth; session: GesAuthenticationToken }> {
  const additionals = credentials.additionals || {};
  const username = additionals["username"];
  const password = additionals["password"];


  let session: GesAuthenticationToken;
  const authData: Auth = { additionals: {} };
  try {
    session = await GesAPI.login(String(username), String(password));
    authData.additionals!.username = username;
    authData.additionals!.password = password;
  } catch (error) {
    throw new Error(
      `Failed to refresh Skolae session: ${error}`
    );
  }

  return { auth: authData, session };
}