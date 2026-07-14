export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;

  const { getGoogleConfigurationStatus } = await import(
    "@/features/mail/server/google/google-config"
  );
  const configuration = getGoogleConfigurationStatus();
  if (!configuration.isValid) {
    console.error(`[Configuration Google Workspace] ${configuration.error}`);
  }
}
