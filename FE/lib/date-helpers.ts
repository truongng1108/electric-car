export function formatDate(dateString: string | undefined): string {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
  } catch {
    return "-"
  }
}

export function formatDateTime(dateString: string | undefined): string {
  if (!dateString) return "-"
  try {
    const date = new Date(dateString)
    if (Number.isNaN(date.getTime())) return "-"
    return date.toLocaleString("vi-VN", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return "-"
  }
}
