export const stopPostgresContainer = async (container) => {
  if (!container) return { attempted: false, removed: false };

  const containerId = container.getId();
  try {
    await container.stop();
    return { attempted: true, containerId, removed: true };
  } catch (error) {
    return {
      attempted: true,
      containerId,
      removed: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
