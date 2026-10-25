// Wird beim Bauen festgelegt (VITE_NATIVE=1 für die iPhone-App), damit nicht benötigter Code ganz wegfällt.
export const isNative = import.meta.env.VITE_NATIVE === '1'
