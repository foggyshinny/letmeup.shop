export function won(n: number): string {
  return n.toLocaleString("ko-KR") + "원";
}

export function classNames(...xs: (string | false | null | undefined)[]): string {
  return xs.filter(Boolean).join(" ");
}
