export function cropRect(
  rect: { x: number; y: number; width: number; height: number }, dpr: number,
) {
  return {
    sx: Math.round(rect.x * dpr), sy: Math.round(rect.y * dpr),
    sw: Math.round(rect.width * dpr), sh: Math.round(rect.height * dpr),
  }
}
